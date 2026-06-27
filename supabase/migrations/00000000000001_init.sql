-- Swag Inventory schema. Run in the Supabase SQL editor (or `supabase db push`).
-- Single source of truth for current stock is the current_stock VIEW, derived
-- from received order lines (+) and giveaway lines (−). No separate counter.

create extension if not exists "pgcrypto";

-- Catalog ----------------------------------------------------------------
create table if not exists items (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  points      int  not null default 0,        -- "price" in points
  has_sizes   bool not null default false,
  sizes       text[],                          -- e.g. {S,M,L,XL,XXL}; null when no sizes
  active      bool not null default true,
  created_at  timestamptz not null default now()
);

-- Orders (a points-budgeted batch) ---------------------------------------
create table if not exists orders (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  points_budget    int  not null default 0,
  points_granted_on date,                       -- expiry = +30 days
  status           text not null default 'open',-- 'open' | 'received'
  note             text,
  created_at       timestamptz not null default now()
);

create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  item_id      uuid not null references items(id),
  size         text,
  qty_ordered  int not null default 0,
  qty_received int                              -- set when the order is received
);

-- Giveaways --------------------------------------------------------------
create table if not exists giveaways (
  id         uuid primary key default gen_random_uuid(),
  recipient  text not null,
  note       text,
  created_at timestamptz not null default now()
);

create table if not exists giveaway_items (
  id          uuid primary key default gen_random_uuid(),
  giveaway_id uuid not null references giveaways(id) on delete cascade,
  item_id     uuid not null references items(id),
  size        text,
  qty         int not null default 0
);

-- Failed login attempts, for IP rate limiting ----------------------------
create table if not exists auth_attempts (
  id         uuid primary key default gen_random_uuid(),
  ip         text not null,
  created_at timestamptz not null default now()
);
create index if not exists auth_attempts_ip_time on auth_attempts (ip, created_at);

-- Current stock = received orders minus giveaways ------------------------
create or replace view current_stock as
  select item_id, size, sum(delta)::int as qty
  from (
    select oi.item_id, oi.size, coalesce(oi.qty_received, 0) as delta
      from order_items oi
      join orders o on o.id = oi.order_id
     where o.status = 'received'
    union all
    select gi.item_id, gi.size, -gi.qty as delta
      from giveaway_items gi
  ) m
  group by item_id, size;

-- RLS: no public access. App reaches the DB server-side with the
-- service-role key only (which bypasses RLS). Enabling RLS with no policies
-- means the anon/public key can read nothing.
alter table items          enable row level security;
alter table orders         enable row level security;
alter table order_items    enable row level security;
alter table giveaways      enable row level security;
alter table giveaway_items enable row level security;
alter table auth_attempts  enable row level security;

-- The app talks to the DB only with the service-role key, which bypasses RLS.
-- Grant it table privileges so it works no matter how the schema was applied.
-- (Supabase projects grant these by default; this makes the schema portable.)
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
