import { Check, Eye, ReverseLeft, Trash01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import type { WatchlistItem } from "@/types/watchlist";
import { GENRE_BADGE_COLORS } from "@/types/watchlist";
import { cx } from "@/utils/cx";

interface WatchlistListProps {
    items: WatchlistItem[];
    onMarkWatched: (id: string) => void;
    onMarkUnwatched: (id: string) => void;
    onRemove: (id: string) => void;
    onItemClick: (item: WatchlistItem) => void;
}

export function WatchlistList({ items, onMarkWatched, onMarkUnwatched, onRemove, onItemClick }: WatchlistListProps) {
    return (
        <div className="flex flex-col divide-y divide-secondary">
            {items.map((item) => {
                const isWatched = item.status === "watched";
                return (
                    <div
                        key={item.id}
                        onClick={() => onItemClick(item)}
                        className="group flex cursor-pointer items-center gap-3 py-2.5 transition duration-100 ease-linear hover:bg-primary_hover"
                    >
                        {/* Poster */}
                        <div className="h-14 w-9 shrink-0 overflow-hidden rounded bg-tertiary">
                            {item.posterUrl ? (
                                <img src={item.posterUrl} alt="" className="size-full object-cover" loading="lazy" />
                            ) : (
                                <div className="flex size-full items-center justify-center text-[8px] text-quaternary">N/A</div>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <div className="flex items-center gap-2">
                                <span className={cx("truncate text-sm font-medium text-primary", isWatched && "text-tertiary")}>
                                    {item.title}
                                </span>
                                {isWatched && <Check className="size-3.5 shrink-0 text-fg-success-primary" />}
                            </div>
                            <div className="flex items-center gap-1.5">
                                {item.releaseDate && <span className="text-xs text-quaternary">{item.releaseDate}</span>}
                                {item.genres.slice(0, 3).map((genre) => (
                                    <Badge key={genre} size="sm" color={GENRE_BADGE_COLORS[genre]}>
                                        {genre}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Actions (visible on hover) */}
                        <div className="flex shrink-0 items-center gap-1 opacity-0 transition duration-100 ease-linear group-hover:opacity-100">
                            {isWatched ? (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onMarkUnwatched(item.id); }}
                                    className="flex size-7 cursor-pointer items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
                                    aria-label="Mark as unwatched"
                                >
                                    <ReverseLeft className="size-3.5" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onMarkWatched(item.id); }}
                                    className="flex size-7 cursor-pointer items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-secondary hover:text-fg-secondary"
                                    aria-label="Mark as watched"
                                >
                                    <Eye className="size-3.5" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                                className="flex size-7 cursor-pointer items-center justify-center rounded-md text-fg-quaternary transition duration-100 ease-linear hover:bg-error-secondary hover:text-fg-error-secondary"
                                aria-label="Remove"
                            >
                                <Trash01 className="size-3.5" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
