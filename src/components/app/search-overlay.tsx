import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, SearchLg, Star01, XClose } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { useHotkeys } from "react-hotkeys-hook";
import { SearchResultItem } from "@/components/app/search-result-item";
import { Badge } from "@/components/base/badges/badges";
import { useMovieSearch } from "@/hooks/use-tmdb-search";
import { addToWatchlist, useWatchlistIds, useWatchlistStatusMap } from "@/hooks/use-watchlist";
import type { OmdbSearchItem } from "@/lib/tmdb";
import { posterUrl, toMediaType } from "@/lib/tmdb";
import { useToast } from "@/providers/toast-provider";
import { buildId } from "@/types/watchlist";
import { cx } from "@/utils/cx";

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectItem: (result: OmdbSearchItem) => void;
}

type Column = "movies" | "series";

export function SearchOverlay({ isOpen, onClose, onSelectItem }: SearchOverlayProps) {
    const { query, setQuery, results, isLoading, error, reset } = useMovieSearch();
    const watchlistIds = useWatchlistIds();
    const watchlistStatus = useWatchlistStatusMap();
    const { addToast } = useToast();
    const [activeColumn, setActiveColumn] = useState<Column>("movies");
    const [movieIndex, setMovieIndex] = useState(0);
    const [seriesIndex, setSeriesIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const movies = useMemo(() => results.filter((r) => r.Type === "movie"), [results]);
    const series = useMemo(() => results.filter((r) => r.Type === "series"), [results]);

    // The currently selected item based on active column
    const selectedItem = useMemo(() => {
        if (activeColumn === "movies") return movies[movieIndex] ?? null;
        return series[seriesIndex] ?? null;
    }, [activeColumn, movieIndex, seriesIndex, movies, series]);

    useEffect(() => {
        if (isOpen) {
            reset();
            setActiveColumn("movies");
            setMovieIndex(0);
            setSeriesIndex(0);
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [isOpen, reset]);

    useEffect(() => {
        setMovieIndex(0);
        setSeriesIndex(0);
        setActiveColumn(movies.length > 0 ? "movies" : "series");
    }, [results]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            const currentList = activeColumn === "movies" ? movies : series;
            const currentIndex = activeColumn === "movies" ? movieIndex : seriesIndex;
            const setIndex = activeColumn === "movies" ? setMovieIndex : setSeriesIndex;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setIndex(Math.min(currentIndex + 1, currentList.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setIndex(Math.max(currentIndex - 1, 0));
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                if (activeColumn === "movies" && series.length > 0) {
                    setActiveColumn("series");
                }
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                if (activeColumn === "series" && movies.length > 0) {
                    setActiveColumn("movies");
                }
            } else if (e.key === "Enter" && selectedItem) {
                e.preventDefault();
                const id = buildId(toMediaType(selectedItem.Type), selectedItem.imdbID);
                if (watchlistIds.has(id)) {
                    onSelectItem(selectedItem);
                } else {
                    handleAdd(selectedItem);
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        },
        [activeColumn, movies, series, movieIndex, seriesIndex, selectedItem, watchlistIds, onClose, onSelectItem],
    );

    // Scroll selected item into view
    useEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const colId = activeColumn === "movies" ? "movie" : "series";
        const idx = activeColumn === "movies" ? movieIndex : seriesIndex;
        const el = list.querySelector(`[data-col="${colId}"][data-idx="${idx}"]`) as HTMLElement;
        if (el) el.scrollIntoView({ block: "nearest" });
    }, [activeColumn, movieIndex, seriesIndex]);

    const handleAdd = useCallback(
        async (result: OmdbSearchItem) => {
            await addToWatchlist(result);
            addToast(`Added "${result.Title}" to list`);
        },
        [addToast],
    );

    useHotkeys("escape", () => isOpen && onClose(), { enableOnFormTags: true }, [isOpen, onClose]);

    if (!isOpen) return null;

    const hasResults = !isLoading && (movies.length > 0 || series.length > 0);
    const noResults = !isLoading && !error && query.length >= 2 && movies.length === 0 && series.length === 0;
    const poster = selectedItem ? posterUrl(selectedItem.Poster) : null;
    const isSelectedInWatchlist = selectedItem ? watchlistIds.has(buildId(toMediaType(selectedItem.Type), selectedItem.imdbID)) : false;
    const selectedStatus = selectedItem ? watchlistStatus.get(buildId(toMediaType(selectedItem.Type), selectedItem.imdbID)) : undefined;

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
                        className="flex w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-secondary bg-primary shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Search input */}
                        <div className="flex items-center gap-3 border-b border-secondary px-4 py-3">
                            <SearchLg className="size-5 shrink-0 text-fg-quaternary" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value.trimEnd())}
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
                            {isLoading && query.length >= 2 && (
                                <div className="flex items-center justify-center py-16">
                                    <div className="size-5 animate-spin rounded-full border-2 border-tertiary border-t-brand-600" />
                                </div>
                            )}
                            {error && <div className="px-3 py-12 text-center text-sm text-error-primary">{error}</div>}
                            {!isLoading && !error && query.length < 2 && (
                                <div className="px-3 py-16 text-center text-sm text-tertiary">
                                    Type to search movies and series...
                                    <div className="mt-2 text-xs text-quaternary">↑↓ navigate · ←→ switch columns · Enter add · Esc close</div>
                                </div>
                            )}
                            {noResults && <div className="px-3 py-16 text-center text-sm text-tertiary">No results found</div>}

                            {/* Responsive: single scrollable list on mobile, 3-column on desktop */}
                            {hasResults && (
                                <>
                                {/* Mobile: single column */}
                                <div className="max-h-[70vh] overflow-y-auto sm:hidden">
                                    <div className="p-1.5">
                                        {movies.length > 0 && (
                                            <div className="px-2 pt-1.5 pb-1 text-xs font-semibold text-tertiary">Movies ({movies.length})</div>
                                        )}
                                        {movies.map((result, i) => (
                                            <div key={result.imdbID} data-col="movie" data-idx={i}>
                                                <SearchResultItem
                                                    result={result}
                                                    isInWatchlist={watchlistIds.has(buildId(toMediaType(result.Type), result.imdbID))}
                                                    watchStatus={watchlistStatus.get(buildId(toMediaType(result.Type), result.imdbID))}
                                                    isSelected={activeColumn === "movies" && i === movieIndex}
                                                    onAdd={() => handleAdd(result)}
                                                    onClick={() => onSelectItem(result)}
                                                    onHover={() => { setActiveColumn("movies"); setMovieIndex(i); }}
                                                />
                                            </div>
                                        ))}
                                        {series.length > 0 && (
                                            <>
                                                <div className="my-1 h-px bg-border-secondary" />
                                                <div className="px-2 pt-1.5 pb-1 text-xs font-semibold text-tertiary">Series ({series.length})</div>
                                            </>
                                        )}
                                        {series.map((result, i) => (
                                            <div key={result.imdbID} data-col="series" data-idx={i}>
                                                <SearchResultItem
                                                    result={result}
                                                    isInWatchlist={watchlistIds.has(buildId(toMediaType(result.Type), result.imdbID))}
                                                    watchStatus={watchlistStatus.get(buildId(toMediaType(result.Type), result.imdbID))}
                                                    isSelected={activeColumn === "series" && i === seriesIndex}
                                                    onAdd={() => handleAdd(result)}
                                                    onClick={() => onSelectItem(result)}
                                                    onHover={() => { setActiveColumn("series"); setSeriesIndex(i); }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Desktop: 3-column */}
                                <div className="hidden max-h-[560px] sm:flex">
                                    {/* Movies column */}
                                    <div className="flex w-[30%] flex-col overflow-y-auto border-r border-secondary">
                                        <div className="sticky top-0 z-10 border-b border-secondary bg-secondary px-3 py-1.5 text-xs font-semibold text-tertiary">
                                            Movies ({movies.length})
                                        </div>
                                        <div className="p-1">
                                            {movies.length === 0 ? (
                                                <div className="py-8 text-center text-xs text-quaternary">No movies</div>
                                            ) : (
                                                movies.map((result, i) => (
                                                    <div key={result.imdbID} data-col="movie" data-idx={i}>
                                                        <SearchResultItem
                                                            result={result}
                                                            isInWatchlist={watchlistIds.has(buildId(toMediaType(result.Type), result.imdbID))}
                                                            watchStatus={watchlistStatus.get(buildId(toMediaType(result.Type), result.imdbID))}
                                                            isSelected={activeColumn === "movies" && i === movieIndex}
                                                            onAdd={() => handleAdd(result)}
                                                            onClick={() => onSelectItem(result)}
                                                            onHover={() => { setActiveColumn("movies"); setMovieIndex(i); }}
                                                            compact
                                                        />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Series column */}
                                    <div className="flex w-[30%] flex-col overflow-y-auto border-r border-secondary">
                                        <div className="sticky top-0 z-10 border-b border-secondary bg-secondary px-3 py-1.5 text-xs font-semibold text-tertiary">
                                            Series ({series.length})
                                        </div>
                                        <div className="p-1">
                                            {series.length === 0 ? (
                                                <div className="py-8 text-center text-xs text-quaternary">No series</div>
                                            ) : (
                                                series.map((result, i) => (
                                                    <div key={result.imdbID} data-col="series" data-idx={i}>
                                                        <SearchResultItem
                                                            result={result}
                                                            isInWatchlist={watchlistIds.has(buildId(toMediaType(result.Type), result.imdbID))}
                                                            watchStatus={watchlistStatus.get(buildId(toMediaType(result.Type), result.imdbID))}
                                                            isSelected={activeColumn === "series" && i === seriesIndex}
                                                            onAdd={() => handleAdd(result)}
                                                            onClick={() => onSelectItem(result)}
                                                            onHover={() => { setActiveColumn("series"); setSeriesIndex(i); }}
                                                            compact
                                                        />
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Preview column */}
                                    <div className="flex w-[40%] flex-col items-center justify-center p-5">
                                        {selectedItem ? (
                                            <div className="flex flex-col items-center gap-3 text-center">
                                                <div className="h-[450px] w-[300px] overflow-hidden rounded-lg bg-tertiary shadow-md">
                                                    {poster ? (
                                                        <img src={poster} alt={selectedItem.Title} className="size-full object-cover" />
                                                    ) : (
                                                        <div className="flex size-full items-center justify-center text-xs text-quaternary">No poster</div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <h3 className="text-sm font-semibold text-primary">{selectedItem.Title}</h3>
                                                    <span className="text-xs text-tertiary">
                                                        {selectedItem.Year} · {selectedItem.Type === "movie" ? "Movie" : "Series"}
                                                    </span>
                                                </div>
                                                {!isSelectedInWatchlist ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAdd(selectedItem)}
                                                        className="mt-1 flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-solid px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition duration-100 ease-linear hover:bg-brand-solid_hover"
                                                    >
                                                        <Plus className="size-3.5" />
                                                        Add
                                                    </button>
                                                ) : (
                                                    <span className={cx(
                                                        "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                                        selectedStatus === "watched"
                                                            ? "bg-success-secondary text-fg-success-primary"
                                                            : "bg-brand-secondary text-fg-brand-primary",
                                                    )}>
                                                        {selectedStatus === "watched" ? "Watched" : "To watch"}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-quaternary">Select an item to preview</div>
                                        )}
                                    </div>
                                </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
