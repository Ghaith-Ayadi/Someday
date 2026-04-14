# Anderson 1.2 — Supabase Sync + Auth

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Device A    │     │  Supabase   │     │  Device B   │
│  (IndexedDB) │────▶│  (Postgres) │◀────│  (IndexedDB) │
│  Dexie.js    │     │  + Auth     │     │  Dexie.js    │
└─────────────┘     └─────────────┘     └─────────────┘

Reads: ALWAYS from IndexedDB. Never from Supabase (except FTUX).
Writes: IndexedDB first (instant), then background push to Supabase.
```

## Hosting

- **Frontend:** Vercel (free, auto-deploy from GitHub)
- **Backend:** Supabase (free tier: 500MB Postgres, Auth, 200 realtime connections)
- **Total cost:** $0

## Schema

### Supabase `watchlist_items` table

```sql
create table watchlist_items (
  id text primary key,              -- "{mediaType}-{tmdbId}"
  user_id uuid not null references auth.users(id),
  imdb_id text not null,
  media_type text not null,         -- "movie" | "tv"
  title text not null,
  poster_url text,
  overview text,
  release_date text,
  vote_average real,
  genres text[],                    -- postgres array
  status text not null default 'watchlist',  -- "watchlist" | "watched"
  added_at bigint not null,
  watched_at bigint,
  deleted_at bigint,                -- soft delete timestamp (null = active)
  updated_at bigint not null,       -- last modification timestamp
  -- Rich metadata
  director text,
  actors text,
  runtime text,
  rated text,
  writer text,
  language text,
  awards text,
  metascore text,
  imdb_rating text,
  rotten_tomatoes text,
  box_office text,

  unique(user_id, id)
);

-- RLS: users can only access their own rows
alter table watchlist_items enable row level security;
create policy "Users access own items" on watchlist_items
  for all using (auth.uid() = user_id);

-- Index for sync pulls
create index idx_watchlist_updated on watchlist_items(user_id, updated_at);

-- Cleanup: hard delete soft-deleted items older than 30 days
-- Run via Supabase pg_cron or a scheduled edge function
```

### Dexie schema changes

Add to `WatchlistItem` type:
```typescript
updatedAt: number;   // timestamp of last local change (ALREADY EXISTS as addedAt pattern)
syncedAt?: number;   // timestamp of last successful push to Supabase
deletedAt?: number;  // soft delete timestamp (null = active)
```

Bump Dexie version to 3:
```typescript
this.version(3).stores({
  items: "id, imdbId, mediaType, status, addedAt, updatedAt, *genres",
  syncMeta: "key",  // stores lastPullTimestamp, userId
});
```

## Sync Logic

### New file: `src/lib/sync.ts` (~150 lines)

```
Constants:
  SYNC_DEBOUNCE = 2000ms
  CLEANUP_THRESHOLD = 30 days

State (in syncMeta table):
  lastPullTimestamp: number  -- last time we pulled from Supabase
  userId: string             -- logged-in user ID

On every local write (add, update, delete):
  1. Set item.updatedAt = Date.now()
  2. For deletes: set item.deletedAt = Date.now() (don't remove from Dexie)
  3. Save to Dexie
  4. Schedule background sync (debounced 2s)

Background sync():
  PUSH phase:
    - Query Dexie: items where updatedAt > syncedAt (or syncedAt is null)
    - Batch upsert to Supabase (supabase.from('watchlist_items').upsert([...]))
    - On success: update syncedAt = Date.now() for each pushed item

  PULL phase:
    - Query Supabase: items where updated_at > lastPullTimestamp AND user_id = me
    - For each pulled item:
      - If local item exists AND local updatedAt > pulled updatedAt → skip (local wins)
      - Otherwise → upsert into Dexie
    - Update lastPullTimestamp = max(pulled updated_at values)

  CLEANUP phase (runs once per session):
    - Delete from Dexie where deletedAt is set AND deletedAt < (now - 30 days)
    - These are already synced and old enough that all devices have seen them

FTUX (first login on new device):
  - Pull ALL items from Supabase where user_id = me AND deleted_at IS NULL
  - Bulk insert into Dexie
  - Set lastPullTimestamp = now
```

### New file: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### New file: `src/hooks/use-sync.ts`

```typescript
// Hook that:
// 1. On mount: checks if user is logged in
// 2. If logged in and first time on this device: runs FTUX pull
// 3. If logged in and has local data: runs background sync
// 4. Exposes: { isSyncing, lastSyncedAt, syncNow }
// 5. Re-syncs on window focus (user switches back to the app)
```

## Auth

### Supabase Auth (built-in, no extra service)

Supported methods:
- Email + password (simplest)
- Magic link (email OTP)
- Google OAuth (if you want)

### New file: `src/providers/auth-provider.tsx`

```typescript
// Context that exposes:
// { user, isLoading, signIn, signUp, signOut }
// Wraps supabase.auth.onAuthStateChange()
// When user signs in → trigger FTUX or sync
// When user signs out → keep local data (offline still works)
```

### UI changes

- Add sign-in/sign-up to the options sheet (or a separate auth page)
- Show sync status indicator in header (subtle dot or icon)
- "Sign in to sync across devices" prompt in options sheet when not logged in
- App works fully without auth — auth is optional, just enables sync

## File Changes Summary

### New files:
| File | Purpose |
|------|---------|
| `src/lib/supabase.ts` | Supabase client init |
| `src/lib/sync.ts` | Push/pull/FTUX sync logic |
| `src/hooks/use-sync.ts` | React hook for sync lifecycle |
| `src/providers/auth-provider.tsx` | Auth context (sign in/out, user state) |
| `supabase/migrations/001_watchlist.sql` | DB schema |

### Modified files:
| File | Changes |
|------|---------|
| `src/types/watchlist.ts` | Add `updatedAt`, `syncedAt`, `deletedAt` fields |
| `src/lib/db.ts` | Bump to v3, add `syncMeta` table |
| `src/hooks/use-watchlist.ts` | Set `updatedAt` on all writes, soft delete instead of hard delete, filter out `deletedAt` items in queries |
| `src/main.tsx` | Wrap with AuthProvider |
| `src/components/app/options-sheet.tsx` | Add auth section (sign in/out) + sync status |
| `src/components/app/app-layout.tsx` | Sync status indicator |
| `package.json` | Add `@supabase/supabase-js` |
| `.env` / `.env.example` | Add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| `vite.config.ts` | Remove `/tmdb` proxy (TMDB works directly in production) |

### Vercel deployment:
| File | Purpose |
|------|---------|
| `vercel.json` | SPA rewrites (all routes → index.html) |

## Implementation Order

1. Create Supabase project + run migration
2. Install `@supabase/supabase-js`, create client
3. Add auth provider + sign-in UI
4. Update Dexie schema (v3 with syncMeta + new fields)
5. Update write functions (set updatedAt, soft delete)
6. Build sync.ts (push, pull, FTUX)
7. Build use-sync hook (lifecycle, window focus re-sync)
8. Add sync status to UI
9. Deploy frontend to Vercel
10. Test cross-device sync

## Edge Cases

- **Offline for 30+ days:** Soft-deleted items get hard-deleted. On next sync, device does a full FTUX-style pull to reconcile.
- **Two devices add same movie:** Same composite ID → last-write-wins on Supabase upsert. Both end up with the latest version.
- **Sign out:** Local data stays. App works offline. Sign back in → sync resumes.
- **New device:** FTUX pull gets everything. Fast (one query).
- **Supabase down:** App works normally (local-first). Sync retries on next attempt.
