import type { MapNode, NodeLevel, NodeStatus, DifficultyLevel, CourseNode, ChapterNode } from "@/app/features/knowledge-map/lib/types";

/**
 * Filter criteria for the hex map
 */
export interface FilterCriteria {
    /** Filter by node levels */
    levels?: NodeLevel[];
    /** Filter by completion status */
    statuses?: NodeStatus[];
    /** Filter by difficulty (for courses) */
    difficulties?: DifficultyLevel[];
    /** Filter by skills (for courses) */
    skills?: string[];
    /** Filter by estimated hours range */
    estimatedHoursRange?: { min?: number; max?: number };
    /** Filter by progress range (0-100) */
    progressRange?: { min?: number; max?: number };
    /** Filter by parent node ID */
    parentId?: string | null;
    /** Filter by domain ID */
    domainId?: string;
    /** Text search query (pre-filtered by search engine) */
    searchQuery?: string;
}

/**
 * Filter combination mode
 */
export type FilterMode = "AND" | "OR";

/**
 * Available filter facet with counts
 */
export interface FilterFacet<T> {
    /** Facet value */
    value: T;
    /** Display label */
    label: string;
    /** Number of nodes matching this value */
    count: number;
    /** Whether this value is currently selected */
    selected: boolean;
}

/**
 * All available facets for the current node set
 */
export interface FilterFacets {
    levels: FilterFacet<NodeLevel>[];
    statuses: FilterFacet<NodeStatus>[];
    difficulties: FilterFacet<DifficultyLevel>[];
    skills: FilterFacet<string>[];
    domains: FilterFacet<string>[];
}

/**
 * Filter result with metadata
 */
export interface FilterResult {
    /** Filtered nodes */
    nodes: MapNode[];
    /** Total count before filtering */
    totalCount: number;
    /** Available facets based on filtered results */
    facets: FilterFacets;
}

/**
 * MapFilterEngine - Faceted filtering for the hex map
 *
 * Provides:
 * - Multi-faceted filtering with AND/OR logic
 * - Dynamic facet counts based on current results
 * - Efficient bitset-style filtering for large datasets
 * - Range filters for numeric values
 */
export class MapFilterEngine {
    private nodes: MapNode[];
    private nodeMap: Map<string, MapNode>;

    constructor(nodes: MapNode[] = []) {
        this.nodes = nodes;
        this.nodeMap = new Map(nodes.map(n => [n.id, n]));
    }

    /**
     * Update the filter index with new nodes
     */
    updateIndex(nodes: MapNode[]): void {
        this.nodes = nodes;
        this.nodeMap = new Map(nodes.map(n => [n.id, n]));
    }

    /**
     * Apply filters to the node set
     */
    filter(
        criteria: FilterCriteria,
        mode: FilterMode = "AND",
        sourceNodes?: MapNode[]
    ): FilterResult {
        const nodesToFilter = sourceNodes ?? this.nodes;
        const totalCount = nodesToFilter.length;

        // Build filter predicates
        const predicates = this.buildPredicates(criteria);

        // Apply filters
        let filteredNodes: MapNode[];
        if (predicates.length === 0) {
            filteredNodes = nodesToFilter;
        } else if (mode === "AND") {
            filteredNodes = nodesToFilter.filter(node =>
                predicates.every(pred => pred(node))
            );
        } else {
            filteredNodes = nodesToFilter.filter(node =>
                predicates.some(pred => pred(node))
            );
        }

        // Compute facets from filtered results
        const facets = this.computeFacets(filteredNodes, criteria);

        return {
            nodes: filteredNodes,
            totalCount,
            facets,
        };
    }

    /**
     * Get available facets without filtering
     */
    getFacets(sourceNodes?: MapNode[]): FilterFacets {
        const nodesToAnalyze = sourceNodes ?? this.nodes;
        return this.computeFacets(nodesToAnalyze, {});
    }

    /**
     * Get unique skills from all course nodes
     */
    getAllSkills(): string[] {
        const skillSet = new Set<string>();
        for (const node of this.nodes) {
            if ("skills" in node && (node as CourseNode).skills) {
                for (const skill of (node as CourseNode).skills!) {
                    skillSet.add(skill);
                }
            }
        }
        return Array.from(skillSet).sort();
    }

    /**
     * Get unique domains from all nodes
     */
    getAllDomains(): string[] {
        const domainSet = new Set<string>();
        for (const node of this.nodes) {
            if (node.domainId) {
                domainSet.add(node.domainId);
            }
        }
        return Array.from(domainSet).sort();
    }

    /**
     * Get a node by ID
     */
    getNode(id: string): MapNode | undefined {
        return this.nodeMap.get(id);
    }

    /**
     * Build filter predicates from criteria
     */
    private buildPredicates(criteria: FilterCriteria): ((node: MapNode) => boolean)[] {
        const predicates: ((node: MapNode) => boolean)[] = [];

        // Level filter
        if (criteria.levels && criteria.levels.length > 0) {
            const levelSet = new Set(criteria.levels);
            predicates.push(node => levelSet.has(node.level));
        }

        // Status filter
        if (criteria.statuses && criteria.statuses.length > 0) {
            const statusSet = new Set(criteria.statuses);
            predicates.push(node => statusSet.has(node.status));
        }

        // Difficulty filter (for courses)
        if (criteria.difficulties && criteria.difficulties.length > 0) {
            const difficultySet = new Set(criteria.difficulties);
            predicates.push(node => {
                if (node.level !== "course") return false;
                return difficultySet.has((node as CourseNode).difficulty);
            });
        }

        // Skills filter (for courses)
        if (criteria.skills && criteria.skills.length > 0) {
            const skillSet = new Set(criteria.skills.map(s => s.toLowerCase()));
            predicates.push(node => {
                if (!("skills" in node) || !(node as CourseNode).skills) return false;
                return (node as CourseNode).skills!.some(s =>
                    skillSet.has(s.toLowerCase())
                );
            });
        }

        // Estimated hours range
        if (criteria.estimatedHoursRange) {
            const { min, max } = criteria.estimatedHoursRange;
            predicates.push(node => {
                const hours = node.estimatedHours;
                if (hours === undefined) return false;
                if (min !== undefined && hours < min) return false;
                if (max !== undefined && hours > max) return false;
                return true;
            });
        }

        // Progress range
        if (criteria.progressRange) {
            const { min, max } = criteria.progressRange;
            predicates.push(node => {
                const progress = node.progress ?? 0;
                if (min !== undefined && progress < min) return false;
                if (max !== undefined && progress > max) return false;
                return true;
            });
        }

        // Parent ID filter
        if (criteria.parentId !== undefined) {
            predicates.push(node => node.parentId === criteria.parentId);
        }

        // Domain ID filter
        if (criteria.domainId) {
            predicates.push(node => node.domainId === criteria.domainId);
        }

        return predicates;
    }

    /**
     * Compute facets from a set of nodes
     */
    private computeFacets(nodes: MapNode[], selectedCriteria: FilterCriteria): FilterFacets {
        // Level facets
        const levelCounts = new Map<NodeLevel, number>();
        const statusCounts = new Map<NodeStatus, number>();
        const difficultyCounts = new Map<DifficultyLevel, number>();
        const skillCounts = new Map<string, number>();
        const domainCounts = new Map<string, number>();

        for (const node of nodes) {
            // Level
            levelCounts.set(node.level, (levelCounts.get(node.level) ?? 0) + 1);

            // Status
            statusCounts.set(node.status, (statusCounts.get(node.status) ?? 0) + 1);

            // Difficulty (courses only)
            if (node.level === "course") {
                const difficulty = (node as CourseNode).difficulty;
                difficultyCounts.set(difficulty, (difficultyCounts.get(difficulty) ?? 0) + 1);
            }

            // Skills (courses only)
            if ("skills" in node && (node as CourseNode).skills) {
                for (const skill of (node as CourseNode).skills!) {
                    skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1);
                }
            }

            // Domain
            if (node.domainId) {
                domainCounts.set(node.domainId, (domainCounts.get(node.domainId) ?? 0) + 1);
            }
        }

        const selectedLevels = new Set(selectedCriteria.levels ?? []);
        const selectedStatuses = new Set(selectedCriteria.statuses ?? []);
        const selectedDifficulties = new Set(selectedCriteria.difficulties ?? []);
        const selectedSkills = new Set((selectedCriteria.skills ?? []).map(s => s.toLowerCase()));
        const selectedDomain = selectedCriteria.domainId;

        return {
            levels: this.buildLevelFacets(levelCounts, selectedLevels),
            statuses: this.buildStatusFacets(statusCounts, selectedStatuses),
            difficulties: this.buildDifficultyFacets(difficultyCounts, selectedDifficulties),
            skills: this.buildSkillFacets(skillCounts, selectedSkills),
            domains: this.buildDomainFacets(domainCounts, selectedDomain),
        };
    }

    private buildLevelFacets(
        counts: Map<NodeLevel, number>,
        selected: Set<NodeLevel>
    ): FilterFacet<NodeLevel>[] {
        const levels: NodeLevel[] = ["domain", "course", "chapter", "section", "concept"];
        const labels: Record<NodeLevel, string> = {
            domain: "Domains",
            course: "Courses",
            chapter: "Chapters",
            section: "Sections",
            concept: "Concepts",
        };

        return levels.map(level => ({
            value: level,
            label: labels[level],
            count: counts.get(level) ?? 0,
            selected: selected.has(level),
        }));
    }

    private buildStatusFacets(
        counts: Map<NodeStatus, number>,
        selected: Set<NodeStatus>
    ): FilterFacet<NodeStatus>[] {
        const statuses: NodeStatus[] = ["completed", "in_progress", "available", "locked"];
        const labels: Record<NodeStatus, string> = {
            completed: "Completed",
            in_progress: "In Progress",
            available: "Available",
            locked: "Locked",
        };

        return statuses.map(status => ({
            value: status,
            label: labels[status],
            count: counts.get(status) ?? 0,
            selected: selected.has(status),
        }));
    }

    private buildDifficultyFacets(
        counts: Map<DifficultyLevel, number>,
        selected: Set<DifficultyLevel>
    ): FilterFacet<DifficultyLevel>[] {
        const difficulties: DifficultyLevel[] = ["beginner", "intermediate", "advanced"];
        const labels: Record<DifficultyLevel, string> = {
            beginner: "Beginner",
            intermediate: "Intermediate",
            advanced: "Advanced",
        };

        return difficulties.map(difficulty => ({
            value: difficulty,
            label: labels[difficulty],
            count: counts.get(difficulty) ?? 0,
            selected: selected.has(difficulty),
        }));
    }

    private buildSkillFacets(
        counts: Map<string, number>,
        selected: Set<string>
    ): FilterFacet<string>[] {
        return Array.from(counts.entries())
            .map(([skill, count]) => ({
                value: skill,
                label: skill,
                count,
                selected: selected.has(skill.toLowerCase()),
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); // Limit to top 20 skills
    }

    private buildDomainFacets(
        counts: Map<string, number>,
        selected?: string
    ): FilterFacet<string>[] {
        const domainLabels: Record<string, string> = {
            frontend: "Frontend",
            backend: "Backend",
            fullstack: "Full Stack",
            mobile: "Mobile",
            data: "Data Science",
            devops: "DevOps",
            games: "Game Dev",
            databases: "Databases",
        };

        return Array.from(counts.entries())
            .map(([domain, count]) => ({
                value: domain,
                label: domainLabels[domain] ?? domain,
                count,
                selected: selected === domain,
            }))
            .sort((a, b) => b.count - a.count);
    }
}

/**
 * Singleton filter engine instance
 */
let filterEngineInstance: MapFilterEngine | null = null;

/**
 * Get or create the filter engine instance
 */
export function getFilterEngine(): MapFilterEngine {
    if (!filterEngineInstance) {
        filterEngineInstance = new MapFilterEngine();
    }
    return filterEngineInstance;
}

/**
 * Reset the filter engine (useful for testing)
 */
export function resetFilterEngine(): void {
    filterEngineInstance = null;
}
