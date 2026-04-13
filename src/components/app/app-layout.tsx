import type { ReactNode } from "react";
import { Film01, FilterLines, LayoutGrid01, List, Moon01, SearchLg, Sun, SwitchVertical01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useTheme } from "@/providers/theme-provider";
import { cx } from "@/utils/cx";

export type ViewMode = "grid" | "list";

interface AppLayoutProps {
    children: ReactNode;
    onSearchOpen: () => void;
    filterTrigger: ReactNode;
    sortTrigger: ReactNode;
    viewMode: ViewMode;
    onViewModeChange: (mode: ViewMode) => void;
}

export function AppLayout({ children, onSearchOpen, filterTrigger, sortTrigger, viewMode, onViewModeChange }: AppLayoutProps) {
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    return (
        <div className="flex h-dvh flex-col bg-primary">
            {/* Header */}
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-secondary px-4">
                <div className="flex items-center gap-2">
                    <Film01 className="size-5 text-fg-brand-primary" />
                    <h1 className="text-md font-semibold text-primary">Anderson</h1>
                </div>

                <div className="flex items-center gap-1.5">
                    {/* Search trigger */}
                    <button
                        type="button"
                        onClick={onSearchOpen}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-1.5 text-sm text-placeholder transition duration-100 ease-linear hover:border-primary hover:bg-primary_hover"
                    >
                        <SearchLg className="size-4 text-fg-quaternary" />
                        <span className="hidden sm:inline">Search...</span>
                        <kbd className="hidden rounded border border-secondary bg-secondary px-1.5 py-0.5 text-xs font-medium text-tertiary sm:inline">
                            {navigator.platform?.includes("Mac") ? "\u2318" : "Ctrl"}K
                        </kbd>
                    </button>

                    {/* Divider */}
                    <div className="mx-0.5 h-5 w-px bg-border-secondary" />

                    {/* Filter */}
                    {filterTrigger}

                    {/* Sort */}
                    {sortTrigger}

                    {/* View toggle */}
                    <div className="flex rounded-lg border border-secondary p-0.5">
                        <button
                            type="button"
                            onClick={() => onViewModeChange("grid")}
                            className={cx(
                                "flex size-7 cursor-pointer items-center justify-center rounded-md transition duration-100 ease-linear",
                                viewMode === "grid" ? "bg-active text-fg-secondary" : "text-fg-quaternary hover:text-fg-tertiary",
                            )}
                            aria-label="Grid view"
                        >
                            <LayoutGrid01 className="size-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewModeChange("list")}
                            className={cx(
                                "flex size-7 cursor-pointer items-center justify-center rounded-md transition duration-100 ease-linear",
                                viewMode === "list" ? "bg-active text-fg-secondary" : "text-fg-quaternary hover:text-fg-tertiary",
                            )}
                            aria-label="List view"
                        >
                            <List className="size-4" />
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="mx-0.5 h-5 w-px bg-border-secondary" />

                    {/* Theme toggle */}
                    <Button
                        size="sm"
                        color="tertiary"
                        iconLeading={isDark ? Sun : Moon01}
                        aria-label="Toggle theme"
                        onClick={() => setTheme(isDark ? "light" : "dark")}
                    />
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
    );
}
