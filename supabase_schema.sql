-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================================
-- USER PROFILES TABLE
-- ============================================================================
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  avatar_url text,
  starting_cash numeric default 100000,
  current_cash numeric default 100000,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS: Users can only read/write their own profile
alter table public.user_profiles enable row level security;
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);
create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

-- ============================================================================
-- PORTFOLIO TABLE
-- ============================================================================
create table if not exists public.portfolios (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  symbol text not null,
  quantity integer not null default 0,
  avg_cost numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, symbol)
);

-- RLS: Users can only see their own portfolio
alter table public.portfolios enable row level security;
create policy "Users can view own portfolio"
  on public.portfolios for select
  using (auth.uid() = user_id);
create policy "Users can manage own portfolio"
  on public.portfolios for all
  using (auth.uid() = user_id);

-- ============================================================================
-- TRADES TABLE
-- ============================================================================
create table if not exists public.trades (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  symbol text not null,
  type text not null check (type in ('BUY', 'SELL')),
  quantity integer not null,
  price numeric not null,
  total_value numeric not null,
  executed_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS: Users can only see their own trades
alter table public.trades enable row level security;
create policy "Users can view own trades"
  on public.trades for select
  using (auth.uid() = user_id);
create policy "Users can create trades"
  on public.trades for insert
  with check (auth.uid() = user_id);

-- ============================================================================
-- ALERTS TABLE
-- ============================================================================
create table if not exists public.alerts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  symbol text not null,
  alert_type text not null check (alert_type in ('PRICE_ABOVE', 'PRICE_BELOW', 'PERCENT_CHANGE')),
  threshold numeric not null,
  is_active boolean default true,
  triggered_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS: Users can only see their own alerts
alter table public.alerts enable row level security;
create policy "Users can view own alerts"
  on public.alerts for select
  using (auth.uid() = user_id);
create policy "Users can manage own alerts"
  on public.alerts for all
  using (auth.uid() = user_id);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
create index if not exists portfolios_user_id_idx on public.portfolios(user_id);
create index if not exists trades_user_id_idx on public.trades(user_id);
create index if not exists trades_symbol_idx on public.trades(symbol);
create index if not exists alerts_user_id_idx on public.alerts(user_id);
create index if not exists alerts_symbol_idx on public.alerts(symbol);
