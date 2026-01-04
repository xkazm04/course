/**
 * Unified Challenge Abstraction Layer
 *
 * This module provides a unified abstraction for challenges from different sources:
 * - SeedProject (static templates)
 * - ScannedProject + ScannedChallenge (database-driven)
 *
 * Both represent the same concept: "improvable codebases with known issues"
 * This abstraction enables consistent UX regardless of origin.
 */

import type {
    SeedProject,
    ProjectDifficulty,
    ProjectDomain,
    TechStack,
    CodeLocation,
    KnownIssue,
    CodeSmell,
    MissingFeature,
    DeveloperPersona,
    ProjectRepository,
} from "./types";

import type { ScannedProject, ScannedChallenge } from "./remixApi";

// =============================================================================
// Unified Challenge Types
// =============================================================================

/**
 * Unified challenge source - distinguishes where the challenge originated
 */
export type ChallengeSource = "seed" | "scanned" | "hybrid";

/**
 * Unified challenge type - normalized across both sources
 */
export type ChallengeType =
    | "bug"
    | "performance"
    | "security"
    | "smell"
    | "missing_feature"
    | "ux";

/**
 * Unified difficulty - normalized across both sources
 */
export type ChallengeDifficulty = "easy" | "medium" | "hard";

/**
 * Unified severity level
 */
export type ChallengeSeverity = "low" | "medium" | "high" | "critical";

/**
 * A single challenge item - the atomic unit of improvable work
 */
export interface ChallengeItem {
    id: string;
    type: ChallengeType;
    severity: ChallengeSeverity;
    difficulty: ChallengeDifficulty;
    title: string;
    description: string;
    location: CodeLocation;
    hints?: string[];
    tags?: string[];
    estimatedMinutes?: number;

    // Optional enriched fields
    codeSnippet?: string;
    contextBefore?: string;
    contextAfter?: string;
    userInstructions?: string;
    expectedOutput?: string;
    suggestedApproach?: string;
    acceptanceCriteria?: string[];
}

/**
 * Metadata about the challenge origin
 */
export interface ChallengeOrigin {
    source: ChallengeSource;
    originalId: string;
    scannedAt?: string;
    parentProjectId?: string;
}

/**
 * Unified Challenge - the main abstraction representing an improvable codebase
 *
 * This is the canonical representation that both SeedProject and ScannedProject
 * can be converted to/from.
 */
export interface Challenge {
    // Identity
    id: string;
    name: string;
    description: string;
    version: number;

    // Classification
    domain: ProjectDomain;
    difficulty: ProjectDifficulty;
    estimatedHours: number;

    // Tech context
    techStack: TechStack;

    // The challenges themselves
    items: ChallengeItem[];

    // Grouped by type for convenience
    issues: ChallengeItem[];      // bugs, security, performance
    smells: ChallengeItem[];      // code smells
    features: ChallengeItem[];    // missing features

    // Repository context
    repository: ProjectRepository;

    // Developer persona
    previousDeveloper: DeveloperPersona;
    projectHistory: string;

    // Metadata
    origin: ChallengeOrigin;
    createdAt: string;

    // Stats
    contributorCount: number;
    timesAssigned: number;
    avgCompletionRate: number;
}

// =============================================================================
// Adapter Interface - Extensible conversion protocol
// =============================================================================

/**
 * ChallengeAdapter interface - implement this to add new challenge sources
 */
export interface ChallengeAdapter<T> {
    /** Convert source type to unified Challenge */
    toChallenge(source: T): Challenge;

    /** Convert unified Challenge back to source type (for persistence) */
    fromChallenge(challenge: Challenge): T;

    /** Check if this adapter can handle the source */
    canHandle(source: unknown): source is T;

    /** Source type identifier */
    readonly sourceType: ChallengeSource;
}

// =============================================================================
// Conversion Utilities
// =============================================================================

/**
 * Maps ChallengeDifficulty to ProjectDifficulty
 */
function challengeDifficultyToProject(difficulty: ChallengeDifficulty): ProjectDifficulty {
    switch (difficulty) {
        case "easy": return "beginner";
        case "medium": return "intermediate";
        case "hard": return "advanced";
    }
}

/**
 * Maps ScannedChallenge difficulty to ChallengeDifficulty
 */
function scannedDifficultyToChallenge(difficulty: ScannedChallenge["difficulty"]): ChallengeDifficulty {
    switch (difficulty) {
        case "beginner": return "easy";
        case "intermediate": return "medium";
        case "advanced": return "hard";
    }
}

/**
 * Maps KnownIssue type to ChallengeType
 */
function knownIssueTypeToChallenge(type: KnownIssue["type"]): ChallengeType {
    return type; // Direct mapping: bug, performance, security, ux
}

/**
 * Maps KnownIssue difficulty to ChallengeDifficulty
 */
function knownIssueDifficultyToChallenge(difficulty: KnownIssue["difficulty"]): ChallengeDifficulty {
    return difficulty; // Direct mapping: easy, medium, hard
}

/**
 * Maps ScannedChallenge type to ChallengeType
 */
function scannedTypeToChallenge(type: ScannedChallenge["type"]): ChallengeType {
    switch (type) {
        case "bug": return "bug";
        case "performance": return "performance";
        case "security": return "security";
        case "smell": return "smell";
        case "missing_feature": return "missing_feature";
    }
}

/**
 * Converts a KnownIssue to a ChallengeItem
 */
function knownIssueToChallengeItem(issue: KnownIssue): ChallengeItem {
    return {
        id: issue.id,
        type: knownIssueTypeToChallenge(issue.type),
        severity: "medium", // KnownIssue doesn't have severity, default to medium
        difficulty: knownIssueDifficultyToChallenge(issue.difficulty),
        title: issue.title,
        description: issue.description,
        location: issue.location,
        hints: issue.hints,
    };
}

/**
 * Converts a CodeSmell to a ChallengeItem
 */
function codeSmellToChallengeItem(smell: CodeSmell): ChallengeItem {
    return {
        id: smell.id,
        type: "smell",
        severity: "low", // Code smells are typically low severity
        difficulty: "medium", // Default difficulty for smells
        title: `Code Smell: ${smell.type.replace(/_/g, " ")}`,
        description: smell.description,
        location: smell.location,
        suggestedApproach: smell.suggestedRefactoring,
    };
}

/**
 * Converts a MissingFeature to a ChallengeItem
 */
function missingFeatureToChallengeItem(feature: MissingFeature): ChallengeItem {
    return {
        id: feature.id,
        type: "missing_feature",
        severity: "medium",
        difficulty: feature.difficulty,
        title: feature.title,
        description: feature.description,
        location: { file: "", startLine: 0, endLine: 0 }, // Features may not have specific location
        userInstructions: feature.userStory,
        acceptanceCriteria: feature.acceptanceCriteria,
        suggestedApproach: feature.suggestedApproach,
    };
}

/**
 * Converts a ScannedChallenge to a ChallengeItem
 */
function scannedChallengeToChallengeItem(challenge: ScannedChallenge): ChallengeItem {
    return {
        id: challenge.id,
        type: scannedTypeToChallenge(challenge.type),
        severity: challenge.severity,
        difficulty: scannedDifficultyToChallenge(challenge.difficulty),
        title: challenge.title,
        description: challenge.description,
        location: challenge.location,
        hints: challenge.hints,
        tags: challenge.tags,
        estimatedMinutes: challenge.estimated_minutes,
        codeSnippet: challenge.code_snippet,
        contextBefore: challenge.context_before,
        contextAfter: challenge.context_after,
        userInstructions: challenge.user_instructions,
        expectedOutput: challenge.expected_output,
    };
}

// =============================================================================
// SeedProject Adapter
// =============================================================================

/**
 * Adapter for converting SeedProject to/from Challenge
 */
export const seedProjectAdapter: ChallengeAdapter<SeedProject> = {
    sourceType: "seed",

    canHandle(source: unknown): source is SeedProject {
        return (
            typeof source === "object" &&
            source !== null &&
            "repository" in source &&
            "knownIssues" in source &&
            "codeSmells" in source &&
            "missingFeatures" in source &&
            "previousDeveloper" in source
        );
    },

    toChallenge(project: SeedProject): Challenge {
        // Convert all items to ChallengeItems
        const issueItems = project.knownIssues.map(knownIssueToChallengeItem);
        const smellItems = project.codeSmells.map(codeSmellToChallengeItem);
        const featureItems = project.missingFeatures.map(missingFeatureToChallengeItem);

        const allItems = [...issueItems, ...smellItems, ...featureItems];

        return {
            id: project.id,
            name: project.name,
            description: project.description,
            version: project.version,
            domain: project.domain,
            difficulty: project.difficulty,
            estimatedHours: project.estimatedHours,
            techStack: project.techStack,
            items: allItems,
            issues: issueItems,
            smells: smellItems,
            features: featureItems,
            repository: project.repository,
            previousDeveloper: project.previousDeveloper,
            projectHistory: project.projectHistory,
            origin: {
                source: "seed",
                originalId: project.id,
                parentProjectId: project.parentProjectId,
            },
            createdAt: project.createdAt,
            contributorCount: project.contributorCount,
            timesAssigned: project.timesAssigned,
            avgCompletionRate: project.avgCompletionRate,
        };
    },

    fromChallenge(challenge: Challenge): SeedProject {
        // Convert back to KnownIssues
        const knownIssues: KnownIssue[] = challenge.issues.map(item => ({
            id: item.id,
            type: item.type === "ux" ? "ux" : item.type === "bug" ? "bug" :
                  item.type === "performance" ? "performance" : "security",
            title: item.title,
            description: item.description,
            location: item.location,
            difficulty: item.difficulty,
            hints: item.hints,
        }));

        // Convert back to CodeSmells
        const codeSmells: CodeSmell[] = challenge.smells.map(item => ({
            id: item.id,
            type: "missing_abstraction", // Default type
            location: item.location,
            description: item.description,
            suggestedRefactoring: item.suggestedApproach,
        }));

        // Convert back to MissingFeatures
        const missingFeatures: MissingFeature[] = challenge.features.map(item => ({
            id: item.id,
            title: item.title,
            description: item.description,
            userStory: item.userInstructions || "",
            acceptanceCriteria: item.acceptanceCriteria || [],
            difficulty: item.difficulty,
            suggestedApproach: item.suggestedApproach,
        }));

        return {
            id: challenge.id,
            name: challenge.name,
            description: challenge.description,
            version: challenge.version,
            domain: challenge.domain,
            difficulty: challenge.difficulty,
            estimatedHours: challenge.estimatedHours,
            repository: challenge.repository,
            techStack: challenge.techStack,
            knownIssues,
            codeSmells,
            missingFeatures,
            previousDeveloper: challenge.previousDeveloper,
            projectHistory: challenge.projectHistory,
            createdAt: challenge.createdAt,
            parentProjectId: challenge.origin.parentProjectId,
            contributorCount: challenge.contributorCount,
            timesAssigned: challenge.timesAssigned,
            avgCompletionRate: challenge.avgCompletionRate,
        };
    },
};

// =============================================================================
// ScannedProject Adapter
// =============================================================================

/**
 * Data structure for scanned project with its challenges
 */
export interface ScannedProjectWithChallenges {
    project: ScannedProject;
    challenges: ScannedChallenge[];
}

/**
 * Adapter for converting ScannedProject + ScannedChallenges to/from Challenge
 */
export const scannedProjectAdapter: ChallengeAdapter<ScannedProjectWithChallenges> = {
    sourceType: "scanned",

    canHandle(source: unknown): source is ScannedProjectWithChallenges {
        return (
            typeof source === "object" &&
            source !== null &&
            "project" in source &&
            "challenges" in source &&
            typeof (source as { project: unknown }).project === "object" &&
            Array.isArray((source as { challenges: unknown }).challenges)
        );
    },

    toChallenge(data: ScannedProjectWithChallenges): Challenge {
        const { project, challenges } = data;

        // Convert all challenges to ChallengeItems
        const allItems = challenges.map(scannedChallengeToChallengeItem);

        // Group by type
        const issues = allItems.filter(item =>
            ["bug", "security", "performance"].includes(item.type)
        );
        const smells = allItems.filter(item => item.type === "smell");
        const features = allItems.filter(item => item.type === "missing_feature");

        // Infer difficulty from challenges
        const avgDifficulty = challenges.reduce((sum, c) => {
            const score = c.difficulty === "advanced" ? 3 : c.difficulty === "intermediate" ? 2 : 1;
            return sum + score;
        }, 0) / (challenges.length || 1);

        const difficulty: ProjectDifficulty =
            avgDifficulty >= 2.5 ? "advanced" :
            avgDifficulty >= 1.5 ? "intermediate" : "beginner";

        // Estimate hours from challenge minutes
        const estimatedHours = Math.ceil(
            challenges.reduce((sum, c) => sum + (c.estimated_minutes || 30), 0) / 60
        );

        // Generate a developer persona for scanned projects
        const previousDeveloper: DeveloperPersona = {
            name: "Previous Developer",
            avatar: "/avatars/default.png",
            experience: "Unknown",
            style: "Varied",
            timeConstraints: "Project was inherited from another team",
            knownWeaknesses: [],
            backstory: `This project was discovered through automated scanning. ${challenges.length} potential improvements were identified.`,
        };

        return {
            id: project.id,
            name: project.name,
            description: `Scanned project with ${challenges.length} identified challenges`,
            version: 1,
            domain: "web_app", // Default, could be inferred from tech stack
            difficulty,
            estimatedHours,
            techStack: {
                language: project.language,
                framework: project.framework,
            },
            items: allItems,
            issues,
            smells,
            features,
            repository: {
                files: [],
                readme: "",
                structure: { name: project.name, type: "directory", path: "/" },
                dependencies: {},
                devDependencies: {},
                scripts: {},
            },
            previousDeveloper,
            projectHistory: `Scanned at ${new Date(project.scanned_at).toLocaleDateString()}`,
            origin: {
                source: "scanned",
                originalId: project.id,
                scannedAt: project.scanned_at,
            },
            createdAt: project.scanned_at,
            contributorCount: 0,
            timesAssigned: 0,
            avgCompletionRate: 0,
        };
    },

    fromChallenge(challenge: Challenge): ScannedProjectWithChallenges {
        const project: ScannedProject = {
            id: challenge.id,
            name: challenge.name,
            source_url: undefined,
            language: challenge.techStack.language,
            framework: challenge.techStack.framework,
            tech_stack: [
                challenge.techStack.language,
                challenge.techStack.framework,
                challenge.techStack.database,
                challenge.techStack.testing,
            ].filter((s): s is string => Boolean(s)),
            file_count: challenge.repository.files.length,
            total_lines: challenge.repository.files.reduce((sum, f) => sum + f.linesOfCode, 0),
            scanned_at: challenge.createdAt,
            challenge_count: challenge.items.length,
        };

        const challenges: ScannedChallenge[] = challenge.items.map(item => ({
            id: item.id,
            project_id: challenge.id,
            type: item.type === "ux" ? "bug" : item.type, // Map ux back to bug
            severity: item.severity,
            difficulty: challengeDifficultyToProject(item.difficulty) as ScannedChallenge["difficulty"],
            title: item.title,
            description: item.description,
            location: item.location,
            code_snippet: item.codeSnippet,
            context_before: item.contextBefore,
            context_after: item.contextAfter,
            user_instructions: item.userInstructions || "",
            expected_output: item.expectedOutput || "",
            hints: item.hints || [],
            tags: item.tags || [],
            estimated_minutes: item.estimatedMinutes,
            status: "approved",
            created_at: challenge.createdAt,
        }));

        return { project, challenges };
    },
};

// =============================================================================
// Challenge Registry - Manages all adapters
// =============================================================================

/**
 * Registry for challenge adapters - allows runtime registration of new sources
 */
class ChallengeAdapterRegistry {
    private adapters: ChallengeAdapter<unknown>[] = [];

    /**
     * Register an adapter for a new challenge source
     */
    register<T>(adapter: ChallengeAdapter<T>): void {
        this.adapters.push(adapter as ChallengeAdapter<unknown>);
    }

    /**
     * Find an adapter that can handle the given source
     */
    findAdapter<T>(source: T): ChallengeAdapter<T> | null {
        for (const adapter of this.adapters) {
            if (adapter.canHandle(source)) {
                return adapter as ChallengeAdapter<T>;
            }
        }
        return null;
    }

    /**
     * Convert any supported source to a Challenge
     */
    toChallenge<T>(source: T): Challenge {
        const adapter = this.findAdapter(source);
        if (!adapter) {
            throw new Error("No adapter found for the given source type");
        }
        return adapter.toChallenge(source);
    }

    /**
     * Get all registered adapters
     */
    getAdapters(): readonly ChallengeAdapter<unknown>[] {
        return this.adapters;
    }
}

/**
 * Global challenge adapter registry with built-in adapters
 */
export const challengeRegistry = new ChallengeAdapterRegistry();

// Register built-in adapters
challengeRegistry.register(seedProjectAdapter);
challengeRegistry.register(scannedProjectAdapter);

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Convert a SeedProject to a unified Challenge
 */
export function seedProjectToChallenge(project: SeedProject): Challenge {
    return seedProjectAdapter.toChallenge(project);
}

/**
 * Convert a unified Challenge back to a SeedProject
 */
export function challengeToSeedProject(challenge: Challenge): SeedProject {
    return seedProjectAdapter.fromChallenge(challenge);
}

/**
 * Convert a ScannedProject with its challenges to a unified Challenge
 */
export function scannedToChallenge(
    project: ScannedProject,
    challenges: ScannedChallenge[]
): Challenge {
    return scannedProjectAdapter.toChallenge({ project, challenges });
}

/**
 * Convert a unified Challenge back to ScannedProject + ScannedChallenges
 */
export function challengeToScanned(challenge: Challenge): ScannedProjectWithChallenges {
    return scannedProjectAdapter.fromChallenge(challenge);
}

/**
 * Create a Challenge from any supported source type
 * Uses the registry to find the appropriate adapter
 */
export function createChallenge<T>(source: T): Challenge {
    return challengeRegistry.toChallenge(source);
}

/**
 * Check if a Challenge originated from a seed project
 */
export function isSeedChallenge(challenge: Challenge): boolean {
    return challenge.origin.source === "seed";
}

/**
 * Check if a Challenge originated from a scanned project
 */
export function isScannedChallenge(challenge: Challenge): boolean {
    return challenge.origin.source === "scanned";
}

/**
 * Get challenge items by type
 */
export function getChallengeItemsByType(
    challenge: Challenge,
    type: ChallengeType
): ChallengeItem[] {
    return challenge.items.filter(item => item.type === type);
}

/**
 * Get challenge items by difficulty
 */
export function getChallengeItemsByDifficulty(
    challenge: Challenge,
    difficulty: ChallengeDifficulty
): ChallengeItem[] {
    return challenge.items.filter(item => item.difficulty === difficulty);
}

/**
 * Get challenge items by severity
 */
export function getChallengeItemsBySeverity(
    challenge: Challenge,
    severity: ChallengeSeverity
): ChallengeItem[] {
    return challenge.items.filter(item => item.severity === severity);
}

/**
 * Calculate total estimated time for a challenge
 */
export function getChallengeTotalMinutes(challenge: Challenge): number {
    return challenge.items.reduce(
        (sum, item) => sum + (item.estimatedMinutes || 30),
        0
    );
}

/**
 * Get challenge completion percentage estimate based on items
 */
export function getChallengeCompletionEstimate(
    challenge: Challenge,
    completedItemIds: Set<string>
): number {
    if (challenge.items.length === 0) return 100;
    const completed = challenge.items.filter(item => completedItemIds.has(item.id)).length;
    return Math.round((completed / challenge.items.length) * 100);
}
