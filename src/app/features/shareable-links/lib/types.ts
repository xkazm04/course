/**
 * Types for the shareable links feature
 */

import type { LearningPath } from "@/app/shared/lib/types";

/**
 * Shareable link data embedded in URL
 */
export interface ShareableLinkData {
    /** Learning path ID */
    pathId: string;
    /** Optional user progress percentage */
    progress?: number;
    /** Timestamp when link was created */
    createdAt: number;
}

/**
 * Share preview data for OG meta tags
 */
export interface SharePreviewData {
    path: LearningPath;
    progress?: number;
    shareUrl: string;
    ogImageUrl: string;
}

/**
 * Share modal state
 */
export interface ShareModalState {
    isOpen: boolean;
    path: LearningPath | null;
    shareUrl: string | null;
    copied: boolean;
}

/**
 * OG image generation request params
 */
export interface OGImageParams {
    pathId: string;
    pathName: string;
    pathColor: string;
    courses: number;
    hours: number;
    skills: string[];
    progress?: number;
}
