# Haddaj Bijouterie — boutique en ligne

Next.js 15 · Supabase · Tailwind. Boutique de bijoux avec panier, commande express (paiement à la livraison),
espace client, et administration (produits, collections, commandes, livraisons, statistiques).

## Installation

1. `npm install`
2. Copier `.env.example` en `.env.local` et renseigner l'URL et les clés Supabase.
3. Supabase → **SQL Editor** : exécuter `supabase/installation.sql` (une seule fois).
4. Créer le compte administrateur : `npm run create-admin` (utilise `ADMIN_EMAIL` / `ADMIN_PASSWORD` de `.env.local`).
5. `npm run dev` puis http://localhost:3000 — l'admin est sur `/admin`.

## Personnaliser

- Coordonnées, horaires, réseaux sociaux : `lib/constants.ts`
- Photos de l'accueil : `public/images/hero-1.jpg` … `hero-4.jpg` et `editorial.jpg` (gardez les mêmes noms)
- Logo : `public/logo.png`, `public/logo-light.png`, `public/logo-mark.png`, icône `app/icon.png`

## Déploiement (Vercel)

Variables : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`
(+ `SMTP_USER`, `SMTP_PASS` pour les e-mails de confirmation, `NEXT_PUBLIC_META_PIXEL_ID` si besoin).
Ne jamais mettre la clé secrète (`sb_secret_…`) sur Vercel ni dans le code.
