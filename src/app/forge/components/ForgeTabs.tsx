"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Hammer, Users, TrendingUp } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

export type ForgeTabId = "home" | "progress" | "community";

interface ForgeTabsProps {
    activeTab: ForgeTabId;
    onTabChange: (tab: ForgeTabId) => void;
}

const TABS = [
    { id: "home" as const, label: "Home", icon: Hammer },
    { id: "progress" as const, label: "My Progress", icon: TrendingUp },
    { id: "community" as const, label: "Community", icon: Users },
];

interface PillPosition {
    width: number;
    left: number;
}

export function ForgeTabs({ activeTab, onTabChange }: ForgeTabsProps) {
    const tabRefs = useRef<Map<ForgeTabId, HTMLButtonElement>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);
    const [pillPosition, setPillPosition] = useState<PillPosition>({ width: 0, left: 0 });
    const [mounted, setMounted] = useState(false);

    const setTabRef = useCallback((id: ForgeTabId, el: HTMLButtonElement | null) => {
        if (el) {
            tabRefs.current.set(id, el);
        } else {
            tabRefs.current.delete(id);
        }
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const updatePillPosition = () => {
            const activeTabEl = tabRefs.current.get(activeTab);
            const container = containerRef.current;

            if (activeTabEl && container) {
                const containerRect = container.getBoundingClientRect();
                const tabRect = activeTabEl.getBoundingClientRect();

                setPillPosition({
                    width: tabRect.width,
                    left: tabRect.left - containerRect.left,
                });
            }
        };

        updatePillPosition();
        window.addEventListener("resize", updatePillPosition);
        return () => window.removeEventListener("resize", updatePillPosition);
    }, [activeTab, mounted]);

    return (
        <div className="flex justify-center pt-6 pb-2">
            <div
                ref={containerRef}
                className="relative inline-flex items-center gap-1 p-1 rounded-full bg-[var(--forge-bg-elevated)]/60 backdrop-blur-xl border border-[var(--forge-border-subtle)]"
            >
                {/* Animated background pill */}
                {mounted && pillPosition.width > 0 && (
                    <motion.div
                        className="absolute h-[calc(100%-8px)] rounded-full bg-[var(--ember)] shadow-lg shadow-[var(--ember)]/30"
                        initial={false}
                        animate={{
                            width: pillPosition.width,
                            left: pillPosition.left,
                        }}
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        style={{ top: 4 }}
                    />
                )}

                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            ref={(el) => setTabRef(tab.id, el)}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "relative z-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200",
                                isActive
                                    ? "text-white"
                                    : "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)]"
                            )}
                            role="tab"
                            aria-selected={isActive}
                        >
                            <Icon size={16} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
