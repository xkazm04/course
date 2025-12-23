/**
 * Utilities for generating and parsing shareable links
 */

import type { LearningPath } from "@/app/shared/lib/types";
import type { ShareableLinkData } from "./types";

/**
 * Generate a shareable URL for a learning path
 */
export function generateShareUrl(
    pathId: string,
    progress?: number,
    baseUrl?: string
): string {
    const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
    const url = new URL(`/path/${pathId}`, base);

    if (progress !== undefined && progress > 0) {
        url.searchParams.set("progress", progress.toString());
    }

    url.searchParams.set("utm_source", "share");
    url.searchParams.set("utm_medium", "social");

    return url.toString();
}

/**
 * Generate OG image URL for a learning path
 */
export function generateOGImageUrl(
    path: LearningPath,
    progress?: number,
    baseUrl?: string
): string {
    const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "");
    const url = new URL("/api/og/path", base);

    url.searchParams.set("id", path.id);
    url.searchParams.set("name", path.name);
    url.searchParams.set("color", path.color);
    url.searchParams.set("courses", path.courses.toString());
    url.searchParams.set("hours", path.hours.toString());
    url.searchParams.set("skills", path.skills.slice(0, 4).join(","));

    if (progress !== undefined && progress > 0) {
        url.searchParams.set("progress", progress.toString());
    }

    return url.toString();
}

/**
 * Parse share link data from URL
 */
export function parseShareUrl(url: string): ShareableLinkData | null {
    try {
        const parsed = new URL(url);
        const pathMatch = parsed.pathname.match(/^\/path\/([^/]+)/);

        if (!pathMatch) {
            return null;
        }

        const pathId = pathMatch[1];
        const progressParam = parsed.searchParams.get("progress");
        const progress = progressParam ? parseInt(progressParam, 10) : undefined;

        return {
            pathId,
            progress,
            createdAt: Date.now(),
        };
    } catch {
        return null;
    }
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }

        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const success = document.execCommand("copy");
        document.body.removeChild(textArea);
        return success;
    } catch {
        return false;
    }
}

/**
 * Generate share text for social platforms
 */
export function generateShareText(path: LearningPath, progress?: number): string {
    const progressText = progress ? ` - ${progress}% complete` : "";
    return `Check out my ${path.name} learning journey${progressText}! ${path.courses} courses, ${path.hours} hours of content.`;
}

/**
 * Generate Twitter share URL
 */
export function generateTwitterShareUrl(
    path: LearningPath,
    shareUrl: string,
    progress?: number
): string {
    const text = generateShareText(path, progress);
    const twitterUrl = new URL("https://twitter.com/intent/tweet");
    twitterUrl.searchParams.set("text", text);
    twitterUrl.searchParams.set("url", shareUrl);
    return twitterUrl.toString();
}

/**
 * Generate LinkedIn share URL
 */
export function generateLinkedInShareUrl(shareUrl: string): string {
    const linkedInUrl = new URL("https://www.linkedin.com/sharing/share-offsite/");
    linkedInUrl.searchParams.set("url", shareUrl);
    return linkedInUrl.toString();
}
