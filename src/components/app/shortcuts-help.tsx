import { useEffect, useRef, useState } from "react";
import { HelpCircle } from "@untitledui/icons";
import { cx } from "@/utils/cx";

const SHORTCUTS = [
    { keys: ["⌘", "K"], label: "Search" },
    { keys: ["1"], label: "Movies tab" },
    { keys: ["2"], label: "Series tab" },
    { keys: ["C"], label: "Card view" },
    { keys: ["L"], label: "List view" },
    { keys: ["↑", "↓"], label: "Navigate results" },
    { keys: ["←", "→"], label: "Switch columns" },
    { keys: ["Enter"], label: "Add / open" },
    { keys: ["Esc"], label: "Close overlay" },
];

export function ShortcutsHelp() {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cx(
                    "flex size-8 cursor-pointer items-center justify-center rounded-lg text-fg-quaternary transition duration-100 ease-linear hover:text-fg-secondary",
                    isOpen && "text-fg-secondary",
                )}
                aria-label="Keyboard shortcuts"
            >
                <HelpCircle className="size-4" />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-lg bg-primary shadow-lg ring-1 ring-secondary_alt">
                    <div className="border-b border-secondary px-3 py-2 text-xs font-semibold text-tertiary">Keyboard shortcuts</div>
                    <div className="py-1">
                        {SHORTCUTS.map((shortcut) => (
                            <div key={shortcut.label} className="flex items-center justify-between px-3 py-1.5">
                                <span className="text-xs text-tertiary">{shortcut.label}</span>
                                <div className="flex items-center gap-0.5">
                                    {shortcut.keys.map((key) => (
                                        <kbd
                                            key={key}
                                            className="min-w-5 rounded border border-secondary bg-secondary px-1 py-px text-center text-[10px] font-medium text-quaternary"
                                        >
                                            {key}
                                        </kbd>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
