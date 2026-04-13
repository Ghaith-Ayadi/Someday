import Dexie, { type Table } from "dexie";
import type { WatchlistItem } from "@/types/watchlist";

class WatchlistDB extends Dexie {
    items!: Table<WatchlistItem, string>;

    constructor() {
        super("watchlist-db");
        this.version(1).stores({
            items: "id, imdbId, mediaType, status, addedAt, *genres",
        });
        // v2: added rich metadata fields (director, actors, etc.)
        // No index changes needed — Dexie handles new non-indexed fields automatically
        this.version(2).stores({
            items: "id, imdbId, mediaType, status, addedAt, *genres",
        });
    }
}

export const db = new WatchlistDB();
