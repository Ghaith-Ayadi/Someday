import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { setSyncUser } from "@/lib/sync";

interface AuthContextValue {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signIn: (email: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setSyncUser(data.session?.user?.id ?? null);
            setIsLoading(false);
        });
        const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession);
            setSyncUser(nextSession?.user?.id ?? null);
        });
        return () => sub.subscription.unsubscribe();
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user: session?.user ?? null,
            session,
            isLoading,
            signIn: async (email: string) => {
                const { error } = await supabase.auth.signInWithOtp({
                    email,
                    options: { emailRedirectTo: window.location.origin },
                });
                return { error };
            },
            signOut: async () => {
                await supabase.auth.signOut();
            },
        }),
        [session, isLoading],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
