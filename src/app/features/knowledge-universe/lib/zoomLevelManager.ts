/**
 * Zoom Level Manager
 *
 * Manages semantic zoom levels with 4-tier hierarchy:
 * - Galaxy: Bird's eye view of all domains (scale < 0.15)
 * - Solar System: Module-level view (scale 0.15 - 0.4)
 * - Constellation: Topic-level view (scale 0.4 - 0.8)
 * - Star: Lesson-level view (scale > 0.8)
 *
 * Each level has specific detail visibility and rendering rules.
 */

import type { ZoomLevel, LODConfig } from "./types";
import { DEFAULT_LOD_CONFIG } from "./types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Semantic zoom level with associated metadata
 */
export interface SemanticLevel {
    id: "galaxy" | "solar" | "constellation" | "star";
    name: string;
    description: string;
    scaleRange: { min: number; max: number };
    /** Detail categories visible at this level */
    visibleDetails: DetailCategory[];
    /** Label visibility configuration */
    labelConfig: LabelVisibility;
    /** Cluster behavior at this level */
    clusterBehavior: ClusterBehavior;
}

/**
 * Categories of detail that can be shown/hidden per zoom level
 */
export type DetailCategory =
    | "domain-names"
    | "topic-names"
    | "skill-names"
    | "progress-bars"
    | "completion-indicators"
    | "estimated-time"
    | "difficulty-badges"
    | "prerequisite-connections"
    | "sibling-connections"
    | "cluster-metrics"
    | "node-descriptions";

/**
 * Label visibility configuration per zoom level
 */
export interface LabelVisibility {
    /** Minimum node screen radius to show label */
    minRadiusForLabel: number;
    /** Maximum number of labels to show */
    maxLabels: number;
    /** Label fade distance from min radius */
    fadeRange: number;
    /** Whether to prioritize labels by progress */
    prioritizeByProgress: boolean;
}

/**
 * Cluster behavior at different zoom levels
 */
export interface ClusterBehavior {
    /** Whether to show clusters at this level */
    showClusters: boolean;
    /** Minimum nodes to form a cluster */
    minClusterSize: number;
    /** Whether to show expansion affordance */
    showExpansionAffordance: boolean;
    /** Cluster opacity multiplier */
    clusterOpacity: number;
}

/**
 * Zoom level transition event
 */
export interface ZoomLevelTransition {
    from: SemanticLevel;
    to: SemanticLevel;
    direction: "zoom-in" | "zoom-out";
    progress: number;
    /** Scale at transition threshold */
    thresholdScale: number;
}

/**
 * Zoom level manager state
 */
export interface ZoomLevelManagerState {
    currentLevel: SemanticLevel;
    previousLevel: SemanticLevel | null;
    scale: number;
    transition: ZoomLevelTransition | null;
    /** Time spent at current level (for analytics) */
    levelDuration: number;
}

// ============================================================================
// SEMANTIC LEVEL DEFINITIONS
// ============================================================================

/**
 * Define the 4-tier semantic zoom hierarchy
 */
export const SEMANTIC_LEVELS: SemanticLevel[] = [
    {
        id: "galaxy",
        name: "Galaxy View",
        description: "All learning domains",
        scaleRange: { min: 0, max: 0.15 },
        visibleDetails: [
            "domain-names",
            "cluster-metrics",
        ],
        labelConfig: {
            minRadiusForLabel: 30,
            maxLabels: 8,
            fadeRange: 10,
            prioritizeByProgress: false,
        },
        clusterBehavior: {
            showClusters: true,
            minClusterSize: 3,
            showExpansionAffordance: true,
            clusterOpacity: 1.0,
        },
    },
    {
        id: "solar",
        name: "Solar System",
        description: "Modules & paths",
        scaleRange: { min: 0.15, max: 0.4 },
        visibleDetails: [
            "domain-names",
            "topic-names",
            "progress-bars",
            "cluster-metrics",
            "prerequisite-connections",
        ],
        labelConfig: {
            minRadiusForLabel: 20,
            maxLabels: 16,
            fadeRange: 8,
            prioritizeByProgress: true,
        },
        clusterBehavior: {
            showClusters: true,
            minClusterSize: 5,
            showExpansionAffordance: true,
            clusterOpacity: 0.9,
        },
    },
    {
        id: "constellation",
        name: "Constellation",
        description: "Chapters & topics",
        scaleRange: { min: 0.4, max: 0.8 },
        visibleDetails: [
            "domain-names",
            "topic-names",
            "skill-names",
            "progress-bars",
            "completion-indicators",
            "difficulty-badges",
            "prerequisite-connections",
            "sibling-connections",
        ],
        labelConfig: {
            minRadiusForLabel: 12,
            maxLabels: 32,
            fadeRange: 5,
            prioritizeByProgress: true,
        },
        clusterBehavior: {
            showClusters: false,
            minClusterSize: 8,
            showExpansionAffordance: false,
            clusterOpacity: 0.5,
        },
    },
    {
        id: "star",
        name: "Star System",
        description: "Lessons & content",
        scaleRange: { min: 0.8, max: Infinity },
        visibleDetails: [
            "domain-names",
            "topic-names",
            "skill-names",
            "progress-bars",
            "completion-indicators",
            "estimated-time",
            "difficulty-badges",
            "prerequisite-connections",
            "sibling-connections",
            "node-descriptions",
        ],
        labelConfig: {
            minRadiusForLabel: 8,
            maxLabels: 64,
            fadeRange: 3,
            prioritizeByProgress: true,
        },
        clusterBehavior: {
            showClusters: false,
            minClusterSize: 10,
            showExpansionAffordance: false,
            clusterOpacity: 0.3,
        },
    },
];

// ============================================================================
// ZOOM LEVEL MANAGER CLASS
// ============================================================================

type ZoomLevelChangeListener = (
    newLevel: SemanticLevel,
    oldLevel: SemanticLevel | null,
    transition: ZoomLevelTransition | null
) => void;

/**
 * ZoomLevelManager - Tracks and manages semantic zoom levels
 */
export class ZoomLevelManager {
    private state: ZoomLevelManagerState;
    private listeners: Set<ZoomLevelChangeListener> = new Set();
    private levelStartTime: number = Date.now();
    private lodConfig: LODConfig;

    constructor(
        initialScale: number = 0.5,
        lodConfig: LODConfig = DEFAULT_LOD_CONFIG
    ) {
        this.lodConfig = lodConfig;
        const initialLevel = this.getLevelForScale(initialScale);

        this.state = {
            currentLevel: initialLevel,
            previousLevel: null,
            scale: initialScale,
            transition: null,
            levelDuration: 0,
        };
    }

    // ========================================================================
    // GETTERS
    // ========================================================================

    get currentLevel(): SemanticLevel {
        return this.state.currentLevel;
    }

    get previousLevel(): SemanticLevel | null {
        return this.state.previousLevel;
    }

    get scale(): number {
        return this.state.scale;
    }

    get transition(): ZoomLevelTransition | null {
        return this.state.transition;
    }

    get isTransitioning(): boolean {
        return this.state.transition !== null;
    }

    // ========================================================================
    // SCALE UPDATES
    // ========================================================================

    /**
     * Update the current scale and detect level transitions
     */
    updateScale(newScale: number): void {
        const oldScale = this.state.scale;
        const oldLevel = this.state.currentLevel;
        const newLevel = this.getLevelForScale(newScale);

        this.state.scale = newScale;

        // Detect level change
        if (newLevel.id !== oldLevel.id) {
            this.handleLevelChange(oldLevel, newLevel, oldScale, newScale);
        } else {
            // Update transition progress if in transition zone
            this.updateTransitionProgress(newScale, oldLevel);
        }
    }

    /**
     * Handle a level change event
     */
    private handleLevelChange(
        oldLevel: SemanticLevel,
        newLevel: SemanticLevel,
        oldScale: number,
        newScale: number
    ): void {
        const direction = newScale > oldScale ? "zoom-in" : "zoom-out";
        const thresholdScale = direction === "zoom-in"
            ? newLevel.scaleRange.min
            : oldLevel.scaleRange.min;

        // Calculate transition progress
        const transitionWidth = this.getTransitionWidth(oldLevel, newLevel);
        const progress = Math.min(1, Math.max(0,
            Math.abs(newScale - thresholdScale) / transitionWidth
        ));

        const transition: ZoomLevelTransition = {
            from: oldLevel,
            to: newLevel,
            direction,
            progress,
            thresholdScale,
        };

        // Update state
        this.state.previousLevel = oldLevel;
        this.state.currentLevel = newLevel;
        this.state.transition = transition;
        this.state.levelDuration = Date.now() - this.levelStartTime;
        this.levelStartTime = Date.now();

        // Notify listeners
        this.notifyListeners(newLevel, oldLevel, transition);
    }

    /**
     * Update transition progress for smooth blending
     */
    private updateTransitionProgress(scale: number, level: SemanticLevel): void {
        if (!this.state.transition) return;

        const { thresholdScale } = this.state.transition;
        const transitionWidth = this.getTransitionWidth(
            this.state.transition.from,
            this.state.transition.to
        );

        const progress = Math.min(1, Math.max(0,
            Math.abs(scale - thresholdScale) / transitionWidth
        ));

        this.state.transition = {
            ...this.state.transition,
            progress,
        };

        // Clear transition when complete
        if (progress >= 1) {
            this.state.transition = null;
        }
    }

    // ========================================================================
    // LEVEL QUERIES
    // ========================================================================

    /**
     * Get the semantic level for a given scale
     */
    getLevelForScale(scale: number): SemanticLevel {
        for (const level of SEMANTIC_LEVELS) {
            if (scale >= level.scaleRange.min && scale < level.scaleRange.max) {
                return level;
            }
        }
        // Fallback to star level for very high zoom
        return SEMANTIC_LEVELS[SEMANTIC_LEVELS.length - 1];
    }

    /**
     * Get the scale threshold between two levels
     */
    getThresholdBetween(levelA: SemanticLevel, levelB: SemanticLevel): number {
        // The threshold is the max of the lower level's range
        const lowerLevel = levelA.scaleRange.min < levelB.scaleRange.min ? levelA : levelB;
        return lowerLevel.scaleRange.max;
    }

    /**
     * Get the width of the transition zone between levels
     */
    private getTransitionWidth(levelA: SemanticLevel, levelB: SemanticLevel): number {
        // Use 15% of the level's scale range as transition zone
        const avgRange = (
            (levelA.scaleRange.max - levelA.scaleRange.min) +
            (levelB.scaleRange.max - levelB.scaleRange.min)
        ) / 2;
        return avgRange * 0.15;
    }

    /**
     * Check if a detail category is visible at the current level
     */
    isDetailVisible(category: DetailCategory): boolean {
        return this.state.currentLevel.visibleDetails.includes(category);
    }

    /**
     * Get the visibility opacity for a detail category during transitions
     */
    getDetailOpacity(category: DetailCategory): number {
        const isVisibleAtCurrent = this.state.currentLevel.visibleDetails.includes(category);

        if (!this.state.transition) {
            return isVisibleAtCurrent ? 1 : 0;
        }

        const isVisibleAtPrevious = this.state.previousLevel?.visibleDetails.includes(category) ?? false;
        const { progress, direction } = this.state.transition;

        if (isVisibleAtCurrent && isVisibleAtPrevious) {
            return 1; // Always visible
        }

        if (!isVisibleAtCurrent && !isVisibleAtPrevious) {
            return 0; // Never visible
        }

        // Fade in/out during transition
        if (isVisibleAtCurrent && !isVisibleAtPrevious) {
            return progress; // Fading in
        }

        return 1 - progress; // Fading out
    }

    /**
     * Get label configuration for current level with transition interpolation
     */
    getLabelConfig(): LabelVisibility {
        if (!this.state.transition || !this.state.previousLevel) {
            return this.state.currentLevel.labelConfig;
        }

        const { progress } = this.state.transition;
        const from = this.state.previousLevel.labelConfig;
        const to = this.state.currentLevel.labelConfig;

        // Interpolate numeric values
        return {
            minRadiusForLabel: from.minRadiusForLabel + (to.minRadiusForLabel - from.minRadiusForLabel) * progress,
            maxLabels: Math.round(from.maxLabels + (to.maxLabels - from.maxLabels) * progress),
            fadeRange: from.fadeRange + (to.fadeRange - from.fadeRange) * progress,
            prioritizeByProgress: to.prioritizeByProgress,
        };
    }

    /**
     * Get cluster behavior for current level
     */
    getClusterBehavior(): ClusterBehavior {
        if (!this.state.transition || !this.state.previousLevel) {
            return this.state.currentLevel.clusterBehavior;
        }

        const { progress } = this.state.transition;
        const from = this.state.previousLevel.clusterBehavior;
        const to = this.state.currentLevel.clusterBehavior;

        // Interpolate cluster opacity
        return {
            showClusters: progress < 0.5 ? from.showClusters : to.showClusters,
            minClusterSize: to.minClusterSize,
            showExpansionAffordance: progress < 0.5 ? from.showExpansionAffordance : to.showExpansionAffordance,
            clusterOpacity: from.clusterOpacity + (to.clusterOpacity - from.clusterOpacity) * progress,
        };
    }

    // ========================================================================
    // NAVIGATION
    // ========================================================================

    /**
     * Get the target scale to zoom to a specific level
     */
    getTargetScaleForLevel(levelId: SemanticLevel["id"]): number {
        const level = SEMANTIC_LEVELS.find(l => l.id === levelId);
        if (!level) return this.state.scale;

        // Target the middle of the level's scale range
        const { min, max } = level.scaleRange;
        // For the star level (max = Infinity), use a reasonable target
        const effectiveMax = max === Infinity ? min * 2 : max;
        return (min + effectiveMax) / 2;
    }

    /**
     * Get the next level when zooming in
     */
    getNextZoomInLevel(): SemanticLevel | null {
        const currentIndex = SEMANTIC_LEVELS.findIndex(l => l.id === this.state.currentLevel.id);
        if (currentIndex < SEMANTIC_LEVELS.length - 1) {
            return SEMANTIC_LEVELS[currentIndex + 1];
        }
        return null;
    }

    /**
     * Get the next level when zooming out
     */
    getNextZoomOutLevel(): SemanticLevel | null {
        const currentIndex = SEMANTIC_LEVELS.findIndex(l => l.id === this.state.currentLevel.id);
        if (currentIndex > 0) {
            return SEMANTIC_LEVELS[currentIndex - 1];
        }
        return null;
    }

    // ========================================================================
    // LISTENERS
    // ========================================================================

    /**
     * Subscribe to zoom level changes
     */
    subscribe(listener: ZoomLevelChangeListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(
        newLevel: SemanticLevel,
        oldLevel: SemanticLevel | null,
        transition: ZoomLevelTransition | null
    ): void {
        this.listeners.forEach(listener => listener(newLevel, oldLevel, transition));
    }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a new ZoomLevelManager instance
 */
export function createZoomLevelManager(
    initialScale?: number,
    lodConfig?: LODConfig
): ZoomLevelManager {
    return new ZoomLevelManager(initialScale, lodConfig);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get semantic level by ID
 */
export function getSemanticLevel(levelId: SemanticLevel["id"]): SemanticLevel | undefined {
    return SEMANTIC_LEVELS.find(l => l.id === levelId);
}

/**
 * Map ZoomLevel to SemanticLevel ID
 */
export function zoomLevelToSemanticId(zoomLevel: ZoomLevel): SemanticLevel["id"] {
    return zoomLevel;
}

/**
 * Map SemanticLevel ID to ZoomLevel
 */
export function semanticIdToZoomLevel(semanticId: SemanticLevel["id"]): ZoomLevel {
    return semanticId;
}

/**
 * Calculate interpolation factor between two levels
 */
export function getInterLevelInterpolation(
    scale: number,
    fromLevel: SemanticLevel,
    toLevel: SemanticLevel
): number {
    const threshold = fromLevel.scaleRange.max;
    const transitionWidth = (toLevel.scaleRange.max - toLevel.scaleRange.min) * 0.15;

    if (scale < threshold) return 0;
    if (scale > threshold + transitionWidth) return 1;

    return (scale - threshold) / transitionWidth;
}
