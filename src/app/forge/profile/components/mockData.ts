import type { Skill, SkillCategory, RadarChartData } from "./types";

export const mockSkills: Skill[] = [
    { id: "react", name: "React", category: "frontend", currentXp: 850, maxXp: 1500, level: "advanced", crowns: 4, color: "cyan" },
    { id: "typescript", name: "TypeScript", category: "frontend", currentXp: 620, maxXp: 1500, level: "advanced", crowns: 3, color: "blue" },
    { id: "css", name: "CSS & Styling", category: "frontend", currentXp: 450, maxXp: 500, level: "intermediate", crowns: 4, color: "pink" },
    { id: "nextjs", name: "Next.js", category: "frontend", currentXp: 380, maxXp: 500, level: "intermediate", crowns: 3, color: "slate" },
    { id: "nodejs", name: "Node.js", category: "backend", currentXp: 520, maxXp: 1500, level: "advanced", crowns: 3, color: "emerald" },
    { id: "api-design", name: "API Design", category: "backend", currentXp: 280, maxXp: 500, level: "intermediate", crowns: 2, color: "violet" },
    { id: "sql", name: "SQL", category: "database", currentXp: 340, maxXp: 500, level: "intermediate", crowns: 3, color: "orange" },
    { id: "mongodb", name: "MongoDB", category: "database", currentXp: 150, maxXp: 500, level: "intermediate", crowns: 1, color: "green" },
    { id: "git", name: "Git & GitHub", category: "devops", currentXp: 420, maxXp: 500, level: "intermediate", crowns: 4, color: "red" },
    { id: "docker", name: "Docker", category: "devops", currentXp: 85, maxXp: 100, level: "beginner", crowns: 1, color: "sky" },
    { id: "testing", name: "Testing", category: "tools", currentXp: 220, maxXp: 500, level: "intermediate", crowns: 2, color: "lime" },
    { id: "ui-design", name: "UI Design", category: "design", currentXp: 310, maxXp: 500, level: "intermediate", crowns: 3, color: "purple" },
];

export const getSkillsByCategory = (category: SkillCategory): Skill[] => {
    return mockSkills.filter((skill) => skill.category === category);
};

export const getRadarChartData = (): RadarChartData[] => {
    const categories: SkillCategory[] = ["frontend", "backend", "database", "devops", "mobile", "design", "tools"];

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
    return [...mockSkills].sort((a, b) => b.currentXp - a.currentXp).slice(0, limit);
};
