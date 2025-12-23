export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export interface Skill {
    id: string;
    name: string;
    category: SkillCategory;
    currentXp: number;
    maxXp: number;
    level: SkillLevel;
    crowns: number; // 0-5 crowns like Duolingo
    streak: number; // days practiced
    color: string;
    icon: string;
    description: string;
    relatedPaths: string[]; // Learning path IDs that contribute to this skill
}

export type SkillCategory =
    | "frontend"
    | "backend"
    | "database"
    | "devops"
    | "mobile"
    | "design"
    | "tools"
    | "softskills";

export interface SkillProgress {
    skillId: string;
    xpGained: number;
    date: string;
    source: string; // Course or activity that contributed
}

export interface SkillTreeNode {
    skill: Skill;
    children: SkillTreeNode[];
    prerequisites: string[];
    isUnlocked: boolean;
}

export interface RadarChartData {
    category: string;
    value: number;
    maxValue: number;
    label: string;
}

export const SKILL_LEVEL_CONFIG: Record<SkillLevel, { minXp: number; maxXp: number; label: string; color: string }> = {
    beginner: { minXp: 0, maxXp: 100, label: "Beginner", color: "slate" },
    intermediate: { minXp: 100, maxXp: 500, label: "Intermediate", color: "indigo" },
    advanced: { minXp: 500, maxXp: 1500, label: "Advanced", color: "purple" },
    expert: { minXp: 1500, maxXp: 5000, label: "Expert", color: "emerald" },
};

export const CATEGORY_CONFIG: Record<SkillCategory, { label: string; color: string; icon: string }> = {
    frontend: { label: "Frontend", color: "indigo", icon: "Monitor" },
    backend: { label: "Backend", color: "emerald", icon: "Server" },
    database: { label: "Database", color: "orange", icon: "Database" },
    devops: { label: "DevOps", color: "cyan", icon: "Cloud" },
    mobile: { label: "Mobile", color: "pink", icon: "Smartphone" },
    design: { label: "Design", color: "purple", icon: "Palette" },
    tools: { label: "Tools", color: "amber", icon: "Wrench" },
    softskills: { label: "Soft Skills", color: "rose", icon: "Users" },
};
