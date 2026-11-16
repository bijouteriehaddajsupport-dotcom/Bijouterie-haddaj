-- =====================================================================
--  HADDAJ BIJOUTERIE — Dates de livraison des commandes (calendrier admin)
--  + rappel « livraison dans 48 h » dans les notifications admin.
--  À exécuter une fois dans Supabase → SQL Editor (ré-exécutable).
-- =====================================================================

alter table public.orders add column if not exists delivery_date date;
alter table public.orders add column if not exists delivery_reminder_sent boolean not null default false;

create index if not exists orders_delivery_date_idx on public.orders (delivery_date);
