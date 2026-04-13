import { Check, Plus } from "@untitledui/icons";
import type { OmdbSearchItem } from "@/lib/tmdb";
import { posterUrl } from "@/lib/tmdb";
import { cx } from "@/utils/cx";

interface SearchResultItemProps {
    result: OmdbSearchItem;
    isInWatchlist: boolean;
    isSelected: boolean;
    onAdd: () => void;
    onClick: () => void;
    onHover?: () => void;
    compact?: boolean;
}

export function SearchResultItem({ result, isInWatchlist, isSelected, onAdd, onClick, onHover, compact }: SearchResultItemProps) {
    const poster = posterUrl(result.Poster);
    const year = result.Year.slice(0, 4);

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
                <div className="h-10 w-7 shrink-0 overflow-hidden rounded bg-tertiary">
                    {poster ? (
                        <img src={poster} alt="" className="size-full object-cover" loading="lazy" />
                    ) : (
                        <div className="flex size-full items-center justify-center text-[7px] text-quaternary">N/A</div>
                    )}
                </div>
            )}

            {/* Info */}
            <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-primary">{result.Title}</span>
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
                        : "text-fg-quaternary opacity-0 group-hover:opacity-100 hover:text-fg-secondary",
                    isSelected && !isInWatchlist && "opacity-100",
                )}
                aria-label={isInWatchlist ? "Already added" : "Add to watchlist"}
            >
                {isInWatchlist ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
            </button>
        </div>
    );
}
