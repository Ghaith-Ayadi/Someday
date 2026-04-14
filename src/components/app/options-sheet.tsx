import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, LayoutGrid01, List, Menu01, Moon01, Sun } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "@/providers/theme-provider";
import type { Genre, WatchStatus } from "@/types/watchlist";
import { ALL_GENRES, GENRE_BADGE_COLORS } from "@/types/watchlist";
import { cx } from "@/utils/cx";

export type ViewMode = "grid" | "list";
type SortOption = "added" | "name" | "year" | "genre" | "status";
type SortDir = "asc" | "desc";

interface OptionsSheetProps {
    // Filter
    filterKeys: Set<string>;
    onFilterChange: (keys: Set<string>) => void;
    filterCounts: Map<string, { movies: number; series: number }>;
    // Sort
    sort: SortOption;
    sortDir: SortDir;
    onSortChange: (sort: SortOption) => void;
    // View
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
    { id: "added", label: "Date added" },
    { id: "name", label: "Name" },
    { id: "year", label: "Year" },
    { id: "genre", label: "Genre" },
    { id: "status", label: "Watch status" },
];

const FILTER_STATUS: { id: string; label: string }[] = [
    { id: "status:watchlist", label: "To watch" },
    { id: "status:watched", label: "Watched" },
];

export function OptionsSheet(props: OptionsSheetProps) {
    const { filterKeys, onFilterChange, filterCounts, sort, sortDir, onSortChange, viewMode, onViewModeChange } = props;
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    const toggleFilter = (id: string) => {
        const next = new Set(filterKeys);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onFilterChange(next);
    };

    const activeFilterCount = filterKeys.size;

    return (
        <div ref={ref} className="relative">
            {/* Hamburger trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cx(
                    "relative flex size-9 cursor-pointer items-center justify-center rounded-lg transition duration-100 ease-linear",
                    isOpen ? "bg-active text-fg-secondary" : "text-fg-quaternary hover:text-fg-secondary hover:bg-primary_hover",
                )}
                aria-label="Options"
            >
                <Menu01 className="size-5" />
                {activeFilterCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-brand-solid text-[9px] font-bold text-white">
                        {activeFilterCount}
                    </span>
                )}
            </button>

            {/* Sheet/dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Mobile: bottom sheet with backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-overlay/50 sm:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 30, stiffness: 400 }}
                            className="fixed inset-x-0 bottom-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-primary pb-[env(safe-area-inset-bottom)] shadow-xl ring-1 ring-secondary sm:hidden"
                        >
                            {/* Handle */}
                            <div className="flex justify-center py-2">
                                <div className="h-1 w-8 rounded-full bg-quaternary" />
                            </div>
                            <div className="px-4 pb-1 text-sm font-semibold text-primary">Options</div>
                            {renderContent()}
                        </motion.div>

                        {/* Desktop: dropdown */}
                        <div className="absolute right-0 z-50 mt-1 hidden w-64 overflow-hidden rounded-lg bg-primary shadow-lg ring-1 ring-secondary_alt sm:block">
                            <div className="max-h-[70vh] overflow-y-auto">
                                {renderContent()}
                            </div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );

    function renderContent() {
        return (
            <div className="flex flex-col gap-1 p-2">
                {/* View toggle */}
                <div className="flex items-center justify-between rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-secondary">View</span>
                    <div className="flex rounded-lg border border-secondary p-0.5">
                        <button
                            type="button"
                            onClick={() => onViewModeChange("grid")}
                            className={cx(
                                "flex size-7 cursor-pointer items-center justify-center rounded-md transition duration-100 ease-linear",
                                viewMode === "grid" ? "bg-active text-fg-secondary" : "text-fg-quaternary",
                            )}
                        >
                            <LayoutGrid01 className="size-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewModeChange("list")}
                            className={cx(
                                "flex size-7 cursor-pointer items-center justify-center rounded-md transition duration-100 ease-linear",
                                viewMode === "list" ? "bg-active text-fg-secondary" : "text-fg-quaternary",
                            )}
                        >
                            <List className="size-4" />
                        </button>
                    </div>
                </div>

                {/* Theme toggle */}
                <button
                    type="button"
                    onClick={() => setTheme(isDark ? "light" : "dark")}
                    className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition duration-100 ease-linear hover:bg-primary_hover"
                >
                    <span className="text-sm font-medium text-secondary">Theme</span>
                    <span className="flex items-center gap-1.5 text-xs text-tertiary">
                        {isDark ? <Moon01 className="size-3.5" /> : <Sun className="size-3.5" />}
                        {isDark ? "Dark" : "Light"}
                    </span>
                </button>

                <div className="my-1 h-px bg-border-secondary" />

                {/* Sort */}
                <div className="px-3 pt-1 pb-0.5 text-xs font-semibold text-quaternary">Sort</div>
                {SORT_OPTIONS.map((opt) => {
                    const isActive = sort === opt.id;
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => onSortChange(opt.id)}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm font-medium text-secondary transition duration-100 ease-linear hover:bg-primary_hover"
                        >
                            <Check className={cx("size-4 shrink-0 text-fg-brand-primary", !isActive && "invisible")} strokeWidth={2.5} />
                            <span className="flex-1">{opt.label}</span>
                            {isActive && <span className="text-xs text-quaternary">{sortDir === "asc" ? "↑" : "↓"}</span>}
                        </button>
                    );
                })}

                <div className="my-1 h-px bg-border-secondary" />

                {/* Filter: Status */}
                <div className="px-3 pt-1 pb-0.5 text-xs font-semibold text-quaternary">Watch status</div>
                {FILTER_STATUS.map((opt) => {
                    const c = filterCounts.get(opt.id);
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => toggleFilter(opt.id)}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm font-medium text-secondary transition duration-100 ease-linear hover:bg-primary_hover"
                        >
                            <div className={cx(
                                "flex size-4 shrink-0 items-center justify-center rounded border transition duration-100 ease-linear",
                                filterKeys.has(opt.id) ? "border-brand-600 bg-brand-solid" : "border-primary bg-primary",
                            )}>
                                {filterKeys.has(opt.id) && <Check className="size-3 text-white" strokeWidth={3} />}
                            </div>
                            <span className="flex-1">{opt.label}</span>
                            {c && <span className="text-xs text-quaternary">{c.movies}M · {c.series}S</span>}
                        </button>
                    );
                })}

                {/* Filter: Genre */}
                <div className="px-3 pt-2 pb-0.5 text-xs font-semibold text-quaternary">Genre</div>
                {ALL_GENRES.map((genre) => {
                    const id = `genre:${genre}`;
                    const c = filterCounts.get(id);
                    return (
                        <button
                            key={id}
                            type="button"
                            onClick={() => toggleFilter(id)}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm font-medium text-secondary transition duration-100 ease-linear hover:bg-primary_hover"
                        >
                            <div className={cx(
                                "flex size-4 shrink-0 items-center justify-center rounded border transition duration-100 ease-linear",
                                filterKeys.has(id) ? "border-brand-600 bg-brand-solid" : "border-primary bg-primary",
                            )}>
                                {filterKeys.has(id) && <Check className="size-3 text-white" strokeWidth={3} />}
                            </div>
                            <span className="flex-1 capitalize">{genre}</span>
                            {c && <span className="text-xs text-quaternary">{c.movies}M · {c.series}S</span>}
                        </button>
                    );
                })}

                <div className="h-2" />
            </div>
        );
    }
}
