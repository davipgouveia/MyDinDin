-- FinançasAPP v2.0 Enterprise Edition
-- Supabase / PostgreSQL migration
-- Objetivo: multi-tenancy por grupo familiar com RLS estrita.

begin;

-- Extensoes uteis
create extension if not exists pgcrypto;

-- Funcao util para updated_at
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Grupo familiar (tenant)
create table if not exists public.family_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_family_groups_updated_at
before update on public.family_groups
for each row execute function public.set_updated_at();

-- Perfis vinculados ao usuario do Auth e a um grupo familiar
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  group_id uuid not null references public.family_groups(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_profiles_group_id on public.profiles(group_id);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Categorias por grupo
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint uq_categories_group_name unique (group_id, name)
);

create index if not exists idx_categories_group_id on public.categories(group_id);

create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

-- Transacoes financeiras
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  category_id uuid references public.categories(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  transaction_date date not null,
  note text,
  source text default 'manual',
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_transactions_group_date on public.transactions(group_id, transaction_date desc);
create index if not exists idx_transactions_profile_id on public.transactions(profile_id);
create index if not exists idx_transactions_category_id on public.transactions(category_id);

create trigger trg_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

-- Orcamentos por categoria e mes
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  month_start date not null,
  limit_amount numeric(14,2) not null check (limit_amount > 0),
  alert_threshold_percent int not null default 80 check (alert_threshold_percent between 1 and 100),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint uq_budget_category_month unique (group_id, category_id, month_start)
);

create index if not exists idx_budgets_group_month on public.budgets(group_id, month_start);

create trigger trg_budgets_updated_at
before update on public.budgets
for each row execute function public.set_updated_at();

-- Funcao helper para recuperar group_id do usuario autenticado
create or replace function public.current_group_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.group_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

revoke all on function public.current_group_id() from public;
grant execute on function public.current_group_id() to authenticated;

-- Funcao de bootstrap para criar grupo + perfil owner do usuario atual
create or replace function public.bootstrap_family_group(group_name text, user_full_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_uid uuid;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'Usuario nao autenticado';
  end if;

  if exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'Perfil ja existe para este usuario';
  end if;

  insert into public.family_groups (name, created_by)
  values (group_name, v_uid)
  returning id into v_group_id;

  insert into public.profiles (id, group_id, full_name, role)
  values (v_uid, v_group_id, user_full_name, 'owner');

  return v_group_id;
end;
$$;

revoke all on function public.bootstrap_family_group(text, text) from public;
grant execute on function public.bootstrap_family_group(text, text) to authenticated;

-- Habilita RLS
alter table public.family_groups enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

-- Polices: family_groups
drop policy if exists family_groups_select_own_group on public.family_groups;
create policy family_groups_select_own_group
on public.family_groups
for select
to authenticated
using (id = public.current_group_id());

drop policy if exists family_groups_update_owner on public.family_groups;
create policy family_groups_update_owner
on public.family_groups
for update
to authenticated
using (
  id = public.current_group_id()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.group_id = public.family_groups.id
      and p.role = 'owner'
  )
)
with check (
  id = public.current_group_id()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.group_id = public.family_groups.id
      and p.role = 'owner'
  )
);

-- Polices: profiles
drop policy if exists profiles_select_same_group on public.profiles;
create policy profiles_select_same_group
on public.profiles
for select
to authenticated
using (group_id = public.current_group_id());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = auth.uid() and group_id = public.current_group_id())
with check (id = auth.uid() and group_id = public.current_group_id());

-- Insert de perfil bloqueado por padrao; usar bootstrap_family_group

-- Polices: categories
drop policy if exists categories_all_same_group on public.categories;
create policy categories_all_same_group
on public.categories
for all
to authenticated
using (group_id = public.current_group_id())
with check (group_id = public.current_group_id());

-- Polices: transactions
drop policy if exists transactions_all_same_group on public.transactions;
create policy transactions_all_same_group
on public.transactions
for all
to authenticated
using (group_id = public.current_group_id())
with check (
  group_id = public.current_group_id()
  and profile_id in (
    select p.id
    from public.profiles p
    where p.group_id = public.current_group_id()
  )
);

-- Polices: budgets
drop policy if exists budgets_all_same_group on public.budgets;
create policy budgets_all_same_group
on public.budgets
for all
to authenticated
using (group_id = public.current_group_id())
with check (group_id = public.current_group_id());

-- Recomendacao de seguranca adicional
alter table public.family_groups force row level security;
alter table public.profiles force row level security;
alter table public.categories force row level security;
alter table public.transactions force row level security;
alter table public.budgets force row level security;

commit;
