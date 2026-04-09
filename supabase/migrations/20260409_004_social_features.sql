begin;

create table if not exists public.transaction_comments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  content text not null check (char_length(trim(content)) > 0),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_transaction_comments_tx on public.transaction_comments(transaction_id, created_at desc);
create index if not exists idx_transaction_comments_group on public.transaction_comments(group_id);

create table if not exists public.app_activity_logs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.family_groups(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  transaction_id uuid references public.transactions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_app_activity_logs_group_date on public.app_activity_logs(group_id, created_at desc);

alter table public.transaction_comments enable row level security;
alter table public.app_activity_logs enable row level security;

alter table public.transaction_comments force row level security;
alter table public.app_activity_logs force row level security;

drop policy if exists transaction_comments_same_group on public.transaction_comments;
create policy transaction_comments_same_group
on public.transaction_comments
for all
to authenticated
using (group_id = public.current_group_id())
with check (
  group_id = public.current_group_id()
  and profile_id in (
    select p.id from public.profiles p where p.group_id = public.current_group_id()
  )
);

drop policy if exists app_activity_logs_same_group on public.app_activity_logs;
create policy app_activity_logs_same_group
on public.app_activity_logs
for all
to authenticated
using (group_id = public.current_group_id())
with check (
  group_id = public.current_group_id()
  and profile_id in (
    select p.id from public.profiles p where p.group_id = public.current_group_id()
  )
);

commit;
