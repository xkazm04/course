export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

export type SkillCategory =
    | "frontend"
    | "backend"
    | "database"
    | "devops"
    | "mobile"
    | "design"
    | "tools";

export interface Skill {
    id: string;
    name: string;
    category: SkillCategory;
    currentXp: number;
    maxXp: number;
    level: SkillLevel;
    crowns: number;
    color: string;
}

export interface RadarChartData {
    category: string;
    value: number;
    maxValue: number;
    label: string;
}

export const CATEGORY_CONFIG: Record<SkillCategory, { label: string; color: string }> = {
    frontend: { label: "Frontend", color: "ember" },
    backend: { label: "Backend", color: "success" },
    database: { label: "Database", color: "gold" },
    devops: { label: "DevOps", color: "info" },
    mobile: { label: "Mobile", color: "ember-glow" },
    design: { label: "Design", color: "ember-glow" },
    tools: { label: "Tools", color: "gold" },
};
