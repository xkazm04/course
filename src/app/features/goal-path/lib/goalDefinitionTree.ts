/**
 * Goal Definition Decision Tree
 *
 * A declarative decision tree for the goal definition chat flow.
 * This makes the 4-step decision process explicit and extensible:
 * - Goal → Time Commitment → Skill Level → Deadline
 *
 * With dynamic branching:
 * - If goal is "Get a new job", add job market questions
 * - If goal is "Build a side project", add technology preference questions
 * - If user selects "flexible" timeline, skip deadline question
 */

import type {
    DecisionTree,
    DecisionNode,
    DecisionContext,
} from "./decisionTreeTypes";
import type { GoalFormState } from "@/app/shared/lib/learnerProfile";

// ============================================================================
// Value Transformers
// ============================================================================

/**
 * Transform time commitment option to number
 */
const parseTimeCommitment = (option: string): number => {
    if (option.includes("5-10") || option.includes("Casual")) return 7;
    if (option.includes("10-20") || option.includes("Part-time")) return 15;
    if (option.includes("20-30") || option.includes("Serious")) return 25;
    if (option.includes("30+") || option.includes("Full-time")) return 35;
    return 15; // default
};

/**
 * Transform deadline option to months
 */
const parseDeadline = (option: string): number => {
    if (option.includes("ASAP") || option.includes("1 month")) return 1;
    if (option.includes("3 month")) return 3;
    if (option.includes("6 month")) return 6;
    if (option.includes("12 month") || option.includes("year")) return 12;
    if (option.includes("No deadline") || option.includes("Flexible") || option.includes("flexible")) return 24;
    return 6; // default
};

// ============================================================================
// Condition Functions
// ============================================================================

/**
 * Check if the user's goal is job-focused
 */
const isJobFocusedGoal = (ctx: DecisionContext): boolean => {
    const goal = ctx.formState.goal?.toLowerCase() ?? "";
    return (
        goal.includes("job") ||
        goal.includes("career") ||
        goal.includes("hire") ||
        goal.includes("employ")
    );
};

/**
 * Check if the user's goal is project-focused
 */
const isProjectFocusedGoal = (ctx: DecisionContext): boolean => {
    const goal = ctx.formState.goal?.toLowerCase() ?? "";
    return (
        goal.includes("project") ||
        goal.includes("build") ||
        goal.includes("side") ||
        goal.includes("saas") ||
        goal.includes("startup")
    );
};

/**
 * Check if user wants a flexible timeline
 */
const wantsFlexibleTimeline = (ctx: DecisionContext): boolean => {
    const lastAnswer = Object.values(ctx.answerHistory).pop()?.toLowerCase() ?? "";
    return lastAnswer.includes("flexible") || lastAnswer.includes("no rush");
};

/**
 * Check if user is a complete beginner
 */
const isCompleteBeginner = (ctx: DecisionContext): boolean => {
    const skillLevel = ctx.answerHistory["skill_level"]?.toLowerCase() ?? "";
    return skillLevel.includes("beginner") || skillLevel.includes("never");
};

/**
 * Check if user has advanced skills
 */
const isAdvanced = (ctx: DecisionContext): boolean => {
    const skillLevel = ctx.answerHistory["skill_level"]?.toLowerCase() ?? "";
    return skillLevel.includes("advanced") || skillLevel.includes("senior");
};

// ============================================================================
// Node Definitions
// ============================================================================

const nodes: Record<string, DecisionNode> = {
    // Initial question - What's your goal?
    goal: {
        id: "goal",
        question: "What's your ultimate career goal?",
        subtext: "This helps us create a personalized learning path",
        field: "goal",
        allowFreeInput: true,
        inputPlaceholder: "Type your own goal...",
        options: [
            {
                label: "Get a new job",
                description: "Find employment in tech",
                isRecommended: true,
                nextNodeId: "job_type",
                testId: "goal-new-job",
            },
            {
                label: "Build a side project",
                description: "Create something of your own",
                nextNodeId: "project_type",
                testId: "goal-side-project",
            },
            {
                label: "Upskill current role",
                description: "Advance in your current position",
                nextNodeId: "time_commitment",
                testId: "goal-upskill",
            },
            {
                label: "Start freelancing",
                description: "Work independently with clients",
                nextNodeId: "time_commitment",
                testId: "goal-freelance",
            },
        ],
        defaultNextNodeId: "time_commitment",
    },

    // Job-focused branch: What type of role?
    job_type: {
        id: "job_type",
        question: "What type of role are you targeting?",
        acknowledgmentTemplate: 'Exciting! "{answer}" is a great goal.',
        field: "learningStyle", // Reusing field for job type preference
        options: [
            {
                label: "Backend Developer",
                description: "APIs, databases, server-side logic",
                testId: "job-backend",
            },
            {
                label: "Frontend Developer",
                description: "User interfaces, React, CSS",
                testId: "job-frontend",
            },
            {
                label: "Full Stack Developer",
                description: "End-to-end development",
                isRecommended: true,
                testId: "job-fullstack",
            },
            {
                label: "DevOps/Cloud Engineer",
                description: "Infrastructure and deployment",
                testId: "job-devops",
            },
        ],
        defaultNextNodeId: "time_commitment",
    },

    // Project-focused branch: What type of project?
    project_type: {
        id: "project_type",
        question: "What kind of project do you want to build?",
        acknowledgmentTemplate: 'Nice! "{answer}" sounds exciting.',
        options: [
            {
                label: "Web Application",
                description: "Full-featured web app (SaaS, tool, etc.)",
                isRecommended: true,
                testId: "project-webapp",
            },
            {
                label: "Mobile App",
                description: "iOS or Android application",
                testId: "project-mobile",
            },
            {
                label: "API/Backend Service",
                description: "Backend system or microservices",
                testId: "project-api",
            },
            {
                label: "Portfolio Website",
                description: "Personal or business website",
                testId: "project-portfolio",
            },
        ],
        defaultNextNodeId: "time_commitment",
    },

    // Time commitment question
    time_commitment: {
        id: "time_commitment",
        question: "How many hours per week can you dedicate to learning?",
        acknowledgmentTemplate: "Great choice!",
        field: "timeCommitment",
        transformValue: (option) => parseTimeCommitment(option),
        options: [
            {
                label: "5-10 hours (Casual)",
                description: "Perfect for busy schedules",
                testId: "time-casual",
            },
            {
                label: "10-20 hours (Part-time)",
                description: "Solid commitment for steady progress",
                isRecommended: true,
                testId: "time-parttime",
            },
            {
                label: "20-30 hours (Serious)",
                description: "Intensive learning pace",
                testId: "time-serious",
            },
            {
                label: "30+ hours (Full-time)",
                description: "All-in dedication",
                testId: "time-fulltime",
            },
        ],
        defaultNextNodeId: "skill_level",
    },

    // Skill level question
    skill_level: {
        id: "skill_level",
        question: "What's your current programming skill level?",
        acknowledgmentTemplate: "{answer} - that's a solid commitment!",
        field: "learningStyle", // Using learningStyle to store skill level
        options: [
            {
                label: "Complete Beginner",
                description: "Never written code before",
                nextNodeId: "beginner_support",
                testId: "skill-beginner",
            },
            {
                label: "Some Basics",
                description: "Know variables, loops, functions",
                testId: "skill-basics",
            },
            {
                label: "Intermediate",
                description: "Built small projects before",
                isRecommended: true,
                testId: "skill-intermediate",
            },
            {
                label: "Advanced",
                description: "Professional experience",
                nextNodeId: "advanced_focus",
                testId: "skill-advanced",
            },
        ],
        defaultNextNodeId: "deadline",
    },

    // Beginner support question
    beginner_support: {
        id: "beginner_support",
        question:
            "No worries, everyone starts somewhere! Would you like extra support for beginners?",
        acknowledgmentTemplate: "Starting from scratch is brave!",
        options: [
            {
                label: "Yes, give me extra guidance",
                description: "More explanations, slower pace",
                isRecommended: true,
                testId: "support-yes",
            },
            {
                label: "No, I learn fast",
                description: "Standard pace is fine",
                testId: "support-no",
            },
        ],
        defaultNextNodeId: "deadline",
    },

    // Advanced focus question
    advanced_focus: {
        id: "advanced_focus",
        question: "Great! As an advanced learner, what would you like to focus on?",
        acknowledgmentTemplate: "Awesome, you've got solid experience!",
        options: [
            {
                label: "System Design",
                description: "Architecture and scalability",
                testId: "focus-system",
            },
            {
                label: "New Technologies",
                description: "Cutting-edge tools and frameworks",
                isRecommended: true,
                testId: "focus-tech",
            },
            {
                label: "Best Practices",
                description: "Clean code, testing, patterns",
                testId: "focus-practices",
            },
            {
                label: "Leadership Skills",
                description: "Technical leadership and mentoring",
                testId: "focus-leadership",
            },
        ],
        defaultNextNodeId: "deadline",
    },

    // Deadline question
    deadline: {
        id: "deadline",
        question: "When do you want to achieve this goal?",
        acknowledgmentTemplate: "Got it!",
        field: "deadline",
        transformValue: (option) => parseDeadline(option),
        options: [
            {
                label: "ASAP (1-3 months)",
                description: "Intensive sprint",
                testId: "deadline-asap",
            },
            {
                label: "6 months",
                description: "Balanced timeline",
                isRecommended: true,
                testId: "deadline-6mo",
            },
            {
                label: "12 months",
                description: "Comfortable pace",
                testId: "deadline-12mo",
            },
            {
                label: "Flexible / No deadline",
                description: "Learn at your own pace",
                nextNodeId: "complete",
                testId: "deadline-flexible",
            },
        ],
        defaultNextNodeId: "complete",
    },

    // Complete - terminal node
    complete: {
        id: "complete",
        question: "", // Not displayed
        isTerminal: true,
    },
};

// ============================================================================
// Initial Form State
// ============================================================================

const initialFormState: GoalFormState = {
    goal: "",
    timeCommitment: 15,
    deadline: 6,
    focus: ["frontend", "backend"],
};

// ============================================================================
// Tree Definition
// ============================================================================

export const goalDefinitionTree: DecisionTree = {
    name: "Goal Definition",
    description:
        "A conversational flow to define learning goals with dynamic branching based on user responses",
    rootNodeId: "goal",
    nodes,
    initialFormState,
    welcomeMessage:
        "Hi! I'm your AI learning assistant. I'll help you create a personalized learning path. Let's start by understanding your goals.",
    completionMessage:
        "Excellent! Based on your responses, I've generated a personalized learning path. Here's your roadmap:",
};

// ============================================================================
// Alternative Trees for A/B Testing
// ============================================================================

/**
 * A simpler 4-step tree without branching (for A/B testing)
 */
export const simpleGoalTree: DecisionTree = {
    name: "Simple Goal Definition",
    description: "A straightforward 4-step flow without conditional branching",
    rootNodeId: "goal",
    nodes: {
        goal: {
            ...nodes.goal,
            options: nodes.goal.options?.map((o) => ({
                ...o,
                nextNodeId: "time_commitment",
            })),
        },
        time_commitment: {
            ...nodes.time_commitment,
            defaultNextNodeId: "skill_level",
        },
        skill_level: {
            ...nodes.skill_level,
            options: nodes.skill_level.options?.map((o) => ({
                ...o,
                nextNodeId: "deadline",
            })),
        },
        deadline: {
            ...nodes.deadline,
            options: nodes.deadline.options?.map((o) => ({
                ...o,
                nextNodeId: "complete",
            })),
        },
        complete: nodes.complete,
    },
    initialFormState,
    welcomeMessage:
        "Hi! I'm your AI learning assistant. Let's create your personalized learning path in just 4 quick questions.",
    completionMessage:
        "Perfect! I've created your personalized learning path. Here's what I've built for you:",
};
