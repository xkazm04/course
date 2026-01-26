"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigationStore } from "../lib/navigationStore";
import { fetchRootNodes, fetchChildren } from "../lib/dataAdapter";
import { computeLayout } from "../lib/layoutEngine";
import { useFocusOnNavigate } from "../lib/useFocusOnNavigate";
import { getTransitionVariants, getSpringConfig } from "../lib/animationConfig";
import { DEFAULT_LAYOUT_CONFIG } from "../lib/types";
import type { TreemapNode, LayoutConfig } from "../lib/types";
import { Territory } from "./Territory";
import { LoadingOverlay } from "./LoadingOverlay";
import { NavigationHeader } from "./NavigationHeader";
import { EmptyState } from "./EmptyState";
import { DetailPanel } from "./DetailPanel";

export interface TreemapContainerProps {
  className?: string;
  layoutConfig?: LayoutConfig;
}

/**
 * TreemapContainer orchestrates the treemap navigator.
 *
 * Responsibilities:
 * - Fetch and display nodes
 * - Handle drill-down on click
 * - Handle Escape key to go back
 * - Compute layout within bounded container
 * - Manage keyboard focus
 *
 * Requirements covered:
 * - REQ-NAV-01: Click-to-drill-down
 * - REQ-NAV-03: Keyboard Escape to go back
 * - REQ-VIS-04: Loading state
 * - REQ-PERF-01: Render 100+ nodes (via efficient layout)
 * - REQ-PERF-02: On-demand data fetching
 * - REQ-DES-01: Dark/gaming aesthetic (via Territory styling)
 * - REQ-DES-02: Readable labels (via layout minWidth/minHeight)
 * - REQ-DES-03: Bounded space (no drift)
 * - REQ-A11Y-01: Keyboard navigation
 * - REQ-VIS-02: Animated transitions (drill-down/drill-up)
 * - REQ-A11Y-02: Focus management after navigation
 */
export function TreemapContainer({
  className = "",
  layoutConfig = DEFAULT_LAYOUT_CONFIG,
}: TreemapContainerProps) {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Store state and actions
  const currentPath = useNavigationStore((s) => s.currentPath);
  const currentNodes = useNavigationStore((s) => s.currentNodes);
  const isLoading = useNavigationStore((s) => s.isLoading);
  const error = useNavigationStore((s) => s.error);
  const transitionDirection = useNavigationStore((s) => s.transitionDirection);
  const drillDown = useNavigationStore((s) => s.drillDown);
  const goBack = useNavigationStore((s) => s.goBack);
  const jumpTo = useNavigationStore((s) => s.jumpTo);
  const reset = useNavigationStore((s) => s.reset);
  const setLoading = useNavigationStore((s) => s.setLoading);
  const setError = useNavigationStore((s) => s.setError);
  const setCurrentNodes = useNavigationStore((s) => s.setCurrentNodes);
  const clearTransition = useNavigationStore((s) => s.clearTransition);
  const selectedNode = useNavigationStore((s) => s.selectedNode);
  const selectNode = useNavigationStore((s) => s.selectNode);
  const closePanel = useNavigationStore((s) => s.closePanel);

  // Focus management: focus first territory after navigation completes
  const containerRef = useFocusOnNavigate(currentPath.length, isLoading);

  // Unique key for AnimatePresence - changes when path changes
  const contentKey = currentPath.map((p) => p.id).join("/") || "root";

  // Measure container size
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

  // Compute layout when nodes or container size changes
  const layoutNodes = useMemo(() => {
    if (
      currentNodes.length === 0 ||
      containerSize.width === 0 ||
      containerSize.height === 0
    ) {
      return [];
    }

    return computeLayout(
      currentNodes,
      { x: 0, y: 0, width: containerSize.width, height: containerSize.height },
      layoutConfig
    );
  }, [currentNodes, containerSize.width, containerSize.height, layoutConfig]);

  // Load root nodes on mount
  useEffect(() => {
    let cancelled = false;

    async function loadRoot() {
      setLoading(true);
      try {
        const nodes = await fetchRootNodes();
        if (!cancelled) {
          reset(nodes);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      }
    }

    loadRoot();

    return () => {
      cancelled = true;
    };
  }, [reset, setLoading, setError]);

  // Handle drill down into a node
  const handleDrillDown = useCallback(
    async (node: TreemapNode) => {
      // Open detail panel for leaf nodes (lessons)
      if (node.nodeType === "lesson" || node.childCount === 0) {
        selectNode(node);
        return;
      }

      setLoading(true);
      try {
        const children = await fetchChildren(node.id);
        drillDown(node, children);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load children");
      } finally {
        setLoading(false);
      }
    },
    [drillDown, setLoading, setError, selectNode]
  );

  // Handle starting a lesson from detail panel
  const handleStartLesson = useCallback((nodeId: string) => {
    // Navigate to the lesson page
    window.location.href = `/forge/chapter/${nodeId}`;
  }, []);

  // Handle go back (called after fetching parent's children)
  const handleGoBack = useCallback(async () => {
    if (currentPath.length === 0) {
      // Already at root
      return;
    }

    if (currentPath.length === 1) {
      // Going back to root
      setLoading(true);
      try {
        const nodes = await fetchRootNodes();
        reset(nodes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to go back");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Going back to a parent level
    const parentBreadcrumb = currentPath[currentPath.length - 2];
    setLoading(true);
    try {
      const children = await fetchChildren(parentBreadcrumb.id);
      goBack();
      setCurrentNodes(children);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to go back");
    } finally {
      setLoading(false);
    }
  }, [currentPath, goBack, reset, setLoading, setError, setCurrentNodes]);

  // Handle jump to specific breadcrumb (for breadcrumb navigation)
  const handleJumpTo = useCallback(
    async (index: number) => {
      if (index === -1) {
        // Jump to root
        setLoading(true);
        try {
          const nodes = await fetchRootNodes();
          reset(nodes);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to navigate");
        } finally {
          setLoading(false);
        }
        return;
      }

      // Jump to specific breadcrumb
      const targetBreadcrumb = currentPath[index];
      setLoading(true);
      try {
        const children = await fetchChildren(targetBreadcrumb.id);
        jumpTo(index, children);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to navigate");
      } finally {
        setLoading(false);
      }
    },
    [currentPath, jumpTo, reset, setLoading, setError]
  );

  // Handle reset to root (for reset button)
  const handleReset = useCallback(async () => {
    if (currentPath.length === 0) return; // Already at root

    setLoading(true);
    try {
      const nodes = await fetchRootNodes();
      reset(nodes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset");
    } finally {
      setLoading(false);
    }
  }, [currentPath.length, reset, setLoading, setError]);

  // Keyboard navigation (Escape to go back - but not when panel is open)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't handle Escape if panel is open (panel handles its own Escape)
      if (selectedNode) return;

      if (e.key === "Escape") {
        e.preventDefault();
        handleGoBack();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGoBack, selectedNode]);

  // Reset focusedIndex on navigation (path change)
  useEffect(() => {
    setFocusedIndex(null);
  }, [currentPath.length]);

  // Arrow key navigation between territories
  const handleTerritoryKeyDown = useCallback(
    (e: React.KeyboardEvent, node: TreemapNode) => {
      const currentIndex = layoutNodes.findIndex((n) => n.id === node.id);
      let nextIndex: number | null = null;

      switch (e.key) {
        case "ArrowRight":
          nextIndex = Math.min(currentIndex + 1, layoutNodes.length - 1);
          break;
        case "ArrowLeft":
          nextIndex = Math.max(currentIndex - 1, 0);
          break;
        case "ArrowDown":
          // Move to approximately same position in next row
          nextIndex = Math.min(currentIndex + 3, layoutNodes.length - 1);
          break;
        case "ArrowUp":
          nextIndex = Math.max(currentIndex - 3, 0);
          break;
      }

      if (nextIndex !== null && nextIndex !== currentIndex) {
        e.preventDefault();
        setFocusedIndex(nextIndex);
        // Focus the element
        const container = containerRef.current;
        if (container) {
          const territoryElements = container.querySelectorAll('[role="button"]');
          const targetEl = territoryElements[nextIndex] as HTMLElement | undefined;
          targetEl?.focus();
        }
      }
    },
    [layoutNodes]
  );

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-[#0a0a0f] overflow-hidden ${className}`}
      style={{ minHeight: "400px" }}
    >
      {/* Animated Territories Container */}
      <AnimatePresence mode="wait" onExitComplete={clearTransition}>
        <motion.div
          key={contentKey}
          className="absolute inset-0"
          variants={getTransitionVariants(transitionDirection)}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={getSpringConfig(transitionDirection)}
          style={{
            willChange: transitionDirection ? "transform, opacity" : "auto",
          }}
        >
          {layoutNodes.map((node, index) => (
            <Territory
              key={node.id}
              node={node}
              onClick={handleDrillDown}
              onKeyDown={handleTerritoryKeyDown}
              isFocused={focusedIndex === index}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Loading overlay */}
      <LoadingOverlay isVisible={isLoading} />

      {/* Error display */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
          <div className="bg-red-900/80 text-white px-6 py-4 rounded-lg max-w-md text-center">
            <p className="font-medium mb-2">Error</p>
            <p className="text-sm text-white/80">{error}</p>
            <button
              onClick={() => {
                setError(null);
                reset([]);
                // Trigger reload
                window.location.reload();
              }}
              className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && layoutNodes.length === 0 && (
        <EmptyState onGoBack={handleGoBack} />
      )}

      {/* Navigation header */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <NavigationHeader
          currentPath={currentPath}
          currentDepth={currentPath.length}
          onGoBack={handleGoBack}
          onNavigate={handleJumpTo}
          onReset={handleReset}
          isTransitioning={isLoading}
        />
      </div>

      {/* Detail panel for leaf nodes */}
      <DetailPanel
        node={selectedNode}
        onClose={closePanel}
        onStart={handleStartLesson}
      />
    </div>
  );
}
