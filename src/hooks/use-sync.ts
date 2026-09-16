import { useEffect, useState } from "react";
import { startRealtime, stopRealtime } from "@/lib/realtime";
import { setSyncListener } from "@/lib/sync";
import { useAuth } from "@/providers/auth-provider";

export function useSync() {
    const { user } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

    useEffect(() => {
        setSyncListener(() => setLastSyncedAt(Date.now()));
        return () => setSyncListener(null);
    }, []);

    useEffect(() => {
        if (!user) {
            void stopRealtime();
            return;
        }
        // Realtime handles ongoing server -> client updates; PocketBase's connect
        // event also triggers the initial push/pull reconcile.
        void startRealtime(user.id);
        return () => {
            void stopRealtime();
        };
    }, [user]);

    // `isSyncing` is a rough indicator driven by the sync listener pings.
    useEffect(() => {
        if (lastSyncedAt) setIsSyncing(false);
    }, [lastSyncedAt]);

    return { isSyncing, lastSyncedAt, isSignedIn: !!user };
}
