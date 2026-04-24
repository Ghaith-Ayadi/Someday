<p align="center">
  <img src="logo.png" width="128" height="128" alt="Someday" />
</p>

<h1 align="center">Someday</h1>

<p align="center">
  <strong>Keeping track of what to watch.</strong>
</p>

<p align="center">
  A personal movie and series tracker. Local-first, cloud-synced, installable as a PWA. Search, add, filter, sort — keyboard-driven on desktop, tap-friendly on mobile.
</p>

<p align="center">
  <a href="https://someday-watchlist.vercel.app/"><strong>Live app →</strong></a>
</p>

---

## Features

- **Cmd+K search** — instant search across TMDB, split by movies and series, poster preview on selection
- **Local-first** — IndexedDB via Dexie.js, sub-millisecond reads, works offline
- **Cloud sync** — optional sign-in with magic link or 6-digit code; your list follows you across devices
- **PWA** — installable on iOS/Android/desktop, offline after first load
- **Grid and list views** — toggle between poster cards and compact rows
- **Filters + sort** — by watch status, genre (10 categories), date added, name, year
- **Dark mode** — system or manual
- **Mobile-first** — bottom tabs, FAB, gestures; desktop adds the command palette

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + Untitled UI components (React Aria)
- Dexie.js (IndexedDB) for local data
- Supabase (Postgres + Auth) for sync
- TMDB API for search
- Vercel for hosting

## Local development

```bash
git clone https://github.com/Ghaith-Ayadi/Anderson.git
cd Anderson
npm install
```

Create a `.env` file with:

```
VITE_TMDB_ACCESS_TOKEN=your_tmdb_read_access_token
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

- TMDB token: free, sign up at https://www.themoviedb.org/settings/api
- Supabase: create a free project, copy URL + anon/publishable key from Settings → API
- Run the schema migration in `supabase/migrations/001_watchlist.sql` (SQL Editor in Supabase dashboard)

Start the dev server:

```bash
npm run dev
```

Open http://localhost:5173.

## Auth setup (optional, only if you enable sync)

1. In Supabase → Authentication → URL Configuration, set **Site URL** and add **Redirect URLs** for your dev + prod origins
2. In Authentication → Email Templates → Magic Link, paste the template in [`docs/magic-link-email.html`](docs/magic-link-email.html) so users get both a clickable link (for desktop) and a 6-digit code (for mobile PWAs)
3. If you expect real-world volume, swap Supabase's built-in SMTP for a provider like Resend to lift the ~3/hour send limit

## Architecture

- Writes are **optimistic**: IndexedDB first (instant UI), then a debounced background push to Supabase
- Reads **always** hit IndexedDB — the network is never on the render path
- The cloud is the source of truth; local is a cache that reconciles on sync
- The service worker serves hashed assets cache-first, HTML network-first (so new deploys land immediately)

## Deploy

Push to `main`; Vercel auto-deploys. Env vars live in Vercel project settings.
