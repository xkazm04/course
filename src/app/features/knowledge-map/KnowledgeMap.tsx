"use client";

/**
 * KnowledgeMap Component
 *
 * Unified knowledge map with drill-down navigation, card-based nodes,
 * and 5-level hierarchy: Domain -> Course -> Chapter -> Section -> Concept
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Search, X, Loader2, AlertCircle, Database } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { LEARNING_DOMAINS, type LearningDomainId } from "@/app/shared/lib/learningDomains";
import type { KnowledgeMapProps, MapNode } from "./lib/types";
import { generateKnowledgeMapData } from "./lib/mapData";
import { useMapData } from "./lib/useMapData";
import { useMapNavigation } from "./lib/useMapNavigation";
import { useMapViewport } from "./lib/useMapViewport";
import { MapCanvas } from "./components/MapCanvas";
import { MapBreadcrumb } from "./components/MapBreadcrumb";
import { MapControls } from "./components/MapControls";
import { MapLegend } from "./components/MapLegend";
import { NodeDetailsPanel } from "./components/NodeDetailsPanel";

export function KnowledgeMap({
    height = "700px",
    initialDomainId,
    onNodeSelect,
    onStartLearning,
    theme: themeProp,
    hypotheticalNodes = [],
}: KnowledgeMapProps) {
    // Container ref for size measurement
    const containerRef = useRef<HTMLDivElement>(null);


    // Fetch map data from Supabase API with fallback to mock data
    const { data: apiData, isLoading, error, isUsingMock, refetch } = useMapData({
        domainId: initialDomainId,
        debug: process.env.NODE_ENV === 'development',
    });

    // Use API data if available, otherwise fall back to mock data
    const mapData = useMemo(() => {
        if (apiData) return apiData;
        // Generate mock data as fallback while loading or on error
        return generateKnowledgeMapData();
    }, [apiData]);

    // Theme detection
    const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");
    useEffect(() => {
        if (typeof window === "undefined") return;
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        setSystemTheme(mediaQuery.matches ? "dark" : "light");

        const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? "dark" : "light");
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    }, []);

    const theme = themeProp ?? (typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : systemTheme);

    // Initial parent ID (if starting at a specific domain)
    const initialParentId = initialDomainId ? `domain-${initialDomainId}` : null;

    // Navigation state
    const {
        navigation,
        visibleNodes,
        visibleConnections,
        breadcrumbItems,
        drillDown,
        drillUp,
        selectNode,
        resetNavigation,
        selectedNode,
        currentParent,
        currentDepth,
    } = useMapNavigation(mapData, { initialParentId });

    // Viewport state
    const {
        viewport,
        setViewport,
        zoomTo,
        resetViewport,
        handlers: viewportHandlers,
        isPanning,
    } = useMapViewport();

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);

    // Search results
    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();
        const results: MapNode[] = [];
        mapData.nodes.forEach((node) => {
            if (node.name.toLowerCase().includes(query)) {
                results.push(node);
            }
        });
        return results.slice(0, 10);
    }, [mapData, searchQuery]);

    // Handle node selection
    const handleNodeSelect = useCallback(
        (nodeId: string) => {
            selectNode(nodeId);
            const node = mapData.nodes.get(nodeId);
            if (node) {
                onNodeSelect?.(node);
            }
        },
        [selectNode, mapData, onNodeSelect]
    );

    // Handle node drill-down
    const handleNodeDrillDown = useCallback(
        (nodeId: string) => {
            drillDown(nodeId);
            // Reset viewport when drilling
            resetViewport();
        },
        [drillDown, resetViewport]
    );

    // Handle breadcrumb navigation
    const handleBreadcrumbNavigate = useCallback(
        (index: number) => {
            drillUp(index);
            resetViewport();
        },
        [drillUp, resetViewport]
    );

    // Handle details panel close
    const handleDetailsClose = useCallback(() => {
        selectNode(null);
        onNodeSelect?.(null);
    }, [selectNode, onNodeSelect]);

    // Handle start learning from details panel
    const handleStartLearning = useCallback(
        (nodeId: string) => {
            onStartLearning?.(nodeId);
        },
        [onStartLearning]
    );

    // Handle search result click
    const handleSearchResultClick = useCallback(
        (node: MapNode) => {
            // Navigate to the node's parent level and select it
            // Build path to node
            const path: string[] = [];
            let currentNode: MapNode | undefined = node;
            while (currentNode?.parentId) {
                path.unshift(currentNode.parentId);
                currentNode = mapData.nodes.get(currentNode.parentId);
            }

            // Navigate to parent, then select node
            if (node.parentId) {
                // Reset and navigate through path
                resetNavigation();
                path.forEach((parentId) => {
                    drillDown(parentId);
                });
            }
            selectNode(node.id);
            setShowSearch(false);
            setSearchQuery("");
            onNodeSelect?.(node);
        },
        [mapData, drillDown, selectNode, resetNavigation, onNodeSelect]
    );

    // Handle background click
    const handleBackgroundClick = useCallback(() => {
        selectNode(null);
        onNodeSelect?.(null);
    }, [selectNode, onNodeSelect]);

    // Zoom controls
    const handleZoomIn = useCallback(() => {
        zoomTo(viewport.scale + 0.2);
    }, [viewport.scale, zoomTo]);

    const handleZoomOut = useCallback(() => {
        zoomTo(viewport.scale - 0.2);
    }, [viewport.scale, zoomTo]);

    // Calculate progress stats
    const progressStats = useMemo(() => {
        const domains = Array.from(mapData.nodes.values()).filter(n => n.level === "domain");
        const completed = domains.filter(n => n.progress === 100).length;
        const inProgress = domains.filter(n => n.progress > 0 && n.progress < 100).length;
        const avgProgress = domains.reduce((sum, n) => sum + n.progress, 0) / domains.length;
        return { completed, inProgress, avgProgress: Math.round(avgProgress), total: domains.length };
    }, [mapData]);

    return (
        <div
            ref={containerRef}
            className="relative w-full bg-[var(--forge-bg-workshop)] rounded-2xl overflow-hidden border border-[var(--forge-border-subtle)]"
            style={{ height }}
            data-testid="knowledge-map"
        >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3 pointer-events-auto">
                    <div className="w-10 h-10 bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] rounded-xl flex items-center justify-center shadow-lg">
                        <Globe size={ICON_SIZES.md} className="text-[var(--forge-text-primary)]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[var(--forge-text-primary)]">
                            Knowledge Map
                        </h2>
                        <p className="text-xs text-[var(--forge-text-secondary)] flex items-center gap-2">
                            <span>{progressStats.avgProgress}% explored • {progressStats.total} domains</span>
                            {isLoading ? (
                                <span className="flex items-center gap-1 text-[var(--ember)]">
                                    <Loader2 size={12} className="animate-spin" />
                                    Loading...
                                </span>
                            ) : isUsingMock ? (
                                <span className="flex items-center gap-1 text-[var(--forge-warning)]" title="Using mock data - connect to Supabase for live data">
                                    <AlertCircle size={12} />
                                    Mock
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[var(--forge-success)]" title="Connected to Supabase">
                                    <Database size={12} />
                                    Live
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                    {/* Search button */}
                    <button
                        onClick={() => setShowSearch(true)}
                        className="p-2 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-md rounded-lg border border-[var(--forge-border-subtle)] shadow-md hover:bg-[var(--forge-bg-elevated)] transition-colors"
                        data-testid="search-btn"
                    >
                        <Search size={ICON_SIZES.sm} className="text-[var(--forge-text-secondary)]" />
                    </button>
                </div>
            </div>

            {/* Breadcrumb navigation */}
            <div className="absolute top-20 left-4 z-20">
                <MapBreadcrumb
                    items={breadcrumbItems}
                    onNavigate={handleBreadcrumbNavigate}
                />
            </div>

            {/* Search overlay */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-30 bg-black/20 backdrop-blur-sm flex items-start justify-center pt-20"
                        onClick={() => setShowSearch(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="w-full max-w-md mx-4 bg-[var(--forge-bg-elevated)] rounded-2xl shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                            data-testid="search-modal"
                        >
                            <div className="p-4 border-b border-[var(--forge-border-subtle)]">
                                <div className="flex items-center gap-3">
                                    <Search size={ICON_SIZES.md} className="text-[var(--forge-text-muted)]" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search topics, courses, chapters..."
                                        className="flex-1 bg-transparent text-[var(--forge-text-primary)] placeholder-[var(--forge-text-muted)] outline-none"
                                        autoFocus
                                        data-testid="search-input"
                                    />
                                    <button
                                        onClick={() => setShowSearch(false)}
                                        className="p-1 hover:bg-[var(--forge-bg-anvil)] rounded-lg transition-colors"
                                    >
                                        <X size={ICON_SIZES.sm} className="text-[var(--forge-text-muted)]" />
                                    </button>
                                </div>
                            </div>

                            {searchResults.length > 0 && (
                                <div className="max-h-80 overflow-y-auto">
                                    {searchResults.map((node, index) => {
                                        const domain = LEARNING_DOMAINS[node.domainId];
                                        const DomainIcon = domain?.icon || Globe;

                                        return (
                                            <button
                                                key={node.id}
                                                onClick={() => handleSearchResultClick(node)}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-[var(--forge-bg-anvil)] transition-colors text-left"
                                                data-testid={`search-result-${index}`}
                                            >
                                                <div className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center",
                                                    `bg-${node.color}-100 dark:bg-${node.color}-900/30`
                                                )}>
                                                    <DomainIcon size={16} className={`text-${node.color}-600 dark:text-${node.color}-400`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-[var(--forge-text-primary)] truncate">
                                                        {node.name}
                                                    </p>
                                                    <p className="text-xs text-[var(--forge-text-secondary)] capitalize">
                                                        {node.level} • {domain?.name || "Unknown"}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {searchQuery && searchResults.length === 0 && (
                                <div className="p-8 text-center text-[var(--forge-text-secondary)]">
                                    No results found for "{searchQuery}"
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main canvas */}
            <MapCanvas
                nodes={visibleNodes}
                hypotheticalNodes={hypotheticalNodes}
                connections={visibleConnections}
                viewport={viewport}
                selectedNodeId={navigation.selectedNodeId}
                onNodeSelect={handleNodeSelect}
                onNodeDrillDown={handleNodeDrillDown}
                onBackgroundClick={handleBackgroundClick}
                viewportHandlers={viewportHandlers}
                isPanning={isPanning}
                className="pt-16"
            />

            {/* Zoom controls (left side) */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
                <MapControls
                    scale={viewport.scale}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onReset={resetViewport}
                />
            </div>

            {/* Legend (bottom left) */}
            <div className="absolute left-4 bottom-4 z-20">
                <MapLegend />
            </div>

            {/* Details panel (right side) */}
            <div className="absolute right-0 top-0 bottom-0 z-20">
                <AnimatePresence mode="wait">
                    {selectedNode && (
                        <NodeDetailsPanel
                            node={selectedNode}
                            onClose={handleDetailsClose}
                            onDrillDown={handleNodeDrillDown}
                            onStartLearning={handleStartLearning}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Instructions hint (bottom center) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                <div className="px-4 py-2 bg-[var(--forge-bg-elevated)]/90 backdrop-blur-md rounded-full border border-[var(--forge-border-subtle)] shadow-lg">
                    <p className="text-xs text-[var(--forge-text-secondary)]">
                        <span className="hidden sm:inline">
                            Click to select • Double-click to drill down • Drag to pan • Scroll to zoom
                        </span>
                        <span className="sm:hidden">
                            Tap to select • Double-tap to explore • Drag to pan
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default KnowledgeMap;
