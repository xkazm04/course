"use client";

/**
 * OracleBottomPanel Component
 *
 * Expandable bottom panel for the Career Oracle wizard.
 * Collapsed: 48px thin CTA bar
 * Expanded: 220px horizontal 3-step wizard
 */

import React from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";
import { OracleCollapsedBar } from "./OracleCollapsedBar";
import { OracleExpandedWizard } from "./OracleExpandedWizard";
import type { UseOracleMapIntegrationReturn } from "../../lib/useOracleMapIntegration";

// ============================================================================
// TYPES
// ============================================================================

export interface OracleBottomPanelProps {
    /** Oracle integration hook return */
    oracle: UseOracleMapIntegrationReturn;
    /** Whether panel is expanded */
    isExpanded: boolean;
    /** Toggle panel expansion */
    onToggle: () => void;
    /** Expand panel */
    onExpand: () => void;
    /** Collapse panel */
    onCollapse: () => void;
    /** Whether path has been generated */
    hasGeneratedPath: boolean;
    /** Show path preview sidebar */
    onShowPathPreview: () => void;
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const panelVariants: Variants = {
    collapsed: {
        height: 48,
        transition: { type: "spring", damping: 25, stiffness: 300 },
    },
    expanded: {
        height: 220,
        transition: { type: "spring", damping: 25, stiffness: 300 },
    },
};

const contentVariants: Variants = {
    collapsed: {
        opacity: 0,
        y: 20,
        transition: { duration: 0.15 },
    },
    expanded: {
        opacity: 1,
        y: 0,
        transition: { delay: 0.1, duration: 0.2 },
    },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function OracleBottomPanel({
    oracle,
    isExpanded,
    onToggle,
    onExpand,
    onCollapse,
    hasGeneratedPath,
    onShowPathPreview,
}: OracleBottomPanelProps) {
    return (
        <motion.div
            className={cn(
                "w-full overflow-hidden",
                "border-t border-[var(--forge-border-subtle)]",
                "bg-[var(--forge-bg-elevated)]",
                "shadow-lg"
            )}
            variants={panelVariants}
            animate={isExpanded ? "expanded" : "collapsed"}
            initial="collapsed"
            data-testid="oracle-bottom-panel"
        >
            {/* Collapsed bar - always visible */}
            <OracleCollapsedBar
                isExpanded={isExpanded}
                onToggle={onToggle}
                hasGeneratedPath={hasGeneratedPath}
                onShowPathPreview={onShowPathPreview}
                activeStep={oracle.integration.activeStep}
            />

            {/* Expanded wizard content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className="px-6 pb-4"
                        variants={contentVariants}
                        initial="collapsed"
                        animate="expanded"
                        exit="collapsed"
                    >
                        <OracleExpandedWizard
                            oracle={oracle}
                            onCollapse={onCollapse}
                            hasGeneratedPath={hasGeneratedPath}
                            onShowPathPreview={onShowPathPreview}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
