begin;

-- RLS policies decide which rows an authenticated user may access, while
-- PostgreSQL grants decide whether the role may access the table at all.
grant select, update on table public.profiles to authenticated;

grant select, insert, update, delete on table
  public.players,
  public.matches,
  public.events,
  public.match_lineups
to authenticated;

grant usage, select on all sequences in schema public to authenticated;

-- Server-side administrative clients still need the underlying table and
-- sequence privileges even though the service role bypasses RLS.
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

commit;
