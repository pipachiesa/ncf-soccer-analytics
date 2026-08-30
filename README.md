# NCF Soccer Analytics

NCF Men's Soccer data portal for fixtures, player management, CSV event imports,
and match analytics.

## Local development

1. Copy `.env.local.example` to `.env.local` and configure the Supabase values.
2. Install dependencies with `npm install`.
3. Start the app with `npm run dev`.
4. Open `http://localhost:3000`.

## Environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NCF_CALENDAR_ICS_URL`
- `SITE_URL`

Database migrations are stored under `supabase/migrations/`.
