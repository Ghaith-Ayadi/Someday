import { WatchlistCard } from "@/components/app/watchlist-card";
import type { WatchlistItem } from "@/types/watchlist";

interface WatchlistGridProps {
    items: WatchlistItem[];
    emptyTitle: string;
    emptyDescription: string;
    onMarkWatched: (id: string) => void;
    onMarkUnwatched: (id: string) => void;
    onRemove: (id: string) => void;
    onItemClick: (item: WatchlistItem) => void;
}

export function WatchlistGrid({ items, emptyTitle, emptyDescription, onMarkWatched, onMarkUnwatched, onRemove, onItemClick }: WatchlistGridProps) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <img src="/favicon.png" alt="" className="mb-4 size-12 rounded-lg opacity-40" />
                <h3 className="text-md font-semibold text-primary">{emptyTitle}</h3>
                <p className="mt-1 text-sm text-tertiary">{emptyDescription}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
            {items.map((item) => (
                <WatchlistCard
                    key={item.id}
                    item={item}
                    onMarkWatched={() => onMarkWatched(item.id)}
                    onMarkUnwatched={() => onMarkUnwatched(item.id)}
                    onRemove={() => onRemove(item.id)}
                    onClick={() => onItemClick(item)}
                />
            ))}
        </div>
    );
}
