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
    { id: "html-css", name: "HTML & CSS", color: "#e34c26", bgColor: "bg-[var(--ember)]/10", borderColor: "border-[var(--ember)]/30", icon: "🎨" },
    { id: "javascript", name: "JavaScript", color: "#f7df1e", bgColor: "bg-[var(--gold)]/10", borderColor: "border-[var(--gold)]/30", icon: "⚡" },
    { id: "typescript", name: "TypeScript", color: "#3178c6", bgColor: "bg-[var(--forge-info)]/10", borderColor: "border-[var(--forge-info)]/30", icon: "📘" },
    { id: "react", name: "React", color: "#61dafb", bgColor: "bg-[var(--forge-info)]/10", borderColor: "border-[var(--forge-info)]/30", icon: "⚛️" },
    { id: "vue", name: "Vue.js", color: "#4fc08d", bgColor: "bg-[var(--forge-success)]/10", borderColor: "border-[var(--forge-success)]/30", icon: "💚" },
    { id: "angular", name: "Angular", color: "#dd0031", bgColor: "bg-[var(--forge-error)]/10", borderColor: "border-[var(--forge-error)]/30", icon: "🔺" },
    { id: "testing", name: "Testing", color: "#99425b", bgColor: "bg-[var(--ember-glow)]/10", borderColor: "border-[var(--ember-glow)]/30", icon: "🧪" },
    { id: "build-tools", name: "Build Tools", color: "#646cff", bgColor: "bg-[var(--ember-glow)]/10", borderColor: "border-[var(--ember-glow)]/30", icon: "🔧" },
    { id: "performance", name: "Performance", color: "#00c853", bgColor: "bg-[var(--forge-success)]/10", borderColor: "border-[var(--forge-success)]/30", icon: "🚀" },
    { id: "accessibility", name: "Accessibility", color: "#0288d1", bgColor: "bg-[var(--forge-info)]/10", borderColor: "border-[var(--forge-info)]/30", icon: "♿" },
    { id: "design-systems", name: "Design Systems", color: "#ff6f00", bgColor: "bg-[var(--forge-warning)]/10", borderColor: "border-[var(--forge-warning)]/30", icon: "🎯" },
    { id: "state-management", name: "State Management", color: "#7c4dff", bgColor: "bg-[var(--ember-glow)]/10", borderColor: "border-[var(--ember-glow)]/30", icon: "📦" },
];

export function getCategoryMeta(category: CurriculumCategory): CategoryMeta {
    return CATEGORY_META.find(c => c.id === category) || CATEGORY_META[0];
}
