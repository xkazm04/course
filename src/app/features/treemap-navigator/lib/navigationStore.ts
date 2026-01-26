"use client";

/**
 * Navigation Store
 *
 * Zustand store for treemap navigation state.
 * Manages the current path (breadcrumbs) and displayed nodes.
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { TreemapNode, BreadcrumbItem, NavigationState } from "./types";

// ============================================================================
// STORE ACTIONS
// ============================================================================

interface NavigationActions {
  /**
   * Navigate into a node (drill down)
   * Adds the node to the path and displays its children
   */
  drillDown: (node: TreemapNode, children: TreemapNode[]) => void;

  /**
   * Navigate back one level
   * Removes the last item from the path
   * Note: Caller must provide new nodes via setCurrentNodes after fetching
   */
  goBack: () => void;

  /**
   * Jump to a specific breadcrumb
   * Truncates the path to the target breadcrumb and sets new nodes
   */
  jumpTo: (breadcrumbIndex: number, nodes: TreemapNode[]) => void;

  /**
   * Reset to root
   * Clears the path and sets root-level nodes
   */
  reset: (rootNodes: TreemapNode[]) => void;

  /**
   * Set loading state
   */
  setLoading: (loading: boolean) => void;

  /**
   * Set error state
   */
  setError: (error: string | null) => void;

  /**
   * Update current nodes (after layout computation or fetch)
   */
  setCurrentNodes: (nodes: TreemapNode[]) => void;
}

// ============================================================================
// STORE TYPE
// ============================================================================

type NavigationStore = NavigationState & NavigationActions;

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: NavigationState = {
  currentPath: [],
  currentNodes: [],
  isLoading: false,
  error: null,
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useNavigationStore = create<NavigationStore>()(
  immer((set) => ({
    ...initialState,

    drillDown: (node, children) => {
      set((state) => {
        state.currentPath.push({
          id: node.id,
          label: node.label,
          depth: node.depth,
        });
        state.currentNodes = children;
        state.error = null;
      });
    },

    goBack: () => {
      set((state) => {
        if (state.currentPath.length > 0) {
          state.currentPath.pop();
          // Note: Caller must provide new nodes via setCurrentNodes after fetching
        }
      });
    },

    jumpTo: (breadcrumbIndex, nodes) => {
      set((state) => {
        // Keep path up to and including the target index
        state.currentPath = state.currentPath.slice(0, breadcrumbIndex + 1);
        state.currentNodes = nodes;
        state.error = null;
      });
    },

    reset: (rootNodes) => {
      set((state) => {
        state.currentPath = [];
        state.currentNodes = rootNodes;
        state.isLoading = false;
        state.error = null;
      });
    },

    setLoading: (loading) => {
      set((state) => {
        state.isLoading = loading;
      });
    },

    setError: (error) => {
      set((state) => {
        state.error = error;
        state.isLoading = false;
      });
    },

    setCurrentNodes: (nodes) => {
      set((state) => {
        state.currentNodes = nodes;
      });
    },
  }))
);
