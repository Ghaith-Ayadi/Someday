import { db } from "@/lib/db";
import { pb } from "@/lib/pocketbase";
import { fromRecord, runSync, type WatchlistRecord } from "@/lib/sync";

// Live updates from PocketBase over server-sent events, for the signed-in
// user's items only. On create/update we upsert into Dexie; liveQuery carries
// it to the UI. On every (re)connection we run a full sync to catch anything
// missed while the stream was down.

type Unsubscribe = () => Promise<void>;

let unsubscribeItems: Unsubscribe | null = null;
let unsubscribeConnect: Unsubscribe | null = null;

export async function startRealtime(userId: string) {
    await stopRealtime();

    // Register the connect listener BEFORE the first subscription opens the
    // stream, or the initial PB_CONNECT fires with nobody listening.
    unsubscribeConnect = await pb.realtime.subscribe("PB_CONNECT", () => {
        void runSync();
    });

    unsubscribeItems = await pb.collection("watchlist_items").subscribe<WatchlistRecord>(
        "*",
        async (e) => {
            if (e.action === "delete") {
                await db.items.delete(e.record.client_id);
                return;
            }
            await db.items.put({ ...fromRecord(e.record), syncedAt: Date.now() });
        },
        { filter: pb.filter("user = {:u}", { u: userId }) },
    );

    // Belt and braces: whatever the connect event did, the first sync after
    // sign-in must happen. runSync is idempotent and guards against overlap.
    void runSync();
}

export async function stopRealtime() {
    const a = unsubscribeItems;
    const b = unsubscribeConnect;
    unsubscribeItems = null;
    unsubscribeConnect = null;
    await a?.();
    await b?.();
}
