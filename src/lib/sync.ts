import { db } from "@/lib/db";
import { pb, pbDateToMs } from "@/lib/pocketbase";
import type { Genre, MediaType, WatchStatus, WatchlistItem } from "@/types/watchlist";

// Sync between the local Dexie cache and PocketBase.
//
// Dexie is what the UI reads; the server is the source of truth. Clients push
// optimistically, then pull anything whose `updated` is newer than the last
// pull. PocketBase manages `updated`, so conflicts resolve by server clock,
// exactly as `updated_at` did before.
//
// Identity: the app's own item id ("movie-123", "manual-<uuid>") lives in
// `client_id` on the server and stays the Dexie key. PocketBase's record id is
// kept on the item as `remoteId` so updates need no lookup.

const LAST_PULL_KEY = "lastPullPb";
const DEBOUNCE_MS = 500;
const CLEANUP_DAYS = 30;

let currentUserId: string | null = null;
let syncInFlight = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let onSyncComplete: (() => void) | null = null;

/** A `watchlist_items` record as PocketBase returns it. Empty text is "", empty number 0, empty date "". */
export interface WatchlistRecord {
    id: string;
    user: string;
    client_id: string;
    imdb_id: string;
    media_type: MediaType;
    title: string;
    poster_url: string;
    overview: string;
    release_date: string;
    vote_average: number;
    genres: Genre[] | null;
    status: WatchStatus;
    added_at: number;
    watched_at: number;
    deleted_at: string;
    manual: boolean;
    director: string;
    actors: string;
    runtime: string;
    rated: string;
    writer: string;
    language: string;
    awards: string;
    metascore: string;
    imdb_rating: string;
    rotten_tomatoes: string;
    box_office: string;
    created: string;
    updated: string;
}

function toRecord(item: WatchlistItem, userId: string) {
    return {
        user: userId,
        client_id: item.id,
        imdb_id: item.imdbId || "",
        media_type: item.mediaType,
        title: item.title,
        poster_url: item.posterUrl ?? "",
        overview: item.overview ?? "",
        release_date: item.releaseDate ?? "",
        vote_average: item.voteAverage ?? 0,
        genres: item.genres ?? [],
        status: item.status,
        added_at: item.addedAt,
        watched_at: item.watchedAt ?? null,
        deleted_at: item.deletedAt ? new Date(item.deletedAt).toISOString() : "",
        manual: item.manual ?? false,
        director: item.director ?? "",
        actors: item.actors ?? "",
        runtime: item.runtime ?? "",
        rated: item.rated ?? "",
        writer: item.writer ?? "",
        language: item.language ?? "",
        awards: item.awards ?? "",
        metascore: item.metascore ?? "",
        imdb_rating: item.imdbRating ?? "",
        rotten_tomatoes: item.rottenTomatoes ?? "",
        box_office: item.boxOffice ?? "",
    };
}

const text = (v: string) => v || undefined;

export function fromRecord(r: WatchlistRecord): WatchlistItem {
    return {
        id: r.client_id,
        remoteId: r.id,
        imdbId: r.imdb_id ?? "",
        mediaType: r.media_type,
        title: r.title,
        posterUrl: r.poster_url || null,
        overview: r.overview ?? "",
        releaseDate: r.release_date ?? "",
        voteAverage: r.vote_average ?? 0,
        genres: r.genres ?? [],
        status: r.status,
        addedAt: Number(r.added_at),
        watchedAt: r.watched_at ? Number(r.watched_at) : undefined,
        deletedAt: pbDateToMs(r.deleted_at) ?? undefined,
        updatedAt: pbDateToMs(r.updated) ?? Date.now(),
        manual: r.manual,
        director: text(r.director),
        actors: text(r.actors),
        runtime: text(r.runtime),
        rated: text(r.rated),
        writer: text(r.writer),
        language: text(r.language),
        awards: text(r.awards),
        metascore: text(r.metascore),
        imdbRating: text(r.imdb_rating),
        rottenTomatoes: text(r.rotten_tomatoes),
        boxOffice: text(r.box_office),
    };
}

export function setSyncUser(userId: string | null) {
    currentUserId = userId;
}

export function setSyncListener(listener: (() => void) | null) {
    onSyncComplete = listener;
}

export function scheduleSync() {
    if (!currentUserId) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        void runSync();
    }, DEBOUNCE_MS);
}

export async function runSync(): Promise<void> {
    if (!currentUserId || syncInFlight) return;
    syncInFlight = true;
    try {
        await pushPending(currentUserId);
        await pullChanges(currentUserId);
        await cleanupOldDeletes();
        onSyncComplete?.();
    } catch (err) {
        console.error("Sync failed:", err);
    } finally {
        syncInFlight = false;
    }
}

const items = () => pb.collection<WatchlistRecord>("watchlist_items");

async function pushPending(userId: string) {
    const all = await db.items.toArray();
    const pending = all.filter((item) => !item.syncedAt || item.updatedAt > item.syncedAt);
    if (!pending.length) return;

    for (const item of pending) {
        const body = toRecord(item, userId);
        let saved: WatchlistRecord;
        try {
            if (item.remoteId) {
                saved = await items().update(item.remoteId, body);
            } else {
                // First push of this item from this device. Another device may
                // already have created it: (user, client_id) is unique server-side.
                const existing = await items()
                    .getFirstListItem(pb.filter("user = {:u} && client_id = {:c}", { u: userId, c: item.id }))
                    .catch(() => null);
                saved = existing ? await items().update(existing.id, body) : await items().create(body);
            }
        } catch (err) {
            console.error("Push failed:", item.id, err);
            continue;
        }
        const serverItem = fromRecord(saved);
        await db.items.put({ ...serverItem, syncedAt: Date.now() });
    }
}

async function pullChanges(userId: string) {
    const meta = await db.syncMeta.get(LAST_PULL_KEY);
    const since = typeof meta?.value === "string" ? meta.value : "1970-01-01T00:00:00.000Z";

    let records: WatchlistRecord[];
    try {
        records = await items().getFullList({
            filter: pb.filter("user = {:u} && updated > {:since}", { u: userId, since: new Date(since) }),
            sort: "updated",
        });
    } catch (err) {
        console.error("Pull failed:", err);
        return;
    }
    if (!records.length) return;

    const now = Date.now();
    let maxMs = Date.parse(since);
    await db.transaction("rw", db.items, async () => {
        for (const r of records) {
            const ms = pbDateToMs(r.updated) ?? 0;
            if (ms > maxMs) maxMs = ms;
            await db.items.put({ ...fromRecord(r), syncedAt: now });
        }
    });
    await db.syncMeta.put({ key: LAST_PULL_KEY, value: new Date(maxMs).toISOString() });
}

async function cleanupOldDeletes() {
    const cutoff = Date.now() - CLEANUP_DAYS * 24 * 60 * 60 * 1000;
    const stale = await db.items
        .filter((i) => !!i.deletedAt && i.deletedAt < cutoff)
        .primaryKeys();
    if (stale.length) {
        await db.items.bulkDelete(stale);
    }
}

export async function resetSyncState() {
    await db.syncMeta.clear();
    await db.items.clear();
}
