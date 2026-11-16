-- =====================================================================
--  HADDAJ BIJOUTERIE — Statut « Reportée » (livraison prévue au-delà de 48 h)
--  À exécuter une fois dans Supabase → SQL Editor (ré-exécutable).
-- =====================================================================

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'confirmed', 'postponed', 'shipped', 'delivered', 'cancelled'));
