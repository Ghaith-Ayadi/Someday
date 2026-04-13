import { Film01 } from "@untitledui/icons";
import { WatchlistCard } from "@/components/app/watchlist-card";
import { EmptyState } from "@/components/application/empty-state/empty-state";
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
            <EmptyState size="sm" className="py-16">
                <EmptyState.Header pattern="none">
                    <EmptyState.FeaturedIcon icon={Film01} color="gray" theme="light" />
                </EmptyState.Header>
                <EmptyState.Content>
                    <EmptyState.Title>{emptyTitle}</EmptyState.Title>
                    <EmptyState.Description>{emptyDescription}</EmptyState.Description>
                </EmptyState.Content>
            </EmptyState>
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
