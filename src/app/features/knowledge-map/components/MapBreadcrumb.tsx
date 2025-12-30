"use client";

/**
 * MapBreadcrumb Component
 *
 * Navigation breadcrumb for drilling through hierarchy levels.
 */

import React, { memo } from "react";
import { motion } from "framer-motion";
import { Home, ChevronRight } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { BreadcrumbItem } from "../lib/types";

interface MapBreadcrumbProps {
    items: BreadcrumbItem[];
    onNavigate: (index: number) => void;
    className?: string;
}

export const MapBreadcrumb: React.FC<MapBreadcrumbProps> = memo(function MapBreadcrumb({
    items,
    onNavigate,
    className,
}) {
    if (items.length <= 1) {
        // Don't show breadcrumb at root level
        return null;
    }

    return (
        <nav
            className={cn(
                "flex items-center gap-1 px-3 py-2 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-md rounded-lg border border-[var(--forge-border-subtle)] shadow-md",
                className
            )}
            aria-label="Breadcrumb navigation"
        >
            {items.map((item, index) => {
                const isLast = index === items.length - 1;
                const isFirst = index === 0;

                return (
                    <React.Fragment key={item.nodeId ?? "root"}>
                        {/* Separator */}
                        {index > 0 && (
                            <ChevronRight
                                size={ICON_SIZES.xs}
                                className="text-[var(--forge-text-muted)] flex-shrink-0"
                            />
                        )}

                        {/* Breadcrumb item */}
                        <motion.button
                            onClick={() => onNavigate(index - 1)} // -1 to go back to that level
                            disabled={isLast}
                            className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-md text-sm transition-colors",
                                isLast
                                    ? "text-[var(--forge-text-primary)] font-medium cursor-default"
                                    : "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-anvil)]"
                            )}
                            whileHover={!isLast ? { scale: 1.02 } : {}}
                            whileTap={!isLast ? { scale: 0.98 } : {}}
                        >
                            {isFirst && (
                                <Home size={ICON_SIZES.xs} className="flex-shrink-0" />
                            )}
                            <span className={cn(
                                "truncate",
                                isFirst ? "max-w-[80px]" : "max-w-[120px]"
                            )}>
                                {item.label}
                            </span>
                        </motion.button>
                    </React.Fragment>
                );
            })}
        </nav>
    );
});

export default MapBreadcrumb;
