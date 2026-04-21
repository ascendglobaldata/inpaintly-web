# Inpaintly — web app

Next.js 14 App Router app. Deploys to Vercel at `app.inpaintly.app`.

## Stack

- Next.js 14.2 (App Router, Node runtime for API routes)
- Supabase (auth + Postgres + Storage) via `@supabase/ssr`
- Replicate (SDXL Inpainting)
- LemonSqueezy **or** Paddle — switched by `PAYMENT_PROVIDER` env var
- Tailwind for styling

## Local dev

```bash
cd web
cp .env.local.example .env.local   # fill in real values
npm install
npm run dev
```

Open http://localhost:3000. Magic-link login goes to your Supabase project.

## Required env vars

See `.env.local.example`. Minimum to boot:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REPLICATE_API_TOKEN`
- `NEXT_PUBLIC_APP_URL` (e.g. `https://app.inpaintly.app`)
- `PAYMENT_PROVIDER` = `lemonsqueezy` or `paddle`

Then either the LS set (`LEMONSQUEEZY_*`) or the Paddle set (`PADDLE_*`).

## Database

Run the SQL files in `../supabase/migrations/` in order in the Supabase
Dashboard → SQL Editor:

1. `001_init.sql` — tables, RLS, RPCs, storage buckets
2. `002_provider_agnostic.sql` — payment-provider columns + RPC signatures

## Deploy

1. Push this folder to a GitHub repo.
2. Import into Vercel. Root directory: `web`.
3. Add all env vars from `.env.local.example`.
4. Set custom domain `app.inpaintly.app`.
5. In Supabase, add the following to Auth → URL Configuration:
   - Site URL: `https://app.inpaintly.app`
   - Redirect URLs: `https://app.inpaintly.app/auth/callback`

## Webhook endpoints

Configure **one** of these with the matching provider:

- LemonSqueezy → `https://app.inpaintly.app/api/webhooks/lemonsqueezy`
  - Event: `order_created`
  - Secret: set as `LEMONSQUEEZY_WEBHOOK_SECRET`
- Paddle → `https://app.inpaintly.app/api/webhooks/paddle`
  - Event: `transaction.completed`
  - Notification key: set as `PADDLE_NOTIFICATION_KEY`

## Switching payment providers

Both providers are already implemented. To switch:

1. Change `PAYMENT_PROVIDER` env var in Vercel.
2. Redeploy.

That's it. No code changes.

## Folder structure

```
web/
  public/              manifest, icons, favicon
  src/
    app/
      page.tsx         / splash
      login/           magic link flow
      auth/callback/   OAuth/PKCE exchange
      studio/          upload → mask → theme → generate → result
      buy/             pack cards → checkout
      account/         credits, history, sign out
      api/
        generate/      calls Replicate, charges credits
        checkout/      creates payment provider checkout
        webhooks/
          lemonsqueezy/
          paddle/
    components/        UploadZone, MaskCanvas, ThemePicker, ResultView, Button
    lib/
      supabase/        client + server + admin factories
      payments/        index (abstract), lemonsqueezy, paddle
      replicate.ts     runInpaint()
      mask.ts          noop dilation for v1
      themes.json      weekly theme packs
      utils.ts         PACKS constants, cn()
    middleware.ts      auth gate
```
