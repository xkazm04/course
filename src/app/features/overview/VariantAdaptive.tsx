"use client";

/**
 * VariantAdaptive - AI-Powered Adaptive Knowledge Map
 *
 * Enhanced version of the Knowledge Map with AI-powered personalized
 * learning path recommendations, completion predictions, and real-time
 * adaptation suggestions.
 *
 * Architecture:
 * - This file orchestrates the adaptive map UI
 * - Helper functions are in ./lib/adaptiveHelpers.ts
 * - Sub-components are in ./components/adaptive/
 */

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Map,
    BookOpen,
    Clock,
    CheckCircle2,
    Brain,
    Sparkles,
} from "lucide-react";
import { PrismaticCard, StatCard, StatCardGrid } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { curriculumData } from "./lib/curriculumData";
import {
    CurriculumNode,
    ViewportState,
    DEFAULT_VIEWPORT,
    CATEGORY_META,
} from "./lib/curriculumTypes";
import { calculateFitViewport } from "./lib/curriculumPositions";
import { useGraphNavigation } from "./lib/useGraphNavigation";
import { calculateFocusedPath } from "./lib/focusedPathCalculator";
import {
    KnowledgeMapCanvas,
    KnowledgeMapControls,
    KnowledgeMapDetails,
    CategoryNav,
    NavigationBreadcrumbs,
    ConnectionsPanel,
    FocusModeBanner,
} from "./components";
import {
    AISuggestionsBar,
    AIRecommendationsPanel,
    NodePredictionBadge,
} from "./components/adaptive";
import { useCurriculumData } from "@/app/shared/lib/useGraphDataSource";
import {
    useAdaptiveLearning,
    AdaptiveLearningProvider,
} from "@/app/features/adaptive-learning";
import { getNodeById } from "./lib/curriculumData";

/**
 * Inner component with access to adaptive learning context.
 */
const VariantAdaptiveInner: React.FC = () => {
    // State
    const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [viewport, setViewport] = useState<ViewportState>(DEFAULT_VIEWPORT);
    const [showNav, setShowNav] = useState(true);
    const [showConnections, setShowConnections] = useState(true);
    const [focusMode, setFocusMode] = useState(false);
    const [showAIPanel, setShowAIPanel] = useState(true);
    const [showRecommendedPath, setShowRecommendedPath] = useState(true);

    // Adaptive learning context
    const {
        state: adaptiveState,
        refreshRecommendations,
        getRecommendedPath,
        getPredictionForNode,
        viewNode,
        dismissSuggestion,
    } = useAdaptiveLearning();

    // Use the unified GraphDataSource via hook
    const {
        nodes: graphNodes,
        stats: graphStats,
    } = useCurriculumData({
        category: categoryFilter ?? undefined,
    });

    // Graph navigation
    const {
        navigationContext,
        breadcrumbs,
        focusedConnection,
        containerProps,
        liveRegionProps,
        liveMessage,
        navigateTo,
        goBack,
    } = useGraphNavigation(curriculumData, selectedNode?.id ?? null, {
        enableKeyboardNav: true,
        enableAnnouncements: true,
        enableBreadcrumbs: true,
        onNodeSelect: (node) => {
            setSelectedNode(node);
            setViewport(prev => ({
                ...prev,
                translateX: -node.position.x * prev.scale + 450,
                translateY: -node.position.y * prev.scale + 300,
            }));
            viewNode(node.id, 5);
        },
    });

    // Map graph stats
    const stats = useMemo(() => ({
        total: graphStats.totalNodes,
        completed: graphStats.completedNodes,
        inProgress: graphStats.inProgressNodes,
        available: graphStats.availableNodes,
        totalHours: graphStats.totalHours,
    }), [graphStats]);

    // Calculate focused path
    const focusedNodeIds = useMemo(() => {
        if (!focusMode || !selectedNode) return undefined;
        return calculateFocusedPath(selectedNode.id, curriculumData);
    }, [focusMode, selectedNode]);

    // Get recommended path
    const recommendedPath = useMemo(() => getRecommendedPath(), [getRecommendedPath]);
    const recommendedNodeIds = useMemo(() => {
        if (!recommendedPath || !showRecommendedPath) return new Set<string>();
        return new Set(recommendedPath.nodeIds);
    }, [recommendedPath, showRecommendedPath]);

    // Handlers
    const handleFitToScreen = useCallback(() => {
        const curriculumNodes = graphNodes.map(gn => gn.metadata.curriculumNode);
        const newViewport = calculateFitViewport(curriculumNodes, { width: 900, height: 600 });
        setViewport(newViewport);
    }, [graphNodes]);

    const handleSelectNodeFromDetails = useCallback((node: CurriculumNode) => {
        navigateTo(node);
    }, [navigateTo]);

    const handleBreadcrumbNavigate = useCallback((entry: { node: CurriculumNode }) => {
        navigateTo(entry.node);
    }, [navigateTo]);

    const handleBack = useCallback(() => {
        const previous = goBack();
        if (previous) {
            setViewport(prev => ({
                ...prev,
                translateX: -previous.position.x * prev.scale + 450,
                translateY: -previous.position.y * prev.scale + 300,
            }));
        }
    }, [goBack]);

    const handleNavigateToRecommendedNode = useCallback((nodeId: string) => {
        const node = getNodeById(nodeId);
        if (node) navigateTo(node);
    }, [navigateTo]);

    return (
        <div className="space-y-6" data-testid="variant-adaptive-container" {...containerProps}>
            {/* ARIA Live Regions */}
            <div {...liveRegionProps}>{liveMessage}</div>
            <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid="adaptive-map-announcer">
                {selectedNode
                    ? `Selected: ${selectedNode.title}. ${selectedNode.description}. Status: ${selectedNode.status}.`
                    : categoryFilter
                        ? `Filtered by ${CATEGORY_META.find(c => c.id === categoryFilter)?.name || 'category'}.`
                        : ''}
            </div>

            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="relative">
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] rounded-xl blur-md opacity-50"
                                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <div className="relative p-2 bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] rounded-xl">
                                <Brain className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <h2 className="text-3xl font-black text-[var(--text-primary)]">
                            AI-Powered Knowledge Map
                        </h2>
                        <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white rounded-full">
                            Adaptive
                        </span>
                    </div>
                    <p className="text-[var(--text-secondary)]">
                        Personalized learning paths based on your goals and progress
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowAIPanel(!showAIPanel)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                            showAIPanel
                                ? "bg-[var(--ember)]/20 text-[var(--ember)]"
                                : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)]"
                        )}
                        data-testid="toggle-ai-panel-btn"
                    >
                        <Sparkles className="w-4 h-4" />
                        AI Insights
                    </button>
                    <KnowledgeMapControls
                        viewport={viewport}
                        onViewportChange={setViewport}
                        onFitToScreen={handleFitToScreen}
                        categoryFilter={categoryFilter}
                        onCategoryFilterChange={setCategoryFilter}
                        focusMode={focusMode}
                        onFocusModeChange={setFocusMode}
                        focusedPathId={selectedNode?.id ?? null}
                    />
                </div>
            </div>

            {/* AI Suggestions Bar */}
            <AISuggestionsBar
                suggestions={adaptiveState.suggestions}
                onNavigate={handleNavigateToRecommendedNode}
                onDismiss={dismissSuggestion}
            />

            {/* Focus Mode Banner */}
            {focusMode && (
                <FocusModeBanner
                    selectedNodeTitle={selectedNode?.title ?? null}
                    focusedNodeCount={focusedNodeIds?.size || 0}
                    onExit={() => setFocusMode(false)}
                />
            )}

            {/* Navigation Breadcrumbs */}
            {breadcrumbs.length > 0 && (
                <NavigationBreadcrumbs
                    breadcrumbs={breadcrumbs}
                    onNavigate={handleBreadcrumbNavigate}
                    onBack={handleBack}
                    maxVisible={5}
                />
            )}

            {/* Main Content */}
            <div className="flex gap-4">
                {/* AI Recommendations Panel */}
                <AnimatePresence>
                    {showAIPanel && (
                        <motion.div
                            initial={{ opacity: 0, x: -20, width: 0 }}
                            animate={{ opacity: 1, x: 0, width: 320 }}
                            exit={{ opacity: 0, x: -20, width: 0 }}
                            className="flex-shrink-0 overflow-hidden"
                        >
                            <AIRecommendationsPanel
                                recommendedPath={recommendedPath}
                                showRecommendedPath={showRecommendedPath}
                                isLoading={adaptiveState.isLoading}
                                analytics={adaptiveState.analytics}
                                onRefresh={refreshRecommendations}
                                onTogglePathHighlight={() => setShowRecommendedPath(!showRecommendedPath)}
                                onNavigateToNode={handleNavigateToRecommendedNode}
                                getPredictionForNode={getPredictionForNode}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Category Navigation Sidebar */}
                {showNav && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-64 flex-shrink-0"
                    >
                        <PrismaticCard className="h-[600px] overflow-y-auto">
                            <div className="p-4">
                                <CategoryNav
                                    data={curriculumData}
                                    selectedCategory={categoryFilter}
                                    onSelectCategory={setCategoryFilter}
                                />
                            </div>
                        </PrismaticCard>
                    </motion.div>
                )}

                {/* Canvas Container */}
                <div className="flex-1 relative">
                    <PrismaticCard className="overflow-hidden">
                        <div className="relative h-[600px]">
                            {/* Recommended Path Overlay Indicator */}
                            {showRecommendedPath && recommendedPath && (
                                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 bg-[var(--forge-bg-elevated)]/80 backdrop-blur-sm rounded-lg border border-[var(--ember)]/30">
                                    <div className="w-3 h-3 rounded-full bg-[var(--ember)] animate-pulse" />
                                    <span className="text-xs font-medium text-[var(--text-primary)]">
                                        AI Recommended Path
                                    </span>
                                </div>
                            )}

                            <KnowledgeMapCanvas
                                data={curriculumData}
                                selectedNode={selectedNode}
                                onSelectNode={(node) => node ? navigateTo(node) : setSelectedNode(null)}
                                viewport={viewport}
                                onViewportChange={setViewport}
                                categoryFilter={categoryFilter}
                                focusMode={focusMode}
                                focusedNodeIds={focusedNodeIds}
                            />

                            {/* Details Panel */}
                            {selectedNode && (
                                <KnowledgeMapDetails
                                    node={selectedNode}
                                    data={curriculumData}
                                    onClose={() => setSelectedNode(null)}
                                    onSelectNode={handleSelectNodeFromDetails}
                                />
                            )}

                            {/* Connections Panel */}
                            {selectedNode && showConnections && navigationContext && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute bottom-4 left-4 z-10"
                                >
                                    <ConnectionsPanel
                                        context={navigationContext}
                                        focusedConnection={focusedConnection}
                                        onNavigate={navigateTo}
                                        keyboardActive={!!focusedConnection}
                                    />
                                </motion.div>
                            )}

                            {/* Prediction Badge */}
                            {selectedNode && (
                                <NodePredictionBadge
                                    nodeId={selectedNode.id}
                                    getPrediction={getPredictionForNode}
                                />
                            )}
                        </div>
                    </PrismaticCard>

                    {/* Toggle Nav Button */}
                    <button
                        onClick={() => setShowNav(!showNav)}
                        className={cn(
                            "absolute -left-3 top-1/2 -translate-y-1/2 z-10",
                            "w-6 h-12 bg-[var(--forge-bg-elevated)] rounded-r-lg",
                            "border border-l-0 border-[var(--forge-border-subtle)]",
                            "flex items-center justify-center",
                            "hover:bg-[var(--forge-bg-workshop)] transition-colors shadow-sm"
                        )}
                        title={showNav ? "Hide categories" : "Show categories"}
                        data-testid="toggle-nav-btn"
                    >
                        <motion.span animate={{ rotate: showNav ? 180 : 0 }} className="text-[var(--forge-text-muted)]">
                            ›
                        </motion.span>
                    </button>

                    {/* Toggle Connections Button */}
                    {selectedNode && (
                        <button
                            onClick={() => setShowConnections(!showConnections)}
                            className={cn(
                                "absolute bottom-4 right-4 z-10",
                                "px-3 py-1.5 rounded-lg text-xs font-medium",
                                "bg-[var(--forge-bg-elevated)]/80 backdrop-blur-sm",
                                "border border-[var(--forge-border-subtle)]",
                                "hover:bg-[var(--forge-bg-workshop)] transition-colors",
                                showConnections && "ring-2 ring-[var(--ember)]/50"
                            )}
                            data-testid="toggle-connections-btn"
                        >
                            {showConnections ? "Hide Paths" : "Show Paths"}
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Panel */}
            <StatCardGrid columns={4} data-testid="adaptive-map-stats">
                <StatCard
                    icon={<BookOpen className="w-5 h-5 text-[var(--ember)]" />}
                    value={stats.total}
                    label={categoryFilter ? CATEGORY_META.find(c => c.id === categoryFilter)?.name || "Topics" : "Total Topics"}
                    glowColor="indigo"
                    data-testid="stats-total"
                />
                <StatCard
                    icon={<CheckCircle2 className="w-5 h-5 text-[var(--forge-success)]" />}
                    value={stats.completed}
                    label="Completed"
                    glowColor="emerald"
                    progress={stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}
                    data-testid="stats-completed"
                />
                <StatCard
                    icon={
                        <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-2 h-2 bg-[var(--ember)] rounded-full"
                        />
                    }
                    value={stats.inProgress}
                    label="In Progress"
                    glowColor="cyan"
                    data-testid="stats-in-progress"
                />
                <StatCard
                    icon={<Clock className="w-5 h-5 text-[var(--forge-accent)]" />}
                    value={`${stats.totalHours}h`}
                    label="Total Content"
                    glowColor="purple"
                    data-testid="stats-hours"
                />
            </StatCardGrid>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-[var(--forge-bg-elevated)] rounded-xl text-xs">
                <span className="font-medium text-[var(--forge-text-secondary)]">AI Path:</span>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[var(--ember)]" />
                    <span className="text-[var(--forge-text-secondary)]">Recommended</span>
                </div>
                <span className="ml-4 font-medium text-[var(--forge-text-secondary)]">Prediction:</span>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[var(--forge-success)] rounded-full" />
                    <span className="text-[var(--forge-text-secondary)]">High (70%+)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[var(--forge-warning)] rounded-full" />
                    <span className="text-[var(--forge-text-secondary)]">Medium (40-70%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-[var(--forge-error)] rounded-full" />
                    <span className="text-[var(--forge-text-secondary)]">Low (&lt;40%)</span>
                </div>
            </div>
        </div>
    );
};

/**
 * VariantAdaptive - Wrapped with AdaptiveLearningProvider
 */
export const VariantAdaptive: React.FC = () => {
    return (
        <AdaptiveLearningProvider>
            <VariantAdaptiveInner />
        </AdaptiveLearningProvider>
    );
};

export default VariantAdaptive;
