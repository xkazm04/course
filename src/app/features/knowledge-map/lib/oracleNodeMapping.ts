/**
 * Oracle Node Mapping Utilities
 *
 * Maps Career Oracle path modules to Knowledge Map nodes.
 * Handles matching existing nodes and creating hypothetical nodes.
 *
 * NOTE: This module now integrates with the unified CurriculumEntity type.
 * The mapping functions provide backward compatibility while new code can
 * use CurriculumEntity directly.
 *
 * @see ./curriculumEntity.ts for the unified type system
 */

import type { PredictiveModule } from '@/app/features/goal-path/lib/predictiveTypes';
import type {
    MapNode,
    HypotheticalMapNode,
    RecommendedPathConnection,
    NodeLevel,
    DifficultyLevel,
    CurriculumEntity,
} from './types';
import {
    createFullEntity,
} from './curriculumEntity';
import type { LearningDomainId, DomainColorKey } from '@/app/shared/lib/learningDomains';
import { LEARNING_DOMAINS } from '@/app/shared/lib/learningDomains';

// ============================================================================
// SKILL TO DOMAIN MAPPING
// ============================================================================

/**
 * Map a skill name to its most likely learning domain
 */
export function skillToDomainId(skill: string): LearningDomainId {
    const skillLower = skill.toLowerCase();

    // Frontend skills
    if (
        skillLower.includes('react') ||
        skillLower.includes('vue') ||
        skillLower.includes('angular') ||
        skillLower.includes('css') ||
        skillLower.includes('tailwind') ||
        skillLower.includes('html') ||
        skillLower.includes('frontend') ||
        skillLower.includes('next.js') ||
        skillLower.includes('svelte')
    ) {
        return 'frontend';
    }

    // Backend skills
    if (
        skillLower.includes('node') ||
        skillLower.includes('express') ||
        skillLower.includes('fastapi') ||
        skillLower.includes('django') ||
        skillLower.includes('flask') ||
        skillLower.includes('backend') ||
        skillLower.includes('api') ||
        skillLower.includes('rest') ||
        skillLower.includes('graphql')
    ) {
        return 'backend';
    }

    // Database skills
    if (
        skillLower.includes('sql') ||
        skillLower.includes('postgres') ||
        skillLower.includes('mongo') ||
        skillLower.includes('redis') ||
        skillLower.includes('database') ||
        skillLower.includes('data')
    ) {
        return 'databases';
    }

    // DevOps/Cloud skills
    if (
        skillLower.includes('docker') ||
        skillLower.includes('kubernetes') ||
        skillLower.includes('aws') ||
        skillLower.includes('gcp') ||
        skillLower.includes('azure') ||
        skillLower.includes('ci/cd') ||
        skillLower.includes('devops') ||
        skillLower.includes('terraform')
    ) {
        return 'backend'; // DevOps often grouped with backend
    }

    // Full-stack
    if (
        skillLower.includes('fullstack') ||
        skillLower.includes('full-stack') ||
        skillLower.includes('full stack')
    ) {
        return 'fullstack';
    }

    // Mobile
    if (
        skillLower.includes('mobile') ||
        skillLower.includes('ios') ||
        skillLower.includes('android') ||
        skillLower.includes('react native') ||
        skillLower.includes('flutter')
    ) {
        return 'mobile';
    }

    // Games
    if (
        skillLower.includes('game') ||
        skillLower.includes('unity') ||
        skillLower.includes('unreal')
    ) {
        return 'games';
    }

    // Default to fullstack for general programming skills
    return 'fullstack';
}

/**
 * Get color key from domain ID
 */
export function getDomainColor(domainId: LearningDomainId): DomainColorKey {
    const domain = LEARNING_DOMAINS[domainId];
    return (domain?.color || 'indigo') as DomainColorKey;
}

// ============================================================================
// NODE MATCHING
// ============================================================================

/**
 * Find existing nodes that match the skills in Oracle path modules
 */
export function findMatchingNodes(
    modules: PredictiveModule[],
    existingNodes: MapNode[]
): string[] {
    const matchingIds: Set<string> = new Set();

    for (const pathModule of modules) {
        for (const skill of pathModule.skills) {
            const skillLower = skill.toLowerCase();

            for (const node of existingNodes) {
                const nameLower = node.name.toLowerCase();
                const descLower = node.description.toLowerCase();

                // Check if node name or description contains the skill
                if (
                    nameLower.includes(skillLower) ||
                    descLower.includes(skillLower) ||
                    skillLower.includes(nameLower.split(' ')[0]) // Partial match
                ) {
                    matchingIds.add(node.id);
                }

                // Check course skills if available
                if (node.level === 'course' && 'skills' in node && node.skills) {
                    const courseSkills = node.skills.map(s => s.toLowerCase());
                    if (courseSkills.some(cs => cs.includes(skillLower) || skillLower.includes(cs))) {
                        matchingIds.add(node.id);
                    }
                }
            }
        }
    }

    return Array.from(matchingIds);
}

/**
 * Calculate difficulty based on module sequence and skill demand
 */
function calculateDifficulty(module: PredictiveModule): DifficultyLevel {
    // Early modules are typically foundational
    if (module.sequence <= 2) {
        return 'beginner';
    }

    // Later modules are more advanced
    if (module.sequence >= 5) {
        return 'advanced';
    }

    // Use skill demand as a factor
    if (module.skillDemand === 'emerging') {
        return 'advanced';
    }

    return 'intermediate';
}

// ============================================================================
// HYPOTHETICAL NODE CREATION
// ============================================================================

/**
 * Map a single Oracle module to a hypothetical map node
 */
export function mapModuleToHypotheticalNode(
    module: PredictiveModule,
    index: number,
    existingNodes: MapNode[]
): HypotheticalMapNode {
    // Determine domain from skills
    const primarySkill = module.skills[0] || 'General';
    const domainId = skillToDomainId(primarySkill);
    const color = getDomainColor(domainId);

    // Calculate position (grid layout)
    // Place hypothetical nodes to the right of existing nodes
    const existingCourseCount = existingNodes.filter(n => n.level === 'course').length;
    const totalIndex = existingCourseCount + index;

    const columns = 4; // From LAYOUT_CONFIG.course
    const nodeWidth = 170;
    const nodeHeight = 85;
    const gap = 28;

    const row = Math.floor(totalIndex / columns);
    const col = totalIndex % columns;

    const position = {
        x: col * (nodeWidth + gap) + nodeWidth / 2,
        y: row * (nodeHeight + gap) + nodeHeight / 2,
    };

    // Find parent domain node
    const parentDomain = existingNodes.find(
        n => n.level === 'domain' && n.domainId === domainId
    );

    return {
        id: `hypothetical-${module.id}`,
        level: 'course' as NodeLevel,
        name: module.title,
        description: module.reasoning || `Learn ${module.skills.join(', ')}`,
        skills: module.skills,
        estimatedHours: module.estimatedHours,
        color,
        domainId,
        position,
        parentId: parentDomain?.id || null,
        difficulty: calculateDifficulty(module),
        sourceModuleId: module.id,
        isForging: false,
    };
}

/**
 * Map all modules from a path to hypothetical nodes
 * Filters out modules that match existing nodes
 */
export function mapPathToHypotheticalNodes(
    modules: PredictiveModule[],
    existingNodes: MapNode[]
): HypotheticalMapNode[] {
    const matchingNodeIds = findMatchingNodes(modules, existingNodes);

    // Filter modules that don't have matching nodes
    const unmatchedModules = modules.filter(module => {
        const moduleSkills = module.skills.map(s => s.toLowerCase());
        return !matchingNodeIds.some(nodeId => {
            const node = existingNodes.find(n => n.id === nodeId);
            if (!node) return false;

            const nodeName = node.name.toLowerCase();
            return moduleSkills.some(
                skill => nodeName.includes(skill) || skill.includes(nodeName.split(' ')[0])
            );
        });
    });

    return unmatchedModules.map((module, index) =>
        mapModuleToHypotheticalNode(module, index, existingNodes)
    );
}

// ============================================================================
// PATH CONNECTIONS
// ============================================================================

/**
 * Create connections between nodes in the recommended path
 */
export function mapPathToConnections(
    modules: PredictiveModule[],
    hypotheticalNodes: HypotheticalMapNode[],
    existingNodes: MapNode[]
): RecommendedPathConnection[] {
    const connections: RecommendedPathConnection[] = [];

    // Create a lookup for all nodes by skill
    const skillToNodeId = new Map<string, { id: string; isHypothetical: boolean }>();

    // Map hypothetical nodes by their skills
    for (const node of hypotheticalNodes) {
        for (const skill of node.skills) {
            skillToNodeId.set(skill.toLowerCase(), {
                id: node.id,
                isHypothetical: true,
            });
        }
    }

    // Map existing nodes (override hypothetical if same skill)
    for (const node of existingNodes) {
        const nameLower = node.name.toLowerCase();
        skillToNodeId.set(nameLower, {
            id: node.id,
            isHypothetical: false,
        });

        // Also map by skills if available
        if (node.level === 'course' && 'skills' in node && node.skills) {
            for (const skill of node.skills) {
                skillToNodeId.set(skill.toLowerCase(), {
                    id: node.id,
                    isHypothetical: false,
                });
            }
        }
    }

    // Create connections based on module sequence
    for (let i = 0; i < modules.length - 1; i++) {
        const currentModule = modules[i];
        const nextModule = modules[i + 1];

        // Find node IDs for current and next modules
        const currentSkill = currentModule.skills[0]?.toLowerCase();
        const nextSkill = nextModule.skills[0]?.toLowerCase();

        if (!currentSkill || !nextSkill) continue;

        // Look up nodes
        let fromNode = skillToNodeId.get(currentSkill);
        let toNode = skillToNodeId.get(nextSkill);

        // Fallback to hypothetical node lookup by module ID
        if (!fromNode) {
            const hypoNode = hypotheticalNodes.find(n => n.sourceModuleId === currentModule.id);
            if (hypoNode) {
                fromNode = { id: hypoNode.id, isHypothetical: true };
            }
        }

        if (!toNode) {
            const hypoNode = hypotheticalNodes.find(n => n.sourceModuleId === nextModule.id);
            if (hypoNode) {
                toNode = { id: hypoNode.id, isHypothetical: true };
            }
        }

        if (fromNode && toNode) {
            connections.push({
                id: `path-connection-${i}`,
                fromId: fromNode.id,
                toId: toNode.id,
                sequence: i + 1,
                isHypothetical: fromNode.isHypothetical || toNode.isHypothetical,
            });
        }
    }

    return connections;
}

// ============================================================================
// POSITION UTILITIES
// ============================================================================

/**
 * Calculate positions for hypothetical nodes relative to existing layout
 */
export function calculateHypotheticalPositions(
    hypotheticalNodes: HypotheticalMapNode[],
    existingNodes: MapNode[],
    canvasWidth: number
): HypotheticalMapNode[] {
    // Group hypothetical nodes by domain
    const nodesByDomain = new Map<LearningDomainId, HypotheticalMapNode[]>();

    for (const node of hypotheticalNodes) {
        const existing = nodesByDomain.get(node.domainId) || [];
        existing.push(node);
        nodesByDomain.set(node.domainId, existing);
    }

    // Find existing nodes by domain to position relative to them
    const existingByDomain = new Map<LearningDomainId, MapNode[]>();
    for (const node of existingNodes) {
        const existing = existingByDomain.get(node.domainId) || [];
        existing.push(node);
        existingByDomain.set(node.domainId, existing);
    }

    const repositionedNodes: HypotheticalMapNode[] = [];

    for (const [domainId, nodes] of nodesByDomain.entries()) {
        const existingDomainNodes = existingByDomain.get(domainId) || [];

        // Find the rightmost position in existing nodes
        let maxX = 0;
        let baseY = 100; // Default Y position

        for (const existing of existingDomainNodes) {
            if (existing.position) {
                maxX = Math.max(maxX, existing.position.x);
                baseY = existing.position.y;
            }
        }

        // Position hypothetical nodes after existing ones
        const nodeWidth = 170;
        const nodeHeight = 85;
        const gap = 28;

        nodes.forEach((node, index) => {
            const newX = maxX + (index + 1) * (nodeWidth + gap);
            const newY = baseY;

            repositionedNodes.push({
                ...node,
                position: { x: newX, y: newY },
            });
        });
    }

    return repositionedNodes;
}

// ============================================================================
// MODULE INFO HELPERS
// ============================================================================

/**
 * Get formatted duration string from hours
 */
export function formatModuleDuration(hours: number): string {
    if (hours < 1) {
        return `${Math.round(hours * 60)} min`;
    }

    if (hours < 24) {
        return `${hours} hr${hours !== 1 ? 's' : ''}`;
    }

    const days = Math.round(hours / 8); // 8-hour days
    return `${days} day${days !== 1 ? 's' : ''}`;
}

/**
 * Get skill demand indicator
 */
export function getSkillDemandIndicator(demand: string): {
    label: string;
    color: string;
    icon: string;
} {
    switch (demand) {
        case 'rising':
            return { label: 'Rising', color: 'emerald', icon: 'TrendingUp' };
        case 'emerging':
            return { label: 'Emerging', color: 'purple', icon: 'Sparkles' };
        case 'stable':
            return { label: 'Stable', color: 'blue', icon: 'Minus' };
        case 'declining':
            return { label: 'Declining', color: 'amber', icon: 'TrendingDown' };
        case 'saturating':
            return { label: 'Saturating', color: 'orange', icon: 'AlertTriangle' };
        default:
            return { label: 'Unknown', color: 'slate', icon: 'HelpCircle' };
    }
}

/**
 * Check if a module has prerequisites from previous modules
 */
export function hasPrerequisites(module: PredictiveModule): boolean {
    return module.prerequisites.length > 0;
}

/**
 * Get prerequisite skills as formatted string
 */
export function formatPrerequisites(prerequisites: string[]): string {
    if (prerequisites.length === 0) return 'None';
    if (prerequisites.length === 1) return prerequisites[0];
    if (prerequisites.length === 2) return `${prerequisites[0]} and ${prerequisites[1]}`;
    return `${prerequisites.slice(0, -1).join(', ')}, and ${prerequisites[prerequisites.length - 1]}`;
}

// ============================================================================
// UNIFIED CURRICULUM ENTITY MAPPING
// ============================================================================

/**
 * Convert a PredictiveModule to a CurriculumEntity.
 * This is the primary conversion function for the unified type system.
 *
 * The resulting entity has materialization='proposed' and can be directly
 * rendered on the map or used in path preview components.
 */
export function moduleToCurriculumEntity(
    module: PredictiveModule,
    index: number,
    existingNodes: MapNode[]
): CurriculumEntity {
    // Determine domain from skills
    const primarySkill = module.skills[0] || 'General';
    const domainId = skillToDomainId(primarySkill);
    const color = getDomainColor(domainId);
    const difficulty = calculateDifficulty(module);

    // Calculate position (grid layout)
    const existingCourseCount = existingNodes.filter(n => n.level === 'course').length;
    const totalIndex = existingCourseCount + index;

    const columns = 4;
    const nodeWidth = 170;
    const nodeHeight = 85;
    const gap = 28;

    const row = Math.floor(totalIndex / columns);
    const col = totalIndex % columns;

    const position = {
        x: col * (nodeWidth + gap) + nodeWidth / 2,
        y: row * (nodeHeight + gap) + nodeHeight / 2,
    };

    // Find parent domain node
    const parentDomain = existingNodes.find(
        n => n.level === 'domain' && n.domainId === domainId
    );

    return createFullEntity({
        id: `proposed-${module.id}`,
        title: module.title,
        description: module.reasoning || `Learn ${module.skills.join(', ')}`,
        skills: module.skills,
        estimatedHours: module.estimatedHours,
        materialization: 'proposed',
        sequence: module.sequence,
        domainId,
        color,
        level: 'course',
        difficulty,
        position,
        parentId: parentDomain?.id || null,
        status: 'available',
        progress: 0,
        prerequisites: module.prerequisites,
        reasoning: module.reasoning,
        skillDemand: module.skillDemand,
        optimalWindow: module.optimalWindow,
        sourceModuleId: module.id,
        childIds: [],
    });
}

/**
 * Convert multiple PredictiveModules to CurriculumEntities.
 * Filters out modules that match existing nodes.
 */
export function modulesToCurriculumEntities(
    modules: PredictiveModule[],
    existingNodes: MapNode[]
): CurriculumEntity[] {
    const matchingNodeIds = findMatchingNodes(modules, existingNodes);

    // Filter modules that don't have matching nodes
    const unmatchedModules = modules.filter(module => {
        const moduleSkills = module.skills.map(s => s.toLowerCase());
        return !matchingNodeIds.some(nodeId => {
            const node = existingNodes.find(n => n.id === nodeId);
            if (!node) return false;

            const nodeName = node.name.toLowerCase();
            return moduleSkills.some(
                skill => nodeName.includes(skill) || skill.includes(nodeName.split(' ')[0])
            );
        });
    });

    return unmatchedModules.map((module, index) =>
        moduleToCurriculumEntity(module, index, existingNodes)
    );
}

/**
 * Convert a CurriculumEntity to HypotheticalMapNode for backward compatibility.
 * Use this when interfacing with components that haven't been migrated yet.
 *
 * @deprecated New code should use CurriculumEntity directly
 */
export function curriculumEntityToHypotheticalNode(
    entity: CurriculumEntity
): HypotheticalMapNode {
    return {
        id: entity.id.replace('proposed-', 'hypothetical-'),
        level: entity.level,
        name: entity.title,
        description: entity.description,
        skills: entity.skills,
        estimatedHours: entity.estimatedHours,
        color: entity.color,
        domainId: entity.domainId,
        position: entity.position,
        parentId: entity.parentId,
        difficulty: entity.difficulty,
        sourceModuleId: entity.sourceModuleId,
        materialization: entity.materialization,
    };
}

/**
 * Convert a HypotheticalMapNode to CurriculumEntity.
 * Use this when upgrading from the old type to the new unified type.
 */
export function hypotheticalNodeToCurriculumEntity(
    node: HypotheticalMapNode,
    oracleData?: {
        reasoning?: string;
        skillDemand?: import('@/app/features/goal-path/lib/predictiveTypes').DemandTrend;
        sequence?: number;
        prerequisites?: string[];
    }
): CurriculumEntity {
    return createFullEntity({
        id: node.id.replace('hypothetical-', 'proposed-'),
        title: node.name,
        description: node.description,
        skills: node.skills,
        estimatedHours: node.estimatedHours,
        materialization: node.materialization || 'proposed',
        sequence: oracleData?.sequence ?? 0,
        domainId: node.domainId,
        color: node.color,
        level: node.level,
        difficulty: node.difficulty ?? 'intermediate',
        position: node.position,
        parentId: node.parentId,
        status: 'available',
        progress: 0,
        prerequisites: oracleData?.prerequisites ?? [],
        reasoning: oracleData?.reasoning ?? '',
        skillDemand: oracleData?.skillDemand ?? 'stable',
        sourceModuleId: node.sourceModuleId,
        childIds: [],
    });
}

/**
 * Convert MapNode to CurriculumEntity.
 * Use this when you need to treat an existing map node as a curriculum entity.
 */
export function mapNodeToCurriculumEntity(
    node: MapNode,
    oracleData?: {
        reasoning?: string;
        skillDemand?: import('@/app/features/goal-path/lib/predictiveTypes').DemandTrend;
        sequence?: number;
    }
): CurriculumEntity {
    const skills = 'skills' in node && node.skills ? node.skills : [];

    return createFullEntity({
        id: node.id,
        title: node.name,
        description: node.description,
        skills,
        estimatedHours: node.estimatedHours ?? 0,
        materialization: 'materialized',
        sequence: oracleData?.sequence ?? 0,
        domainId: node.domainId,
        color: node.color,
        level: node.level,
        difficulty: 'difficulty' in node ? node.difficulty : 'intermediate',
        position: node.position ?? { x: 0, y: 0 },
        parentId: node.parentId,
        status: node.status,
        progress: node.progress,
        prerequisites: [],
        reasoning: oracleData?.reasoning ?? '',
        skillDemand: oracleData?.skillDemand ?? 'stable',
        childIds: node.childIds,
    });
}
