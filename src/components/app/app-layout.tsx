import { type ReactNode, useEffect, useRef } from "react";
import { Plus, SearchLg, XClose } from "@untitledui/icons";

interface AppLayoutProps {
    children: ReactNode;
    /** Local search query for filtering watchlist */
    searchQuery: string;
    onSearchChange: (query: string) => void;
    /** Opens the TMDB add dialog */
    onAddOpen: () => void;
    /** Options sheet rendered as a slot (hamburger + sheet) */
    optionsSheet: ReactNode;
    /** Bottom tabs for mobile (rendered as a slot) */
    bottomTabs?: ReactNode;
}

export function AppLayout({ children, searchQuery, onSearchChange, onAddOpen, optionsSheet, bottomTabs }: AppLayoutProps) {
    const searchRef = useRef<HTMLInputElement>(null);

    // Auto-focus the header search on desktop. On mobile we deliberately skip this
    // to avoid the keyboard popping up on every page load.
    useEffect(() => {
        if (window.matchMedia("(min-width: 640px)").matches) {
            searchRef.current?.focus();
        }
    }, []);

    return (
        <div className="flex h-dvh flex-col overflow-x-hidden bg-primary">
            {/* Header — border spans full width, inner content capped to match main */}
            <header className="h-14 shrink-0 border-b border-secondary">
                <div className="mx-auto flex h-full max-w-5xl items-center gap-2 px-3">
                    <img src="/favicon.png" alt="Someday" className="size-7 shrink-0 rounded-md" />
                    <span className="hidden text-md font-semibold text-primary sm:block">Someday</span>

                    {/* Local filter */}
                    <div className="relative mx-2 flex flex-1 items-center">
                        <SearchLg className="pointer-events-none absolute left-2.5 size-4 text-fg-quaternary" />
                        <input
                            ref={searchRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            placeholder="Search watchlist..."
                            className="w-full rounded-lg border border-secondary bg-primary py-1.5 pl-8 pr-8 text-base text-primary outline-none placeholder:text-placeholder transition duration-100 ease-linear focus:border-brand focus:ring-1 focus:ring-brand sm:text-sm"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => onSearchChange("")}
                                className="absolute right-2 flex size-5 cursor-pointer items-center justify-center rounded text-fg-quaternary hover:text-fg-secondary"
                            >
                                <XClose className="size-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Add button — desktop only, with ⌘K hint */}
                    <button
                        type="button"
                        onClick={onAddOpen}
                        className="hidden shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-brand-solid py-1.5 pl-3 pr-2 text-sm font-semibold text-white shadow-xs transition duration-100 ease-linear hover:bg-brand-solid_hover sm:flex"
                    >
                        <Plus className="size-4" />
                        Add
                        <kbd className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium opacity-90">⌘K</kbd>
                    </button>

                    {optionsSheet}
                </div>
            </header>

            {/* Main content — add bottom padding on mobile for bottom tabs + FAB */}
            <main className="flex-1 overflow-y-auto pb-20 sm:pb-0">{children}</main>

            {/* Bottom tabs — mobile only */}
            {bottomTabs}

            {/* FAB — mobile only */}
            <button
                type="button"
                onClick={onAddOpen}
                className="fixed right-4 z-30 flex size-14 cursor-pointer items-center justify-center rounded-full bg-brand-solid text-white shadow-lg transition duration-100 ease-linear hover:bg-brand-solid_hover active:scale-95 sm:hidden"
                style={{ bottom: "calc(env(safe-area-inset-bottom) + 72px)" }}
                aria-label="Add to watchlist"
            >
                <Plus className="size-6" />
            </button>
        </div>
    );
}
