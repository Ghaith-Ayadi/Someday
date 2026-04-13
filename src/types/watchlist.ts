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
    /** Composite key: "{mediaType}-{imdbId}" */
    id: string;
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
export function buildId(mediaType: MediaType, imdbId: string): string {
    return `${mediaType}-${imdbId}`;
}

/** Parse OMDb genre string into our Genre array */
export function parseGenres(genreString: string): Genre[] {
    if (!genreString || genreString === "N/A") return [];
    const genreMap: Record<string, Genre> = {
        action: "action",
        adventure: "action",
        comedy: "comedy",
        drama: "drama",
        thriller: "thriller",
        crime: "thriller",
        mystery: "thriller",
        horror: "horror",
        "sci-fi": "sci-fi",
        "science fiction": "sci-fi",
        romance: "romance",
        animation: "animation",
        documentary: "documentary",
        fantasy: "fantasy",
    };
    const genres = new Set<Genre>();
    for (const raw of genreString.split(",")) {
        const normalized = raw.trim().toLowerCase();
        const mapped = genreMap[normalized];
        if (mapped) genres.add(mapped);
    }
    return Array.from(genres);
}
