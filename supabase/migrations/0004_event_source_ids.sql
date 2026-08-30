begin;

-- Keep imports idempotent without exposing source-specific identifiers as the
-- primary key used by the application.
alter table public.events
  add column if not exists source_event_id text;

create unique index if not exists events_match_source_event_id_idx
  on public.events (match_id, source_event_id)
  where source_event_id is not null;

-- This is a single-team application, so a shirt number identifies one player
-- for player upserts across match imports.
create unique index if not exists players_shirt_number_idx
  on public.players (shirt_number)
  where shirt_number is not null;

commit;
