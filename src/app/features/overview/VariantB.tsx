"use client";

import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Clock, Users, TrendingUp, GitBranch, ArrowUpRight, Check, Bookmark, Link2, Database, AlertCircle, Loader2 } from "lucide-react";
import { PrismaticCard, PathCard, PathStats, PathHeader, StatCard, StatCardGrid } from "@/app/shared/components";
import { learningPaths, type LearningPath } from "@/app/shared/lib/mockData";
import { useLearningPaths } from "@/app/shared/hooks/useLearningPaths";
import {
    getGlowColor,
    toDomainColor,
    type LearningDomainId,
} from "@/app/shared/lib/learningDomains";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { useVariantAnimation } from "@/app/shared/hooks";
import {
    useLearningPathData,
    type GraphNode,
    type LearningPathNodeMeta,
    getProgressionLabel,
} from "@/app/shared/lib/useGraphDataSource";
import { VariantShell, type VariantShellContext } from "./components/VariantShell";
import {
    PathComparisonModal,
    CompareButton,
    ComparisonBadge,
    usePathComparison,
} from "@/app/features/path-comparison";
import {
    ShareModal,
    useSharePath,
} from "@/app/features/shareable-links";
import {
    useUserLearningGraph,
    PathProgressIndicator,
    MutationToast,
} from "@/app/features/user-learning-graph";
import { cn } from "@/app/shared/lib/utils";
import {
    useViewQuery,
    variantStateToQuery,
    queryToVariantState,
    generateShareableUrl,
    type ViewQuery,
} from "@/app/shared/lib/viewQuery";

// Variant B: Sidebar List with Preview Panel
// Uses VariantShell for common state management (selection, animation orchestration)
// Provides unique visual renderer: sidebar list + preview panel layout
//
// Now powered by the unified GraphDataSource interface, making this variant
// a pure renderer that can work with any graph-based data source.

// Compute total courses from learningPaths data (static, computed once)
const totalCourses = learningPaths.reduce((sum, path) => sum + path.courses, 0);

// Preview Panel Component - unique visual renderer for VariantB
interface PreviewPanelProps {
    selectedPath: LearningPath;
    onSelectPath: (path: LearningPath) => void;
    // Graph data from unified data source
    getPrerequisites: (nodeId: string) => GraphNode<LearningPathNodeMeta>[];
    getDependents: (nodeId: string) => GraphNode<LearningPathNodeMeta>[];
    // Share functionality
    onShare: (path: LearningPath) => void;
    // User learning graph actions
    onStartPath: (pathId: LearningDomainId) => void;
    onBookmarkPath: (pathId: LearningDomainId) => void;
    isPathStarted: boolean;
    isPathBookmarked: boolean;
    pathProgress: number;
}

const PreviewPanel = ({
    selectedPath,
    onSelectPath,
    getPrerequisites,
    getDependents,
    onShare,
    onStartPath,
    onBookmarkPath,
    isPathStarted,
    isPathBookmarked,
    pathProgress,
}: PreviewPanelProps) => {
    const selectedColor = toDomainColor(selectedPath.color);

    // Get relationship data from the unified GraphDataSource
    const prerequisites = useMemo(() => {
        const prereqNodes = getPrerequisites(selectedPath.id);
        return prereqNodes
            .map(node => node.metadata.learningPath)
            .filter((p): p is LearningPath => p !== undefined);
    }, [selectedPath.id, getPrerequisites]);

    const leadsTo = useMemo(() => {
        const dependentNodes = getDependents(selectedPath.id);
        return dependentNodes
            .map(node => node.metadata.learningPath)
            .filter((p): p is LearningPath => p !== undefined);
    }, [selectedPath.id, getDependents]);

    const previewAnimation = useVariantAnimation({
        preset: "smooth",
        direction: "right",
    });

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={selectedPath.id}
                initial={previewAnimation.initial}
                animate={previewAnimation.animate}
                exit={previewAnimation.exit}
                transition={previewAnimation.transition}
            >
                <PrismaticCard className="h-full" glowColor={getGlowColor(selectedColor)}>
                    <div className="p-8 h-full flex flex-col">
                        <PathHeader path={selectedPath} pathColor={selectedColor} onShare={onShare} />

                        <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2">
                            {selectedPath.name}
                        </h2>
                        <p className="text-lg text-[var(--text-secondary)] mb-6">
                            {selectedPath.description}
                        </p>

                        <StatCardGrid columns={3} className="mb-6">
                            <StatCard
                                icon={<Clock className="text-[var(--text-muted)]" size={ICON_SIZES.md} />}
                                value={`${selectedPath.hours}h`}
                                label="Total Duration"
                                glowColor="indigo"
                                data-testid="path-duration-stat"
                            />
                            <StatCard
                                icon={<Users className="text-[var(--text-muted)]" size={ICON_SIZES.md} />}
                                value={selectedPath.courses}
                                label="Courses"
                                glowColor="purple"
                                data-testid="path-courses-stat"
                            />
                            <StatCard
                                icon={<TrendingUp className="text-[var(--text-muted)]" size={ICON_SIZES.md} />}
                                value={totalCourses}
                                label="Total Courses"
                                glowColor="cyan"
                                data-testid="total-courses-stat"
                            />
                        </StatCardGrid>

                        <PathStats path={selectedPath} pathColor={selectedColor} />

                        {/* Learning Path Relationships - powered by shared graph data */}
                        {(prerequisites.length > 0 || leadsTo.length > 0) && (
                            <div className="mt-6 mb-6 p-4 bg-[var(--surface-inset)] rounded-xl">
                                <div className="icon-text-align mb-3">
                                    <GitBranch size={ICON_SIZES.sm} className="text-[var(--text-muted)]" data-icon />
                                    <span className="text-sm font-semibold text-[var(--text-secondary)]">Learning Path Connections</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {prerequisites.length > 0 && (
                                        <div>
                                            <div className="text-xs text-[var(--text-muted)] mb-2">Builds on:</div>
                                            <div className="space-y-1">
                                                {prerequisites.map(p => (
                                                    <button
                                                        key={p.id}
                                                        data-testid={`prerequisite-${p.id}-btn`}
                                                        onClick={() => onSelectPath(p)}
                                                        className="flex items-center gap-1 py-2 min-h-[44px] text-sm text-[var(--accent-primary)] hover:underline"
                                                    >
                                                        <ArrowUpRight size={ICON_SIZES.xs} className="rotate-180" />
                                                        {p.name.split(' ')[0]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {leadsTo.length > 0 && (
                                        <div>
                                            <div className="text-xs text-[var(--text-muted)] mb-2">Leads to:</div>
                                            <div className="space-y-1">
                                                {leadsTo.map(p => (
                                                    <button
                                                        key={p.id}
                                                        data-testid={`leads-to-${p.id}-btn`}
                                                        onClick={() => onSelectPath(p)}
                                                        className="flex items-center gap-1 py-2 min-h-[44px] text-sm text-[var(--accent-primary)] hover:underline"
                                                    >
                                                        <ArrowUpRight size={ICON_SIZES.xs} />
                                                        {p.name.split(' ')[0]}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Path Progress Indicator */}
                        {isPathStarted && pathProgress > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-[var(--text-secondary)]">Your Progress</span>
                                    <span className="text-sm font-bold text-[var(--accent-primary)]">{pathProgress}%</span>
                                </div>
                                <PathProgressIndicator
                                    pathId={selectedPath.id}
                                    progress={pathProgress}
                                    isPrimary={true}
                                    isSelected={true}
                                    size="md"
                                />
                            </div>
                        )}

                        <div className="mt-auto flex gap-4">
                            <button
                                data-testid="start-path-btn"
                                onClick={() => onStartPath(selectedPath.id as LearningDomainId)}
                                className={cn(
                                    "flex-1 py-4 rounded-2xl font-bold transition-all icon-text-align justify-center",
                                    isPathStarted
                                        ? "bg-emerald-500 text-white"
                                        : "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:opacity-90"
                                )}
                            >
                                {isPathStarted ? (
                                    <>
                                        <Check size={ICON_SIZES.md} data-icon />
                                        <span>Continue Learning</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Start Path</span>
                                        <ArrowRight size={ICON_SIZES.md} data-icon />
                                    </>
                                )}
                            </button>
                            <button
                                data-testid="bookmark-path-btn"
                                onClick={() => onBookmarkPath(selectedPath.id as LearningDomainId)}
                                className={cn(
                                    "px-6 py-4 rounded-2xl font-bold transition-colors",
                                    isPathBookmarked
                                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                                        : "bg-[var(--btn-secondary-bg)] border border-[var(--btn-secondary-border)] text-[var(--btn-secondary-text)] hover:bg-[var(--surface-overlay)]"
                                )}
                                title={isPathBookmarked ? "Remove bookmark" : "Bookmark for later"}
                            >
                                <Bookmark
                                    size={ICON_SIZES.md}
                                    className={isPathBookmarked ? "fill-current" : ""}
                                />
                            </button>
                        </div>
                    </div>
                </PrismaticCard>
            </motion.div>
        </AnimatePresence>
    );
};

// Sidebar List Component - unique visual renderer for VariantB
interface SidebarListProps {
    graphNodes: GraphNode<LearningPathNodeMeta>[];
    selectedPath: LearningPath;
    onSelectPath: (path: LearningPath) => void;
    staggerDelay: number;
    // Comparison props
    isSelected: (pathId: string) => boolean;
    togglePath: (path: LearningPath) => void;
    canAddMore: boolean;
    // View query props (for shareable URLs)
    shareableUrl?: string;
    onShareView?: () => void;
    // Data source indicator
    isLoadingData?: boolean;
    isUsingMockData?: boolean;
}

const SidebarList = ({
    graphNodes,
    selectedPath,
    onSelectPath,
    staggerDelay,
    isSelected,
    togglePath,
    canAddMore,
    shareableUrl,
    onShareView,
    isLoadingData,
    isUsingMockData,
}: SidebarListProps) => (
    <div className="lg:col-span-4 space-y-2">
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Select Your Path</h2>
                {shareableUrl && (
                    <button
                        onClick={onShareView}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-colors"
                        title="Copy shareable URL for current view"
                        data-testid="share-view-btn"
                    >
                        <Link2 size={ICON_SIZES.xs} />
                        Share View
                    </button>
                )}
            </div>
            <p className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
                <span>Sorted by learning progression</span>
                {isLoadingData ? (
                    <span className="flex items-center gap-1 text-indigo-500">
                        <Loader2 size={12} className="animate-spin" />
                        Loading...
                    </span>
                ) : isUsingMockData ? (
                    <span className="flex items-center gap-1 text-amber-500" title="Using mock data - connect to Supabase for live data">
                        <AlertCircle size={12} />
                        Mock
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-emerald-500" title="Connected to Supabase">
                        <Database size={12} />
                        Live
                    </span>
                )}
            </p>
        </div>

        {graphNodes.map((graphNode, index) => {
            // Get the original LearningPath from the node metadata
            const path = graphNode.metadata.learningPath;
            // Use unified progression level for consistent labeling
            const progressionLevel = graphNode.progressionLevel;

            return (
                <div key={path.id} className="relative">
                    <PathCard
                        path={path}
                        variant="sidebar"
                        isSelected={selectedPath.id === path.id}
                        onClick={() => onSelectPath(path)}
                        animationDelay={index * staggerDelay}
                        badge={getProgressionLabel(progressionLevel)}
                    />
                    {/* Compare button overlay */}
                    <div className="absolute top-1/2 right-12 -translate-y-1/2">
                        <CompareButton
                            path={path}
                            isSelected={isSelected(path.id)}
                            canAddMore={canAddMore}
                            onToggle={togglePath}
                            size="sm"
                        />
                    </div>
                </div>
            );
        })}
    </div>
);

// Main VariantB Component - uses VariantShell for state management
// Now powered by unified GraphDataSource, making this a pure renderer
// User decisions are now tracked as learning graph mutations
//
// VIEW AS QUERY:
// This variant's state is now represented as a ViewQuery:
// - categoryFilter is a WHERE clause
// - comparison selection is a JOIN of multiple paths
// - The shareable URL encodes the complete query state
export const VariantB = () => {
    // Fetch learning paths from Supabase API with fallback to mock
    const {
        data: apiPaths,
        isLoading: isLoadingPaths,
        isUsingMock,
    } = useLearningPaths({
        debug: process.env.NODE_ENV === 'development',
    });

    // Use the unified graph data source via hook
    const {
        sortedByHierarchy,
        getPrerequisites,
        getDependents,
        stats,
        dataSource,
    } = useLearningPathData();

    // User learning graph for tracking decisions
    const {
        selectLearningPath,
        bookmarkLearningNode,
        unbookmarkLearningNode,
        isPathSelected,
        isNodeBookmarked,
        getPathProgress,
    } = useUserLearningGraph();

    // Toast state for mutation feedback
    const [toastState, setToastState] = useState<{
        type: "path_selected" | "node_bookmarked";
        pathId?: string;
        isVisible: boolean;
    }>({ type: "path_selected", isVisible: false });

    // ViewQuery state - the view is a query on the learning graph
    // This makes the implicit query explicit and enables URL serialization
    const viewQuery = useViewQuery<LearningPathNodeMeta>({
        dataSource,
        syncToUrl: true,
        initFromUrl: true,
    });

    // Get sorted LearningPath objects from the graph nodes
    const sortedPaths = useMemo(() => {
        return sortedByHierarchy.map(node => node.metadata.learningPath);
    }, [sortedByHierarchy]);

    // Path comparison hook - now synced with ViewQuery for URL serialization
    const comparison = usePathComparison({
        allPaths: learningPaths,
        maxPaths: 3,
    });

    // Sync comparison state with ViewQuery
    React.useEffect(() => {
        const comparePaths = comparison.session.selectedPaths.map(p => p.id);
        if (comparePaths.length > 0) {
            viewQuery.setComparePaths(comparePaths);
        }
    }, [comparison.session.selectedPaths]);

    // Shareable links hook
    const share = useSharePath();

    // Handler for starting a path (mutates the learning graph)
    const handleStartPath = useCallback((pathId: LearningDomainId) => {
        selectLearningPath(pathId, true);
        setToastState({
            type: "path_selected",
            pathId,
            isVisible: true,
        });
    }, [selectLearningPath]);

    // Handler for bookmarking a path
    const handleBookmarkPath = useCallback((pathId: LearningDomainId) => {
        if (isNodeBookmarked(pathId)) {
            unbookmarkLearningNode(pathId);
        } else {
            bookmarkLearningNode(pathId);
            setToastState({
                type: "node_bookmarked",
                pathId,
                isVisible: true,
            });
        }
    }, [bookmarkLearningNode, unbookmarkLearningNode, isNodeBookmarked]);

    // Close toast handler
    const handleCloseToast = useCallback(() => {
        setToastState(prev => ({ ...prev, isVisible: false }));
    }, []);

    // Handler for sharing the current view (ViewQuery as shareable URL)
    const handleShareView = useCallback(async () => {
        const url = viewQuery.getShareableUrl();
        try {
            await navigator.clipboard.writeText(url);
            // Show a brief notification (reuse toast mechanism)
            setToastState({
                type: "path_selected", // Reusing for simplicity, could add "view_shared" type
                isVisible: true,
            });
        } catch {
            // Fallback - open a prompt
            window.prompt("Copy this shareable URL:", url);
        }
    }, [viewQuery]);

    // Sync selection with ViewQuery for URL serialization
    const handleSelectPath = useCallback((path: LearningPath) => {
        viewQuery.selectNode(path.id);
    }, [viewQuery]);

    return (
        <VariantShell<LearningPath>
            items={sortedPaths}
            initialSelected={sortedPaths[0]}
            getItemId={(path) => path.id}
            animationPreset="stagger-fast"
        >
            {(context: VariantShellContext<LearningPath>) => {
                const { selection, animation } = context;
                const selectedPath = selection.selected ?? sortedPaths[0];

                return (
                    <>
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]" data-testid="variant-b-container">
                            <SidebarList
                                graphNodes={sortedByHierarchy}
                                selectedPath={selectedPath}
                                onSelectPath={(path) => {
                                    selection.setSelected(path);
                                    handleSelectPath(path);
                                }}
                                staggerDelay={animation.staggerDelay}
                                isSelected={comparison.isSelected}
                                togglePath={comparison.togglePath}
                                canAddMore={comparison.canAddMore}
                                shareableUrl={viewQuery.getShareableUrl()}
                                onShareView={handleShareView}
                                isLoadingData={isLoadingPaths}
                                isUsingMockData={isUsingMock}
                            />
                            <div className="lg:col-span-8">
                                <PreviewPanel
                                    selectedPath={selectedPath}
                                    onSelectPath={selection.setSelected}
                                    getPrerequisites={getPrerequisites}
                                    getDependents={getDependents}
                                    onShare={share.openShare}
                                    onStartPath={handleStartPath}
                                    onBookmarkPath={handleBookmarkPath}
                                    isPathStarted={isPathSelected(selectedPath.id as LearningDomainId)}
                                    isPathBookmarked={isNodeBookmarked(selectedPath.id)}
                                    pathProgress={getPathProgress(selectedPath.id as LearningDomainId)}
                                />
                            </div>
                        </div>

                        {/* Comparison Badge (floating) */}
                        <AnimatePresence>
                            {comparison.session.selectedPaths.length > 0 && (
                                <ComparisonBadge
                                    selectedCount={comparison.session.selectedPaths.length}
                                    maxPaths={comparison.session.maxPaths}
                                    canCompare={comparison.canCompare}
                                    onOpenModal={comparison.openModal}
                                    onClear={comparison.clearSelection}
                                />
                            )}
                        </AnimatePresence>

                        {/* Comparison Modal */}
                        <PathComparisonModal
                            isOpen={comparison.session.isOpen}
                            onClose={comparison.closeModal}
                            comparisonData={comparison.comparisonData}
                            onRemovePath={comparison.removePath}
                        />

                        {/* Share Modal */}
                        <ShareModal
                            state={share.modalState}
                            onClose={share.closeShare}
                            onCopy={share.copyShareUrl}
                            onTwitterShare={share.shareToTwitter}
                            onLinkedInShare={share.shareToLinkedIn}
                        />

                        {/* Mutation Toast - feedback for graph mutations */}
                        <MutationToast
                            type={toastState.type}
                            pathId={toastState.pathId}
                            isVisible={toastState.isVisible}
                            onClose={handleCloseToast}
                        />
                    </>
                );
            }}
        </VariantShell>
    );
};
