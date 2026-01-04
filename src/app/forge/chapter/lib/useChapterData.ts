"use client";

import { useState, useEffect } from "react";
import type { CourseInfo, ChapterSection, SectionContent } from "@/app/features/chapter/lib/chapterData";
import type { Section, ContentType, Json } from "@/lib/supabase/types";
import type { ChapterWithDetails, SectionContentData } from "@/app/api/chapters/[id]/route";

export interface ChapterContentMetadata {
    key_takeaways?: string[];
    video_variants?: Array<{
        id: string;
        title: string;
        youtubeId?: string;
        searchQuery: string;
        instructorName?: string;
        style?: 'lecture' | 'tutorial' | 'walkthrough' | 'animated';
        duration?: string;
    }>;
    estimated_time_minutes?: number;
    difficulty?: string;
    introduction?: string;
}

export interface ChapterData {
    courseInfo: CourseInfo;
    sections: ChapterSection[];
    contentMetadata: ChapterContentMetadata | null;
}

export interface UseChapterDataResult {
    data: ChapterData | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * Transform database section data to SectionContent format
 * Note: Full markdown content is stored in content_markdown (renamed from description)
 */
function parseSectionContent(
    contentMarkdown: string | null,
    contentJson: Json | null
): SectionContent {
    // Parse content_json if it exists (legacy format)
    const legacyData = contentJson as SectionContentData | null;

    // content_markdown field contains the full markdown content (authoritative source)
    const fullContent = contentMarkdown || legacyData?.description || "";

    return {
        description: fullContent,
        code: legacyData?.code,
        keyPoints: legacyData?.keyPoints,
        screenshot: legacyData?.hasVisuals,
    };
}

/**
 * Map database ContentType to ChapterSection type
 */
function mapContentType(dbType: ContentType): "video" | "lesson" | "interactive" | "exercise" {
    switch (dbType) {
        case "video":
            return "video";
        case "lesson":
            return "lesson";
        case "interactive":
            return "interactive";
        case "exercise":
        case "quiz":
            return "exercise";
        default:
            return "lesson";
    }
}

/**
 * Calculate cumulative timestamp for sections
 */
function calculateTimestamp(sortOrder: number, sections: Section[]): string {
    let totalMinutes = 0;

    for (let i = 0; i < sortOrder - 1 && i < sections.length; i++) {
        totalMinutes += sections[i].estimated_minutes || 0;
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours > 0) {
        return `${hours}:${mins.toString().padStart(2, "0")}:00`;
    }
    return `${mins}:00`;
}

/**
 * Transform database section to ChapterSection format
 */
function transformSection(
    section: Section,
    index: number,
    allSections: Section[]
): ChapterSection {
    // Support both old (description) and new (content_markdown) column names during transition
    const sectionAny = section as any;
    const contentMarkdown = sectionAny.content_markdown || section.description || null;
    const contentJson = sectionAny.content_json || null;

    return {
        id: index + 1,
        sectionId: section.id,
        title: section.title,
        duration: `${section.estimated_minutes || 5} min`,
        time: calculateTimestamp(section.sort_order, allSections),
        type: mapContentType(section.content_type),
        completed: false, // TODO: Load from user_progress
        content: parseSectionContent(contentMarkdown, contentJson),
    };
}

/**
 * Hook to fetch and transform chapter data for ChapterView
 */
export function useChapterData(chapterId: string): UseChapterDataResult {
    const [data, setData] = useState<ChapterData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        async function fetchChapter() {
            if (!chapterId) {
                setError("No chapter ID provided");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/chapters/${chapterId}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to fetch chapter");
                }

                const { chapter } = await response.json() as { chapter: ChapterWithDetails };

                // Transform to CourseInfo
                const courseInfo: CourseInfo = {
                    courseId: chapter.course.id,
                    courseName: chapter.course.title,
                    chapterId: chapter.id,
                    chapterTitle: chapter.title,
                };

                // Transform sections
                const sortedSections = [...chapter.sections].sort(
                    (a, b) => a.sort_order - b.sort_order
                );

                const sections: ChapterSection[] = sortedSections.map((section, idx) =>
                    transformSection(section, idx, sortedSections)
                );

                // Extract content metadata from chapter
                const chapterAny = chapter as any;
                const contentMetadata: ChapterContentMetadata | null = chapterAny.content_metadata
                    ? {
                        key_takeaways: chapterAny.content_metadata.key_takeaways || [],
                        video_variants: chapterAny.content_metadata.video_variants || [],
                        estimated_time_minutes: chapterAny.content_metadata.estimated_time_minutes,
                        difficulty: chapterAny.content_metadata.difficulty,
                        introduction: chapterAny.content_metadata.introduction,
                    }
                    : null;

                setData({ courseInfo, sections, contentMetadata });
            } catch (err) {
                console.error("Error fetching chapter:", err);
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setIsLoading(false);
            }
        }

        fetchChapter();
    }, [chapterId, refreshKey]);

    const refetch = () => setRefreshKey((k) => k + 1);

    return { data, isLoading, error, refetch };
}
