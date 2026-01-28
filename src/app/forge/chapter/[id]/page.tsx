"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertTriangle, Eye, Home } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useChapterData } from "../lib/useChapterData";
import { ForgeChapterView } from "../components/ForgeChapterView";
import { useRealtimeChapterStatus } from "@/lib/supabase/useRealtimeChapter";
import { useRealtimeJobProgressByChapter } from "@/lib/supabase/useRealtimeJobProgress";
import { forgeEasing } from "../../lib/animations";

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
            <div className="min-h-screen flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ease: forgeEasing }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-[var(--ember)]/20 rounded-full blur-xl" />
                        <Loader2 className="relative w-10 h-10 text-[var(--ember)] animate-spin" />
                    </div>
                    <p className="text-[var(--forge-text-secondary)]">Loading chapter...</p>
                </motion.div>
            </div>
        );
    }

    // Error state
    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ease: forgeEasing }}
                    className="flex flex-col items-center gap-4 p-8 bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-xl max-w-md text-center"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, ease: forgeEasing }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-[var(--forge-error)]/20 rounded-2xl blur-lg" />
                        <div className="relative w-16 h-16 rounded-2xl bg-[var(--forge-error)]/10 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-[var(--forge-error)]" />
                        </div>
                    </motion.div>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, ease: forgeEasing }}
                        className="text-xl font-semibold text-[var(--forge-text-primary)]"
                    >
                        Chapter Not Found
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, ease: forgeEasing }}
                        className="text-[var(--forge-text-secondary)]"
                    >
                        {error || "The chapter you're looking for doesn't exist or hasn't been generated yet."}
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25, ease: forgeEasing }}
                        className="flex gap-3"
                    >
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Go Back
                        </button>
                        <Link
                            href="/forge"
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white rounded-xl shadow-lg shadow-[var(--ember)]/20 hover:shadow-xl hover:shadow-[var(--ember)]/30 transition-shadow"
                        >
                            <Home className="w-4 h-4" />
                            Forge Home
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ease: forgeEasing }}
            className="min-h-screen"
        >
            {/* Preview mode banner */}
            {isPreviewMode && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ease: forgeEasing }}
                    className="bg-[var(--forge-info)]/10 border-b border-[var(--forge-info)]/20"
                >
                    <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4 text-[var(--forge-info)]" />
                        <span className="text-sm text-[var(--forge-info)]">
                            Preview Mode - Enroll in this path to track progress and earn XP
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Back navigation - full width */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, ease: forgeEasing }}
                className="sticky top-0 z-50 bg-[var(--forge-bg-daylight)]/95 backdrop-blur-xl border-b border-[var(--forge-border-subtle)]"
            >
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-[var(--forge-text-secondary)] hover:text-[var(--ember)] transition-colors"
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
            </motion.div>

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
        </motion.div>
    );
}
