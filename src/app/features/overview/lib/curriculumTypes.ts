/**
 * Curriculum Types for Knowledge Map
 *
 * Comprehensive type system for the 100+ node frontend curriculum
 * that powers the Knowledge Map canvas visualization.
 */

export type CurriculumCategory =
    | "html-css"
    | "javascript"
    | "typescript"
    | "react"
    | "vue"
    | "angular"
    | "testing"
    | "build-tools"
    | "performance"
    | "accessibility"
    | "design-systems"
    | "state-management";

export type NodeStatus = "completed" | "in_progress" | "available" | "locked";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type ResourceType = "article" | "video" | "practice" | "course";

export interface CurriculumResource {
    type: ResourceType;
    title: string;
    url?: string;
}

export interface CurriculumNode {
    id: string;
    title: string;
    description: string;
    category: CurriculumCategory;
    subcategory: string;
    status: NodeStatus;
    estimatedHours: number;
    difficulty: DifficultyLevel;
    skills: string[];
    resources: CurriculumResource[];
    position: { x: number; y: number };
    tier: number; // 0=foundation, 1=core, 2=intermediate, 3=advanced, 4=expert
}

export interface CurriculumConnection {
    from: string;
    to: string;
    type: "required" | "recommended" | "optional";
}

export interface CategoryMeta {
    id: CurriculumCategory;
    name: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
}

export interface CurriculumData {
    nodes: CurriculumNode[];
    connections: CurriculumConnection[];
    categories: CategoryMeta[];
}

export interface ViewportState {
    scale: number;
    translateX: number;
    translateY: number;
}

export const DEFAULT_VIEWPORT: ViewportState = {
    scale: 0.8,
    translateX: 50,
    translateY: 30,
};

// Category metadata with colors
export const CATEGORY_META: CategoryMeta[] = [
    { id: "html-css", name: "HTML & CSS", color: "#e34c26", bgColor: "bg-orange-50 dark:bg-orange-950/30", borderColor: "border-orange-200 dark:border-orange-800", icon: "🎨" },
    { id: "javascript", name: "JavaScript", color: "#f7df1e", bgColor: "bg-yellow-50 dark:bg-yellow-950/30", borderColor: "border-yellow-200 dark:border-yellow-800", icon: "⚡" },
    { id: "typescript", name: "TypeScript", color: "#3178c6", bgColor: "bg-blue-50 dark:bg-blue-950/30", borderColor: "border-blue-200 dark:border-blue-800", icon: "📘" },
    { id: "react", name: "React", color: "#61dafb", bgColor: "bg-cyan-50 dark:bg-cyan-950/30", borderColor: "border-cyan-200 dark:border-cyan-800", icon: "⚛️" },
    { id: "vue", name: "Vue.js", color: "#4fc08d", bgColor: "bg-emerald-50 dark:bg-emerald-950/30", borderColor: "border-emerald-200 dark:border-emerald-800", icon: "💚" },
    { id: "angular", name: "Angular", color: "#dd0031", bgColor: "bg-red-50 dark:bg-red-950/30", borderColor: "border-red-200 dark:border-red-800", icon: "🔺" },
    { id: "testing", name: "Testing", color: "#99425b", bgColor: "bg-pink-50 dark:bg-pink-950/30", borderColor: "border-pink-200 dark:border-pink-800", icon: "🧪" },
    { id: "build-tools", name: "Build Tools", color: "#646cff", bgColor: "bg-violet-50 dark:bg-violet-950/30", borderColor: "border-violet-200 dark:border-violet-800", icon: "🔧" },
    { id: "performance", name: "Performance", color: "#00c853", bgColor: "bg-green-50 dark:bg-green-950/30", borderColor: "border-green-200 dark:border-green-800", icon: "🚀" },
    { id: "accessibility", name: "Accessibility", color: "#0288d1", bgColor: "bg-sky-50 dark:bg-sky-950/30", borderColor: "border-sky-200 dark:border-sky-800", icon: "♿" },
    { id: "design-systems", name: "Design Systems", color: "#ff6f00", bgColor: "bg-amber-50 dark:bg-amber-950/30", borderColor: "border-amber-200 dark:border-amber-800", icon: "🎯" },
    { id: "state-management", name: "State Management", color: "#7c4dff", bgColor: "bg-indigo-50 dark:bg-indigo-950/30", borderColor: "border-indigo-200 dark:border-indigo-800", icon: "📦" },
];

export function getCategoryMeta(category: CurriculumCategory): CategoryMeta {
    return CATEGORY_META.find(c => c.id === category) || CATEGORY_META[0];
}
