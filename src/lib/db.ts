import Dexie, { type Table } from "dexie";
import type { WatchlistItem } from "@/types/watchlist";

class WatchlistDB extends Dexie {
    items!: Table<WatchlistItem, string>;

    constructor() {
        super("watchlist-db");
        this.version(1).stores({
            items: "id, imdbId, mediaType, status, addedAt, *genres",
        });
    }
}

export const db = new WatchlistDB();
