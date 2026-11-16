-- =====================================================================
--  HADDAJ BIJOUTERIE — Suppression des catégories (le site n'utilise que les collections)
--  À exécuter une fois dans Supabase → SQL Editor.
-- =====================================================================

-- Retire le lien produits → catégories, puis la table elle-même
alter table public.products drop constraint if exists products_category_fkey;
drop table if exists public.categories;
