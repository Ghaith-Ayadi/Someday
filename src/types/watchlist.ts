import type { BadgeColors } from "@/components/base/badges/badge-types";

export type MediaType = "movie" | "tv";
export type WatchStatus = "watchlist" | "watched";
export type Genre =
    | "comedy"
    | "drama"
    | "action"
    | "thriller"
    | "horror"
    | "sci-fi"
    | "romance"
    | "animation"
    | "documentary"
    | "fantasy";

export interface WatchlistItem {
    /** Composite key: "{mediaType}-{imdbId}" or "manual-{uuid}". Stored server-side as `client_id`. */
    id: string;
    /** PocketBase record id, once this item has been synced. */
    remoteId?: string;
    imdbId: string;
    mediaType: MediaType;
    title: string;
    posterUrl: string | null;
    overview: string;
    releaseDate: string;
    voteAverage: number;
    genres: Genre[];
    status: WatchStatus;
    addedAt: number;
    watchedAt?: number;
    updatedAt: number;
    syncedAt?: number;
    deletedAt?: number;
    manual?: boolean;
    // Rich metadata from OMDb detail
    director?: string;
    actors?: string;
    runtime?: string;
    rated?: string;
    writer?: string;
    language?: string;
    awards?: string;
    metascore?: string;
    imdbRating?: string;
    rottenTomatoes?: string;
    boxOffice?: string;
}

export const ALL_GENRES: Genre[] = [
    "action",
    "comedy",
    "drama",
    "thriller",
    "horror",
    "sci-fi",
    "romance",
    "animation",
    "documentary",
    "fantasy",
];

export const GENRE_BADGE_COLORS: Record<Genre, BadgeColors> = {
    action: "error",
    comedy: "warning",
    drama: "blue",
    thriller: "slate",
    horror: "purple",
    "sci-fi": "indigo",
    romance: "pink",
    animation: "orange",
    documentary: "gray",
    fantasy: "sky",
};

/** Build a composite ID for a watchlist item */
export function buildId(mediaType: MediaType, tmdbId: string | number): string {
    return `${mediaType}-${tmdbId}`;
}

/** Maps TMDB genre IDs to our genre categories */
export const TMDB_GENRE_MAP: Record<number, Genre> = {
    // Movie genres
    28: "action",
    12: "action",
    35: "comedy",
    18: "drama",
    27: "horror",
    878: "sci-fi",
    10749: "romance",
    16: "animation",
    99: "documentary",
    14: "fantasy",
    53: "thriller",
    80: "thriller",
    9648: "thriller",
    // TV genres
    10759: "action",
    10765: "sci-fi",
    10766: "drama",
    10768: "action",
};
