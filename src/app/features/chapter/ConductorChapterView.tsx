/**
 * Conductor Chapter View
 *
 * AI-powered learning conductor that wraps ChapterView with intelligent
 * behavior tracking, adaptive orchestration, and collective intelligence.
 *
 * Features:
 * - Real-time behavior tracking (pause patterns, replay, quiz attempts, code errors)
 * - Adaptive content orchestration based on learner profile
 * - Peer solutions surfacing when learners struggle
 * - Section reordering based on optimal learning paths
 * - Remedial content injection for struggling learners
 * - Progress celebrations and engagement management
 */

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Settings, BarChart2, Users, X } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";

// Core Chapter components
import { ChapterView } from "./ChapterView";
import type { ChapterViewProps, ChapterViewVariantProps } from "./ChapterView";

// Conductor system
import { LearningConductorProvider, useLearningConductor } from "./lib/LearningConductorContext";
import { useBehaviorTracking } from "./lib/useBehaviorTracking";
import { useOrchestration } from "./lib/useOrchestration";
import { BehaviorTrackingProvider } from "./lib/BehaviorTrackingContext";
import type { BehaviorTrackingCallbacks } from "./lib/BehaviorTrackingContext";
import type { ConductorConfig, LearnerProfile } from "./lib/conductorTypes";
import { CHAPTER_SECTIONS, COURSE_INFO } from "./lib/chapterData";

// UI Components
import { OrchestrationCard } from "./components/OrchestrationCard";
import { PeerSolutionsPanel } from "./components/PeerSolutionsPanel";
import { CelebrationOverlay } from "./components/CelebrationOverlay";

// ============================================================================
// Types
// ============================================================================

export interface ConductorChapterViewProps extends ChapterViewProps {
    /**
     * User ID for tracking and personalization
     */
    userId?: string;

    /**
     * Enable the AI Learning Conductor
     * @default true
     */
    enableConductor?: boolean;

    /**
     * Show the conductor status indicator
     * @default true
     */
    showConductorStatus?: boolean;

    /**
     * Show peer solutions panel
     * @default true
     */
    showPeerSolutions?: boolean;

    /**
     * Custom conductor configuration
     */
    conductorConfig?: Partial<ConductorConfig>;

    /**
     * Callback when learner profile updates
     */
    onProfileUpdate?: (profile: LearnerProfile) => void;

    /**
     * Callback when section completes
     */
    onSectionComplete?: (sectionId: string) => void;
}

// ============================================================================
// Inner Component (has access to conductor context)
// ============================================================================

interface ConductorChapterViewInnerProps extends ChapterViewProps {
    showConductorStatus: boolean;
    showPeerSolutions: boolean;
    onProfileUpdate?: (profile: LearnerProfile) => void;
    onSectionComplete?: (sectionId: string) => void;
}

function ConductorChapterViewInner({
    showConductorStatus,
    showPeerSolutions,
    onProfileUpdate,
    onSectionComplete,
    sections = CHAPTER_SECTIONS,
    courseInfo = COURSE_INFO,
    ...chapterProps
}: ConductorChapterViewInnerProps) {
    const conductor = useLearningConductor();
    const [showSettings, setShowSettings] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const [peerSolutionsOpen, setPeerSolutionsOpen] = useState(false);

    // Orchestration hook
    const orchestration = useOrchestration({
        sections,
        enabled: conductor.config.enableAdaptiveOrdering,
    });

    // Behavior tracking for current section
    const behaviorTracking = useBehaviorTracking({
        userId: conductor.state.userId,
        courseId: conductor.state.courseId,
        chapterId: conductor.state.chapterId,
        sectionId: conductor.state.currentSectionId,
        enabled: conductor.config.enableBehaviorTracking,
    });

    // Profile update callback
    useEffect(() => {
        const profile = conductor.getLearnerProfile();
        onProfileUpdate?.(profile);
    }, [conductor, onProfileUpdate]);

    // Handle section completion
    const handleSectionComplete = useCallback(
        (sectionId: string) => {
            behaviorTracking.trackSectionComplete();
            onSectionComplete?.(sectionId);

            // Check for celebration triggers
            const behavior = behaviorTracking.getBehavior();
            if (behavior.quiz.correctCount > 0 && behavior.quiz.incorrectCount === 0) {
                conductor.triggerDecision("celebrate_progress", "Perfect quiz score!");
            }
        },
        [behaviorTracking, onSectionComplete, conductor]
    );

    // Track video behaviors (would be connected to actual video player)
    const handleVideoPause = useCallback(
        (timestamp: number) => {
            behaviorTracking.trackVideoPause(timestamp);
        },
        [behaviorTracking]
    );

    const handleVideoReplay = useCallback(
        (startTime: number, endTime: number) => {
            behaviorTracking.trackVideoReplay(startTime, endTime);
        },
        [behaviorTracking]
    );

    // Track quiz attempts
    const handleQuizAttempt = useCallback(
        (questionId: string, correct: boolean, timeSpent: number) => {
            behaviorTracking.trackQuizAttempt(questionId, correct, timeSpent);
        },
        [behaviorTracking]
    );

    // Track code execution
    const handleCodeExecution = useCallback(
        (success: boolean, error?: string) => {
            behaviorTracking.trackCodeExecution(success, error);
        },
        [behaviorTracking]
    );

    // Track code edits
    const handleCodeEdit = useCallback(() => {
        behaviorTracking.trackCodeEdit();
    }, [behaviorTracking]);

    // Track code hints
    const handleCodeHint = useCallback(() => {
        behaviorTracking.trackCodeHint();
    }, [behaviorTracking]);

    // Track video play
    const handleVideoPlay = useCallback(
        (timestamp: number) => {
            behaviorTracking.trackVideoPlay(timestamp);
        },
        [behaviorTracking]
    );

    // Track video seek
    const handleVideoSeek = useCallback(
        (from: number, to: number) => {
            behaviorTracking.trackVideoSeek(from, to);
        },
        [behaviorTracking]
    );

    // Track video speed change
    const handleVideoSpeedChange = useCallback(
        (speed: number) => {
            behaviorTracking.trackVideoSpeedChange(speed);
        },
        [behaviorTracking]
    );

    // Track video progress
    const handleVideoProgress = useCallback(
        (watchDuration: number, totalDuration: number) => {
            behaviorTracking.trackVideoProgress(watchDuration, totalDuration);
        },
        [behaviorTracking]
    );

    // Track quiz hint
    const handleQuizHint = useCallback(
        (questionId: string) => {
            behaviorTracking.trackQuizHint(questionId);
        },
        [behaviorTracking]
    );

    // Track quiz complete
    const handleQuizComplete = useCallback(
        (score: number, totalQuestions: number) => {
            // Check for celebration triggers on quiz completion
            if (score === totalQuestions && totalQuestions > 0) {
                conductor.triggerDecision("celebrate_progress", "Perfect quiz score!");
            }
        },
        [conductor]
    );

    // Build behavior tracking callbacks object
    const behaviorTrackingCallbacks = useMemo<BehaviorTrackingCallbacks>(
        () => ({
            onVideoPause: handleVideoPause,
            onVideoPlay: handleVideoPlay,
            onVideoSeek: handleVideoSeek,
            onVideoReplay: handleVideoReplay,
            onVideoSpeedChange: handleVideoSpeedChange,
            onVideoProgress: handleVideoProgress,
            onQuizAttempt: handleQuizAttempt,
            onQuizHint: handleQuizHint,
            onQuizComplete: handleQuizComplete,
            onCodeExecution: handleCodeExecution,
            onCodeEdit: handleCodeEdit,
            onCodeHint: handleCodeHint,
            onSectionComplete: handleSectionComplete,
        }),
        [
            handleVideoPause,
            handleVideoPlay,
            handleVideoSeek,
            handleVideoReplay,
            handleVideoSpeedChange,
            handleVideoProgress,
            handleQuizAttempt,
            handleQuizHint,
            handleQuizComplete,
            handleCodeExecution,
            handleCodeEdit,
            handleCodeHint,
            handleSectionComplete,
        ]
    );

    // Pace recommendation display
    const paceRec = orchestration.getPaceRecommendation();

    return (
        <div className="relative" data-testid="conductor-chapter-view">
            {/* Conductor Status Bar */}
            {showConductorStatus && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 px-4 py-2 bg-[var(--forge-bg-anvil)] backdrop-blur-sm border border-[var(--forge-border-subtle)] rounded-lg flex items-center justify-between"
                    data-testid="conductor-status-bar"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-2 h-2 rounded-full bg-[var(--forge-success)]"
                            />
                            <Brain size={16} className="text-[var(--ember)]" />
                            <span className="text-sm font-medium text-[var(--forge-text-secondary)]">
                                AI Conductor Active
                            </span>
                        </div>

                        {/* Pace indicator */}
                        {paceRec.message && (
                            <span className="text-xs text-[var(--forge-text-muted)] hidden sm:inline">
                                {paceRec.message}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Stats toggle */}
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                showStats
                                    ? "bg-[var(--ember)]/20 text-[var(--ember)]"
                                    : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-elevated)]"
                            )}
                            data-testid="conductor-stats-toggle"
                        >
                            <BarChart2 size={16} />
                        </button>

                        {/* Peer solutions toggle */}
                        {showPeerSolutions && (
                            <button
                                onClick={() => setPeerSolutionsOpen(!peerSolutionsOpen)}
                                className={cn(
                                    "p-1.5 rounded-lg transition-colors",
                                    peerSolutionsOpen
                                        ? "bg-[var(--ember)]/20 text-[var(--ember)]"
                                        : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-elevated)]"
                                )}
                                data-testid="conductor-peer-solutions-toggle"
                            >
                                <Users size={16} />
                            </button>
                        )}

                        {/* Settings toggle */}
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={cn(
                                "p-1.5 rounded-lg transition-colors",
                                showSettings
                                    ? "bg-[var(--ember)]/20 text-[var(--ember)]"
                                    : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-elevated)]"
                            )}
                            data-testid="conductor-settings-toggle"
                        >
                            <Settings size={16} />
                        </button>
                    </div>
                </motion.div>
            )}

            {/* Stats Panel */}
            <AnimatePresence>
                {showStats && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4"
                        data-testid="conductor-stats-panel"
                    >
                        <ConductorStatsPanel profile={conductor.getLearnerProfile()} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Settings Panel */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4"
                        data-testid="conductor-settings-panel"
                    >
                        <ConductorSettingsPanel
                            config={conductor.config}
                            onConfigChange={conductor.updateConfig}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Orchestration Decision Card */}
            <AnimatePresence>
                {orchestration.pendingDecision && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mb-4"
                    >
                        <OrchestrationCard
                            decision={orchestration.pendingDecision}
                            onAccept={orchestration.acceptDecision}
                            onDismiss={orchestration.dismissCurrentDecision}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Peer Solutions Panel */}
            {showPeerSolutions && (
                <div className="mb-4">
                    <PeerSolutionsPanel
                        sectionId={conductor.state.currentSectionId}
                        isOpen={peerSolutionsOpen}
                        onToggle={() => setPeerSolutionsOpen(!peerSolutionsOpen)}
                        onSolutionView={behaviorTracking.trackPeerSolutionView}
                    />
                </div>
            )}

            {/* Main Chapter View - wrapped with BehaviorTrackingProvider */}
            <BehaviorTrackingProvider
                enabled={conductor.config.enableBehaviorTracking}
                callbacks={behaviorTrackingCallbacks}
            >
                <ChapterView
                    {...chapterProps}
                    sections={orchestration.optimizedSections}
                    courseInfo={courseInfo}
                />
            </BehaviorTrackingProvider>

            {/* Celebration Overlay */}
            <CelebrationOverlay
                isVisible={orchestration.shouldCelebrate}
                message={orchestration.celebrationMessage}
                onDismiss={orchestration.dismissCelebration}
            />
        </div>
    );
}

// ============================================================================
// Stats Panel Component
// ============================================================================

function ConductorStatsPanel({ profile }: { profile: LearnerProfile }) {
    return (
        <div className="p-4 bg-[var(--forge-bg-anvil)] border border-[var(--forge-border-subtle)] rounded-lg">
            <h4 className="text-sm font-semibold text-[var(--forge-text-primary)] mb-3 flex items-center gap-2">
                <BarChart2 size={16} className="text-[var(--ember)]" />
                Your Learning Profile
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatItem label="Pace" value={profile.pace} />
                <StatItem label="Confidence" value={profile.confidence} />
                <StatItem
                    label="Engagement"
                    value={`${Math.round(profile.engagementScore)}%`}
                />
                <StatItem
                    label="Retention"
                    value={`${Math.round(profile.retentionScore)}%`}
                />
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--forge-border-subtle)]">
                <h5 className="text-xs text-[var(--forge-text-muted)] mb-2">Learning Style</h5>
                <div className="flex gap-2 flex-wrap">
                    <StyleBadge
                        label="Video"
                        value={profile.learningStyle.prefersVideo}
                    />
                    <StyleBadge
                        label="Code"
                        value={profile.learningStyle.prefersCode}
                    />
                    <StyleBadge
                        label="Text"
                        value={profile.learningStyle.prefersText}
                    />
                    <StyleBadge
                        label="Interactive"
                        value={profile.learningStyle.prefersInteractive}
                    />
                </div>
            </div>
        </div>
    );
}

function StatItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-xs text-[var(--forge-text-muted)]">{label}</div>
            <div className="text-sm font-medium text-[var(--forge-text-primary)] capitalize">{value}</div>
        </div>
    );
}

function StyleBadge({ label, value }: { label: string; value: number }) {
    const percentage = Math.round(value * 100);
    return (
        <div className="px-2.5 py-1 bg-[var(--forge-bg-elevated)] rounded-lg">
            <div className="text-xs text-[var(--forge-text-muted)]">{label}</div>
            <div className="text-sm font-medium text-[var(--forge-text-primary)]">{percentage}%</div>
        </div>
    );
}

// ============================================================================
// Settings Panel Component
// ============================================================================

function ConductorSettingsPanel({
    config,
    onConfigChange,
}: {
    config: ConductorConfig;
    onConfigChange: (updates: Partial<ConductorConfig>) => void;
}) {
    return (
        <div className="p-4 bg-[var(--forge-bg-anvil)] border border-[var(--forge-border-subtle)] rounded-lg">
            <h4 className="text-sm font-semibold text-[var(--forge-text-primary)] mb-3 flex items-center gap-2">
                <Settings size={16} className="text-[var(--ember)]" />
                Conductor Settings
            </h4>

            <div className="space-y-3">
                <SettingToggle
                    label="Behavior Tracking"
                    description="Track learning patterns to personalize experience"
                    enabled={config.enableBehaviorTracking}
                    onChange={(v) => onConfigChange({ enableBehaviorTracking: v })}
                    testId="setting-behavior-tracking"
                />
                <SettingToggle
                    label="Adaptive Ordering"
                    description="Optimize section order based on your progress"
                    enabled={config.enableAdaptiveOrdering}
                    onChange={(v) => onConfigChange({ enableAdaptiveOrdering: v })}
                    testId="setting-adaptive-ordering"
                />
                <SettingToggle
                    label="Remedial Content"
                    description="Show additional help when struggling"
                    enabled={config.enableRemedialInjection}
                    onChange={(v) => onConfigChange({ enableRemedialInjection: v })}
                    testId="setting-remedial-content"
                />
                <SettingToggle
                    label="Peer Solutions"
                    description="Surface solutions from other learners"
                    enabled={config.enablePeerSolutions}
                    onChange={(v) => onConfigChange({ enablePeerSolutions: v })}
                    testId="setting-peer-solutions"
                />
                <SettingToggle
                    label="Acceleration"
                    description="Skip ahead when you're doing well"
                    enabled={config.enableAcceleration}
                    onChange={(v) => onConfigChange({ enableAcceleration: v })}
                    testId="setting-acceleration"
                />
            </div>
        </div>
    );
}

function SettingToggle({
    label,
    description,
    enabled,
    onChange,
    testId,
}: {
    label: string;
    description: string;
    enabled: boolean;
    onChange: (value: boolean) => void;
    testId: string;
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div>
                <div className="text-sm font-medium text-[var(--forge-text-primary)]">{label}</div>
                <div className="text-xs text-[var(--forge-text-muted)]">{description}</div>
            </div>
            <button
                onClick={() => onChange(!enabled)}
                className={cn(
                    "relative w-10 h-5 rounded-full transition-colors",
                    enabled ? "bg-[var(--ember)]" : "bg-[var(--forge-bg-elevated)]"
                )}
                data-testid={testId}
            >
                <motion.div
                    animate={{ x: enabled ? 20 : 0 }}
                    className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full"
                />
            </button>
        </div>
    );
}

// ============================================================================
// Main Exported Component
// ============================================================================

export function ConductorChapterView({
    userId = "anonymous",
    enableConductor = true,
    showConductorStatus = true,
    showPeerSolutions = true,
    conductorConfig,
    onProfileUpdate,
    onSectionComplete,
    courseInfo = COURSE_INFO,
    sections = CHAPTER_SECTIONS,
    ...chapterProps
}: ConductorChapterViewProps) {
    // If conductor is disabled, just render standard ChapterView
    if (!enableConductor) {
        return <ChapterView courseInfo={courseInfo} sections={sections} {...chapterProps} />;
    }

    return (
        <LearningConductorProvider
            userId={userId}
            courseId={courseInfo?.courseId || "default"}
            chapterId={courseInfo?.chapterId || "default"}
            initialSectionId={sections?.[0]?.sectionId || "intro"}
            config={conductorConfig}
        >
            <ConductorChapterViewInner
                showConductorStatus={showConductorStatus}
                showPeerSolutions={showPeerSolutions}
                onProfileUpdate={onProfileUpdate}
                onSectionComplete={onSectionComplete}
                courseInfo={courseInfo}
                sections={sections}
                {...chapterProps}
            />
        </LearningConductorProvider>
    );
}

export default ConductorChapterView;
