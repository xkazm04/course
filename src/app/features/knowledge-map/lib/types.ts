/**
 * Unified Knowledge Map Types
 *
 * This module defines the type system for the drill-down knowledge map
 * with 5 hierarchy levels and card-based node visualization.
 *
 * Hierarchy:
 * - Domain: Learning domains (Frontend, Backend, etc.)
 * - Course: Individual courses within a domain
 * - Chapter: Chapters within a course
 * - Section: Sections/lessons within a chapter (implements LearningNodeBase pattern)
 * - Concept: Individual concepts within a section
 *
 * Integration with LearningNode:
 * - MapNodeBase aligns with LearningNodeBase from ./learningNode.ts
 * - SectionNode at the "section" level corresponds to ChapterSection
 * - This enables unified curriculum DAG integration
 *
 * @see ./learningNode.ts for the canonical LearningNode base types
 */

import type { LearningDomainId, DomainColorKey } from "@/app/shared/lib/learningDomains";
import type { LucideIcon } from "lucide-react";
import type { LearningNodeStatus, LearningContentType } from "./learningNode";

// ============================================================================
// HIERARCHY & STATUS TYPES
// ============================================================================

/**
 * Node hierarchy levels - determines visual representation and drill-down depth
 */
export type NodeLevel = "domain" | "course" | "chapter" | "section" | "concept";

/**
 * Node completion/availability status - determines visual styling
 * Aligns with LearningNodeStatus from ./learningNode.ts
 * @see LearningNodeStatus for the canonical definition
 */
export type NodeStatus = "completed" | "in_progress" | "available" | "locked";

/**
 * Type assertion that NodeStatus is compatible with LearningNodeStatus
 * (minus 'skipped' which is not used in map visualization)
 */
type _NodeStatusCheck = Exclude<LearningNodeStatus, "skipped"> extends NodeStatus ? true : never;

/**
 * Difficulty level for courses
 */
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

/**
 * Section content types
 * Aligns with LearningContentType from ./learningNode.ts
 * @see LearningContentType for the canonical definition
 */
export type SectionType = "video" | "lesson" | "interactive" | "exercise" | "quiz";

/**
 * Type assertion that SectionType is compatible with LearningContentType
 */
type _SectionTypeCheck = SectionType extends LearningContentType ? true : never;

/**
 * Concept content types
 */
export type ConceptType = "definition" | "example" | "practice" | "quiz-question";

// ============================================================================
// MAP NODE TYPES
// ============================================================================

/**
 * Base interface for all map nodes
 *
 * This interface aligns with LearningNodeBase from ./learningNode.ts:
 * - id -> LearningNodeBase.id
 * - name -> LearningNodeBase.title
 * - status -> LearningNodeBase.status (NodeStatus is compatible with LearningNodeStatus)
 * - progress -> LearningNodeBase.progress
 * - description -> LearningNodeWithDomain.description
 * - domainId -> LearningNodeWithDomain.domainId
 * - color -> LearningNodeWithDomain.color
 * - parentId/childIds -> LearningNodeWithRelations
 *
 * @see LearningNodeBase for the canonical learning node type
 */
export interface MapNodeBase {
    /** Unique identifier (maps to LearningNodeBase.id) */
    id: string;
    /** Node hierarchy level */
    level: NodeLevel;
    /** Display name (maps to LearningNodeBase.title) */
    name: string;
    /** Description text (maps to LearningNodeWithDomain.description) */
    description: string;
    /** Completion status (compatible with LearningNodeStatus) */
    status: NodeStatus;
    /** Progress percentage (0-100) - same as LearningNodeBase.progress */
    progress: number;
    /** Parent node ID (null for top-level domains) - same as LearningNodeWithRelations.parentId */
    parentId: string | null;
    /** Child node IDs - same as LearningNodeWithRelations.childIds */
    childIds: string[];
    /** Color key for theming - same as LearningNodeWithDomain.color */
    color: DomainColorKey;
    /** Learning domain this node belongs to - same as LearningNodeWithDomain.domainId */
    domainId: LearningDomainId;
    /** Estimated hours to complete */
    estimatedHours?: number;
    /** Position for layout (computed) */
    position?: { x: number; y: number };
}

/**
 * Domain node - top-level learning domain
 */
export interface DomainNode extends MapNodeBase {
    level: "domain";
    /** Total courses in this domain */
    courseCount: number;
    /** Total estimated hours for all courses */
    totalHours: number;
    /** Icon for the domain */
    icon?: LucideIcon;
}

/**
 * Course node - individual course within a domain
 */
export interface CourseNode extends MapNodeBase {
    level: "course";
    /** Course difficulty */
    difficulty: DifficultyLevel;
    /** Number of chapters */
    chapterCount: number;
    /** Skills taught in this course */
    skills?: string[];
}

/**
 * Chapter node - chapter within a course
 */
export interface ChapterNode extends MapNodeBase {
    level: "chapter";
    /** Course ID this chapter belongs to */
    courseId: string;
    /** Number of sections */
    sectionCount: number;
    /** XP reward for completion */
    xpReward?: number;
    /** Duration in minutes */
    durationMinutes?: number;
}

/**
 * Section node - section/lesson within a chapter
 */
export interface SectionNode extends MapNodeBase {
    level: "section";
    /** Course ID */
    courseId: string;
    /** Chapter ID this section belongs to */
    chapterId: string;
    /** Type of section content */
    sectionType: SectionType;
    /** Duration string (e.g., "10 min") */
    duration?: string;
}

/**
 * Concept node - individual concept within a section
 */
export interface ConceptNode extends MapNodeBase {
    level: "concept";
    /** Section ID this concept belongs to */
    sectionId: string;
    /** Type of concept */
    conceptType: ConceptType;
    /** Short concept content/preview */
    content?: string;
    /** Related concept IDs */
    relatedConcepts?: string[];
}

/**
 * Union type for all map nodes
 */
export type MapNode = DomainNode | CourseNode | ChapterNode | SectionNode | ConceptNode;

// ============================================================================
// CONNECTION TYPES
// ============================================================================

/**
 * Connection type between nodes
 */
export type ConnectionType = "contains" | "prerequisite" | "related" | "next";

/**
 * Connection between two map nodes
 */
export interface MapConnection {
    /** Unique identifier */
    id: string;
    /** Source node ID */
    fromId: string;
    /** Target node ID */
    toId: string;
    /** Connection type */
    type: ConnectionType;
    /** Optional label */
    label?: string;
}

// ============================================================================
// NAVIGATION STATE
// ============================================================================

/**
 * Breadcrumb item for navigation trail
 */
export interface BreadcrumbItem {
    /** Node ID (null for root) */
    nodeId: string | null;
    /** Display label */
    label: string;
    /** Node level */
    level: NodeLevel | "root";
}

/**
 * Navigation state for drill-down behavior
 */
export interface NavigationState {
    /** Stack of parent node IDs (breadcrumb trail) */
    viewStack: string[];
    /** Current view's parent node ID (null = root/domains view) */
    currentParentId: string | null;
    /** Currently selected node for details panel */
    selectedNodeId: string | null;
}

// ============================================================================
// VIEWPORT STATE
// ============================================================================

/**
 * Viewport state for pan/zoom within a level
 */
export interface ViewportState {
    /** Current zoom scale (0.5 to 2.0) */
    scale: number;
    /** X offset for panning */
    offsetX: number;
    /** Y offset for panning */
    offsetY: number;
}

/**
 * 2D point
 */
export interface Point {
    x: number;
    y: number;
}

// ============================================================================
// LAYOUT CONFIGURATION
// ============================================================================

/**
 * Layout configuration per hierarchy level
 */
export interface LevelLayoutConfig {
    /** Number of columns in grid */
    columns: number;
    /** Node card width in pixels */
    nodeWidth: number;
    /** Node card height in pixels */
    nodeHeight: number;
    /** Gap between nodes in pixels */
    gap: number;
}

/**
 * Layout configuration for all levels
 *
 * Compact card design with smaller dimensions for better visual density.
 * Based on proven patterns from KnowledgeMapNode (160px cards).
 */
export const LAYOUT_CONFIG: Record<NodeLevel, LevelLayoutConfig> = {
    domain: { columns: 4, nodeWidth: 180, nodeHeight: 90, gap: 32 },
    course: { columns: 4, nodeWidth: 170, nodeHeight: 85, gap: 28 },
    chapter: { columns: 5, nodeWidth: 160, nodeHeight: 80, gap: 24 },
    section: { columns: 5, nodeWidth: 150, nodeHeight: 75, gap: 22 },
    concept: { columns: 6, nodeWidth: 140, nodeHeight: 70, gap: 20 },
};

// ============================================================================
// KNOWLEDGE MAP DATA
// ============================================================================

/**
 * Complete knowledge map data structure
 */
export interface KnowledgeMapData {
    /** All nodes indexed by ID */
    nodes: Map<string, MapNode>;
    /** All connections */
    connections: MapConnection[];
    /** Root domain node IDs */
    rootNodeIds: string[];
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

/**
 * Props for the main KnowledgeMap component
 */
export interface KnowledgeMapProps {
    /** Height of the map container */
    height?: string;
    /** Initial domain to focus on */
    initialDomainId?: LearningDomainId;
    /** Callback when a node is selected */
    onNodeSelect?: (node: MapNode | null) => void;
    /** Callback when starting to learn a node */
    onStartLearning?: (nodeId: string) => void;
    /** Theme mode */
    theme?: "light" | "dark";
    /** Hypothetical nodes to render on the map */
    hypotheticalNodes?: HypotheticalMapNode[];
}

// ============================================================================
// STATUS STYLING
// ============================================================================

/**
 * Status styling configuration
 */
export interface StatusConfig {
    /** Background Tailwind class */
    bgClass: string;
    /** Border Tailwind class */
    borderClass: string;
    /** Text Tailwind class */
    textClass: string;
    /** Icon component name */
    iconName: "Check" | "Play" | "CircleDot" | "Lock";
    /** Icon Tailwind class */
    iconClass: string;
    /** Optional pulse animation class */
    pulseClass?: string;
}

/**
 * Status styling configurations
 */
export const STATUS_CONFIG: Record<NodeStatus, StatusConfig> = {
    completed: {
        bgClass: "bg-[var(--forge-success)]/10",
        borderClass: "border-[var(--forge-success)]/50",
        textClass: "text-[var(--forge-success)]",
        iconName: "Check",
        iconClass: "text-[var(--forge-success)]",
    },
    in_progress: {
        bgClass: "bg-[var(--ember)]/10",
        borderClass: "border-[var(--ember)]/50",
        textClass: "text-[var(--ember)]",
        iconName: "Play",
        iconClass: "text-[var(--ember)]",
        pulseClass: "animate-pulse",
    },
    available: {
        bgClass: "bg-[var(--forge-bg-workshop)]",
        borderClass: "border-[var(--forge-border-subtle)]",
        textClass: "text-[var(--forge-text-primary)]",
        iconName: "CircleDot",
        iconClass: "text-[var(--forge-text-muted)]",
    },
    locked: {
        bgClass: "bg-[var(--forge-bg-anvil)]",
        borderClass: "border-[var(--forge-border-subtle)]",
        textClass: "text-[var(--forge-text-muted)]",
        iconName: "Lock",
        iconClass: "text-[var(--forge-text-muted)]",
    },
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isDomainNode(node: MapNode): node is DomainNode {
    return node.level === "domain";
}

export function isCourseNode(node: MapNode): node is CourseNode {
    return node.level === "course";
}

export function isChapterNode(node: MapNode): node is ChapterNode {
    return node.level === "chapter";
}

export function isSectionNode(node: MapNode): node is SectionNode {
    return node.level === "section";
}

export function isConceptNode(node: MapNode): node is ConceptNode {
    return node.level === "concept";
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the next level in the hierarchy
 */
export function getNextLevel(level: NodeLevel): NodeLevel | null {
    const hierarchy: NodeLevel[] = ["domain", "course", "chapter", "section", "concept"];
    const index = hierarchy.indexOf(level);
    return index < hierarchy.length - 1 ? hierarchy[index + 1] : null;
}

/**
 * Get the previous level in the hierarchy
 */
export function getPreviousLevel(level: NodeLevel): NodeLevel | null {
    const hierarchy: NodeLevel[] = ["domain", "course", "chapter", "section", "concept"];
    const index = hierarchy.indexOf(level);
    return index > 0 ? hierarchy[index - 1] : null;
}

/**
 * Get level depth (0 = domain, 4 = concept)
 */
export function getLevelDepth(level: NodeLevel): number {
    const depths: Record<NodeLevel, number> = {
        domain: 0,
        course: 1,
        chapter: 2,
        section: 3,
        concept: 4,
    };
    return depths[level];
}

/**
 * Get human-readable label for a level
 */
export function getLevelLabel(level: NodeLevel, plural = false): string {
    const labels: Record<NodeLevel, { singular: string; plural: string }> = {
        domain: { singular: "Domain", plural: "Domains" },
        course: { singular: "Course", plural: "Courses" },
        chapter: { singular: "Chapter", plural: "Chapters" },
        section: { singular: "Section", plural: "Sections" },
        concept: { singular: "Concept", plural: "Concepts" },
    };
    return plural ? labels[level].plural : labels[level].singular;
}

/**
 * Get child count label for a node
 */
export function getChildCountLabel(node: MapNode): string {
    if (isDomainNode(node)) {
        return `${node.courseCount} ${getLevelLabel("course", node.courseCount !== 1)}`;
    }
    if (isCourseNode(node)) {
        return `${node.chapterCount} ${getLevelLabel("chapter", node.chapterCount !== 1)}`;
    }
    if (isChapterNode(node)) {
        return `${node.sectionCount} ${getLevelLabel("section", node.sectionCount !== 1)}`;
    }
    return "";
}

// ============================================================================
// ORACLE INTEGRATION TYPES
// ============================================================================

/**
 * Visual mode for nodes when Oracle is active
 */
export type NodeVisualMode = "normal" | "recommended" | "hypothetical";

/**
 * Styling configuration for node visual modes
 */
export interface NodeVisualModeConfig {
    /** Ring/glow class for recommended nodes */
    ringClass: string;
    /** Glow/shadow class */
    glowClass: string;
    /** Border class for hypothetical nodes */
    borderClass: string;
    /** Opacity class */
    opacityClass: string;
    /** Pulse animation class */
    pulseClass?: string;
}

/**
 * Visual mode styling configurations
 */
export const NODE_VISUAL_MODE_CONFIG: Record<NodeVisualMode, NodeVisualModeConfig> = {
    normal: {
        ringClass: "",
        glowClass: "",
        borderClass: "",
        opacityClass: "",
    },
    recommended: {
        ringClass: "ring-2 ring-[var(--ember)]/60",
        glowClass: "shadow-lg shadow-[var(--ember)]/30",
        borderClass: "border-[var(--ember)]",
        opacityClass: "",
        pulseClass: "animate-pulse-subtle",
    },
    hypothetical: {
        ringClass: "",
        glowClass: "",
        borderClass: "border-dashed border-2 border-[var(--forge-text-muted)]",
        opacityClass: "opacity-60",
    },
};

/**
 * A hypothetical node that doesn't exist yet in the knowledge map
 * Generated by the Oracle for skills not covered by existing courses
 */
export interface HypotheticalMapNode {
    /** Unique identifier (prefixed with 'hypothetical-') */
    id: string;
    /** Node hierarchy level (typically 'course' or 'chapter') */
    level: NodeLevel;
    /** Display name */
    name: string;
    /** Description text */
    description: string;
    /** Skills this node would teach */
    skills: string[];
    /** Estimated hours to complete */
    estimatedHours: number;
    /** Color key for theming */
    color: DomainColorKey;
    /** Learning domain this node belongs to */
    domainId: LearningDomainId;
    /** Computed position for layout */
    position: { x: number; y: number };
    /** Parent node ID for placement */
    parentId: string | null;
    /** Difficulty level */
    difficulty?: DifficultyLevel;
    /** Source module from Oracle path */
    sourceModuleId?: string;

}

/**
 * Connection for recommended path visualization
 */
export interface RecommendedPathConnection {
    /** Unique identifier */
    id: string;
    /** Source node ID */
    fromId: string;
    /** Target node ID */
    toId: string;
    /** Sequence order in the path */
    sequence: number;
    /** Whether the target is a hypothetical node */
    isHypothetical: boolean;
}

/**
 * Oracle step in the bottom panel wizard
 */
export type OracleWizardStep = "skills" | "goal" | "preferences" | "generating" | "complete";

/**
 * State for the Oracle + Knowledge Map integration
 */
export interface OracleMapIntegrationState {
    /** IDs of nodes recommended by the Oracle path */
    recommendedNodeIds: Set<string>;
    /** Hypothetical nodes to be created */
    hypotheticalNodes: HypotheticalMapNode[];
    /** Recommended path connections for visualization */
    pathConnections: RecommendedPathConnection[];
    /** Whether the bottom panel is expanded */
    bottomPanelExpanded: boolean;
    /** Whether the path preview sidebar is visible */
    pathPreviewVisible: boolean;
    /** Current step in the oracle wizard */
    activeStep: OracleWizardStep;
}

/**
 * Initial state for Oracle Map integration
 */
export const INITIAL_ORACLE_MAP_STATE: OracleMapIntegrationState = {
    recommendedNodeIds: new Set(),
    hypotheticalNodes: [],
    pathConnections: [],
    bottomPanelExpanded: false,
    pathPreviewVisible: false,
    activeStep: "skills",
};
