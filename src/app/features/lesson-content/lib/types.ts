/**
 * Lesson Content Types
 *
 * Defines the structure for lesson content stored in the database.
 * Uses markdown with custom parsing rules for flexible UI generation.
 */

// ============================================================================
// Video Variant - Multiple video sources for a lesson
// ============================================================================

export interface VideoVariant {
    id: string;
    title: string;
    youtube_id?: string;
    search_query: string;
    instructor?: string;
    style?: "animated" | "lecture" | "tutorial" | "walkthrough";
    duration?: string;
}

// ============================================================================
// Lesson Metadata - Structured data stored as JSONB
// ============================================================================

export interface KeyReference {
    title: string;
    url: string;
    type: "docs" | "repo" | "tool" | "article" | "video" | "course";
}

export interface LessonMetadata {
    estimated_minutes?: number;
    difficulty?: "beginner" | "intermediate" | "advanced";
    key_takeaways?: string[];
    key_references?: KeyReference[];
    video_variants?: VideoVariant[];
    prerequisites?: string[]; // node IDs
    related_lessons?: string[]; // node IDs
    tags?: string[];
}

// ============================================================================
// Lesson Section - Structured sections within a lesson
// ============================================================================

export interface LessonSection {
    id: string;
    sort_order: number;
    title: string;
    section_type: "video" | "lesson" | "interactive" | "exercise" | "quiz";
    duration_minutes?: number;
    content_markdown: string;
    code_snippet?: string;
    code_language?: string;
    key_points?: string[];
}

// ============================================================================
// Lesson Content - Main content entity
// ============================================================================

export interface LessonContent {
    id: string;
    node_id: string;
    version: number;
    status: "draft" | "review" | "published" | "archived";
    introduction?: string;
    content_markdown: string;
    metadata: LessonMetadata;
    is_ai_generated: boolean;
    published_at?: string;
    created_at: string;
    updated_at: string;
}

// ============================================================================
// Full Lesson - Content with sections and node info
// ============================================================================

export interface FullLesson {
    content: LessonContent;
    sections: LessonSection[];
    node: {
        id: string;
        slug: string;
        name: string;
        description?: string;
        depth: number;
        parent_id?: string;
        domain_id: string;
    };
    breadcrumbs: {
        domain: string;
        topic: string;
        skill: string;
        area: string;
    };
}

// ============================================================================
// Custom Markdown Rules
// ============================================================================

/**
 * Custom markdown syntax for lesson content:
 *
 * :::video[youtube_id="xxx" title="Video Title"]
 * Optional description
 * :::
 *
 * :::code[language="typescript" title="Example"]
 * // code here
 * :::
 *
 * :::callout[type="info|warning|tip|definition"]
 * Content here
 * :::
 *
 * :::keypoints
 * - Point 1
 * - Point 2
 * :::
 *
 * :::exercise[title="Practice"]
 * Exercise description
 * :::
 *
 * :::quiz[question="What is X?"]
 * - [ ] Wrong answer
 * - [x] Correct answer
 * - [ ] Wrong answer
 * :::
 */

export type CustomBlockType =
    | "video"
    | "code"
    | "callout"
    | "keypoints"
    | "exercise"
    | "quiz";

export interface ParsedCustomBlock {
    type: CustomBlockType;
    attributes: Record<string, string>;
    content: string;
}

// ============================================================================
// Conversion helpers for ElegantVariant compatibility
// ============================================================================

import type { ChapterSection, CourseInfo, ContentMetadata } from "@/app/features/chapter";

/**
 * Convert LessonContent to ElegantVariant's CourseInfo
 */
export function lessonToCourseInfo(lesson: FullLesson): CourseInfo {
    return {
        courseId: lesson.node.parent_id || lesson.node.id,
        courseName: lesson.breadcrumbs.area,
        chapterId: lesson.node.id,
        chapterTitle: lesson.node.name,
    };
}

/**
 * Convert LessonContent metadata to ElegantVariant's ContentMetadata
 */
export function lessonToContentMetadata(lesson: FullLesson): ContentMetadata {
    return {
        difficulty: lesson.content.metadata.difficulty,
        estimated_time_minutes: lesson.content.metadata.estimated_minutes,
        introduction: lesson.content.introduction,
        key_takeaways: lesson.content.metadata.key_takeaways,
        video_variants: lesson.content.metadata.video_variants?.map((v) => ({
            id: v.id,
            title: v.title,
            youtubeId: v.youtube_id,
            searchQuery: v.search_query,
            instructorName: v.instructor,
            style: v.style,
            duration: v.duration,
        })),
    };
}

/**
 * Convert LessonSection to ElegantVariant's ChapterSection
 */
export function lessonSectionToChapterSection(
    section: LessonSection,
    index: number
): ChapterSection {
    return {
        id: index + 1,
        sectionId: section.id,
        title: section.title,
        duration: section.duration_minutes ? `${section.duration_minutes} min` : "5 min",
        time: formatTimeOffset(index),
        type: section.section_type as "video" | "lesson" | "interactive" | "exercise",
        completed: false,
        content: {
            description: section.content_markdown,
            code: section.code_snippet,
            keyPoints: section.key_points,
        },
    };
}

/**
 * Convert full lesson to ElegantVariant props
 */
export function lessonToElegantVariantProps(lesson: FullLesson) {
    return {
        courseInfo: lessonToCourseInfo(lesson),
        sections: lesson.sections.map((s, i) => lessonSectionToChapterSection(s, i)),
        contentMetadata: lessonToContentMetadata(lesson),
    };
}

// Helper to generate time offsets
function formatTimeOffset(index: number): string {
    const minutes = index * 5;
    return `${minutes}:00`;
}
