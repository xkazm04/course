/**
 * Node Type Registry
 *
 * A declarative strategy pattern for rendering different node types in the universe.
 * New node types (asteroid, comet, etc.) can be registered without modifying core
 * rendering logic - the system is open for extension, closed for modification.
 */

import type { UniverseNode, ZoomLevel } from "./types";

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
// REGISTER DEFAULT NODE TYPES
// ============================================================================

// Planet type
NodeTypeRegistry.register({
    type: "planet",
    displayName: "Learning Domain",
    visibilityRules: [minRadiusRule(0.5)],
    postRenderStrategy: orbitalRingsStrategy,
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

// Moon type
NodeTypeRegistry.register({
    type: "moon",
    displayName: "Chapter",
    visibilityRules: [minRadiusRule(0.5)],
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

// Star type
NodeTypeRegistry.register({
    type: "star",
    displayName: "Lesson",
    visibilityRules: [minRadiusRule(0.5)],
    postRenderStrategy: completionIndicatorStrategy,
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

// Asteroid type (optional content)
NodeTypeRegistry.register({
    type: "asteroid",
    displayName: "Optional Content",
    visibilityRules: [minRadiusRule(3), zoomLevelRule(["constellation", "star"])],
    preRenderStrategy: asteroidBeltStrategy,
    interaction: {
        clickable: true,
        showTooltip: true,
        hitRadiusMultiplier: 1.5,
        getTooltipContent: (node) => ({
            title: node.name,
            subtitle: "Optional Content",
            extra: "Bonus material",
        }),
    },
    renderPriority: 4,
});

// Comet type (time-limited challenges)
NodeTypeRegistry.register({
    type: "comet",
    displayName: "Time-Limited Challenge",
    visibilityRules: [minRadiusRule(2)],
    preRenderStrategy: cometTailStrategy,
    postRenderStrategy: timeLimitedPulseStrategy,
    interaction: {
        clickable: true,
        showTooltip: true,
        hitRadiusMultiplier: 1.3,
        getTooltipContent: (node) => {
            const comet = node as { expiresAt?: number };
            const remaining = comet.expiresAt ? Math.max(0, comet.expiresAt - Date.now()) : 0;
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            return {
                title: node.name,
                subtitle: "Time-Limited Challenge",
                extra: remaining > 0 ? `${hours}h remaining` : "Expired",
            };
        },
    },
    renderPriority: 5,
});
