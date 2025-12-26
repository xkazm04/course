"use client";

/**
 * HypotheticalNode Component
 *
 * Renders a hypothetical (to-be-created) node on the knowledge map.
 * Features dashed border, translucent appearance, and "+" overlay.
 */

import React from "react";
import { motion, type Variants } from "framer-motion";
import { Plus, Sparkles, Clock } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { HypotheticalMapNode } from "../lib/types";
import { formatModuleDuration } from "../lib/oracleNodeMapping";

// ============================================================================
// TYPES
// ============================================================================

export interface HypotheticalNodeProps {
    /** Node data */
    node: HypotheticalMapNode;
    /** Whether this node is selected */
    isSelected?: boolean;
    /** Whether this node is being forged (animated) */
    isForging?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Hover handler */
    onHover?: (isHovering: boolean) => void;
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const nodeVariants: Variants = {
    initial: {
        opacity: 0,
        scale: 0.8,
    },
    animate: {
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring",
            damping: 20,
            stiffness: 300,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.8,
        transition: { duration: 0.2 },
    },
    hover: {
        scale: 1.02,
        transition: { duration: 0.15 },
    },
    tap: {
        scale: 0.98,
    },
};

const pulseVariants: Variants = {
    animate: {
        opacity: [0.4, 0.7, 0.4],
        scale: [1, 1.05, 1],
        transition: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function HypotheticalNode({
    node,
    isSelected = false,
    isForging = false,
    onClick,
    onHover,
}: HypotheticalNodeProps) {
    const duration = formatModuleDuration(node.estimatedHours);

    // Don't render if forging (wait, we removed particle forge, so we just render this always until it's promoted)
    // The parent manages if this component is rendered.

    return (
        <motion.div
            className="absolute w-[170px] cursor-pointer"
            style={{
                left: node.position.x - 85,
                top: node.position.y - 20,
            }}
            variants={nodeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            whileHover="hover"
            whileTap="tap"
            onClick={onClick}
            onMouseEnter={() => onHover?.(true)}
            onMouseLeave={() => onHover?.(false)}
            data-testid={`hypothetical-node-${node.id}`}
        >
            <div className={cn(
                "flex items-center gap-3 p-2 rounded-lg",
                // Ghost style: Semi-transparent background and border
                "bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm",
                "border border-slate-200/60 dark:border-slate-700/60",
                "border-dashed", // Dashed to indicate "proposed"
                "shadow-sm hover:shadow-md transition-all",
                isSelected && "ring-2 ring-indigo-500 bg-white/80 dark:bg-slate-800/80"
            )}>
                <div className="w-8 h-8 rounded bg-indigo-50/50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Plus size={16} />
                </div>
                <div className="flex-1 min-w-0 opacity-80">
                    <div className="text-xs font-medium truncate">{node.name}</div>
                    <div className="text-[10px] text-slate-500">{duration}</div>
                </div>
            </div>
        </motion.div>
    );
}
