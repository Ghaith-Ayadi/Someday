import type { MediaType } from "@/types/watchlist";

const OMDB_API_KEY = import.meta.env.VITE_OMDB_API_KEY as string;
// Use proxy in dev to avoid CORS issues on mobile/network access
const OMDB_BASE = import.meta.env.DEV ? "/omdb" : "https://www.omdbapi.com";

export interface OmdbSearchItem {
    Title: string;
    Year: string;
    imdbID: string;
    Type: "movie" | "series" | "episode";
    Poster: string;
}

export interface OmdbSearchResponse {
    Search?: OmdbSearchItem[];
    totalResults?: string;
    Response: "True" | "False";
    Error?: string;
}

export interface OmdbDetail {
    Title: string;
    Year: string;
    Rated: string;
    Released: string;
    Runtime: string;
    Genre: string;
    Director: string;
    Actors: string;
    Plot: string;
    Poster: string;
    imdbRating: string;
    imdbID: string;
    Type: "movie" | "series";
    Response: "True" | "False";
}

/** Get poster URL — OMDb returns full URL or "N/A" */
export function posterUrl(poster: string | undefined): string | null {
    if (!poster || poster === "N/A") return null;
    return poster;
}

/** Search for movies and series */
export async function searchAll(query: string, signal?: AbortSignal): Promise<OmdbSearchItem[]> {
    const url = `${OMDB_BASE}/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`OMDb search failed: ${res.status}`);
    const data: OmdbSearchResponse = await res.json();
    if (data.Response === "False") return [];
    // Filter out episodes, keep only movies and series
    return (data.Search || []).filter((item) => item.Type === "movie" || item.Type === "series");
}

/** Get detailed info for a single title */
export async function getDetails(imdbId: string, signal?: AbortSignal): Promise<OmdbDetail | null> {
    const url = `${OMDB_BASE}/?apikey=${OMDB_API_KEY}&i=${imdbId}&plot=short`;
    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`OMDb detail failed: ${res.status}`);
    const data: OmdbDetail = await res.json();
    if (data.Response === "False") return null;
    return data;
}

/** Convert OMDb type to our MediaType */
export function toMediaType(type: "movie" | "series"): MediaType {
    return type === "series" ? "tv" : "movie";
}
