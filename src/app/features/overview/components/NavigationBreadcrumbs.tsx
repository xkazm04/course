"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { BreadcrumbEntry } from "../lib/NavigationService";
import { getCategoryMeta } from "../lib/curriculumTypes";

interface NavigationBreadcrumbsProps {
    /** The breadcrumb trail */
    breadcrumbs: BreadcrumbEntry[];
    /** Callback when a breadcrumb is clicked */
    onNavigate: (entry: BreadcrumbEntry) => void;
    /** Callback to go back */
    onBack: () => void;
    /** Maximum visible breadcrumbs (older ones are collapsed) */
    maxVisible?: number;
    /** Additional className */
    className?: string;
}

/**
 * NavigationBreadcrumbs displays the navigation trail through the knowledge graph.
 *
 * This component shows "You came via: HTML Basics → CSS Basics → Flexbox" context,
 * making graph navigation history visible and navigable.
 */
export const NavigationBreadcrumbs: React.FC<NavigationBreadcrumbsProps> = ({
    breadcrumbs,
    onNavigate,
    onBack,
    maxVisible = 4,
    className,
}) => {
    if (breadcrumbs.length === 0) {
        return null;
    }

    // Calculate visible breadcrumbs (show most recent ones)
    const hiddenCount = Math.max(0, breadcrumbs.length - maxVisible);
    const visibleBreadcrumbs = breadcrumbs.slice(-maxVisible);

    // Current (last) breadcrumb is not clickable
    const currentBreadcrumb = visibleBreadcrumbs[visibleBreadcrumbs.length - 1];
    const navigableBreadcrumbs = visibleBreadcrumbs.slice(0, -1);

    return (
        <nav
            className={cn(
                "flex items-center gap-1.5 px-3 py-2",
                "bg-[var(--forge-bg-elevated)] backdrop-blur-sm",
                "border border-[var(--forge-border-subtle)]",
                "rounded-xl shadow-sm",
                className
            )}
            aria-label="Navigation trail"
            data-testid="navigation-breadcrumbs"
        >
            {/* Back button */}
            {breadcrumbs.length > 1 && (
                <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={onBack}
                    className={cn(
                        "p-1.5 rounded-lg transition-colors",
                        "hover:bg-[var(--forge-bg-workshop)]",
                        "text-[var(--forge-text-muted)]",
                        "focus:outline-none focus:ring-2 focus:ring-[var(--ember)]/50"
                    )}
                    aria-label="Go back"
                    data-testid="breadcrumb-back-btn"
                >
                    <ArrowLeft className="w-4 h-4" />
                </motion.button>
            )}

            {/* Home/start indicator */}
            <div className="flex items-center text-[var(--forge-text-muted)]">
                <Home className="w-3.5 h-3.5" />
            </div>

            {/* Hidden count indicator */}
            {hiddenCount > 0 && (
                <>
                    <ChevronRight className="w-3 h-3 text-[var(--forge-text-muted)]" />
                    <span
                        className="text-xs text-[var(--forge-text-muted)]"
                        title={`${hiddenCount} more in history`}
                    >
                        +{hiddenCount}
                    </span>
                </>
            )}

            {/* Navigable breadcrumbs */}
            <AnimatePresence mode="popLayout">
                {navigableBreadcrumbs.map((entry, index) => {
                    const categoryMeta = getCategoryMeta(entry.node.category);
                    const isViaRequired = entry.viaConnection?.type === "required";

                    return (
                        <React.Fragment key={entry.node.id + "-" + index}>
                            <ChevronRight className="w-3 h-3 text-[var(--forge-text-muted)] flex-shrink-0" />

                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => onNavigate(entry)}
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-0.5 rounded-md",
                                    "text-xs font-medium transition-colors",
                                    "hover:bg-[var(--forge-bg-workshop)]",
                                    "text-[var(--forge-text-secondary)]",
                                    "focus:outline-none focus:ring-2 focus:ring-[var(--ember)]/50",
                                    "max-w-[120px] truncate"
                                )}
                                title={`Navigate to ${entry.node.title}`}
                                data-testid={`breadcrumb-${entry.node.id}`}
                            >
                                <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: categoryMeta.color }}
                                />
                                <span className="truncate">{entry.node.title}</span>
                            </motion.button>
                        </React.Fragment>
                    );
                })}
            </AnimatePresence>

            {/* Current breadcrumb (not clickable) */}
            {currentBreadcrumb && (
                <>
                    <ChevronRight className="w-3 h-3 text-[var(--forge-text-muted)] flex-shrink-0" />

                    <motion.span
                        key={currentBreadcrumb.node.id + "-current"}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                            "flex items-center gap-1.5 px-2 py-0.5 rounded-md",
                            "text-xs font-semibold",
                            "text-[var(--forge-text-primary)]",
                            "bg-[var(--ember)]/20",
                            "max-w-[140px] truncate"
                        )}
                        aria-current="page"
                        data-testid="breadcrumb-current"
                    >
                        <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{
                                backgroundColor: getCategoryMeta(
                                    currentBreadcrumb.node.category
                                ).color,
                            }}
                        />
                        <span className="truncate">{currentBreadcrumb.node.title}</span>
                    </motion.span>
                </>
            )}
        </nav>
    );
};

export default NavigationBreadcrumbs;
