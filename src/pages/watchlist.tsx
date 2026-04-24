import { useCallback, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { AppLayout } from "@/components/app/app-layout";
import { BottomTabs } from "@/components/app/bottom-tabs";
import { DetailModal } from "@/components/app/detail-modal";
import { OfflineBanner } from "@/components/app/offline-banner";
import { OptionsSheet, type ViewMode } from "@/components/app/options-sheet";
import { SearchOverlay } from "@/components/app/search-overlay";
import { ToastContainer } from "@/components/app/toast";
import { WatchlistGrid } from "@/components/app/watchlist-grid";
import { WatchlistList } from "@/components/app/watchlist-list";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { useMovieSearch } from "@/hooks/use-tmdb-search";
import { useSync } from "@/hooks/use-sync";
import { addToWatchlist, markAsUnwatched, markAsWatched, removeFromWatchlist, useFilterCounts, useWatchlistCounts, useWatchlistItems } from "@/hooks/use-watchlist";
import type { TmdbSearchResult } from "@/lib/tmdb";
import { toMediaType } from "@/lib/tmdb";
import { useToast } from "@/providers/toast-provider";
import type { Genre, WatchlistItem, WatchStatus } from "@/types/watchlist";
import { buildId } from "@/types/watchlist";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { SearchResultItem } from "@/components/app/search-result-item";

type SortOption = "added" | "name" | "year" | "genre" | "status";
type SortDir = "asc" | "desc";

const DEFAULT_DIR: Record<SortOption, SortDir> = {
    added: "desc", name: "asc", year: "desc", genre: "asc", status: "asc",
};

function sortItems(items: WatchlistItem[], sort: SortOption, dir: SortDir): WatchlistItem[] {
    const sorted = [...items];
    const d = dir === "asc" ? 1 : -1;
    switch (sort) {
        case "added": return sorted.sort((a, b) => d * (a.addedAt - b.addedAt));
        case "name": return sorted.sort((a, b) => d * a.title.localeCompare(b.title));
        case "year": return sorted.sort((a, b) => d * (a.releaseDate || "").localeCompare(b.releaseDate || ""));
        case "genre": return sorted.sort((a, b) => d * (a.genres[0] || "").localeCompare(b.genres[0] || ""));
        case "status": return sorted.sort((a, b) => {
            if (a.status === b.status) return d * a.title.localeCompare(b.title);
            return d * (a.status === "watchlist" ? -1 : 1);
        });
        default: return sorted;
    }
}

export function WatchlistPage() {
    useSync();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [detailItem, setDetailItem] = useState<WatchlistItem | null>(null);
    const [detailSearchResult, setDetailSearchResult] = useState<TmdbSearchResult | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [filterKeys, setFilterKeys] = useState<Set<string>>(new Set());
    const [sort, setSort] = useState<SortOption>("added");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [activeTab, setActiveTab] = useState<string>("movies");
    const [searchQuery, setSearchQuery] = useState("");
    const isDesktop = useBreakpoint("sm");

    // TMDB fallback search for when local filter has no matches
    const { results: tmdbResults, isLoading: tmdbLoading } = useMovieSearch2(searchQuery, isAddOpen);

    const handleSortChange = useCallback((newSort: SortOption) => {
        if (newSort === sort) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSort(newSort);
            setSortDir(DEFAULT_DIR[newSort]);
        }
    }, [sort]);

    const genreFilter = useMemo(() => {
        const genres: Genre[] = [];
        for (const k of filterKeys) if (k.startsWith("genre:")) genres.push(k.slice(6) as Genre);
        return genres;
    }, [filterKeys]);

    const statusFilter = useMemo(() => {
        const statuses: WatchStatus[] = [];
        for (const k of filterKeys) if (k.startsWith("status:")) statuses.push(k.slice(7) as WatchStatus);
        return statuses;
    }, [filterKeys]);

    const movieItems = useWatchlistItems("movie", genreFilter.length > 0 ? genreFilter : undefined);
    const tvItems = useWatchlistItems("tv", genreFilter.length > 0 ? genreFilter : undefined);
    const counts = useWatchlistCounts();
    const filterCounts = useFilterCounts();
    const { addToast } = useToast();

    // Apply status filter + sort + local search
    const filteredMovies = useMemo(() => {
        let items = movieItems;
        if (statusFilter.length > 0) items = items.filter((i) => statusFilter.includes(i.status));
        if (searchQuery.trim()) items = items.filter((i) => i.title.toLowerCase().includes(searchQuery.toLowerCase().trim()));
        return sortItems(items, sort, sortDir);
    }, [movieItems, statusFilter, sort, sortDir, searchQuery]);

    const filteredTv = useMemo(() => {
        let items = tvItems;
        if (statusFilter.length > 0) items = items.filter((i) => statusFilter.includes(i.status));
        if (searchQuery.trim()) items = items.filter((i) => i.title.toLowerCase().includes(searchQuery.toLowerCase().trim()));
        return sortItems(items, sort, sortDir);
    }, [tvItems, statusFilter, sort, sortDir, searchQuery]);

    // TMDB fallback: show when local search has 0 results and query is 2+ chars
    const showTmdbFallback = searchQuery.trim().length >= 2 && filteredMovies.length === 0 && filteredTv.length === 0 && !isAddOpen;

    // Detail modal
    const detailTmdbId = detailSearchResult?.id;
    const detailMediaType = detailSearchResult ? toMediaType(detailSearchResult.media_type as "movie" | "tv") : "movie";
    const detailWatchlistItem = useLiveQuery(
        () => (detailTmdbId ? db.items.get(buildId(detailMediaType, detailTmdbId)) : undefined),
        [detailTmdbId, detailMediaType],
    );

    // Keyboard shortcuts — Cmd+K opens add dialog, others only fire outside form inputs
    useHotkeys("mod+k", (e) => { e.preventDefault(); setIsAddOpen(true); }, { enableOnFormTags: true });
    useHotkeys("1", () => { if (!isAddOpen && !isDetailOpen) setActiveTab("movies"); }, { enableOnFormTags: false });
    useHotkeys("2", () => { if (!isAddOpen && !isDetailOpen) setActiveTab("series"); }, { enableOnFormTags: false });
    useHotkeys("c", () => { if (!isAddOpen && !isDetailOpen) setViewMode("grid"); }, { enableOnFormTags: false });
    useHotkeys("l", () => { if (!isAddOpen && !isDetailOpen) setViewMode("list"); }, { enableOnFormTags: false });

    const handleItemClick = useCallback((item: WatchlistItem) => {
        setDetailItem(item); setDetailSearchResult(null); setIsDetailOpen(true);
    }, []);
    const handleSearchSelect = useCallback((result: TmdbSearchResult) => {
        setDetailSearchResult(result); setDetailItem(null); setIsDetailOpen(true); setIsAddOpen(false);
    }, []);
    const handleCloseDetail = useCallback(() => {
        setIsDetailOpen(false); setDetailItem(null); setDetailSearchResult(null);
    }, []);
    const focusOnAdded = useCallback((mediaType: "movie" | "tv") => {
        setActiveTab(mediaType === "movie" ? "movies" : "series");
        setSearchQuery("");
    }, []);

    const handleDetailAdd = useCallback(async () => {
        if (detailSearchResult) {
            await addToWatchlist(detailSearchResult);
            addToast(`Added "${detailSearchResult.title || detailSearchResult.name}" to list`);
            focusOnAdded(toMediaType(detailSearchResult.media_type as "movie" | "tv"));
            handleCloseDetail();
        }
    }, [detailSearchResult, addToast, handleCloseDetail, focusOnAdded]);

    const activeDetailItem = detailItem || detailWatchlistItem || null;

    const handleDetailMarkWatched = useCallback(async () => {
        if (activeDetailItem) { await markAsWatched(activeDetailItem.id); addToast(`Marked "${activeDetailItem.title}" as watched`); handleCloseDetail(); }
    }, [activeDetailItem, addToast, handleCloseDetail]);
    const handleDetailMarkUnwatched = useCallback(async () => {
        if (activeDetailItem) { await markAsUnwatched(activeDetailItem.id); addToast(`Marked "${activeDetailItem.title}" as unwatched`); handleCloseDetail(); }
    }, [activeDetailItem, addToast, handleCloseDetail]);
    const handleDetailRemove = useCallback(async () => {
        if (activeDetailItem) { await removeFromWatchlist(activeDetailItem.id); addToast(`Removed "${activeDetailItem.title}"`); handleCloseDetail(); }
    }, [activeDetailItem, addToast, handleCloseDetail]);

    const handleMarkWatched = useCallback(async (id: string, title: string) => { await markAsWatched(id); addToast(`Marked "${title}" as watched`); }, [addToast]);
    const handleMarkUnwatched = useCallback(async (id: string, title: string) => { await markAsUnwatched(id); addToast(`Marked "${title}" as unwatched`); }, [addToast]);
    const handleRemove = useCallback(async (id: string, title: string) => { await removeFromWatchlist(id); addToast(`Removed "${title}"`); }, [addToast]);

    const gridActions = useCallback(
        (items: WatchlistItem[]) => ({
            onMarkWatched: (id: string) => { const item = items.find((i) => i.id === id); if (item) handleMarkWatched(id, item.title); },
            onMarkUnwatched: (id: string) => { const item = items.find((i) => i.id === id); if (item) handleMarkUnwatched(id, item.title); },
            onRemove: (id: string) => { const item = items.find((i) => i.id === id); if (item) handleRemove(id, item.title); },
            onItemClick: handleItemClick,
        }),
        [handleMarkWatched, handleMarkUnwatched, handleRemove, handleItemClick],
    );

    const emptyText = isDesktop ? "Press ⌘K to add movies and series." : "Tap + to add movies and series.";

    const renderItems = (items: WatchlistItem[], emptyTitle: string) => {
        if (viewMode === "list" && items.length > 0) {
            return <WatchlistList items={items} {...gridActions(items)} />;
        }
        return <WatchlistGrid items={items} emptyTitle={emptyTitle} emptyDescription={emptyText} {...gridActions(items)} />;
    };

    const handleTmdbResultAdd = useCallback(async (result: TmdbSearchResult) => {
        await addToWatchlist(result);
        addToast(`Added "${result.title || result.name}" to list`);
        focusOnAdded(toMediaType(result.media_type as "movie" | "tv"));
    }, [addToast, focusOnAdded]);

    return (
        <AppLayout
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddOpen={() => setIsAddOpen(true)}
            optionsSheet={
                <OptionsSheet
                    filterKeys={filterKeys}
                    onFilterChange={setFilterKeys}
                    filterCounts={filterCounts}
                    sort={sort}
                    sortDir={sortDir}
                    onSortChange={handleSortChange}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />
            }
            bottomTabs={
                <BottomTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    movieCount={counts.movies}
                    seriesCount={counts.tv}
                />
            }
        >
            <OfflineBanner />

            <div className="mx-auto w-full max-w-[800px] px-4 py-4 sm:py-6">
                {/* Desktop tabs — hidden on mobile (bottom tabs replace them) */}
                <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
                    <div className="hidden sm:block">
                        <TabList type="underline" size="md" fullWidth>
                            <Tab id="movies" badge={counts.movies}>Movies</Tab>
                            <Tab id="series" badge={counts.tv}>Series</Tab>
                        </TabList>
                    </div>

                    <TabPanel id="movies" className="pt-2 sm:pt-4">
                        {renderItems(filteredMovies, "No movies yet")}
                    </TabPanel>

                    <TabPanel id="series" className="pt-2 sm:pt-4">
                        {renderItems(filteredTv, "No series yet")}
                    </TabPanel>
                </Tabs>

                {/* TMDB fallback results */}
                {showTmdbFallback && (
                    <div className="mt-4">
                        <p className="mb-3 text-center text-xs text-tertiary">
                            No matches in your watchlist. Showing results from the web.
                        </p>
                        {tmdbLoading ? (
                            <div className="flex justify-center py-6">
                                <div className="size-5 animate-spin rounded-full border-2 border-tertiary border-t-brand-600" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {tmdbResults.slice(0, 6).map((result) => (
                                    <SearchResultItem
                                        key={result.id}
                                        result={result}
                                        isInWatchlist={false}
                                        isSelected={false}
                                        onAdd={() => handleTmdbResultAdd(result)}
                                        onClick={() => handleSearchSelect(result)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <SearchOverlay isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSelectItem={handleSearchSelect} onItemAdded={focusOnAdded} />
            <DetailModal item={activeDetailItem} searchResult={detailSearchResult} isOpen={isDetailOpen} onClose={handleCloseDetail} onAdd={handleDetailAdd} onMarkWatched={handleDetailMarkWatched} onMarkUnwatched={handleDetailMarkUnwatched} onRemove={handleDetailRemove} />
            <ToastContainer />
        </AppLayout>
    );
}

/** Lightweight TMDB search hook for the fallback — only searches when needed */
function useMovieSearch2(query: string, isAddDialogOpen: boolean) {
    const { results, isLoading, setQuery } = useMovieSearch();

    // Only trigger TMDB search when add dialog is NOT open and query is substantial
    useMemo(() => {
        if (!isAddDialogOpen && query.trim().length >= 2) {
            setQuery(query.trim());
        } else {
            setQuery("");
        }
    }, [query, isAddDialogOpen]);

    return { results, isLoading };
}
