"use client";

/**
 * KnowledgeMapWithOracle Component
 *
 * Composite component that integrates the Knowledge Map with the Career Oracle.
 * Features:
 * - Bottom panel Oracle wizard (expandable)
 * - Recommended/hypothetical node highlighting
 * - Path preview sidebar
 * - Particle forge animation for creating new nodes
 */

import React, { useMemo, useCallback, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";
import { KnowledgeMap } from "./KnowledgeMap";
import { useOracleMapIntegration, type UseOracleMapIntegrationOptions } from "./lib/useOracleMapIntegration";
import { OracleBottomPanel } from "./components/OracleBottomPanel";
import { PathPreviewSidebar } from "./components/PathPreviewSidebar";
import type { MapNode, KnowledgeMapProps, HypotheticalMapNode } from "./lib/types";
import type { LearningDomainId } from "@/app/shared/lib/learningDomains";

// ============================================================================
// TYPES
// ============================================================================

export interface KnowledgeMapWithOracleProps extends Omit<KnowledgeMapProps, 'onNodeSelect'> {
    /** Enable debug mode */
    debug?: boolean;
    /** Callback when a node is selected (extended with hypothetical nodes) */
    onNodeSelect?: (node: MapNode | HypotheticalMapNode | null) => void;
    /** Callback when path is confirmed */
    onPathConfirmed?: (nodes: HypotheticalMapNode[]) => void;
    /** Initial panel state */
    initialPanelExpanded?: boolean;
    /** Available nodes for matching (passed from parent) */
    existingNodes?: MapNode[];
    /** Enable demo mode with pre-populated mock data */
    demo?: boolean;
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

const containerVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const sidebarVariants: Variants = {
    hidden: { x: 320, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { type: "spring", damping: 25, stiffness: 300 },
    },
    exit: {
        x: 320,
        opacity: 0,
        transition: { type: "spring", damping: 25, stiffness: 300 },
    },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function KnowledgeMapWithOracle({
    height = "700px",
    initialDomainId,
    onNodeSelect,
    onStartLearning,
    onPathConfirmed,
    theme,
    debug = false,
    initialPanelExpanded = false,
    existingNodes = [],
    demo = false,
}: KnowledgeMapWithOracleProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [demoInitialized, setDemoInitialized] = useState(false);

    // Oracle integration hook
    const oracle = useOracleMapIntegration({
        debug,
        autoExpandOnPath: true,
        existingNodes,
        onForgeComplete: (nodeId) => {
            if (debug) console.log('[KnowledgeMapWithOracle] Forge complete:', nodeId);
        },
    });

    // Demo mode: Auto-populate oracle with mock data
    useEffect(() => {
        if (demo && !demoInitialized) {
            const initDemo = async () => {
                // Step 1: Set skills
                oracle.updateSkills(['JavaScript', 'React', 'TypeScript', 'Node.js']);

                // Step 2: Set goal
                oracle.updateGoal('Senior Frontend Engineer', 'tech_startups');

                // Step 3: Set preferences
                oracle.updatePreferences({
                    weeklyHours: 15,
                    riskTolerance: 'moderate',
                    learningStyle: 'project',
                    focusAreas: ['React Advanced Patterns', 'System Design', 'AI Integration'],
                });

                // Wait a moment then generate predictions and path
                await new Promise(resolve => setTimeout(resolve, 500));
                await oracle.generatePredictions();
                await oracle.generatePath();

                // Expand the panel to show the completed state
                oracle.expandBottomPanel();

                setDemoInitialized(true);
            };

            initDemo();
        }
        // ESLint might complain about missing dependencies if we just remove 'oracle',
        // but adding the whole object causes infinite loops. 
        // We rely on the fact that the methods from useOracleMapIntegration are stable.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [demo, demoInitialized]);

    // Destructure oracle integration state
    const {
        integration,
        expandBottomPanel,
        collapseBottomPanel,
        toggleBottomPanel,
        showPathPreview,
        hidePathPreview,
        togglePathPreview,
        hasGeneratedPath,
        hypotheticalNodeCount,
        recommendedNodeCount,
        confirmPath,
        isConfirming,
        state: oracleState,
    } = oracle;

    // Calculate layout dimensions
    const layoutDimensions = useMemo(() => {
        const panelHeight = integration.bottomPanelExpanded ? 220 : 48;
        const sidebarWidth = integration.pathPreviewVisible ? 320 : 0;
        const mapWidth = sidebarWidth > 0 ? `calc(100% - ${sidebarWidth}px)` : '100%';

        return {
            panelHeight,
            sidebarWidth,
            mapWidth,
            mapHeight: `calc(${height} - ${panelHeight}px)`,
        };
    }, [integration.bottomPanelExpanded, integration.pathPreviewVisible, height]);

    // Handle node selection (merge regular and hypothetical nodes)
    const handleNodeSelect = useCallback((node: MapNode | null) => {
        // Check if it's a hypothetical node
        const hypotheticalNode = integration.hypotheticalNodes.find(
            h => h.id === node?.id
        );

        if (hypotheticalNode) {
            onNodeSelect?.(hypotheticalNode);
        } else {
            onNodeSelect?.(node);
        }
    }, [integration.hypotheticalNodes, onNodeSelect]);

    // Handle path confirmation
    const handleConfirmPath = useCallback(async () => {
        const confirmedNodes = await confirmPath();
        onPathConfirmed?.(confirmedNodes);
    }, [confirmPath, onPathConfirmed]);

    // Suggested path from oracle
    const suggestedPath = oracleState.predictions.suggestedPath;

    return (
        <motion.div
            ref={containerRef}
            className={cn(
                "relative w-full overflow-hidden",
                "bg-[var(--forge-bg-workshop)]",
                "rounded-2xl border border-[var(--forge-border-subtle)]"
            )}
            style={{ height }}
            variants={containerVariants}
            initial="initial"
            animate="animate"
            data-testid="knowledge-map-with-oracle"
        >
            {/* Main content area */}
            <div
                className="relative w-full transition-all duration-300 ease-out"
                style={{
                    height: layoutDimensions.mapHeight,
                    width: layoutDimensions.mapWidth,
                }}
            >
                {/* Knowledge Map */}
                <KnowledgeMap
                    height="100%"
                    initialDomainId={initialDomainId}
                    onNodeSelect={handleNodeSelect}
                    onStartLearning={onStartLearning}
                    theme={theme}
                    hypotheticalNodes={integration.hypotheticalNodes}
                />

                {/* Recommended/Hypothetical nodes overlay indicator */}
                {(recommendedNodeCount > 0 || hypotheticalNodeCount > 0) && (
                    <div className="absolute top-20 right-4 z-30">
                        <div className="px-3 py-2 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-md rounded-lg border border-[var(--forge-border-subtle)] shadow-lg">
                            <div className="flex items-center gap-3 text-xs">
                                {recommendedNodeCount > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-[var(--ember)] animate-pulse" />
                                        <span className="text-[var(--ember)]">
                                            {recommendedNodeCount} recommended
                                        </span>
                                    </div>
                                )}
                                {hypotheticalNodeCount > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full border-2 border-dashed border-[var(--forge-text-muted)]" />
                                        <span className="text-[var(--forge-text-secondary)]">
                                            {hypotheticalNodeCount} to create
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Path Preview Sidebar */}
            <AnimatePresence>
                {integration.pathPreviewVisible && suggestedPath && (
                    <motion.div
                        className="absolute right-0 top-0 z-40"
                        style={{ height: layoutDimensions.mapHeight }}
                        variants={sidebarVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <PathPreviewSidebar
                            path={suggestedPath}
                            hypotheticalNodes={integration.hypotheticalNodes}
                            recommendedNodeIds={integration.recommendedNodeIds}
                            onClose={hidePathPreview}
                            onConfirm={handleConfirmPath}
                            isConfirming={isConfirming}
                            onModuleHover={(moduleId) => {
                                // TODO: Highlight corresponding node on map
                                if (debug) console.log('[KnowledgeMapWithOracle] Module hover:', moduleId);
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Oracle Bottom Panel */}
            <div className="absolute bottom-0 left-0 right-0 z-50">
                <OracleBottomPanel
                    oracle={oracle}
                    isExpanded={integration.bottomPanelExpanded}
                    onToggle={toggleBottomPanel}
                    onExpand={expandBottomPanel}
                    onCollapse={collapseBottomPanel}
                    hasGeneratedPath={hasGeneratedPath}
                    onShowPathPreview={showPathPreview}
                />
            </div>
        </motion.div>
    );
}

export default KnowledgeMapWithOracle;
