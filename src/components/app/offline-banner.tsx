import { useEffect, useState } from "react";
import { WifiOff } from "@untitledui/icons";

export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const goOffline = () => setIsOffline(true);
        const goOnline = () => setIsOffline(false);
        window.addEventListener("offline", goOffline);
        window.addEventListener("online", goOnline);
        return () => {
            window.removeEventListener("offline", goOffline);
            window.removeEventListener("online", goOnline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="flex items-center justify-center gap-2 bg-warning-secondary px-3 py-1.5 text-xs font-medium text-warning-primary">
            <WifiOff className="size-3.5" />
            <span>You're offline. Your library is available, but search requires internet.</span>
        </div>
    );
}
