/**
 * Job Storage
 *
 * Storage operations for generation jobs.
 */

import type { GenerationJob } from "../types";
import { STORAGE_KEYS } from "./constants";
import { getStorageItem, setStorageItem } from "./helpers";

/**
 * Save a generation job
 */
export function saveJob(job: GenerationJob): void {
    const jobs = getStorageItem<GenerationJob[]>(STORAGE_KEYS.JOBS, []);
    const existingIndex = jobs.findIndex((j) => j.jobId === job.jobId);

    if (existingIndex >= 0) {
        jobs[existingIndex] = job;
    } else {
        jobs.push(job);
    }

    setStorageItem(STORAGE_KEYS.JOBS, jobs);
}

/**
 * Get job by ID
 */
export function getJobById(jobId: string): GenerationJob | undefined {
    const jobs = getStorageItem<GenerationJob[]>(STORAGE_KEYS.JOBS, []);
    return jobs.find((j) => j.jobId === jobId);
}

/**
 * Get active jobs
 */
export function getActiveJobs(): GenerationJob[] {
    const jobs = getStorageItem<GenerationJob[]>(STORAGE_KEYS.JOBS, []);
    return jobs.filter((j) => j.status === "queued" || j.status === "generating");
}

/**
 * Get jobs for a path seed
 */
export function getJobsForPathSeed(pathSeedId: string): GenerationJob[] {
    const jobs = getStorageItem<GenerationJob[]>(STORAGE_KEYS.JOBS, []);
    return jobs.filter((j) => j.pathSeedId === pathSeedId);
}

/**
 * Clean up old completed jobs
 */
export function cleanupOldJobs(maxAgeDays: number = 7): void {
    const jobs = getStorageItem<GenerationJob[]>(STORAGE_KEYS.JOBS, []);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const filtered = jobs.filter((job) => {
        if (job.status === "completed" || job.status === "failed") {
            const completedDate = job.completedAt ? new Date(job.completedAt) : null;
            return completedDate && completedDate > cutoffDate;
        }
        return true;
    });

    setStorageItem(STORAGE_KEYS.JOBS, filtered);
}
