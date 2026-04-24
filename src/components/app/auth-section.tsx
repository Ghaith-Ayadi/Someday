import { type FormEvent, useState } from "react";
import { LogOut01, Mail01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useAuth } from "@/providers/auth-provider";

type Status = "idle" | "sending" | "sent" | "error";

export function AuthSection() {
    const { user, isLoading, signIn, signOut } = useAuth();
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<Status>("idle");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="px-3 py-2 text-xs text-quaternary">Loading…</div>
        );
    }

    if (user) {
        return (
            <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2">
                <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-secondary">{user.email}</div>
                    <div className="text-xs text-quaternary">Synced</div>
                </div>
                <Button
                    size="sm"
                    color="tertiary"
                    iconLeading={LogOut01}
                    onClick={() => signOut()}
                >
                    Sign out
                </Button>
            </div>
        );
    }

    if (status === "sent") {
        return (
            <div className="rounded-lg bg-secondary px-3 py-2.5">
                <div className="text-sm font-medium text-secondary">Check your inbox</div>
                <div className="mt-0.5 text-xs text-tertiary">We sent a magic link to {email}.</div>
            </div>
        );
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setStatus("sending");
        setErrorMessage(null);
        const { error } = await signIn(email);
        if (error) {
            setStatus("error");
            setErrorMessage(error.message);
            return;
        }
        setStatus("sent");
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 px-3 py-2">
            <div>
                <div className="text-sm font-medium text-secondary">Sync across devices</div>
                <div className="mt-0.5 text-xs text-tertiary">We'll email you a magic link.</div>
            </div>
            <Input
                type="email"
                size="sm"
                icon={Mail01}
                placeholder="you@example.com"
                value={email}
                onChange={setEmail}
                isRequired
                isInvalid={status === "error"}
                hint={status === "error" ? errorMessage ?? "Something went wrong" : undefined}
            />
            <Button
                type="submit"
                size="sm"
                color="primary"
                isLoading={status === "sending"}
                isDisabled={!email}
            >
                Send magic link
            </Button>
        </form>
    );
}
