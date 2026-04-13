import { useEffect, useRef, useState } from "react";
import { Check } from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface FilterOption {
    id: string;
    label: string;
    group?: string;
}

interface FilterPopoverProps {
    options: FilterOption[];
    selected: Set<string>;
    onChange: (selected: Set<string>) => void;
    icon: React.ComponentType<{ className?: string }>;
    label?: string;
}

export function FilterPopover({ options, selected, onChange, icon: Icon, label }: FilterPopoverProps) {
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

    const toggle = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onChange(next);
    };

    // Group options
    const groups = new Map<string, FilterOption[]>();
    for (const opt of options) {
        const group = opt.group || "";
        if (!groups.has(group)) groups.set(group, []);
        groups.get(group)!.push(opt);
    }

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cx(
                    "flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition duration-100 ease-linear",
                    isOpen ? "bg-active text-secondary" : "text-tertiary hover:text-secondary hover:bg-primary_hover",
                )}
            >
                <Icon className="size-4" />
                {label && <span>{label}</span>}
            </button>
            {isOpen && (
                <div className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-lg bg-primary shadow-lg ring-1 ring-secondary_alt">
                    <div className="max-h-72 overflow-y-auto py-1">
                        {Array.from(groups.entries()).map(([group, items], gi) => (
                            <div key={group}>
                                {gi > 0 && <div className="my-1 h-px bg-border-secondary" />}
                                {group && (
                                    <div className="px-3.5 pt-2 pb-1 text-xs font-semibold text-quaternary">{group}</div>
                                )}
                                {items.map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => toggle(opt.id)}
                                        className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-1.5 text-left text-sm font-medium text-secondary transition duration-100 ease-linear hover:bg-primary_hover"
                                    >
                                        <div
                                            className={cx(
                                                "flex size-4 shrink-0 items-center justify-center rounded border transition duration-100 ease-linear",
                                                selected.has(opt.id)
                                                    ? "border-brand-600 bg-brand-solid"
                                                    : "border-primary bg-primary",
                                            )}
                                        >
                                            {selected.has(opt.id) && <Check className="size-3 text-white" strokeWidth={3} />}
                                        </div>
                                        <span className="capitalize">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

interface SortPopoverProps<T extends string> {
    options: { id: T; label: string }[];
    value: T;
    onChange: (value: T) => void;
    icon: React.ComponentType<{ className?: string }>;
}

export function SortPopover<T extends string>({ options, value, onChange, icon: Icon }: SortPopoverProps<T>) {
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
                    "flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition duration-100 ease-linear",
                    isOpen ? "bg-active text-secondary" : "text-tertiary hover:text-secondary hover:bg-primary_hover",
                )}
            >
                <Icon className="size-4" />
            </button>
            {isOpen && (
                <div className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-lg bg-primary shadow-lg ring-1 ring-secondary_alt">
                    <div className="py-1">
                        {options.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                    onChange(opt.id);
                                    setIsOpen(false);
                                }}
                                className="flex w-full cursor-pointer items-center gap-2 px-3.5 py-1.5 text-left text-sm font-medium text-secondary transition duration-100 ease-linear hover:bg-primary_hover"
                            >
                                <Check
                                    className={cx(
                                        "size-4 shrink-0 text-fg-brand-primary",
                                        value !== opt.id && "invisible",
                                    )}
                                    strokeWidth={2.5}
                                />
                                <span>{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
