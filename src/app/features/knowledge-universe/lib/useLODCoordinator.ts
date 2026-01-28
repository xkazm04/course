/**
 * LOD Coordinator Hook
 *
 * Combines WorldCoordinator with the hierarchical clustering system
 * to provide LOD-aware node queries and transition animations.
 *
 * Enhanced with semantic zoom integration for:
 * - 4-tier zoom level management (galaxy/solar/constellation/star)
 * - Smooth animated transitions between levels
 * - Contextual label computation
 * - Connection visibility management
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWorldCoordinator, type UseWorldCoordinatorReturn, type UseWorldCoordinatorOptions } from "./useWorldCoordinator";
import type { UniverseNode, LODConfig, ClusterNode, ZoomLevel } from "./types";
import { DEFAULT_LOD_CONFIG } from "./types";
import type { UniverseData } from "./universeData";
import {
    generateClusteredData,
    getNodesForScale,
    getLODLevel,
    getLODTransitionState,
    getClusterExpansionPositions,
    interpolateExpansionPosition,
    type ClusteredUniverseData,
    type LODTransitionState,
    type LODLevelName,
} from "./clusteringStrategy";
import {
    ZoomLevelManager,
    createZoomLevelManager,
    type SemanticLevel,
    type ZoomLevelTransition,
    type DetailCategory,
    SEMANTIC_LEVELS,
} from "./zoomLevelManager";
import {
    LevelTransitioner,
    createLevelTransitioner,
    type ActiveTransition,
    easings,
} from "./levelTransitioner";
import {
    ContextualLabelRenderer,
    createContextualLabelRenderer,
    type ComputedLabel,
} from "./contextualLabels";

// ============================================================================
// TYPES
// ============================================================================

export interface LODCoordinatorState {
    /** Current LOD level (5-level hierarchy) */
    lodLevel: LODLevelName;
    /** Nodes to render at current LOD */
    visibleNodes: UniverseNode[];
    /** Active transition state (if any) */
    transition: LODTransitionState | null;
    /** Expanding cluster (for animation) */
    expandingCluster: ClusterNode | null;
    /** Expansion progress (0-1) */
    expansionProgress: number;
    /** Node opacity overrides for transitions (stable ref, mutated in place) */
    nodeOpacities: Map<string, number>;
    /** Current semantic level */
    semanticLevel: SemanticLevel;
    /** Semantic zoom transition (if any) */
    semanticTransition: ZoomLevelTransition | null;
    /** Computed labels for visible nodes */
    labels: ComputedLabel[];
}

export interface LODCoordinatorOptions {
    /** World coordinator options */
    worldConfig?: UseWorldCoordinatorOptions;
    /** LOD configuration */
    lodConfig?: Partial<LODConfig>;
    /** Callback when LOD level changes */
    onLODChange?: (level: LODLevelName) => void;
    /** Callback when cluster is clicked (to expand/navigate) */
    onClusterClick?: (cluster: ClusterNode) => void;
    /** Callback when semantic level changes */
    onSemanticLevelChange?: (level: SemanticLevel, previousLevel: SemanticLevel | null) => void;
    /** Whether to compute labels */
    enableLabels?: boolean;
    /** Label visibility configuration */
    labelConfig?: {
        maxLabels?: number;
        minRadiusForLabel?: number;
        fadeRange?: number;
    };
}

export interface LODCoordinatorResult {
    /** World coordinator hook return (with all methods) */
    world: UseWorldCoordinatorReturn;
    /** Current LOD state */
    state: LODCoordinatorState;
    /** Clustered data */
    clusteredData: ClusteredUniverseData | null;
    /** Set universe data */
    setUniverseData: (data: UniverseData) => void;
    /** Force refresh of visible nodes */
    refresh: () => void;
    /** Zoom to focus on a cluster (expand it) */
    focusCluster: (clusterId: string) => void;
    /** Zoom out to collapse back to clusters */
    collapseToCluster: (level: "galaxy-cluster" | "domain-cluster" | "topic-cluster" | "skill-cluster") => void;
    /** Semantic zoom utilities */
    semantic: {
        /** Current semantic level */
        currentLevel: SemanticLevel;
        /** Active transition */
        transition: ZoomLevelTransition | null;
        /** Navigate to a specific semantic level */
        navigateToLevel: (levelId: SemanticLevel["id"]) => void;
        /** Check if a detail category is visible */
        isDetailVisible: (category: DetailCategory) => boolean;
        /** Get detail opacity for transitions */
        getDetailOpacity: (category: DetailCategory) => number;
    };
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useLODCoordinator(
    options: LODCoordinatorOptions = {}
): LODCoordinatorResult {
    const {
        worldConfig,
        lodConfig: lodConfigOverrides,
        onLODChange,
        onClusterClick,
        onSemanticLevelChange,
        enableLabels = true,
        labelConfig,
    } = options;

    // Merge LOD config with defaults
    const lodConfig = useMemo<LODConfig>(() => ({
        ...DEFAULT_LOD_CONFIG,
        ...lodConfigOverrides,
        thresholds: {
            ...DEFAULT_LOD_CONFIG.thresholds,
            ...lodConfigOverrides?.thresholds,
        },
    }), [lodConfigOverrides]);

    // Use world coordinator hook
    const world = useWorldCoordinator({
        ...worldConfig,
        config: {
            ...worldConfig?.config,
            // Extend min scale to show clusters at very low zoom
            minScale: Math.min(worldConfig?.config?.minScale ?? 0.1, lodConfig.thresholds.galaxyCluster * 0.5),
        },
    });

    // Semantic zoom manager (persists across renders)
    const zoomManagerRef = useRef<ZoomLevelManager | null>(null);
    const transitionerRef = useRef<LevelTransitioner | null>(null);
    const labelRendererRef = useRef<ContextualLabelRenderer | null>(null);

    // Initialize managers
    if (!zoomManagerRef.current) {
        zoomManagerRef.current = createZoomLevelManager(
            worldConfig?.initialScale ?? 0.5,
            lodConfig
        );
    }
    if (!transitionerRef.current) {
        transitionerRef.current = createLevelTransitioner({
            duration: lodConfig.transitionDuration,
            easing: easings.easeOutCubic,
        });
    }
    if (!labelRendererRef.current) {
        labelRendererRef.current = createContextualLabelRenderer(undefined, {
            maxLabels: labelConfig?.maxLabels ?? 32,
            minRadiusForLabel: labelConfig?.minRadiusForLabel ?? 15,
            fadeRange: labelConfig?.fadeRange ?? 5,
            prioritizeByProgress: true,
        });
    }

    // State
    const [universeData, setUniverseDataInternal] = useState<UniverseData | null>(null);
    const [clusteredData, setClusteredData] = useState<ClusteredUniverseData | null>(null);

    // CRITICAL: nodeOpacities as a stable ref - mutated in place to avoid creating new Map every frame
    const nodeOpacitiesRef = useRef(new Map<string, number>());

    const [state, setState] = useState<LODCoordinatorState>({
        lodLevel: "full-detail",
        visibleNodes: [],
        transition: null,
        expandingCluster: null,
        expansionProgress: 0,
        nodeOpacities: nodeOpacitiesRef.current, // Same ref instance
        semanticLevel: SEMANTIC_LEVELS[1], // Default to solar
        semanticTransition: null,
        labels: [],
    });

    // Track previous scale for transition detection
    const previousScaleRef = useRef<number>(world.scale);
    // Track previous LOD level to avoid state dependency in callback
    const previousLODLevelRef = useRef<LODLevelName>("full-detail");

    // Animation refs
    const transitionAnimationRef = useRef<number | null>(null);
    const expansionAnimationRef = useRef<number | null>(null);

    // Throttling ref to prevent state updates on every frame
    const lastStateUpdateRef = useRef<number>(0);
    const STATE_UPDATE_THROTTLE_MS = 16; // ~60fps max state updates

    // Generate clustered data when universe data changes
    // (Deriving state from props - valid pattern)
    useEffect(() => {
        if (!universeData) {
            setClusteredData(null);
            return;
        }

        const clustered = generateClusteredData(universeData, { lodConfig });
        setClusteredData(clustered);

        // Build spatial index with all nodes (including all cluster levels)
        const allNodes = [
            ...clustered.galaxyClusters,
            ...clustered.domainClusters,
            ...clustered.topicClusters,
            ...clustered.skillClusters,
            ...universeData.allNodes,
        ];
        coordinatorRef.current.buildIndex(allNodes);
    }, [universeData, lodConfig]);

    // Track previous visible node IDs to avoid unnecessary updates
    const previousVisibleNodeIdsRef = useRef<string>("");

    // Store coordinator in ref for stable access in callbacks
    const coordinatorRef = useRef(world.coordinator);
    const onLODChangeRef = useRef(onLODChange);
    const onSemanticLevelChangeRef = useRef(onSemanticLevelChange);

    // Keep refs in sync using layout effect (synchronous, before paint)
    // This is a valid pattern for stable callback refs - disabling strict lint rule
    useLayoutEffect(() => {
        /* eslint-disable react-hooks/immutability */
        coordinatorRef.current = world.coordinator;
        onLODChangeRef.current = onLODChange;
        onSemanticLevelChangeRef.current = onSemanticLevelChange;
        /* eslint-enable react-hooks/immutability */
    });

    // Update visible nodes when scale changes
    // CRITICAL: This is called on every zoom frame - must be optimized for performance
    const updateVisibleNodes = useCallback(() => {
        if (!clusteredData) return;

        const coordinator = coordinatorRef.current;
        const currentScale = coordinator.scale;
        const previousScale = previousScaleRef.current;
        const currentLevel = getLODLevel(currentScale, lodConfig);
        const zoomManager = zoomManagerRef.current;
        const labelRenderer = labelRendererRef.current;

        // Update semantic zoom manager (lightweight, always runs)
        if (zoomManager) {
            const previousSemanticLevel = zoomManager.currentLevel;
            zoomManager.updateScale(currentScale);

            // Notify semantic level change
            if (zoomManager.currentLevel.id !== previousSemanticLevel.id) {
                onSemanticLevelChangeRef.current?.(zoomManager.currentLevel, previousSemanticLevel);
            }
        }

        // CRITICAL: Only update React state when LOD LEVEL changes
        // This prevents blinking caused by state updates every frame
        const levelChanged = currentLevel !== previousLODLevelRef.current;

        // Update opacities IN PLACE (mutate existing Map, no new reference)
        const opacityMap = nodeOpacitiesRef.current;
        opacityMap.clear(); // Reuse same Map instance

        const transition = getLODTransitionState(
            previousScale,
            currentScale,
            clusteredData,
            lodConfig
        );

        if (transition) {
            const { fadingOutNodes, fadingInNodes, progress } = transition;
            for (const nodeId of fadingOutNodes) {
                opacityMap.set(nodeId, 1 - progress);
            }
            for (const nodeId of fadingInNodes) {
                opacityMap.set(nodeId, progress);
            }
        }

        // Update refs (always, for canvas to read)
        previousScaleRef.current = currentScale;

        // Only trigger React state update when LOD level changes
        if (levelChanged) {
            const now = Date.now();

            // Additional throttling to prevent rapid state updates
            if (now - lastStateUpdateRef.current < STATE_UPDATE_THROTTLE_MS) {
                previousLODLevelRef.current = currentLevel;
                return;
            }
            lastStateUpdateRef.current = now;

            // Get nodes for current scale (returns cached array if level unchanged)
            const nodes = getNodesForScale(clusteredData, currentScale, lodConfig);

            // Compute labels if enabled
            let labels: ComputedLabel[] = [];
            if (enableLabels && labelRenderer && zoomManager) {
                const visibleBounds = coordinator.getVisibleBounds();
                labels = labelRenderer.computeLabels(
                    nodes,
                    coordinator.zoomLevel,
                    currentScale,
                    visibleBounds,
                    (x, y) => coordinator.worldToScreen(x, y),
                    (r) => coordinator.worldRadiusToScreen(r)
                );
            }

            setState(prev => ({
                ...prev,
                lodLevel: currentLevel,
                visibleNodes: nodes, // Cached array from getNodesForScale
                transition,
                nodeOpacities: opacityMap, // Same Map reference
                semanticLevel: zoomManager?.currentLevel ?? prev.semanticLevel,
                semanticTransition: zoomManager?.transition ?? null,
                labels,
            }));

            previousVisibleNodeIdsRef.current = nodes.map(n => n.id).sort().join(",");
            previousLODLevelRef.current = currentLevel;

            // Notify LOD change
            if (onLODChangeRef.current) {
                onLODChangeRef.current(currentLevel);
            }
        }
    }, [clusteredData, lodConfig, enableLabels]);

    // Subscribe to world coordinator changes
    useEffect(() => {
        const coordinator = coordinatorRef.current;
        const unsubscribe = coordinator.subscribe(updateVisibleNodes);
        updateVisibleNodes(); // Initial update
        return unsubscribe;
    }, [updateVisibleNodes]);

    // Focus on a cluster (zoom in to expand it)
    const focusCluster = useCallback((clusterId: string) => {
        if (!clusteredData) return;

        // Find the cluster (search all cluster levels)
        const cluster = [
            ...clusteredData.galaxyClusters,
            ...clusteredData.domainClusters,
            ...clusteredData.topicClusters,
            ...clusteredData.skillClusters,
        ].find(c => c.id === clusterId);

        if (!cluster) return;

        // Start expansion animation
        setState(prev => ({
            ...prev,
            expandingCluster: cluster,
            expansionProgress: 0,
        }));

        // Get target positions for children
        const targetPositions = getClusterExpansionPositions(cluster, clusteredData);

        // Determine target scale based on cluster level (5-level hierarchy)
        let targetScale: number;
        switch (cluster.clusterLevel) {
            case "galaxy-cluster":
                targetScale = lodConfig.thresholds.domainCluster + 0.02;
                break;
            case "domain-cluster":
                targetScale = lodConfig.thresholds.topicCluster + 0.05;
                break;
            case "topic-cluster":
                targetScale = lodConfig.thresholds.skillCluster + 0.05;
                break;
            case "skill-cluster":
                targetScale = lodConfig.thresholds.fullDetail + 0.1;
                break;
            default:
                targetScale = 1.0;
        }

        // Animate expansion
        const startTime = Date.now();
        const duration = lodConfig.transitionDuration;

        const animateExpansion = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);

            setState(prev => ({
                ...prev,
                expansionProgress: eased,
            }));

            if (progress < 1) {
                expansionAnimationRef.current = requestAnimationFrame(animateExpansion);
            } else {
                // Animation complete
                setState(prev => ({
                    ...prev,
                    expandingCluster: null,
                    expansionProgress: 0,
                }));
            }
        };

        // Cancel any existing animation
        if (expansionAnimationRef.current) {
            cancelAnimationFrame(expansionAnimationRef.current);
        }

        // Start zoom animation and expansion
        world.focusOn(cluster.x, cluster.y, targetScale);
        expansionAnimationRef.current = requestAnimationFrame(animateExpansion);

        // Notify click handler
        if (onClusterClick) {
            onClusterClick(cluster);
        }
    }, [clusteredData, lodConfig, world, onClusterClick]);

    // Collapse to a specific cluster level
    const collapseToCluster = useCallback((level: "galaxy-cluster" | "domain-cluster" | "topic-cluster" | "skill-cluster") => {
        let targetScale: number;

        switch (level) {
            case "galaxy-cluster":
                targetScale = lodConfig.thresholds.galaxyCluster * 0.8;
                break;
            case "domain-cluster":
                targetScale = (lodConfig.thresholds.galaxyCluster + lodConfig.thresholds.domainCluster) / 2;
                break;
            case "topic-cluster":
                targetScale = (lodConfig.thresholds.domainCluster + lodConfig.thresholds.topicCluster) / 2;
                break;
            case "skill-cluster":
                targetScale = (lodConfig.thresholds.topicCluster + lodConfig.thresholds.skillCluster) / 2;
                break;
        }

        world.zoomTo(targetScale);
    }, [lodConfig, world]);

    // Public data setter
    const setUniverseData = useCallback((data: UniverseData) => {
        setUniverseDataInternal(data);
    }, []);

    // Refresh function
    const refresh = useCallback(() => {
        updateVisibleNodes();
    }, [updateVisibleNodes]);

    // Navigate to a specific semantic level
    const navigateToSemanticLevel = useCallback((levelId: SemanticLevel["id"]) => {
        const zoomManager = zoomManagerRef.current;
        const transitioner = transitionerRef.current;

        if (!zoomManager || !transitioner) return;

        const targetScale = zoomManager.getTargetScaleForLevel(levelId);
        const currentScale = world.coordinator.scale;

        // Start smooth transition
        transitioner.startZoomTransition(
            currentScale,
            targetScale,
            world.coordinator.camera.x,
            world.coordinator.camera.y,
            { duration: 400, easing: easings.easeOutCubic }
        );

        // Animate the world coordinator
        world.zoomTo(targetScale);
    }, [world]);

    // Check if a detail category is visible
    const isDetailVisible = useCallback((category: DetailCategory) => {
        const zoomManager = zoomManagerRef.current;
        if (!zoomManager) return false;
        return zoomManager.isDetailVisible(category);
    }, []);

    // Get detail opacity for transitions
    const getDetailOpacity = useCallback((category: DetailCategory) => {
        const zoomManager = zoomManagerRef.current;
        if (!zoomManager) return 1;
        return zoomManager.getDetailOpacity(category);
    }, []);

    // Cleanup
    useEffect(() => {
        return () => {
            if (transitionAnimationRef.current) {
                cancelAnimationFrame(transitionAnimationRef.current);
            }
            if (expansionAnimationRef.current) {
                cancelAnimationFrame(expansionAnimationRef.current);
            }
            // Dispose managers
            transitionerRef.current?.dispose();
        };
    }, []);

    // Build semantic utilities object
    const semantic = useMemo(() => ({
        currentLevel: state.semanticLevel,
        transition: state.semanticTransition,
        navigateToLevel: navigateToSemanticLevel,
        isDetailVisible,
        getDetailOpacity,
    }), [state.semanticLevel, state.semanticTransition, navigateToSemanticLevel, isDetailVisible, getDetailOpacity]);

    return {
        world,
        state,
        clusteredData,
        setUniverseData,
        refresh,
        focusCluster,
        collapseToCluster,
        semantic,
    };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the effective opacity for a node during transitions
 */
export function getNodeOpacity(
    nodeId: string,
    state: LODCoordinatorState,
    baseOpacity: number = 1
): number {
    const override = state.nodeOpacities.get(nodeId);
    if (override !== undefined) {
        return baseOpacity * override;
    }
    return baseOpacity;
}

/**
 * Check if a node is a cluster that should show expansion affordance
 */
export function shouldShowExpansionAffordance(
    node: UniverseNode,
    state: LODCoordinatorState
): boolean {
    if (node.type !== "cluster") return false;
    const cluster = node as ClusterNode;

    // Don't show if we're already at the most detailed level for this cluster
    switch (cluster.clusterLevel) {
        case "galaxy-cluster":
            return state.lodLevel === "galaxy-cluster";
        case "domain-cluster":
            return state.lodLevel === "galaxy-cluster" || state.lodLevel === "domain-cluster";
        case "topic-cluster":
            return state.lodLevel === "topic-cluster" || state.lodLevel === "domain-cluster";
        case "skill-cluster":
            return state.lodLevel === "skill-cluster" || state.lodLevel === "topic-cluster";
    }

    return false;
}

/**
 * Find the cluster at a given world position for the current LOD level
 * Used for cursor-following zoom behavior
 */
export function findClusterAtPosition(
    worldX: number,
    worldY: number,
    clusteredData: ClusteredUniverseData | null,
    lodLevel: LODLevelName
): ClusterNode | null {
    if (!clusteredData) return null;

    // Get clusters for current LOD level
    let clusters: ClusterNode[];
    switch (lodLevel) {
        case "galaxy-cluster":
            clusters = clusteredData.galaxyClusters;
            break;
        case "domain-cluster":
            clusters = clusteredData.domainClusters;
            break;
        case "topic-cluster":
            clusters = clusteredData.topicClusters;
            break;
        case "skill-cluster":
            clusters = clusteredData.skillClusters;
            break;
        default:
            return null; // No clusters at full-detail level
    }

    // Find cluster containing the position (with some tolerance)
    for (const cluster of clusters) {
        const dx = worldX - cluster.x;
        const dy = worldY - cluster.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Hit test with cluster radius plus some margin
        const hitRadius = cluster.radius * 1.5;
        if (distance <= hitRadius) {
            return cluster;
        }
    }

    // If no direct hit, find nearest cluster
    let nearest: ClusterNode | null = null;
    let nearestDistance = Infinity;

    for (const cluster of clusters) {
        const dx = worldX - cluster.x;
        const dy = worldY - cluster.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = cluster;
        }
    }

    // Only return if within reasonable range (3x the cluster radius)
    if (nearest && nearestDistance <= nearest.radius * 3) {
        return nearest;
    }

    return null;
}
