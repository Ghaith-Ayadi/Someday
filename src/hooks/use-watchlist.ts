import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { scheduleSync } from "@/lib/sync";
import type { TmdbSearchResult } from "@/lib/tmdb";
import { extractCast, extractDirector, extractRating, extractRuntime, getDetails, posterUrl, toMediaType } from "@/lib/tmdb";
import type { Genre, MediaType, WatchlistItem, WatchStatus } from "@/types/watchlist";
import { buildId, TMDB_GENRE_MAP } from "@/types/watchlist";

const isActive = (i: WatchlistItem) => !i.deletedAt;

/** Reactive query for watchlist items, filtered by media type and optionally by genres */
export function useWatchlistItems(mediaType: MediaType, genreFilter?: Genre[]) {
    return useLiveQuery(
        () => {
            return db.items
                .where("mediaType")
                .equals(mediaType)
                .toArray()
                .then((items) => {
                    let filtered = items.filter(isActive);
                    if (genreFilter && genreFilter.length > 0) {
                        filtered = filtered.filter((item) => item.genres.some((g) => genreFilter.includes(g)));
                    }
                    return filtered.sort((a, b) => b.addedAt - a.addedAt);
                });
        },
        [mediaType, genreFilter],
        [] as WatchlistItem[],
    );
}

/** Get counts per filter option (movies and series) for filter UI */
export function useFilterCounts() {
    return useLiveQuery(
        async () => {
            const items = (await db.items.toArray()).filter(isActive);
            const counts = new Map<string, { movies: number; series: number }>();

            for (const status of ["watchlist", "watched"] as WatchStatus[]) {
                const key = `status:${status}`;
                counts.set(key, {
                    movies: items.filter((i) => i.status === status && i.mediaType === "movie").length,
                    series: items.filter((i) => i.status === status && i.mediaType === "tv").length,
                });
            }

            const allGenres: Genre[] = ["action", "comedy", "drama", "thriller", "horror", "sci-fi", "romance", "animation", "documentary", "fantasy"];
            for (const genre of allGenres) {
                const key = `genre:${genre}`;
                counts.set(key, {
                    movies: items.filter((i) => i.genres.includes(genre) && i.mediaType === "movie").length,
                    series: items.filter((i) => i.genres.includes(genre) && i.mediaType === "tv").length,
                });
            }

            return counts;
        },
        [],
        new Map<string, { movies: number; series: number }>(),
    );
}

/** Get all watchlist item IDs as a Set for fast lookup */
export function useWatchlistIds() {
    return useLiveQuery(
        async () => {
            const items = (await db.items.toArray()).filter(isActive);
            return new Set(items.map((item) => item.id));
        },
        [],
        new Set<string>(),
    );
}

/** Get a map of watchlist item IDs to their status for search result markers */
export function useWatchlistStatusMap() {
    return useLiveQuery(
        async () => {
            const items = (await db.items.toArray()).filter(isActive);
            const map = new Map<string, WatchStatus>();
            for (const item of items) map.set(item.id, item.status);
            return map;
        },
        [],
        new Map<string, WatchStatus>(),
    );
}

/** Get counts per media type */
export function useWatchlistCounts() {
    return useLiveQuery(
        async () => {
            const items = (await db.items.toArray()).filter(isActive);
            return {
                movies: items.filter((i) => i.mediaType === "movie").length,
                tv: items.filter((i) => i.mediaType === "tv").length,
            };
        },
        [],
        { movies: 0, tv: 0 },
    );
}

/** Map TMDB genre IDs to our genre categories */
function mapGenres(genreIds: number[]): Genre[] {
    const genres = new Set<Genre>();
    for (const id of genreIds) {
        const genre = TMDB_GENRE_MAP[id];
        if (genre) genres.add(genre);
    }
    return Array.from(genres);
}

/** Add a TMDB search result to the watchlist. Fetches details for rich metadata. */
export async function addToWatchlist(result: TmdbSearchResult) {
    const mediaType = toMediaType(result.media_type as "movie" | "tv");
    const id = buildId(mediaType, String(result.id));
    const now = Date.now();

    const item: WatchlistItem = {
        id,
        imdbId: String(result.id),
        mediaType,
        title: result.title || result.name || "Unknown",
        posterUrl: posterUrl(result.poster_path),
        overview: result.overview,
        releaseDate: (result.release_date || result.first_air_date || "").slice(0, 4),
        voteAverage: result.vote_average,
        genres: mapGenres(result.genre_ids),
        status: "watchlist",
        addedAt: now,
        updatedAt: now,
    };

    try {
        const detail = await getDetails(mediaType, result.id);
        if (detail) {
            item.director = extractDirector(detail);
            item.actors = extractCast(detail);
            item.runtime = extractRuntime(detail);
            item.rated = extractRating(detail, mediaType);
            item.imdbRating = detail.vote_average ? String(detail.vote_average.toFixed(1)) : undefined;
            if (detail.overview) item.overview = detail.overview;
            if (detail.genres.length > 0) {
                item.genres = mapGenres(detail.genres.map((g) => g.id));
            }
        }
    } catch {
        // Silently fail — we still add with basic info from search
    }

    await db.items.put(item);
    scheduleSync();
    return item;
}

/** Add a manual entry (no TMDB lookup), for offline or unlisted items. */
export async function addManualToWatchlist(input: {
    title: string;
    mediaType: MediaType;
    releaseDate?: string;
    genres?: Genre[];
}) {
    const now = Date.now();
    const uuid = crypto.randomUUID();
    const item: WatchlistItem = {
        id: `manual-${uuid}`,
        imdbId: "",
        mediaType: input.mediaType,
        title: input.title,
        posterUrl: null,
        overview: "",
        releaseDate: input.releaseDate ?? "",
        voteAverage: 0,
        genres: input.genres ?? [],
        status: "watchlist",
        addedAt: now,
        updatedAt: now,
        manual: true,
    };
    await db.items.put(item);
    scheduleSync();
    return item;
}

/** Mark an item as watched */
export async function markAsWatched(id: string) {
    const now = Date.now();
    await db.items.update(id, { status: "watched" as WatchStatus, watchedAt: now, updatedAt: now });
    scheduleSync();
}

/** Revert an item to watchlist (unwatched) */
export async function markAsUnwatched(id: string) {
    const now = Date.now();
    await db.items.update(id, { status: "watchlist" as WatchStatus, watchedAt: undefined, updatedAt: now });
    scheduleSync();
}

/** Remove an item from the watchlist (soft delete — pruned after 30 days of being synced) */
export async function removeFromWatchlist(id: string) {
    const now = Date.now();
    await db.items.update(id, { deletedAt: now, updatedAt: now });
    scheduleSync();
}
