import { Badge } from "@/components/base/badges/badges";
import { ALL_GENRES, GENRE_BADGE_COLORS, type Genre } from "@/types/watchlist";
import { cx } from "@/utils/cx";

interface GenreFilterProps {
    selected: Genre[];
    onChange: (genres: Genre[]) => void;
}

export function GenreFilter({ selected, onChange }: GenreFilterProps) {
    const toggleGenre = (genre: Genre) => {
        if (selected.includes(genre)) {
            onChange(selected.filter((g) => g !== genre));
        } else {
            onChange([...selected, genre]);
        }
    };

    return (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-hide">
            {/* All button */}
            <button
                type="button"
                onClick={() => onChange([])}
                className={cx(
                    "cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ring-1 ring-inset transition duration-100 ease-linear",
                    selected.length === 0
                        ? "bg-brand-primary text-brand-secondary ring-transparent"
                        : "bg-primary text-tertiary ring-secondary hover:bg-primary_hover",
                )}
            >
                All
            </button>

            {ALL_GENRES.map((genre) => {
                const isActive = selected.includes(genre);
                return (
                    <button
                        key={genre}
                        type="button"
                        onClick={() => toggleGenre(genre)}
                        className="cursor-pointer"
                    >
                        <Badge
                            size="sm"
                            color={isActive ? GENRE_BADGE_COLORS[genre] : "gray"}
                            className={cx(
                                "transition duration-100 ease-linear",
                                !isActive && "opacity-60 hover:opacity-100",
                            )}
                        >
                            <span className="capitalize">{genre}</span>
                        </Badge>
                    </button>
                );
            })}
        </div>
    );
}
