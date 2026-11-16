-- =====================================================================
--  HADDAJ BIJOUTERIE — Choix de taille (5 à 10, facultatif) par collection
--  Option « Proposer le choix de la taille » dans Admin → Collections ;
--  la taille choisie (si le client en choisit une) est enregistrée avec l'article.
--  À exécuter une fois dans Supabase → SQL Editor (ré-exécutable).
-- =====================================================================

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
