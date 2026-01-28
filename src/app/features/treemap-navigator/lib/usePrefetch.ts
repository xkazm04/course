/**
 * Prefetch Hook
 *
 * Improvement #2: Preloads children data when hovering over nodes.
 * Uses a debounced approach to avoid excessive fetching.
 */

import { useCallback, useRef } from "react";
import { nodeCache } from "./nodeCache";
import { fetchChildren } from "./dataAdapter";
import type { TreemapNode } from "./types";

const PREFETCH_DELAY_MS = 150; // Delay before prefetching (debounce)
const MAX_CONCURRENT_PREFETCHES = 2; // Limit concurrent prefetch requests

// Track active prefetch requests
let activePrefetches = 0;

export function usePrefetch() {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPrefetchedRef = useRef<string | null>(null);

  /**
   * Prefetch children for a node (called on hover)
   */
  const prefetchNode = useCallback((node: TreemapNode) => {
    // Don't prefetch leaf nodes (lessons)
    if (node.nodeType === "lesson" || node.childCount === 0) {
      return;
    }

    // Don't prefetch if already cached
    if (nodeCache.has(node.id)) {
      return;
    }

    // Don't prefetch the same node twice
    if (lastPrefetchedRef.current === node.id) {
      return;
    }

    // Clear any pending prefetch
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the prefetch
    timeoutRef.current = setTimeout(async () => {
      // Check capacity again after delay
      if (activePrefetches >= MAX_CONCURRENT_PREFETCHES) {
        return;
      }

      // Check cache again after delay (might have been fetched by drill-down)
      if (nodeCache.has(node.id)) {
        return;
      }

      try {
        activePrefetches++;
        lastPrefetchedRef.current = node.id;

        const children = await fetchChildren(node.id);

        // Store in cache with prefetched flag
        nodeCache.set(node.id, children, true);
      } catch {
        // Silently fail - prefetch is best-effort
        // The actual drill-down will retry if needed
      } finally {
        activePrefetches--;
      }
    }, PREFETCH_DELAY_MS);
  }, []);

  /**
   * Cancel any pending prefetch (called on hover leave)
   */
  const cancelPrefetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    prefetchNode,
    cancelPrefetch,
  };
}
