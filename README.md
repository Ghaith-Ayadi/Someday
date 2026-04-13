<p align="center">
  <img src="logo.png" width="128" height="128" alt="Anderson" />
</p>

<h1 align="center">Anderson</h1>

<p align="center">
  <strong>Keeping track of what to watch.</strong>
</p>

<p align="center">
  A personal movie and series tracker that runs entirely in the browser. Search, add, tag, filter, sort — all keyboard-driven, all local, no account needed.
</p>

---

## Why Anderson?

I keep forgetting what people recommend. Someone mentions a show at dinner, I think "I'll remember that" — I never do. I tried notes apps, spreadsheets, Letterboxd — all too heavy for what should be a 2-second action.

Anderson is the simplest version of this: press Cmd+K, search, hit Enter. Done. Your list is there when you come back. No sign-up, no sync, no loading screens. Everything lives in your browser's IndexedDB and survives restarts.

Named after Wes Anderson, obviously.

---

## Features

- **Cmd+K search** — instant search with a split view (movies on the left, series on the right, poster preview on selection)
- **Two tabs** — Movies and Series, with count badges
- **Grid and list views** — toggle between poster cards and compact rows
- **Filter** — by watch status (to watch / watched) and genre (10 categories)
- **Sort** — by name, year, genre, or watch status
- **Detail view** — click any item for poster, rating, genres, plot summary, and actions
- **Keyboard-first** — arrow keys navigate search results, Enter adds, Escape closes
- **Dark mode** — follows system or toggle manually
- **PWA** — installable, works offline for your existing library
- **Local-first** — IndexedDB via Dexie.js, sub-millisecond reads, no server

---

<p align="center">
  <img src="screenshot.png" width="800" alt="Anderson — movie and series tracker" />
</p>

---

## Installation

```bash
git clone https://github.com/Ghaith-Ayadi/watchlist.git
cd watchlist
npm install
```

Create a `.env` file with your [OMDb API key](https://www.omdbapi.com/apikey.aspx) (free, 1000 requests/day):

```
VITE_OMDB_API_KEY=your_key_here
```

Then:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## How It Works

1. **Search** — Cmd+K opens the search overlay. Queries hit the OMDb API with a 250ms debounce and AbortController to cancel stale requests. Results split into Movies and Series columns, with a live poster preview for the selected item.

2. **Add** — hitting Enter or clicking the + button fetches full details from OMDb (genre, plot, rating) and writes to IndexedDB via Dexie.js. The UI updates reactively through Dexie's `useLiveQuery`.

3. **Persistence** — everything is stored locally in IndexedDB with indexes on media type, status, genres, and timestamps. No server, no sync. Data survives refreshes, clears only if you clear browser storage.

4. **PWA** — a service worker caches the app shell and poster images (CacheFirst for images, NetworkFirst for API). The app is installable and your library works offline.

---

## Stack

- React 19 + TypeScript
- Tailwind CSS v4.2
- Dexie.js (IndexedDB)
- OMDb API
- Vite 8
- Untitled UI component library
