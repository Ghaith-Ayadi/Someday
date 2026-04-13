import { useCallback, useEffect, useRef, useState } from "react";
import type { OmdbSearchItem } from "@/lib/tmdb";
import { searchAll } from "@/lib/tmdb";

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

export function useMovieSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<OmdbSearchItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const reset = useCallback(() => {
        setQuery("");
        setResults([]);
        setIsLoading(false);
        setError(null);
        if (abortRef.current) abortRef.current.abort();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (query.length < MIN_QUERY_LENGTH) {
            setResults([]);
            setIsLoading(false);
            setError(null);
            return;
        }

        setIsLoading(true);
        setError(null);

        timeoutRef.current = setTimeout(async () => {
            if (abortRef.current) abortRef.current.abort();
            const controller = new AbortController();
            abortRef.current = controller;

            try {
                const data = await searchAll(query, controller.signal);
                if (!controller.signal.aborted) {
                    setResults(data);
                    setIsLoading(false);
                }
            } catch (err) {
                if (err instanceof Error && err.name === "AbortError") return;
                if (!controller.signal.aborted) {
                    setError("Search failed. Check your API key.");
                    setIsLoading(false);
                }
            }
        }, DEBOUNCE_MS);

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [query]);

    useEffect(() => {
        return () => {
            if (abortRef.current) abortRef.current.abort();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return { query, setQuery, results, isLoading, error, reset };
}
