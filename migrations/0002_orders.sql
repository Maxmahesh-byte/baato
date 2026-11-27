-- Guest checkout for BAATO. Rows are not owned by a login: the customer
-- proves an order with the phone used at checkout plus the order code.
-- Amounts are integer paisa. Line prices are a snapshot, not a live join.

create table if not exists orders (
  id text primary key,
  code text not null unique,
  status text not null,
  payment_method text not null,
  payment_status text not null,
  customer_name text not null,
  phone text not null,
  address text not null,
  zone text not null,
  buyer_pan text,
  subtotal_paisa integer not null,
  shipping_paisa integer not null,
  taxable_paisa integer not null,
  vat_paisa integer not null,
  total_paisa integer not null,
  lines jsonb not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  constraint orders_status_chk check (
    status in ('pending_payment', 'cod_confirmed', 'paid', 'cancelled')
  ),
  constraint orders_method_chk check (
    payment_method in ('cod', 'esewa', 'khalti', 'fonepay')
  ),
  constraint orders_pay_status_chk check (
    payment_status in ('unpaid', 'pending', 'paid', 'failed')
  ),
  constraint orders_zone_chk check (zone in ('valley', 'outside')),
  constraint orders_pan_chk check (buyer_pan is null or buyer_pan ~ '^[0-9]{9}$'),
  constraint orders_money_chk check (
    subtotal_paisa >= 0
    and shipping_paisa >= 0
    and taxable_paisa >= 0
    and vat_paisa >= 0
    and total_paisa = subtotal_paisa + shipping_paisa
    and total_paisa = taxable_paisa + vat_paisa
  )
);

create index if not exists orders_phone_idx on orders (phone);

create table if not exists payments (
  id text primary key,
  order_id text not null references orders (id),
  provider text not null,
  provider_ref text not null,
  amount_paisa integer not null,
  status text not null,
  raw jsonb,
  created_at timestamptz not null default now(),
  constraint payments_status_chk check (status in ('initiated', 'captured', 'failed')),
  constraint payments_provider_ref_uniq unique (provider, provider_ref)
);

create index if not exists payments_order_idx on payments (order_id, created_at desc);

create table if not exists invoices (
  id text primary key,
  order_id text not null references orders (id),
  invoice_number text not null unique,
  fiscal_year text not null,
  kind text not null,
  seller_name text not null,
  seller_address text not null,
  seller_pan text not null,
  buyer_name text not null,
  buyer_phone text not null,
  buyer_address text not null,
  buyer_pan text,
  taxable_paisa integer not null,
  vat_paisa integer not null,
  shipping_paisa integer not null,
  total_paisa integer not null,
  payment_method text not null,
  payment_status text not null,
  issued_at timestamptz not null default now(),
  constraint invoices_kind_chk check (kind in ('proforma', 'tax')),
  constraint invoices_order_kind_uniq unique (order_id, kind)
);

-- First order code is BT-1001 (last_number starts at 1000).
create table if not exists order_counter (
  id integer primary key,
  last_number integer not null,
  constraint order_counter_singleton_chk check (id = 1)
);

insert into order_counter (id, last_number)
values (1, 1000)
on conflict (id) do nothing;

-- Tax invoice sequence, one row per Nepal fiscal year label ("83/84").
create table if not exists invoice_counters (
  fiscal_year text primary key,
  last_number integer not null
);

create table if not exists inquiries (
  id text primary key,
  name text not null,
  phone text not null,
  note text not null,
  created_at timestamptz not null default now()
);
