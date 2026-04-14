import { useCallback, useMemo, useState } from "react";
import { FilterLines, SwitchVertical01 } from "@untitledui/icons";
import { useHotkeys } from "react-hotkeys-hook";
import { AppLayout, type ViewMode } from "@/components/app/app-layout";
import { DetailModal } from "@/components/app/detail-modal";
import { FilterPopover, SortPopover } from "@/components/app/filter-popover";
import { OfflineBanner } from "@/components/app/offline-banner";
import { SearchOverlay } from "@/components/app/search-overlay";
import { ToastContainer } from "@/components/app/toast";
import { WatchlistGrid } from "@/components/app/watchlist-grid";
import { WatchlistList } from "@/components/app/watchlist-list";
import { Tab, TabList, TabPanel, Tabs } from "@/components/application/tabs/tabs";
import { addToWatchlist, markAsUnwatched, markAsWatched, removeFromWatchlist, useFilterCounts, useWatchlistCounts, useWatchlistItems } from "@/hooks/use-watchlist";
import type { OmdbSearchItem } from "@/lib/tmdb";
import { toMediaType } from "@/lib/tmdb";
import { useToast } from "@/providers/toast-provider";
import type { Genre, WatchlistItem, WatchStatus } from "@/types/watchlist";
import { ALL_GENRES, buildId } from "@/types/watchlist";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

type SortOption = "added" | "name" | "year" | "genre" | "status";
type SortDir = "asc" | "desc";

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
    { id: "added", label: "Date added" },
    { id: "name", label: "Name" },
    { id: "year", label: "Year" },
    { id: "genre", label: "Genre" },
    { id: "status", label: "Watch status" },
];

const FILTER_OPTIONS = [
    { id: "status:watchlist", label: "To watch", group: "Watch status" },
    { id: "status:watched", label: "Watched", group: "Watch status" },
    ...ALL_GENRES.map((g) => ({ id: `genre:${g}`, label: g, group: "Genre" })),
];

function sortItems(items: WatchlistItem[], sort: SortOption, dir: SortDir): WatchlistItem[] {
    const sorted = [...items];
    const d = dir === "asc" ? 1 : -1;
    switch (sort) {
        case "added":
            return sorted.sort((a, b) => d * (a.addedAt - b.addedAt));
        case "name":
            return sorted.sort((a, b) => d * a.title.localeCompare(b.title));
        case "year":
            return sorted.sort((a, b) => d * (a.releaseDate || "").localeCompare(b.releaseDate || ""));
        case "genre":
            return sorted.sort((a, b) => d * (a.genres[0] || "").localeCompare(b.genres[0] || ""));
        case "status":
            return sorted.sort((a, b) => {
                if (a.status === b.status) return d * a.title.localeCompare(b.title);
                return d * (a.status === "watchlist" ? -1 : 1);
            });
        default:
            return sorted;
    }
}

/** Default direction for each sort option */
const DEFAULT_DIR: Record<SortOption, SortDir> = {
    added: "desc",
    name: "asc",
    year: "desc",
    genre: "asc",
    status: "asc",
};

export function WatchlistPage() {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [detailItem, setDetailItem] = useState<WatchlistItem | null>(null);
    const [detailSearchResult, setDetailSearchResult] = useState<OmdbSearchItem | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [filterKeys, setFilterKeys] = useState<Set<string>>(new Set());
    const [sort, setSort] = useState<SortOption>("added");
    const [sortDir, setSortDir] = useState<SortDir>("desc");

    const handleSortChange = useCallback((newSort: SortOption) => {
        if (newSort === sort) {
            // Toggle direction
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSort(newSort);
            setSortDir(DEFAULT_DIR[newSort]);
        }
    }, [sort]);
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [activeTab, setActiveTab] = useState<string>("movies");

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

    const filteredMovies = useMemo(() => {
        let items = movieItems;
        if (statusFilter.length > 0) items = items.filter((i) => statusFilter.includes(i.status));
        return sortItems(items, sort, sortDir);
    }, [movieItems, statusFilter, sort, sortDir]);

    const filteredTv = useMemo(() => {
        let items = tvItems;
        if (statusFilter.length > 0) items = items.filter((i) => statusFilter.includes(i.status));
        return sortItems(items, sort, sortDir);
    }, [tvItems, statusFilter, sort, sortDir]);

    const detailImdbId = detailSearchResult?.imdbID;
    const detailMediaType = detailSearchResult ? toMediaType(detailSearchResult.Type) : "movie";
    const detailWatchlistItem = useLiveQuery(
        () => (detailImdbId ? db.items.get(buildId(detailMediaType, detailImdbId)) : undefined),
        [detailImdbId, detailMediaType],
    );

    useHotkeys("mod+k", (e) => { e.preventDefault(); setIsSearchOpen(true); });
    useHotkeys("1", () => { if (!isSearchOpen && !isDetailOpen) setActiveTab("movies"); });
    useHotkeys("2", () => { if (!isSearchOpen && !isDetailOpen) setActiveTab("series"); });
    useHotkeys("c", () => { if (!isSearchOpen && !isDetailOpen) setViewMode("grid"); });
    useHotkeys("l", () => { if (!isSearchOpen && !isDetailOpen) setViewMode("list"); });

    const handleItemClick = useCallback((item: WatchlistItem) => {
        setDetailItem(item); setDetailSearchResult(null); setIsDetailOpen(true);
    }, []);
    const handleSearchSelect = useCallback((result: OmdbSearchItem) => {
        setDetailSearchResult(result); setDetailItem(null); setIsDetailOpen(true); setIsSearchOpen(false);
    }, []);
    const handleCloseDetail = useCallback(() => {
        setIsDetailOpen(false); setDetailItem(null); setDetailSearchResult(null);
    }, []);

    const handleDetailAdd = useCallback(async () => {
        if (detailSearchResult) {
            await addToWatchlist(detailSearchResult);
            addToast(`Added "${detailSearchResult.Title}" to list`);
            handleCloseDetail();
        }
    }, [detailSearchResult, addToast, handleCloseDetail]);

    const activeDetailItem = detailItem || detailWatchlistItem || null;

    const handleDetailMarkWatched = useCallback(async () => {
        if (activeDetailItem) { await markAsWatched(activeDetailItem.id); addToast(`Marked "${activeDetailItem.title}" as watched`); handleCloseDetail(); }
    }, [activeDetailItem, addToast, handleCloseDetail]);
    const handleDetailMarkUnwatched = useCallback(async () => {
        if (activeDetailItem) { await markAsUnwatched(activeDetailItem.id); addToast(`Marked "${activeDetailItem.title}" as unwatched`); handleCloseDetail(); }
    }, [activeDetailItem, addToast, handleCloseDetail]);
    const handleDetailRemove = useCallback(async () => {
        if (activeDetailItem) { await removeFromWatchlist(activeDetailItem.id); addToast(`Removed "${activeDetailItem.title}" `); handleCloseDetail(); }
    }, [activeDetailItem, addToast, handleCloseDetail]);

    const handleMarkWatched = useCallback(async (id: string, title: string) => { await markAsWatched(id); addToast(`Marked "${title}" as watched`); }, [addToast]);
    const handleMarkUnwatched = useCallback(async (id: string, title: string) => { await markAsUnwatched(id); addToast(`Marked "${title}" as unwatched`); }, [addToast]);
    const handleRemove = useCallback(async (id: string, title: string) => { await removeFromWatchlist(id); addToast(`Removed "${title}" `); }, [addToast]);

    const activeFilterCount = filterKeys.size;

    const gridActions = useCallback(
        (items: WatchlistItem[]) => ({
            onMarkWatched: (id: string) => { const item = items.find((i) => i.id === id); if (item) handleMarkWatched(id, item.title); },
            onMarkUnwatched: (id: string) => { const item = items.find((i) => i.id === id); if (item) handleMarkUnwatched(id, item.title); },
            onRemove: (id: string) => { const item = items.find((i) => i.id === id); if (item) handleRemove(id, item.title); },
            onItemClick: handleItemClick,
        }),
        [handleMarkWatched, handleMarkUnwatched, handleRemove, handleItemClick],
    );

    const renderItems = (items: WatchlistItem[], emptyTitle: string, emptyDesc: string) => {
        if (viewMode === "list" && items.length > 0) {
            return <WatchlistList items={items} {...gridActions(items)} />;
        }
        return <WatchlistGrid items={items} emptyTitle={emptyTitle} emptyDescription={emptyDesc} {...gridActions(items)} />;
    };

    return (
        <AppLayout
            onSearchOpen={() => setIsSearchOpen(true)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filterTrigger={
                <FilterPopover
                    options={FILTER_OPTIONS}
                    selected={filterKeys}
                    onChange={setFilterKeys}
                    icon={FilterLines}
                    label={activeFilterCount > 0 ? `${activeFilterCount}` : undefined}
                    counts={filterCounts}
                />
            }
            sortTrigger={
                <SortPopover options={SORT_OPTIONS} value={sort} direction={sortDir} onChange={handleSortChange} icon={SwitchVertical01} />
            }
        >
            <OfflineBanner />

            <div className="mx-auto w-full max-w-[800px] px-4 py-6">
                <Tabs selectedKey={activeTab} onSelectionChange={(key) => setActiveTab(key as string)}>
                    <TabList type="underline" size="md" fullWidth>
                        <Tab id="movies" badge={counts.movies}>Movies</Tab>
                        <Tab id="series" badge={counts.tv}>Series</Tab>
                    </TabList>

                    <TabPanel id="movies" className="pt-4">
                        {renderItems(filteredMovies, "No movies yet", "Press ⌘K to search and add movies.")}
                    </TabPanel>

                    <TabPanel id="series" className="pt-4">
                        {renderItems(filteredTv, "No series yet", "Press ⌘K to search and add series.")}
                    </TabPanel>
                </Tabs>
            </div>

            <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSelectItem={handleSearchSelect} />
            <DetailModal item={activeDetailItem} searchResult={detailSearchResult} isOpen={isDetailOpen} onClose={handleCloseDetail} onAdd={handleDetailAdd} onMarkWatched={handleDetailMarkWatched} onMarkUnwatched={handleDetailMarkUnwatched} onRemove={handleDetailRemove} />
            <ToastContainer />
        </AppLayout>
    );
}
