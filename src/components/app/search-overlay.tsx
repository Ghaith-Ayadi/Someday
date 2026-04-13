import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, SearchLg, Star01, XClose } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { useHotkeys } from "react-hotkeys-hook";
import { SearchResultItem } from "@/components/app/search-result-item";
import { Badge } from "@/components/base/badges/badges";
import { useMovieSearch } from "@/hooks/use-tmdb-search";
import { addToWatchlist, useWatchlistIds } from "@/hooks/use-watchlist";
import type { OmdbSearchItem } from "@/lib/tmdb";
import { posterUrl, toMediaType } from "@/lib/tmdb";
import { useToast } from "@/providers/toast-provider";
import { buildId, GENRE_BADGE_COLORS, mapTmdbGenres } from "@/types/watchlist";

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectItem: (result: OmdbSearchItem) => void;
}

export function SearchOverlay({ isOpen, onClose, onSelectItem }: SearchOverlayProps) {
    const { query, setQuery, results, isLoading, error, reset } = useMovieSearch();
    const watchlistIds = useWatchlistIds();
    const { addToast } = useToast();
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Split results
    const movies = useMemo(() => results.filter((r) => r.Type === "movie"), [results]);
    const series = useMemo(() => results.filter((r) => r.Type === "series"), [results]);
    const flatResults = useMemo(() => [...movies, ...series], [movies, series]);

    // Preselect first result
    useEffect(() => {
        if (isOpen) {
            reset();
            setSelectedIndex(0);
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [isOpen, reset]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [results]);

    // Currently highlighted item for preview
    const selectedItem = flatResults[selectedIndex] ?? null;

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter" && flatResults[selectedIndex]) {
                e.preventDefault();
                const result = flatResults[selectedIndex];
                const id = buildId(toMediaType(result.Type), result.imdbID);
                if (watchlistIds.has(id)) {
                    onSelectItem(result);
                } else {
                    handleAdd(result);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        },
        [flatResults, selectedIndex, watchlistIds, onClose, onSelectItem],
    );

    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const selected = list.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
        if (selected) selected.scrollIntoView({ block: "nearest" });
    }, [selectedIndex]);

    const handleAdd = useCallback(
        async (result: OmdbSearchItem) => {
            await addToWatchlist(result);
            addToast(`Added "${result.Title}" to watchlist`);
        },
        [addToast],
    );

    useHotkeys("escape", () => isOpen && onClose(), { enableOnFormTags: true }, [isOpen, onClose]);

    if (!isOpen) return null;

    const movieStartIndex = 0;
    const seriesStartIndex = movies.length;
    const hasResults = !isLoading && (movies.length > 0 || series.length > 0);
    const noResults = !isLoading && !error && query.length >= 2 && flatResults.length === 0;
    const poster = selectedItem ? posterUrl(selectedItem.Poster) : null;
    const isSelectedInWatchlist = selectedItem ? watchlistIds.has(buildId(toMediaType(selectedItem.Type), selectedItem.imdbID)) : false;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-50 flex items-start justify-center bg-overlay/70 px-4 pt-[8vh] backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className="flex w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-secondary bg-primary shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search input */}
                        <div className="flex items-center gap-3 border-b border-secondary px-4 py-3">
                            <SearchLg className="size-5 shrink-0 text-fg-quaternary" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search movies and series..."
                                className="flex-1 bg-transparent text-md text-primary outline-none placeholder:text-placeholder"
                                autoComplete="off"
                                spellCheck={false}
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={() => setQuery("")}
                                    className="flex size-6 cursor-pointer items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary"
                                >
                                    <XClose className="size-4" />
                                </button>
                            )}
                        </div>

                        {/* Results area */}
                        <div ref={listRef} role="listbox">
                            {/* Loading */}
                            {isLoading && query.length >= 2 && (
                                <div className="flex items-center justify-center py-16">
                                    <div className="size-5 animate-spin rounded-full border-2 border-tertiary border-t-brand-600" />
                                </div>
                            )}

                            {error && <div className="px-3 py-12 text-center text-sm text-error-primary">{error}</div>}

                            {!isLoading && !error && query.length < 2 && (
                                <div className="px-3 py-16 text-center text-sm text-tertiary">Type to search movies and series...</div>
                            )}

                            {noResults && <div className="px-3 py-16 text-center text-sm text-tertiary">No results found</div>}

                            {/* Three-column: movies | series | preview */}
                            {hasResults && (
                                <div className="flex max-h-[420px]">
                                    {/* Movies column */}
                                    <div className="flex w-1/3 flex-col overflow-y-auto border-r border-secondary">
                                        <div className="sticky top-0 z-10 border-b border-secondary bg-secondary px-3 py-1.5 text-xs font-semibold text-tertiary">
                                            Movies ({movies.length})
                                        </div>
                                        <div className="p-1">
                                            {movies.length === 0 ? (
                                                <div className="py-8 text-center text-xs text-quaternary">No movies</div>
                                            ) : (
                                                movies.map((result, i) => {
                                                    const flatIdx = movieStartIndex + i;
                                                    return (
                                                        <div key={result.imdbID} data-index={flatIdx}>
                                                            <SearchResultItem
                                                                result={result}
                                                                isInWatchlist={watchlistIds.has(buildId(toMediaType(result.Type), result.imdbID))}
                                                                isSelected={flatIdx === selectedIndex}
                                                                onAdd={() => handleAdd(result)}
                                                                onClick={() => onSelectItem(result)}
                                                                onHover={() => setSelectedIndex(flatIdx)}
                                                                compact
                                                            />
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Series column */}
                                    <div className="flex w-1/3 flex-col overflow-y-auto border-r border-secondary">
                                        <div className="sticky top-0 z-10 border-b border-secondary bg-secondary px-3 py-1.5 text-xs font-semibold text-tertiary">
                                            Series ({series.length})
                                        </div>
                                        <div className="p-1">
                                            {series.length === 0 ? (
                                                <div className="py-8 text-center text-xs text-quaternary">No series</div>
                                            ) : (
                                                series.map((result, i) => {
                                                    const flatIdx = seriesStartIndex + i;
                                                    return (
                                                        <div key={result.imdbID} data-index={flatIdx}>
                                                            <SearchResultItem
                                                                result={result}
                                                                isInWatchlist={watchlistIds.has(buildId(toMediaType(result.Type), result.imdbID))}
                                                                isSelected={flatIdx === selectedIndex}
                                                                onAdd={() => handleAdd(result)}
                                                                onClick={() => onSelectItem(result)}
                                                                onHover={() => setSelectedIndex(flatIdx)}
                                                                compact
                                                            />
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    {/* Preview column */}
                                    <div className="flex w-1/3 flex-col items-center justify-center p-4">
                                        {selectedItem ? (
                                            <div className="flex flex-col items-center gap-3 text-center">
                                                {/* Large poster */}
                                                <div className="h-52 w-36 overflow-hidden rounded-lg bg-tertiary shadow-md">
                                                    {poster ? (
                                                        <img src={poster} alt={selectedItem.Title} className="size-full object-cover" />
                                                    ) : (
                                                        <div className="flex size-full items-center justify-center text-xs text-quaternary">
                                                            No poster
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="text-sm font-semibold text-primary">{selectedItem.Title}</h3>
                                                    <span className="text-xs text-tertiary">
                                                        {selectedItem.Year} · {selectedItem.Type === "movie" ? "Movie" : "Series"}
                                                    </span>
                                                </div>
                                                {/* Add button */}
                                                {!isSelectedInWatchlist ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAdd(selectedItem)}
                                                        className="mt-1 flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-solid px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition duration-100 ease-linear hover:bg-brand-solid_hover"
                                                    >
                                                        <Plus className="size-3.5" />
                                                        Add to Watchlist
                                                    </button>
                                                ) : (
                                                    <span className="mt-1 text-xs font-medium text-fg-success-primary">
                                                        Already in watchlist
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-quaternary">Select an item to preview</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
