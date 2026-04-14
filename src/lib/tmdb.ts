import type { MediaType } from "@/types/watchlist";

const TOKEN = import.meta.env.VITE_TMDB_ACCESS_TOKEN as string;
const BASE = import.meta.env.DEV ? "/tmdb" : "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p";

const headers = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

// --- Search types ---

export interface TmdbSearchResult {
    id: number;
    media_type: "movie" | "tv" | "person";
    title?: string; // movies
    name?: string; // tv
    poster_path: string | null;
    overview: string;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    genre_ids: number[];
    popularity: number;
}

export interface TmdbSearchResponse {
    results: TmdbSearchResult[];
    total_results: number;
    total_pages: number;
}

// --- Detail types ---

export interface TmdbDetail {
    id: number;
    title?: string;
    name?: string;
    overview: string;
    poster_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
    runtime?: number; // movies
    episode_run_time?: number[]; // tv
    genres: { id: number; name: string }[];
    credits?: {
        cast: { name: string; character: string; order: number }[];
        crew: { name: string; job: string }[];
    };
    status?: string;
    tagline?: string;
    spoken_languages?: { english_name: string }[];
    content_ratings?: { results: { iso_3166_1: string; rating: string }[] }; // tv
    release_dates?: { results: { iso_3166_1: string; release_dates: { certification: string }[] }[] }; // movie
}

// --- Helpers ---

export function posterUrl(path: string | null, size: "w154" | "w342" | "w500" | "original" = "w342"): string | null {
    if (!path) return null;
    return `${IMAGE_BASE}/${size}${path}`;
}

export function toMediaType(type: "movie" | "tv"): MediaType {
    return type === "tv" ? "tv" : "movie";
}

// --- API calls ---

export async function searchMulti(query: string, signal?: AbortSignal): Promise<TmdbSearchResult[]> {
    const url = `${BASE}/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;
    const res = await fetch(url, { headers, signal });
    if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);
    const data: TmdbSearchResponse = await res.json();
    // Filter out person results
    return data.results.filter((r) => r.media_type === "movie" || r.media_type === "tv");
}

export async function getDetails(mediaType: MediaType, tmdbId: number, signal?: AbortSignal): Promise<TmdbDetail | null> {
    const type = mediaType === "tv" ? "tv" : "movie";
    const append = mediaType === "tv" ? "credits,content_ratings" : "credits,release_dates";
    const url = `${BASE}/${type}/${tmdbId}?append_to_response=${append}&language=en-US`;
    const res = await fetch(url, { headers, signal });
    if (!res.ok) return null;
    return res.json();
}

// --- Detail extractors ---

export function extractDirector(detail: TmdbDetail): string | undefined {
    const directors = detail.credits?.crew.filter((c) => c.job === "Director").map((c) => c.name);
    return directors && directors.length > 0 ? directors.join(", ") : undefined;
}

export function extractCast(detail: TmdbDetail, limit = 4): string | undefined {
    const cast = detail.credits?.cast.slice(0, limit).map((c) => c.name);
    return cast && cast.length > 0 ? cast.join(", ") : undefined;
}

export function extractRuntime(detail: TmdbDetail): string | undefined {
    const mins = detail.runtime || detail.episode_run_time?.[0];
    if (!mins) return undefined;
    if (mins < 60) return `${mins}min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export function extractRating(detail: TmdbDetail, mediaType: MediaType): string | undefined {
    if (mediaType === "tv") {
        const us = detail.content_ratings?.results.find((r) => r.iso_3166_1 === "US");
        return us?.rating || undefined;
    }
    const us = detail.release_dates?.results.find((r) => r.iso_3166_1 === "US");
    const cert = us?.release_dates.find((r) => r.certification)?.certification;
    return cert || undefined;
}
