import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, SearchLg, XClose } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { useHotkeys } from "react-hotkeys-hook";
import { SearchResultItem } from "@/components/app/search-result-item";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useMovieSearch } from "@/hooks/use-tmdb-search";
import { addToWatchlist, useWatchlistIds, useWatchlistStatusMap } from "@/hooks/use-watchlist";
import type { TmdbSearchResult } from "@/lib/tmdb";
import { posterUrl, toMediaType } from "@/lib/tmdb";
import { useToast } from "@/providers/toast-provider";
import { buildId } from "@/types/watchlist";
import { cx } from "@/utils/cx";

interface SearchOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectItem: (result: TmdbSearchResult) => void;
    onItemAdded?: (mediaType: "movie" | "tv") => void;
}

type Column = "movies" | "series";

export function SearchOverlay({ isOpen, onClose, onSelectItem, onItemAdded }: SearchOverlayProps) {
    const { query, setQuery, results, isLoading, error, reset } = useMovieSearch();
    const watchlistIds = useWatchlistIds();
    const watchlistStatus = useWatchlistStatusMap();
    const { addToast } = useToast();
    const isDesktop = useBreakpoint("sm");

    // Two focus states: previewIndex (always shows preview) vs focusedIndex (visually highlighted)
    const [activeColumn, setActiveColumn] = useState<Column>("movies");
    const [previewIdx, setPreviewIdx] = useState(0); // which item shows in preview pane
    const [focusedIdx, setFocusedIdx] = useState(-1); // -1 = no visual focus, >=0 = highlighted
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const movies = useMemo(() => results.filter((r) => r.media_type === "movie"), [results]);
    const series = useMemo(() => results.filter((r) => r.media_type === "tv"), [results]);

    const currentList = activeColumn === "movies" ? movies : series;

    // Preview item: use focusedIdx if actively focused, otherwise previewIdx
    const previewItem = useMemo(() => {
        const idx = focusedIdx >= 0 ? focusedIdx : previewIdx;
        return currentList[idx] ?? movies[0] ?? series[0] ?? null;
    }, [focusedIdx, previewIdx, currentList, movies, series]);

    useEffect(() => {
        if (isOpen) {
            reset();
            setActiveColumn("movies");
            setPreviewIdx(0);
            setFocusedIdx(-1);
            requestAnimationFrame(() => inputRef.current?.focus());
        }
    }, [isOpen, reset]);

    useEffect(() => {
        setPreviewIdx(0);
        setFocusedIdx(-1);
        setActiveColumn(movies.length > 0 ? "movies" : "series");
    }, [results]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                if (focusedIdx === -1) {
                    // First ↓ press: activate focus on first item
                    setFocusedIdx(0);
                } else {
                    setFocusedIdx((prev) => Math.min(prev + 1, currentList.length - 1));
                }
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (focusedIdx <= 0) {
                    // Back to input
                    setFocusedIdx(-1);
                    inputRef.current?.focus();
                } else {
                    setFocusedIdx((prev) => prev - 1);
                }
            } else if (e.key === "ArrowRight" && focusedIdx >= 0) {
                // Only switch columns when an item is focused
                e.preventDefault();
                if (activeColumn === "movies" && series.length > 0) {
                    setActiveColumn("series");
                    setFocusedIdx(Math.min(focusedIdx, series.length - 1));
                }
            } else if (e.key === "ArrowLeft" && focusedIdx >= 0) {
                e.preventDefault();
                if (activeColumn === "series" && movies.length > 0) {
                    setActiveColumn("movies");
                    setFocusedIdx(Math.min(focusedIdx, movies.length - 1));
                }
            } else if (e.key === "Enter") {
                e.preventDefault();
                const item = focusedIdx >= 0 ? currentList[focusedIdx] : previewItem;
                if (item) {
                    const id = buildId(toMediaType(item.media_type as "movie" | "tv"), item.id);
                    if (watchlistIds.has(id)) {
                        onSelectItem(item);
                    } else {
                        handleAdd(item);
                    }
                }
            } else if (e.key === "Escape") {
                e.preventDefault();
                if (focusedIdx >= 0) {
                    setFocusedIdx(-1);
                    inputRef.current?.focus();
                } else {
                    onClose();
                }
            }
        },
        [focusedIdx, currentList, activeColumn, movies, series, previewItem, watchlistIds, onClose, onSelectItem],
    );

    // Keep previewIdx in sync with focusedIdx
    useEffect(() => {
        if (focusedIdx >= 0) setPreviewIdx(focusedIdx);
    }, [focusedIdx]);

    // Scroll focused item into view
    useEffect(() => {
        if (focusedIdx < 0) return;
        const list = listRef.current;
        if (!list) return;
        const colId = activeColumn === "movies" ? "movie" : "series";
        const el = list.querySelector(`[data-col="${colId}"][data-idx="${focusedIdx}"]`) as HTMLElement;
        if (el) el.scrollIntoView({ block: "nearest" });
    }, [activeColumn, focusedIdx]);

    const handleAdd = useCallback(
        async (result: TmdbSearchResult) => {
            await addToWatchlist(result);
            addToast(`Added "${result.title || result.name}" to list`);
            onItemAdded?.(toMediaType(result.media_type as "movie" | "tv"));
        },
        [addToast, onItemAdded],
    );

    // Handle tap/click on a result: first tap = preview, second tap = add/remove
    const handleResultTap = useCallback(
        (result: TmdbSearchResult, column: Column, index: number) => {
            const isSameItem = activeColumn === column && (focusedIdx === index || previewIdx === index);
            if (isSameItem && focusedIdx >= 0) {
                // Second tap: add or open detail
                const id = buildId(toMediaType(result.media_type as "movie" | "tv"), result.id);
                if (watchlistIds.has(id)) {
                    onSelectItem(result);
                } else {
                    handleAdd(result);
                }
            } else {
                // First tap: select for preview
                setActiveColumn(column);
                setPreviewIdx(index);
                setFocusedIdx(index);
            }
        },
        [activeColumn, focusedIdx, previewIdx, watchlistIds, onSelectItem, handleAdd],
    );

    useHotkeys("escape", () => isOpen && onClose(), { enableOnFormTags: true }, [isOpen, onClose]);

    if (!isOpen) return null;

    const hasResults = !isLoading && (movies.length > 0 || series.length > 0);
    const noResults = !isLoading && !error && query.length >= 2 && movies.length === 0 && series.length === 0;
    const poster = previewItem ? posterUrl(previewItem.poster_path, "w500") : null;
    const previewId = previewItem ? buildId(toMediaType(previewItem.media_type as "movie" | "tv"), previewItem.id) : "";
    const isPreviewInWatchlist = watchlistIds.has(previewId);
    const previewStatus = watchlistStatus.get(previewId);

    const renderResultItem = (result: TmdbSearchResult, column: Column, index: number) => {
        const id = buildId(toMediaType(result.media_type as "movie" | "tv"), result.id);
        const isFocused = activeColumn === column && focusedIdx === index;
        return (
            <div key={result.id} data-col={column === "movies" ? "movie" : "series"} data-idx={index}>
                <SearchResultItem
                    result={result}
                    isInWatchlist={watchlistIds.has(id)}
                    watchStatus={watchlistStatus.get(id)}
                    isSelected={isFocused}
                    onAdd={() => handleAdd(result)}
                    onClick={() => handleResultTap(result, column, index)}
                    onHover={() => { setActiveColumn(column); setPreviewIdx(index); setFocusedIdx(index); }}
                    compact={isDesktop}
                />
            </div>
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-50 flex items-start justify-center bg-overlay/70 px-2 pt-[5vh] backdrop-blur-sm sm:px-4 sm:pt-[8vh]"
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
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search movies and series to add..."
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
                                </div>
                            )}
                            {noResults && <div className="px-3 py-16 text-center text-sm text-tertiary">No results found</div>}

                            {/* 3 equal columns on desktop; movies + series stack on mobile, preview hidden */}
                            {hasResults && (
                                <div className="flex max-h-[70vh] flex-col sm:max-h-[560px] sm:flex-row">
                                    {/* Movies */}
                                    <div className="flex flex-1 flex-col overflow-y-auto border-b border-secondary sm:max-w-[280px] sm:border-r sm:border-b-0">
                                        <div className="sticky top-0 z-10 border-b border-secondary bg-secondary px-3 py-1.5 text-xs font-semibold text-tertiary">
                                            Movies ({movies.length})
                                        </div>
                                        <div className="p-1">
                                            {movies.length === 0 ? (
                                                <div className="py-6 text-center text-xs text-quaternary">No movies</div>
                                            ) : (
                                                movies.map((r, i) => renderResultItem(r, "movies", i))
                                            )}
                                        </div>
                                    </div>

                                    {/* Series */}
                                    <div className="flex flex-1 flex-col overflow-y-auto sm:max-w-[280px] sm:border-r sm:border-secondary">
                                        <div className="sticky top-0 z-10 border-b border-secondary bg-secondary px-3 py-1.5 text-xs font-semibold text-tertiary">
                                            Series ({series.length})
                                        </div>
                                        <div className="p-1">
                                            {series.length === 0 ? (
                                                <div className="py-6 text-center text-xs text-quaternary">No series</div>
                                            ) : (
                                                series.map((r, i) => renderResultItem(r, "series", i))
                                            )}
                                        </div>
                                    </div>

                                    {/* Preview pane */}
                                    <div className="hidden flex-1 flex-col items-center justify-center p-5 sm:flex">
                                        {previewItem ? (
                                            <div className="flex flex-col items-center gap-3 text-center">
                                                <div className="aspect-[2/3] w-full max-w-[260px] overflow-hidden rounded-lg bg-tertiary shadow-md">
                                                    {poster ? (
                                                        <img src={poster} alt={previewItem.title || previewItem.name || ""} className="size-full object-cover" />
                                                    ) : (
                                                        <div className="flex size-full items-center justify-center text-xs text-quaternary">No poster</div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <h3 className="text-sm font-semibold text-primary">{previewItem.title || previewItem.name || "Unknown"}</h3>
                                                    <span className="text-xs text-tertiary">
                                                        {(previewItem.release_date || previewItem.first_air_date || "").slice(0, 4)} · {previewItem.media_type === "movie" ? "Movie" : "Series"}
                                                    </span>
                                                </div>
                                                {/* Action buttons */}
                                                {!isPreviewInWatchlist ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => previewItem && handleAdd(previewItem)}
                                                        className="mt-1 flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-solid px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition duration-100 ease-linear hover:bg-brand-solid_hover"
                                                    >
                                                        <Plus className="size-3.5" />
                                                        Add
                                                    </button>
                                                ) : (
                                                    <span className={cx(
                                                        "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                                        previewStatus === "watched"
                                                            ? "bg-success-secondary text-fg-success-primary"
                                                            : "bg-brand-secondary text-fg-brand-primary",
                                                    )}>
                                                        {previewStatus === "watched" ? "Watched" : "To watch"}
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
