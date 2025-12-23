/**
 * Generation Job Manager
 * Manages content generation job lifecycle and progress tracking
 */

import type { GenerationJob } from "../types";

const activeJobs = new Map<string, GenerationJob>();

/**
 * Create a new generation job
 */
export function createGenerationJob(pathSeedId: string): GenerationJob {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const job: GenerationJob = {
        jobId,
        pathSeedId,
        status: "queued",
        progress: 0,
        currentStep: "Initializing",
        stepsCompleted: [],
    };

    activeJobs.set(jobId, job);
    return job;
}

/**
 * Get job status
 */
export function getGenerationJob(jobId: string): GenerationJob | undefined {
    return activeJobs.get(jobId);
}

/**
 * Update job progress
 */
export function updateJobProgress(
    jobId: string,
    updates: Partial<GenerationJob>
): void {
    const job = activeJobs.get(jobId);
    if (job) {
        Object.assign(job, updates);
    }
}

/**
 * Remove completed or failed job
 */
export function removeJob(jobId: string): boolean {
    return activeJobs.delete(jobId);
}

/**
 * Get all active jobs
 */
export function getAllJobs(): GenerationJob[] {
    return Array.from(activeJobs.values());
}

/**
 * Get jobs by status
 */
export function getJobsByStatus(status: GenerationJob["status"]): GenerationJob[] {
    return Array.from(activeJobs.values()).filter(job => job.status === status);
}
