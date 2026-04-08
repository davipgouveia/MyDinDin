begin;

alter table public.transactions
  add column if not exists due_date date,
  add column if not exists is_paid boolean not null default true,
  add column if not exists payment_status text;

update public.transactions
set is_paid = coalesce(is_paid, true)
where is_paid is null;

commit;
