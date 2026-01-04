"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

// Import from knowledge-map for data and unified scene graph
import { generateKnowledgeMapData } from "@/app/features/knowledge-map/lib/mapData";
import { useSceneGraph } from "@/app/features/knowledge-map/lib/useSceneGraph";
import { NodeDetailsPanel } from "@/app/features/knowledge-map/components/NodeDetailsPanel";

// Local imports
import type { MatrixVariant, MatrixMapContainerProps } from "./lib/types";
import { VIEWPORT } from "./lib/constants";
import { MatrixTabSwitcher } from "./components/common/MatrixTabSwitcher";
import { MatrixControls } from "./components/common/MatrixControls";
import { NestedBoxesCanvas } from "./components/nested/NestedBoxesCanvas";
import { HexGridCanvas } from "./components/hex/HexGridCanvas";
import { MetroCanvas } from "./components/metro/MetroCanvas";

export function MatrixMapContainer({
    variant: initialVariant = "nested",
    height = "calc(100vh - 180px)",
    initialDomainId,
    onNodeSelect,
}: MatrixMapContainerProps) {
    // Active variant for tab switching
    const [activeVariant, setActiveVariant] = useState<MatrixVariant>(initialVariant);

    // Container ref for measuring
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    // Generate map data
    const mapData = useMemo(() => generateKnowledgeMapData(), []);

    // Unified Scene Graph (combines navigation + viewport with animated transitions)
    const {
        scene,
        navigation,
        viewport,
        visibleNodes,
        breadcrumbItems,
        drillDown,
        drillUp,
        selectNode,
        selectedNode,
        zoomTo,
    } = useSceneGraph(mapData, {
        initialParentId: initialDomainId ? `domain-${initialDomainId}` : null,
    });

    // Measure container
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setContainerSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Zoom handlers using SceneGraph's unified viewport
    const handleZoomIn = useCallback(() => {
        const newScale = Math.min(scene.scale * 1.2, VIEWPORT.MAX_SCALE);
        zoomTo(newScale);
    }, [scene.scale, zoomTo]);

    const handleZoomOut = useCallback(() => {
        const newScale = Math.max(scene.scale / 1.2, VIEWPORT.MIN_SCALE);
        zoomTo(newScale);
    }, [scene.scale, zoomTo]);

    const handleResetViewport = useCallback(() => {
        zoomTo(1);
    }, [zoomTo]);

    // Wheel zoom handler
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = -e.deltaY * VIEWPORT.ZOOM_SPEED;
        const newScale = Math.max(
            VIEWPORT.MIN_SCALE,
            Math.min(VIEWPORT.MAX_SCALE, scene.scale + delta)
        );
        zoomTo(newScale);
    }, [scene.scale, zoomTo]);

    // Node selection handler
    const handleNodeSelect = useCallback(
        (nodeId: string) => {
            selectNode(nodeId);
            const node = mapData.nodes.get(nodeId) || null;
            onNodeSelect?.(node);
        },
        [selectNode, mapData, onNodeSelect]
    );

    // Node drill-down handler
    // SceneGraph handles viewport reset with animated transition automatically
    const handleNodeDrillDown = useCallback(
        (nodeId: string) => {
            drillDown(nodeId);
        },
        [drillDown]
    );

    // Background click handler
    const handleBackgroundClick = useCallback(() => {
        selectNode(null);
        onNodeSelect?.(null);
    }, [selectNode, onNodeSelect]);

    // Breadcrumb click handler
    // SceneGraph handles viewport reset with animated transition automatically
    const handleBreadcrumbClick = useCallback(
        (index: number) => {
            if (index === 0) {
                drillUp(-1); // Go to root
            } else {
                drillUp(index - 1);
            }
        },
        [drillUp]
    );

    // Render the appropriate canvas based on variant
    const renderCanvas = () => {
        const commonProps = {
            nodes: visibleNodes,
            viewport,
            selectedNodeId: navigation.selectedNodeId,
            onNodeSelect: handleNodeSelect,
            onNodeDrillDown: handleNodeDrillDown,
            onBackgroundClick: handleBackgroundClick,
            containerWidth: containerSize.width,
            containerHeight: containerSize.height,
        };

        switch (activeVariant) {
            case "nested":
                return <NestedBoxesCanvas {...commonProps} />;
            case "hex":
                return <HexGridCanvas {...commonProps} />;
            case "metro":
                return <MetroCanvas {...commonProps} />;
            default:
                return <NestedBoxesCanvas {...commonProps} />;
        }
    };

    return (
        <div className="relative flex flex-col" style={{ height }} data-testid="matrix-map-container">
            {/* Header with breadcrumb and tab switcher */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/50 backdrop-blur-sm">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1 text-sm overflow-x-auto" data-testid="matrix-map-breadcrumb">
                    {breadcrumbItems.map((item, index) => (
                        <React.Fragment key={item.nodeId ?? "root"}>
                            {index > 0 && (
                                <ChevronRight size={14} className="text-[var(--forge-text-muted)] flex-shrink-0" />
                            )}
                            <button
                                onClick={() => handleBreadcrumbClick(index)}
                                className={cn(
                                    "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors flex-shrink-0",
                                    index === breadcrumbItems.length - 1
                                        ? "text-[var(--forge-text-primary)] font-medium bg-[var(--forge-bg-anvil)]"
                                        : "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-anvil)]/50"
                                )}
                                data-testid={`matrix-breadcrumb-item-${index}`}
                            >
                                {index === 0 && <Home size={14} />}
                                <span className="max-w-[150px] truncate">{item.label}</span>
                            </button>
                        </React.Fragment>
                    ))}
                </nav>

                {/* Tab switcher */}
                <MatrixTabSwitcher
                    activeVariant={activeVariant}
                    onVariantChange={setActiveVariant}
                />
            </div>

            {/* Main content area */}
            <div className="flex-1 flex relative overflow-hidden">
                {/* Canvas container */}
                <div
                    ref={containerRef}
                    className="flex-1 relative overflow-hidden bg-[var(--forge-bg-workshop)]"
                    onWheel={handleWheel}
                    data-testid="matrix-map-canvas-container"
                >
                    {containerSize.width > 0 && containerSize.height > 0 && (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeVariant}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0"
                            >
                                {renderCanvas()}
                            </motion.div>
                        </AnimatePresence>
                    )}

                    {/* Zoom controls */}
                    <MatrixControls
                        scale={viewport.scale}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onReset={handleResetViewport}
                        minScale={VIEWPORT.MIN_SCALE}
                        maxScale={VIEWPORT.MAX_SCALE}
                        className="absolute bottom-4 left-4 z-20"
                    />
                </div>

                {/* Details panel */}
                <AnimatePresence>
                    {selectedNode && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 320, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-l border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/80 backdrop-blur-sm overflow-hidden"
                        >
                            <NodeDetailsPanel
                                node={selectedNode}
                                onClose={() => handleNodeSelect("")}
                                onDrillDown={handleNodeDrillDown}
                                onStartLearning={(nodeId) => console.log("Start learning:", nodeId)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
