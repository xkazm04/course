/**
 * Test Personas for Goal Path API Testing
 *
 * Defines 5 distinct user personas with varying characteristics
 * for comprehensive testing of path generation algorithms.
 */

import type {
    LiveFormRequest,
    EnhancedRequest,
    OracleRequest,
    ChatRequest,
    FocusArea,
    LearningStyle,
    RiskTolerance,
    IndustrySector,
} from "../lib/types";

/**
 * Persona definition
 */
export interface Persona {
    id: string;
    name: string;
    description: string;
    characteristics: {
        experience: "beginner" | "intermediate" | "advanced";
        timeAvailable: "limited" | "moderate" | "intensive";
        learningStyle: LearningStyle;
        motivation: string;
    };
}

// ============================================================================
// PERSONA DEFINITIONS
// ============================================================================

export const personas: Persona[] = [
    {
        id: "beginner-career-changer",
        name: "Career Changer Carol",
        description: "Complete beginner transitioning from non-tech career, limited time but highly motivated",
        characteristics: {
            experience: "beginner",
            timeAvailable: "limited",
            learningStyle: "video",
            motivation: "Career change to tech industry",
        },
    },
    {
        id: "intermediate-upskill",
        name: "Upskilling Uma",
        description: "Intermediate developer looking to add new skills to current stack",
        characteristics: {
            experience: "intermediate",
            timeAvailable: "moderate",
            learningStyle: "project",
            motivation: "Add valuable skills for promotion",
        },
    },
    {
        id: "advanced-specialization",
        name: "Specialist Sam",
        description: "Advanced developer aiming for deep specialization in a domain",
        characteristics: {
            experience: "advanced",
            timeAvailable: "moderate",
            learningStyle: "text",
            motivation: "Become a domain expert",
        },
    },
    {
        id: "time-constrained",
        name: "Busy Blake",
        description: "Working professional with very limited time for learning",
        characteristics: {
            experience: "beginner",
            timeAvailable: "limited",
            learningStyle: "interactive",
            motivation: "Learn efficiently with minimal time",
        },
    },
    {
        id: "intensive-bootcamp",
        name: "Intensive Ivan",
        description: "Full-time learner with maximum time availability",
        characteristics: {
            experience: "beginner",
            timeAvailable: "intensive",
            learningStyle: "project",
            motivation: "Fastest path to employment",
        },
    },
];

// ============================================================================
// LIVE FORM PERSONA CONFIGURATIONS
// ============================================================================

export function getLiveFormConfigs(): { persona: Persona; request: LiveFormRequest }[] {
    return [
        {
            persona: personas[0], // Career Changer
            request: {
                goal: "Become a Full Stack Developer",
                timeCommitment: 10,
                deadline: 12,
                focus: ["frontend", "backend"] as FocusArea[],
                learningStyle: "video",
            },
        },
        {
            persona: personas[1], // Upskilling
            request: {
                goal: "Become a React Specialist",
                timeCommitment: 15,
                deadline: 6,
                focus: ["frontend"] as FocusArea[],
                learningStyle: "project",
            },
        },
        {
            persona: personas[2], // Advanced Specialist
            request: {
                goal: "Master Node.js and System Design",
                timeCommitment: 20,
                deadline: 6,
                focus: ["backend", "devops"] as FocusArea[],
                learningStyle: "text",
            },
        },
        {
            persona: personas[3], // Time Constrained
            request: {
                goal: "Start a career in web development",
                timeCommitment: 5,
                deadline: 18,
                focus: ["frontend"] as FocusArea[],
                learningStyle: "interactive",
            },
        },
        {
            persona: personas[4], // Intensive
            request: {
                goal: "Become job-ready as a full stack developer in 3 months",
                timeCommitment: 40,
                deadline: 3,
                focus: ["frontend", "backend", "devops"] as FocusArea[],
                learningStyle: "project",
            },
        },
    ];
}

// ============================================================================
// AI CHAT PERSONA CONFIGURATIONS
// ============================================================================

export function getChatConfigs(): { persona: Persona; request: ChatRequest }[] {
    return [
        {
            persona: personas[0], // Explorer
            request: {
                messages: [
                    { role: "assistant", content: "Hi! I'm your AI learning assistant. What's your ultimate career goal?" },
                    { role: "user", content: "I want to become a web developer but I'm not sure where to start" },
                ],
                stage: "goal_collection",
                collectedData: { goal: "web developer" },
            },
        },
        {
            persona: personas[1], // Guided Journey
            request: {
                messages: [
                    { role: "assistant", content: "Hi! What's your ultimate career goal?" },
                    { role: "user", content: "Become a Backend Developer" },
                    { role: "assistant", content: "Great choice! How many hours per week can you dedicate?" },
                    { role: "user", content: "10-20 hours" },
                ],
                stage: "time_collection",
                collectedData: { goal: "Become a Backend Developer", timeCommitment: 15 },
            },
        },
        {
            persona: personas[2], // Clarification Seeker
            request: {
                messages: [
                    { role: "assistant", content: "Hi! What's your career goal?" },
                    { role: "user", content: "I want to work with AI but also build web apps - is that possible?" },
                ],
                stage: "goal_collection",
                collectedData: {},
            },
        },
        {
            persona: personas[3], // Fast Tracker
            request: {
                messages: [
                    { role: "assistant", content: "Hi! What's your career goal?" },
                    { role: "user", content: "Get a new job" },
                    { role: "assistant", content: "How many hours per week?" },
                    { role: "user", content: "5-10 hours" },
                    { role: "assistant", content: "Current skill level?" },
                    { role: "user", content: "Complete Beginner" },
                ],
                stage: "skill_level_collection",
                collectedData: { goal: "Get a new job", timeCommitment: 7, skillLevel: "beginner" },
            },
        },
        {
            persona: personas[4], // Detailed Planner
            request: {
                messages: [
                    { role: "assistant", content: "Hi! What's your career goal?" },
                    { role: "user", content: "I want to build a SaaS product and potentially start my own company" },
                    { role: "assistant", content: "How many hours per week?" },
                    { role: "user", content: "30+ hours" },
                    { role: "assistant", content: "Skill level?" },
                    { role: "user", content: "Intermediate" },
                    { role: "assistant", content: "When do you want to achieve this?" },
                    { role: "user", content: "6 months" },
                ],
                stage: "deadline_collection",
                collectedData: {
                    goal: "Build a SaaS product",
                    timeCommitment: 35,
                    skillLevel: "intermediate",
                    deadline: 6,
                },
            },
        },
    ];
}

// ============================================================================
// ENHANCED/WIZARD PERSONA CONFIGURATIONS
// ============================================================================

export function getEnhancedConfigs(): { persona: Persona; request: EnhancedRequest }[] {
    return [
        {
            persona: personas[0], // System Design
            request: {
                goal: "Master system design and become a senior engineer",
                learningStyle: "text",
                timeCommitment: 15,
                deadline: 12,
                currentLevel: "intermediate",
                interests: ["distributed systems", "architecture", "scalability"],
            },
        },
        {
            persona: personas[1], // Frontend Mastery
            request: {
                goal: "Become a frontend expert with React and design systems",
                learningStyle: "project",
                timeCommitment: 20,
                deadline: 6,
                currentLevel: "intermediate",
                interests: ["React", "TypeScript", "design systems", "accessibility"],
            },
        },
        {
            persona: personas[2], // DevOps Transition
            request: {
                goal: "Transition from developer to DevOps engineer",
                learningStyle: "interactive",
                timeCommitment: 15,
                deadline: 9,
                currentLevel: "intermediate",
                interests: ["Docker", "Kubernetes", "CI/CD", "cloud"],
            },
        },
        {
            persona: personas[3], // AI/ML Path
            request: {
                goal: "Add AI and machine learning skills to my development toolkit",
                learningStyle: "video",
                timeCommitment: 10,
                deadline: 12,
                currentLevel: "advanced",
                interests: ["Python", "ML fundamentals", "LLMs", "data pipelines"],
            },
        },
        {
            persona: personas[4], // Staff Engineer
            request: {
                goal: "Develop skills for a staff engineer role",
                learningStyle: "text",
                timeCommitment: 10,
                deadline: 18,
                currentLevel: "advanced",
                interests: ["leadership", "architecture", "mentoring", "strategy"],
            },
        },
    ];
}

// ============================================================================
// CAREER ORACLE PERSONA CONFIGURATIONS
// ============================================================================

export function getOracleConfigs(): { persona: Persona; request: OracleRequest }[] {
    return [
        {
            persona: personas[0], // Tech Startup
            request: {
                action: "predictions",
                currentSkills: [
                    { name: "JavaScript", proficiency: 3 },
                    { name: "React", proficiency: 2 },
                    { name: "Node.js", proficiency: 2 },
                ],
                targetRole: "Full Stack Developer at a Startup",
                targetSector: "tech_startups" as IndustrySector,
                weeklyHours: 15,
                learningStyle: "project" as LearningStyle,
                riskTolerance: "aggressive" as RiskTolerance,
                remotePreference: "full",
                horizon: "6m",
            },
        },
        {
            persona: personas[1], // Enterprise Path
            request: {
                action: "path",
                currentSkills: [
                    { name: "Java", proficiency: 4 },
                    { name: "Spring", proficiency: 3 },
                    { name: "SQL", proficiency: 4 },
                ],
                targetRole: "Senior Backend Engineer",
                targetSector: "enterprise" as IndustrySector,
                weeklyHours: 10,
                learningStyle: "text" as LearningStyle,
                riskTolerance: "conservative" as RiskTolerance,
                remotePreference: "hybrid",
                horizon: "12m",
                targetSalary: 150000,
            },
        },
        {
            persona: personas[2], // Fintech Focus
            request: {
                action: "jobs",
                currentSkills: [
                    { name: "Python", proficiency: 4 },
                    { name: "SQL", proficiency: 4 },
                    { name: "Data Analysis", proficiency: 3 },
                ],
                targetRole: "Fintech Developer",
                targetSector: "fintech" as IndustrySector,
                weeklyHours: 20,
                learningStyle: "project" as LearningStyle,
                riskTolerance: "moderate" as RiskTolerance,
                remotePreference: "any",
                horizon: "12m",
                targetSalary: 140000,
                location: "New York",
            },
        },
        {
            persona: personas[3], // AI/ML Career
            request: {
                action: "predictions",
                currentSkills: [
                    { name: "Python", proficiency: 3 },
                    { name: "TensorFlow", proficiency: 2 },
                    { name: "Data Science", proficiency: 2 },
                ],
                targetRole: "Machine Learning Engineer",
                targetSector: "ai_ml" as IndustrySector,
                weeklyHours: 25,
                learningStyle: "interactive" as LearningStyle,
                riskTolerance: "aggressive" as RiskTolerance,
                remotePreference: "full",
                horizon: "24m",
            },
        },
        {
            persona: personas[4], // Freelance Builder
            request: {
                action: "path",
                currentSkills: [
                    { name: "JavaScript", proficiency: 4 },
                    { name: "React", proficiency: 4 },
                    { name: "Node.js", proficiency: 3 },
                    { name: "AWS", proficiency: 2 },
                ],
                targetRole: "Freelance Full Stack Consultant",
                targetSector: "tech_startups" as IndustrySector,
                weeklyHours: 30,
                learningStyle: "project" as LearningStyle,
                riskTolerance: "aggressive" as RiskTolerance,
                remotePreference: "full",
                horizon: "6m",
            },
        },
    ];
}
