import { useState } from "react";
import { Check, Eye, ReverseLeft, Trash01 } from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import type { WatchlistItem } from "@/types/watchlist";
import { GENRE_BADGE_COLORS } from "@/types/watchlist";
import { cx } from "@/utils/cx";

interface WatchlistCardProps {
    item: WatchlistItem;
    onMarkWatched: () => void;
    onMarkUnwatched: () => void;
    onRemove: () => void;
    onClick: () => void;
}

export function WatchlistCard({ item, onMarkWatched, onMarkUnwatched, onRemove, onClick }: WatchlistCardProps) {
    const [isHovered, setIsHovered] = useState(false);
    const { posterUrl: poster } = item;
    const isWatched = item.status === "watched";

    return (
        <div
            className="group relative cursor-pointer overflow-hidden rounded-lg shadow-sm ring-1 ring-secondary ring-inset transition duration-100 ease-linear hover:shadow-md hover:ring-primary"
            style={{ aspectRatio: "2/3" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            {/* Poster image */}
            {poster ? (
                <img src={poster} alt={item.title} className="size-full object-cover" loading="lazy" />
            ) : (
                <div className="flex size-full items-center justify-center bg-tertiary p-2 text-center text-xs text-quaternary">
                    {item.title}
                </div>
            )}

            {/* Watched badge */}
            {isWatched && (
                <div className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-success-primary">
                    <Check className="size-3.5 text-white" strokeWidth={3} />
                </div>
            )}

            {/* Hover overlay */}
            <div
                className={cx(
                    "absolute inset-0 flex flex-col justify-end bg-linear-to-t from-black/80 via-black/40 to-transparent p-2.5 transition duration-150 ease-linear",
                    isHovered ? "opacity-100" : "opacity-0",
                )}
            >
                {/* Genre badges */}
                <div className="mb-1.5 flex flex-wrap gap-1">
                    {item.genres.slice(0, 2).map((genre) => (
                        <Badge key={genre} size="sm" color={GENRE_BADGE_COLORS[genre]}>
                            {genre}
                        </Badge>
                    ))}
                </div>

                {/* Title and year */}
                <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                {item.releaseDate && <p className="text-xs text-white/70">{item.releaseDate}</p>}

                {/* Action buttons */}
                <div className="mt-2 flex gap-1.5">
                    {isWatched ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onMarkUnwatched();
                            }}
                            className="flex size-7 cursor-pointer items-center justify-center rounded-md bg-white/20 text-white backdrop-blur-sm transition duration-100 ease-linear hover:bg-white/30"
                            aria-label="Mark as unwatched"
                        >
                            <ReverseLeft className="size-3.5" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onMarkWatched();
                            }}
                            className="flex size-7 cursor-pointer items-center justify-center rounded-md bg-white/20 text-white backdrop-blur-sm transition duration-100 ease-linear hover:bg-white/30"
                            aria-label="Mark as watched"
                        >
                            <Eye className="size-3.5" />
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="flex size-7 cursor-pointer items-center justify-center rounded-md bg-white/20 text-white backdrop-blur-sm transition duration-100 ease-linear hover:bg-red-500/60"
                        aria-label="Remove from watchlist"
                    >
                        <Trash01 className="size-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
