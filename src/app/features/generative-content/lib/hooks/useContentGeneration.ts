/**
 * Content Generation Hook
 *
 * Hook for generating chapter content.
 */

"use client";

import { useState, useCallback } from "react";
import type {
    LearningPathSeed,
    GeneratedChapter,
    ContentGenerationParams,
    GenerationJob,
} from "../types";
import { createDefaultGenerationParams } from "../types";
import { generateChapter, createGenerationJob, getGenerationJob } from "../contentGenerator";
import {
    saveChapter,
    trackUserPath,
    saveJob,
    getJobById,
} from "../pathStorage";
import { useCurrentUser } from "./useCurrentUser";

/**
 * Hook for generating chapter content
 */
export function useContentGeneration() {
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { userId } = useCurrentUser();

    /**
     * Generate a chapter from a path seed
     */
    const generateContent = useCallback(
        async (
            pathSeed: LearningPathSeed,
            options?: Partial<ContentGenerationParams>
        ): Promise<GeneratedChapter | null> => {
            setIsGenerating(true);
            setError(null);

            try {
                // Create generation job
                const job = createGenerationJob(pathSeed.pathId);
                setCurrentJob(job);
                saveJob(job);

                // Merge options with defaults
                const params: ContentGenerationParams = {
                    ...createDefaultGenerationParams(pathSeed),
                    ...options,
                };

                // Generate the chapter
                const chapter = await generateChapter(params, job.jobId);

                // Save the generated chapter
                saveChapter(chapter);

                // Track user path exploration
                trackUserPath(userId, pathSeed.pathId);

                // Update job status
                const updatedJob = getGenerationJob(job.jobId);
                if (updatedJob) {
                    setCurrentJob(updatedJob);
                    saveJob(updatedJob);
                }

                return chapter;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Generation failed";
                setError(errorMessage);
                return null;
            } finally {
                setIsGenerating(false);
            }
        },
        [userId]
    );

    /**
     * Poll job status
     */
    const pollJobStatus = useCallback((jobId: string): GenerationJob | undefined => {
        const job = getJobById(jobId);
        if (job) {
            setCurrentJob(job);
        }
        return job;
    }, []);

    return {
        isGenerating,
        currentJob,
        error,
        generateContent,
        pollJobStatus,
    };
}
