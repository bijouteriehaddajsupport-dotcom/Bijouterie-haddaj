-- =====================================================================
--  HADDAJ BIJOUTERIE — Photos du site (Admin → Photos du site)
--  Réglages de l'accueil : photo + cadrage de chaque emplacement.
--  À exécuter une fois dans Supabase → SQL Editor (ré-exécutable).
-- =====================================================================

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- Lecture publique (la boutique affiche les photos), modification réservée à l'admin
drop policy if exists "site_settings_read" on public.site_settings;
create policy "site_settings_read" on public.site_settings for select using (true);
drop policy if exists "site_settings_admin" on public.site_settings;
create policy "site_settings_admin" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
