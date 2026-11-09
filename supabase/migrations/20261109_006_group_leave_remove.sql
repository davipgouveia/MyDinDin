begin;

-- profiles.group_id nasceu NOT NULL na migration 001, mas o app ja trata
-- "perfil sem grupo" (tela Configurar grupo). Relaxa a coluna para a
-- semantica de sair/remover funcionar: sem grupo = group_id nulo.
alter table public.profiles alter column group_id drop not null;

-- Sair do grupo / remover membro (lote 2026-11-09, item 6).
-- Pertencer a um grupo = profiles.group_id preenchido; sair = limpar o
-- group_id. Os lancamentos da pessoa CONTINUAM no grupo antigo (sao do
-- grupo, nao somem). Se o owner sai e restam membros, o membro mais
-- antigo do grupo vira owner; se nao resta ninguem, o grupo fica vazio.

create or replace function public.leave_group()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_group_id uuid;
  v_role text;
  v_next_owner uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Usuario nao autenticado';
  end if;

  select group_id, role
  into v_group_id, v_role
  from public.profiles
  where id = v_uid;

  if v_group_id is null then
    raise exception 'Voce nao esta em nenhum grupo';
  end if;

  if v_role = 'owner' then
    select id
    into v_next_owner
    from public.profiles
    where group_id = v_group_id
      and id <> v_uid
    order by created_at asc
    limit 1;

    if v_next_owner is not null then
      update public.profiles
      set role = 'owner', updated_at = timezone('utc', now())
      where id = v_next_owner;
    end if;
  end if;

  update public.profiles
  set group_id = null, role = 'member', updated_at = timezone('utc', now())
  where id = v_uid;
end;
$$;

revoke all on function public.leave_group() from public;
grant execute on function public.leave_group() to authenticated;

create or replace function public.remove_group_member(p_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_group_id uuid;
  v_target_group_id uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if p_profile_id = v_uid then
    raise exception 'Para sair voce mesmo, use a opcao Sair do grupo';
  end if;

  select group_id
  into v_group_id
  from public.profiles
  where id = v_uid;

  if v_group_id is null or not public.is_group_owner(v_group_id) then
    raise exception 'Apenas o owner pode remover membros';
  end if;

  select group_id
  into v_target_group_id
  from public.profiles
  where id = p_profile_id;

  if v_target_group_id is null or v_target_group_id <> v_group_id then
    raise exception 'Membro nao encontrado neste grupo';
  end if;

  update public.profiles
  set group_id = null, role = 'member', updated_at = timezone('utc', now())
  where id = p_profile_id;
end;
$$;

revoke all on function public.remove_group_member(uuid) from public;
grant execute on function public.remove_group_member(uuid) to authenticated;

commit;
