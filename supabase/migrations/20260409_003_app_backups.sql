-- Backup/sincronizacao de dados locais no Supabase
-- Itens: categorias customizadas, ordem, lembretes e recorrentes

create table if not exists public.app_backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  group_id uuid,
  data_type text not null check (data_type in ('custom_categories', 'category_order', 'payment_reminders', 'recurring_payments')),
  payload jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, data_type)
);

create index if not exists idx_app_backups_user on public.app_backups(user_id);
create index if not exists idx_app_backups_group on public.app_backups(group_id);

create or replace function public.touch_app_backups_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_app_backups_updated_at on public.app_backups;
create trigger trg_touch_app_backups_updated_at
before update on public.app_backups
for each row execute function public.touch_app_backups_updated_at();

alter table public.app_backups enable row level security;

drop policy if exists "users_can_select_own_backups" on public.app_backups;
create policy "users_can_select_own_backups"
  on public.app_backups
  for select
  using (auth.uid() = user_id);

drop policy if exists "users_can_insert_own_backups" on public.app_backups;
create policy "users_can_insert_own_backups"
  on public.app_backups
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "users_can_update_own_backups" on public.app_backups;
create policy "users_can_update_own_backups"
  on public.app_backups
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "users_can_delete_own_backups" on public.app_backups;
create policy "users_can_delete_own_backups"
  on public.app_backups
  for delete
  using (auth.uid() = user_id);
