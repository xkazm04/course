"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "../lib/utils";
import { modules } from "../lib/modules";

interface VariantTabsProps {
    variants: string[];
    activeVariant: number;
    onVariantChange: (index: number) => void;
    className?: string;
    moduleId?: string; // When provided, uses URL-based routing
}

export const VariantTabs = ({
    variants,
    activeVariant,
    onVariantChange,
    className,
    moduleId
}: VariantTabsProps) => {
    // Get variant IDs for URL routing
    const module = moduleId ? modules.find(m => m.id === moduleId) : null;
    const variantIds = module?.variants.map(v => v.id) || [];
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const checkScrollability = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        setCanScrollLeft(scrollLeft > 1);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        setIsMobile(scrollWidth > clientWidth);
    }, []);

    useEffect(() => {
        checkScrollability();
        window.addEventListener("resize", checkScrollability);
        return () => window.removeEventListener("resize", checkScrollability);
    }, [checkScrollability]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        container.addEventListener("scroll", checkScrollability);
        return () => container.removeEventListener("scroll", checkScrollability);
    }, [checkScrollability]);

    // Scroll active tab into view on mount and when active changes
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !isMobile) return;

        const activeButton = container.children[activeVariant] as HTMLElement;
        if (activeButton) {
            activeButton.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
    }, [activeVariant, isMobile]);

    return (
        <div className={cn("relative", className)} data-testid="variant-tabs-container">
            {/* Left scroll indicator */}
            {isMobile && canScrollLeft && (
                <div
                    className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--surface-overlay)] to-transparent z-10 pointer-events-none rounded-l-2xl"
                    data-testid="variant-tabs-scroll-indicator-left"
                />
            )}

            {/* Right scroll indicator */}
            {isMobile && canScrollRight && (
                <div
                    className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--surface-overlay)] to-transparent z-10 pointer-events-none rounded-r-2xl"
                    data-testid="variant-tabs-scroll-indicator-right"
                />
            )}

            <div
                ref={scrollContainerRef}
                className={cn(
                    "flex items-center gap-1 p-1",
                    "bg-[var(--surface-elevated)] backdrop-blur-md rounded-2xl",
                    "border border-[var(--border-default)] shadow-sm",
                    "overflow-x-auto scrollbar-hide",
                    "snap-x snap-mandatory scroll-smooth",
                    "max-w-full"
                )}
                style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitOverflowScrolling: "touch"
                }}
                data-testid="variant-tabs-scroll-container"
            >
                {variants.map((variant, index) => {
                    const tabContent = (
                        <>
                            {activeVariant === index && (
                                <motion.div
                                    layoutId="activeVariant"
                                    className="absolute inset-0 bg-[var(--btn-primary-bg)] rounded-xl"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span
                                className={cn(
                                    "relative z-10 whitespace-nowrap",
                                    activeVariant === index && "text-[var(--btn-primary-text)]"
                                )}
                            >
                                {variant}
                            </span>
                        </>
                    );

                    const commonClassName = cn(
                        "relative px-4 py-2 text-sm font-semibold rounded-xl transition-colors",
                        "flex-shrink-0 snap-center",
                        activeVariant === index
                            ? "text-[var(--btn-primary-text)]"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    );

                    if (moduleId && variantIds[index]) {
                        return (
                            <Link
                                key={index}
                                href={`/module/${moduleId}/variant/${variantIds[index]}`}
                                className={commonClassName}
                                data-testid={`variant-tab-${index}`}
                            >
                                {tabContent}
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => onVariantChange(index)}
                            className={commonClassName}
                            data-testid={`variant-tab-${index}`}
                        >
                            {tabContent}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
