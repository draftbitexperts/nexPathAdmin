# NexPath Admin

Vite + React admin dashboard for managing NexPath resources.

## Setup

```bash
npm install
cp .env.example .env   # if needed
npm run dev
```

## Environment

Set these in `.env`:

- `VITE_PUBLIC_SUPABASE_URL`
- `VITE_PUBLIC_SUPABASE_ANON_KEY`

Admin mutations run in the browser with the signed-in user's session. Ensure Supabase Row Level Security policies allow authenticated admin writes.

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build
