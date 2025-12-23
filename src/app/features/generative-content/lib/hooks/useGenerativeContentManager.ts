/**
 * Generative Content Manager Hook
 *
 * Combined hook for full content management.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { GeneratedChapter, ContentGenerationParams } from "../types";
import type { LearningDomainId } from "@/app/shared/lib/learningDomains";
import { useLearningPaths } from "./useLearningPaths";
import { useContentGeneration } from "./useContentGeneration";
import { useGeneratedChapters } from "./useGeneratedChapters";
import { useContentRating } from "./useContentRating";
import { useContentAnnotations } from "./useContentAnnotations";
import { useContentVersions } from "./useContentVersions";
import { useContentForking } from "./useContentForking";

/**
 * Combined hook for full content management
 */
export function useGenerativeContentManager(chapterId?: string) {
    const paths = useLearningPaths();
    const generation = useContentGeneration();
    const chapters = useGeneratedChapters();

    const [selectedChapter, setSelectedChapter] = useState<GeneratedChapter | null>(null);

    // Load selected chapter
    useEffect(() => {
        if (chapterId) {
            const chapter = chapters.getChapter(chapterId);
            setSelectedChapter(chapter || null);
        }
    }, [chapterId, chapters]);

    // Rating, annotation, versioning, and forking for selected chapter
    const rating = useContentRating(chapterId || "");
    const annotations = useContentAnnotations(chapterId || "");
    const versions = useContentVersions(chapterId || "");
    const forking = useContentForking(chapterId || "");

    /**
     * Generate and select a new chapter
     */
    const generateAndSelect = useCallback(
        async (
            topics: string[],
            domainId: LearningDomainId,
            options?: Partial<ContentGenerationParams>
        ) => {
            // Create or get existing path
            const path = paths.createPath(topics, domainId);
            if (!path) return null;

            // Generate content
            const chapter = await generation.generateContent(path, options);
            if (chapter) {
                setSelectedChapter(chapter);
                chapters.refresh();
            }

            return chapter;
        },
        [paths, generation, chapters]
    );

    return {
        // Path management
        paths,

        // Generation
        generation,

        // Chapters
        chapters,
        selectedChapter,
        setSelectedChapter,

        // Quality features (only active when chapter is selected)
        rating: chapterId ? rating : null,
        annotations: chapterId ? annotations : null,
        versions: chapterId ? versions : null,
        forking: chapterId ? forking : null,

        // Combined actions
        generateAndSelect,
    };
}
