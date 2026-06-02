-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists questions (
  id             uuid primary key default gen_random_uuid(),
  question       text not null,
  options        jsonb not null,          -- string[]  (4 elements)
  correct_answer text not null,
  category       text not null default 'general',
  difficulty     text not null default 'medium', -- 'easy' | 'medium' | 'hard'
  source         text not null default 'ai',     -- 'ai' | 'user'
  status         text not null default 'approved', -- 'approved' | 'pending' | 'rejected'
  review_note    text,
  created_at     timestamptz default now()
);

create index if not exists questions_status_idx on questions(status);
create index if not exists questions_category_idx on questions(category);

-- Allow anonymous reads of approved questions (used by the game)
alter table questions enable row level security;

create policy "Public can read approved questions"
  on questions for select
  using (status = 'approved');

-- Service role key (used in API routes) can do everything — no extra policy needed.
