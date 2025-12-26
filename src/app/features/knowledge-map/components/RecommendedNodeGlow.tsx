"use client";

/**
 * RecommendedNodeGlow Component
 *
 * Glow overlay effect for recommended nodes in the knowledge map.
 * Wraps existing nodes to add visual highlight.
 */

import React from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface RecommendedNodeGlowProps {
    /** Position of the node */
    position: { x: number; y: number };
    /** Size of the node */
    size: { width: number; height: number };
    /** Whether the glow is active */
    isActive?: boolean;
    /** Glow color (Tailwind color name) */
    color?: string;
    /** Additional class names */
    className?: string;
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const glowVariants: Variants = {
    initial: {
        opacity: 0,
        scale: 0.95,
    },
    animate: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.3 },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.2 },
    },
};

const pulseVariants: Variants = {
    animate: {
        boxShadow: [
            "0 0 0 2px rgba(99, 102, 241, 0.3)",
            "0 0 12px 4px rgba(99, 102, 241, 0.4)",
            "0 0 0 2px rgba(99, 102, 241, 0.3)",
        ],
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

export function RecommendedNodeGlow({
    position,
    size,
    isActive = true,
    color = "indigo",
    className,
}: RecommendedNodeGlowProps) {
    if (!isActive) return null;

    // Offset to center the glow around the node
    const offsetX = position.x - size.width / 2;
    const offsetY = position.y - size.height / 2;

    return (
        <motion.div
            className={cn(
                "absolute pointer-events-none z-10",
                "rounded-xl",
                className
            )}
            style={{
                left: offsetX - 4,
                top: offsetY - 4,
                width: size.width + 8,
                height: size.height + 8,
            }}
            variants={glowVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            data-testid="recommended-node-glow"
        >
            {/* Outer glow ring */}
            <motion.div
                className={cn(
                    "absolute inset-0 rounded-xl",
                    "ring-2 ring-indigo-400/60 dark:ring-indigo-500/60"
                )}
                variants={pulseVariants}
                animate="animate"
            />

            {/* Inner glow gradient */}
            <div
                className={cn(
                    "absolute inset-0 rounded-xl",
                    "bg-gradient-to-br from-indigo-400/10 to-purple-400/10",
                    "dark:from-indigo-500/10 dark:to-purple-500/10"
                )}
            />

            {/* Corner sparkles */}
            <div className="absolute -top-1 -right-1 w-2 h-2">
                <motion.div
                    className="w-full h-full rounded-full bg-indigo-400"
                    animate={{
                        opacity: [0.5, 1, 0.5],
                        scale: [0.8, 1, 0.8],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            </div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2">
                <motion.div
                    className="w-full h-full rounded-full bg-purple-400"
                    animate={{
                        opacity: [0.5, 1, 0.5],
                        scale: [0.8, 1, 0.8],
                    }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.75,
                    }}
                />
            </div>
        </motion.div>
    );
}
