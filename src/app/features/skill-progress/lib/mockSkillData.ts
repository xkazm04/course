import { Skill, SkillCategory, RadarChartData } from "./types";

export const mockSkills: Skill[] = [
    // Frontend Skills
    {
        id: "react",
        name: "React",
        category: "frontend",
        currentXp: 850,
        maxXp: 1500,
        level: "advanced",
        crowns: 4,
        streak: 12,
        color: "cyan",
        icon: "Atom",
        description: "Building user interfaces with React components and hooks",
        relatedPaths: ["frontend", "fullstack"],
    },
    {
        id: "typescript",
        name: "TypeScript",
        category: "frontend",
        currentXp: 620,
        maxXp: 1500,
        level: "advanced",
        crowns: 3,
        streak: 8,
        color: "blue",
        icon: "FileType",
        description: "Type-safe JavaScript development",
        relatedPaths: ["frontend", "fullstack", "backend"],
    },
    {
        id: "css",
        name: "CSS & Styling",
        category: "frontend",
        currentXp: 450,
        maxXp: 500,
        level: "intermediate",
        crowns: 4,
        streak: 5,
        color: "pink",
        icon: "Palette",
        description: "Modern CSS, Tailwind, and responsive design",
        relatedPaths: ["frontend"],
    },
    {
        id: "nextjs",
        name: "Next.js",
        category: "frontend",
        currentXp: 380,
        maxXp: 500,
        level: "intermediate",
        crowns: 3,
        streak: 7,
        color: "slate",
        icon: "Layers",
        description: "Full-stack React framework with SSR and routing",
        relatedPaths: ["frontend", "fullstack"],
    },

    // Backend Skills
    {
        id: "nodejs",
        name: "Node.js",
        category: "backend",
        currentXp: 520,
        maxXp: 1500,
        level: "advanced",
        crowns: 3,
        streak: 10,
        color: "emerald",
        icon: "Server",
        description: "Server-side JavaScript runtime",
        relatedPaths: ["backend", "fullstack"],
    },
    {
        id: "api-design",
        name: "API Design",
        category: "backend",
        currentXp: 280,
        maxXp: 500,
        level: "intermediate",
        crowns: 2,
        streak: 4,
        color: "violet",
        icon: "Code2",
        description: "RESTful and GraphQL API architecture",
        relatedPaths: ["backend", "fullstack"],
    },
    {
        id: "python",
        name: "Python",
        category: "backend",
        currentXp: 180,
        maxXp: 500,
        level: "intermediate",
        crowns: 2,
        streak: 3,
        color: "yellow",
        icon: "Code",
        description: "General-purpose programming with Python",
        relatedPaths: ["backend", "data-science"],
    },

    // Database Skills
    {
        id: "sql",
        name: "SQL",
        category: "database",
        currentXp: 340,
        maxXp: 500,
        level: "intermediate",
        crowns: 3,
        streak: 6,
        color: "orange",
        icon: "Database",
        description: "Relational database queries and optimization",
        relatedPaths: ["backend", "fullstack", "data-science"],
    },
    {
        id: "mongodb",
        name: "MongoDB",
        category: "database",
        currentXp: 150,
        maxXp: 500,
        level: "intermediate",
        crowns: 1,
        streak: 2,
        color: "green",
        icon: "Database",
        description: "NoSQL document database",
        relatedPaths: ["backend", "fullstack"],
    },

    // DevOps Skills
    {
        id: "git",
        name: "Git & GitHub",
        category: "devops",
        currentXp: 420,
        maxXp: 500,
        level: "intermediate",
        crowns: 4,
        streak: 15,
        color: "red",
        icon: "GitBranch",
        description: "Version control and collaboration",
        relatedPaths: ["frontend", "backend", "fullstack"],
    },
    {
        id: "docker",
        name: "Docker",
        category: "devops",
        currentXp: 85,
        maxXp: 100,
        level: "beginner",
        crowns: 1,
        streak: 1,
        color: "sky",
        icon: "Box",
        description: "Containerization and deployment",
        relatedPaths: ["devops", "fullstack"],
    },

    // Tools
    {
        id: "vscode",
        name: "VS Code",
        category: "tools",
        currentXp: 480,
        maxXp: 500,
        level: "intermediate",
        crowns: 5,
        streak: 20,
        color: "blue",
        icon: "Code2",
        description: "Code editor mastery and extensions",
        relatedPaths: ["frontend", "backend", "fullstack"],
    },
    {
        id: "testing",
        name: "Testing",
        category: "tools",
        currentXp: 220,
        maxXp: 500,
        level: "intermediate",
        crowns: 2,
        streak: 4,
        color: "lime",
        icon: "TestTube",
        description: "Unit, integration, and E2E testing",
        relatedPaths: ["frontend", "backend", "fullstack"],
    },

    // Mobile
    {
        id: "react-native",
        name: "React Native",
        category: "mobile",
        currentXp: 65,
        maxXp: 100,
        level: "beginner",
        crowns: 1,
        streak: 2,
        color: "cyan",
        icon: "Smartphone",
        description: "Cross-platform mobile development",
        relatedPaths: ["mobile"],
    },

    // Design
    {
        id: "ui-design",
        name: "UI Design",
        category: "design",
        currentXp: 310,
        maxXp: 500,
        level: "intermediate",
        crowns: 3,
        streak: 6,
        color: "purple",
        icon: "Figma",
        description: "User interface design principles",
        relatedPaths: ["frontend", "design"],
    },
];

export const getSkillsByCategory = (category: SkillCategory): Skill[] => {
    return mockSkills.filter((skill) => skill.category === category);
};

export const getRadarChartData = (): RadarChartData[] => {
    const categories: SkillCategory[] = [
        "frontend",
        "backend",
        "database",
        "devops",
        "mobile",
        "design",
        "tools",
    ];

    return categories.map((category) => {
        const skills = getSkillsByCategory(category);
        const totalXp = skills.reduce((sum, skill) => sum + skill.currentXp, 0);
        const maxXp = skills.reduce((sum, skill) => sum + skill.maxXp, 0);
        const avgProgress = skills.length > 0 ? (totalXp / maxXp) * 100 : 0;

        return {
            category,
            value: Math.round(avgProgress),
            maxValue: 100,
            label: category.charAt(0).toUpperCase() + category.slice(1),
        };
    });
};

export const getTopSkills = (limit: number = 5): Skill[] => {
    return [...mockSkills]
        .sort((a, b) => b.currentXp - a.currentXp)
        .slice(0, limit);
};

export const getTotalXp = (): number => {
    return mockSkills.reduce((sum, skill) => sum + skill.currentXp, 0);
};

export const getTotalCrowns = (): number => {
    return mockSkills.reduce((sum, skill) => sum + skill.crowns, 0);
};

export const getOverallLevel = (): string => {
    const totalXp = getTotalXp();
    if (totalXp >= 10000) return "Master";
    if (totalXp >= 5000) return "Expert";
    if (totalXp >= 2000) return "Advanced";
    if (totalXp >= 500) return "Intermediate";
    return "Beginner";
};
