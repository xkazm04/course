/**
 * Contextual Labels
 *
 * Manages zoom-dependent label visibility for nodes.
 * Labels appear and disappear smoothly based on:
 * - Current zoom level
 * - Node screen size (radius)
 * - Label priority (progress, importance)
 * - Maximum label count per viewport
 *
 * Key features:
 * - Smooth fade transitions during zoom
 * - Priority-based label culling
 * - Collision avoidance
 * - Multi-line truncation
 */

import type { UniverseNode, ZoomLevel } from "./types";
import type { SemanticLevel, LabelVisibility, DetailCategory } from "./zoomLevelManager";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Label configuration
 */
export interface LabelConfig {
    /** Font size range based on node importance */
    fontSizeRange: { min: number; max: number };
    /** Padding around labels */
    padding: { x: number; y: number };
    /** Maximum characters before truncation */
    maxChars: number;
    /** Whether to show secondary text (subtitle) */
    showSubtitle: boolean;
    /** Subtitle font size multiplier */
    subtitleScale: number;
    /** Label offset from node center */
    offset: { x: number; y: number };
    /** Text anchor point */
    anchor: "center" | "left" | "right" | "top" | "bottom";
}

/**
 * Computed label data for rendering
 */
export interface ComputedLabel {
    nodeId: string;
    text: string;
    subtitle?: string;
    x: number;
    y: number;
    fontSize: number;
    subtitleFontSize?: number;
    opacity: number;
    priority: number;
    bounds: LabelBounds;
    visible: boolean;
    truncated: boolean;
}

/**
 * Label bounding box for collision detection
 */
export interface LabelBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Label priority factors
 */
export interface LabelPriority {
    /** Base priority from node type */
    typePriority: number;
    /** Priority from progress/completion */
    progressPriority: number;
    /** Priority from screen size */
    sizePriority: number;
    /** Priority from viewport position (center = higher) */
    positionPriority: number;
    /** Combined final priority */
    total: number;
}

// ============================================================================
// DEFAULT CONFIGS
// ============================================================================

export const DEFAULT_LABEL_CONFIGS: Record<ZoomLevel, LabelConfig> = {
    galaxy: {
        fontSizeRange: { min: 14, max: 24 },
        padding: { x: 8, y: 4 },
        maxChars: 20,
        showSubtitle: false,
        subtitleScale: 0.75,
        offset: { x: 0, y: 0 },
        anchor: "center",
    },
    solar: {
        fontSizeRange: { min: 12, max: 20 },
        padding: { x: 6, y: 3 },
        maxChars: 25,
        showSubtitle: true,
        subtitleScale: 0.75,
        offset: { x: 0, y: 5 },
        anchor: "top",
    },
    constellation: {
        fontSizeRange: { min: 10, max: 16 },
        padding: { x: 5, y: 2 },
        maxChars: 30,
        showSubtitle: true,
        subtitleScale: 0.8,
        offset: { x: 0, y: 3 },
        anchor: "top",
    },
    star: {
        fontSizeRange: { min: 10, max: 14 },
        padding: { x: 4, y: 2 },
        maxChars: 40,
        showSubtitle: true,
        subtitleScale: 0.85,
        offset: { x: 0, y: 2 },
        anchor: "top",
    },
};

/**
 * Node type priorities (higher = more important)
 */
const NODE_TYPE_PRIORITIES: Record<string, number> = {
    cluster: 100,
    planet: 80,
    moon: 60,
    star: 40,
    comet: 30,
    asteroid: 20,
};

// ============================================================================
// CONTEXTUAL LABEL RENDERER CLASS
// ============================================================================

/**
 * ContextualLabelRenderer - Manages label visibility and rendering
 */
export class ContextualLabelRenderer {
    private labelConfigs: Record<ZoomLevel, LabelConfig>;
    private maxLabels: number;
    private minRadiusForLabel: number;
    private fadeRange: number;
    private prioritizeByProgress: boolean;

    // Cached computed labels
    private computedLabels: Map<string, ComputedLabel> = new Map();
    private previousScale: number = 1;

    constructor(
        labelConfigs: Record<ZoomLevel, LabelConfig> = DEFAULT_LABEL_CONFIGS,
        visibility?: LabelVisibility
    ) {
        this.labelConfigs = labelConfigs;
        this.maxLabels = visibility?.maxLabels ?? 32;
        this.minRadiusForLabel = visibility?.minRadiusForLabel ?? 15;
        this.fadeRange = visibility?.fadeRange ?? 5;
        this.prioritizeByProgress = visibility?.prioritizeByProgress ?? true;
    }

    // ========================================================================
    // LABEL COMPUTATION
    // ========================================================================

    /**
     * Compute labels for visible nodes at current zoom level
     */
    computeLabels(
        nodes: UniverseNode[],
        zoomLevel: ZoomLevel,
        scale: number,
        viewportBounds: { minX: number; maxX: number; minY: number; maxY: number },
        worldToScreen: (x: number, y: number) => { x: number; y: number },
        worldRadiusToScreen: (radius: number) => number
    ): ComputedLabel[] {
        const config = this.labelConfigs[zoomLevel];

        // Calculate labels with priorities
        const candidates: ComputedLabel[] = [];

        for (const node of nodes) {
            // Skip nodes not visible at this zoom level
            if (!node.visibleAtZoom.includes(zoomLevel)) continue;

            // Calculate screen position and size
            const screenPos = worldToScreen(node.x, node.y);
            const screenRadius = worldRadiusToScreen(node.radius);

            // Check if in viewport (with margin)
            if (!this.isInViewport(node.x, node.y, viewportBounds, node.radius)) continue;

            // Calculate base opacity from screen radius
            const opacity = this.calculateOpacity(screenRadius);
            if (opacity <= 0) continue;

            // Calculate priority
            const priority = this.calculatePriority(
                node,
                screenRadius,
                screenPos,
                viewportBounds
            );

            // Generate label text
            const { text, subtitle, truncated } = this.generateLabelText(node, config, zoomLevel);

            // Calculate font size based on screen radius
            const fontSize = this.calculateFontSize(screenRadius, config);

            // Calculate label position
            const labelPos = this.calculateLabelPosition(
                screenPos,
                screenRadius,
                config,
                fontSize
            );

            // Estimate bounds (for collision detection)
            const bounds = this.estimateBounds(text, subtitle, fontSize, labelPos, config);

            candidates.push({
                nodeId: node.id,
                text,
                subtitle,
                x: labelPos.x,
                y: labelPos.y,
                fontSize,
                subtitleFontSize: subtitle ? fontSize * config.subtitleScale : undefined,
                opacity,
                priority: priority.total,
                bounds,
                visible: true,
                truncated,
            });
        }

        // Sort by priority (highest first)
        candidates.sort((a, b) => b.priority - a.priority);

        // Apply collision avoidance and max label limit
        const finalLabels = this.resolveCollisions(candidates, this.maxLabels);

        // Apply smooth transitions from previous state
        this.applyTransitions(finalLabels, scale);

        // Cache results
        this.computedLabels = new Map(finalLabels.map(l => [l.nodeId, l]));
        this.previousScale = scale;

        return finalLabels;
    }

    // ========================================================================
    // OPACITY CALCULATION
    // ========================================================================

    /**
     * Calculate label opacity based on screen radius
     */
    private calculateOpacity(screenRadius: number): number {
        if (screenRadius < this.minRadiusForLabel - this.fadeRange) {
            return 0;
        }

        if (screenRadius < this.minRadiusForLabel) {
            // Fade in zone
            return (screenRadius - (this.minRadiusForLabel - this.fadeRange)) / this.fadeRange;
        }

        // Full opacity (capped at 1)
        return 1;
    }

    /**
     * Calculate transition opacity for zoom changes
     */
    calculateTransitionOpacity(
        nodeId: string,
        currentOpacity: number,
        transitionProgress: number
    ): number {
        const previousLabel = this.computedLabels.get(nodeId);

        if (!previousLabel) {
            // New label - fade in
            return currentOpacity * transitionProgress;
        }

        // Interpolate between previous and current
        return previousLabel.opacity + (currentOpacity - previousLabel.opacity) * transitionProgress;
    }

    // ========================================================================
    // PRIORITY CALCULATION
    // ========================================================================

    /**
     * Calculate label priority for culling
     */
    private calculatePriority(
        node: UniverseNode,
        screenRadius: number,
        screenPos: { x: number; y: number },
        viewportBounds: { minX: number; maxX: number; minY: number; maxY: number }
    ): LabelPriority {
        // Type priority
        const typePriority = NODE_TYPE_PRIORITIES[node.type] ?? 10;

        // Progress priority (for nodes with completion)
        let progressPriority = 0;
        if (this.prioritizeByProgress) {
            if (node.type === "star") {
                const star = node as any;
                progressPriority = star.completed ? 20 : 0;
            } else if (node.type === "cluster") {
                const cluster = node as any;
                progressPriority = (cluster.metrics?.completionPercent ?? 0) / 5;
            }
        }

        // Size priority (larger nodes = higher priority)
        const sizePriority = Math.min(30, screenRadius * 2);

        // Position priority (center of viewport = higher)
        const viewportCenterX = (viewportBounds.minX + viewportBounds.maxX) / 2;
        const viewportCenterY = (viewportBounds.minY + viewportBounds.maxY) / 2;
        const distFromCenter = Math.sqrt(
            (screenPos.x - viewportCenterX) ** 2 +
            (screenPos.y - viewportCenterY) ** 2
        );
        const viewportSize = Math.max(
            viewportBounds.maxX - viewportBounds.minX,
            viewportBounds.maxY - viewportBounds.minY
        );
        const positionPriority = Math.max(0, 20 - (distFromCenter / viewportSize) * 40);

        return {
            typePriority,
            progressPriority,
            sizePriority,
            positionPriority,
            total: typePriority + progressPriority + sizePriority + positionPriority,
        };
    }

    // ========================================================================
    // TEXT GENERATION
    // ========================================================================

    /**
     * Generate label text with optional truncation
     */
    private generateLabelText(
        node: UniverseNode,
        config: LabelConfig,
        zoomLevel: ZoomLevel
    ): { text: string; subtitle?: string; truncated: boolean } {
        let text = node.name;
        let truncated = false;

        // Truncate if too long
        if (text.length > config.maxChars) {
            text = text.substring(0, config.maxChars - 3) + "...";
            truncated = true;
        }

        // Generate subtitle based on node type
        let subtitle: string | undefined;
        if (config.showSubtitle) {
            subtitle = this.getSubtitle(node, zoomLevel);
        }

        return { text, subtitle, truncated };
    }

    /**
     * Get subtitle text for a node
     */
    private getSubtitle(node: UniverseNode, zoomLevel: ZoomLevel): string | undefined {
        switch (node.type) {
            case "cluster": {
                const cluster = node as any;
                const metrics = cluster.metrics;
                if (metrics) {
                    return `${metrics.nodeCount} items · ${metrics.completionPercent}%`;
                }
                return `${cluster.childNodeIds?.length ?? 0} items`;
            }
            case "planet":
                return "Domain";
            case "moon":
                return "Topic";
            case "star": {
                const star = node as any;
                return star.completed ? "Completed" : star.duration;
            }
            case "comet": {
                const comet = node as any;
                return `${comet.difficulty} · Limited time`;
            }
            case "asteroid":
                return "Bonus content";
            default:
                return undefined;
        }
    }

    // ========================================================================
    // FONT SIZE CALCULATION
    // ========================================================================

    /**
     * Calculate font size based on screen radius
     */
    private calculateFontSize(screenRadius: number, config: LabelConfig): number {
        const { min, max } = config.fontSizeRange;

        // Scale font size with radius (with limits)
        const radiusFactor = Math.min(1, screenRadius / 50);
        return Math.round(min + (max - min) * radiusFactor);
    }

    // ========================================================================
    // POSITION CALCULATION
    // ========================================================================

    /**
     * Calculate label position based on anchor and offset
     */
    private calculateLabelPosition(
        screenPos: { x: number; y: number },
        screenRadius: number,
        config: LabelConfig,
        fontSize: number
    ): { x: number; y: number } {
        let x = screenPos.x + config.offset.x;
        let y = screenPos.y + config.offset.y;

        switch (config.anchor) {
            case "top":
                y = screenPos.y + screenRadius + fontSize / 2 + config.padding.y;
                break;
            case "bottom":
                y = screenPos.y - screenRadius - fontSize / 2 - config.padding.y;
                break;
            case "left":
                x = screenPos.x - screenRadius - config.padding.x;
                break;
            case "right":
                x = screenPos.x + screenRadius + config.padding.x;
                break;
            case "center":
            default:
                // Keep centered
                break;
        }

        return { x, y };
    }

    // ========================================================================
    // COLLISION DETECTION
    // ========================================================================

    /**
     * Estimate label bounds for collision detection
     */
    private estimateBounds(
        text: string,
        subtitle: string | undefined,
        fontSize: number,
        position: { x: number; y: number },
        config: LabelConfig
    ): LabelBounds {
        // Estimate width (roughly 0.6 chars per font-size unit)
        const charWidth = fontSize * 0.6;
        const width = text.length * charWidth + config.padding.x * 2;

        // Height includes subtitle if present
        let height = fontSize + config.padding.y * 2;
        if (subtitle) {
            height += fontSize * config.subtitleScale + config.padding.y;
        }

        return {
            x: position.x - width / 2,
            y: position.y - height / 2,
            width,
            height,
        };
    }

    /**
     * Check if two bounds overlap
     */
    private boundsOverlap(a: LabelBounds, b: LabelBounds): boolean {
        return !(
            a.x + a.width < b.x ||
            b.x + b.width < a.x ||
            a.y + a.height < b.y ||
            b.y + b.height < a.y
        );
    }

    /**
     * Resolve collisions and limit label count
     */
    private resolveCollisions(
        candidates: ComputedLabel[],
        maxLabels: number
    ): ComputedLabel[] {
        const result: ComputedLabel[] = [];

        for (const candidate of candidates) {
            if (result.length >= maxLabels) break;

            // Check for overlap with existing labels
            const hasCollision = result.some(existing =>
                this.boundsOverlap(candidate.bounds, existing.bounds)
            );

            if (!hasCollision) {
                result.push(candidate);
            } else {
                // Mark as not visible (could still be rendered with reduced opacity)
                result.push({ ...candidate, visible: false, opacity: candidate.opacity * 0.3 });
            }
        }

        return result;
    }

    // ========================================================================
    // VIEWPORT HELPERS
    // ========================================================================

    /**
     * Check if a point is within viewport bounds
     */
    private isInViewport(
        x: number,
        y: number,
        bounds: { minX: number; maxX: number; minY: number; maxY: number },
        radius: number = 0
    ): boolean {
        return (
            x + radius >= bounds.minX &&
            x - radius <= bounds.maxX &&
            y + radius >= bounds.minY &&
            y - radius <= bounds.maxY
        );
    }

    // ========================================================================
    // TRANSITIONS
    // ========================================================================

    /**
     * Apply smooth transitions from previous label state
     */
    private applyTransitions(labels: ComputedLabel[], currentScale: number): void {
        const scaleChanged = Math.abs(currentScale - this.previousScale) > 0.01;

        if (!scaleChanged) return;

        for (const label of labels) {
            const previous = this.computedLabels.get(label.nodeId);
            if (previous) {
                // Smooth opacity transition
                const opacityDiff = label.opacity - previous.opacity;
                label.opacity = previous.opacity + opacityDiff * 0.3;
            }
        }
    }

    // ========================================================================
    // CONFIG UPDATES
    // ========================================================================

    /**
     * Update visibility settings
     */
    updateVisibility(visibility: LabelVisibility): void {
        this.maxLabels = visibility.maxLabels;
        this.minRadiusForLabel = visibility.minRadiusForLabel;
        this.fadeRange = visibility.fadeRange;
        this.prioritizeByProgress = visibility.prioritizeByProgress;
    }

    /**
     * Update label config for a specific zoom level
     */
    updateLabelConfig(zoomLevel: ZoomLevel, config: Partial<LabelConfig>): void {
        this.labelConfigs[zoomLevel] = {
            ...this.labelConfigs[zoomLevel],
            ...config,
        };
    }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create a new ContextualLabelRenderer instance
 */
export function createContextualLabelRenderer(
    labelConfigs?: Record<ZoomLevel, LabelConfig>,
    visibility?: LabelVisibility
): ContextualLabelRenderer {
    return new ContextualLabelRenderer(labelConfigs, visibility);
}

// ============================================================================
// CANVAS RENDERING HELPERS
// ============================================================================

/**
 * Draw a label on a canvas context
 */
export function drawLabel(
    ctx: CanvasRenderingContext2D,
    label: ComputedLabel,
    options: {
        fontFamily?: string;
        primaryColor?: string;
        secondaryColor?: string;
        shadowColor?: string;
        shadowBlur?: number;
    } = {}
): void {
    const {
        fontFamily = "Inter, system-ui, sans-serif",
        primaryColor = "#ffffff",
        secondaryColor = "rgba(255, 255, 255, 0.6)",
        shadowColor = "rgba(0, 0, 0, 0.5)",
        shadowBlur = 4,
    } = options;

    ctx.save();

    // Apply opacity
    ctx.globalAlpha = label.opacity;

    // Shadow for readability
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = shadowBlur;

    // Draw main text
    ctx.font = `500 ${label.fontSize}px ${fontFamily}`;
    ctx.fillStyle = primaryColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label.text, label.x, label.y);

    // Draw subtitle
    if (label.subtitle && label.subtitleFontSize) {
        ctx.font = `400 ${label.subtitleFontSize}px ${fontFamily}`;
        ctx.fillStyle = secondaryColor;
        ctx.fillText(
            label.subtitle,
            label.x,
            label.y + label.fontSize * 0.7 + label.subtitleFontSize * 0.5
        );
    }

    ctx.restore();
}

/**
 * Measure text width on canvas
 */
export function measureText(
    ctx: CanvasRenderingContext2D,
    text: string,
    fontSize: number,
    fontFamily: string = "Inter, system-ui, sans-serif"
): number {
    ctx.font = `500 ${fontSize}px ${fontFamily}`;
    return ctx.measureText(text).width;
}
