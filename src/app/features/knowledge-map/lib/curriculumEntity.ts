/**
 * Unified Curriculum Entity Type
 *
 * This module defines the canonical base type for all learnable units in the system.
 * It unifies PredictiveModule (from Oracle) and MapNode (from Knowledge Map) into
 * a single CurriculumEntity type that both systems can consume directly.
 *
 * Key insight: PredictiveModule and MapNode express the same concept - a learnable
 * unit with skills, duration, and ordering. This unification eliminates the mapping
 * layer (mapModuleToHypotheticalNode, mapPathToHypotheticalNodes) and enables direct
 * interoperability between Oracle paths and map visualization.
 *
 * The hypothetical/real distinction is captured by a single 'materialization' status flag.
 */

import type { LearningDomainId, DomainColorKey } from "@/app/shared/lib/learningDomains";
import type { DemandTrend, LearningWindow } from "@/app/features/goal-path/lib/predictiveTypes";
import type { NodeLevel, DifficultyLevel, NodeStatus } from "./types";

// ============================================================================
// MATERIALIZATION STATUS
// ============================================================================

/**
 * Materialization status indicates whether a curriculum entity exists
 * in the knowledge map or is proposed/hypothetical.
 *
 * - 'materialized': Entity exists in the database, visible on the map as a real node
 * - 'proposed': Entity is suggested by Oracle but not yet created (hypothetical)
 * - 'forging': Entity is being created (transition state during confirmation)
 */
export type MaterializationStatus = "materialized" | "proposed" | "forging";

// ============================================================================
// CURRICULUM ENTITY BASE TYPE
// ============================================================================

/**
 * Base interface for all curriculum entities.
 * This is the unified type that both Oracle paths and Knowledge Map can consume.
 *
 * Design principles:
 * - All fields required by both PredictiveModule and MapNode are included
 * - Optional fields support features from either source
 * - Materialization status replaces the separate HypotheticalMapNode type
 */
export interface CurriculumEntityBase {
    /**
     * Unique identifier for the entity.
     * For proposed entities: prefixed with 'proposed-' (e.g., 'proposed-module-123')
     * For materialized entities: the actual database ID
     */
    id: string;

    /**
     * Display name/title of the learning unit
     */
    title: string;

    /**
     * Description text explaining what this unit covers
     */
    description: string;

    /**
     * Skills taught or required by this unit
     */
    skills: string[];

    /**
     * Estimated hours to complete
     */
    estimatedHours: number;

    /**
     * Materialization status - whether this entity is real or proposed
     */
    materialization: MaterializationStatus;

    /**
     * Sequence/order within a path or parent container
     */
    sequence: number;

    /**
     * Learning domain this entity belongs to
     */
    domainId: LearningDomainId;

    /**
     * Color key for visual theming
     */
    color: DomainColorKey;

    /**
     * Prerequisite entity IDs that must be completed first
     */
    prerequisites: string[];
}

// ============================================================================
// CURRICULUM ENTITY WITH MAP PROPERTIES
// ============================================================================

/**
 * Curriculum entity extended with Knowledge Map properties.
 * Used when the entity needs to be rendered on the map.
 */
export interface CurriculumEntityWithMap extends CurriculumEntityBase {
    /**
     * Node hierarchy level for map rendering
     */
    level: NodeLevel;

    /**
     * Difficulty level
     */
    difficulty: DifficultyLevel;

    /**
     * Position for layout (computed)
     */
    position: { x: number; y: number };

    /**
     * Parent node ID for hierarchy traversal
     */
    parentId: string | null;

    /**
     * Completion/availability status for map visualization
     * For proposed entities, this is typically 'available'
     */
    status: NodeStatus;

    /**
     * Progress percentage (0-100)
     */
    progress: number;
}

// ============================================================================
// CURRICULUM ENTITY WITH ORACLE PROPERTIES
// ============================================================================

/**
 * Curriculum entity extended with Oracle/predictive properties.
 * Used when the entity comes from AI path generation.
 */
export interface CurriculumEntityWithOracle extends CurriculumEntityBase {
    /**
     * Why this module is recommended at this point in the path
     */
    reasoning: string;

    /**
     * Market demand for skills in this module
     */
    skillDemand: DemandTrend;

    /**
     * Optimal learning window recommendation
     */
    optimalWindow?: LearningWindow;

    /**
     * Source module ID from Oracle (for tracking origin)
     */
    sourceModuleId?: string;
}

// ============================================================================
// FULL CURRICULUM ENTITY (BOTH MAP + ORACLE)
// ============================================================================

/**
 * Full curriculum entity with both Map and Oracle properties.
 * This is the complete unified type that supports all features.
 */
export interface CurriculumEntity extends CurriculumEntityWithMap, CurriculumEntityWithOracle {
    /**
     * Child entity IDs (for hierarchy traversal)
     */
    childIds: string[];

    /**
     * XP reward for completion
     */
    xpReward?: number;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if an entity is proposed (not yet created in the database)
 */
export function isProposed(entity: CurriculumEntityBase): boolean {
    return entity.materialization === "proposed";
}

/**
 * Check if an entity is materialized (exists in the database)
 */
export function isMaterialized(entity: CurriculumEntityBase): boolean {
    return entity.materialization === "materialized";
}

/**
 * Check if an entity is currently being forged (created)
 */
export function isForging(entity: CurriculumEntityBase): boolean {
    return entity.materialization === "forging";
}

/**
 * Check if an entity has Oracle properties
 */
export function hasOracleProperties(
    entity: CurriculumEntityBase
): entity is CurriculumEntityWithOracle {
    return "reasoning" in entity && "skillDemand" in entity;
}

/**
 * Check if an entity has Map properties
 */
export function hasMapProperties(
    entity: CurriculumEntityBase
): entity is CurriculumEntityWithMap {
    return "level" in entity && "position" in entity && "parentId" in entity;
}

/**
 * Check if an entity is a full CurriculumEntity
 */
export function isFullCurriculumEntity(
    entity: CurriculumEntityBase
): entity is CurriculumEntity {
    return hasOracleProperties(entity) && hasMapProperties(entity);
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a proposed curriculum entity from Oracle module data
 */
export function createProposedEntity(params: {
    id: string;
    title: string;
    description: string;
    skills: string[];
    estimatedHours: number;
    sequence: number;
    domainId: LearningDomainId;
    color: DomainColorKey;
    prerequisites?: string[];
    reasoning?: string;
    skillDemand?: DemandTrend;
    optimalWindow?: LearningWindow;
    sourceModuleId?: string;
}): CurriculumEntityWithOracle {
    return {
        id: params.id.startsWith("proposed-") ? params.id : `proposed-${params.id}`,
        title: params.title,
        description: params.description,
        skills: params.skills,
        estimatedHours: params.estimatedHours,
        materialization: "proposed",
        sequence: params.sequence,
        domainId: params.domainId,
        color: params.color,
        prerequisites: params.prerequisites ?? [],
        reasoning: params.reasoning ?? "",
        skillDemand: params.skillDemand ?? "stable",
        optimalWindow: params.optimalWindow,
        sourceModuleId: params.sourceModuleId,
    };
}

/**
 * Create a materialized curriculum entity from database/map data
 */
export function createMaterializedEntity(params: {
    id: string;
    title: string;
    description: string;
    skills: string[];
    estimatedHours: number;
    sequence: number;
    domainId: LearningDomainId;
    color: DomainColorKey;
    level: NodeLevel;
    difficulty: DifficultyLevel;
    position: { x: number; y: number };
    parentId: string | null;
    status?: NodeStatus;
    progress?: number;
    prerequisites?: string[];
}): CurriculumEntityWithMap {
    return {
        id: params.id,
        title: params.title,
        description: params.description,
        skills: params.skills,
        estimatedHours: params.estimatedHours,
        materialization: "materialized",
        sequence: params.sequence,
        domainId: params.domainId,
        color: params.color,
        level: params.level,
        difficulty: params.difficulty,
        position: params.position,
        parentId: params.parentId,
        status: params.status ?? "available",
        progress: params.progress ?? 0,
        prerequisites: params.prerequisites ?? [],
    };
}

/**
 * Create a full curriculum entity with all properties
 */
export function createFullEntity(params: {
    id: string;
    title: string;
    description: string;
    skills: string[];
    estimatedHours: number;
    materialization: MaterializationStatus;
    sequence: number;
    domainId: LearningDomainId;
    color: DomainColorKey;
    level: NodeLevel;
    difficulty: DifficultyLevel;
    position: { x: number; y: number };
    parentId: string | null;
    status?: NodeStatus;
    progress?: number;
    prerequisites?: string[];
    reasoning?: string;
    skillDemand?: DemandTrend;
    optimalWindow?: LearningWindow;
    sourceModuleId?: string;
    childIds?: string[];
    xpReward?: number;
}): CurriculumEntity {
    return {
        id: params.id,
        title: params.title,
        description: params.description,
        skills: params.skills,
        estimatedHours: params.estimatedHours,
        materialization: params.materialization,
        sequence: params.sequence,
        domainId: params.domainId,
        color: params.color,
        level: params.level,
        difficulty: params.difficulty,
        position: params.position,
        parentId: params.parentId,
        status: params.status ?? "available",
        progress: params.progress ?? 0,
        prerequisites: params.prerequisites ?? [],
        reasoning: params.reasoning ?? "",
        skillDemand: params.skillDemand ?? "stable",
        optimalWindow: params.optimalWindow,
        sourceModuleId: params.sourceModuleId,
        childIds: params.childIds ?? [],
        xpReward: params.xpReward,
    };
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Add map properties to an Oracle entity to make it renderable on the map
 */
export function addMapProperties(
    entity: CurriculumEntityWithOracle,
    mapProps: {
        level: NodeLevel;
        difficulty: DifficultyLevel;
        position: { x: number; y: number };
        parentId: string | null;
        status?: NodeStatus;
        progress?: number;
    }
): CurriculumEntity {
    return {
        ...entity,
        level: mapProps.level,
        difficulty: mapProps.difficulty,
        position: mapProps.position,
        parentId: mapProps.parentId,
        status: mapProps.status ?? "available",
        progress: mapProps.progress ?? 0,
        childIds: [],
    };
}

/**
 * Add Oracle properties to a Map entity to include AI-generated metadata
 */
export function addOracleProperties(
    entity: CurriculumEntityWithMap,
    oracleProps: {
        reasoning: string;
        skillDemand: DemandTrend;
        optimalWindow?: LearningWindow;
        sourceModuleId?: string;
    }
): CurriculumEntity {
    return {
        ...entity,
        reasoning: oracleProps.reasoning,
        skillDemand: oracleProps.skillDemand,
        optimalWindow: oracleProps.optimalWindow,
        sourceModuleId: oracleProps.sourceModuleId,
        childIds: [],
    };
}

/**
 * Transition a proposed entity to forging status
 */
export function startForging(entity: CurriculumEntityBase): CurriculumEntityBase {
    return {
        ...entity,
        materialization: "forging",
    };
}

/**
 * Transition an entity to materialized status (after creation)
 */
export function materialize(
    entity: CurriculumEntityBase,
    realId: string
): CurriculumEntityBase {
    return {
        ...entity,
        id: realId,
        materialization: "materialized",
    };
}
