begin;

create table if not exists public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  invitee_email text not null,
  invited_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_group_invites_group_id on public.group_invites(group_id);
create index if not exists idx_group_invites_email on public.group_invites(lower(invitee_email));
create unique index if not exists uq_group_invites_pending_email
  on public.group_invites(group_id, lower(invitee_email))
  where status = 'pending';

alter table public.group_invites enable row level security;
alter table public.group_invites force row level security;

create or replace function public.is_group_owner(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.group_id = p_group_id
      and p.role = 'owner'
  );
$$;

revoke all on function public.is_group_owner(uuid) from public;
grant execute on function public.is_group_owner(uuid) to authenticated;

create or replace function public.create_group_invite(
  p_group_id uuid,
  p_invitee_email text,
  p_expires_in_days int default 7
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_email text;
  v_invite_id uuid;
  v_expiration timestamptz;
begin
  v_uid := auth.uid();
  v_email := lower(trim(coalesce(p_invitee_email, '')));

  if v_uid is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if not public.is_group_owner(p_group_id) then
    raise exception 'Apenas owner pode enviar convites';
  end if;

  if v_email = '' then
    raise exception 'Email de convite invalido';
  end if;

  if p_expires_in_days is null or p_expires_in_days < 1 then
    p_expires_in_days := 7;
  end if;

  v_expiration := timezone('utc', now()) + make_interval(days => least(p_expires_in_days, 60));

  update public.group_invites
  set status = 'revoked'
  where group_id = p_group_id
    and lower(invitee_email) = v_email
    and status = 'pending';

  insert into public.group_invites (group_id, invitee_email, invited_by, expires_at)
  values (p_group_id, v_email, v_uid, v_expiration)
  returning id into v_invite_id;

  return v_invite_id;
end;
$$;

revoke all on function public.create_group_invite(uuid, text, int) from public;
grant execute on function public.create_group_invite(uuid, text, int) to authenticated;

create or replace function public.revoke_group_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select gi.group_id
  into v_group_id
  from public.group_invites gi
  where gi.id = p_invite_id
  limit 1;

  if v_group_id is null then
    raise exception 'Convite nao encontrado';
  end if;

  if not public.is_group_owner(v_group_id) then
    raise exception 'Apenas owner pode revogar convites';
  end if;

  update public.group_invites
  set status = 'revoked'
  where id = p_invite_id
    and status = 'pending';
end;
$$;

revoke all on function public.revoke_group_invite(uuid) from public;
grant execute on function public.revoke_group_invite(uuid) to authenticated;

create or replace function public.list_my_pending_group_invites()
returns table (
  invite_id uuid,
  group_id uuid,
  group_name text,
  invitee_email text,
  created_at timestamptz,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
begin
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  if auth.uid() is null then
    raise exception 'Usuario nao autenticado';
  end if;

  return query
  select
    gi.id as invite_id,
    gi.group_id,
    fg.name as group_name,
    gi.invitee_email,
    gi.created_at,
    gi.expires_at
  from public.group_invites gi
  join public.family_groups fg on fg.id = gi.group_id
  where gi.status = 'pending'
    and lower(gi.invitee_email) = v_email
    and (gi.expires_at is null or gi.expires_at > timezone('utc', now()))
  order by gi.created_at desc;
end;
$$;

revoke all on function public.list_my_pending_group_invites() from public;
grant execute on function public.list_my_pending_group_invites() to authenticated;

create or replace function public.accept_group_invite(
  p_invite_id uuid,
  p_full_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_email text;
  v_group_id uuid;
  v_clean_name text;
begin
  v_uid := auth.uid();
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_clean_name := nullif(trim(coalesce(p_full_name, '')), '');

  if v_uid is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select gi.group_id
  into v_group_id
  from public.group_invites gi
  where gi.id = p_invite_id
    and gi.status = 'pending'
    and lower(gi.invitee_email) = v_email
    and (gi.expires_at is null or gi.expires_at > timezone('utc', now()))
  limit 1;

  if v_group_id is null then
    raise exception 'Convite invalido, expirado ou nao pertence ao seu email';
  end if;

  if exists (select 1 from public.profiles p where p.id = v_uid) then
    update public.profiles
    set
      group_id = v_group_id,
      full_name = coalesce(v_clean_name, full_name),
      role = 'member',
      updated_at = timezone('utc', now())
    where id = v_uid;
  else
    insert into public.profiles (id, group_id, full_name, role)
    values (v_uid, v_group_id, v_clean_name, 'member');
  end if;

  update public.group_invites
  set status = 'accepted', accepted_at = timezone('utc', now())
  where id = p_invite_id;

  return v_group_id;
end;
$$;

revoke all on function public.accept_group_invite(uuid, text) from public;
grant execute on function public.accept_group_invite(uuid, text) to authenticated;

drop policy if exists group_invites_owner_or_invitee_select on public.group_invites;
create policy group_invites_owner_or_invitee_select
on public.group_invites
for select
to authenticated
using (
  public.is_group_owner(group_id)
  or lower(invitee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

drop policy if exists group_invites_owner_insert on public.group_invites;
create policy group_invites_owner_insert
on public.group_invites
for insert
to authenticated
with check (public.is_group_owner(group_id));

drop policy if exists group_invites_owner_update on public.group_invites;
create policy group_invites_owner_update
on public.group_invites
for update
to authenticated
using (public.is_group_owner(group_id))
with check (public.is_group_owner(group_id));

commit;
