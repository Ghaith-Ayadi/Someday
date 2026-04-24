import { Check, Eye, Plus } from "@untitledui/icons";
import type { TmdbSearchResult } from "@/lib/tmdb";
import { posterUrl } from "@/lib/tmdb";
import type { WatchStatus } from "@/types/watchlist";
import { cx } from "@/utils/cx";

interface SearchResultItemProps {
    result: TmdbSearchResult;
    isInWatchlist: boolean;
    watchStatus?: WatchStatus;
    isSelected: boolean;
    onAdd: () => void;
    onClick: () => void;
    onHover?: () => void;
    compact?: boolean;
}

export function SearchResultItem({ result, isInWatchlist, watchStatus, isSelected, onAdd, onClick, onHover, compact }: SearchResultItemProps) {
    const poster = posterUrl(result.poster_path, "w154");
    const title = result.title || result.name || "Unknown";
    const year = (result.release_date || result.first_air_date || "").slice(0, 4);

    return (
        <div
            role="option"
            aria-selected={isSelected}
            className={cx(
                "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition duration-100 ease-linear",
                isSelected ? "bg-active" : "hover:bg-primary_hover",
            )}
            onClick={onClick}
            onMouseEnter={onHover}
        >
            {/* Poster thumbnail */}
            {!compact && (
                <div className="h-18 w-12 shrink-0 overflow-hidden rounded bg-tertiary">
                    {poster ? (
                        <img src={poster} alt="" className="size-full object-cover" loading="lazy" />
                    ) : (
                        <div className="flex size-full items-center justify-center text-[9px] text-quaternary">N/A</div>
                    )}
                </div>
            )}

            {/* Info */}
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium text-primary">{title}</span>
                    {watchStatus === "watched" && (
                        <Check className="size-3 shrink-0 text-fg-success-primary" strokeWidth={3} />
                    )}
                    {watchStatus === "watchlist" && (
                        <Eye className="size-3 shrink-0 text-fg-brand-primary" strokeWidth={2} />
                    )}
                </div>
                <span className="text-xs text-quaternary">{year}</span>
            </div>

            {/* Action */}
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isInWatchlist) onAdd();
                }}
                className={cx(
                    "flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition duration-100 ease-linear",
                    isInWatchlist
                        ? "text-fg-success-primary"
                        : "text-fg-quaternary opacity-0 hover:text-fg-secondary",
                    isSelected && !isInWatchlist && "opacity-100",
                )}
                aria-label={isInWatchlist ? "Already added" : "Add to watchlist"}
            >
                {isInWatchlist ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
            </button>
        </div>
    );
}
