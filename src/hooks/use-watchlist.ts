import { useLiveQuery } from "dexie-react-hooks";
import type { TmdbSearchResult } from "@/lib/tmdb";
import { extractCast, extractDirector, extractRating, extractRuntime, getDetails, posterUrl, toMediaType } from "@/lib/tmdb";
import { db } from "@/lib/db";
import type { Genre, MediaType, WatchlistItem, WatchStatus } from "@/types/watchlist";
import { buildId, TMDB_GENRE_MAP } from "@/types/watchlist";

/** Reactive query for watchlist items, filtered by media type and optionally by genres */
export function useWatchlistItems(mediaType: MediaType, genreFilter?: Genre[]) {
    return useLiveQuery(
        () => {
            return db.items
                .where("mediaType")
                .equals(mediaType)
                .toArray()
                .then((items) => {
                    let filtered = items;
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
            const items = await db.items.toArray();
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
            const items = await db.items.toArray();
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
            const items = await db.items.toArray();
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
            const movies = await db.items.where("mediaType").equals("movie").count();
            const tv = await db.items.where("mediaType").equals("tv").count();
            return { movies, tv };
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

    // Basic info from search result
    const item: WatchlistItem = {
        id,
        imdbId: String(result.id), // using tmdb ID
        mediaType,
        title: result.title || result.name || "Unknown",
        posterUrl: posterUrl(result.poster_path),
        overview: result.overview,
        releaseDate: (result.release_date || result.first_air_date || "").slice(0, 4),
        voteAverage: result.vote_average,
        genres: mapGenres(result.genre_ids),
        status: "watchlist",
        addedAt: Date.now(),
    };

    // Fetch detail for rich metadata
    try {
        const detail = await getDetails(mediaType, result.id);
        if (detail) {
            item.director = extractDirector(detail);
            item.actors = extractCast(detail);
            item.runtime = extractRuntime(detail);
            item.rated = extractRating(detail, mediaType);
            item.imdbRating = detail.vote_average ? String(detail.vote_average.toFixed(1)) : undefined;
            if (detail.overview) item.overview = detail.overview;
            // Use detail genres (full names) if available
            if (detail.genres.length > 0) {
                item.genres = mapGenres(detail.genres.map((g) => g.id));
            }
        }
    } catch {
        // Silently fail — we still add with basic info from search
    }

    await db.items.put(item);
    return item;
}

/** Mark an item as watched */
export async function markAsWatched(id: string) {
    await db.items.update(id, { status: "watched" as WatchStatus, watchedAt: Date.now() });
}

/** Revert an item to watchlist (unwatched) */
export async function markAsUnwatched(id: string) {
    await db.items.update(id, { status: "watchlist" as WatchStatus, watchedAt: undefined });
}

/** Remove an item from the watchlist */
export async function removeFromWatchlist(id: string) {
    await db.items.delete(id);
}
