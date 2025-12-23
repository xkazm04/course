/**
 * NavigationService - Connections as First-Class Navigation
 *
 * This service elevates graph connections from visual decoration to the primary
 * navigation primitive. It provides:
 *
 * 1. Graph traversal utilities (where can I go from here?)
 * 2. Keyboard navigation support (Tab through connected nodes)
 * 3. Accessibility announcements (screen reader context)
 * 4. Breadcrumb trail tracking (you came via: A -> B -> C)
 * 5. Suggested next steps based on connections
 *
 * The key insight: edges/connections ARE navigation, not just visuals.
 */

import { CurriculumNode, CurriculumConnection, CurriculumData } from "./curriculumTypes";

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

/**
 * Direction of navigation through the graph
 */
export type NavigationDirection = "forward" | "backward" | "any";

/**
 * A navigation target with metadata about the path
 */
export interface NavigationTarget {
    /** The target node */
    node: CurriculumNode;
    /** The connection that leads to this node */
    connection: CurriculumConnection;
    /** Relationship description (e.g., "required prerequisite") */
    relationship: string;
    /** Whether this is the recommended next step */
    isRecommended: boolean;
    /** Distance from current node (1 = direct, 2 = through one node, etc.) */
    distance: number;
}

/**
 * Accessibility announcement data
 */
export interface NavigationAnnouncement {
    /** Short announcement for screen readers */
    brief: string;
    /** Detailed context announcement */
    detailed: string;
    /** Number of outgoing paths */
    outgoingCount: number;
    /** Number of incoming paths */
    incomingCount: number;
    /** List of immediate destination names */
    destinations: string[];
    /** List of sources that lead here */
    sources: string[];
}

/**
 * Breadcrumb trail entry
 */
export interface BreadcrumbEntry {
    /** The node that was visited */
    node: CurriculumNode;
    /** Timestamp when visited */
    visitedAt: number;
    /** How we got here (connection type) */
    viaConnection?: CurriculumConnection;
}

/**
 * Complete navigation context for a node
 */
export interface NavigationContext {
    /** Current node being viewed */
    currentNode: CurriculumNode;
    /** Nodes reachable from here (forward navigation) */
    forwardTargets: NavigationTarget[];
    /** Nodes that lead here (backward navigation) */
    backwardTargets: NavigationTarget[];
    /** All connected nodes regardless of direction */
    allConnections: NavigationTarget[];
    /** Accessibility announcement for this position */
    announcement: NavigationAnnouncement;
    /** Suggested next node based on learning path */
    suggestedNext: NavigationTarget | null;
    /** Breadcrumb trail showing how we got here */
    breadcrumbs: BreadcrumbEntry[];
    /** Keyboard navigation order (for Tab navigation) */
    tabOrder: CurriculumNode[];
}

// ============================================================================
// NAVIGATION SERVICE CLASS
// ============================================================================

/**
 * NavigationService manages graph traversal as the primary navigation mechanism.
 *
 * Instead of treating connections as visual lines between nodes, this service
 * treats them as the navigation primitive that answers: "where can I go from here?"
 */
export class NavigationService {
    private data: CurriculumData;
    private nodeMap: Map<string, CurriculumNode>;
    private outgoingMap: Map<string, CurriculumConnection[]>;
    private incomingMap: Map<string, CurriculumConnection[]>;
    private navigationHistory: BreadcrumbEntry[] = [];
    private maxHistoryLength = 20;

    constructor(data: CurriculumData) {
        this.data = data;
        this.nodeMap = new Map(data.nodes.map(n => [n.id, n]));

        // Pre-compute connection maps for O(1) lookup
        this.outgoingMap = new Map();
        this.incomingMap = new Map();

        for (const conn of data.connections) {
            // Outgoing connections from 'from' node
            if (!this.outgoingMap.has(conn.from)) {
                this.outgoingMap.set(conn.from, []);
            }
            this.outgoingMap.get(conn.from)!.push(conn);

            // Incoming connections to 'to' node
            if (!this.incomingMap.has(conn.to)) {
                this.incomingMap.set(conn.to, []);
            }
            this.incomingMap.get(conn.to)!.push(conn);
        }
    }

    // ========================================================================
    // CORE NAVIGATION METHODS
    // ========================================================================

    /**
     * Get all nodes reachable from a given node (forward navigation)
     */
    getOutgoingTargets(nodeId: string): NavigationTarget[] {
        const connections = this.outgoingMap.get(nodeId) || [];
        return connections
            .map(conn => this.connectionToTarget(conn, "forward"))
            .filter((t): t is NavigationTarget => t !== null)
            .sort((a, b) => this.sortTargets(a, b));
    }

    /**
     * Get all nodes that lead to a given node (backward navigation)
     */
    getIncomingTargets(nodeId: string): NavigationTarget[] {
        const connections = this.incomingMap.get(nodeId) || [];
        return connections
            .map(conn => this.connectionToTarget(conn, "backward"))
            .filter((t): t is NavigationTarget => t !== null)
            .sort((a, b) => this.sortTargets(a, b));
    }

    /**
     * Get all connected nodes regardless of direction
     */
    getAllConnections(nodeId: string): NavigationTarget[] {
        const outgoing = this.getOutgoingTargets(nodeId);
        const incoming = this.getIncomingTargets(nodeId);

        // Deduplicate by node ID
        const seen = new Set<string>();
        const all: NavigationTarget[] = [];

        for (const target of [...outgoing, ...incoming]) {
            if (!seen.has(target.node.id)) {
                seen.add(target.node.id);
                all.push(target);
            }
        }

        return all.sort((a, b) => this.sortTargets(a, b));
    }

    /**
     * Get the suggested next node based on learning progression
     */
    getSuggestedNext(nodeId: string): NavigationTarget | null {
        const outgoing = this.getOutgoingTargets(nodeId);

        // Priority: required connection to available/in_progress node
        const required = outgoing.filter(
            t => t.connection.type === "required" &&
            (t.node.status === "available" || t.node.status === "in_progress")
        );

        if (required.length > 0) {
            return required[0];
        }

        // Fallback: recommended connection to available node
        const recommended = outgoing.filter(
            t => t.connection.type === "recommended" &&
            t.node.status === "available"
        );

        if (recommended.length > 0) {
            return recommended[0];
        }

        // Final fallback: any available outgoing
        const available = outgoing.filter(t => t.node.status === "available");
        return available.length > 0 ? available[0] : null;
    }

    // ========================================================================
    // KEYBOARD NAVIGATION
    // ========================================================================

    /**
     * Get tab order for keyboard navigation from a node.
     * This determines the order in which connected nodes are focused when pressing Tab.
     */
    getTabOrder(nodeId: string): CurriculumNode[] {
        const connections = this.getAllConnections(nodeId);

        // Sort by: recommended first, then required, then optional
        // Within each type, sort by status (in_progress, available, completed, locked)
        const sorted = connections.sort((a, b) => {
            // Connection type priority
            const typePriority = { required: 1, recommended: 2, optional: 3 };
            const typeA = typePriority[a.connection.type];
            const typeB = typePriority[b.connection.type];
            if (typeA !== typeB) return typeA - typeB;

            // Status priority
            const statusPriority = { in_progress: 1, available: 2, completed: 3, locked: 4 };
            const statusA = statusPriority[a.node.status];
            const statusB = statusPriority[b.node.status];
            return statusA - statusB;
        });

        return sorted.map(t => t.node);
    }

    /**
     * Get the next node in tab order
     */
    getNextInTabOrder(currentNodeId: string, connectedNodeId: string): CurriculumNode | null {
        const tabOrder = this.getTabOrder(currentNodeId);
        const currentIndex = tabOrder.findIndex(n => n.id === connectedNodeId);

        if (currentIndex === -1 || currentIndex >= tabOrder.length - 1) {
            return tabOrder[0] || null; // Wrap around
        }

        return tabOrder[currentIndex + 1];
    }

    /**
     * Get the previous node in tab order
     */
    getPreviousInTabOrder(currentNodeId: string, connectedNodeId: string): CurriculumNode | null {
        const tabOrder = this.getTabOrder(currentNodeId);
        const currentIndex = tabOrder.findIndex(n => n.id === connectedNodeId);

        if (currentIndex <= 0) {
            return tabOrder[tabOrder.length - 1] || null; // Wrap around
        }

        return tabOrder[currentIndex - 1];
    }

    // ========================================================================
    // ACCESSIBILITY ANNOUNCEMENTS
    // ========================================================================

    /**
     * Generate accessibility announcement for a node's navigation context
     */
    getAnnouncement(nodeId: string): NavigationAnnouncement {
        const node = this.nodeMap.get(nodeId);
        if (!node) {
            return {
                brief: "Unknown node",
                detailed: "Navigation target not found",
                outgoingCount: 0,
                incomingCount: 0,
                destinations: [],
                sources: [],
            };
        }

        const outgoing = this.getOutgoingTargets(nodeId);
        const incoming = this.getIncomingTargets(nodeId);

        const destinations = outgoing.map(t => t.node.title);
        const sources = incoming.map(t => t.node.title);

        // Build brief announcement
        const pathCount = outgoing.length + incoming.length;
        const brief = pathCount === 0
            ? `${node.title}. No connected topics.`
            : pathCount === 1
                ? `${node.title}. 1 connected topic.`
                : `${node.title}. ${pathCount} connected topics.`;

        // Build detailed announcement
        let detailed = `${node.title}. ${node.status.replace("_", " ")}.`;

        if (outgoing.length > 0) {
            const outgoingNames = destinations.slice(0, 3).join(", ");
            const more = destinations.length > 3 ? ` and ${destinations.length - 3} more` : "";
            detailed += ` ${outgoing.length} path${outgoing.length > 1 ? "s" : ""} lead${outgoing.length === 1 ? "s" : ""} from here: ${outgoingNames}${more}.`;
        }

        if (incoming.length > 0) {
            const incomingNames = sources.slice(0, 3).join(", ");
            const more = sources.length > 3 ? ` and ${sources.length - 3} more` : "";
            detailed += ` ${incoming.length} path${incoming.length > 1 ? "s" : ""} lead${incoming.length === 1 ? "s" : ""} here from: ${incomingNames}${more}.`;
        }

        return {
            brief,
            detailed,
            outgoingCount: outgoing.length,
            incomingCount: incoming.length,
            destinations,
            sources,
        };
    }

    // ========================================================================
    // BREADCRUMB TRAIL
    // ========================================================================

    /**
     * Record a node visit for breadcrumb tracking
     */
    recordVisit(node: CurriculumNode, viaConnection?: CurriculumConnection): void {
        // Don't add duplicate consecutive entries
        const lastEntry = this.navigationHistory[this.navigationHistory.length - 1];
        if (lastEntry && lastEntry.node.id === node.id) {
            return;
        }

        this.navigationHistory.push({
            node,
            visitedAt: Date.now(),
            viaConnection,
        });

        // Trim history if too long
        if (this.navigationHistory.length > this.maxHistoryLength) {
            this.navigationHistory = this.navigationHistory.slice(-this.maxHistoryLength);
        }
    }

    /**
     * Get the breadcrumb trail (recent navigation history)
     */
    getBreadcrumbs(): BreadcrumbEntry[] {
        return [...this.navigationHistory];
    }

    /**
     * Get a formatted breadcrumb string (e.g., "HTML Basics → CSS Basics → Flexbox")
     */
    getBreadcrumbString(maxLength = 5): string {
        const trail = this.navigationHistory.slice(-maxLength);
        return trail.map(entry => entry.node.title).join(" → ");
    }

    /**
     * Clear navigation history
     */
    clearHistory(): void {
        this.navigationHistory = [];
    }

    /**
     * Go back to the previous node in history
     */
    goBack(): BreadcrumbEntry | null {
        if (this.navigationHistory.length < 2) {
            return null;
        }

        // Remove current node
        this.navigationHistory.pop();

        // Return the previous node (now the last in history)
        return this.navigationHistory[this.navigationHistory.length - 1] || null;
    }

    // ========================================================================
    // COMPLETE NAVIGATION CONTEXT
    // ========================================================================

    /**
     * Get complete navigation context for a node.
     * This is the primary API for components to understand navigation from a position.
     */
    getNavigationContext(nodeId: string): NavigationContext | null {
        const node = this.nodeMap.get(nodeId);
        if (!node) return null;

        const forwardTargets = this.getOutgoingTargets(nodeId);
        const backwardTargets = this.getIncomingTargets(nodeId);
        const allConnections = this.getAllConnections(nodeId);

        return {
            currentNode: node,
            forwardTargets,
            backwardTargets,
            allConnections,
            announcement: this.getAnnouncement(nodeId),
            suggestedNext: this.getSuggestedNext(nodeId),
            breadcrumbs: this.getBreadcrumbs(),
            tabOrder: this.getTabOrder(nodeId),
        };
    }

    // ========================================================================
    // PATHFINDING
    // ========================================================================

    /**
     * Find the shortest path between two nodes
     */
    findPath(fromId: string, toId: string): CurriculumNode[] | null {
        if (fromId === toId) return [this.nodeMap.get(fromId)!];

        const visited = new Set<string>();
        const queue: { nodeId: string; path: string[] }[] = [{ nodeId: fromId, path: [fromId] }];

        while (queue.length > 0) {
            const { nodeId, path } = queue.shift()!;

            if (visited.has(nodeId)) continue;
            visited.add(nodeId);

            const connections = this.getAllConnections(nodeId);
            for (const target of connections) {
                const targetId = target.node.id;
                if (targetId === toId) {
                    const fullPath = [...path, targetId];
                    return fullPath.map(id => this.nodeMap.get(id)!);
                }

                if (!visited.has(targetId)) {
                    queue.push({ nodeId: targetId, path: [...path, targetId] });
                }
            }
        }

        return null; // No path found
    }

    /**
     * Get the learning path from a node (all descendants in topological order)
     */
    getLearningPath(nodeId: string): CurriculumNode[] {
        const visited = new Set<string>();
        const result: CurriculumNode[] = [];

        const dfs = (id: string) => {
            if (visited.has(id)) return;
            visited.add(id);

            const node = this.nodeMap.get(id);
            if (node) result.push(node);

            const outgoing = this.outgoingMap.get(id) || [];
            for (const conn of outgoing) {
                if (conn.type === "required" || conn.type === "recommended") {
                    dfs(conn.to);
                }
            }
        };

        dfs(nodeId);
        return result;
    }

    // ========================================================================
    // PRIVATE HELPERS
    // ========================================================================

    private connectionToTarget(
        connection: CurriculumConnection,
        direction: "forward" | "backward"
    ): NavigationTarget | null {
        const targetId = direction === "forward" ? connection.to : connection.from;
        const node = this.nodeMap.get(targetId);

        if (!node) return null;

        const relationshipMap = {
            required: direction === "forward" ? "required for" : "requires",
            recommended: direction === "forward" ? "recommended next" : "recommends",
            optional: direction === "forward" ? "optionally leads to" : "optional from",
        };

        return {
            node,
            connection,
            relationship: relationshipMap[connection.type],
            isRecommended: connection.type === "required" || connection.type === "recommended",
            distance: 1,
        };
    }

    private sortTargets(a: NavigationTarget, b: NavigationTarget): number {
        // Sort by: type (required > recommended > optional), then by status
        const typePriority = { required: 1, recommended: 2, optional: 3 };
        const typeA = typePriority[a.connection.type];
        const typeB = typePriority[b.connection.type];

        if (typeA !== typeB) return typeA - typeB;

        const statusPriority = { in_progress: 1, available: 2, completed: 3, locked: 4 };
        const statusA = statusPriority[a.node.status];
        const statusB = statusPriority[b.node.status];

        return statusA - statusB;
    }
}

// ============================================================================
// SINGLETON INSTANCE FACTORY
// ============================================================================

let navigationServiceInstance: NavigationService | null = null;

/**
 * Get or create the NavigationService instance
 */
export function getNavigationService(data: CurriculumData): NavigationService {
    if (!navigationServiceInstance) {
        navigationServiceInstance = new NavigationService(data);
    }
    return navigationServiceInstance;
}

/**
 * Reset the NavigationService (useful for testing or data updates)
 */
export function resetNavigationService(): void {
    navigationServiceInstance = null;
}
