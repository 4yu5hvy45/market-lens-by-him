# Market Lens Supabase setup

Run the two SQL migration files in `migrations/` in filename order, or use Supabase CLI migrations.

The app uses the server-only Supabase service/secret key for public read queries and admin writes. Never expose that key through a `VITE_*` variable.

Required Vercel variables:
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY` (or supported VITE/anon equivalent)
- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`
- `SESSION_SECRET`

Research and watchlist public reads are intentionally performed server-side so RLS/publishable-key configuration cannot blank the UI. Only published research and active watchlist rows are returned.
