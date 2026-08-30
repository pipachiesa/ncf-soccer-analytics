begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'viewer'
    check (role in ('admin', 'importer', 'viewer')),
  created_at timestamptz default now()
);

create table public.players (
  player_id bigserial primary key,
  first_name text,
  last_name text,
  position text,
  shirt_number int,
  created_at timestamptz default now()
);

create table public.matches (
  match_id bigserial primary key,
  date date,
  kickoff_time time,
  opponent text,
  home_away text check (home_away in ('home', 'away')),
  competition text,
  venue text,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'played')),
  score_for int,
  score_against int,
  google_calendar_uid text unique,
  created_at timestamptz default now()
);

create table public.events (
  id bigserial primary key,
  match_id bigint references public.matches(match_id) on delete cascade,
  player_id bigint references public.players(player_id),
  event_type text,
  outcome text,
  start_x real,
  start_y real,
  end_x real,
  end_y real,
  recipient_player_id bigint references public.players(player_id),
  minute int,
  second int,
  xg real,
  progressive boolean default false,
  zone_3x3 text,
  pitch_zone text,
  body_part text,
  created_at timestamptz default now()
);

comment on column public.events.start_x is
  'Normalized pitch coordinate from 0 to 100 along the pitch length.';
comment on column public.events.end_x is
  'Normalized pitch coordinate from 0 to 100 along the pitch length.';
comment on column public.events.start_y is
  'Normalized pitch coordinate from 0 to 100 across the pitch width.';
comment on column public.events.end_y is
  'Normalized pitch coordinate from 0 to 100 across the pitch width.';

create index events_match_id_idx on public.events(match_id);
create index events_player_id_idx on public.events(player_id);

create table public.match_lineups (
  id bigserial primary key,
  match_id bigint references public.matches(match_id) on delete cascade,
  player_id bigint references public.players(player_id),
  position_id text,
  is_starter boolean default true,
  minutes_played int
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select role
  from public.profiles
  where id = (select auth.uid());
$$;

-- A user may edit their own profile, but only an admin may change roles.
-- SQL-editor operations run without an authenticated user and remain available
-- for the initial manual promotion described below.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
    and (select auth.uid()) is not null
    and coalesce(public.current_user_role(), 'viewer') <> 'admin'
  then
    raise exception 'Only an admin may change profile roles';
  end if;

  return new;
end;
$$;

create trigger protect_profile_role_before_update
  before update of role on public.profiles
  for each row execute function public.protect_profile_role();

alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.events enable row level security;
alter table public.match_lineups enable row level security;

create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Admins can view all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.current_user_role() = 'admin');

create policy "Admins can update all profiles"
  on public.profiles
  for update
  to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy "Authenticated users can view players"
  on public.players
  for select
  to authenticated
  using (true);

create policy "Admins and importers can insert players"
  on public.players
  for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'importer'));

create policy "Admins and importers can update players"
  on public.players
  for update
  to authenticated
  using (public.current_user_role() in ('admin', 'importer'))
  with check (public.current_user_role() in ('admin', 'importer'));

create policy "Admins and importers can delete players"
  on public.players
  for delete
  to authenticated
  using (public.current_user_role() in ('admin', 'importer'));

create policy "Authenticated users can view matches"
  on public.matches
  for select
  to authenticated
  using (true);

create policy "Admins and importers can insert matches"
  on public.matches
  for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'importer'));

create policy "Admins and importers can update matches"
  on public.matches
  for update
  to authenticated
  using (public.current_user_role() in ('admin', 'importer'))
  with check (public.current_user_role() in ('admin', 'importer'));

create policy "Admins and importers can delete matches"
  on public.matches
  for delete
  to authenticated
  using (public.current_user_role() in ('admin', 'importer'));

create policy "Authenticated users can view events"
  on public.events
  for select
  to authenticated
  using (true);

create policy "Admins and importers can insert events"
  on public.events
  for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'importer'));

create policy "Admins and importers can update events"
  on public.events
  for update
  to authenticated
  using (public.current_user_role() in ('admin', 'importer'))
  with check (public.current_user_role() in ('admin', 'importer'));

create policy "Admins and importers can delete events"
  on public.events
  for delete
  to authenticated
  using (public.current_user_role() in ('admin', 'importer'));

create policy "Authenticated users can view match lineups"
  on public.match_lineups
  for select
  to authenticated
  using (true);

create policy "Admins and importers can insert match lineups"
  on public.match_lineups
  for insert
  to authenticated
  with check (public.current_user_role() in ('admin', 'importer'));

create policy "Admins and importers can update match lineups"
  on public.match_lineups
  for update
  to authenticated
  using (public.current_user_role() in ('admin', 'importer'))
  with check (public.current_user_role() in ('admin', 'importer'));

create policy "Admins and importers can delete match lineups"
  on public.match_lineups
  for delete
  to authenticated
  using (public.current_user_role() in ('admin', 'importer'));

-- After your first login, promote your account manually in the SQL editor:
-- update public.profiles set role = 'admin' where id = '<auth-user-uuid>'::uuid;

commit;
