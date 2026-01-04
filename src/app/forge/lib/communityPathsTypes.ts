// Types for Community Learning Paths

export type PathDomain =
    | "frontend"
    | "backend"
    | "fullstack"
    | "data"
    | "devops"
    | "mobile"
    | "design"
    | "ai-ml";

export type PathDifficulty = "beginner" | "intermediate" | "advanced" | "mixed";

export type PathType = "career" | "skill" | "custom" | "ai_generated";

export interface CommunityPathChapter {
    id: string;
    title: string;
    description: string | null;
    sortOrder: number;
    estimatedMinutes: number;
    xpReward: number;
}

export interface CommunityPathCourse {
    id: string;
    title: string;
    description: string | null;
    sortOrder: number;
    estimatedHours: number;
    chapterCount: number;
    chapters: CommunityPathChapter[];
}

export interface CommunityPathCreator {
    id: string;
    displayName: string;
    avatarUrl: string | null;
}

export interface CommunityPath {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    domain: PathDomain;
    difficulty: PathDifficulty;
    pathType: PathType;
    estimatedHours: number;
    courseCount: number;
    chapterCount: number;
    enrollmentCount: number;
    creator: CommunityPathCreator | null;
    courses: CommunityPathCourse[];
    createdAt: string;
    isEnrolled?: boolean;
}

export interface CommunityPathsFilters {
    domain?: PathDomain | "all";
    difficulty?: PathDifficulty | "all";
    duration?: "any" | "short" | "medium" | "long" | "extended";
    sort?: "popular" | "recent" | "duration_asc" | "duration_desc";
    search?: string;
}

export interface CommunityPathsPagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface CommunityPathsResponse {
    paths: CommunityPath[];
    pagination: CommunityPathsPagination;
}

// Domain display configuration
export const DOMAIN_CONFIG: Record<PathDomain, { label: string; color: string; bgColor: string }> = {
    frontend: {
        label: "Frontend",
        color: "text-[var(--forge-info)]",
        bgColor: "bg-[var(--forge-info)]/15"
    },
    backend: {
        label: "Backend",
        color: "text-[var(--forge-success)]",
        bgColor: "bg-[var(--forge-success)]/15"
    },
    fullstack: {
        label: "Fullstack",
        color: "text-[var(--ember)]",
        bgColor: "bg-[var(--ember)]/15"
    },
    data: {
        label: "Data",
        color: "text-purple-400",
        bgColor: "bg-purple-500/15"
    },
    devops: {
        label: "DevOps",
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/15"
    },
    mobile: {
        label: "Mobile",
        color: "text-pink-400",
        bgColor: "bg-pink-500/15"
    },
    design: {
        label: "Design",
        color: "text-rose-400",
        bgColor: "bg-rose-500/15"
    },
    "ai-ml": {
        label: "AI/ML",
        color: "text-[var(--gold)]",
        bgColor: "bg-[var(--gold)]/15"
    },
};

// Difficulty display configuration
export const DIFFICULTY_CONFIG: Record<PathDifficulty, { label: string; color: string }> = {
    beginner: { label: "Beginner", color: "text-[var(--forge-success)]" },
    intermediate: { label: "Intermediate", color: "text-[var(--gold)]" },
    advanced: { label: "Advanced", color: "text-[var(--ember)]" },
    mixed: { label: "Mixed", color: "text-[var(--forge-text-secondary)]" },
};
