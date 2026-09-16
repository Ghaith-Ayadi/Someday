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
- **Cloud sync** — optional sign-in with Google; your list follows you across devices
- **PWA** — installable on iOS/Android/desktop, offline after first load
- **Grid and list views** — toggle between poster cards and compact rows
- **Filters + sort** — by watch status, genre (10 categories), date added, name, year
- **Dark mode** — system or manual
- **Mobile-first** — bottom tabs, FAB, gestures; desktop adds the command palette

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4 + Untitled UI components (React Aria)
- Dexie.js (IndexedDB) for local data
- PocketBase for sync and auth, self-hosted on Bedrock ([Ghaith-Ayadi/Bedrock](https://github.com/Ghaith-Ayadi/Bedrock))
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
VITE_PB_URL=https://someday.ayadighaith.com
```

- TMDB token: free, sign up at https://www.themoviedb.org/settings/api
- PocketBase: the production instance runs on Bedrock. For a local one, run
  PocketBase with the schema from `pb/someday/pb_migrations/` in the Bedrock repo
  and point `VITE_PB_URL` at it. The old Supabase schema in `supabase/` is kept
  for reference only.

Start the dev server:

```bash
npm run dev
```

Open http://localhost:5173.

## Auth

Sign-in is Google only, handled by PocketBase's OAuth2 flow in a popup. The
Google client and its redirect URI live on the PocketBase host, so the app's
own origin needs no Google configuration. Configured on Bedrock, see its
`docs/auth.md`.

## Architecture

- Writes are **optimistic**: IndexedDB first (instant UI), then a debounced background push to PocketBase. Items keep their own id locally (`client_id` server-side) plus the PocketBase record id as `remoteId`
- Reads **always** hit IndexedDB — the network is never on the render path
- The cloud is the source of truth; local is a cache that reconciles on sync. Pulls ask for `updated > last pull`; live changes arrive over PocketBase's server-sent events
- The service worker serves hashed assets cache-first, HTML network-first (so new deploys land immediately)

## Deploy

Push to `main`; Vercel auto-deploys. Env vars live in Vercel project settings.
