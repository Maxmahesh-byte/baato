-- Desk fulfillment is separate from the payment status constraint so a
-- dispatched COD order can stay unpaid until cash is collected.
-- Inventory rows override the catalog cage. Checkout reserves from this table.

alter table orders add column if not exists fulfillment text;

update orders
set fulfillment = case status
  when 'cod_confirmed' then 'confirmed'
  when 'paid' then 'paid'
  when 'cancelled' then 'cancelled'
  else 'pending'
end
where fulfillment is null;

alter table orders alter column fulfillment set default 'pending';
alter table orders alter column fulfillment set not null;

alter table orders drop constraint if exists orders_fulfillment_chk;
alter table orders add constraint orders_fulfillment_chk check (
  fulfillment in ('pending', 'confirmed', 'paid', 'dispatched', 'delivered', 'cancelled')
);

create index if not exists orders_fulfillment_idx on orders (fulfillment, created_at desc);

create table if not exists inventory (
  slug text primary key,
  stock integer not null,
  available boolean not null default true,
  updated_at timestamptz not null default now(),
  constraint inventory_stock_chk check (stock >= 0 and stock <= 100000)
);
