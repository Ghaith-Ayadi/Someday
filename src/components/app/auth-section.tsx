import { type FormEvent, useState } from "react";
import { LogOut01, Mail01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useAuth } from "@/providers/auth-provider";

type Status = "idle" | "sending" | "codeSent" | "verifying" | "error";

export function AuthSection() {
    const { user, isLoading, signIn, verifyOtp, signOut } = useAuth();
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [status, setStatus] = useState<Status>("idle");
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

    const sendCode = async () => {
        if (!email) return;
        setStatus("sending");
        setErrorMessage(null);
        const { error } = await signIn(email);
        if (error) {
            setStatus("error");
            setErrorMessage(error.message);
            return;
        }
        setCode("");
        setStatus("codeSent");
    };

    const handleEmailSubmit = (e: FormEvent) => {
        e.preventDefault();
        void sendCode();
    };

    const handleCodeSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (code.length < 6) return;
        setStatus("verifying");
        setErrorMessage(null);
        const { error } = await verifyOtp(email, code);
        if (error) {
            setStatus("error");
            setErrorMessage(error.message);
            return;
        }
        // On success, auth state change will flip `user` and re-render.
    };

    if (status === "codeSent" || status === "verifying" || (status === "error" && code)) {
        return (
            <form onSubmit={handleCodeSubmit} className="flex flex-col gap-2 px-3 py-2">
                <div>
                    <div className="text-sm font-medium text-secondary">Enter the code</div>
                    <div className="mt-0.5 text-xs text-tertiary">We sent a code to {email}.</div>
                </div>
                <Input
                    type="text"
                    size="sm"
                    placeholder="Paste code"
                    value={code}
                    onChange={(v) => setCode(v.replace(/\D/g, "").slice(0, 10))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    isInvalid={status === "error"}
                    hint={status === "error" ? errorMessage ?? "Invalid code" : undefined}
                />
                <Button type="submit" size="sm" color="primary" isLoading={status === "verifying"} isDisabled={code.length < 6}>
                    Verify
                </Button>
                <button
                    type="button"
                    onClick={() => void sendCode()}
                    className="text-center text-xs text-tertiary underline-offset-2 hover:underline"
                >
                    Resend code
                </button>
            </form>
        );
    }

    return (
        <form onSubmit={handleEmailSubmit} className="flex flex-col gap-2 px-3 py-2">
            <div>
                <div className="text-sm font-medium text-secondary">Sync across devices</div>
                <div className="mt-0.5 text-xs text-tertiary">We'll email you a 6-digit code.</div>
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
            <Button type="submit" size="sm" color="primary" isLoading={status === "sending"} isDisabled={!email}>
                Send code
            </Button>
        </form>
    );
}
