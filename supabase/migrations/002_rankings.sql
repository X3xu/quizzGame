-- Global rankings table — one row per completed game

create table if not exists rankings (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  avatar         text not null default '🧠',
  score          integer not null default 0,
  total_questions integer not null default 15,
  percentage     integer not null default 0,   -- 0-100
  streak         integer not null default 0,
  duration       integer not null default 0,   -- seconds
  created_at     timestamptz default now()
);

-- Index for leaderboard queries (top scores first)
create index if not exists rankings_score_idx on rankings(score desc);
create index if not exists rankings_created_at_idx on rankings(created_at desc);

-- RLS: anyone can read, anyone can insert (no auth required for the game)
alter table rankings enable row level security;

create policy "Public can read rankings"
  on rankings for select
  using (true);

create policy "Public can insert rankings"
  on rankings for insert
  with check (
    length(trim(name)) > 0
    and length(name) <= 20
    and score >= 0
    and score <= 30
    and percentage between 0 and 100
  );
