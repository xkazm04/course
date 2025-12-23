// Mock data for the course platform
import { LEARNING_DOMAINS } from "./learningDomains";
import type {
    LearningPath,
    CareerGoal,
    JobPosting,
    ChapterContent,
    Community,
    ProjectIdea,
    Achievement,
    LevelThreshold,
} from "./types";

// Re-export types for backwards compatibility
export type { LearningPath, CareerGoal, JobPosting, ChapterContent, Community, ProjectIdea, Achievement, LevelThreshold } from "./types";

/**
 * Learning paths derived from the centralized domain definitions
 * This ensures consistency between domain ontology and mock data
 */
export const learningPaths: LearningPath[] = [
    {
        id: "frontend",
        name: LEARNING_DOMAINS.frontend.name,
        icon: LEARNING_DOMAINS.frontend.iconName,
        color: LEARNING_DOMAINS.frontend.color,
        description: LEARNING_DOMAINS.frontend.description,
        courses: 24,
        hours: 180,
        skills: ["React", "CSS", "TypeScript", "Next.js"],
    },
    {
        id: "fullstack",
        name: LEARNING_DOMAINS.fullstack.name,
        icon: LEARNING_DOMAINS.fullstack.iconName,
        color: LEARNING_DOMAINS.fullstack.color,
        description: LEARNING_DOMAINS.fullstack.description,
        courses: 42,
        hours: 320,
        skills: ["Node.js", "React", "Databases", "APIs"],
    },
    {
        id: "backend",
        name: LEARNING_DOMAINS.backend.name,
        icon: LEARNING_DOMAINS.backend.iconName,
        color: LEARNING_DOMAINS.backend.color,
        description: LEARNING_DOMAINS.backend.description,
        courses: 28,
        hours: 210,
        skills: ["Node.js", "Python", "Go", "Databases"],
    },
    {
        id: "databases",
        name: LEARNING_DOMAINS.databases.name,
        icon: LEARNING_DOMAINS.databases.iconName,
        color: LEARNING_DOMAINS.databases.color,
        description: LEARNING_DOMAINS.databases.description,
        courses: 18,
        hours: 140,
        skills: ["SQL", "MongoDB", "Redis", "PostgreSQL"],
    },
    {
        id: "games",
        name: LEARNING_DOMAINS.games.name,
        icon: LEARNING_DOMAINS.games.iconName,
        color: LEARNING_DOMAINS.games.color,
        description: LEARNING_DOMAINS.games.description,
        courses: 32,
        hours: 260,
        skills: ["Unity", "C#", "Unreal", "Game Design"],
    },
    {
        id: "mobile",
        name: LEARNING_DOMAINS.mobile.name,
        icon: LEARNING_DOMAINS.mobile.iconName,
        color: LEARNING_DOMAINS.mobile.color,
        description: LEARNING_DOMAINS.mobile.description,
        courses: 22,
        hours: 170,
        skills: ["React Native", "Flutter", "Swift", "Kotlin"],
    },
];

export const careerGoals: CareerGoal[] = [
    {
        id: "backend-dev",
        title: "Become a Backend Developer",
        duration: "6-8 months",
        salary: "$85,000 - $130,000",
        demand: "High",
        modules: 12,
    },
    {
        id: "aws-cert",
        title: "Pass AWS Solutions Architect",
        duration: "3-4 months",
        salary: "+$15,000 certification bonus",
        demand: "Very High",
        modules: 8,
    },
    {
        id: "saas-builder",
        title: "Build a SaaS Product",
        duration: "4-6 months",
        salary: "Entrepreneurial",
        demand: "Self-directed",
        modules: 15,
    },
    {
        id: "frontend-senior",
        title: "Become a Senior Frontend Engineer",
        duration: "12-18 months",
        salary: "$120,000 - $180,000",
        demand: "High",
        modules: 20,
    },
];

export const jobPostings: JobPosting[] = [
    {
        company: "TechCorp",
        role: "Senior Backend Developer",
        salary: "$140,000",
        location: "Remote",
        skills: ["Node.js", "PostgreSQL", "AWS"],
        match: 85,
    },
    {
        company: "StartupXYZ",
        role: "Full Stack Engineer",
        salary: "$125,000",
        location: "San Francisco, CA",
        skills: ["React", "Node.js", "MongoDB"],
        match: 92,
    },
    {
        company: "BigTech Inc",
        role: "Frontend Engineer",
        salary: "$135,000",
        location: "New York, NY",
        skills: ["React", "TypeScript", "CSS"],
        match: 78,
    },
];

export const chapterContent: ChapterContent = {
    title: "Understanding React Hooks",
    duration: "45 min",
    sections: [
        {
            type: "text",
            content: "React Hooks revolutionized how we write React components by allowing us to use state and other React features in functional components.",
        },
        {
            type: "code",
            language: "typescript",
            content: `import { useState, useEffect } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Clicked {count} times
    </button>
  );
}`,
        },
        {
            type: "text",
            content: "The useState hook returns a pair: the current state value and a function to update it. The useEffect hook lets you perform side effects in your components.",
        },
    ],
};

export const communities: Community[] = [
    { name: "React Discord", members: "250k+", type: "Discord" },
    { name: "Dev.to", members: "1M+", type: "Forum" },
    { name: "r/reactjs", members: "400k+", type: "Reddit" },
    { name: "Frontend Masters Slack", members: "50k+", type: "Slack" },
];

export const projectIdeas: ProjectIdea[] = [
    { name: "Todo App with Authentication", difficulty: "Beginner", time: "2-3 days" },
    { name: "E-commerce Dashboard", difficulty: "Intermediate", time: "1-2 weeks" },
    { name: "Real-time Chat Application", difficulty: "Advanced", time: "2-3 weeks" },
    { name: "Portfolio Website", difficulty: "Beginner", time: "1-2 days" },
];

/**
 * Career milestone achievements for the gamified progression system.
 * Used in VariantD (Gamified Career Mapping) to track career progression.
 */
export const achievements: Achievement[] = [
    {
        id: 1,
        title: "Internship Ready",
        progress: 100,
        locked: false,
        reward: "Unlock Job Board",
        xp: 500,
        description: "Complete foundational skills to be internship-ready"
    },
    {
        id: 2,
        title: "Junior Developer",
        progress: 65,
        locked: true,
        reward: "Unlock Salary Data",
        xp: 1200,
        description: "Master core programming concepts and frameworks"
    },
    {
        id: 3,
        title: "Mid-Level Engineer",
        progress: 30,
        locked: true,
        reward: "Unlock Client List",
        xp: 2000,
        description: "Build production-ready applications independently"
    },
    {
        id: 4,
        title: "Senior Developer",
        progress: 10,
        locked: true,
        reward: "Unlock Leadership Track",
        xp: 3500,
        description: "Lead projects and mentor junior developers"
    },
];

/**
 * Level thresholds for the XP-based progression system.
 * Defines titles and XP requirements for each level.
 */
export const levelThresholds: LevelThreshold[] = [
    { level: 1, title: "Novice Explorer", minXp: 0 },
    { level: 2, title: "Code Apprentice", minXp: 500 },
    { level: 3, title: "Digital Craftsman", minXp: 1500 },
    { level: 4, title: "Career Architect", minXp: 3000 },
    { level: 5, title: "Tech Visionary", minXp: 5000 },
];
