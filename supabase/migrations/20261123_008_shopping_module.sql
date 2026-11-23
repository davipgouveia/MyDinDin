-- Migration 008 — Modulo Compras (2026-11-23)
-- Recria no MyDinDin as funcionalidades do app "Compras e tals":
-- lista de compras compartilhada, registro de compras, comparacao de
-- precos entre lojas, previsao de termino de produtos e relatorios.
-- Tudo escopado por grupo familiar (group_id), no mesmo padrao da
-- migration 001. Inclui tokens de API por pessoa (api_tokens): cada
-- membro do grupo gera o proprio token e conecta o Muse dele —
-- no banco fica somente o hash SHA-256 do token.

-- ============================================================
-- Lojas
-- ============================================================
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  name text not null,
  name_norm text not null,
  kind text not null default 'mercado',
  notes text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint uq_stores_group_name_norm unique (group_id, name_norm)
);

create index if not exists idx_stores_group_id on public.stores(group_id);

create trigger trg_stores_updated_at
before update on public.stores
for each row execute function public.set_updated_at();

-- ============================================================
-- Produtos
-- ============================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  name text not null,
  name_norm text not null,
  category text,
  unit text not null default 'un',
  brand text,
  notes text,
  consumable boolean not null default true,
  duration_days_override numeric(10,2),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint uq_products_group_name_norm unique (group_id, name_norm)
);

create index if not exists idx_products_group_id on public.products(group_id);

create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- ============================================================
-- Compras (cabecalho) e itens
-- ============================================================
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  date date not null,
  notes text,
  transaction_id uuid references public.transactions(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_purchases_group_date on public.purchases(group_id, date desc);

create trigger trg_purchases_updated_at
before update on public.purchases
for each row execute function public.set_updated_at();

create table if not exists public.purchase_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity numeric(10,3) not null default 1,
  unit_price numeric(14,2),
  total_price numeric(14,2),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_purchase_items_product on public.purchase_items(product_id);
create index if not exists idx_purchase_items_purchase on public.purchase_items(purchase_id);
create index if not exists idx_purchase_items_group on public.purchase_items(group_id);

-- ============================================================
-- Marcacoes de "acabou"
-- ============================================================
create table if not exists public.finished_events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  date date not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_finished_events_product on public.finished_events(product_id, date desc);
create index if not exists idx_finished_events_group on public.finished_events(group_id);

-- ============================================================
-- Lista de compras compartilhada
-- ============================================================
create table if not exists public.shopping_list (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  quantity numeric(10,3) not null default 1,
  notes text,
  done boolean not null default false,
  done_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_shopping_list_group_done on public.shopping_list(group_id, done);

create trigger trg_shopping_list_updated_at
before update on public.shopping_list
for each row execute function public.set_updated_at();

-- ============================================================
-- Tokens de API por pessoa (acesso externo, ex.: o Muse de
-- cada membro da familia). So o hash SHA-256 fica salvo.
-- ============================================================
create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Meu Muse',
  token_hash text not null unique,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_api_tokens_hash on public.api_tokens(token_hash);
create index if not exists idx_api_tokens_user on public.api_tokens(user_id);

-- ============================================================
-- RLS — mesmo padrao da migration 001 (grupo via current_group_id)
-- ============================================================
alter table public.stores enable row level security;
alter table public.products enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_items enable row level security;
alter table public.finished_events enable row level security;
alter table public.shopping_list enable row level security;
alter table public.api_tokens enable row level security;

drop policy if exists stores_all_same_group on public.stores;
create policy stores_all_same_group
on public.stores
for all
to authenticated
using (group_id = public.current_group_id())
with check (group_id = public.current_group_id());

drop policy if exists products_all_same_group on public.products;
create policy products_all_same_group
on public.products
for all
to authenticated
using (group_id = public.current_group_id())
with check (group_id = public.current_group_id());

drop policy if exists purchases_all_same_group on public.purchases;
create policy purchases_all_same_group
on public.purchases
for all
to authenticated
using (group_id = public.current_group_id())
with check (group_id = public.current_group_id());

drop policy if exists purchase_items_all_same_group on public.purchase_items;
create policy purchase_items_all_same_group
on public.purchase_items
for all
to authenticated
using (group_id = public.current_group_id())
with check (group_id = public.current_group_id());

drop policy if exists finished_events_all_same_group on public.finished_events;
create policy finished_events_all_same_group
on public.finished_events
for all
to authenticated
using (group_id = public.current_group_id())
with check (group_id = public.current_group_id());

drop policy if exists shopping_list_all_same_group on public.shopping_list;
create policy shopping_list_all_same_group
on public.shopping_list
for all
to authenticated
using (group_id = public.current_group_id())
with check (group_id = public.current_group_id());

-- Tokens: cada pessoa enxerga e gerencia somente os proprios.
drop policy if exists api_tokens_own on public.api_tokens;
create policy api_tokens_own
on public.api_tokens
for all
to authenticated
using (user_id = auth.uid() and group_id = public.current_group_id())
with check (user_id = auth.uid() and group_id = public.current_group_id());

alter table public.stores force row level security;
alter table public.products force row level security;
alter table public.purchases force row level security;
alter table public.purchase_items force row level security;
alter table public.finished_events force row level security;
alter table public.shopping_list force row level security;
alter table public.api_tokens force row level security;
