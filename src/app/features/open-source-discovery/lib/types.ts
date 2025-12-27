import type { SkillLevel } from "../../skill-progress/lib/types";

// Repository types
export type LearnerFriendliness = "beginner" | "intermediate" | "advanced";

export interface PartnerRepository {
    id: string;
    name: string;
    owner: string;
    url: string;
    description: string;
    languages: string[];
    learnerFriendliness: LearnerFriendliness;
    contributingGuidelinesUrl?: string;
    mentorshipAvailable: boolean;
    avgResponseTime: number; // hours
    activeContributors: number;
    stars: number;
    topics: string[];
    lastUpdated: string;
}

// Issue complexity levels
export type TaskComplexity = "trivial" | "simple" | "moderate" | "complex" | "expert";

// Skill requirement for an issue
export interface SkillRequirement {
    skillId: string;
    skillName: string;
    level: SkillLevel;
    isStretch: boolean; // Opportunity to learn this skill
}

// LLM-analyzed task properties
export interface TaskAnalysis {
    complexity: TaskComplexity;
    estimatedHours: number;
    requiredSkills: SkillRequirement[];
    learningOpportunities: string[];
    prerequisiteKnowledge: string[];
    suggestedApproach: string;
    potentialBlockers: string[];
    confidence: number; // 0-1
}

// GitHub issue with analysis
export interface DiscoverableIssue {
    id: string;
    repositoryId: string;
    repositoryName: string;
    repositoryOwner: string;
    githubId: number;
    title: string;
    body: string;
    url: string;
    labels: string[];
    createdAt: string;
    updatedAt: string;
    commentCount: number;
    isPullRequest: boolean;
    analysis: TaskAnalysis;
}

// Matching types
export type MatchDifficulty = "comfortable" | "challenging" | "stretch";

export interface SkillGap {
    skillId: string;
    skillName: string;
    currentLevel: SkillLevel | null;
    requiredLevel: SkillLevel;
    gapSeverity: "minor" | "moderate" | "significant";
}

export interface MatchResult {
    issue: DiscoverableIssue;
    matchScore: number; // 0-100
    matchReasons: string[];
    skillGaps: SkillGap[];
    stretchOpportunities: string[];
    estimatedDifficulty: MatchDifficulty;
}

// User preferences for matching
export interface MatchingPreferences {
    preferredComplexity: TaskComplexity[];
    preferredLanguages: string[];
    preferStretch: boolean; // Prefer challenging tasks
    maxEstimatedHours: number;
    onlyMentorshipAvailable: boolean;
}

// Discovery state
export interface DiscoveryState {
    repositories: PartnerRepository[];
    issues: DiscoverableIssue[];
    watchedRepositoryIds: string[];
    lastSyncAt: string | null;
    filters: DiscoveryFilters;
}

export interface DiscoveryFilters {
    complexity: TaskComplexity[];
    languages: string[];
    repositories: string[];
    hasGoodFirstIssueLabel: boolean;
    maxEstimatedHours: number | null;
}

// Complexity config for UI
export const COMPLEXITY_CONFIG: Record<TaskComplexity, {
    label: string;
    color: string;
    bgColor: string;
    hours: string;
    icon: string;
}> = {
    trivial: {
        label: "Trivial",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/20",
        hours: "< 1h",
        icon: "Zap",
    },
    simple: {
        label: "Simple",
        color: "text-green-400",
        bgColor: "bg-green-500/20",
        hours: "1-3h",
        icon: "Leaf",
    },
    moderate: {
        label: "Moderate",
        color: "text-amber-400",
        bgColor: "bg-amber-500/20",
        hours: "3-8h",
        icon: "Target",
    },
    complex: {
        label: "Complex",
        color: "text-orange-400",
        bgColor: "bg-orange-500/20",
        hours: "8-24h",
        icon: "Flame",
    },
    expert: {
        label: "Expert",
        color: "text-red-400",
        bgColor: "bg-red-500/20",
        hours: "24h+",
        icon: "Rocket",
    },
};

// Friendliness config
export const FRIENDLINESS_CONFIG: Record<LearnerFriendliness, {
    label: string;
    color: string;
    description: string;
}> = {
    beginner: {
        label: "Beginner Friendly",
        color: "emerald",
        description: "Great documentation, responsive maintainers, welcoming community",
    },
    intermediate: {
        label: "Intermediate",
        color: "amber",
        description: "Some prior experience recommended, good documentation",
    },
    advanced: {
        label: "Advanced",
        color: "purple",
        description: "Complex codebase, deep domain knowledge required",
    },
};

export const DISCOVERY_STORAGE_KEY = "oss-discovery";
export const DISCOVERY_VERSION = "1.0.0";
