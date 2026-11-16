-- =====================================================================
--  HADDAJ BIJOUTERIE — INSTALLATION COMPLÈTE DE LA BASE
--  Supabase → SQL Editor → coller tout le fichier → Run (une seule fois).
--  Contient : tables, sécurité, stockage des images, commandes (numéros HD-…),
--  livraison gratuite ou payante, ordre de l'accueil et 5 collections de départ.
-- =====================================================================

-- =====================================================================
--  HADDAJ BIJOUTERIE — Schéma Supabase
--  À exécuter dans Supabase → SQL Editor (ré-exécutable sans risque).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
--  PROFILS (1 ligne par compte, créée automatiquement à l'inscription)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

-- Vérifie le rôle sans déclencher la récursion des politiques RLS
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- L'adresse de la boutique devient automatiquement administratrice
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    case when lower(new.email) = 'bijouterie.haddaj.support@gmail.com' then 'admin' else 'customer' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rattrapage pour les comptes existants
insert into public.profiles (id, email, full_name)
select id, email, raw_user_meta_data ->> 'full_name' from auth.users
on conflict (id) do nothing;
update public.profiles set role = 'admin' where lower(email) = 'bijouterie.haddaj.support@gmail.com';

-- ---------------------------------------------------------------------
--  CATALOGUE
-- ---------------------------------------------------------------------
create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  is_featured boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  details text,
  price numeric(12, 2) not null check (price >= 0),
  compare_at_price numeric(12, 2) check (compare_at_price is null or compare_at_price >= 0),
  category text not null default 'bagues',
  material text,
  collection_id uuid references public.collections (id) on delete set null,
  images text[] not null default '{}',
  stock int not null default 0,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_active boolean not null default true,
  featured_rank int,  -- ordre dans « Les plus vendus » (accueil)
  new_rank int,       -- ordre dans « Nouveautés » (accueil)
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_collection_idx on public.products (collection_id);
create index if not exists products_created_idx on public.products (created_at desc);

-- ---------------------------------------------------------------------
--  COMMANDES
-- ---------------------------------------------------------------------
create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  email text not null,
  phone text not null,
  address text not null,
  city text not null,
  postal_code text,
  country text not null default 'Maroc',
  notes text,
  subtotal numeric(12, 2) not null default 0,
  shipping numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'postponed', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null default 'cod',
  created_at timestamptz not null default now()
);

create index if not exists orders_created_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_user_idx on public.orders (user_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  product_image text,
  unit_price numeric(12, 2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(12, 2) not null
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------
--  NOTIFICATIONS ADMIN & NEWSLETTER
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'new_order',
  title text not null,
  message text,
  order_id uuid references public.orders (id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_created_idx on public.notifications (created_at desc);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
--  PASSAGE DE COMMANDE (prix et stock recalculés côté serveur)
-- ---------------------------------------------------------------------
create or replace function public.place_order(p_customer jsonb, p_items jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_number text;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty int;
  v_subtotal numeric(12, 2) := 0;
  v_count int := 0;
  v_name text := left(trim(coalesce(p_customer ->> 'full_name', '')), 120);
  v_email text := lower(left(trim(coalesce(p_customer ->> 'email', '')), 160));
  v_phone text := left(trim(coalesce(p_customer ->> 'phone', '')), 40);
  v_address text := left(trim(coalesce(p_customer ->> 'address', '')), 300);
  v_city text := left(trim(coalesce(p_customer ->> 'city', '')), 80);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Votre panier est vide.';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Votre panier contient trop d''articles.';
  end if;
  if v_name = '' or v_email = '' or v_phone = '' or v_address = '' or v_city = '' then
    raise exception 'Merci de compléter vos informations de livraison.';
  end if;
  if v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Adresse e-mail invalide.';
  end if;

  v_number := 'HD-' || nextval('public.order_number_seq');

  insert into public.orders (order_number, user_id, customer_name, email, phone, address, city, postal_code, country, notes)
  values (
    v_number, auth.uid(), v_name, v_email, v_phone, v_address, v_city,
    nullif(left(trim(coalesce(p_customer ->> 'postal_code', '')), 20), ''),
    coalesce(nullif(left(trim(coalesce(p_customer ->> 'country', '')), 60), ''), 'Maroc'),
    nullif(left(trim(coalesce(p_customer ->> 'notes', '')), 1000), '')
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, least(coalesce((v_item ->> 'quantity')::int, 1), 20));

    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid and is_active
    for update;

    if not found then
      raise exception 'Un article de votre panier n''est plus disponible.';
    end if;
    if v_product.stock < v_qty then
      raise exception 'Stock insuffisant pour « % » (il en reste %).', v_product.name, greatest(v_product.stock, 0);
    end if;

    update public.products set stock = stock - v_qty where id = v_product.id;

    insert into public.order_items (order_id, product_id, product_name, product_image, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, v_product.name, v_product.images[1], v_product.price, v_qty, v_product.price * v_qty);

    v_subtotal := v_subtotal + v_product.price * v_qty;
    v_count := v_count + v_qty;
  end loop;

  update public.orders set subtotal = v_subtotal, total = v_subtotal + shipping where id = v_order_id;

  insert into public.notifications (type, title, message, order_id)
  values ('new_order', 'Nouvelle commande ' || v_number, v_name || ' · ' || v_count || ' article(s) · ' || v_city, v_order_id);

  return json_build_object('id', v_order_id, 'order_number', v_number);
end;
$$;

-- Récapitulatif pour la page de confirmation (l'identifiant UUID fait office de clé secrète)
create or replace function public.get_order_summary(p_id uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'email', o.email,
    'address', o.address,
    'city', o.city,
    'subtotal', o.subtotal,
    'shipping', o.shipping,
    'total', o.total,
    'status', o.status,
    'created_at', o.created_at,
    'items', coalesce((
      select json_agg(json_build_object(
        'product_name', i.product_name, 'product_image', i.product_image,
        'unit_price', i.unit_price, 'quantity', i.quantity, 'line_total', i.line_total))
      from public.order_items i where i.order_id = o.id
    ), '[]'::json)
  )
  from public.orders o
  where o.id = p_id;
$$;

grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;
grant execute on function public.get_order_summary(uuid) to anon, authenticated;

-- Remise en stock si une commande est annulée (et inversement)
create or replace function public.restock_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.products p set stock = p.stock + i.quantity
    from public.order_items i where i.order_id = new.id and i.product_id = p.id;
  elsif old.status = 'cancelled' and new.status <> 'cancelled' then
    update public.products p set stock = p.stock - i.quantity
    from public.order_items i where i.order_id = new.id and i.product_id = p.id;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_restock on public.orders;
create trigger orders_restock
  after update of status on public.orders
  for each row execute function public.restock_on_cancel();

-- ---------------------------------------------------------------------
--  SÉCURITÉ (Row Level Security)
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.notifications enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Profils : chacun lit le sien, l'admin lit tout. Seuls nom et téléphone sont modifiables.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

-- Collections : lecture publique, écriture admin
drop policy if exists "collections_read" on public.collections;
create policy "collections_read" on public.collections for select using (true);
drop policy if exists "collections_admin" on public.collections;
create policy "collections_admin" on public.collections
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Produits : lecture publique des produits actifs, écriture admin
drop policy if exists "products_read" on public.products;
create policy "products_read" on public.products
  for select using (is_active or public.is_admin());
drop policy if exists "products_admin" on public.products;
create policy "products_admin" on public.products
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Commandes : création via place_order() uniquement ; le client voit les siennes, l'admin gère tout
drop policy if exists "orders_select" on public.orders;
create policy "orders_select" on public.orders
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update" on public.orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "orders_admin_delete" on public.orders;
create policy "orders_admin_delete" on public.orders
  for delete to authenticated using (public.is_admin());

drop policy if exists "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
  );

-- Notifications : admin uniquement
drop policy if exists "notifications_admin" on public.notifications;
create policy "notifications_admin" on public.notifications
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Newsletter : tout le monde peut s'inscrire, seul l'admin consulte
drop policy if exists "newsletter_insert" on public.newsletter_subscribers;
create policy "newsletter_insert" on public.newsletter_subscribers
  for insert to anon, authenticated with check (true);
drop policy if exists "newsletter_admin" on public.newsletter_subscribers;
create policy "newsletter_admin" on public.newsletter_subscribers
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
--  TEMPS RÉEL : notifications instantanées dans l'espace admin
-- ---------------------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------
--  STOCKAGE DES IMAGES (bucket public « images »)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do update set public = true;

drop policy if exists "images_public_read" on storage.objects;
create policy "images_public_read" on storage.objects
  for select using (bucket_id = 'images');
drop policy if exists "images_admin_insert" on storage.objects;
create policy "images_admin_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'images' and public.is_admin());
drop policy if exists "images_admin_update" on storage.objects;
create policy "images_admin_update" on storage.objects
  for update to authenticated using (bucket_id = 'images' and public.is_admin());
drop policy if exists "images_admin_delete" on storage.objects;
create policy "images_admin_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'images' and public.is_admin());

-- ---------------------------------------------------------------------
--  COMMANDE SANS E-MAIL + OPTIONS DU REÇU (remplace place_order ci-dessus)
-- ---------------------------------------------------------------------
alter table public.orders alter column email drop not null;
alter table public.orders add column if not exists receipt_name text;
alter table public.orders add column if not exists show_price_on_receipt boolean not null default true;
alter table public.orders add column if not exists is_gift boolean not null default false;

create or replace function public.place_order(p_customer jsonb, p_items jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_number text;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty int;
  v_subtotal numeric(12, 2) := 0;
  v_count int := 0;
  v_name text := left(trim(coalesce(p_customer ->> 'full_name', '')), 120);
  v_email text := nullif(lower(left(trim(coalesce(p_customer ->> 'email', '')), 160)), '');
  v_phone text := left(trim(coalesce(p_customer ->> 'phone', '')), 40);
  v_address text := left(trim(coalesce(p_customer ->> 'address', '')), 300);
  v_city text := left(trim(coalesce(p_customer ->> 'city', '')), 80);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Votre panier est vide.';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Votre panier contient trop d''articles.';
  end if;
  if v_name = '' or v_phone = '' or v_address = '' or v_city = '' then
    raise exception 'Merci de compléter vos informations de livraison.';
  end if;
  -- L'e-mail est facultatif : vérifié seulement s'il est fourni
  if v_email is not null and v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Adresse e-mail invalide.';
  end if;

  v_number := 'HD-' || nextval('public.order_number_seq');

  insert into public.orders (
    order_number, user_id, customer_name, email, phone, address, city, postal_code, country, notes,
    receipt_name, show_price_on_receipt, is_gift
  )
  values (
    v_number, auth.uid(), v_name, v_email, v_phone, v_address, v_city,
    nullif(left(trim(coalesce(p_customer ->> 'postal_code', '')), 20), ''),
    coalesce(nullif(left(trim(coalesce(p_customer ->> 'country', '')), 60), ''), 'Maroc'),
    nullif(left(trim(coalesce(p_customer ->> 'notes', '')), 1000), ''),
    nullif(left(trim(coalesce(p_customer ->> 'receipt_name', '')), 120), ''),
    coalesce((p_customer ->> 'show_price_on_receipt')::boolean, true),
    coalesce((p_customer ->> 'is_gift')::boolean, false)
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, least(coalesce((v_item ->> 'quantity')::int, 1), 20));

    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid and is_active
    for update;

    if not found then
      raise exception 'Un article de votre panier n''est plus disponible.';
    end if;
    if v_product.stock < v_qty then
      raise exception 'Stock insuffisant pour « % » (il en reste %).', v_product.name, greatest(v_product.stock, 0);
    end if;

    update public.products set stock = stock - v_qty where id = v_product.id;

    insert into public.order_items (order_id, product_id, product_name, product_image, unit_price, quantity, line_total)
    values (v_order_id, v_product.id, v_product.name, v_product.images[1], v_product.price, v_qty, v_product.price * v_qty);

    v_subtotal := v_subtotal + v_product.price * v_qty;
    v_count := v_count + v_qty;
  end loop;

  update public.orders set subtotal = v_subtotal, total = v_subtotal + shipping where id = v_order_id;

  insert into public.notifications (type, title, message, order_id)
  values ('new_order', 'Nouvelle commande ' || v_number, v_name || ' · ' || v_count || ' article(s) · ' || v_city, v_order_id);

  return json_build_object('id', v_order_id, 'order_number', v_number);
end;
$$;

grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------
--  TAILLES (remplace place_order et get_order_summary ci-dessus)
-- ---------------------------------------------------------------------
alter table public.collections add column if not exists requires_size boolean not null default false;
alter table public.order_items add column if not exists size text;

create or replace function public.place_order(p_customer jsonb, p_items jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_number text;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty int;
  v_subtotal numeric(12, 2) := 0;
  v_count int := 0;
  v_size text;
  v_requires_size boolean;
  v_name text := left(trim(coalesce(p_customer ->> 'full_name', '')), 120);
  v_email text := nullif(lower(left(trim(coalesce(p_customer ->> 'email', '')), 160)), '');
  v_phone text := left(trim(coalesce(p_customer ->> 'phone', '')), 40);
  v_address text := left(trim(coalesce(p_customer ->> 'address', '')), 300);
  v_city text := left(trim(coalesce(p_customer ->> 'city', '')), 80);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Votre panier est vide.';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Votre panier contient trop d''articles.';
  end if;
  if v_name = '' or v_phone = '' or v_address = '' or v_city = '' then
    raise exception 'Merci de compléter vos informations de livraison.';
  end if;
  -- L'e-mail est facultatif : vérifié seulement s'il est fourni
  if v_email is not null and v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Adresse e-mail invalide.';
  end if;

  v_number := 'HD-' || nextval('public.order_number_seq');

  insert into public.orders (
    order_number, user_id, customer_name, email, phone, address, city, postal_code, country, notes,
    receipt_name, show_price_on_receipt, is_gift
  )
  values (
    v_number, auth.uid(), v_name, v_email, v_phone, v_address, v_city,
    nullif(left(trim(coalesce(p_customer ->> 'postal_code', '')), 20), ''),
    coalesce(nullif(left(trim(coalesce(p_customer ->> 'country', '')), 60), ''), 'Maroc'),
    nullif(left(trim(coalesce(p_customer ->> 'notes', '')), 1000), ''),
    nullif(left(trim(coalesce(p_customer ->> 'receipt_name', '')), 120), ''),
    coalesce((p_customer ->> 'show_price_on_receipt')::boolean, true),
    coalesce((p_customer ->> 'is_gift')::boolean, false)
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, least(coalesce((v_item ->> 'quantity')::int, 1), 20));

    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid and is_active
    for update;

    if not found then
      raise exception 'Un article de votre panier n''est plus disponible.';
    end if;
    if v_product.stock < v_qty then
      raise exception 'Stock insuffisant pour « % » (il en reste %).', v_product.name, greatest(v_product.stock, 0);
    end if;

    -- Taille facultative (5 à 10), proposée pour les collections qui ont l'option
    v_requires_size := false;
    select coalesce(c.requires_size, false) into v_requires_size from public.collections c where c.id = v_product.collection_id;
    v_size := nullif(trim(coalesce(v_item ->> 'size', '')), '');
    if not coalesce(v_requires_size, false) or (v_size is not null and v_size !~ '^(5|6|7|8|9|10)$') then
      v_size := null;
    end if;

    update public.products set stock = stock - v_qty where id = v_product.id;

    insert into public.order_items (order_id, product_id, product_name, product_image, unit_price, quantity, line_total, size)
    values (v_order_id, v_product.id, v_product.name, v_product.images[1], v_product.price, v_qty, v_product.price * v_qty, v_size);

    v_subtotal := v_subtotal + v_product.price * v_qty;
    v_count := v_count + v_qty;
  end loop;

  update public.orders set subtotal = v_subtotal, total = v_subtotal + shipping where id = v_order_id;

  insert into public.notifications (type, title, message, order_id)
  values ('new_order', 'Nouvelle commande ' || v_number, v_name || ' · ' || v_count || ' article(s) · ' || v_city, v_order_id);

  return json_build_object('id', v_order_id, 'order_number', v_number);
end;
$$;

grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;

-- Récapitulatif de commande (page de confirmation, e-mail) avec la taille
create or replace function public.get_order_summary(p_id uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'email', o.email,
    'address', o.address,
    'city', o.city,
    'subtotal', o.subtotal,
    'shipping', o.shipping,
    'total', o.total,
    'status', o.status,
    'created_at', o.created_at,
    'items', coalesce((
      select json_agg(json_build_object(
        'product_name', i.product_name, 'product_image', i.product_image,
        'unit_price', i.unit_price, 'quantity', i.quantity, 'line_total', i.line_total, 'size', i.size))
      from public.order_items i where i.order_id = o.id
    ), '[]'::json)
  )
  from public.orders o
  where o.id = p_id;
$$;

grant execute on function public.get_order_summary(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------
--  DATES DE LIVRAISON (calendrier admin)
-- ---------------------------------------------------------------------
alter table public.orders add column if not exists delivery_date date;
alter table public.orders add column if not exists delivery_reminder_sent boolean not null default false;

create index if not exists orders_delivery_date_idx on public.orders (delivery_date);

-- ---------------------------------------------------------------------
--  STATUT « REPORTÉE » (bases existantes)
-- ---------------------------------------------------------------------
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'confirmed', 'postponed', 'shipped', 'delivered', 'cancelled'));

-- ---------------------------------------------------------------------
--  COMMANDE SANS VILLE (remplace place_order ci-dessus)
-- ---------------------------------------------------------------------

alter table public.orders alter column city drop not null;

create or replace function public.place_order(p_customer jsonb, p_items jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_number text;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty int;
  v_subtotal numeric(12, 2) := 0;
  v_count int := 0;
  v_size text;
  v_requires_size boolean;
  v_name text := left(trim(coalesce(p_customer ->> 'full_name', '')), 120);
  v_email text := nullif(lower(left(trim(coalesce(p_customer ->> 'email', '')), 160)), '');
  v_phone text := left(trim(coalesce(p_customer ->> 'phone', '')), 40);
  v_address text := left(trim(coalesce(p_customer ->> 'address', '')), 300);
  v_city text := left(trim(coalesce(p_customer ->> 'city', '')), 80);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Votre panier est vide.';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Votre panier contient trop d''articles.';
  end if;
  if v_name = '' or v_phone = '' or v_address = '' then
    raise exception 'Merci de compléter vos informations de livraison.';
  end if;
  -- L'e-mail est facultatif : vérifié seulement s'il est fourni
  if v_email is not null and v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Adresse e-mail invalide.';
  end if;

  v_number := 'HD-' || nextval('public.order_number_seq');

  insert into public.orders (
    order_number, user_id, customer_name, email, phone, address, city, postal_code, country, notes,
    receipt_name, show_price_on_receipt, is_gift
  )
  values (
    v_number, auth.uid(), v_name, v_email, v_phone, v_address, nullif(v_city, ''),
    nullif(left(trim(coalesce(p_customer ->> 'postal_code', '')), 20), ''),
    coalesce(nullif(left(trim(coalesce(p_customer ->> 'country', '')), 60), ''), 'Maroc'),
    nullif(left(trim(coalesce(p_customer ->> 'notes', '')), 1000), ''),
    nullif(left(trim(coalesce(p_customer ->> 'receipt_name', '')), 120), ''),
    coalesce((p_customer ->> 'show_price_on_receipt')::boolean, true),
    coalesce((p_customer ->> 'is_gift')::boolean, false)
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, least(coalesce((v_item ->> 'quantity')::int, 1), 20));

    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid and is_active
    for update;

    if not found then
      raise exception 'Un article de votre panier n''est plus disponible.';
    end if;
    if v_product.stock < v_qty then
      raise exception 'Stock insuffisant pour « % » (il en reste %).', v_product.name, greatest(v_product.stock, 0);
    end if;

    -- Taille facultative (5 à 10), proposée pour les collections qui ont l'option
    v_requires_size := false;
    select coalesce(c.requires_size, false) into v_requires_size from public.collections c where c.id = v_product.collection_id;
    v_size := nullif(trim(coalesce(v_item ->> 'size', '')), '');
    if not coalesce(v_requires_size, false) or (v_size is not null and v_size !~ '^(5|6|7|8|9|10)$') then
      v_size := null;
    end if;

    update public.products set stock = stock - v_qty where id = v_product.id;

    insert into public.order_items (order_id, product_id, product_name, product_image, unit_price, quantity, line_total, size)
    values (v_order_id, v_product.id, v_product.name, v_product.images[1], v_product.price, v_qty, v_product.price * v_qty, v_size);

    v_subtotal := v_subtotal + v_product.price * v_qty;
    v_count := v_count + v_qty;
  end loop;

  update public.orders set subtotal = v_subtotal, total = v_subtotal + shipping where id = v_order_id;

  insert into public.notifications (type, title, message, order_id)
  values ('new_order', 'Nouvelle commande ' || v_number, v_name || ' · ' || v_count || ' article(s)' || coalesce(' · ' || nullif(v_city, ''), ''), v_order_id);

  return json_build_object('id', v_order_id, 'order_number', v_number);
end;
$$;

grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;


-- =====================================================================
--  HADDAJ BIJOUTERIE — Ordre d'affichage des sections de l'accueil
--  (« Les plus vendus » et « Nouveautés »), réglé dans Admin → Page d'accueil.
--  À exécuter une fois dans Supabase → SQL Editor (ré-exécutable).
-- =====================================================================

alter table public.products add column if not exists featured_rank int;
alter table public.products add column if not exists new_rank int;


-- =====================================================================
--  HADDAJ BIJOUTERIE — Livraison gratuite ou payante, produit par produit
--  Produit non coché « Livraison gratuite » => 25 DH de livraison ajoutés
--  une seule fois à la commande. À exécuter une fois dans Supabase →
--  SQL Editor (ré-exécutable).
-- =====================================================================

alter table public.products add column if not exists free_shipping boolean not null default true;

create or replace function public.place_order(p_customer jsonb, p_items jsonb)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_number text;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty int;
  v_subtotal numeric(12, 2) := 0;
  v_count int := 0;
  v_size text;
  v_requires_size boolean;
  v_paid_shipping boolean := false;
  v_name text := left(trim(coalesce(p_customer ->> 'full_name', '')), 120);
  v_email text := nullif(lower(left(trim(coalesce(p_customer ->> 'email', '')), 160)), '');
  v_phone text := left(trim(coalesce(p_customer ->> 'phone', '')), 40);
  v_address text := left(trim(coalesce(p_customer ->> 'address', '')), 300);
  v_city text := left(trim(coalesce(p_customer ->> 'city', '')), 80);
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Votre panier est vide.';
  end if;
  if jsonb_array_length(p_items) > 50 then
    raise exception 'Votre panier contient trop d''articles.';
  end if;
  if v_name = '' or v_phone = '' or v_address = '' then
    raise exception 'Merci de compléter vos informations de livraison.';
  end if;
  -- L'e-mail est facultatif : vérifié seulement s'il est fourni
  if v_email is not null and v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Adresse e-mail invalide.';
  end if;

  v_number := 'HD-' || nextval('public.order_number_seq');

  insert into public.orders (
    order_number, user_id, customer_name, email, phone, address, city, postal_code, country, notes,
    receipt_name, show_price_on_receipt, is_gift
  )
  values (
    v_number, auth.uid(), v_name, v_email, v_phone, v_address, nullif(v_city, ''),
    nullif(left(trim(coalesce(p_customer ->> 'postal_code', '')), 20), ''),
    coalesce(nullif(left(trim(coalesce(p_customer ->> 'country', '')), 60), ''), 'Maroc'),
    nullif(left(trim(coalesce(p_customer ->> 'notes', '')), 1000), ''),
    nullif(left(trim(coalesce(p_customer ->> 'receipt_name', '')), 120), ''),
    coalesce((p_customer ->> 'show_price_on_receipt')::boolean, true),
    coalesce((p_customer ->> 'is_gift')::boolean, false)
  )
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, least(coalesce((v_item ->> 'quantity')::int, 1), 20));

    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid and is_active
    for update;

    if not found then
      raise exception 'Un article de votre panier n''est plus disponible.';
    end if;
    if v_product.stock < v_qty then
      raise exception 'Stock insuffisant pour « % » (il en reste %).', v_product.name, greatest(v_product.stock, 0);
    end if;

    -- Taille facultative (5 à 10), proposée pour les collections qui ont l'option
    v_requires_size := false;
    select coalesce(c.requires_size, false) into v_requires_size from public.collections c where c.id = v_product.collection_id;
    v_size := nullif(trim(coalesce(v_item ->> 'size', '')), '');
    if not coalesce(v_requires_size, false) or (v_size is not null and v_size !~ '^(5|6|7|8|9|10)$') then
      v_size := null;
    end if;

    update public.products set stock = stock - v_qty where id = v_product.id;

    insert into public.order_items (order_id, product_id, product_name, product_image, unit_price, quantity, line_total, size)
    values (v_order_id, v_product.id, v_product.name, v_product.images[1], v_product.price, v_qty, v_product.price * v_qty, v_size);

    v_subtotal := v_subtotal + v_product.price * v_qty;
    if not coalesce(v_product.free_shipping, true) then
      v_paid_shipping := true;
    end if;
    v_count := v_count + v_qty;
  end loop;

  -- Frais de livraison : 25 DH si au moins un produit n'a pas la livraison gratuite
  update public.orders
  set subtotal = v_subtotal,
      shipping = case when v_paid_shipping then 25 else 0 end,
      total = v_subtotal + case when v_paid_shipping then 25 else 0 end
  where id = v_order_id;

  insert into public.notifications (type, title, message, order_id)
  values ('new_order', 'Nouvelle commande ' || v_number, v_name || ' · ' || v_count || ' article(s)' || coalesce(' · ' || nullif(v_city, ''), ''), v_order_id);

  return json_build_object('id', v_order_id, 'order_number', v_number);
end;
$$;

grant execute on function public.place_order(jsonb, jsonb) to anon, authenticated;


-- =====================================================================
--  COLLECTIONS DE DÉPART (modifiables ou supprimables dans l'admin)
-- =====================================================================
insert into public.collections (name, slug, description, image_url, is_featured, sort_order) values
  ('Bagues', 'bagues', 'Bagues en or pour tous les jours et les grandes occasions.', 'https://images.unsplash.com/photo-1598560917807-1bae44bd2be8', true, 1),
  ('Colliers', 'colliers', 'Colliers et pendentifs en or, fins ou plus présents.', 'https://images.unsplash.com/photo-1611085583191-a3b181a88401', true, 2),
  ('Bracelets', 'bracelets', 'Gourmettes, joncs et bracelets en or.', 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a', true, 3),
  ('Boucles d''oreilles', 'boucles-oreilles', 'Créoles, puces et pendants en or.', 'https://images.unsplash.com/photo-1600721391776-b5cd0e0048f9', true, 4),
  ('Parures', 'parures', 'Parures assorties pour les fêtes et les mariages.', 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed', true, 5)
on conflict (slug) do nothing;

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
