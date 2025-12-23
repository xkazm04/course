/**
 * Domain Model Types
 *
 * This module formalizes the implicit schemas discovered in mock data.
 * These types represent the canonical domain model for the learning platform.
 * Mock data serves as sample values conforming to these types.
 */

import type { LearningDomainId, DomainColorKey } from "./learningDomains";

// ============================================================================
// LEARNING PATH TYPES
// ============================================================================

/**
 * Represents a structured learning path within a domain.
 * Learning paths aggregate courses and map to specific skills.
 */
export interface LearningPath {
    /** Unique identifier tied to learning domain */
    id: LearningDomainId;
    /** Display name of the learning path */
    name: string;
    /** Icon identifier for visual representation */
    icon: string;
    /** Theme color from the domain color system */
    color: DomainColorKey;
    /** Brief description of what the path covers */
    description: string;
    /** Total number of courses in this path */
    courses: number;
    /** Estimated total hours to complete */
    hours: number;
    /** Key skills taught in this learning path */
    skills: string[];
}

// ============================================================================
// CAREER GOAL TYPES
// ============================================================================

/**
 * Demand level for a career goal in the job market.
 */
export type CareerDemandLevel = "Low" | "Medium" | "High" | "Very High" | "Self-directed";

/**
 * Represents a career objective that users can work towards.
 * Career goals provide structured milestones and market context.
 */
export interface CareerGoal {
    /** Unique identifier for the career goal */
    id: string;
    /** Title describing the goal (e.g., "Become a Backend Developer") */
    title: string;
    /** Estimated duration to achieve (e.g., "6-8 months") */
    duration: string;
    /** Expected salary range or bonus (e.g., "$85,000 - $130,000") */
    salary: string;
    /** Market demand level for this career path */
    demand: CareerDemandLevel;
    /** Number of learning modules required to achieve this goal */
    modules: number;
}

// ============================================================================
// JOB POSTING TYPES
// ============================================================================

/**
 * Represents a job posting that users can match their skills against.
 * Used to show career opportunities and skill alignment.
 */
export interface JobPosting {
    /** Company offering the position */
    company: string;
    /** Job title/role */
    role: string;
    /** Offered salary (formatted string, e.g., "$140,000") */
    salary: string;
    /** Job location (e.g., "Remote", "San Francisco, CA") */
    location: string;
    /** Required skills for the position */
    skills: string[];
    /** Match percentage based on user's current skills (0-100) */
    match: number;
}

// ============================================================================
// CHAPTER CONTENT TYPES
// ============================================================================

/**
 * Types of content sections within a chapter.
 */
export type ChapterSectionType = "text" | "code";

/**
 * Programming language identifiers for code sections.
 */
export type CodeLanguage = "typescript" | "javascript" | "python" | "css" | "html" | "go" | "rust" | "java";

/**
 * Base interface for chapter sections.
 */
interface ChapterSectionBase {
    /** Type discriminator for the section */
    type: ChapterSectionType;
    /** The content of the section */
    content: string;
}

/**
 * Text section containing explanatory content.
 */
export interface TextSection extends ChapterSectionBase {
    type: "text";
}

/**
 * Code section containing executable/displayable code.
 */
export interface CodeSection extends ChapterSectionBase {
    type: "code";
    /** Programming language for syntax highlighting */
    language: CodeLanguage;
}

/**
 * Union type for all possible chapter section types.
 */
export type ChapterSection = TextSection | CodeSection;

/**
 * Represents a chapter of learning content.
 * Chapters contain structured sections of text and code.
 */
export interface ChapterContent {
    /** Title of the chapter */
    title: string;
    /** Estimated time to complete (e.g., "45 min") */
    duration: string;
    /** Ordered array of content sections */
    sections: ChapterSection[];
}

// ============================================================================
// COMMUNITY TYPES
// ============================================================================

/**
 * Platform types for developer communities.
 */
export type CommunityPlatformType = "Discord" | "Forum" | "Reddit" | "Slack" | "Twitter" | "GitHub";

/**
 * Represents an online community relevant to learners.
 */
export interface Community {
    /** Name of the community */
    name: string;
    /** Approximate member count (e.g., "250k+") */
    members: string;
    /** Platform where the community is hosted */
    type: CommunityPlatformType;
}

// ============================================================================
// PROJECT IDEA TYPES
// ============================================================================

/**
 * Difficulty levels for project ideas.
 */
export type ProjectDifficulty = "Beginner" | "Intermediate" | "Advanced" | "Expert";

/**
 * Represents a project idea for hands-on practice.
 * Projects help learners apply their skills in practical scenarios.
 */
export interface ProjectIdea {
    /** Name/title of the project */
    name: string;
    /** Skill level required to complete */
    difficulty: ProjectDifficulty;
    /** Estimated time to complete (e.g., "2-3 days", "1-2 weeks") */
    time: string;
}

// ============================================================================
// ACHIEVEMENT / MILESTONE TYPES
// ============================================================================

/**
 * Represents a career milestone achievement in the gamified progression system.
 * Achievements unlock rewards and XP as learners progress.
 */
export interface Achievement {
    /** Unique identifier for the achievement */
    id: number;
    /** Display title (e.g., "Junior Developer") */
    title: string;
    /** Current progress percentage (0-100) */
    progress: number;
    /** Whether the achievement is still locked */
    locked: boolean;
    /** Reward unlocked upon achievement completion */
    reward: string;
    /** Experience points awarded */
    xp: number;
    /** Description of what this milestone represents */
    description: string;
}

/**
 * Represents a level threshold in the XP-based progression system.
 * Defines the XP required to reach each level and its associated title.
 */
export interface LevelThreshold {
    /** Level number (1-based) */
    level: number;
    /** Title displayed for this level (e.g., "Code Apprentice") */
    title: string;
    /** Minimum XP required to reach this level */
    minXp: number;
}

// ============================================================================
// RE-EXPORTS FOR CONVENIENCE
// ============================================================================

// Re-export related types from other modules for convenience
export type { LearningDomainId, DomainColorKey } from "./learningDomains";
