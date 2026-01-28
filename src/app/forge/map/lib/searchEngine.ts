import Fuse, { type FuseResult, type IFuseOptions } from "fuse.js";
import type { MapNode, NodeLevel, NodeStatus, DifficultyLevel, CourseNode } from "@/app/features/knowledge-map/lib/types";

/**
 * Search result with fuzzy matching metadata
 */
export interface SearchResult {
    /** The matched node */
    node: MapNode;
    /** Fuzzy match score (0 = perfect match, 1 = no match) */
    score: number;
    /** Which fields matched */
    matches: SearchMatch[];
    /** Highlighted name with match markers */
    highlightedName: string;
}

/**
 * Individual match within a search result
 */
export interface SearchMatch {
    /** Field that matched (name, description, skills) */
    field: string;
    /** Start and end indices of the match */
    indices: [number, number][];
    /** The matched value */
    value: string;
}

/**
 * Search options for configuring the search behavior
 */
export interface SearchOptions {
    /** Maximum number of results to return */
    limit?: number;
    /** Minimum score threshold (0-1, lower is better) */
    threshold?: number;
    /** Whether to include matches in results */
    includeMatches?: boolean;
    /** Fields to search in */
    keys?: string[];
    /** Search within a specific parent node */
    parentId?: string | null;
    /** Search within a specific level */
    level?: NodeLevel;
}

/**
 * Default Fuse.js options optimized for learning content
 */
const DEFAULT_FUSE_OPTIONS: IFuseOptions<MapNode> = {
    // Fields to search with their weights
    keys: [
        { name: "name", weight: 2 },
        { name: "description", weight: 1 },
        { name: "skills", weight: 1.5 },
    ],
    // Fuzzy matching settings
    threshold: 0.4, // Allow typos (lower = stricter)
    distance: 100, // How close the match must be to the fuzzy location
    ignoreLocation: true, // Search the entire string
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 2,
    // Performance
    shouldSort: true,
    findAllMatches: false,
    useExtendedSearch: true, // Enable special search operators
};

/**
 * MapSearchEngine - Fuzzy search engine for the hex map
 *
 * Uses Fuse.js for fast client-side fuzzy matching with:
 * - Weighted field searching (name > skills > description)
 * - Typo tolerance ("reakt" finds "react")
 * - Match highlighting
 * - Extended search operators (^prefix, suffix$, 'exact)
 */
export class MapSearchEngine {
    private fuse: Fuse<MapNode>;
    private nodes: MapNode[];
    private nodeMap: Map<string, MapNode>;

    constructor(nodes: MapNode[] = []) {
        this.nodes = nodes;
        this.nodeMap = new Map(nodes.map(n => [n.id, n]));
        this.fuse = new Fuse(nodes, DEFAULT_FUSE_OPTIONS);
    }

    /**
     * Update the search index with new nodes
     */
    updateIndex(nodes: MapNode[]): void {
        this.nodes = nodes;
        this.nodeMap = new Map(nodes.map(n => [n.id, n]));
        this.fuse = new Fuse(nodes, DEFAULT_FUSE_OPTIONS);
    }

    /**
     * Add nodes to the existing index
     */
    addToIndex(newNodes: MapNode[]): void {
        const existingIds = new Set(this.nodes.map(n => n.id));
        const uniqueNewNodes = newNodes.filter(n => !existingIds.has(n.id));

        if (uniqueNewNodes.length > 0) {
            this.nodes = [...this.nodes, ...uniqueNewNodes];
            for (const node of uniqueNewNodes) {
                this.nodeMap.set(node.id, node);
            }
            this.fuse = new Fuse(this.nodes, DEFAULT_FUSE_OPTIONS);
        }
    }

    /**
     * Remove nodes from the index
     */
    removeFromIndex(nodeIds: string[]): void {
        const idsToRemove = new Set(nodeIds);
        this.nodes = this.nodes.filter(n => !idsToRemove.has(n.id));
        for (const id of nodeIds) {
            this.nodeMap.delete(id);
        }
        this.fuse = new Fuse(this.nodes, DEFAULT_FUSE_OPTIONS);
    }

    /**
     * Search for nodes matching the query
     */
    search(query: string, options: SearchOptions = {}): SearchResult[] {
        if (!query.trim()) {
            return [];
        }

        const {
            limit = 20,
            threshold,
            parentId,
            level,
        } = options;

        // Get search results from Fuse
        let results = this.fuse.search(query, { limit: limit * 2 }); // Get extra to account for filtering

        // Apply filters
        if (parentId !== undefined || level !== undefined) {
            results = results.filter(result => {
                const node = result.item;
                if (parentId !== undefined && node.parentId !== parentId) {
                    return false;
                }
                if (level !== undefined && node.level !== level) {
                    return false;
                }
                return true;
            });
        }

        // Apply threshold filter if specified
        if (threshold !== undefined) {
            results = results.filter(r => (r.score ?? 1) <= threshold);
        }

        // Limit results
        results = results.slice(0, limit);

        // Transform to SearchResult format
        return results.map(result => this.transformResult(result));
    }

    /**
     * Get search suggestions based on partial input
     */
    getSuggestions(query: string, limit = 5): string[] {
        if (query.length < 2) return [];

        const results = this.fuse.search(query, { limit });
        const suggestions: string[] = [];

        for (const result of results) {
            const node = result.item;
            // Add node name as suggestion
            if (!suggestions.includes(node.name) && suggestions.length < limit) {
                suggestions.push(node.name);
            }
            // Add matching skills as suggestions
            if ("skills" in node && (node as CourseNode).skills) {
                for (const skill of (node as CourseNode).skills!) {
                    if (
                        skill.toLowerCase().includes(query.toLowerCase()) &&
                        !suggestions.includes(skill) &&
                        suggestions.length < limit
                    ) {
                        suggestions.push(skill);
                    }
                }
            }
        }

        return suggestions;
    }

    /**
     * Get a node by ID
     */
    getNode(id: string): MapNode | undefined {
        return this.nodeMap.get(id);
    }

    /**
     * Get all indexed nodes
     */
    getAllNodes(): MapNode[] {
        return this.nodes;
    }

    /**
     * Get index size
     */
    get size(): number {
        return this.nodes.length;
    }

    /**
     * Transform Fuse result to SearchResult format
     */
    private transformResult(result: FuseResult<MapNode>): SearchResult {
        const matches: SearchMatch[] = (result.matches ?? []).map(match => ({
            field: match.key ?? "",
            indices: match.indices.map(([start, end]) => [start, end] as [number, number]),
            value: match.value ?? "",
        }));

        return {
            node: result.item,
            score: result.score ?? 1,
            matches,
            highlightedName: this.highlightMatches(
                result.item.name,
                matches.find(m => m.field === "name")?.indices ?? []
            ),
        };
    }

    /**
     * Add highlight markers to matched text
     */
    private highlightMatches(text: string, indices: [number, number][]): string {
        if (indices.length === 0) return text;

        // Sort indices by start position
        const sorted = [...indices].sort((a, b) => a[0] - b[0]);

        let result = "";
        let lastIndex = 0;

        for (const [start, end] of sorted) {
            result += text.slice(lastIndex, start);
            result += `<mark>${text.slice(start, end + 1)}</mark>`;
            lastIndex = end + 1;
        }

        result += text.slice(lastIndex);
        return result;
    }
}

/**
 * Singleton search engine instance
 */
let searchEngineInstance: MapSearchEngine | null = null;

/**
 * Get or create the search engine instance
 */
export function getSearchEngine(): MapSearchEngine {
    if (!searchEngineInstance) {
        searchEngineInstance = new MapSearchEngine();
    }
    return searchEngineInstance;
}

/**
 * Reset the search engine (useful for testing)
 */
export function resetSearchEngine(): void {
    searchEngineInstance = null;
}
