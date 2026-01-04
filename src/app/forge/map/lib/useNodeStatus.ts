"use client";

/**
 * useNodeStatus Hook
 * Polls for generation status of visible map nodes
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { contentApi } from "./contentApi";
import type { NodeStatus, NodeGenerationStatus } from "./contentApi";

export interface NodeStatusMap {
    [nodeId: string]: NodeStatus;
}

const POLL_INTERVAL = 5000; // 5 seconds
const CACHE_TTL = 10000; // 10 seconds

// UUID regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a string is a valid UUID
 * Only UUIDs should be queried from the database
 */
function isValidUUID(id: string): boolean {
    return UUID_REGEX.test(id);
}

interface CachedStatus {
    status: NodeStatus;
    timestamp: number;
}

export function useNodeStatus(visibleNodeIds: string[]) {
    const [nodeStatuses, setNodeStatuses] = useState<NodeStatusMap>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);
    const cacheRef = useRef<Map<string, CachedStatus>>(new Map());
    const lastFetchedIdsRef = useRef<string>("");

    // Filter to only valid UUIDs (mock nodes have string IDs, not UUIDs)
    const validNodeIds = useMemo(() => {
        return visibleNodeIds.filter(isValidUUID);
    }, [visibleNodeIds]);

    // Filter to only nodes that might need status checks
    // (nodes with generating/pending status or nodes we haven't cached)
    const nodeIdsToFetch = useMemo(() => {
        const now = Date.now();
        return validNodeIds.filter((id) => {
            const cached = cacheRef.current.get(id);

            // Always fetch if not cached
            if (!cached) return true;

            // Skip "ready" nodes that were recently cached
            if (
                cached.status.status === "ready" &&
                now - cached.timestamp < CACHE_TTL
            ) {
                return false;
            }

            // Always fetch nodes that are generating or pending
            if (
                cached.status.status === "generating" ||
                cached.status.status === "pending"
            ) {
                return true;
            }

            // Fetch if cache is stale
            return now - cached.timestamp > CACHE_TTL;
        });
    }, [validNodeIds]);

    // Fetch node statuses
    const fetchStatuses = useCallback(async (nodeIds: string[]) => {
        if (!isMountedRef.current || nodeIds.length === 0) return;

        // Avoid duplicate fetches for same node set
        const idsKey = nodeIds.sort().join(",");
        if (idsKey === lastFetchedIdsRef.current) return;
        lastFetchedIdsRef.current = idsKey;

        try {
            setIsLoading(true);
            const response = await contentApi.getNodesStatus(nodeIds);

            if (!isMountedRef.current) return;

            const now = Date.now();

            // Update cache and state only if we got results
            if (response.nodes && Object.keys(response.nodes).length > 0) {
                setNodeStatuses((prev) => {
                    const updated = { ...prev };
                    for (const [nodeId, status] of Object.entries(response.nodes)) {
                        updated[nodeId] = status;
                        cacheRef.current.set(nodeId, { status, timestamp: now });
                    }
                    return updated;
                });
            }

            setError(null);
        } catch (err) {
            // Log but don't block - status fetching should be non-critical
            console.warn("Error fetching node statuses (non-blocking):", err);
            // Clear error after a moment to allow retries
            setError(null);
        } finally {
            setIsLoading(false);
            lastFetchedIdsRef.current = "";
        }
    }, []);

    // Initial fetch and setup polling
    useEffect(() => {
        isMountedRef.current = true;

        // Fetch immediately for nodes that need it
        if (nodeIdsToFetch.length > 0) {
            fetchStatuses(nodeIdsToFetch);
        }

        // Setup polling only if we have nodes that are generating
        const hasGeneratingNodes = validNodeIds.some((id) => {
            const cached = cacheRef.current.get(id);
            return (
                cached?.status.status === "generating" ||
                cached?.status.status === "pending"
            );
        });

        if (hasGeneratingNodes) {
            pollIntervalRef.current = setInterval(() => {
                // Re-filter nodes that need fetching (only valid UUIDs)
                const toFetch = validNodeIds.filter((id) => {
                    const cached = cacheRef.current.get(id);
                    return (
                        !cached ||
                        cached.status.status === "generating" ||
                        cached.status.status === "pending"
                    );
                });

                if (toFetch.length > 0) {
                    fetchStatuses(toFetch);
                }
            }, POLL_INTERVAL);
        }

        return () => {
            isMountedRef.current = false;
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [validNodeIds, nodeIdsToFetch, fetchStatuses]);

    // Get status for a specific node
    const getNodeStatus = useCallback(
        (nodeId: string): NodeStatus | undefined => {
            return nodeStatuses[nodeId] || cacheRef.current.get(nodeId)?.status;
        },
        [nodeStatuses]
    );

    // Check if any nodes are generating
    const hasGeneratingNodes = useMemo(() => {
        return Object.values(nodeStatuses).some(
            (s) => s.status === "generating" || s.status === "pending"
        );
    }, [nodeStatuses]);

    // Manually refresh all statuses (only for valid UUIDs)
    const refresh = useCallback(() => {
        cacheRef.current.clear();
        if (validNodeIds.length > 0) {
            fetchStatuses(validNodeIds);
        }
    }, [validNodeIds, fetchStatuses]);

    // Get nodes by status
    const getNodesByStatus = useCallback(
        (status: NodeGenerationStatus): string[] => {
            return Object.entries(nodeStatuses)
                .filter(([, s]) => s.status === status)
                .map(([id]) => id);
        },
        [nodeStatuses]
    );

    return {
        nodeStatuses,
        isLoading,
        error,
        getNodeStatus,
        hasGeneratingNodes,
        refresh,
        getNodesByStatus,
        generatingNodes: getNodesByStatus("generating"),
        pendingNodes: getNodesByStatus("pending"),
        failedNodes: getNodesByStatus("failed"),
    };
}
