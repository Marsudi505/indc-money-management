-- ============================================================
-- INDC MONEY MANAGEMENT — Supabase Schema
-- ============================================================
-- Jalankan file ini di Supabase SQL Editor secara berurutan
-- ============================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- ============================================================
-- 2. ENUMS
-- ============================================================
create type user_role as enum ('admin', 'team');
create type transaction_type as enum ('income', 'expense');

-- ============================================================
-- 3. TABLES
-- ============================================================

-- 3a. Profiles (extends auth.users)
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  role        user_role not null default 'team',
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3b. Events
create table public.events (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  event_date  date not null,
  is_locked   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 3c. Transactions
create table public.transactions (
  id               uuid primary key default uuid_generate_v4(),
  event_id         uuid not null references public.events(id) on delete cascade,
  type             transaction_type not null,
  amount           bigint not null check (amount > 0),
  description      text not null,
  transaction_date date not null,
  proof_url        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- 3d. Global Balance (single-row table)
create table public.global_balance (
  id            int primary key default 1 check (id = 1), -- hanya 1 baris
  total_balance bigint not null default 0,
  updated_at    timestamptz not null default now()
);

-- Insert baris awal
insert into public.global_balance (id, total_balance) values (1, 0);

-- 3e. Balance Audit Log
create table public.balance_audit (
  id          uuid primary key default uuid_generate_v4(),
  old_balance bigint not null,
  new_balance bigint not null,
  reason      text not null,
  updated_by  uuid not null references public.profiles(id),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- 4. INDEXES
-- ============================================================
create index idx_events_user_id      on public.events(user_id);
create index idx_events_event_date   on public.events(event_date desc);
create index idx_transactions_event  on public.transactions(event_id);
create index idx_transactions_date   on public.transactions(transaction_date desc);
create index idx_audit_created_at    on public.balance_audit(created_at desc);

-- ============================================================
-- 5. TRIGGERS
-- ============================================================

-- 5a. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'team')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5b. Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at     before update on public.profiles     for each row execute procedure public.set_updated_at();
create trigger set_events_updated_at       before update on public.events       for each row execute procedure public.set_updated_at();
create trigger set_transactions_updated_at before update on public.transactions for each row execute procedure public.set_updated_at();

-- 5c. Auto-sync global_balance dari semua transaksi
create or replace function public.sync_global_balance()
returns trigger language plpgsql security definer as $$
declare
  v_total bigint;
begin
  select
    coalesce(sum(case when type = 'income' then amount else -amount end), 0)
  into v_total
  from public.transactions;

  update public.global_balance
  set total_balance = v_total, updated_at = now()
  where id = 1;

  return null;
end;
$$;

create trigger sync_balance_on_insert
  after insert or update or delete on public.transactions
  for each statement execute procedure public.sync_global_balance();

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.profiles      enable row level security;
alter table public.events        enable row level security;
alter table public.transactions  enable row level security;
alter table public.global_balance enable row level security;
alter table public.balance_audit  enable row level security;

-- Helper: cek apakah user adalah admin
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── PROFILES ──────────────────────────────────────────────
create policy "profiles: user can read own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: admin can read all" on public.profiles
  for select using (public.is_admin());

create policy "profiles: user can update own" on public.profiles
  for update using (auth.uid() = id);

-- ── EVENTS ────────────────────────────────────────────────
create policy "events: team sees own" on public.events
  for select using (auth.uid() = user_id);

create policy "events: admin sees all" on public.events
  for select using (public.is_admin());

create policy "events: team can insert own" on public.events
  for insert with check (auth.uid() = user_id);

create policy "events: team can update own unlocked" on public.events
  for update using (auth.uid() = user_id and is_locked = false);

create policy "events: admin can update any" on public.events
  for update using (public.is_admin());

create policy "events: team can delete own unlocked" on public.events
  for delete using (auth.uid() = user_id and is_locked = false);

create policy "events: admin can delete any" on public.events
  for delete using (public.is_admin());

-- ── TRANSACTIONS ──────────────────────────────────────────
create policy "transactions: team sees own event's" on public.transactions
  for select using (
    exists (
      select 1 from public.events
      where id = event_id and user_id = auth.uid()
    )
  );

create policy "transactions: admin sees all" on public.transactions
  for select using (public.is_admin());

create policy "transactions: team can insert on unlocked own events" on public.transactions
  for insert with check (
    exists (
      select 1 from public.events
      where id = event_id and user_id = auth.uid() and is_locked = false
    )
  );

create policy "transactions: team can delete own on unlocked events" on public.transactions
  for delete using (
    exists (
      select 1 from public.events
      where id = event_id and user_id = auth.uid() and is_locked = false
    )
  );

create policy "transactions: admin full access" on public.transactions
  for all using (public.is_admin());

-- ── GLOBAL BALANCE ────────────────────────────────────────
create policy "global_balance: authenticated can read" on public.global_balance
  for select using (auth.role() = 'authenticated');

create policy "global_balance: only admin can update" on public.global_balance
  for update using (public.is_admin());

-- ── BALANCE AUDIT ─────────────────────────────────────────
create policy "balance_audit: admin can read all" on public.balance_audit
  for select using (public.is_admin());

create policy "balance_audit: admin can insert" on public.balance_audit
  for insert with check (public.is_admin());

-- ============================================================
-- 7. STORAGE BUCKET
-- ============================================================

-- Jalankan via Supabase Dashboard > Storage, atau lewat SQL:
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proofs',
  'proofs',
  true,              -- public bucket
  2097152,           -- 2MB limit
  array['image/jpeg','image/png','image/webp','image/gif']
) on conflict (id) do nothing;

-- Storage RLS
create policy "proofs: authenticated can upload" on storage.objects
  for insert with check (
    bucket_id = 'proofs' and auth.role() = 'authenticated'
  );

create policy "proofs: authenticated can read" on storage.objects
  for select using (bucket_id = 'proofs' and auth.role() = 'authenticated');

create policy "proofs: owner can delete" on storage.objects
  for delete using (
    bucket_id = 'proofs' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================
-- 8. VIEWS (untuk aggregasi di dashboard)
-- ============================================================

create or replace view public.event_summary as
select
  e.id,
  e.user_id,
  e.title,
  e.description,
  e.event_date,
  e.is_locked,
  e.created_at,
  p.full_name as owner_name,
  coalesce(sum(case when t.type = 'income' then t.amount else 0 end), 0) as total_income,
  coalesce(sum(case when t.type = 'expense' then t.amount else 0 end), 0) as total_expense,
  coalesce(sum(case when t.type = 'income' then t.amount else -t.amount end), 0) as net_profit,
  count(t.id) as transaction_count
from public.events e
left join public.profiles p on p.id = e.user_id
left join public.transactions t on t.event_id = e.id
group by e.id, p.full_name;

-- RLS untuk view
create policy "event_summary: team sees own" on public.events
  for select using (auth.uid() = user_id or public.is_admin());

-- ============================================================
-- SELESAI — Schema berhasil dibuat
-- ============================================================
