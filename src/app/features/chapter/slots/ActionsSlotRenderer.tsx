"use client";

import React, { useMemo, memo, useState, useCallback } from "react";
import { ThumbsUp, RefreshCw, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { cn, buttonSizeClasses } from "@/app/shared/lib/utils";
import { BookmarkButton } from "@/app/features/bookmarks";
// Import directly from specific files to avoid circular dependency with chapterLayoutEngine
import { getSimplifiedSections } from "../lib/chapterData";
import type { ActionsSlot } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";

export interface ActionsSlotRendererProps {
    slot: ActionsSlot;
    state: ChapterState;
    className?: string;
}

type RegenerateStatus = "idle" | "deleting" | "generating" | "polling" | "completed" | "failed";

const STATUS_MESSAGES: Record<RegenerateStatus, string> = {
    idle: "Regenerate Content",
    deleting: "Resetting content...",
    generating: "Starting generation...",
    polling: "Generating content (~60s)...",
    completed: "Content ready!",
    failed: "Generation failed",
};

/**
 * Poll for chapter content completion
 */
async function pollForCompletion(
    chapterId: string,
    maxAttempts: number = 24, // 2 minutes total (5s * 24)
    intervalMs: number = 5000
): Promise<boolean> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const response = await fetch(`/api/chapters/${chapterId}`);
            if (response.ok) {
                const data = await response.json();
                // Check if content is ready (content_status = 'ready' or generated_content exists)
                if (data.content_status === "ready" || data.generated_content) {
                    console.log(`[Regenerate] Content ready after ${attempt + 1} attempts`);
                    return true;
                }
                // Check if generation failed
                if (data.content_status === "failed") {
                    console.error(`[Regenerate] Generation failed`);
                    return false;
                }
            }
        } catch (error) {
            console.warn(`[Regenerate] Poll attempt ${attempt + 1} failed:`, error);
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    console.warn(`[Regenerate] Polling timed out after ${maxAttempts} attempts`);
    return false;
}

/**
 * ActionsSlotRenderer - Renders action buttons (bookmark, like, regenerate)
 *
 * Memoized to prevent re-renders when unrelated ChapterState properties change.
 * Only re-renders when action-specific state changes (courseInfo, currentSection).
 */
const ActionsSlotRendererComponent: React.FC<ActionsSlotRendererProps> = ({ slot, state, className }) => {
    const { data } = slot;
    const { courseInfo, currentSection } = state;
    const [status, setStatus] = useState<RegenerateStatus>("idle");

    // Memoize slot data defaults
    const actionsConfig = useMemo(() => ({
        showBookmark: data?.showBookmark ?? true,
        showLike: data?.showLike ?? true,
        showRegenerate: data?.showRegenerate ?? false,
        variant: data?.variant ?? "full",
    }), [data?.showBookmark, data?.showLike, data?.showRegenerate, data?.variant]);

    const { showBookmark, showLike, showRegenerate, variant } = actionsConfig;

    // Memoize sections lookup
    const sections = useMemo(() => getSimplifiedSections(), []);

    // Memoize current section data
    const currentSectionData = useMemo(() => sections[currentSection], [sections, currentSection]);

    // Handle regenerate content with polling
    const handleRegenerate = useCallback(async () => {
        if (!courseInfo.chapterId) return;

        try {
            // 1. Reset chapter content
            setStatus("deleting");
            const deleteResponse = await fetch(`/api/chapters/${courseInfo.chapterId}`, { method: 'DELETE' });
            if (!deleteResponse.ok) {
                throw new Error(`Failed to delete chapter: ${deleteResponse.status}`);
            }

            // 2. Trigger new generation
            setStatus("generating");
            const generateResponse = await fetch('/api/content/generate-chapter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chapter_id: courseInfo.chapterId })
            });

            if (!generateResponse.ok) {
                const errorText = await generateResponse.text();
                throw new Error(`Failed to start generation: ${generateResponse.status} - ${errorText}`);
            }

            // 3. Poll for completion
            setStatus("polling");
            const success = await pollForCompletion(courseInfo.chapterId);

            if (success) {
                setStatus("completed");
                // Brief delay to show success message
                await new Promise(resolve => setTimeout(resolve, 1000));
                // Reload to show new content
                window.location.reload();
            } else {
                setStatus("failed");
                // Reset to idle after showing error
                setTimeout(() => setStatus("idle"), 3000);
            }
        } catch (error) {
            console.error('Regeneration failed:', error);
            setStatus("failed");
            // Reset to idle after showing error
            setTimeout(() => setStatus("idle"), 3000);
        }
    }, [courseInfo.chapterId]);

    const isRegenerating = status !== "idle" && status !== "failed";

    // Get icon based on status
    const getStatusIcon = () => {
        switch (status) {
            case "completed":
                return <CheckCircle size={ICON_SIZES.sm} className="text-green-400" />;
            case "failed":
                return <AlertCircle size={ICON_SIZES.sm} className="text-red-400" />;
            case "idle":
                return <RefreshCw size={ICON_SIZES.sm} />;
            default:
                return <Loader2 size={ICON_SIZES.sm} className="animate-spin" />;
        }
    };

    // Get button style based on status
    const getButtonStyle = () => {
        if (status === "failed") {
            return "bg-red-600 hover:bg-red-700";
        }
        if (status === "completed") {
            return "bg-green-600 hover:bg-green-700";
        }
        return "bg-[var(--ember)] hover:bg-[var(--ember-glow)]";
    };

    return (
        <div className={cn("flex flex-col gap-2", className)} data-testid={`actions-slot-${slot.id}`}>
            {showRegenerate && (
                <button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className={cn(
                        buttonSizeClasses.md,
                        "w-full text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed",
                        getButtonStyle()
                    )}
                    data-testid="actions-slot-regenerate-btn"
                >
                    <span data-testid={`actions-slot-regenerate-status-${status}`}>
                        {getStatusIcon()}
                    </span>
                    {STATUS_MESSAGES[status]}
                </button>
            )}
            {showBookmark && (
                <BookmarkButton
                    courseId={courseInfo.courseId}
                    courseName={courseInfo.courseName}
                    chapterId={courseInfo.chapterId}
                    chapterTitle={courseInfo.chapterTitle}
                    sectionId={currentSectionData?.id ?? ""}
                    sectionTitle={currentSectionData?.title ?? ""}
                    variant={variant}
                    className="flex-1"
                />
            )}
            {showLike && (
                <button
                    className={cn(
                        buttonSizeClasses.md,
                        "flex-1 bg-[var(--surface-overlay)] border border-[var(--border-strong)] rounded-xl font-medium text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors flex items-center justify-center gap-2"
                    )}
                    data-testid="actions-slot-like-btn"
                >
                    <ThumbsUp size={ICON_SIZES.sm} /> Like
                </button>
            )}
        </div>
    );
};

/**
 * Custom comparison function for ActionsSlotRenderer
 * Only re-renders when action-specific props change
 */
function areActionsPropsEqual(
    prevProps: ActionsSlotRendererProps,
    nextProps: ActionsSlotRendererProps
): boolean {
    if (prevProps.slot.id !== nextProps.slot.id) return false;
    if (prevProps.className !== nextProps.className) return false;

    // Check slot data
    const prevData = prevProps.slot.data;
    const nextData = nextProps.slot.data;
    if (
        prevData?.showBookmark !== nextData?.showBookmark ||
        prevData?.showLike !== nextData?.showLike ||
        prevData?.showRegenerate !== nextData?.showRegenerate ||
        prevData?.variant !== nextData?.variant
    ) {
        return false;
    }

    // Check state - only action-related properties
    const prevState = prevProps.state;
    const nextState = nextProps.state;
    return (
        prevState.currentSection === nextState.currentSection &&
        prevState.courseInfo.courseId === nextState.courseInfo.courseId &&
        prevState.courseInfo.courseName === nextState.courseInfo.courseName &&
        prevState.courseInfo.chapterId === nextState.courseInfo.chapterId &&
        prevState.courseInfo.chapterTitle === nextState.courseInfo.chapterTitle
    );
}

export const ActionsSlotRenderer = memo(ActionsSlotRendererComponent, areActionsPropsEqual);

export default ActionsSlotRenderer;
