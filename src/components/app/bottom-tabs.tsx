import { Badge } from "@/components/base/badges/badges";
import { cx } from "@/utils/cx";

interface BottomTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    movieCount: number;
    seriesCount: number;
}

export function BottomTabs({ activeTab, onTabChange, movieCount, seriesCount }: BottomTabsProps) {
    const tabs = [
        { id: "movies", label: "Movies", count: movieCount },
        { id: "series", label: "Series", count: seriesCount },
    ];

    return (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-secondary bg-primary pb-[env(safe-area-inset-bottom)] sm:hidden">
            <div className="flex">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onTabChange(tab.id)}
                        className={cx(
                            "flex flex-1 cursor-pointer flex-col items-center gap-0.5 pt-2.5 pb-2 text-sm font-semibold transition duration-100 ease-linear",
                            activeTab === tab.id
                                ? "border-t-2 border-fg-brand-primary text-brand-secondary"
                                : "border-t-2 border-transparent text-quaternary",
                        )}
                    >
                        <span className="flex items-center gap-1.5">
                            {tab.label}
                            <Badge size="sm" color={activeTab === tab.id ? "brand" : "gray"}>
                                {tab.count}
                            </Badge>
                        </span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
