import { useCallback, useEffect, useRef, useState } from "react";
import type { TmdbSearchResult } from "@/lib/tmdb";
import { searchMulti } from "@/lib/tmdb";

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

export function useMovieSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<TmdbSearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const reset = useCallback(() => {
        setQuery("");
        setResults([]);
        setIsLoading(false);
        setError(null);
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
    }, []);

    useEffect(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }

        const trimmed = query.trim();

        if (trimmed.length < MIN_QUERY_LENGTH) {
            setResults([]);
            setIsLoading(false);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        const timer = setTimeout(() => {
            const controller = new AbortController();
            abortRef.current = controller;

            searchMulti(trimmed, controller.signal)
                .then((data) => {
                    if (!controller.signal.aborted) {
                        setResults(data);
                        setIsLoading(false);
                    }
                })
                .catch((err) => {
                    if (err instanceof Error && err.name === "AbortError") return;
                    if (!controller.signal.aborted) {
                        setError("Search failed. Check your API key.");
                        setIsLoading(false);
                    }
                });
        }, DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [query]);

    return { query, setQuery, results, isLoading, error, reset };
}
