import type { RealtimeChannel } from "@supabase/supabase-js";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { fromRow, runSync, type WatchlistRow } from "@/lib/sync";

// Subscribes to Postgres row changes on watchlist_items for the signed-in user.
// On INSERT/UPDATE we upsert into Dexie; livequery propagates the new state to the UI.
// On reconnect, runs a reconciling sync to catch anything missed while the socket was dead.
//
// Requires `alter publication supabase_realtime add table public.watchlist_items;`
// to be run once in the Supabase SQL editor — otherwise subscriptions no-op silently.

let channel: RealtimeChannel | null = null;

export function startRealtime(userId: string) {
    stopRealtime();

    channel = supabase
        .channel(`watchlist:${userId}`)
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "watchlist_items", filter: `user_id=eq.${userId}` },
            async (payload) => {
                const now = Date.now();
                if (payload.eventType === "DELETE") {
                    const oldRow = payload.old as { id?: string };
                    if (oldRow.id) await db.items.delete(oldRow.id);
                    return;
                }
                const row = payload.new as WatchlistRow;
                if (!row?.id) return;
                const item = fromRow(row);
                await db.items.put({ ...item, syncedAt: now });
            },
        )
        .subscribe((status) => {
            // `SUBSCRIBED` fires on initial connect and on every reconnect.
            // Run a full push/pull to reconcile anything that happened while we were offline.
            if (status === "SUBSCRIBED") void runSync();
        });
}

export function stopRealtime() {
    if (channel) {
        supabase.removeChannel(channel);
        channel = null;
    }
}
