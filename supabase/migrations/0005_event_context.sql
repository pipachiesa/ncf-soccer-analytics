begin;

-- Preserve useful context present in the match-tracking export.
alter table public.events
  add column if not exists period text,
  add column if not exists phase text,
  add column if not exists set_piece text,
  add column if not exists distance_m real,
  add column if not exists goal_x real,
  add column if not exists goal_y real;

commit;
