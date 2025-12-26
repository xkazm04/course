/**
 * Shared chapter section data types and mock data
 * Consolidates duplicate section patterns from VariantA and VariantC
 *
 * ChapterSection is a LearningNode in the curriculum graph:
 * - It has an id, sectionId, content with code/keyPoints, and completed status
 * - This structure matches exactly what a LearningNode represents
 * - By using the unified LearningNode base type, chapter progress integrates
 *   naturally with the learning graph for cross-chapter prerequisites and
 *   smarter path recommendations.
 */

import type {
    LearningNodeBase,
    LearningContentType,
} from "@/app/features/knowledge-map/lib/learningNode";

// Section type for content categorization
// Maps directly to LearningContentType for unified typing
export type SectionType = "video" | "lesson" | "interactive" | "exercise";

/**
 * Section content with optional fields based on type
 *
 * Aligns with LearningNodeContent from the knowledge-map domain:
 * - description: matches LearningNodeContent.description
 * - code: matches LearningNodeContent.code
 * - keyPoints: matches LearningNodeContent.keyPoints
 * - screenshot: section-specific field (maps to LearningNodeContent.hasVisuals)
 *
 * @see LearningNodeContent for the canonical content type
 */
export interface SectionContent {
    description: string;
    code?: string;
    keyPoints?: string[];
    screenshot?: boolean;
}

/**
 * ChapterSection - A learning node specialized for chapter content
 *
 * This interface implements the LearningNode pattern from the curriculum DAG
 * while maintaining backward compatibility with existing chapter components.
 *
 * Mapping to LearningNodeBase:
 * - sectionId -> LearningNodeBase.id (unique identifier)
 * - title -> LearningNodeBase.title
 * - type -> LearningNodeBase.contentType
 * - duration -> LearningNodeBase.duration
 * - completed -> derived from LearningNodeBase.status
 *
 * Additional section-specific fields:
 * - id: numeric order within chapter
 * - time: video timestamp
 * - content: rich content descriptor
 */
export interface ChapterSection {
    /**
     * Numeric order within the chapter (1-based)
     * Used for sequential navigation and implicit dependencies
     */
    id: number;

    /**
     * Unique string identifier for this section
     * This is the canonical LearningNode id
     */
    sectionId: string;

    /**
     * Human-readable title
     */
    title: string;

    /**
     * Estimated duration as string (e.g., "5 min")
     */
    duration: string;

    /**
     * Video timestamp for this section (e.g., "0:00", "2:15")
     */
    time: string;

    /**
     * Content type classification
     * Maps to LearningContentType for unified handling
     */
    type: SectionType;

    /**
     * Whether this section has been completed
     * Maps to LearningNodeBase.status === "completed"
     */
    completed: boolean;

    /**
     * Rich content descriptor with code, key points, etc.
     */
    content: SectionContent;
}

/**
 * Convert a ChapterSection to a LearningNodeBase for graph operations
 */
export function chapterSectionToLearningNode(section: ChapterSection): LearningNodeBase {
    return {
        id: section.sectionId,
        title: section.title,
        status: section.completed ? "completed" : "available",
        contentType: section.type as LearningContentType,
        duration: section.duration,
        progress: section.completed ? 100 : 0,
    };
}

/**
 * Convert a LearningNodeBase back to ChapterSection fields
 * (partial, for updates)
 */
export function learningNodeToChapterSectionUpdate(
    node: LearningNodeBase
): Partial<ChapterSection> {
    return {
        sectionId: node.id,
        title: node.title,
        completed: node.status === "completed",
        type: node.contentType as SectionType,
        duration: typeof node.duration === "string" ? node.duration : `${node.duration} min`,
    };
}

// Simplified section for sidebar display (VariantA)
export interface SimplifiedSection {
    id: string;
    title: string;
    time: string;
    completed: boolean;
}

// Course/Chapter metadata
export interface CourseInfo {
    courseId: string;
    courseName: string;
    chapterId: string;
    chapterTitle: string;
}

// Shared course metadata
export const COURSE_INFO: CourseInfo = {
    courseId: "react-hooks",
    courseName: "React Hooks Mastery",
    chapterId: "custom-hooks",
    chapterTitle: "Building Your First Custom Hook",
};

// Alternative course info for VariantC (hooks fundamentals focus)
export const HOOKS_FUNDAMENTALS_COURSE_INFO: CourseInfo = {
    courseId: "react-hooks",
    courseName: "React Hooks Mastery",
    chapterId: "hooks-fundamentals",
    chapterTitle: "React Hooks Fundamentals",
};

// Main chapter sections data - single source of truth
export const CHAPTER_SECTIONS: ChapterSection[] = [
    {
        id: 1,
        sectionId: "intro",
        title: "Introduction to Hooks",
        duration: "5 min",
        time: "0:00",
        type: "video",
        completed: true,
        content: {
            description: "Understand why Hooks were introduced and how they simplify React development.",
            keyPoints: ["Why Hooks exist", "Rules of Hooks", "Benefits over class components"],
        },
    },
    {
        id: 2,
        sectionId: "understanding",
        title: "Understanding Hooks",
        duration: "12 min",
        time: "2:15",
        type: "lesson",
        completed: true,
        content: {
            description: "Learn how to add state to functional components using the useState hook.",
            code: `const [state, setState] = useState(initialValue);`,
            keyPoints: ["Declaring state", "Updating state", "State with objects/arrays"],
        },
    },
    {
        id: 3,
        sectionId: "building",
        title: "Building Custom Hooks",
        duration: "8 min",
        time: "8:30",
        type: "interactive",
        completed: false,
        content: {
            description: "Build a counter application step by step using useState.",
            screenshot: true,
        },
    },
    {
        id: 4,
        sectionId: "best-practices",
        title: "Best Practices",
        duration: "15 min",
        time: "15:45",
        type: "lesson",
        completed: false,
        content: {
            description: "Master side effects in React with the useEffect hook.",
            code: `useEffect(() => {
  // Side effect code
  return () => {
    // Cleanup
  };
}, [dependencies]);`,
            keyPoints: ["Effect timing", "Dependencies array", "Cleanup functions"],
        },
    },
    {
        id: 5,
        sectionId: "quiz",
        title: "Quiz & Summary",
        duration: "20 min",
        time: "22:00",
        type: "exercise",
        completed: false,
        content: {
            description: "Apply what you've learned by building a data fetching component.",
        },
    },
];

// Helper to get simplified sections for VariantA sidebar
export function getSimplifiedSections(): SimplifiedSection[] {
    return CHAPTER_SECTIONS.map((section) => ({
        id: section.sectionId,
        title: section.title,
        time: section.time,
        completed: section.completed,
    }));
}

// Helper to get section by sectionId
export function getSectionById(sectionId: string): ChapterSection | undefined {
    return CHAPTER_SECTIONS.find((s) => s.sectionId === sectionId);
}

// Helper to get section by numeric id
export function getSectionByNumericId(id: number): ChapterSection | undefined {
    return CHAPTER_SECTIONS.find((s) => s.id === id);
}

// Helper to calculate progress
export function calculateProgress(sections: ChapterSection[]): number {
    const completedCount = sections.filter((s) => s.completed).length;
    return (completedCount / sections.length) * 100;
}

// Helper to get total duration as a string
export function getTotalDuration(sections: ChapterSection[]): string {
    const totalMinutes = sections.reduce((sum, section) => {
        const minutes = parseInt(section.duration, 10);
        return sum + (isNaN(minutes) ? 0 : minutes);
    }, 0);
    return `~${totalMinutes} min`;
}
