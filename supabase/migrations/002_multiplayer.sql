-- Multiplayer 1v1 — run in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Real-time head-to-head matches. The server (API routes, service-role key) is the
-- single source of truth for scoring; clients only read state and submit answers.

-- ── Match (the "room"/"session") ───────────────────────────────────────────
create table if not exists match (
  id               uuid primary key default gen_random_uuid(),
  status           text not null default 'waiting',  -- 'waiting' | 'playing' | 'finished' | 'cancelled'
  questions        jsonb not null,                   -- frozen set WITHOUT correct answers (anti-cheat)
  total_rounds     int  not null default 10,
  current_round    int  not null default 0,          -- 0-based index of the live round
  round_started_at timestamptz,
  round_deadline   timestamptz,
  -- Host (player 1, creates the room)
  host_id          text not null,
  host_name        text not null,
  host_avatar      text not null default '🧠',
  host_score       int  not null default 0,
  -- Guest (player 2, joins via link)
  guest_id         text,
  guest_name       text,
  guest_avatar     text,
  guest_score      int  not null default 0,
  -- Result of the round that just resolved (drives the synced reveal on both clients)
  last_round       jsonb,                            -- { round, correctAnswer, host:{...}, guest:{...}, winner }
  winner           text,                             -- 'host' | 'guest' | 'tie'
  rematch_id       uuid,                             -- id of the follow-up match, if a rematch was started
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists match_status_idx  on match(status);
create index if not exists match_created_idx  on match(created_at);

-- ── Match answers (one row per player per round; used to resolve the round) ──
create table if not exists match_answer (
  id         uuid primary key default gen_random_uuid(),
  match_id   uuid not null references match(id) on delete cascade,
  round      int  not null,
  player_id  text not null,
  role       text not null,                          -- 'host' | 'guest'
  selected   text not null default '',               -- '' means timed out / no answer
  correct    boolean not null default false,
  time_ms    int  not null,                          -- server-measured, anti-cheat
  created_at timestamptz not null default now(),
  unique (match_id, round, player_id)
);

create index if not exists match_answer_round_idx on match_answer(match_id, round);

-- ── Match key (server-only: the correct answers for the frozen question set) ──
-- RLS is enabled with NO policies → clients can never read this. Only the
-- service-role key (API routes) can, so correct answers never leak to the browser.
create table if not exists match_key (
  match_id uuid primary key references match(id) on delete cascade,
  answers  jsonb not null                            -- string[] aligned with match.questions order
);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table match        enable row level security;
alter table match_answer enable row level security;
alter table match_key    enable row level security;

-- Public (anon) can READ match + answers so both browsers can sync via Realtime.
drop policy if exists "Public can read matches"       on match;
drop policy if exists "Public can read match answers" on match_answer;

create policy "Public can read matches"
  on match for select using (true);

create policy "Public can read match answers"
  on match_answer for select using (true);

-- No INSERT/UPDATE/DELETE policies for anon: all writes go through the
-- service-role key in API routes, which bypasses RLS. match_key has no policy
-- at all, so it is completely invisible to the browser.

-- ── Realtime ────────────────────────────────────────────────────────────────
-- Stream row changes to subscribed clients. (Safe to run repeatedly.)
do $$
begin
  begin
    alter publication supabase_realtime add table match;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table match_answer;
  exception when duplicate_object then null;
  end;
end $$;
