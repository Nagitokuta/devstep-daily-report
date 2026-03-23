-- Fix RLS recursion on public.team_members
-- "infinite recursion detected in policy for relation team_members"

create or replace function public.is_member_of_team(p_team_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = p_team_id
      and tm.user_id = p_user_id
  );
$$;

revoke all on function public.is_member_of_team(uuid, uuid) from public;
grant execute on function public.is_member_of_team(uuid, uuid) to authenticated;

-- Allow global reports from users without team membership.
alter table public.daily_reports
  alter column team_id drop not null;

drop policy if exists "team_members_select" on public.team_members;
create policy "team_members_select"
on public.team_members for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_member_of_team(team_id, auth.uid())
);

drop policy if exists "teams_select_member" on public.teams;
create policy "teams_select_member"
on public.teams for select
to authenticated
using (
  public.is_member_of_team(id, auth.uid())
);

drop policy if exists "dr_select" on public.daily_reports;
create policy "dr_select"
on public.daily_reports for select
to authenticated
using (
  visibility = 'global'
  or public.is_member_of_team(team_id, auth.uid())
);

drop policy if exists "dr_insert" on public.daily_reports;
create policy "dr_insert"
on public.daily_reports for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    visibility = 'global'
    or public.is_member_of_team(team_id, auth.uid())
  )
);

drop policy if exists "comments_select" on public.comments;
create policy "comments_select"
on public.comments for select
to authenticated
using (
  exists (
    select 1
    from public.daily_reports dr
    where dr.id = comments.report_id
      and (
        dr.visibility = 'global'
        or public.is_member_of_team(dr.team_id, auth.uid())
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
    select 1
    from public.daily_reports dr
    where dr.id = comments.report_id
      and (
        dr.visibility = 'global'
        or public.is_member_of_team(dr.team_id, auth.uid())
      )
  )
);
