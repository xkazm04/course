"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Map, BookOpen, Clock, CheckCircle2, Link2 } from "lucide-react";
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
import { calculateFocusedPath } from "./lib/focusedPathCalculator";
import { useGraphNavigation } from "./lib/useGraphNavigation";
import {
    KnowledgeMapCanvas,
    KnowledgeMapControls,
    KnowledgeMapDetails,
    CategoryNav,
    NavigationBreadcrumbs,
    ConnectionsPanel,
    SkillGapModeBanner,
    FocusModeBanner,
    KnowledgeMapLegend,
} from "./components";
import {
    useCurriculumData,
} from "@/app/shared/lib/useGraphDataSource";
import {
    useSkillGapAnalysis,
    extractProgressFromCurriculumStatus,
} from "./lib/useSkillGapAnalysis";
import {
    useViewQuery,
    queryToVariantState,
} from "@/app/shared/lib/viewQuery";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

/**
 * VariantD - Knowledge Map
 *
 * Interactive canvas-based visualization of the frontend curriculum
 * with 100+ nodes organized by category and skill tier.
 *
 * Features:
 * - Pan/zoom canvas based on Roadmap pattern
 * - Category filtering for focused exploration
 * - Multi-level navigation sidebar
 * - Detailed node information panel
 * - Prerequisite/dependency tracking
 *
 * Now powered by the unified GraphDataSource interface, making this variant
 * a pure renderer that can work with any graph-based data source.
 *
 * VIEW AS QUERY:
 * This variant's state is now represented as a ViewQuery:
 * - categoryFilter is a WHERE clause
 * - focusMode is a graph traversal (BFS from selected node)
 * - skillGapMode enables mastery overlay
 * - viewport state is serialized for shareable URLs
 */
export const VariantD: React.FC = () => {
    // State
    const [selectedNode, setSelectedNode] = useState<CurriculumNode | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [viewport, setViewport] = useState<ViewportState>(DEFAULT_VIEWPORT);
    const [showNav, setShowNav] = useState(true);
    const [showConnections, setShowConnections] = useState(true);
    const [focusMode, setFocusMode] = useState(false);
    const [skillGapMode, setSkillGapMode] = useState(false);
    const [urlCopied, setUrlCopied] = useState(false);

    // Extract progress from curriculum node status
    const { completedNodeIds, inProgressNodeIds } = useMemo(() =>
        extractProgressFromCurriculumStatus(curriculumData.nodes),
        []
    );

    // Skill gap analysis hook
    const {
        getNodeMastery,
        isRecommendedPath,
        stats: skillGapStats,
    } = useSkillGapAnalysis({
        curriculumData,
        completedNodeIds,
        inProgressNodeIds,
        enabled: skillGapMode,
    });

    // Use the unified GraphDataSource via hook
    const {
        nodes: graphNodes,
        stats: graphStats,
        totalNodeCount,
        dataSource,
    } = useCurriculumData({
        category: categoryFilter ?? undefined,
    });

    // ViewQuery integration
    const viewQuery = useViewQuery({
        dataSource,
        syncToUrl: true,
        initFromUrl: true,
    });

    // Sync local state with ViewQuery for URL persistence
    useEffect(() => {
        viewQuery.updateQuery({
            category: categoryFilter,
            focusMode,
            skillGapMode,
            traversal: focusMode && selectedNode ? {
                startNodeId: selectedNode.id,
                direction: "both",
                maxDepth: -1,
                includeStart: true,
            } : null,
            viewport: viewport ? {
                translateX: viewport.translateX,
                translateY: viewport.translateY,
                scale: viewport.scale,
            } : null,
            selection: selectedNode ? {
                selectedIds: [selectedNode.id],
                hoveredId: null,
                focusedId: selectedNode.id,
            } : null,
        });
    }, [categoryFilter, focusMode, skillGapMode, selectedNode?.id, viewport]);

    // Initialize from URL params on mount
    useEffect(() => {
        const state = queryToVariantState(viewQuery.query);
        if (state.categoryFilter && state.categoryFilter !== categoryFilter) {
            setCategoryFilter(state.categoryFilter);
        }
        if (state.focusMode !== focusMode) {
            setFocusMode(state.focusMode);
        }
        if (state.skillGapMode !== skillGapMode) {
            setSkillGapMode(state.skillGapMode);
        }
        if (state.viewport && (
            state.viewport.translateX !== DEFAULT_VIEWPORT.translateX ||
            state.viewport.translateY !== DEFAULT_VIEWPORT.translateY ||
            state.viewport.scale !== DEFAULT_VIEWPORT.scale
        )) {
            setViewport(state.viewport);
        }
    }, []);

    // Handler for sharing the current view
    const handleShareView = useCallback(async () => {
        const url = viewQuery.getShareableUrl();
        try {
            await navigator.clipboard.writeText(url);
            setUrlCopied(true);
            setTimeout(() => setUrlCopied(false), 2000);
        } catch {
            window.prompt("Copy this shareable URL:", url);
        }
    }, [viewQuery]);

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
        },
    });

    // Map graph stats to local stats format
    const stats = useMemo(() => ({
        total: graphStats.totalNodes,
        completed: graphStats.completedNodes,
        inProgress: graphStats.inProgressNodes,
        available: graphStats.availableNodes,
        totalHours: graphStats.totalHours,
    }), [graphStats]);

    // Calculate focused path when focus mode is active
    const focusedNodeIds = useMemo(() => {
        if (!focusMode || !selectedNode) {
            return undefined;
        }
        return calculateFocusedPath(selectedNode.id, curriculumData);
    }, [focusMode, selectedNode]);

    // Handle fit to screen
    const handleFitToScreen = useCallback(() => {
        const curriculumNodes = graphNodes.map(gn => gn.metadata.curriculumNode);
        const newViewport = calculateFitViewport(curriculumNodes, {
            width: 900,
            height: 600,
        });
        setViewport(newViewport);
    }, [graphNodes]);

    // Handle node selection from details panel
    const handleSelectNodeFromDetails = useCallback((node: CurriculumNode) => {
        navigateTo(node);
    }, [navigateTo]);

    // Handle breadcrumb navigation
    const handleBreadcrumbNavigate = useCallback((entry: { node: CurriculumNode }) => {
        navigateTo(entry.node);
    }, [navigateTo]);

    // Handle back navigation
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

    return (
        <div
            className="space-y-6"
            data-testid="variant-d-container"
            {...containerProps}
        >
            {/* ARIA Live Regions */}
            <div {...liveRegionProps}>{liveMessage}</div>
            <div
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
                data-testid="knowledge-map-selection-announcer"
            >
                {selectedNode
                    ? `Selected: ${selectedNode.title}. ${selectedNode.description}. Status: ${selectedNode.status}. Press Escape to deselect.`
                    : categoryFilter
                        ? `Filtered by ${CATEGORY_META.find(c => c.id === categoryFilter)?.name || 'category'}. Showing ${stats.total} topics.`
                        : ''
                }
            </div>

            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-[var(--ember)]/20 rounded-xl">
                            <Map className="w-6 h-6 text-[var(--ember)]" />
                        </div>
                        <h2 className="text-3xl font-black text-[var(--text-primary)]">
                            Knowledge Map
                        </h2>
                        <button
                            onClick={handleShareView}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg",
                                "bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)]",
                                "text-[var(--forge-text-secondary)] hover:text-[var(--ember)]",
                                "hover:border-[var(--ember)] transition-colors",
                                urlCopied && "bg-[var(--forge-success)]/10 border-[var(--forge-success)]/50 text-[var(--forge-success)]"
                            )}
                            title="Copy shareable URL for current view"
                            data-testid="share-view-btn"
                        >
                            <Link2 size={ICON_SIZES.xs} />
                            {urlCopied ? "Copied!" : "Share View"}
                        </button>
                    </div>
                    <p className="text-[var(--text-secondary)]">
                        Explore {totalNodeCount} topics across the frontend ecosystem. Click nodes to learn more.
                    </p>
                </div>

                <KnowledgeMapControls
                    viewport={viewport}
                    onViewportChange={setViewport}
                    onFitToScreen={handleFitToScreen}
                    categoryFilter={categoryFilter}
                    onCategoryFilterChange={setCategoryFilter}
                    focusMode={focusMode}
                    onFocusModeChange={setFocusMode}
                    focusedPathId={selectedNode?.id ?? null}
                    skillGapMode={skillGapMode}
                    onSkillGapModeChange={setSkillGapMode}
                    skillGapStats={skillGapStats}
                />
            </div>

            {/* Mode Banners */}
            {skillGapMode && (
                <SkillGapModeBanner
                    stats={skillGapStats}
                    onExit={() => setSkillGapMode(false)}
                />
            )}

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
                            <KnowledgeMapCanvas
                                data={curriculumData}
                                selectedNode={selectedNode}
                                onSelectNode={(node) => node ? navigateTo(node) : setSelectedNode(null)}
                                viewport={viewport}
                                onViewportChange={setViewport}
                                categoryFilter={categoryFilter}
                                focusMode={focusMode}
                                focusedNodeIds={focusedNodeIds}
                                skillGapMode={skillGapMode}
                                getNodeMastery={getNodeMastery}
                                isRecommendedPath={isRecommendedPath}
                            />

                            {selectedNode && (
                                <KnowledgeMapDetails
                                    node={selectedNode}
                                    data={curriculumData}
                                    onClose={() => setSelectedNode(null)}
                                    onSelectNode={handleSelectNodeFromDetails}
                                />
                            )}

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
                            "hover:bg-[var(--forge-bg-workshop)] transition-colors",
                            "shadow-sm"
                        )}
                        title={showNav ? "Hide categories" : "Show categories"}
                        data-testid="knowledge-map-toggle-nav-btn"
                    >
                        <motion.span
                            animate={{ rotate: showNav ? 180 : 0 }}
                            className="text-[var(--forge-text-muted)]"
                        >
                            ›
                        </motion.span>
                    </button>

                    {/* Toggle Connections Panel Button */}
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
                            title={showConnections ? "Hide connections panel" : "Show connections panel"}
                            data-testid="toggle-connections-panel-btn"
                        >
                            {showConnections ? "Hide Paths" : "Show Paths"}
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Panel */}
            <StatCardGrid columns={4} data-testid="knowledge-map-stats">
                <StatCard
                    icon={<BookOpen className="w-5 h-5 text-[var(--ember)]" />}
                    value={stats.total}
                    label={categoryFilter
                        ? CATEGORY_META.find(c => c.id === categoryFilter)?.name || "Topics"
                        : "Total Topics"}
                    glowColor="indigo"
                    data-testid="stats-total-topics"
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
                    data-testid="stats-total-hours"
                />
            </StatCardGrid>

            {/* Legend */}
            <KnowledgeMapLegend />
        </div>
    );
};

export default VariantD;
