import { InfoCircle, RefreshCcw01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";

export const HomeScreen = () => {
    return (
        <div className="flex min-h-dvh flex-col bg-primary">
            <header className="flex h-16 items-center border-b border-secondary px-4 md:px-8">
                <a href="/" aria-label="Go to homepage" className="rounded-xs outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
                    <UntitledLogo className="h-6" />
                </a>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
                <h1 className="text-display-sm font-semibold text-primary">Welcome to your new project</h1>
                <p className="max-w-lg text-body-lg text-tertiary">
                    This starter page was scaffolded from Genesis. Replace this content with your own to get started building.
                </p>
                <div className="flex gap-3">
                    <Button size="md" color="secondary" iconLeading={RefreshCcw01} onClick={() => window.location.reload()}>
                        Refresh
                    </Button>
                    <Button size="md" color="primary" iconLeading={InfoCircle} onClick={() => alert("Built with Genesis — Vite + React + Untitled UI")}>
                        Info
                    </Button>
                </div>
            </main>
        </div>
    );
};
