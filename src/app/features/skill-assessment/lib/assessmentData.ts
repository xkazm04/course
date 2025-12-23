/**
 * Assessment Data - Questions and Path Configurations
 *
 * Contains all questions for the 60-second skill assessment
 * and path configurations for personalization.
 */

import {
    AssessmentQuestion,
    PathConfig,
    IntensityConfig,
    LearningPath,
    LearningIntensity,
} from "./types";

/**
 * Path configurations with scoring weights and display info
 */
export const pathConfigs: PathConfig[] = [
    {
        id: "frontend-mastery",
        name: "Frontend Mastery",
        shortName: "Frontend",
        description: "Master React, TypeScript, and modern UI development",
        icon: "Palette",
        color: "indigo",
        gradient: "from-indigo-500 to-purple-600",
        modules: ["overview", "goal-path", "chapter", "career-mapping"],
    },
    {
        id: "fullstack-architect",
        name: "Fullstack Architect",
        shortName: "Fullstack",
        description: "Build complete applications from frontend to backend",
        icon: "Layers",
        color: "purple",
        gradient: "from-purple-500 to-pink-600",
        modules: ["overview", "goal-path", "chapter", "career-mapping"],
    },
    {
        id: "backend-specialist",
        name: "Backend Specialist",
        shortName: "Backend",
        description: "Focus on APIs, databases, and server architecture",
        icon: "Server",
        color: "emerald",
        gradient: "from-emerald-500 to-teal-600",
        modules: ["overview", "goal-path", "chapter", "career-mapping"],
    },
    {
        id: "devops-engineer",
        name: "DevOps Engineer",
        shortName: "DevOps",
        description: "Master CI/CD, cloud, and infrastructure",
        icon: "Cloud",
        color: "cyan",
        gradient: "from-cyan-500 to-blue-600",
        modules: ["overview", "goal-path", "chapter", "career-mapping"],
    },
    {
        id: "mobile-developer",
        name: "Mobile Developer",
        shortName: "Mobile",
        description: "Build iOS and Android apps with React Native",
        icon: "Smartphone",
        color: "orange",
        gradient: "from-orange-500 to-red-600",
        modules: ["overview", "goal-path", "chapter", "career-mapping"],
    },
    {
        id: "ai-ml-engineer",
        name: "AI/ML Engineer",
        shortName: "AI/ML",
        description: "Integrate AI and machine learning into applications",
        icon: "Brain",
        color: "pink",
        gradient: "from-pink-500 to-rose-600",
        modules: ["overview", "goal-path", "chapter", "career-mapping"],
    },
];

/**
 * Intensity configurations
 */
export const intensityConfigs: IntensityConfig[] = [
    {
        id: "4-week-sprint",
        name: "4-Week Sprint",
        weeks: 4,
        hoursPerWeek: 20,
        description: "Intensive fast-track for focused learners",
    },
    {
        id: "8-week-balanced",
        name: "8-Week Balanced",
        weeks: 8,
        hoursPerWeek: 12,
        description: "Balanced pace with room for practice",
    },
    {
        id: "12-week-intensive",
        name: "12-Week Intensive",
        weeks: 12,
        hoursPerWeek: 8,
        description: "Thorough coverage with steady progress",
    },
    {
        id: "16-week-comprehensive",
        name: "16-Week Comprehensive",
        weeks: 16,
        hoursPerWeek: 5,
        description: "Comprehensive deep-dive at comfortable pace",
    },
];

/**
 * Assessment questions with branching logic
 */
export const assessmentQuestions: AssessmentQuestion[] = [
    // Question 1: Experience Level
    {
        id: "experience-level",
        category: "experience",
        question: "What's your coding experience?",
        subtext: "Be honest - we'll customize your path",
        order: 1,
        options: [
            {
                id: "complete-beginner",
                label: "Complete Beginner",
                description: "Never written code before",
                pathWeights: {
                    "frontend-mastery": 8,
                    "fullstack-architect": 3,
                    "backend-specialist": 3,
                },
            },
            {
                id: "some-basics",
                label: "Know the Basics",
                description: "HTML, CSS, or some JavaScript",
                pathWeights: {
                    "frontend-mastery": 10,
                    "fullstack-architect": 6,
                    "mobile-developer": 5,
                },
            },
            {
                id: "intermediate",
                label: "Intermediate",
                description: "Built a few projects, learning frameworks",
                pathWeights: {
                    "frontend-mastery": 8,
                    "fullstack-architect": 10,
                    "backend-specialist": 8,
                    "devops-engineer": 5,
                },
            },
            {
                id: "advanced",
                label: "Advanced",
                description: "Professional experience, seeking mastery",
                pathWeights: {
                    "fullstack-architect": 10,
                    "backend-specialist": 9,
                    "devops-engineer": 8,
                    "ai-ml-engineer": 10,
                },
            },
        ],
    },
    // Question 2: Primary Interest
    {
        id: "primary-interest",
        category: "preferences",
        question: "What excites you most?",
        subtext: "Pick what sparks your curiosity",
        order: 2,
        options: [
            {
                id: "visual-ui",
                label: "Visual & UI Design",
                description: "Creating beautiful, interactive interfaces",
                pathWeights: {
                    "frontend-mastery": 10,
                    "mobile-developer": 7,
                },
            },
            {
                id: "logic-systems",
                label: "Logic & Systems",
                description: "Building robust backend architectures",
                pathWeights: {
                    "backend-specialist": 10,
                    "fullstack-architect": 7,
                    "devops-engineer": 6,
                },
            },
            {
                id: "full-products",
                label: "Full Products",
                description: "Creating complete applications end-to-end",
                pathWeights: {
                    "fullstack-architect": 10,
                    "frontend-mastery": 5,
                    "backend-specialist": 5,
                },
            },
            {
                id: "ai-innovation",
                label: "AI & Innovation",
                description: "Working with cutting-edge AI technology",
                pathWeights: {
                    "ai-ml-engineer": 10,
                    "backend-specialist": 5,
                    "fullstack-architect": 4,
                },
            },
        ],
    },
    // Question 3: Goal
    {
        id: "primary-goal",
        category: "goals",
        question: "What's your main goal?",
        subtext: "We'll optimize your curriculum for this",
        order: 3,
        options: [
            {
                id: "career-switch",
                label: "Career Switch",
                description: "Transition into tech from another field",
            },
            {
                id: "first-job",
                label: "Land First Tech Job",
                description: "Get hired as a developer",
            },
            {
                id: "skill-upgrade",
                label: "Level Up Skills",
                description: "Advance in current tech career",
            },
            {
                id: "side-project",
                label: "Build Side Projects",
                description: "Create apps for fun or profit",
            },
        ],
    },
    // Question 4: Available Time
    {
        id: "available-time",
        category: "availability",
        question: "How much time can you dedicate weekly?",
        subtext: "This determines your learning pace",
        order: 4,
        options: [
            {
                id: "5-hours",
                label: "5 Hours/Week",
                description: "Casual, steady learning",
            },
            {
                id: "10-hours",
                label: "10 Hours/Week",
                description: "Part-time commitment",
            },
            {
                id: "20-hours",
                label: "20 Hours/Week",
                description: "Serious dedication",
            },
            {
                id: "40-hours",
                label: "40+ Hours/Week",
                description: "Full-time immersion",
            },
        ],
    },
    // Question 5: Learning Style
    {
        id: "learning-style",
        category: "preferences",
        question: "How do you learn best?",
        subtext: "We'll adjust content delivery",
        order: 5,
        options: [
            {
                id: "video-based",
                label: "Video Tutorials",
                description: "Watch and follow along",
            },
            {
                id: "hands-on",
                label: "Hands-on Projects",
                description: "Learn by building",
            },
            {
                id: "reading-docs",
                label: "Reading & Docs",
                description: "Text-based learning",
            },
            {
                id: "mixed",
                label: "Mix of Everything",
                description: "Variety keeps it fresh",
            },
        ],
    },
];

/**
 * Get path config by ID
 */
export function getPathConfig(pathId: LearningPath): PathConfig {
    return pathConfigs.find((p) => p.id === pathId) || pathConfigs[0];
}

/**
 * Get intensity config by ID
 */
export function getIntensityConfig(intensityId: LearningIntensity): IntensityConfig {
    return intensityConfigs.find((i) => i.id === intensityId) || intensityConfigs[1];
}

/**
 * Get questions in order, filtered by conditional logic
 */
export function getVisibleQuestions(answers: Map<string, string[]>): AssessmentQuestion[] {
    return assessmentQuestions
        .filter((q) => {
            if (!q.showIf) return true;
            const prevAnswers = answers.get(q.showIf.questionId) || [];
            const requiredAnswers = Array.isArray(q.showIf.answerId)
                ? q.showIf.answerId
                : [q.showIf.answerId];
            return requiredAnswers.some((a) => prevAnswers.includes(a));
        })
        .sort((a, b) => a.order - b.order);
}
