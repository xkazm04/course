"use client";

/**
 * Universe Explorer Page
 *
 * Interactive visualization of the learning curriculum using the
 * Clustered Knowledge Universe component with LOD (Level-of-Detail) rendering.
 *
 * Uses real data from the map_nodes table in Supabase.
 */

import React, { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronLeft,
    Info,
    Layers,
    Database,
    Sparkles,
    Clock,
    Target,
    BookOpen,
    X,
    ZoomIn,
    RotateCcw,
    Orbit,
    GitBranch,
} from "lucide-react";
import Link from "next/link";
import { ClusteredKnowledgeUniverse, HierarchicalMap } from "@/app/features/knowledge-universe/components";
import { useUniverseDataProvider, createMockUniverseData } from "@/app/features/knowledge-universe/lib/universeDataProvider";
import type { UniverseNode, ClusterNode } from "@/app/features/knowledge-universe/lib/types";
import { cn } from "@/app/shared/lib/utils";

// ============================================================================
// NODE DETAIL PANEL
// ============================================================================

interface NodeDetailPanelProps {
    node: UniverseNode | ClusterNode | null;
    onClose: () => void;
    onNavigate?: (node: UniverseNode) => void;
}

function NodeDetailPanel({ node, onClose, onNavigate }: NodeDetailPanelProps) {
    if (!node) return null;

    const isCluster = node.type === "cluster";
    const cluster = isCluster ? (node as ClusterNode) : null;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-4 top-20 w-80 bg-[var(--forge-bg-card)]/95 backdrop-blur-md rounded-xl border border-[var(--forge-border-subtle)] shadow-xl overflow-hidden"
        >
            {/* Header */}
            <div
                className="p-4 border-b border-[var(--forge-border-subtle)]"
                style={{
                    background: `linear-gradient(135deg, ${node.color}20, transparent)`
                }}
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            {isCluster ? (
                                <Layers size={16} className="text-[var(--forge-text-muted)]" />
                            ) : (
                                <Sparkles size={16} style={{ color: node.color }} />
                            )}
                            <span className="text-xs text-[var(--forge-text-muted)] uppercase tracking-wide">
                                {isCluster
                                    ? cluster?.clusterLevel.replace("-", " ")
                                    : node.type
                                }
                            </span>
                        </div>
                        <h3 className="text-lg font-semibold text-[var(--forge-text-primary)]">
                            {node.name}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-[var(--forge-bg-elevated)] rounded-lg transition-colors"
                    >
                        <X size={18} className="text-[var(--forge-text-muted)]" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {/* Cluster Metrics */}
                {isCluster && cluster && (
                    <div className="grid grid-cols-2 gap-3">
                        <MetricCard
                            icon={BookOpen}
                            label="Nodes"
                            value={cluster.metrics.nodeCount.toString()}
                            color={node.color}
                        />
                        <MetricCard
                            icon={Clock}
                            label="Hours"
                            value={`${cluster.metrics.totalHours}h`}
                            color={node.color}
                        />
                        <MetricCard
                            icon={Target}
                            label="Progress"
                            value={`${Math.round(cluster.metrics.completionPercent)}%`}
                            color="#22c55e"
                        />
                        <MetricCard
                            icon={Sparkles}
                            label="Completed"
                            value={cluster.metrics.completedCount.toString()}
                            color="#22c55e"
                        />
                    </div>
                )}

                {/* Node-specific info */}
                {!isCluster && (
                    <>
                        {/* Description placeholder */}
                        <p className="text-sm text-[var(--forge-text-secondary)]">
                            {node.type === "planet" && "A learning domain containing multiple topics and skills."}
                            {node.type === "moon" && "A topic within this domain with several lessons."}
                            {node.type === "star" && "An individual lesson or skill to master."}
                        </p>

                        {/* Visible at zoom levels */}
                        <div className="flex flex-wrap gap-2">
                            {node.visibleAtZoom.map((level) => (
                                <span
                                    key={level}
                                    className="px-2 py-1 text-xs rounded-full bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]"
                                >
                                    {level}
                                </span>
                            ))}
                        </div>
                    </>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                    {isCluster ? (
                        <button className="flex-1 py-2 px-4 bg-[var(--ember)] text-white rounded-lg text-sm font-medium hover:bg-[var(--ember-glow)] transition-colors">
                            Zoom to Explore
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => onNavigate?.(node)}
                                className="flex-1 py-2 px-4 bg-[var(--ember)] text-white rounded-lg text-sm font-medium hover:bg-[var(--ember-glow)] transition-colors"
                            >
                                Start Learning
                            </button>
                            <button className="py-2 px-4 bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] rounded-lg text-sm font-medium hover:bg-[var(--forge-bg-card)] transition-colors">
                                Details
                            </button>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

interface MetricCardProps {
    icon: typeof BookOpen;
    label: string;
    value: string;
    color: string;
}

function MetricCard({ icon: Icon, label, value, color }: MetricCardProps) {
    return (
        <div className="p-3 bg-[var(--forge-bg-elevated)] rounded-lg">
            <div className="flex items-center gap-2 mb-1">
                <Icon size={14} style={{ color }} />
                <span className="text-xs text-[var(--forge-text-muted)]">{label}</span>
            </div>
            <div className="text-lg font-semibold text-[var(--forge-text-primary)]">
                {value}
            </div>
        </div>
    );
}

// ============================================================================
// DATA SOURCE INDICATOR
// ============================================================================

interface DataSourceIndicatorProps {
    source: "mock" | "supabase" | null;
    nodeCount: number;
    isLoading: boolean;
}

function DataSourceIndicator({ source, nodeCount, isLoading }: DataSourceIndicatorProps) {
    return (
        <div className="absolute bottom-4 left-4 flex items-center gap-3 px-4 py-2 bg-[var(--forge-bg-card)]/90 backdrop-blur-sm rounded-lg border border-[var(--forge-border-subtle)]">
            <Database
                size={16}
                className={cn(
                    isLoading ? "animate-pulse" : "",
                    source === "supabase" ? "text-emerald-400" : "text-amber-400"
                )}
            />
            <div className="flex flex-col">
                <span className="text-xs text-[var(--forge-text-muted)]">
                    {isLoading ? "Loading..." : source === "supabase" ? "Live Data" : "Mock Data"}
                </span>
                <span className="text-sm text-[var(--forge-text-secondary)]">
                    {nodeCount} nodes
                </span>
            </div>
        </div>
    );
}

// ============================================================================
// CONTROLS PANEL
// ============================================================================

interface ControlsPanelProps {
    showStats: boolean;
    onToggleStats: () => void;
    showClustering: boolean;
    onToggleClustering: () => void;
}

function ControlsPanel({
    showStats,
    onToggleStats,
    showClustering,
    onToggleClustering
}: ControlsPanelProps) {
    return (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <button
                onClick={onToggleStats}
                className={cn(
                    "p-3 rounded-lg border transition-colors",
                    showStats
                        ? "bg-[var(--ember)]/20 border-[var(--ember)] text-[var(--ember)]"
                        : "bg-[var(--forge-bg-card)]/90 border-[var(--forge-border-subtle)] text-[var(--forge-text-muted)]"
                )}
                title={showStats ? "Hide Stats" : "Show Stats"}
            >
                <Info size={18} />
            </button>
            <button
                onClick={onToggleClustering}
                className={cn(
                    "p-3 rounded-lg border transition-colors",
                    showClustering
                        ? "bg-[var(--ember)]/20 border-[var(--ember)] text-[var(--ember)]"
                        : "bg-[var(--forge-bg-card)]/90 border-[var(--forge-border-subtle)] text-[var(--forge-text-muted)]"
                )}
                title={showClustering ? "Disable Clustering (LOD)" : "Enable Clustering (LOD)"}
            >
                <Layers size={18} />
            </button>
        </div>
    );
}

// ============================================================================
// HELP PANEL
// ============================================================================

function HelpPanel({ onClose }: { onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 w-96 bg-[var(--forge-bg-card)]/95 backdrop-blur-md rounded-xl border border-[var(--forge-border-subtle)] shadow-xl p-6"
        >
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-[var(--forge-text-primary)]">
                    Universe Navigation
                </h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-[var(--forge-bg-elevated)] rounded-lg"
                >
                    <X size={18} className="text-[var(--forge-text-muted)]" />
                </button>
            </div>

            <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-[var(--forge-bg-elevated)] rounded-lg">
                        <ZoomIn size={16} className="text-[var(--ember)]" />
                    </div>
                    <div>
                        <div className="font-medium text-[var(--forge-text-primary)]">Scroll to Zoom</div>
                        <div className="text-[var(--forge-text-muted)]">
                            Zoom through cluster levels to reveal more detail
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="p-2 bg-[var(--forge-bg-elevated)] rounded-lg">
                        <RotateCcw size={16} className="text-[var(--ember)]" />
                    </div>
                    <div>
                        <div className="font-medium text-[var(--forge-text-primary)]">Drag to Pan</div>
                        <div className="text-[var(--forge-text-muted)]">
                            Click and drag to explore different areas
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="p-2 bg-[var(--forge-bg-elevated)] rounded-lg">
                        <Target size={16} className="text-[var(--ember)]" />
                    </div>
                    <div>
                        <div className="font-medium text-[var(--forge-text-primary)]">Click Clusters</div>
                        <div className="text-[var(--forge-text-muted)]">
                            Click on a cluster to zoom in and explore its contents
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="p-2 bg-[var(--forge-bg-elevated)] rounded-lg">
                        <Layers size={16} className="text-[var(--ember)]" />
                    </div>
                    <div>
                        <div className="font-medium text-[var(--forge-text-primary)]">LOD Levels</div>
                        <div className="text-[var(--forge-text-muted)]">
                            Galaxy → Domain → Topic → Full Detail
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

type ViewMode = "orbital" | "hierarchical";

export default function UniversePage() {
    const [viewMode, setViewMode] = useState<ViewMode>("orbital");
    const [selectedNode, setSelectedNode] = useState<UniverseNode | ClusterNode | null>(null);
    const [showStats, setShowStats] = useState(false);
    const [showClustering, setShowClustering] = useState(true);
    const [showHelp, setShowHelp] = useState(false);
    const [dataInfo, setDataInfo] = useState<{ source: "mock" | "supabase" | null; nodeCount: number }>({
        source: null,
        nodeCount: 0,
    });

    // Load data for D3 view
    const {
        data: universeData,
        isLoading: isLoadingData,
        activeSource,
    } = useUniverseDataProvider({
        source: "supabase",
        layoutStrategy: "orbital",
        worldScale: 1000,
    });

    // Get full universe data for D3 canvas (need hierarchy, not just flat nodes)
    const d3UniverseData = useMemo(() => {
        if (universeData) return universeData;
        return createMockUniverseData({ worldScale: 1000 }, "orbital");
    }, [universeData]);

    const handleNodeSelect = useCallback((node: UniverseNode) => {
        setSelectedNode(node);
    }, []);

    const handleClusterClick = useCallback((cluster: ClusterNode) => {
        setSelectedNode(cluster);
    }, []);

    const handleNavigateToContent = useCallback((node: UniverseNode) => {
        // In a real app, this would navigate to the lesson/course page
        console.log("Navigate to:", node);
    }, []);

    const handleCloseDetail = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const handleDataLoaded = useCallback((info: { source: string | null; nodeCount: number }) => {
        setDataInfo({
            source: info.source as "mock" | "supabase" | null,
            nodeCount: info.nodeCount,
        });
    }, []);

    // Update data info for hierarchical view
    React.useEffect(() => {
        if (viewMode === "hierarchical" && !isLoadingData && d3UniverseData) {
            setDataInfo({
                source: activeSource as "mock" | "supabase" | null,
                nodeCount: d3UniverseData.allNodes.length,
            });
        }
    }, [viewMode, isLoadingData, activeSource, d3UniverseData]);

    return (
        <div className="h-screen w-screen bg-[var(--forge-bg-void)] overflow-hidden">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-20 px-4 py-3 bg-gradient-to-b from-[var(--forge-bg-void)] via-[var(--forge-bg-void)]/80 to-transparent">
                <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/forge/map"
                            className="flex items-center gap-2 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] transition-colors"
                        >
                            <ChevronLeft size={20} />
                            <span className="text-sm">Back to Map</span>
                        </Link>
                        <div className="h-6 w-px bg-[var(--forge-border-subtle)]" />
                        <div className="flex items-center gap-2">
                            <Sparkles size={20} className="text-[var(--ember)]" />
                            <h1 className="text-lg font-semibold text-[var(--forge-text-primary)]">
                                Knowledge Universe
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-[var(--forge-bg-card)]/80 backdrop-blur-sm rounded-lg border border-[var(--forge-border-subtle)] p-1">
                            <button
                                onClick={() => setViewMode("orbital")}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                                    viewMode === "orbital"
                                        ? "bg-[var(--ember)] text-white"
                                        : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]"
                                )}
                                title="Orbital View"
                            >
                                <Orbit size={16} />
                                <span className="hidden sm:inline">Orbital</span>
                            </button>
                            <button
                                onClick={() => setViewMode("hierarchical")}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                                    viewMode === "hierarchical"
                                        ? "bg-[var(--ember)] text-white"
                                        : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)]"
                                )}
                                title="Hierarchical Map View"
                            >
                                <GitBranch size={16} />
                                <span className="hidden sm:inline">Hierarchical</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
                                showHelp
                                    ? "bg-[var(--ember)]/20 text-[var(--ember)]"
                                    : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-elevated)]"
                            )}
                        >
                            <Info size={16} />
                            <span>Help</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Universe Visualization */}
            {viewMode === "orbital" ? (
                <ClusteredKnowledgeUniverse
                    className="w-full h-full"
                    dataSource="supabase"
                    initialZoomLevel="galaxy"
                    showControls={true}
                    showStats={showStats}
                    showLODIndicator={true}
                    showBreadcrumbs={true}
                    enableClustering={showClustering}
                    onNodeSelect={handleNodeSelect}
                    onClusterClick={handleClusterClick}
                    onNavigateToContent={handleNavigateToContent}
                    onDataLoaded={handleDataLoaded}
                />
            ) : (
                <HierarchicalMap
                    className="w-full h-full"
                    onStartLesson={(lessonId) => {
                        console.log("Start lesson:", lessonId);
                        // Navigate to lesson page
                    }}
                />
            )}

            {/* Help Panel */}
            <AnimatePresence>
                {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
            </AnimatePresence>

            {/* Node Detail Panel */}
            <AnimatePresence>
                {selectedNode && (
                    <NodeDetailPanel
                        node={selectedNode}
                        onClose={handleCloseDetail}
                        onNavigate={handleNavigateToContent}
                    />
                )}
            </AnimatePresence>

            {/* Data Source Indicator */}
            <DataSourceIndicator
                source={dataInfo.source}
                nodeCount={dataInfo.nodeCount}
                isLoading={dataInfo.source === null}
            />

            {/* Toggle Controls */}
            <ControlsPanel
                showStats={showStats}
                onToggleStats={() => setShowStats(!showStats)}
                showClustering={showClustering}
                onToggleClustering={() => setShowClustering(!showClustering)}
            />
        </div>
    );
}
