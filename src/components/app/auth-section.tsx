import { useState } from "react";
import { LogOut01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useAuth } from "@/providers/auth-provider";

export function AuthSection() {
    const { user, isLoading, signInWithGoogle, signOut } = useAuth();
    const [isSigningIn, setIsSigningIn] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (isLoading) {
        return <div className="px-3 py-2 text-xs text-quaternary">Loading…</div>;
    }

    if (user) {
        return (
            <div className="flex flex-col gap-2 rounded-lg px-3 py-2">
                <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-secondary">{user.email}</div>
                    <div className="text-xs text-quaternary">Synced</div>
                </div>
                <Button size="xs" color="tertiary" iconLeading={LogOut01} onClick={() => signOut()}>
                    Sign out
                </Button>
            </div>
        );
    }

    // Must run straight from the click: browsers block the OAuth popup otherwise.
    const handleSignIn = async () => {
        setIsSigningIn(true);
        setErrorMessage(null);
        const { error } = await signInWithGoogle();
        setIsSigningIn(false);
        if (error) setErrorMessage(error.message);
        // On success the auth store change flips `user` and re-renders.
    };

    return (
        <div className="flex flex-col gap-2 px-3 py-2">
            <div>
                <div className="text-sm font-medium text-secondary">Sync across devices</div>
                <div className="mt-0.5 text-xs text-tertiary">Sign in with your Google account.</div>
            </div>
            <Button size="sm" color="primary" isLoading={isSigningIn} onClick={() => void handleSignIn()}>
                Continue with Google
            </Button>
            {errorMessage && <div className="text-xs text-error-primary">{errorMessage}</div>}
        </div>
    );
}
