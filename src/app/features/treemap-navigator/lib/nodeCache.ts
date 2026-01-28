/**
 * Node Cache - LRU cache for treemap node children
 *
 * Improvement #1: Caches fetched children to avoid re-fetching
 * when navigating back to previously visited nodes.
 *
 * Features:
 * - LRU eviction when capacity exceeded
 * - TTL-based expiration
 * - Prefetch support
 */

import type { TreemapNode } from "./types";

interface CacheEntry {
  children: TreemapNode[];
  timestamp: number;
  prefetched: boolean;
}

const CACHE_CAPACITY = 50; // Max number of parent nodes to cache
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class NodeCache {
  private cache: Map<string, CacheEntry> = new Map();
  private accessOrder: string[] = [];

  /**
   * Get cached children for a parent node
   * Returns null if not cached or expired
   */
  get(parentId: string): TreemapNode[] | null {
    const entry = this.cache.get(parentId);

    if (!entry) {
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.cache.delete(parentId);
      this.removeFromAccessOrder(parentId);
      return null;
    }

    // Update access order (move to end = most recently used)
    this.removeFromAccessOrder(parentId);
    this.accessOrder.push(parentId);

    return entry.children;
  }

  /**
   * Cache children for a parent node
   */
  set(parentId: string, children: TreemapNode[], prefetched = false): void {
    // Evict if at capacity
    if (this.cache.size >= CACHE_CAPACITY && !this.cache.has(parentId)) {
      this.evictLRU();
    }

    // Remove from current position if exists
    this.removeFromAccessOrder(parentId);

    // Add to cache
    this.cache.set(parentId, {
      children,
      timestamp: Date.now(),
      prefetched,
    });

    // Add to end of access order (most recently used)
    this.accessOrder.push(parentId);
  }

  /**
   * Check if a node's children are cached (without updating access order)
   */
  has(parentId: string): boolean {
    const entry = this.cache.get(parentId);
    if (!entry) return false;

    // Check TTL
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      this.cache.delete(parentId);
      this.removeFromAccessOrder(parentId);
      return false;
    }

    return true;
  }

  /**
   * Check if children were prefetched (for analytics/debugging)
   */
  wasPrefetched(parentId: string): boolean {
    return this.cache.get(parentId)?.prefetched ?? false;
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; capacity: number } {
    return {
      size: this.cache.size,
      capacity: CACHE_CAPACITY,
    };
  }

  private removeFromAccessOrder(parentId: string): void {
    const index = this.accessOrder.indexOf(parentId);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private evictLRU(): void {
    // Evict least recently used (first in access order)
    const lruId = this.accessOrder.shift();
    if (lruId) {
      this.cache.delete(lruId);
    }
  }
}

// Singleton instance
export const nodeCache = new NodeCache();

// Root nodes special key
export const ROOT_CACHE_KEY = "__ROOT__";
