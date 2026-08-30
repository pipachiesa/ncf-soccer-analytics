begin;

alter table public.matches
  drop constraint if exists matches_status_check;

alter table public.matches
  add constraint matches_status_check
  check (status in ('upcoming', 'played', 'postponed', 'cancelled'));

commit;
