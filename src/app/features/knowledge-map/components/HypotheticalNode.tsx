"use client";

/**
 * HypotheticalNode Component
 *
 * Renders a hypothetical (to-be-created) node on the knowledge map.
 * Features animated gradient border, pulsing Plus icon, tooltip, and "PROPOSED" badge
 * for clear visual distinction from existing nodes.
 *
 * Now supports both HypotheticalMapNode (legacy) and CurriculumEntity (unified).
 * The component auto-detects which type is passed and renders appropriately.
 *
 * @see ../lib/curriculumEntity.ts for the unified CurriculumEntity type
 */

import React, { useState } from "react";
import { motion, type Variants, AnimatePresence } from "framer-motion";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { HypotheticalMapNode } from "../lib/types";
import type { CurriculumEntity } from "../lib/curriculumEntity";
import { isForging, isProposed } from "../lib/curriculumEntity";
import { formatModuleDuration } from "../lib/oracleNodeMapping";

// ============================================================================
// TYPES
// ============================================================================

interface SpringConfig {
    type: "spring";
    stiffness: number;
    damping: number;
}

/**
 * Normalized node data for rendering
 * Works with both HypotheticalMapNode and CurriculumEntity
 */
interface NormalizedNodeData {
    id: string;
    name: string;
    estimatedHours: number;
    position: { x: number; y: number };
    isForging: boolean;
    isProposed: boolean;
}

export interface HypotheticalNodeProps {
    /**
     * Node data - supports both legacy HypotheticalMapNode and unified CurriculumEntity
     */
    node: HypotheticalMapNode | CurriculumEntity;
    /** Whether this node is selected */
    isSelected?: boolean;
    /**
     * Whether this node is being forged (animated)
     * @deprecated Use node.materialization='forging' instead when using CurriculumEntity
     */
    isForging?: boolean;
    /** Click handler */
    onClick?: () => void;
    /** Hover handler */
    onHover?: (isHovering: boolean) => void;
    /** Animation delay for staggered reveal (in seconds) */
    animationDelay?: number;
    /** Spring animation configuration */
    springConfig?: SpringConfig;
}

/**
 * Normalize node data to a common format for rendering
 */
function normalizeNode(
    node: HypotheticalMapNode | CurriculumEntity,
    isForgingProp: boolean
): NormalizedNodeData {
    // Check if it's a CurriculumEntity (has 'title' and 'materialization' properties)
    const isCurriculumEntity = 'title' in node && 'materialization' in node;

    if (isCurriculumEntity) {
        const entity = node as CurriculumEntity;
        return {
            id: entity.id,
            name: entity.title,
            estimatedHours: entity.estimatedHours,
            position: entity.position,
            isForging: isForging(entity),
            isProposed: isProposed(entity),
        };
    }

    // Legacy HypotheticalMapNode
    const legacyNode = node as HypotheticalMapNode;
    return {
        id: legacyNode.id,
        name: legacyNode.name,
        estimatedHours: legacyNode.estimatedHours,
        position: legacyNode.position,
        isForging: legacyNode.materialization === 'forging' || isForgingProp,
        isProposed: legacyNode.materialization !== 'materialized',
    };
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

// Default spring config - used when no config is passed
const DEFAULT_SPRING_CONFIG: SpringConfig = {
    type: "spring",
    stiffness: 260,
    damping: 20,
};

// Base variants - delay is applied dynamically
const getNodeVariants = (delay: number, springConfig: SpringConfig): Variants => ({
    initial: {
        opacity: 0,
        scale: 0.9,
        y: 20,
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            ...springConfig,
            delay,
            opacity: { duration: 0.2, delay },
        },
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: -10,
        transition: { duration: 0.2 },
    },
    hover: {
        scale: 1.02,
        transition: { duration: 0.15 },
    },
    tap: {
        scale: 0.98,
    },
});

/** Pulsing animation for the Plus icon to draw attention */
const plusPulseVariants: Variants = {
    animate: {
        scale: [1, 1.15, 1],
        opacity: [0.8, 1, 0.8],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
        },
    },
};

/** Tooltip fade animation */
const tooltipVariants: Variants = {
    initial: {
        opacity: 0,
        y: 8,
        scale: 0.95,
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.15,
            ease: "easeOut",
        },
    },
    exit: {
        opacity: 0,
        y: 4,
        scale: 0.95,
        transition: {
            duration: 0.1,
        },
    },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function HypotheticalNode({
    node,
    isSelected = false,
    isForging: isForgingProp = false,
    onClick,
    onHover,
    animationDelay = 0,
    springConfig = DEFAULT_SPRING_CONFIG,
}: HypotheticalNodeProps) {
    // Normalize node data to work with both types
    const normalizedNode = normalizeNode(node, isForgingProp);
    const duration = formatModuleDuration(normalizedNode.estimatedHours);
    const [isHovered, setIsHovered] = useState(false);

    // Generate variants with the current delay and spring config
    const nodeVariants = getNodeVariants(animationDelay, springConfig);

    const handleMouseEnter = () => {
        setIsHovered(true);
        onHover?.(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        onHover?.(false);
    };

    // Determine badge text and styling based on materialization state
    const badgeConfig = normalizedNode.isForging
        ? { text: "Creating...", gradient: "from-[var(--gold)] to-[var(--ember)]" }
        : { text: "Proposed", gradient: "from-[var(--ember)] to-[var(--molten)]" };

    return (
        <motion.div
            className="absolute w-[180px] cursor-pointer"
            style={{
                left: normalizedNode.position.x - 90,
                top: normalizedNode.position.y - 20,
            }}
            variants={nodeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            whileHover="hover"
            whileTap="tap"
            onClick={onClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            data-testid={`hypothetical-node-${normalizedNode.id}`}
        >
            {/* Animated gradient border wrapper */}
            <div className={cn(
                "relative p-[2px] rounded-lg overflow-hidden hypothetical-node-gradient",
                normalizedNode.isForging && "animate-pulse"
            )}>
                {/* Animated gradient border - uses CSS animation for smooth color shift */}
                <div
                    className="absolute inset-0 rounded-lg animate-gradient-shift"
                    style={{
                        background: normalizedNode.isForging
                            ? "linear-gradient(135deg, var(--gold), var(--ember), var(--gold), var(--ember))"
                            : "linear-gradient(135deg, var(--ember), var(--molten), var(--gold), var(--ember))",
                        backgroundSize: "300% 300%",
                    }}
                    data-testid={`hypothetical-node-gradient-${normalizedNode.id}`}
                />

                {/* Inner content container */}
                <div className={cn(
                    "relative flex items-center gap-3 p-2 rounded-[6px]",
                    // Semi-transparent background
                    "bg-[var(--forge-bg-elevated)]/90 backdrop-blur-sm",
                    "shadow-sm transition-all",
                    isSelected && "ring-2 ring-[var(--ember)]"
                )}>
                    {/* Icon container - shows loader when forging */}
                    <motion.div
                        className={cn(
                            "relative w-8 h-8 rounded flex items-center justify-center",
                            normalizedNode.isForging
                                ? "bg-gradient-to-br from-[var(--gold)]/20 to-[var(--ember)]/20 text-[var(--gold)]"
                                : "bg-gradient-to-br from-[var(--ember)]/20 to-[var(--molten)]/20 text-[var(--ember)]"
                        )}
                        variants={normalizedNode.isForging ? undefined : plusPulseVariants}
                        animate={normalizedNode.isForging ? undefined : "animate"}
                        data-testid={`hypothetical-node-icon-${normalizedNode.id}`}
                    >
                        {normalizedNode.isForging ? (
                            <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
                        ) : (
                            <Plus size={16} strokeWidth={2.5} />
                        )}
                        {/* Subtle glow effect behind icon */}
                        <div className={cn(
                            "absolute inset-0 rounded blur-sm",
                            normalizedNode.isForging ? "bg-[var(--gold)]/10" : "bg-[var(--ember)]/10"
                        )} />
                    </motion.div>

                    {/* Node info */}
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium truncate text-[var(--forge-text-primary)]">
                            {normalizedNode.name}
                        </div>
                        <div className="text-[10px] text-[var(--forge-text-secondary)]">
                            {duration}
                        </div>
                    </div>

                    {/* Badge */}
                    <div
                        className={cn(
                            "absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white shadow-sm",
                            `bg-gradient-to-r ${badgeConfig.gradient}`
                        )}
                        data-testid={`hypothetical-node-badge-${normalizedNode.id}`}
                    >
                        {badgeConfig.text}
                    </div>
                </div>
            </div>

            {/* Tooltip - appears on hover */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 pointer-events-none"
                        variants={tooltipVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        data-testid={`hypothetical-node-tooltip-${normalizedNode.id}`}
                    >
                        <div className="relative px-3 py-2 rounded-lg bg-[var(--forge-bg-anvil)] border border-[var(--forge-border-subtle)] shadow-lg backdrop-blur-sm">
                            {/* Tooltip arrow */}
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-[var(--forge-bg-anvil)] border-l border-t border-[var(--forge-border-subtle)]" />
                            {/* Tooltip content */}
                            <div className="relative flex items-center gap-2">
                                {normalizedNode.isForging ? (
                                    <>
                                        <Loader2 size={12} className="text-[var(--gold)] animate-spin" />
                                        <span className="text-[11px] text-[var(--forge-text-primary)] whitespace-nowrap">
                                            Creating this course for you...
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={12} className="text-[var(--ember)]" />
                                        <span className="text-[11px] text-[var(--forge-text-primary)] whitespace-nowrap">
                                            This course will be created for you
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
