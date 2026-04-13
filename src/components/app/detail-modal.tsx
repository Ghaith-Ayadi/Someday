import { Eye, Plus, ReverseLeft, Star01, Trash01, XClose } from "@untitledui/icons";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import type { OmdbSearchItem } from "@/lib/tmdb";
import { posterUrl, toMediaType } from "@/lib/tmdb";
import type { WatchlistItem } from "@/types/watchlist";
import { GENRE_BADGE_COLORS } from "@/types/watchlist";

interface DetailModalProps {
    item: WatchlistItem | null;
    searchResult: OmdbSearchItem | null;
    isOpen: boolean;
    onClose: () => void;
    onAdd: () => void;
    onMarkWatched: () => void;
    onMarkUnwatched: () => void;
    onRemove: () => void;
}

export function DetailModal({ item, searchResult, isOpen, onClose, onAdd, onMarkWatched, onMarkUnwatched, onRemove }: DetailModalProps) {
    if (!isOpen) return null;

    const title = item?.title || searchResult?.Title || "Unknown";
    const overview = item?.overview || "";
    const poster = item?.posterUrl || posterUrl(searchResult?.Poster);
    const year = item?.releaseDate || (searchResult?.Year || "").slice(0, 4);
    const rating = item?.voteAverage || 0;
    const genres = item?.genres || [];
    const mediaType = item?.mediaType || (searchResult ? toMediaType(searchResult.Type) : "movie");
    const isWatched = item?.status === "watched";
    const isInWatchlist = !!item;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-overlay/70 px-4 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-xl border border-secondary bg-primary shadow-xl sm:max-w-xl sm:flex-row"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute top-3 right-3 z-10 flex size-8 cursor-pointer items-center justify-center rounded-lg bg-primary/80 text-fg-quaternary backdrop-blur-sm transition duration-100 ease-linear hover:text-fg-secondary"
                        >
                            <XClose className="size-4" />
                        </button>

                        {/* Poster */}
                        <div className="h-48 shrink-0 bg-tertiary sm:h-auto sm:w-48">
                            {poster ? (
                                <img src={poster} alt={title} className="size-full object-cover" />
                            ) : (
                                <div className="flex size-full items-center justify-center text-sm text-quaternary">No poster</div>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex flex-1 flex-col gap-3 p-5">
                            <div>
                                <div className="mb-1 flex items-center gap-2">
                                    <Badge size="sm" color={mediaType === "movie" ? "blue" : "purple"}>
                                        {mediaType === "movie" ? "Movie" : "Series"}
                                    </Badge>
                                    {year && <span className="text-xs text-tertiary">{year}</span>}
                                </div>
                                <h2 className="text-lg font-semibold text-primary">{title}</h2>
                            </div>

                            {rating > 0 && (
                                <div className="flex items-center gap-1">
                                    <Star01 className="size-4 text-fg-warning-primary" />
                                    <span className="text-sm font-medium text-secondary">{rating.toFixed(1)}</span>
                                </div>
                            )}

                            {genres.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                    {genres.map((genre) => (
                                        <Badge key={genre} size="sm" color={GENRE_BADGE_COLORS[genre]}>
                                            {genre}
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {overview && <p className="line-clamp-4 text-sm text-tertiary">{overview}</p>}

                            {/* Actions */}
                            <div className="mt-auto flex gap-2 pt-2">
                                {isInWatchlist ? (
                                    <>
                                        {isWatched ? (
                                            <Button size="sm" color="secondary" iconLeading={ReverseLeft} onClick={onMarkUnwatched}>
                                                Unwatched
                                            </Button>
                                        ) : (
                                            <Button size="sm" color="primary" iconLeading={Eye} onClick={onMarkWatched}>
                                                Watched
                                            </Button>
                                        )}
                                        <Button size="sm" color="secondary-destructive" iconLeading={Trash01} onClick={onRemove}>
                                            Remove
                                        </Button>
                                    </>
                                ) : (
                                    <Button size="sm" color="primary" iconLeading={Plus} onClick={onAdd}>
                                        Add to Watchlist
                                    </Button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
