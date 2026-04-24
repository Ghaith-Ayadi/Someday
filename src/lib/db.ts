import Dexie, { type Table } from "dexie";
import type { WatchlistItem } from "@/types/watchlist";

interface SyncMetaRow {
    key: string;
    value: unknown;
}

class WatchlistDB extends Dexie {
    items!: Table<WatchlistItem, string>;
    syncMeta!: Table<SyncMetaRow, string>;

    constructor() {
        super("watchlist-db");
        this.version(1).stores({
            items: "id, imdbId, mediaType, status, addedAt, *genres",
        });
        // v2: added rich metadata fields (director, actors, etc.)
        this.version(2).stores({
            items: "id, imdbId, mediaType, status, addedAt, *genres",
        });
        // v3: sync support — updatedAt index, syncMeta table. Backfill updatedAt from addedAt.
        this.version(3)
            .stores({
                items: "id, imdbId, mediaType, status, addedAt, updatedAt, *genres",
                syncMeta: "key",
            })
            .upgrade(async (tx) => {
                const now = Date.now();
                await tx
                    .table("items")
                    .toCollection()
                    .modify((item: Partial<WatchlistItem>) => {
                        if (item.updatedAt == null) item.updatedAt = item.addedAt ?? now;
                    });
            });
    }
}

export const db = new WatchlistDB();
