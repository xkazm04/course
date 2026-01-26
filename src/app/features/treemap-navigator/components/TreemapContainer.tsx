"use client";

import { useEffect, useMemo, useRef, useCallback, useState } from "react";
import { useNavigationStore } from "../lib/navigationStore";
import { fetchRootNodes, fetchChildren } from "../lib/dataAdapter";
import { computeLayout } from "../lib/layoutEngine";
import { DEFAULT_LAYOUT_CONFIG } from "../lib/types";
import type { TreemapNode, LayoutConfig } from "../lib/types";
import { Territory } from "./Territory";
import { LoadingOverlay } from "./LoadingOverlay";

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
 */
export function TreemapContainer({
  className = "",
  layoutConfig = DEFAULT_LAYOUT_CONFIG,
}: TreemapContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Store state and actions
  const currentPath = useNavigationStore((s) => s.currentPath);
  const currentNodes = useNavigationStore((s) => s.currentNodes);
  const isLoading = useNavigationStore((s) => s.isLoading);
  const error = useNavigationStore((s) => s.error);
  const drillDown = useNavigationStore((s) => s.drillDown);
  const goBack = useNavigationStore((s) => s.goBack);
  const reset = useNavigationStore((s) => s.reset);
  const setLoading = useNavigationStore((s) => s.setLoading);
  const setError = useNavigationStore((s) => s.setError);
  const setCurrentNodes = useNavigationStore((s) => s.setCurrentNodes);

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
      // Don't drill into leaf nodes (lessons)
      if (node.nodeType === "lesson" || node.childCount === 0) {
        // TODO: In Phase 3, open detail panel for leaf nodes
        console.log("Leaf node clicked:", node.label);
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
    [drillDown, setLoading, setError]
  );

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

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleGoBack();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleGoBack]);

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
      {/* Territories */}
      {layoutNodes.map((node, index) => (
        <Territory
          key={node.id}
          node={node}
          onClick={handleDrillDown}
          onKeyDown={handleTerritoryKeyDown}
          isFocused={focusedIndex === index}
        />
      ))}

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
        <div className="absolute inset-0 flex items-center justify-center text-white/50">
          <p>No content available</p>
        </div>
      )}

      {/* Current path indicator (temporary, breadcrumbs come in Phase 2) */}
      {currentPath.length > 0 && (
        <div className="absolute top-4 left-4 flex items-center gap-2 text-white/70 text-sm z-20">
          <button
            onClick={handleGoBack}
            className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs"
          >
            Back
          </button>
          <span>{currentPath.map((item) => item.label).join(" > ")}</span>
        </div>
      )}
    </div>
  );
}
