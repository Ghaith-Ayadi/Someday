import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import type { Genre, MediaType, WatchStatus, WatchlistItem } from "@/types/watchlist";

const LAST_PULL_KEY = "lastPullIso";
const DEBOUNCE_MS = 500;
const CLEANUP_DAYS = 30;

let currentUserId: string | null = null;
let syncInFlight = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let onSyncComplete: (() => void) | null = null;

export interface WatchlistRow {
    id: string;
    user_id: string;
    imdb_id: string | null;
    media_type: MediaType;
    title: string;
    poster_url: string | null;
    overview: string | null;
    release_date: string | null;
    vote_average: number | null;
    genres: Genre[] | null;
    status: WatchStatus;
    added_at: number;
    watched_at: number | null;
    deleted_at: string | null;
    updated_at: string;
    manual: boolean;
    director: string | null;
    actors: string | null;
    runtime: string | null;
    rated: string | null;
    writer: string | null;
    language: string | null;
    awards: string | null;
    metascore: string | null;
    imdb_rating: string | null;
    rotten_tomatoes: string | null;
    box_office: string | null;
}

function toRow(item: WatchlistItem, userId: string) {
    return {
        id: item.id,
        user_id: userId,
        imdb_id: item.imdbId || null,
        media_type: item.mediaType,
        title: item.title,
        poster_url: item.posterUrl,
        overview: item.overview,
        release_date: item.releaseDate,
        vote_average: item.voteAverage,
        genres: item.genres,
        status: item.status,
        added_at: item.addedAt,
        watched_at: item.watchedAt ?? null,
        deleted_at: item.deletedAt ? new Date(item.deletedAt).toISOString() : null,
        manual: item.manual ?? false,
        director: item.director ?? null,
        actors: item.actors ?? null,
        runtime: item.runtime ?? null,
        rated: item.rated ?? null,
        writer: item.writer ?? null,
        language: item.language ?? null,
        awards: item.awards ?? null,
        metascore: item.metascore ?? null,
        imdb_rating: item.imdbRating ?? null,
        rotten_tomatoes: item.rottenTomatoes ?? null,
        box_office: item.boxOffice ?? null,
    };
}

export function fromRow(row: WatchlistRow): WatchlistItem {
    return {
        id: row.id,
        imdbId: row.imdb_id ?? "",
        mediaType: row.media_type,
        title: row.title,
        posterUrl: row.poster_url,
        overview: row.overview ?? "",
        releaseDate: row.release_date ?? "",
        voteAverage: row.vote_average ?? 0,
        genres: row.genres ?? [],
        status: row.status,
        addedAt: Number(row.added_at),
        watchedAt: row.watched_at != null ? Number(row.watched_at) : undefined,
        deletedAt: row.deleted_at ? new Date(row.deleted_at).getTime() : undefined,
        updatedAt: new Date(row.updated_at).getTime(),
        manual: row.manual,
        director: row.director ?? undefined,
        actors: row.actors ?? undefined,
        runtime: row.runtime ?? undefined,
        rated: row.rated ?? undefined,
        writer: row.writer ?? undefined,
        language: row.language ?? undefined,
        awards: row.awards ?? undefined,
        metascore: row.metascore ?? undefined,
        imdbRating: row.imdb_rating ?? undefined,
        rottenTomatoes: row.rotten_tomatoes ?? undefined,
        boxOffice: row.box_office ?? undefined,
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

async function pushPending(userId: string) {
    const all = await db.items.toArray();
    const pending = all.filter((item) => !item.syncedAt || item.updatedAt > item.syncedAt);
    if (!pending.length) return;

    const rows = pending.map((item) => toRow(item, userId));
    const { data, error } = await supabase
        .from("watchlist_items")
        .upsert(rows)
        .select();
    if (error) {
        console.error("Push failed:", error);
        return;
    }

    const now = Date.now();
    await db.transaction("rw", db.items, async () => {
        for (const raw of data ?? []) {
            const serverItem = fromRow(raw as WatchlistRow);
            await db.items.put({ ...serverItem, syncedAt: now });
        }
    });
}

async function pullChanges(userId: string) {
    const meta = await db.syncMeta.get(LAST_PULL_KEY);
    const lastPullIso = typeof meta?.value === "string" ? meta.value : "1970-01-01T00:00:00.000Z";

    const { data, error } = await supabase
        .from("watchlist_items")
        .select("*")
        .eq("user_id", userId)
        .gt("updated_at", lastPullIso)
        .order("updated_at", { ascending: true });
    if (error) {
        console.error("Pull failed:", error);
        return;
    }
    if (!data?.length) return;

    const now = Date.now();
    let maxIso = lastPullIso;
    await db.transaction("rw", db.items, async () => {
        for (const raw of data) {
            const row = raw as WatchlistRow;
            if (row.updated_at > maxIso) maxIso = row.updated_at;
            const item = fromRow(row);
            await db.items.put({ ...item, syncedAt: now });
        }
    });
    await db.syncMeta.put({ key: LAST_PULL_KEY, value: maxIso });
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
