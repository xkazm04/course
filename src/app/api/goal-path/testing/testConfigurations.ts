/**
 * Test Configurations for Goal Path API
 *
 * Defines 20 test configurations (5 per variant) for comprehensive testing.
 * Each configuration includes expected outcomes for validation.
 */

import {
    getLiveFormConfigs,
    getChatConfigs,
    getEnhancedConfigs,
    getOracleConfigs,
} from "./personas";
import type { TestConfiguration } from "../lib/types";

// ============================================================================
// LIVE FORM TEST CONFIGURATIONS (5)
// ============================================================================

export function getLiveFormTestConfigs(): TestConfiguration[] {
    const configs = getLiveFormConfigs();

    return [
        {
            id: "lf-001-full-stack-beginner",
            name: "Full Stack Beginner (Career Changer)",
            variant: "live-form",
            persona: {
                id: configs[0].persona.id,
                name: configs[0].persona.name,
                description: configs[0].persona.description,
                params: configs[0].request,
            },
            expectedOutcomes: {
                minModules: 4,
                maxWeeks: 52,
                requiredSkills: ["HTML", "CSS", "JavaScript"],
            },
        },
        {
            id: "lf-002-react-specialist",
            name: "React Specialist (Upskilling)",
            variant: "live-form",
            persona: {
                id: configs[1].persona.id,
                name: configs[1].persona.name,
                description: configs[1].persona.description,
                params: configs[1].request,
            },
            expectedOutcomes: {
                minModules: 3,
                maxWeeks: 26,
                requiredSkills: ["React", "TypeScript"],
            },
        },
        {
            id: "lf-003-nodejs-upskill",
            name: "Node.js System Design (Advanced)",
            variant: "live-form",
            persona: {
                id: configs[2].persona.id,
                name: configs[2].persona.name,
                description: configs[2].persona.description,
                params: configs[2].request,
            },
            expectedOutcomes: {
                minModules: 3,
                maxWeeks: 26,
                requiredSkills: ["Node.js", "System Design"],
            },
        },
        {
            id: "lf-004-career-pivot",
            name: "Career Pivot (Time Constrained)",
            variant: "live-form",
            persona: {
                id: configs[3].persona.id,
                name: configs[3].persona.name,
                description: configs[3].persona.description,
                params: configs[3].request,
            },
            expectedOutcomes: {
                minModules: 2,
                maxWeeks: 78,
                requiredSkills: ["HTML", "CSS"],
            },
        },
        {
            id: "lf-005-quick-learner",
            name: "Intensive Bootcamp (Quick Learner)",
            variant: "live-form",
            persona: {
                id: configs[4].persona.id,
                name: configs[4].persona.name,
                description: configs[4].persona.description,
                params: configs[4].request,
            },
            expectedOutcomes: {
                minModules: 5,
                maxWeeks: 14,
                requiredSkills: ["JavaScript", "React", "Node.js"],
            },
        },
    ];
}

// ============================================================================
// AI CHAT TEST CONFIGURATIONS (5)
// ============================================================================

export function getChatTestConfigs(): TestConfiguration[] {
    const configs = getChatConfigs();

    return [
        {
            id: "chat-001-explorer",
            name: "Exploration Mode (Unclear Goals)",
            variant: "ai-chat",
            persona: {
                id: configs[0].persona.id,
                name: "Explorer Ellen",
                description: "User exploring options without a clear direction",
                params: configs[0].request,
            },
            expectedOutcomes: {
                minModules: 1, // Should guide to more specific goal
            },
        },
        {
            id: "chat-002-guided-journey",
            name: "Guided Journey (Backend Developer)",
            variant: "ai-chat",
            persona: {
                id: configs[1].persona.id,
                name: "Guided Gary",
                description: "Following the structured conversation flow",
                params: configs[1].request,
            },
            expectedOutcomes: {
                minModules: 1,
            },
        },
        {
            id: "chat-003-clarifier",
            name: "Clarification Seeker (AI + Web)",
            variant: "ai-chat",
            persona: {
                id: configs[2].persona.id,
                name: "Curious Carl",
                description: "Asking follow-up questions, needs clarification",
                params: configs[2].request,
            },
            expectedOutcomes: {
                minModules: 1,
            },
        },
        {
            id: "chat-004-fast-tracker",
            name: "Fast Tracker (Minimal Input)",
            variant: "ai-chat",
            persona: {
                id: configs[3].persona.id,
                name: "Fast Fiona",
                description: "Quick responses, wants fast results",
                params: configs[3].request,
            },
            expectedOutcomes: {
                minModules: 1,
            },
        },
        {
            id: "chat-005-detailed-planner",
            name: "Detailed Planner (SaaS Builder)",
            variant: "ai-chat",
            persona: {
                id: configs[4].persona.id,
                name: "Detailed Derek",
                description: "Provides rich context, wants comprehensive plan",
                params: configs[4].request,
            },
            expectedOutcomes: {
                minModules: 1,
            },
        },
    ];
}

// ============================================================================
// ENHANCED TEST CONFIGURATIONS (5)
// ============================================================================

export function getEnhancedTestConfigs(): TestConfiguration[] {
    const configs = getEnhancedConfigs();

    return [
        {
            id: "enh-001-system-design",
            name: "System Design Mastery",
            variant: "enhanced",
            persona: {
                id: configs[0].persona.id,
                name: configs[0].persona.name,
                description: "Path to senior engineer through system design",
                params: configs[0].request,
            },
            expectedOutcomes: {
                minModules: 4,
                maxWeeks: 52,
                requiredSkills: ["System Design", "Distributed Systems"],
            },
        },
        {
            id: "enh-002-frontend-mastery",
            name: "Frontend Expert Path",
            variant: "enhanced",
            persona: {
                id: configs[1].persona.id,
                name: configs[1].persona.name,
                description: "Deep dive into frontend technologies",
                params: configs[1].request,
            },
            expectedOutcomes: {
                minModules: 4,
                maxWeeks: 26,
                requiredSkills: ["React", "TypeScript", "Design Systems"],
            },
        },
        {
            id: "enh-003-devops-transition",
            name: "DevOps Transition Path",
            variant: "enhanced",
            persona: {
                id: configs[2].persona.id,
                name: configs[2].persona.name,
                description: "Developer to DevOps engineer journey",
                params: configs[2].request,
            },
            expectedOutcomes: {
                minModules: 4,
                maxWeeks: 40,
                requiredSkills: ["Docker", "Kubernetes", "CI/CD"],
            },
        },
        {
            id: "enh-004-ai-ml-path",
            name: "AI/ML Enhancement Path",
            variant: "enhanced",
            persona: {
                id: configs[3].persona.id,
                name: configs[3].persona.name,
                description: "Adding AI/ML to development skillset",
                params: configs[3].request,
            },
            expectedOutcomes: {
                minModules: 4,
                maxWeeks: 52,
                requiredSkills: ["Python", "Machine Learning"],
            },
        },
        {
            id: "enh-005-staff-engineer",
            name: "Staff Engineer Development",
            variant: "enhanced",
            persona: {
                id: configs[4].persona.id,
                name: configs[4].persona.name,
                description: "Technical leadership development path",
                params: configs[4].request,
            },
            expectedOutcomes: {
                minModules: 3,
                maxWeeks: 78,
                requiredSkills: ["Architecture", "Leadership"],
            },
        },
    ];
}

// ============================================================================
// CAREER ORACLE TEST CONFIGURATIONS (5)
// ============================================================================

export function getOracleTestConfigs(): TestConfiguration[] {
    const configs = getOracleConfigs();

    return [
        {
            id: "oracle-001-startup",
            name: "Tech Startup Path (Predictions)",
            variant: "oracle",
            persona: {
                id: configs[0].persona.id,
                name: "Startup Steve",
                description: "Aggressive growth path for startup environment",
                params: configs[0].request,
            },
            expectedOutcomes: {
                minModules: 1,
            },
        },
        {
            id: "oracle-002-enterprise",
            name: "Enterprise Path (Path Generation)",
            variant: "oracle",
            persona: {
                id: configs[1].persona.id,
                name: "Enterprise Emma",
                description: "Conservative growth in enterprise setting",
                params: configs[1].request,
            },
            expectedOutcomes: {
                minModules: 3,
            },
        },
        {
            id: "oracle-003-fintech",
            name: "Fintech Focus (Job Matching)",
            variant: "oracle",
            persona: {
                id: configs[2].persona.id,
                name: "Fintech Frank",
                description: "Job-focused path in fintech industry",
                params: configs[2].request,
            },
            expectedOutcomes: {
                minModules: 1,
            },
        },
        {
            id: "oracle-004-ai-ml-career",
            name: "AI/ML Career (Predictions)",
            variant: "oracle",
            persona: {
                id: configs[3].persona.id,
                name: "ML Mike",
                description: "Machine learning career development",
                params: configs[3].request,
            },
            expectedOutcomes: {
                minModules: 1,
            },
        },
        {
            id: "oracle-005-freelance",
            name: "Freelance Builder (Path Generation)",
            variant: "oracle",
            persona: {
                id: configs[4].persona.id,
                name: "Freelance Fran",
                description: "Path to freelance consulting",
                params: configs[4].request,
            },
            expectedOutcomes: {
                minModules: 3,
            },
        },
    ];
}

// ============================================================================
// ALL CONFIGURATIONS
// ============================================================================

/**
 * Get all 20 test configurations
 */
export function getAllTestConfigs(): TestConfiguration[] {
    return [
        ...getLiveFormTestConfigs(),
        ...getChatTestConfigs(),
        ...getEnhancedTestConfigs(),
        ...getOracleTestConfigs(),
    ];
}

/**
 * Get test configurations by variant
 */
export function getTestConfigsByVariant(
    variant: "live-form" | "ai-chat" | "enhanced" | "oracle"
): TestConfiguration[] {
    switch (variant) {
        case "live-form":
            return getLiveFormTestConfigs();
        case "ai-chat":
            return getChatTestConfigs();
        case "enhanced":
            return getEnhancedTestConfigs();
        case "oracle":
            return getOracleTestConfigs();
        default:
            return [];
    }
}

/**
 * Get a specific test configuration by ID
 */
export function getTestConfigById(id: string): TestConfiguration | undefined {
    return getAllTestConfigs().find(config => config.id === id);
}
