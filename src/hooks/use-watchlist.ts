import { useLiveQuery } from "dexie-react-hooks";
import type { OmdbDetail, OmdbSearchItem } from "@/lib/tmdb";
import { getDetails, posterUrl, toMediaType } from "@/lib/tmdb";
import { db } from "@/lib/db";
import type { Genre, MediaType, WatchlistItem, WatchStatus } from "@/types/watchlist";
import { buildId, parseGenres } from "@/types/watchlist";

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

/** Add an OMDb search result to the watchlist. Fetches details for genre/plot info. */
export async function addToWatchlist(searchItem: OmdbSearchItem) {
    const mediaType = toMediaType(searchItem.Type);
    const id = buildId(mediaType, searchItem.imdbID);

    // Fetch details for genre, plot, and rich metadata
    let genres: Genre[] = [];
    let overview = "";
    let rating = 0;
    let director: string | undefined;
    let actors: string | undefined;
    let runtime: string | undefined;
    let rated: string | undefined;
    let writer: string | undefined;
    let language: string | undefined;
    let awards: string | undefined;
    let metascore: string | undefined;
    let imdbRating: string | undefined;
    let rottenTomatoes: string | undefined;
    let boxOffice: string | undefined;

    try {
        const detail = await getDetails(searchItem.imdbID);
        if (detail) {
            genres = parseGenres(detail.Genre);
            overview = detail.Plot !== "N/A" ? detail.Plot : "";
            rating = detail.imdbRating !== "N/A" ? parseFloat(detail.imdbRating) : 0;
            const na = (v: string) => (v && v !== "N/A" ? v : undefined);
            director = na(detail.Director);
            actors = na(detail.Actors);
            runtime = na(detail.Runtime);
            rated = na(detail.Rated);
            writer = na(detail.Writer);
            language = na(detail.Language);
            awards = na(detail.Awards);
            metascore = na(detail.Metascore);
            imdbRating = na(detail.imdbRating);
            const rt = detail.Ratings?.find((r: { Source: string }) => r.Source === "Rotten Tomatoes");
            rottenTomatoes = rt?.Value;
            boxOffice = na(detail.BoxOffice);
        }
    } catch {
        // Silently fail — we still add with basic info
    }

    const item: WatchlistItem = {
        id,
        imdbId: searchItem.imdbID,
        mediaType,
        title: searchItem.Title,
        posterUrl: posterUrl(searchItem.Poster),
        overview,
        releaseDate: searchItem.Year.slice(0, 4),
        voteAverage: rating,
        genres,
        director,
        actors,
        runtime,
        rated,
        writer,
        language,
        awards,
        metascore,
        imdbRating,
        rottenTomatoes,
        boxOffice,
        status: "watchlist",
        addedAt: Date.now(),
    };
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
