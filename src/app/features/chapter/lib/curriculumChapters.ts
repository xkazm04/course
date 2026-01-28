/**
 * Curriculum Chapter Nodes
 *
 * This module defines chapter-level nodes in the curriculum DAG.
 * It connects the existing chapter data to the unified learning path graph,
 * enabling cross-chapter prerequisites and suggested learning paths.
 *
 * NOTE: Graph operation logic (prerequisites, suggested chapters, topological sort)
 * is delegated to chapterGraph.ts. This module provides:
 * - Data: CURRICULUM_CHAPTERS, CHAPTER_CURRICULUM_EDGES
 * - Convenience functions that operate on that data
 */

import type { ChapterCurriculumNode, CurriculumEdge } from "@/app/shared/lib/learningPathGraph";
import {
    getChapterPrerequisites as getGraphPrerequisites,
    getSuggestedNextChapters as getGraphSuggestedNext,
    getOptimalLearningPath,
    type ChapterEdge,
    type ChapterNode,
} from "./chapterGraph";
import { CHAPTER_SECTIONS, COURSE_INFO, HOOKS_FUNDAMENTALS_COURSE_INFO } from "./chapterData";
import type { CourseInfo, ChapterSection } from "./chapterData";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a chapter curriculum node from course info and sections
 */
function createChapterCurriculumNode(
    courseInfo: CourseInfo,
    sections: ChapterSection[],
    config: {
        position: { x: number; y: number };
        hierarchyLevel: 0 | 1 | 2 | 3;
        timelinePhase: "foundation" | "intermediate" | "advanced" | "specialization";
        sortOrder: number;
        isEntryPoint?: boolean;
        xpReward?: number;
        domainId: "frontend" | "fullstack" | "backend" | "databases" | "games" | "mobile";
    }
): ChapterCurriculumNode {
    const totalMinutes = sections.reduce((sum, s) => {
        const mins = parseInt(s.duration, 10);
        return sum + (isNaN(mins) ? 0 : mins);
    }, 0);

    return {
        nodeType: "chapter",
        id: `${courseInfo.courseId}:${courseInfo.chapterId}`,
        name: courseInfo.chapterTitle,
        position: config.position,
        hierarchyLevel: config.hierarchyLevel,
        timelinePhase: config.timelinePhase,
        isEntryPoint: config.isEntryPoint ?? false,
        sortOrder: config.sortOrder,
        domainId: config.domainId,
        courseId: courseInfo.courseId,
        chapterId: courseInfo.chapterId,
        durationMinutes: totalMinutes,
        sectionCount: sections.length,
        xpReward: config.xpReward ?? 100,
    };
}

// ============================================================================
// CURRICULUM CHAPTER DATA
// ============================================================================

/**
 * React Hooks course chapter nodes
 */
export const REACT_HOOKS_CHAPTERS: ChapterCurriculumNode[] = [
    // Chapter 1: Hooks Fundamentals (entry point)
    createChapterCurriculumNode(
        HOOKS_FUNDAMENTALS_COURSE_INFO,
        CHAPTER_SECTIONS,
        {
            position: { x: 30, y: 20 },
            hierarchyLevel: 0,
            timelinePhase: "foundation",
            sortOrder: 1,
            isEntryPoint: true,
            xpReward: 150,
            domainId: "frontend",
        }
    ),
    // Chapter 2: Custom Hooks (builds on fundamentals)
    createChapterCurriculumNode(
        COURSE_INFO,
        CHAPTER_SECTIONS,
        {
            position: { x: 50, y: 35 },
            hierarchyLevel: 1,
            timelinePhase: "intermediate",
            sortOrder: 2,
            xpReward: 200,
            domainId: "frontend",
        }
    ),
    // Chapter 3: Advanced Patterns
    createChapterCurriculumNode(
        {
            courseId: "react-hooks",
            courseName: "React Hooks Mastery",
            chapterId: "advanced-patterns",
            chapterTitle: "Advanced Hook Patterns",
        },
        CHAPTER_SECTIONS,
        {
            position: { x: 70, y: 50 },
            hierarchyLevel: 2,
            timelinePhase: "advanced",
            sortOrder: 3,
            xpReward: 250,
            domainId: "frontend",
        }
    ),
    // Chapter 4: Performance Optimization
    createChapterCurriculumNode(
        {
            courseId: "react-hooks",
            courseName: "React Hooks Mastery",
            chapterId: "performance",
            chapterTitle: "Performance Optimization with Hooks",
        },
        CHAPTER_SECTIONS,
        {
            position: { x: 80, y: 65 },
            hierarchyLevel: 2,
            timelinePhase: "advanced",
            sortOrder: 4,
            xpReward: 250,
            domainId: "frontend",
        }
    ),
];

/**
 * Fullstack course chapter nodes (example cross-domain chapters)
 */
export const FULLSTACK_CHAPTERS: ChapterCurriculumNode[] = [
    createChapterCurriculumNode(
        {
            courseId: "fullstack-fundamentals",
            courseName: "Full Stack Fundamentals",
            chapterId: "api-design",
            chapterTitle: "RESTful API Design",
        },
        CHAPTER_SECTIONS,
        {
            position: { x: 50, y: 70 },
            hierarchyLevel: 1,
            timelinePhase: "intermediate",
            sortOrder: 1,
            xpReward: 200,
            domainId: "fullstack",
        }
    ),
    createChapterCurriculumNode(
        {
            courseId: "fullstack-fundamentals",
            courseName: "Full Stack Fundamentals",
            chapterId: "data-fetching",
            chapterTitle: "Data Fetching Strategies",
        },
        CHAPTER_SECTIONS,
        {
            position: { x: 55, y: 85 },
            hierarchyLevel: 2,
            timelinePhase: "advanced",
            sortOrder: 2,
            xpReward: 250,
            domainId: "fullstack",
        }
    ),
];

/**
 * Backend course chapter nodes
 */
export const BACKEND_CHAPTERS: ChapterCurriculumNode[] = [
    createChapterCurriculumNode(
        {
            courseId: "nodejs-backend",
            courseName: "Node.js Backend Development",
            chapterId: "express-basics",
            chapterTitle: "Express.js Fundamentals",
        },
        CHAPTER_SECTIONS,
        {
            position: { x: 40, y: 80 },
            hierarchyLevel: 0,
            timelinePhase: "foundation",
            sortOrder: 1,
            isEntryPoint: true,
            xpReward: 150,
            domainId: "backend",
        }
    ),
    createChapterCurriculumNode(
        {
            courseId: "nodejs-backend",
            courseName: "Node.js Backend Development",
            chapterId: "middleware",
            chapterTitle: "Middleware & Authentication",
        },
        CHAPTER_SECTIONS,
        {
            position: { x: 35, y: 90 },
            hierarchyLevel: 1,
            timelinePhase: "intermediate",
            sortOrder: 2,
            xpReward: 200,
            domainId: "backend",
        }
    ),
];

// ============================================================================
// ALL CURRICULUM CHAPTERS
// ============================================================================

/**
 * Combined list of all curriculum chapters
 */
export const CURRICULUM_CHAPTERS: ChapterCurriculumNode[] = [
    ...REACT_HOOKS_CHAPTERS,
    ...FULLSTACK_CHAPTERS,
    ...BACKEND_CHAPTERS,
];

// ============================================================================
// CHAPTER PREREQUISITE EDGES
// ============================================================================

/**
 * Edges defining cross-chapter prerequisites and relationships
 */
export const CHAPTER_CURRICULUM_EDGES: CurriculumEdge[] = [
    // React Hooks Course internal prerequisites
    {
        from: "react-hooks:hooks-fundamentals",
        to: "react-hooks:custom-hooks",
        type: "prerequisite",
        weight: 3,
        label: "Must complete fundamentals first",
        fromType: "chapter",
        toType: "chapter",
    },
    {
        from: "react-hooks:custom-hooks",
        to: "react-hooks:advanced-patterns",
        type: "prerequisite",
        weight: 3,
        label: "Requires custom hooks knowledge",
        fromType: "chapter",
        toType: "chapter",
    },
    {
        from: "react-hooks:custom-hooks",
        to: "react-hooks:performance",
        type: "builds-upon",
        weight: 2,
        label: "Performance patterns use custom hooks",
        fromType: "chapter",
        toType: "chapter",
    },
    {
        from: "react-hooks:advanced-patterns",
        to: "react-hooks:performance",
        type: "complements",
        weight: 1,
        label: "Related advanced topics",
        fromType: "chapter",
        toType: "chapter",
    },

    // Cross-course prerequisites
    {
        from: "react-hooks:custom-hooks",
        to: "fullstack-fundamentals:data-fetching",
        type: "prerequisite",
        weight: 2,
        label: "Need hooks for React data fetching",
        fromType: "chapter",
        toType: "chapter",
    },
    {
        from: "nodejs-backend:express-basics",
        to: "fullstack-fundamentals:api-design",
        type: "prerequisite",
        weight: 3,
        label: "Understand backend before API design",
        fromType: "chapter",
        toType: "chapter",
    },
    {
        from: "nodejs-backend:express-basics",
        to: "nodejs-backend:middleware",
        type: "prerequisite",
        weight: 3,
        label: "Express basics required",
        fromType: "chapter",
        toType: "chapter",
    },
    {
        from: "fullstack-fundamentals:api-design",
        to: "fullstack-fundamentals:data-fetching",
        type: "builds-upon",
        weight: 2,
        label: "Design APIs before fetching from them",
        fromType: "chapter",
        toType: "chapter",
    },

    // Domain to chapter relationships (entry points)
    {
        from: "frontend",
        to: "react-hooks:hooks-fundamentals",
        type: "enables",
        weight: 2,
        label: "Start with React Hooks",
        fromType: "domain",
        toType: "chapter",
    },
    {
        from: "backend",
        to: "nodejs-backend:express-basics",
        type: "enables",
        weight: 2,
        label: "Start with Express",
        fromType: "domain",
        toType: "chapter",
    },
    {
        from: "fullstack",
        to: "fullstack-fundamentals:api-design",
        type: "enables",
        weight: 2,
        label: "Start with API Design",
        fromType: "domain",
        toType: "chapter",
    },
];

// ============================================================================
// CHAPTER GRAPH ACCESSORS
// ============================================================================

/**
 * Get a chapter node by its ID
 */
export function getChapterNode(chapterId: string): ChapterCurriculumNode | undefined {
    return CURRICULUM_CHAPTERS.find((ch) => ch.id === chapterId);
}

/**
 * Get chapters by course ID
 */
export function getChaptersByCourse(courseId: string): ChapterCurriculumNode[] {
    return CURRICULUM_CHAPTERS.filter((ch) => ch.courseId === courseId);
}

/**
 * Get chapters by domain
 */
export function getChaptersByDomain(
    domainId: "frontend" | "fullstack" | "backend" | "databases" | "games" | "mobile"
): ChapterCurriculumNode[] {
    return CURRICULUM_CHAPTERS.filter((ch) => ch.domainId === domainId);
}

/**
 * Get chapter prerequisites.
 * Delegates to chapterGraph.getChapterPrerequisites for the actual logic,
 * using CHAPTER_CURRICULUM_EDGES as the edge data.
 */
export function getChapterPrerequisites(chapterNodeId: string): ChapterCurriculumNode[] {
    // Convert CurriculumEdge[] to ChapterEdge[] format for chapterGraph
    const chapterEdges: ChapterEdge[] = CHAPTER_CURRICULUM_EDGES
        .filter((edge) => edge.fromType === "chapter" && edge.toType === "chapter")
        .map((edge) => ({
            from: edge.from,
            to: edge.to,
            type: edge.type,
            weight: edge.weight,
            label: edge.label,
            isIntraChapter: false,
        }));

    const prereqIds = getGraphPrerequisites(chapterNodeId, chapterEdges);

    return prereqIds
        .map((id) => getChapterNode(id))
        .filter((node): node is ChapterCurriculumNode => node !== undefined);
}

/**
 * Get suggested next chapters after completing a chapter.
 * Delegates to chapterGraph.getSuggestedNextChapters for the actual logic,
 * using CHAPTER_CURRICULUM_EDGES as the edge data.
 */
export function getSuggestedNextChapters(chapterNodeId: string): ChapterCurriculumNode[] {
    // Convert CurriculumEdge[] to ChapterEdge[] format for chapterGraph
    const chapterEdges: ChapterEdge[] = CHAPTER_CURRICULUM_EDGES
        .filter((edge) => edge.fromType === "chapter" && edge.toType === "chapter")
        .map((edge) => ({
            from: edge.from,
            to: edge.to,
            type: edge.type,
            weight: edge.weight,
            label: edge.label,
            isIntraChapter: false,
        }));

    const nextIds = getGraphSuggestedNext(chapterNodeId, chapterEdges);

    return nextIds
        .map((id) => getChapterNode(id))
        .filter((node): node is ChapterCurriculumNode => node !== undefined);
}

/**
 * Check if all prerequisites for a chapter are met
 */
export function areChapterPrerequisitesMet(
    chapterNodeId: string,
    completedChapterIds: Set<string>
): boolean {
    const prerequisites = getChapterPrerequisites(chapterNodeId);
    return prerequisites.every((prereq) => completedChapterIds.has(prereq.id));
}

/**
 * Get unmet prerequisite warnings for a chapter
 */
export function getChapterPrerequisiteWarnings(
    chapterNodeId: string,
    completedChapterIds: Set<string>
): Array<{ id: string; title: string }> {
    const prerequisites = getChapterPrerequisites(chapterNodeId);
    const unmet = prerequisites.filter((prereq) => !completedChapterIds.has(prereq.id));

    return unmet.map((prereq) => ({
        id: prereq.id,
        title: prereq.name,
    }));
}

/**
 * Get optimal chapter order for a course (topological sort).
 * Delegates to chapterGraph.getOptimalLearningPath for the actual logic.
 *
 * Detects cycles in the prerequisite graph and throws CircularPrerequisiteError
 * if circular dependencies are found.
 *
 * @throws CircularPrerequisiteError if the prerequisite graph contains cycles
 */
export function getOptimalChapterOrder(courseId: string): ChapterCurriculumNode[] {
    const courseChapters = getChaptersByCourse(courseId);
    const courseChapterIds = new Set(courseChapters.map((ch) => ch.id));

    // Filter edges to only those within this course
    const courseEdges: ChapterEdge[] = CHAPTER_CURRICULUM_EDGES
        .filter(
            (edge) =>
                courseChapterIds.has(edge.from) &&
                courseChapterIds.has(edge.to) &&
                edge.type === "prerequisite"
        )
        .map((edge) => ({
            from: edge.from,
            to: edge.to,
            type: edge.type,
            weight: edge.weight,
            label: edge.label,
            isIntraChapter: false,
        }));

    // Convert ChapterCurriculumNode[] to ChapterNode[] for chapterGraph
    const chapterNodes: ChapterNode[] = courseChapters.map((ch) => ({
        id: ch.id,
        courseId: ch.courseId,
        chapterId: ch.chapterId,
        title: ch.name,
        domainId: ch.domainId,
        position: ch.position,
        hierarchyLevel: ch.hierarchyLevel,
        timelinePhase: ch.timelinePhase,
        difficulty: ch.hierarchyLevel === 0 ? "beginner" :
                    ch.hierarchyLevel === 1 ? "intermediate" :
                    ch.hierarchyLevel === 2 ? "advanced" : "expert",
        durationMinutes: ch.durationMinutes,
        sortOrder: ch.sortOrder,
        isEntryPoint: ch.isEntryPoint,
        xpReward: ch.xpReward,
        sectionCount: ch.sectionCount,
    }));

    // Delegate to chapterGraph for the topological sort
    const sortedNodes = getOptimalLearningPath(chapterNodes, courseEdges);

    // Map back to ChapterCurriculumNode[]
    return sortedNodes
        .map((node) => courseChapters.find((ch) => ch.id === node.id))
        .filter((ch): ch is ChapterCurriculumNode => ch !== undefined);
}

/**
 * Calculate total XP for a course
 */
export function calculateCourseXP(courseId: string): number {
    return getChaptersByCourse(courseId).reduce((sum, ch) => sum + ch.xpReward, 0);
}

/**
 * Calculate total duration for a course in minutes
 */
export function calculateCourseDuration(courseId: string): number {
    return getChaptersByCourse(courseId).reduce((sum, ch) => sum + ch.durationMinutes, 0);
}
