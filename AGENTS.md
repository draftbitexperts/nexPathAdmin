# NexPath Admin

Vite + React admin dashboard for managing NexPath resources.

## Setup

```bash
npm install
npm run dev
```

## Supabase

Public credentials live in `src/lib/supabase/config.ts`. Admin mutations run in the browser with the signed-in user's session. Ensure Supabase Row Level Security policies allow authenticated admin writes.

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — production build to `dist/`
- `npm run preview` — preview production build
