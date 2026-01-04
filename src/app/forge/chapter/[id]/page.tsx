"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertTriangle, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import { useChapterData } from "../lib/useChapterData";
import { ForgeChapterView } from "../components/ForgeChapterView";
import { useRealtimeChapterStatus } from "@/lib/supabase/useRealtimeChapter";
import { useRealtimeJobProgressByChapter } from "@/lib/supabase/useRealtimeJobProgress";

export default function ChapterPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const chapterId = params.id as string;
    const isPreviewMode = searchParams.get("preview") === "true";

    const { data, isLoading, error, refetch } = useChapterData(chapterId);

    // Regenerate state
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Subscribe to realtime chapter status updates
    const { status: realtimeStatus, isSubscribed } = useRealtimeChapterStatus(chapterId);

    // Subscribe to job progress for detailed feedback
    const { progress: jobProgress } = useRealtimeJobProgressByChapter(chapterId);

    // React to content becoming ready via Realtime
    useEffect(() => {
        if (isRegenerating && realtimeStatus?.content_status === "ready") {
            setIsRegenerating(false);
            refetch();
        }
    }, [realtimeStatus, isRegenerating, refetch]);

    // React to job failure
    useEffect(() => {
        if (isRegenerating && jobProgress?.status === "failed") {
            setIsRegenerating(false);
        }
    }, [jobProgress, isRegenerating]);

    const handleRegenerate = useCallback(async () => {
        setIsRegenerating(true);
        try {
            await fetch(`/api/chapters/${chapterId}`, { method: "DELETE" });
            await fetch("/api/content/generate-chapter", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chapter_id: chapterId }),
            });
        } catch (err) {
            console.error("Regeneration error:", err);
            setIsRegenerating(false);
        }
    }, [chapterId]);

    const handleBack = () => {
        router.back();
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--forge-bg-void)] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <Loader2 className="w-8 h-8 text-[var(--ember)] animate-spin" />
                    <p className="text-[var(--forge-text-secondary)]">Loading chapter...</p>
                </motion.div>
            </div>
        );
    }

    // Error state
    if (error || !data) {
        return (
            <div className="min-h-screen bg-[var(--forge-bg-void)] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-4 p-8 bg-[var(--forge-bg-elevated)] rounded-xl border border-[var(--forge-border-subtle)] max-w-md"
                >
                    <AlertTriangle className="w-12 h-12 text-[var(--forge-error)]" />
                    <h2 className="text-xl font-semibold text-[var(--forge-text-primary)]">
                        Chapter Not Found
                    </h2>
                    <p className="text-center text-[var(--forge-text-secondary)]">
                        {error || "The chapter you're looking for doesn't exist or hasn't been generated yet."}
                    </p>
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--ember)] hover:bg-[var(--ember-glow)] text-white rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Go Back
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--forge-bg-void)]">
            {/* Preview mode banner */}
            {isPreviewMode && (
                <div className="bg-[var(--forge-info)]/10 border-b border-[var(--forge-info)]/20">
                    <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4 text-[var(--forge-info)]" />
                        <span className="text-sm text-[var(--forge-info)]">
                            Preview Mode - Enroll in this path to track progress and earn XP
                        </span>
                    </div>
                </div>
            )}

            {/* Back navigation - full width */}
            <div className="sticky top-0 z-50 bg-[var(--forge-bg-void)]/95 backdrop-blur-sm border-b border-[var(--forge-border-subtle)]">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {isPreviewMode ? "Back to Community" : "Back to Map"}
                    </button>
                    <div className="h-4 w-px bg-[var(--forge-border-subtle)]" />
                    <div className="flex flex-col">
                        <span className="text-xs text-[var(--forge-text-muted)]">
                            {data.courseInfo.courseName}
                        </span>
                        <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                            {data.courseInfo.chapterTitle}
                        </span>
                    </div>
                    {isPreviewMode && (
                        <>
                            <div className="flex-1" />
                            <span className="text-xs px-2 py-1 rounded-full bg-[var(--forge-info)]/10 text-[var(--forge-info)] border border-[var(--forge-info)]/20">
                                Preview
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Main content - Full width, TOC sidebar integrated */}
            <ForgeChapterView
                data={data}
                contentMetadata={data.contentMetadata}
                isPreviewMode={isPreviewMode}
                isRegenerating={isRegenerating}
                onRegenerate={handleRegenerate}
                isRealtimeConnected={isSubscribed}
                regenerateProgress={jobProgress ? {
                    percent: jobProgress.progress_percent || 0,
                    message: jobProgress.progress_message || "Processing...",
                } : null}
            />
        </div>
    );
}
