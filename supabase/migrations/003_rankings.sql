-- Global rankings — replaces localStorage with a real persistent leaderboard.
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query).

create table if not exists rankings (
  id               uuid        primary key default gen_random_uuid(),
  player_id        text,                                         -- stable browser UUID (for "yours" highlight)
  name             text        not null,
  avatar           text        not null default '🧠',
  score            int         not null,
  total_questions  int         not null,
  percentage       int         not null,
  streak           int         not null default 0,
  duration         int         not null default 0,              -- seconds
  date             timestamptz not null default now()
);

create index if not exists rankings_score_idx on rankings(score desc);
create index if not exists rankings_date_idx  on rankings(date  desc);

-- Anyone can read the leaderboard.
alter table rankings enable row level security;

drop policy if exists "Public can read rankings" on rankings;
create policy "Public can read rankings"
  on rankings for select using (true);

-- No INSERT/UPDATE/DELETE policy for anon: all writes go through
-- the service-role key in /api/rankings/save, so scores can't be forged
-- directly via the Supabase REST API.
