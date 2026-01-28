/**
 * Node Type Registry
 *
 * A declarative strategy pattern for rendering different node types in the universe.
 * New node types (asteroid, comet, etc.) can be registered without modifying core
 * rendering logic - the system is open for extension, closed for modification.
 */

import type { UniverseNode, ZoomLevel, ClusterNode, ClusterLevel } from "./types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Node reveal animation state
 */
export interface NodeRevealState {
    opacity: number;
    scale: number;
    complete: boolean;
}

/**
 * Rendering context passed to all render strategies
 */
export interface NodeRenderContext {
    ctx: CanvasRenderingContext2D;
    node: UniverseNode;
    screenX: number;
    screenY: number;
    screenRadius: number;
    isHovered: boolean;
    isSelected: boolean;
    zoomLevel: ZoomLevel;
    revealState?: NodeRevealState;
    animatedRadius: number;
    animOpacity: number;
}

/**
 * Visibility rule function - determines if a node should be visible
 */
export type VisibilityRule = (
    node: UniverseNode,
    zoomLevel: ZoomLevel,
    screenRadius: number
) => boolean;

/**
 * Render strategy function - draws type-specific decorations
 */
export type RenderStrategy = (context: NodeRenderContext) => void;

/**
 * Interaction behavior - handles type-specific interactions
 */
export interface InteractionBehavior {
    /** Custom hit radius multiplier (default 1.0) */
    hitRadiusMultiplier?: number;
    /** Whether this node type is clickable */
    clickable?: boolean;
    /** Whether this node type shows tooltip on hover */
    showTooltip?: boolean;
    /** Custom tooltip content generator */
    getTooltipContent?: (node: UniverseNode) => { title: string; subtitle: string; extra?: string };
}

/**
 * Complete node type definition
 */
export interface NodeTypeDefinition {
    /** Unique type identifier */
    type: string;
    /** Display name for the node type */
    displayName: string;
    /** Visibility rules for this node type */
    visibilityRules: VisibilityRule[];
    /** Pre-render strategy (drawn before base node) */
    preRenderStrategy?: RenderStrategy;
    /** Post-render strategy (drawn after base node) */
    postRenderStrategy?: RenderStrategy;
    /** Interaction behaviors */
    interaction: InteractionBehavior;
    /** Priority for rendering order (higher = rendered later/on top) */
    renderPriority: number;
}

// ============================================================================
// NODE TYPE REGISTRY
// ============================================================================

/**
 * Registry for node type definitions
 * Implements the strategy pattern for extensible node rendering
 */
class NodeTypeRegistryImpl {
    private definitions = new Map<string, NodeTypeDefinition>();

    /**
     * Register a new node type definition
     */
    register(definition: NodeTypeDefinition): void {
        this.definitions.set(definition.type, definition);
    }

    /**
     * Get a node type definition by type
     */
    get(type: string): NodeTypeDefinition | undefined {
        return this.definitions.get(type);
    }

    /**
     * Get all registered node types
     */
    getAll(): NodeTypeDefinition[] {
        return Array.from(this.definitions.values());
    }

    /**
     * Check if a node type is registered
     */
    has(type: string): boolean {
        return this.definitions.has(type);
    }

    /**
     * Check visibility for a node based on its type's rules
     */
    isVisible(node: UniverseNode, zoomLevel: ZoomLevel, screenRadius: number): boolean {
        const definition = this.definitions.get(node.type);
        if (!definition) return true; // Default to visible if type not registered

        return definition.visibilityRules.every((rule) => rule(node, zoomLevel, screenRadius));
    }

    /**
     * Execute pre-render strategy for a node
     */
    preRender(context: NodeRenderContext): void {
        const definition = this.definitions.get(context.node.type);
        if (definition?.preRenderStrategy) {
            definition.preRenderStrategy(context);
        }
    }

    /**
     * Execute post-render strategy for a node
     */
    postRender(context: NodeRenderContext): void {
        const definition = this.definitions.get(context.node.type);
        if (definition?.postRenderStrategy) {
            definition.postRenderStrategy(context);
        }
    }

    /**
     * Get interaction behavior for a node type
     */
    getInteractionBehavior(type: string): InteractionBehavior {
        const definition = this.definitions.get(type);
        return definition?.interaction ?? { clickable: true, showTooltip: true };
    }
}

// Singleton instance
export const NodeTypeRegistry = new NodeTypeRegistryImpl();

// ============================================================================
// DEFAULT VISIBILITY RULES
// ============================================================================

/**
 * Minimum radius visibility rule - hide nodes that are too small
 */
export const minRadiusRule =
    (minRadius: number): VisibilityRule =>
    (_node, _zoomLevel, screenRadius) =>
        screenRadius >= minRadius;

/**
 * Zoom level visibility rule - only visible at certain zoom levels
 */
export const zoomLevelRule =
    (allowedLevels: ZoomLevel[]): VisibilityRule =>
    (_node, zoomLevel) =>
        allowedLevels.includes(zoomLevel);

// ============================================================================
// BUILT-IN RENDER STRATEGIES
// ============================================================================

/**
 * Draw orbital rings around a node (for planets)
 */
export const orbitalRingsStrategy: RenderStrategy = (context) => {
    const { ctx, node, screenX, screenY, animatedRadius, zoomLevel } = context;

    if (animatedRadius <= 30 || zoomLevel === "star") return;

    const planet = node as { orbitalRings?: number };
    const ringCount = planet.orbitalRings ?? 0;

    for (let i = 1; i <= ringCount; i++) {
        const ringRadius = animatedRadius + 30 + i * 25;
        ctx.beginPath();
        ctx.arc(screenX, screenY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 - i * 0.02})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
    }
};

/**
 * Draw completion indicator (for stars)
 */
export const completionIndicatorStrategy: RenderStrategy = (context) => {
    const { ctx, node, screenX, screenY, animatedRadius } = context;

    if (animatedRadius <= 3) return;

    const star = node as { completed?: boolean };
    if (star.completed) {
        ctx.beginPath();
        ctx.arc(screenX, screenY, animatedRadius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 2;
        ctx.stroke();
    }
};

/**
 * Draw asteroid belt effect (rocky fragments around node)
 */
export const asteroidBeltStrategy: RenderStrategy = (context) => {
    const { ctx, node, screenX, screenY, animatedRadius, animOpacity } = context;

    if (animatedRadius <= 8) return;

    const asteroid = node as { fragmentCount?: number };
    const fragmentCount = asteroid.fragmentCount ?? 8;
    const beltRadius = animatedRadius * 1.8;

    ctx.save();
    ctx.globalAlpha = animOpacity * 0.6;

    for (let i = 0; i < fragmentCount; i++) {
        const angle = (i / fragmentCount) * Math.PI * 2 + Date.now() * 0.0003;
        const distance = beltRadius + Math.sin(angle * 3) * 4;
        const fragX = screenX + Math.cos(angle) * distance;
        const fragY = screenY + Math.sin(angle) * distance;
        const fragSize = 1.5 + Math.sin(angle * 5) * 0.5;

        ctx.beginPath();
        ctx.arc(fragX, fragY, fragSize, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(139, 119, 101, 0.8)";
        ctx.fill();
    }

    ctx.restore();
};

/**
 * Draw comet tail effect
 */
export const cometTailStrategy: RenderStrategy = (context) => {
    const { ctx, node, screenX, screenY, animatedRadius, animOpacity } = context;

    if (animatedRadius <= 4) return;

    const comet = node as { tailLength?: number; tailAngle?: number };
    const tailLength = (comet.tailLength ?? 60) * (animatedRadius / 15);
    const tailAngle = comet.tailAngle ?? Math.PI * 0.75;

    ctx.save();
    ctx.globalAlpha = animOpacity;

    // Create tail gradient
    const tailEndX = screenX + Math.cos(tailAngle) * tailLength;
    const tailEndY = screenY + Math.sin(tailAngle) * tailLength;

    const tailGradient = ctx.createLinearGradient(screenX, screenY, tailEndX, tailEndY);
    tailGradient.addColorStop(0, node.glowColor);
    tailGradient.addColorStop(0.3, `${node.glowColor.replace(/[\d.]+\)$/, "0.4)")}`);
    tailGradient.addColorStop(1, "transparent");

    // Draw main tail
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);

    // Curved tail using bezier
    const controlX = screenX + Math.cos(tailAngle + 0.3) * tailLength * 0.5;
    const controlY = screenY + Math.sin(tailAngle + 0.3) * tailLength * 0.5;

    ctx.quadraticCurveTo(controlX, controlY, tailEndX, tailEndY);
    ctx.strokeStyle = tailGradient;
    ctx.lineWidth = animatedRadius * 0.8;
    ctx.lineCap = "round";
    ctx.stroke();

    // Draw secondary faint tail
    const secondaryAngle = tailAngle - 0.15;
    const secondaryLength = tailLength * 0.7;
    const secondaryEndX = screenX + Math.cos(secondaryAngle) * secondaryLength;
    const secondaryEndY = screenY + Math.sin(secondaryAngle) * secondaryLength;

    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(secondaryEndX, secondaryEndY);
    ctx.strokeStyle = `${node.glowColor.replace(/[\d.]+\)$/, "0.2)")}`;
    ctx.lineWidth = animatedRadius * 0.4;
    ctx.stroke();

    ctx.restore();
};

/**
 * Draw time-limited pulsing indicator
 */
export const timeLimitedPulseStrategy: RenderStrategy = (context) => {
    const { ctx, node, screenX, screenY, animatedRadius } = context;

    if (animatedRadius <= 5) return;

    const timeLimited = node as { expiresAt?: number };
    if (!timeLimited.expiresAt) return;

    const now = Date.now();
    const remaining = timeLimited.expiresAt - now;
    if (remaining <= 0) return;

    // Faster pulse as time runs out
    const urgency = Math.max(0, Math.min(1, 1 - remaining / (24 * 60 * 60 * 1000))); // 24 hours
    const pulseSpeed = 1 + urgency * 3;
    const pulseAlpha = 0.3 + Math.sin(now * 0.003 * pulseSpeed) * 0.2;

    ctx.beginPath();
    ctx.arc(screenX, screenY, animatedRadius + 6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(234, 179, 8, ${pulseAlpha})`; // Yellow warning color
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
};

// ============================================================================
// NODE LABEL SYSTEM
// ============================================================================

/**
 * Label configuration for each node type
 */
export interface LabelConfig {
    minScreenRadius: number;    // Min radius to show label
    fontWeight: string;         // 'bold' | 'normal' | '600'
    fontSizeMultiplier: number; // Relative to screenRadius
    maxLength: number;          // Truncation threshold
    visibleAtZoom: ZoomLevel[]; // Zoom levels where label is shown
}

/**
 * Label configurations per node type
 * - maxLength set high (100) to effectively disable truncation
 * - visibleAtZoom controls progressive disclosure (stricter at zoom-out)
 */
const LABEL_CONFIGS: Record<string, LabelConfig> = {
    cluster: {
        minScreenRadius: 30,
        fontWeight: "bold",
        fontSizeMultiplier: 0.35,
        maxLength: 100,  // No truncation
        visibleAtZoom: ["galaxy", "solar"],
    },
    planet: {
        minScreenRadius: 25,
        fontWeight: "600",
        fontSizeMultiplier: 0.4,
        maxLength: 100,  // No truncation
        visibleAtZoom: ["galaxy", "solar"],  // Hide at deep zoom
    },
    moon: {
        minScreenRadius: 20,
        fontWeight: "normal",
        fontSizeMultiplier: 0.45,
        maxLength: 100,  // No truncation
        visibleAtZoom: ["solar", "constellation"],  // Hide at star level
    },
    star: {
        minScreenRadius: 15,
        fontWeight: "normal",
        fontSizeMultiplier: 0.5,
        maxLength: 100,  // No truncation
        visibleAtZoom: ["constellation", "star"],
    },
    asteroid: {
        minScreenRadius: 12,
        fontWeight: "normal",
        fontSizeMultiplier: 0.55,
        maxLength: 100,  // No truncation
        visibleAtZoom: ["star"],  // Only visible at deepest zoom
    },
    comet: {
        minScreenRadius: 12,
        fontWeight: "normal",
        fontSizeMultiplier: 0.55,
        maxLength: 100,  // No truncation
        visibleAtZoom: ["star"],  // Only visible at deepest zoom
    },
};

/**
 * Universal node label rendering strategy
 * Draws the node name below the node with zoom-aware sizing and visibility
 */
export const nodeLabelStrategy: RenderStrategy = (context) => {
    const { ctx, node, screenX, screenY, screenRadius, zoomLevel, animOpacity } = context;

    const config = LABEL_CONFIGS[node.type];
    if (!config) return;

    // Visibility checks
    if (screenRadius < config.minScreenRadius) return;
    if (!config.visibleAtZoom.includes(zoomLevel)) return;

    // Calculate font size based on screen radius
    const fontSize = Math.max(10, Math.min(24, screenRadius * config.fontSizeMultiplier));

    // Truncate long names
    let label = node.name;
    if (label.length > config.maxLength) {
        label = label.slice(0, config.maxLength - 1) + "…";
    }

    // Position label below node
    const labelY = screenY + screenRadius + fontSize * 0.6 + 4;

    // Setup text style
    ctx.save();
    ctx.font = `${config.fontWeight} ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.globalAlpha = animOpacity;

    // Dark shadow/glow for readability on any background
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;

    // Draw text with subtle node color tint
    ctx.fillStyle = "#ffffff";
    ctx.fillText(label, screenX, labelY);

    ctx.restore();
};

/**
 * Compose multiple render strategies into one
 */
function composeStrategies(...strategies: (RenderStrategy | undefined)[]): RenderStrategy {
    return (context) => {
        for (const strategy of strategies) {
            if (strategy) strategy(context);
        }
    };
}

// ============================================================================
// REGISTER DEFAULT NODE TYPES
// ============================================================================

// Planet type - visible at galaxy and solar zoom
NodeTypeRegistry.register({
    type: "planet",
    displayName: "Learning Domain",
    visibilityRules: [
        minRadiusRule(0.5),
        zoomLevelRule(["galaxy", "solar", "constellation"]),
    ],
    postRenderStrategy: composeStrategies(orbitalRingsStrategy, nodeLabelStrategy),
    interaction: {
        clickable: true,
        showTooltip: true,
        hitRadiusMultiplier: 1.0,
        getTooltipContent: (node) => ({
            title: node.name,
            subtitle: "Learning Domain",
        }),
    },
    renderPriority: 1,
});

// Moon type - visible at solar and constellation zoom
NodeTypeRegistry.register({
    type: "moon",
    displayName: "Chapter",
    visibilityRules: [
        minRadiusRule(0.5),
        zoomLevelRule(["solar", "constellation", "star"]),
    ],
    postRenderStrategy: nodeLabelStrategy,
    interaction: {
        clickable: true,
        showTooltip: true,
        hitRadiusMultiplier: 1.0,
        getTooltipContent: (node) => ({
            title: node.name,
            subtitle: "Chapter",
        }),
    },
    renderPriority: 2,
});

// Star type - visible at constellation and star zoom
NodeTypeRegistry.register({
    type: "star",
    displayName: "Lesson",
    visibilityRules: [
        minRadiusRule(0.5),
        zoomLevelRule(["constellation", "star"]),
    ],
    postRenderStrategy: composeStrategies(completionIndicatorStrategy, nodeLabelStrategy),
    interaction: {
        clickable: true,
        showTooltip: true,
        hitRadiusMultiplier: 1.2,
        getTooltipContent: (node) => {
            const star = node as { lessonType: string; duration: string; completed: boolean };
            return {
                title: node.name,
                subtitle: star.lessonType,
                extra: star.completed ? "Completed" : star.duration,
            };
        },
    },
    renderPriority: 3,
});

// Asteroid type (course level) - visible only at star zoom
NodeTypeRegistry.register({
    type: "asteroid",
    displayName: "Course",
    visibilityRules: [
        minRadiusRule(2),
        zoomLevelRule(["star"]),  // Only at deepest zoom
    ],
    preRenderStrategy: asteroidBeltStrategy,
    postRenderStrategy: nodeLabelStrategy,
    interaction: {
        clickable: true,
        showTooltip: true,
        hitRadiusMultiplier: 1.5,
        getTooltipContent: (node) => ({
            title: node.name,
            subtitle: "Course",
            extra: "Learning module",
        }),
    },
    renderPriority: 4,
});

// Comet type (lesson level) - visible only at star zoom
NodeTypeRegistry.register({
    type: "comet",
    displayName: "Lesson",
    visibilityRules: [
        minRadiusRule(2),
        zoomLevelRule(["star"]),  // Only at deepest zoom
    ],
    preRenderStrategy: cometTailStrategy,
    postRenderStrategy: nodeLabelStrategy,
    interaction: {
        clickable: true,
        showTooltip: true,
        hitRadiusMultiplier: 1.3,
        getTooltipContent: (node) => {
            const lesson = node as { duration?: string; completed?: boolean };
            return {
                title: node.name,
                subtitle: "Lesson",
                extra: lesson.completed ? "Completed" : (lesson.duration || "~15 min"),
            };
        },
    },
    renderPriority: 5,
});

// ============================================================================
// CLUSTER RENDER STRATEGIES
// ============================================================================

/**
 * Draw nebula effect for galaxy clusters
 * Creates a swirling, glowing cloud effect
 */
export const nebulaClusterStrategy: RenderStrategy = (context) => {
    const { ctx, node, screenX, screenY, animatedRadius, animOpacity } = context;
    const cluster = node as ClusterNode;

    if (animatedRadius <= 10) return;

    ctx.save();
    ctx.globalAlpha = animOpacity * 0.8;

    // Outer glow layers (nebula cloud effect)
    const glowLayers = 4;
    for (let i = glowLayers; i >= 1; i--) {
        const layerRadius = animatedRadius * (1 + i * 0.4);
        const gradient = ctx.createRadialGradient(
            screenX, screenY, animatedRadius * 0.3,
            screenX, screenY, layerRadius
        );

        const baseColor = node.color;
        const alpha = (0.15 / i) * animOpacity;
        gradient.addColorStop(0, `${baseColor}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(0.5, `${baseColor}${Math.round(alpha * 0.5 * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(screenX, screenY, layerRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    // Animated swirling particles within the nebula
    const particleCount = Math.min(cluster.metrics.nodeCount, 20);
    const time = Date.now() * 0.001;

    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2 + time * 0.2;
        const spiralFactor = 0.3 + (i % 3) * 0.2;
        const distance = animatedRadius * spiralFactor * (1 + Math.sin(time + i) * 0.2);
        const particleX = screenX + Math.cos(angle) * distance;
        const particleY = screenY + Math.sin(angle) * distance;
        const particleSize = 2 + Math.sin(time * 2 + i) * 1;

        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
        ctx.fillStyle = `${node.color}${Math.round(animOpacity * 0.6 * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();
    }

    ctx.restore();
};

/**
 * Draw metrics overlay for clusters (node count, completion %)
 */
export const clusterMetricsStrategy: RenderStrategy = (context) => {
    const { ctx, node, screenX, screenY, animatedRadius, animOpacity, isHovered } = context;
    const cluster = node as ClusterNode;

    if (animatedRadius <= 25) return;

    ctx.save();
    ctx.globalAlpha = animOpacity;

    // Draw node count in center
    const fontSize = Math.max(12, Math.min(24, animatedRadius * 0.4));
    ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow effect for text
    ctx.shadowColor = node.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${cluster.metrics.nodeCount}`, screenX, screenY - fontSize * 0.3);

    // Draw "nodes" label below
    const labelSize = Math.max(9, fontSize * 0.5);
    ctx.font = `${labelSize}px Inter, system-ui, sans-serif`;
    ctx.shadowBlur = 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('nodes', screenX, screenY + fontSize * 0.5);

    // Draw completion ring if hovered or large enough
    if (isHovered || animatedRadius > 50) {
        const completionPercent = cluster.metrics.completionPercent / 100;
        const ringRadius = animatedRadius * 0.85;
        const ringWidth = Math.max(3, animatedRadius * 0.08);

        // Background ring
        ctx.beginPath();
        ctx.arc(screenX, screenY, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = ringWidth;
        ctx.stroke();

        // Progress ring
        if (completionPercent > 0) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, ringRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * completionPercent);
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = ringWidth;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        // Completion percentage text
        if (isHovered) {
            const percentSize = Math.max(10, fontSize * 0.6);
            ctx.font = `${percentSize}px Inter, system-ui, sans-serif`;
            ctx.shadowBlur = 6;
            ctx.fillStyle = '#22c55e';
            ctx.fillText(`${Math.round(cluster.metrics.completionPercent)}%`, screenX, screenY + animatedRadius * 0.65);
        }
    }

    ctx.restore();
};

/**
 * Draw "dive deeper" affordance on hover
 */
export const clusterDiveAffordanceStrategy: RenderStrategy = (context) => {
    const { ctx, node, screenX, screenY, animatedRadius, animOpacity, isHovered } = context;

    if (!isHovered || animatedRadius <= 30) return;

    ctx.save();
    ctx.globalAlpha = animOpacity * 0.9;

    // Pulsing ring to indicate "dive in"
    const pulsePhase = (Date.now() % 1500) / 1500;
    const pulseRadius = animatedRadius * (1.1 + pulsePhase * 0.3);
    const pulseAlpha = (1 - pulsePhase) * 0.5;

    ctx.beginPath();
    ctx.arc(screenX, screenY, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `${node.color}${Math.round(pulseAlpha * 255).toString(16).padStart(2, '0')}`;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // "Zoom to explore" hint at bottom
    const hintY = screenY + animatedRadius + 20;
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText('Scroll to explore', screenX, hintY);

    ctx.restore();
};

/**
 * Draw expansion animation (cluster exploding into children)
 */
export const clusterExpansionStrategy: RenderStrategy = (context) => {
    const { ctx, node, screenX, screenY, animatedRadius, animOpacity } = context;
    const cluster = node as ClusterNode;

    if (!cluster.isExpanding || !cluster.expansionProgress) return;

    const progress = cluster.expansionProgress;
    ctx.save();
    ctx.globalAlpha = animOpacity * (1 - progress);

    // Expanding ring effect
    const expandRadius = animatedRadius * (1 + progress * 2);

    ctx.beginPath();
    ctx.arc(screenX, screenY, expandRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `${node.color}${Math.round((1 - progress) * 0.5 * 255).toString(16).padStart(2, '0')}`;
    ctx.lineWidth = 3 * (1 - progress);
    ctx.stroke();

    // Particle burst effect
    const particleCount = Math.min(cluster.childNodeIds.length, 12);
    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const distance = expandRadius * progress * 1.5;
        const px = screenX + Math.cos(angle) * distance;
        const py = screenY + Math.sin(angle) * distance;
        const pSize = 4 * (1 - progress);

        ctx.beginPath();
        ctx.arc(px, py, pSize, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();
    }

    ctx.restore();
};

// ============================================================================
// REGISTER CLUSTER NODE TYPE
// ============================================================================

NodeTypeRegistry.register({
    type: "cluster",
    displayName: "Content Cluster",
    visibilityRules: [
        minRadiusRule(5),
        // Clusters are visible at lower zoom levels
        (node, zoomLevel) => {
            const cluster = node as ClusterNode;
            if (cluster.clusterLevel === "galaxy-cluster") {
                return zoomLevel === "galaxy";
            }
            if (cluster.clusterLevel === "domain-cluster") {
                return zoomLevel === "galaxy" || zoomLevel === "solar";
            }
            if (cluster.clusterLevel === "topic-cluster") {
                return zoomLevel === "solar" || zoomLevel === "constellation";
            }
            return true;
        },
    ],
    preRenderStrategy: nebulaClusterStrategy,
    postRenderStrategy: (context) => {
        clusterMetricsStrategy(context);
        clusterDiveAffordanceStrategy(context);
        clusterExpansionStrategy(context);
        nodeLabelStrategy(context);
    },
    interaction: {
        clickable: true,
        showTooltip: true,
        hitRadiusMultiplier: 1.2,
        getTooltipContent: (node) => {
            const cluster = node as ClusterNode;
            const levelNames: Record<ClusterLevel, string> = {
                "galaxy-cluster": "Galaxy Cluster",
                "domain-cluster": "Learning Domain",
                "topic-cluster": "Topic Cluster",
                "skill-cluster": "Skill Cluster",
            };
            return {
                title: node.name,
                subtitle: levelNames[cluster.clusterLevel],
                extra: `${cluster.metrics.nodeCount} items · ${cluster.metrics.totalHours}h · ${Math.round(cluster.metrics.completionPercent)}% complete`,
            };
        },
    },
    renderPriority: 0, // Render clusters first (behind other nodes)
});
