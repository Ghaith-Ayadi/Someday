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

function Dot() {
    return <span className="text-quaternary">·</span>;
}

export function WatchlistList({ items, onMarkWatched, onMarkUnwatched, onRemove, onItemClick }: WatchlistListProps) {
    return (
        <div className="flex flex-col divide-y divide-secondary">
            {items.map((item) => {
                const isWatched = item.status === "watched";
                const meta = [
                    item.releaseDate,
                    item.runtime,
                    item.rated && item.rated !== "N/A" ? item.rated : null,
                    item.imdbRating ? `★ ${item.imdbRating}` : null,
                ].filter(Boolean);

                return (
                    <div
                        key={item.id}
                        onClick={() => onItemClick(item)}
                        className="group flex cursor-pointer gap-3.5 py-3 transition duration-100 ease-linear hover:bg-primary_hover"
                    >
                        {/* Poster — 128px tall */}
                        <div className="h-32 w-[86px] shrink-0 overflow-hidden rounded-md bg-tertiary">
                            {item.posterUrl ? (
                                <img src={item.posterUrl} alt="" className="size-full object-cover" loading="lazy" />
                            ) : (
                                <div className="flex size-full items-center justify-center text-xs text-quaternary">N/A</div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                            {/* Title row */}
                            <div className="flex items-center gap-2">
                                <span className={cx("truncate text-sm font-semibold text-primary", isWatched && "text-tertiary")}>
                                    {item.title}
                                </span>
                                {isWatched && <Check className="size-3.5 shrink-0 text-fg-success-primary" />}
                            </div>

                            {/* Meta row with dot dividers */}
                            {meta.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-quaternary">
                                    {meta.map((m, i) => (
                                        <span key={i} className="flex items-center gap-1.5">
                                            {i > 0 && <Dot />}
                                            <span>{m}</span>
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Director & actors */}
                            {(item.director || item.actors) && (
                                <div className="flex items-center gap-1.5 text-xs text-tertiary">
                                    {item.director && (
                                        <span className="truncate">
                                            <span className="text-quaternary">Dir.</span> {item.director}
                                        </span>
                                    )}
                                    {item.director && item.actors && <Dot />}
                                    {item.actors && <span className="truncate">{item.actors}</span>}
                                </div>
                            )}

                            {/* Overview snippet */}
                            {item.overview && (
                                <p className="line-clamp-2 text-xs text-quaternary">{item.overview}</p>
                            )}

                            {/* Genres */}
                            {item.genres.length > 0 && (
                                <div className="flex items-center gap-1">
                                    {item.genres.slice(0, 4).map((genre) => (
                                        <Badge key={genre} size="sm" color={GENRE_BADGE_COLORS[genre]} className="capitalize">
                                            {genre}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions (visible on hover) */}
                        <div className="flex shrink-0 items-center gap-1 self-center opacity-0 transition duration-100 ease-linear group-hover:opacity-100">
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
