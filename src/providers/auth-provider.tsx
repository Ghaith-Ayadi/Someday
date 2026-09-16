import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import { pb, type PbUser } from "@/lib/pocketbase";
import { setSyncUser } from "@/lib/sync";

// Sign-in is Google only. PocketBase runs the OAuth2 flow in a popup and
// persists the session in localStorage; `authStore.onChange` is the single
// place the app learns about sign-in and sign-out.

interface AuthContextValue {
    user: PbUser | null;
    isLoading: boolean;
    signInWithGoogle: () => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

function currentUser(): PbUser | null {
    return pb.authStore.isValid ? (pb.authStore.record as PbUser) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<PbUser | null>(currentUser);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setSyncUser(user?.id ?? null);

        const unsubscribe = pb.authStore.onChange((_token, record) => {
            const next = pb.authStore.isValid ? (record as PbUser | null) : null;
            setUser(next);
            setSyncUser(next?.id ?? null);
        });

        // Validate a stored session once per load; a stale token signs out.
        (async () => {
            if (pb.authStore.isValid) {
                try {
                    await pb.collection("users").authRefresh();
                } catch {
                    pb.authStore.clear();
                }
            }
            setIsLoading(false);
        })();

        return unsubscribe;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isLoading,
            signInWithGoogle: async () => {
                try {
                    await pb.collection("users").authWithOAuth2({ provider: "google" });
                    return { error: null };
                } catch (err) {
                    return { error: err instanceof Error ? err : new Error(String(err)) };
                }
            },
            signOut: async () => {
                pb.authStore.clear();
            },
        }),
        [user, isLoading],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
