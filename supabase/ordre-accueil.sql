-- =====================================================================
--  HADDAJ BIJOUTERIE — Ordre d'affichage des sections de l'accueil
--  (« Les plus vendus » et « Nouveautés »), réglé dans Admin → Page d'accueil.
--  À exécuter une fois dans Supabase → SQL Editor (ré-exécutable).
-- =====================================================================

alter table public.products add column if not exists featured_rank int;
alter table public.products add column if not exists new_rank int;
