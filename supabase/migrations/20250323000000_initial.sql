-- Daily Report: schema + RLS (run in Supabase SQL Editor or via CLI)

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- public.users (profile; email lives in auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name varchar(50) not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 50)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.sync_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tr_users_updated_at on public.users;
create trigger tr_users_updated_at
before update on public.users
for each row execute function public.sync_updated_at();

alter table public.users enable row level security;

drop policy if exists "users_select_auth" on public.users;
create policy "users_select_auth"
on public.users for select
to authenticated
using (true);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
on public.users for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- teams / team_members
-- ---------------------------------------------------------------------------
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  project_name varchar(80) not null,
  team_code varchar(20) not null unique,
  members_num integer not null default 0,
  created_at timestamptz not null default now(),
  constraint teams_project_name_len check (char_length(trim(project_name)) >= 1),
  constraint teams_code_format check (team_code ~ '^[A-Z0-9]+$')
);

create index if not exists idx_teams_team_code on public.teams (team_code);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create index if not exists idx_team_members_team on public.team_members (team_id);
create index if not exists idx_team_members_user on public.team_members (user_id);

create or replace function public.sync_team_members_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.teams set members_num = members_num + 1 where id = new.team_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.teams set members_num = greatest(members_num - 1, 0) where id = old.team_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists tr_team_members_count on public.team_members;
create trigger tr_team_members_count
after insert or delete on public.team_members
for each row execute function public.sync_team_members_count();

alter table public.teams enable row level security;
alter table public.team_members enable row level security;

drop policy if exists "teams_select_member" on public.teams;
create policy "teams_select_member"
on public.teams for select
to authenticated
using (
  exists (
    select 1 from public.team_members tm
    where tm.team_id = teams.id
      and tm.user_id = auth.uid()
  )
);

drop policy if exists "team_members_select" on public.team_members;
create policy "team_members_select"
on public.team_members for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.team_members tm
    where tm.team_id = team_members.team_id
      and tm.user_id = auth.uid()
  )
);

-- RPC: create team + add creator as member (bypasses direct INSERT on teams)
create or replace function public.generate_team_code()
returns text
language plpgsql
as $$
declare
  chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..8 loop
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.create_team(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_code text;
  attempts int := 0;
  trimmed text := trim(p_name);
begin
  if length(trimmed) < 1 or length(trimmed) > 80 then
    raise exception 'invalid team name';
  end if;
  loop
    v_code := public.generate_team_code();
    begin
      insert into public.teams (project_name, team_code)
      values (trimmed, v_code)
      returning id into v_id;
      exit;
    exception
      when unique_violation then
        attempts := attempts + 1;
        if attempts > 20 then
          raise exception 'could not allocate team code';
        end if;
    end;
  end loop;

  insert into public.team_members (team_id, user_id)
  values (v_id, auth.uid());
  return v_id;
end;
$$;

grant execute on function public.create_team(text) to authenticated;

create or replace function public.join_team(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team uuid;
  v_norm text := upper(trim(p_code));
begin
  if v_norm is null or length(v_norm) < 1 or length(v_norm) > 20 then
    raise exception 'invalid code';
  end if;
  select id into v_team from public.teams where team_code = v_norm;
  if v_team is null then
    raise exception 'team not found';
  end if;
  insert into public.team_members (team_id, user_id)
  values (v_team, auth.uid())
  on conflict (team_id, user_id) do nothing;
  return v_team;
end;
$$;

grant execute on function public.join_team(text) to authenticated;

-- ---------------------------------------------------------------------------
-- daily_reports
-- ---------------------------------------------------------------------------
create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete restrict,
  user_id uuid not null references public.users (id) on delete restrict,
  title varchar(50) not null,
  report_date date not null,
  category varchar(20) not null,
  visibility varchar(20) not null default 'global',
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dr_title_len check (char_length(trim(title)) between 1 and 50),
  constraint dr_content_len check (char_length(content) between 1 and 2000),
  constraint dr_category check (category in ('development', 'meeting', 'other')),
  constraint dr_visibility check (visibility in ('team', 'global'))
);

create index if not exists idx_dr_team_created on public.daily_reports (team_id, created_at desc);
create index if not exists idx_dr_visibility on public.daily_reports (visibility, created_at desc);

drop trigger if exists tr_dr_updated_at on public.daily_reports;
create trigger tr_dr_updated_at
before update on public.daily_reports
for each row execute function public.sync_updated_at();

alter table public.daily_reports enable row level security;

drop policy if exists "dr_select" on public.daily_reports;
create policy "dr_select"
on public.daily_reports for select
to authenticated
using (
  visibility = 'global'
  or exists (
    select 1 from public.team_members tm
    where tm.team_id = daily_reports.team_id
      and tm.user_id = auth.uid()
  )
);

drop policy if exists "dr_insert" on public.daily_reports;
create policy "dr_insert"
on public.daily_reports for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.team_members tm
    where tm.team_id = daily_reports.team_id
      and tm.user_id = auth.uid()
  )
);

drop policy if exists "dr_update_own" on public.daily_reports;
create policy "dr_update_own"
on public.daily_reports for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "dr_delete_own" on public.daily_reports;
create policy "dr_delete_own"
on public.daily_reports for delete
to authenticated
using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- comments
-- ---------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.daily_reports (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete restrict,
  content text not null,
  created_at timestamptz not null default now(),
  constraint comments_len check (char_length(content) between 1 and 500)
);

create index if not exists idx_comments_report on public.comments (report_id, created_at);

alter table public.comments enable row level security;

drop policy if exists "comments_select" on public.comments;
create policy "comments_select"
on public.comments for select
to authenticated
using (
  exists (
    select 1 from public.daily_reports dr
    where dr.id = comments.report_id
      and (
        dr.visibility = 'global'
        or exists (
          select 1 from public.team_members tm
          where tm.team_id = dr.team_id
            and tm.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "comments_insert" on public.comments;
create policy "comments_insert"
on public.comments for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.daily_reports dr
    where dr.id = comments.report_id
      and (
        dr.visibility = 'global'
        or exists (
          select 1 from public.team_members tm
          where tm.team_id = dr.team_id
            and tm.user_id = auth.uid()
        )
      )
  )
);

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
on public.comments for delete
to authenticated
using (user_id = auth.uid());
