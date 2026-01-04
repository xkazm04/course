/**
 * Semantic Zoom Controller
 *
 * A first-class progressive disclosure pattern that treats zoom levels as more than
 * just visual scales. The controller manages three orthogonal concerns:
 *
 * 1. DATA FETCHING GRANULARITY - Lazy-load detailed content only when needed
 * 2. INTERACTION AFFORDANCES - Contextual hover/click behaviors per zoom level
 * 3. LEARNING CONTEXT - "You are here" breadcrumbs and navigation hierarchy
 *
 * The existing visibleAtZoom array on nodes is the seed of this pattern, now elevated
 * to a comprehensive progressive disclosure system.
 */

import type { UniverseNode, ZoomLevel, PlanetNode, MoonNode, StarNode } from "./types";
import { ZOOM_LEVEL_CONFIGS } from "./types";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Data fetch state for progressive loading
 */
export type FetchState = "pending" | "loading" | "loaded" | "error";

/**
 * Granular data that can be lazy-loaded at different zoom levels
 */
export interface NodeDetailData {
    // Coarse data (always loaded - galaxy/solar level)
    id: string;
    name: string;
    type: string;
    color: string;

    // Medium data (loaded at constellation level)
    description?: string;
    progress?: number;
    estimatedHours?: number;
    prerequisiteCount?: number;

    // Fine data (loaded at star level)
    lessons?: Array<{
        id: string;
        title: string;
        duration: string;
        completed: boolean;
    }>;
    completedLessons?: number;
    totalLessons?: number;
    lastAccessedAt?: string;
    nextRecommended?: string;
}

/**
 * Fetch strategy for a zoom level - defines what data granularity is needed
 */
export interface ZoomLevelFetchStrategy {
    level: ZoomLevel;
    /** Required data fields for this level */
    requiredFields: (keyof NodeDetailData)[];
    /** Optional fields that enhance the experience */
    optionalFields: (keyof NodeDetailData)[];
    /** Whether to prefetch data for the next zoom level */
    prefetchNext: boolean;
    /** Maximum nodes to fetch detailed data for at this level */
    maxDetailedNodes: number;
}

/**
 * Interaction affordance configuration per zoom level
 */
export interface ZoomLevelInteraction {
    level: ZoomLevel;
    /** Tooltip content generator */
    tooltipContent: (node: UniverseNode, details?: NodeDetailData) => TooltipInfo;
    /** Click action type */
    clickAction: "zoom-to-children" | "navigate-to-content" | "show-details" | "expand-group";
    /** Whether hover previews are enabled */
    hoverPreviewEnabled: boolean;
    /** Keyboard shortcuts active at this level */
    keyboardShortcuts: KeyboardShortcut[];
    /** Whether nodes can be selected at this level */
    selectable: boolean;
}

/**
 * Tooltip information structure
 */
export interface TooltipInfo {
    title: string;
    subtitle: string;
    description?: string;
    stats?: Array<{ label: string; value: string | number }>;
    action?: string;
    progress?: { current: number; total: number };
}

/**
 * Keyboard shortcut definition
 */
export interface KeyboardShortcut {
    key: string;
    description: string;
    action: () => void;
}

/**
 * Breadcrumb navigation item
 */
export interface BreadcrumbItem {
    id: string;
    name: string;
    type: "universe" | "domain" | "chapter" | "lesson";
    zoomLevel: ZoomLevel;
    position: { x: number; y: number };
}

/**
 * Learning context state
 */
export interface LearningContext {
    /** Current breadcrumb path */
    breadcrumbs: BreadcrumbItem[];
    /** Currently focused node */
    focusedNode: UniverseNode | null;
    /** Parent nodes up the hierarchy */
    ancestors: UniverseNode[];
    /** Suggested next steps */
    suggestions: UniverseNode[];
}

/**
 * Semantic zoom state
 */
export interface SemanticZoomState {
    currentLevel: ZoomLevel;
    previousLevel: ZoomLevel | null;
    transitionDirection: "zoom-in" | "zoom-out" | null;
    isTransitioning: boolean;
    fetchState: Map<string, FetchState>;
    detailCache: Map<string, NodeDetailData>;
    learningContext: LearningContext;
}

/**
 * Semantic zoom controller configuration
 */
export interface SemanticZoomControllerConfig {
    /** Callback when data needs to be fetched for a node */
    onFetchNodeDetails?: (nodeId: string, level: ZoomLevel) => Promise<NodeDetailData>;
    /** Callback when zoom level changes */
    onZoomLevelChange?: (newLevel: ZoomLevel, oldLevel: ZoomLevel) => void;
    /** Callback when focus changes */
    onFocusChange?: (node: UniverseNode | null, context: LearningContext) => void;
    /** Enable prefetching */
    prefetchEnabled?: boolean;
    /** Cache TTL in milliseconds */
    cacheTTL?: number;
}

// ============================================================================
// FETCH STRATEGIES PER ZOOM LEVEL
// ============================================================================

export const ZOOM_LEVEL_FETCH_STRATEGIES: ZoomLevelFetchStrategy[] = [
    {
        level: "galaxy",
        requiredFields: ["id", "name", "type", "color"],
        optionalFields: [],
        prefetchNext: true,
        maxDetailedNodes: 0, // No detailed fetching at galaxy level
    },
    {
        level: "solar",
        requiredFields: ["id", "name", "type", "color", "description"],
        optionalFields: ["progress", "prerequisiteCount"],
        prefetchNext: true,
        maxDetailedNodes: 10, // Fetch details for visible domains
    },
    {
        level: "constellation",
        requiredFields: ["id", "name", "type", "color", "description", "progress", "estimatedHours"],
        optionalFields: ["totalLessons", "completedLessons"],
        prefetchNext: true,
        maxDetailedNodes: 20, // Fetch details for visible chapters
    },
    {
        level: "star",
        requiredFields: [
            "id", "name", "type", "color", "description", "progress",
            "lessons", "completedLessons", "totalLessons", "lastAccessedAt", "nextRecommended",
        ],
        optionalFields: [],
        prefetchNext: false,
        maxDetailedNodes: 50, // Full details for visible lessons
    },
];

// ============================================================================
// INTERACTION AFFORDANCES PER ZOOM LEVEL
// ============================================================================

/**
 * Generate tooltip content based on zoom level and node type
 */
function createGalaxyTooltip(node: UniverseNode): TooltipInfo {
    return {
        title: node.name,
        subtitle: "Learning Domain",
        action: "Click to explore modules",
    };
}

function createSolarTooltip(node: UniverseNode, details?: NodeDetailData): TooltipInfo {
    if (node.type === "planet") {
        return {
            title: node.name,
            subtitle: "Learning Domain",
            description: details?.description,
            stats: details?.progress !== undefined ? [
                { label: "Progress", value: `${Math.round(details.progress * 100)}%` },
            ] : undefined,
            action: "Click to see chapters",
        };
    }
    return {
        title: node.name,
        subtitle: node.type === "moon" ? "Chapter" : "Topic",
        action: "Zoom in for details",
    };
}

function createConstellationTooltip(node: UniverseNode, details?: NodeDetailData): TooltipInfo {
    if (node.type === "moon") {
        return {
            title: node.name,
            subtitle: "Chapter",
            description: details?.description,
            stats: [
                ...(details?.estimatedHours !== undefined
                    ? [{ label: "Duration", value: `${details.estimatedHours}h` }]
                    : []),
                ...(details?.totalLessons !== undefined
                    ? [{ label: "Lessons", value: details.totalLessons }]
                    : []),
            ],
            progress: details?.completedLessons !== undefined && details?.totalLessons !== undefined
                ? { current: details.completedLessons, total: details.totalLessons }
                : undefined,
            action: "Click to view lessons",
        };
    }
    if (node.type === "star") {
        const star = node as StarNode;
        return {
            title: node.name,
            subtitle: star.lessonType,
            stats: [{ label: "Duration", value: star.duration }],
            action: star.completed ? "Review lesson" : "Start lesson",
        };
    }
    return {
        title: node.name,
        subtitle: node.type,
    };
}

function createStarTooltip(node: UniverseNode, details?: NodeDetailData): TooltipInfo {
    if (node.type === "star") {
        const star = node as StarNode;
        return {
            title: node.name,
            subtitle: star.lessonType,
            description: details?.description,
            stats: [
                { label: "Duration", value: star.duration },
                ...(details?.lastAccessedAt
                    ? [{ label: "Last opened", value: formatRelativeTime(details.lastAccessedAt) }]
                    : []),
            ],
            progress: star.completed ? { current: 1, total: 1 } : undefined,
            action: star.completed ? "Review this lesson" : "Begin learning",
        };
    }
    return {
        title: node.name,
        subtitle: node.type,
        description: details?.description,
    };
}

export const ZOOM_LEVEL_INTERACTIONS: ZoomLevelInteraction[] = [
    {
        level: "galaxy",
        tooltipContent: createGalaxyTooltip,
        clickAction: "zoom-to-children",
        hoverPreviewEnabled: false,
        selectable: true,
        keyboardShortcuts: [
            { key: "Enter", description: "Zoom into selected domain", action: () => {} },
            { key: "+", description: "Zoom in", action: () => {} },
        ],
    },
    {
        level: "solar",
        tooltipContent: createSolarTooltip,
        clickAction: "zoom-to-children",
        hoverPreviewEnabled: true,
        selectable: true,
        keyboardShortcuts: [
            { key: "Enter", description: "Zoom into selected item", action: () => {} },
            { key: "Escape", description: "Zoom out to galaxy", action: () => {} },
            { key: "+", description: "Zoom in", action: () => {} },
            { key: "-", description: "Zoom out", action: () => {} },
        ],
    },
    {
        level: "constellation",
        tooltipContent: createConstellationTooltip,
        clickAction: "zoom-to-children",
        hoverPreviewEnabled: true,
        selectable: true,
        keyboardShortcuts: [
            { key: "Enter", description: "Open selected chapter", action: () => {} },
            { key: "Escape", description: "Zoom out to solar view", action: () => {} },
            { key: "Tab", description: "Navigate to next item", action: () => {} },
        ],
    },
    {
        level: "star",
        tooltipContent: createStarTooltip,
        clickAction: "navigate-to-content",
        hoverPreviewEnabled: true,
        selectable: true,
        keyboardShortcuts: [
            { key: "Enter", description: "Start selected lesson", action: () => {} },
            { key: "Escape", description: "Zoom out to constellation view", action: () => {} },
            { key: "n", description: "Go to next lesson", action: () => {} },
            { key: "p", description: "Go to previous lesson", action: () => {} },
        ],
    },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format a timestamp as relative time (e.g., "2 days ago")
 */
function formatRelativeTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
}

/**
 * Get the parent node for building breadcrumb hierarchy
 */
function getParentNode(node: UniverseNode, allNodes: UniverseNode[]): UniverseNode | null {
    if (node.type === "moon") {
        const moon = node as MoonNode;
        return allNodes.find((n) => n.id === moon.parentPlanetId) ?? null;
    }
    if (node.type === "star") {
        const star = node as StarNode;
        return allNodes.find((n) => n.id === star.parentMoonId) ?? null;
    }
    return null;
}

/**
 * Get the zoom level appropriate for a node type
 */
function getNodeZoomLevel(node: UniverseNode): ZoomLevel {
    switch (node.type) {
        case "planet":
            return "solar";
        case "moon":
            return "constellation";
        case "star":
        case "asteroid":
        case "comet":
            return "star";
        default:
            return "solar";
    }
}

/**
 * Get node type as breadcrumb type
 */
function getBreadcrumbType(node: UniverseNode): BreadcrumbItem["type"] {
    switch (node.type) {
        case "planet":
            return "domain";
        case "moon":
            return "chapter";
        case "star":
        case "asteroid":
        case "comet":
            return "lesson";
        default:
            return "domain";
    }
}

// ============================================================================
// SEMANTIC ZOOM CONTROLLER
// ============================================================================

export class SemanticZoomController {
    private config: SemanticZoomControllerConfig;
    private state: SemanticZoomState;
    private allNodes: UniverseNode[] = [];
    private cacheTimestamps: Map<string, number> = new Map();
    private listeners: Set<() => void> = new Set();

    constructor(config: SemanticZoomControllerConfig = {}) {
        this.config = {
            prefetchEnabled: true,
            cacheTTL: 5 * 60 * 1000, // 5 minutes default
            ...config,
        };

        this.state = {
            currentLevel: "solar",
            previousLevel: null,
            transitionDirection: null,
            isTransitioning: false,
            fetchState: new Map(),
            detailCache: new Map(),
            learningContext: {
                breadcrumbs: [
                    {
                        id: "root",
                        name: "Knowledge Universe",
                        type: "universe",
                        zoomLevel: "galaxy",
                        position: { x: 0, y: 0 },
                    },
                ],
                focusedNode: null,
                ancestors: [],
                suggestions: [],
            },
        };
    }

    // ========================================================================
    // STATE ACCESSORS
    // ========================================================================

    get currentLevel(): ZoomLevel {
        return this.state.currentLevel;
    }

    get previousLevel(): ZoomLevel | null {
        return this.state.previousLevel;
    }

    get transitionDirection(): "zoom-in" | "zoom-out" | null {
        return this.state.transitionDirection;
    }

    get isTransitioning(): boolean {
        return this.state.isTransitioning;
    }

    get learningContext(): LearningContext {
        return this.state.learningContext;
    }

    get breadcrumbs(): BreadcrumbItem[] {
        return this.state.learningContext.breadcrumbs;
    }

    // ========================================================================
    // NODE MANAGEMENT
    // ========================================================================

    /**
     * Set the full node list for hierarchy building
     */
    setNodes(nodes: UniverseNode[]): void {
        this.allNodes = nodes;
    }

    /**
     * Get the fetch strategy for a zoom level
     */
    getFetchStrategy(level: ZoomLevel): ZoomLevelFetchStrategy {
        return ZOOM_LEVEL_FETCH_STRATEGIES.find((s) => s.level === level) ?? ZOOM_LEVEL_FETCH_STRATEGIES[0];
    }

    /**
     * Get the interaction affordances for a zoom level
     */
    getInteractionAffordances(level: ZoomLevel): ZoomLevelInteraction {
        return ZOOM_LEVEL_INTERACTIONS.find((i) => i.level === level) ?? ZOOM_LEVEL_INTERACTIONS[0];
    }

    /**
     * Get tooltip content for a node at the current zoom level
     */
    getTooltipContent(node: UniverseNode): TooltipInfo {
        const interaction = this.getInteractionAffordances(this.state.currentLevel);
        const details = this.state.detailCache.get(node.id);
        return interaction.tooltipContent(node, details);
    }

    /**
     * Get the click action for a node at the current zoom level
     */
    getClickAction(node: UniverseNode): ZoomLevelInteraction["clickAction"] {
        const interaction = this.getInteractionAffordances(this.state.currentLevel);
        return interaction.clickAction;
    }

    /**
     * Check if hover preview is enabled at current zoom level
     */
    isHoverPreviewEnabled(): boolean {
        const interaction = this.getInteractionAffordances(this.state.currentLevel);
        return interaction.hoverPreviewEnabled;
    }

    // ========================================================================
    // ZOOM LEVEL MANAGEMENT
    // ========================================================================

    /**
     * Update the zoom level and trigger appropriate data fetching
     */
    setZoomLevel(newLevel: ZoomLevel): void {
        if (newLevel === this.state.currentLevel) return;

        const oldLevel = this.state.currentLevel;
        const oldIndex = ZOOM_LEVEL_CONFIGS.findIndex((c) => c.level === oldLevel);
        const newIndex = ZOOM_LEVEL_CONFIGS.findIndex((c) => c.level === newLevel);

        this.state = {
            ...this.state,
            previousLevel: oldLevel,
            currentLevel: newLevel,
            transitionDirection: newIndex > oldIndex ? "zoom-in" : "zoom-out",
            isTransitioning: true,
        };

        // Notify zoom level change
        this.config.onZoomLevelChange?.(newLevel, oldLevel);

        // Trigger prefetch if enabled
        if (this.config.prefetchEnabled) {
            this.prefetchForLevel(newLevel);
        }

        // Clear transition state after animation completes
        setTimeout(() => {
            this.state = { ...this.state, isTransitioning: false, transitionDirection: null };
            this.notify();
        }, 300);

        this.notify();
    }

    /**
     * Handle zoom transition completion
     */
    completeTransition(): void {
        this.state = {
            ...this.state,
            isTransitioning: false,
            transitionDirection: null,
        };
        this.notify();
    }

    // ========================================================================
    // DATA FETCHING
    // ========================================================================

    /**
     * Get the fetch state for a node
     */
    getFetchState(nodeId: string): FetchState {
        return this.state.fetchState.get(nodeId) ?? "pending";
    }

    /**
     * Get cached detail data for a node
     */
    getNodeDetails(nodeId: string): NodeDetailData | undefined {
        // Check cache validity
        const timestamp = this.cacheTimestamps.get(nodeId);
        if (timestamp && Date.now() - timestamp > (this.config.cacheTTL ?? 300000)) {
            // Cache expired, remove it
            this.state.detailCache.delete(nodeId);
            this.cacheTimestamps.delete(nodeId);
            return undefined;
        }
        return this.state.detailCache.get(nodeId);
    }

    /**
     * Fetch details for a node at the current zoom level
     */
    async fetchNodeDetails(nodeId: string): Promise<NodeDetailData | undefined> {
        // Check if already loaded
        const cached = this.getNodeDetails(nodeId);
        if (cached) return cached;

        // Check if already fetching
        if (this.state.fetchState.get(nodeId) === "loading") {
            return undefined;
        }

        // Mark as loading
        this.state.fetchState.set(nodeId, "loading");
        this.notify();

        try {
            if (this.config.onFetchNodeDetails) {
                const details = await this.config.onFetchNodeDetails(nodeId, this.state.currentLevel);
                this.state.detailCache.set(nodeId, details);
                this.cacheTimestamps.set(nodeId, Date.now());
                this.state.fetchState.set(nodeId, "loaded");
                this.notify();
                return details;
            }
        } catch (error) {
            console.error(`Failed to fetch details for node ${nodeId}:`, error);
            this.state.fetchState.set(nodeId, "error");
            this.notify();
        }

        return undefined;
    }

    /**
     * Prefetch data for nodes that will be visible at a zoom level
     */
    private async prefetchForLevel(level: ZoomLevel): Promise<void> {
        const strategy = this.getFetchStrategy(level);
        if (strategy.maxDetailedNodes === 0) return;

        // Get visible nodes at this level
        const visibleNodes = this.allNodes
            .filter((n) => n.visibleAtZoom.includes(level))
            .slice(0, strategy.maxDetailedNodes);

        // Fetch details for nodes that aren't cached
        const nodesToFetch = visibleNodes.filter((n) => !this.getNodeDetails(n.id));

        for (const node of nodesToFetch) {
            // Don't await - prefetch in background
            this.fetchNodeDetails(node.id);
        }
    }

    /**
     * Clear the detail cache
     */
    clearCache(): void {
        this.state.detailCache.clear();
        this.cacheTimestamps.clear();
        this.state.fetchState.clear();
        this.notify();
    }

    // ========================================================================
    // LEARNING CONTEXT / BREADCRUMBS
    // ========================================================================

    /**
     * Set the currently focused node and update breadcrumbs
     */
    setFocusedNode(node: UniverseNode | null): void {
        if (node === this.state.learningContext.focusedNode) return;

        // Build breadcrumb path
        const breadcrumbs: BreadcrumbItem[] = [
            {
                id: "root",
                name: "Knowledge Universe",
                type: "universe",
                zoomLevel: "galaxy",
                position: { x: 0, y: 0 },
            },
        ];

        const ancestors: UniverseNode[] = [];

        if (node) {
            // Build ancestor chain
            let current: UniverseNode | null = node;
            const chain: UniverseNode[] = [];

            while (current) {
                chain.unshift(current);
                current = getParentNode(current, this.allNodes);
            }

            // Convert to breadcrumbs
            for (const ancestor of chain) {
                ancestors.push(ancestor);
                breadcrumbs.push({
                    id: ancestor.id,
                    name: ancestor.name,
                    type: getBreadcrumbType(ancestor),
                    zoomLevel: getNodeZoomLevel(ancestor),
                    position: { x: ancestor.x, y: ancestor.y },
                });
            }
        }

        // Find suggestions (sibling nodes or next recommended)
        const suggestions = this.findSuggestions(node);

        this.state = {
            ...this.state,
            learningContext: {
                breadcrumbs,
                focusedNode: node,
                ancestors: ancestors.slice(0, -1), // Exclude the focused node itself
                suggestions,
            },
        };

        this.config.onFocusChange?.(node, this.state.learningContext);
        this.notify();
    }

    /**
     * Navigate to a breadcrumb item
     */
    navigateToBreadcrumb(breadcrumbId: string): { node: UniverseNode | null; zoomLevel: ZoomLevel } {
        const breadcrumb = this.state.learningContext.breadcrumbs.find((b) => b.id === breadcrumbId);

        if (!breadcrumb) {
            return { node: null, zoomLevel: this.state.currentLevel };
        }

        if (breadcrumb.type === "universe") {
            this.setFocusedNode(null);
            return { node: null, zoomLevel: "galaxy" };
        }

        const node = this.allNodes.find((n) => n.id === breadcrumb.id);
        if (node) {
            this.setFocusedNode(node);
        }

        return { node: node ?? null, zoomLevel: breadcrumb.zoomLevel };
    }

    /**
     * Find suggested next steps based on current focus
     */
    private findSuggestions(focusedNode: UniverseNode | null): UniverseNode[] {
        if (!focusedNode) return [];

        // Find siblings (nodes with same parent)
        const parent = getParentNode(focusedNode, this.allNodes);
        if (!parent) return [];

        const siblings = this.allNodes.filter((n) => {
            const nodeParent = getParentNode(n, this.allNodes);
            return nodeParent?.id === parent.id && n.id !== focusedNode.id;
        });

        // Return up to 3 suggestions
        return siblings.slice(0, 3);
    }

    /**
     * Get the current position in the learning hierarchy as a string
     */
    getPositionDescription(): string {
        const crumbs = this.state.learningContext.breadcrumbs;
        if (crumbs.length <= 1) return "Exploring the Knowledge Universe";

        const path = crumbs.slice(1).map((c) => c.name).join(" > ");
        return `You are here: ${path}`;
    }

    // ========================================================================
    // SUBSCRIPTION
    // ========================================================================

    /**
     * Subscribe to state changes
     */
    subscribe(listener: () => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notify(): void {
        this.listeners.forEach((listener) => listener());
    }

    // ========================================================================
    // CLEANUP
    // ========================================================================

    dispose(): void {
        this.listeners.clear();
        this.state.detailCache.clear();
        this.state.fetchState.clear();
        this.cacheTimestamps.clear();
    }
}

// ============================================================================
// FACTORY
// ============================================================================

export function createSemanticZoomController(
    config?: SemanticZoomControllerConfig
): SemanticZoomController {
    return new SemanticZoomController(config);
}
