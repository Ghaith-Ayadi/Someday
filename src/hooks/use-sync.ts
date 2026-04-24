import { useEffect, useState } from "react";
import { runSync, setSyncListener } from "@/lib/sync";
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
        if (!user) return;

        const run = async () => {
            setIsSyncing(true);
            try {
                await runSync();
            } finally {
                setIsSyncing(false);
            }
        };

        void run();

        const onFocus = () => void run();
        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [user]);

    return { isSyncing, lastSyncedAt, isSignedIn: !!user };
}
