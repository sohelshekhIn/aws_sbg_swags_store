# Swag Inventory — AWS Builder Group @ Sheridan

Track swag **stock**, **orders** (against a points budget that expires in 30 days),
and **giveaways**. Gated behind a shared PIN.

## Setup

1. **Create a Supabase project** → in the SQL editor, paste and run
   [`supabase/schema.sql`](supabase/schema.sql). This creates the tables, the
   `current_stock` view, and enables RLS (the app talks to the DB server-side
   with the service-role key, so no public policies are needed).

2. **Configure env** — copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project
     Settings → API). The service-role key is **server-only** — never commit it.
   - `APP_PIN` — the login PIN (default `000000`).
   - `SESSION_SECRET` — a long random string used to sign the session cookie.

3. **Run**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000 — you'll be sent to `/login`.

## How it works

- **Stock** (`/`) is computed live: received order lines add, giveaway lines
  subtract (`current_stock` SQL view). There is no stock counter to drift.
- **Items** (`/items`) — name, points "price", and optional sizes (t-shirts).
- **Orders** (`/orders`) — build an order against a points budget; a running
  total flags over/under and shows the 30-day expiry. Open it later and **Receive**
  it — "Mark all received" or edit per-line quantities (suppliers sometimes short
  or adjust the order) — which adds the received quantities to stock.
- **Giveaways** (`/giveaways`) — record who got what; quantities subtract from stock.
- **Auth** — PIN checked server-side; failed attempts are rate-limited to 3 per IP
  per 15 minutes via the `auth_attempts` table.

## Local dev with the Supabase CLI (optional)

Instead of a hosted project you can run Supabase locally (needs Docker):

```bash
npx supabase start        # boots the local stack, applies supabase/migrations
npx supabase status -o env # copy API_URL + SERVICE_ROLE_KEY into .env.local
npm run dev
```

`npx supabase stop` shuts it down (the local DB volume — and your data — persists).
