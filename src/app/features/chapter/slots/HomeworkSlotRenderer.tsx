// @ts-nocheck
"use client";

import React, { useMemo, memo, useState, useCallback, useEffect } from "react";
import {
    GitBranch,
    Clock,
    FileCode2,
    CheckCircle2,
    Circle,
    Lightbulb,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    Play,
    Send,
    Trophy,
    FolderTree,
    AlertCircle,
    Loader2,
    RefreshCw,
    Zap,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { HomeworkSlot } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";
import {
    useChapterHomework,
    type AssignmentDetails,
    type AcceptanceCriterion,
    type ProgressiveHint,
    type FileScope,
} from "../lib/useChapterHomework";
import { PRStatusIndicator } from "../components/PRStatusIndicator";
import { HomeworkSelectionModal } from "../components/HomeworkSelectionModal";
import { SlotCard, type SlotCardVariant } from "../components/SlotCard";

export interface HomeworkSlotRendererProps {
    slot: HomeworkSlot;
    state: ChapterState;
    className?: string;
    /** Chapter ID for API calls */
    chapterId?: string;
}

// Difficulty color mapping
const difficultyColors: Record<string, string> = {
    beginner: "text-green-500 bg-green-500/10 border-green-500/30",
    intermediate: "text-yellow-500 bg-yellow-500/10 border-yellow-500/30",
    advanced: "text-orange-500 bg-orange-500/10 border-orange-500/30",
    expert: "text-red-500 bg-red-500/10 border-red-500/30",
};

/**
 * HomeworkSlotRenderer - Renders real-world project homework assignments
 *
 * Features:
 * - Repository link with GitHub integration
 * - File scope explorer showing relevant files
 * - Acceptance criteria checklist
 * - Progressive hints system (costs XP)
 * - PR status indicator with refresh
 * - Start/Submit actions based on assignment state
 * - Score and XP display for completed assignments
 */
const HomeworkSlotRendererComponent: React.FC<HomeworkSlotRendererProps> = ({
    slot,
    chapterId,
    className,
}) => {
    const { data: slotData } = slot;

    // Use the homework hook for API integration
    const {
        isLoading,
        error,
        data: homeworkData,
        selectedAssignment,
        isLoadingAssignment,
        prStatus,
        isCheckingPR,
        hasHomeworks,
        activeHomework,
        showSelectionModal,
        refresh,
        startAssignment,
        updateAssignment,
        checkPRStatus,
        revealHint,
        selectHomework,
        closeSelectionModal,
    } = useChapterHomework({
        chapterId: chapterId || slotData.featureId, // fallback to featureId for compatibility
        enabled: true,
    });

    // UI State
    const [expandedFileScope, setExpandedFileScope] = useState(false);
    const [checkedCriteria, setCheckedCriteria] = useState<number[]>([]);
    const [localRevealedHints, setLocalRevealedHints] = useState<number[]>([]);

    // Sync revealed hints from assignment
    useEffect(() => {
        if (selectedAssignment?.hints_revealed) {
            setLocalRevealedHints(selectedAssignment.hints_revealed.map(Number));
        }
    }, [selectedAssignment?.hints_revealed]);

    // Derived data from selected assignment or slot data
    const featureData = useMemo(() => {
        if (activeHomework) {
            return {
                id: activeHomework.feature_id || activeHomework.homework_id,
                name: activeHomework.homework_name || slotData.title || "Homework Assignment",
                description: activeHomework.description || "",
                repoName: activeHomework.project_name || "",
                repoOwner: activeHomework.project_owner || "",
                repoUrl: activeHomework.source_repo_url || "",
                difficulty: activeHomework.difficulty || "intermediate",
                estimatedHours: activeHomework.estimated_hours || 4,
                xpReward: activeHomework.xp_reward || 100,
                branchName: activeHomework.user_branch_name || null,
                defaultBranch: activeHomework.default_branch || "main",
            };
        }

        // Fallback to slot data for preview mode
        return {
            id: slotData.featureId,
            name: slotData.title || "Homework Assignment",
            description: "",
            repoName: "",
            repoOwner: "",
            repoUrl: "",
            difficulty: "intermediate" as const,
            estimatedHours: 4,
            xpReward: 100,
            branchName: null,
            defaultBranch: "main",
        };
    }, [activeHomework, slotData]);

    const assignmentData = useMemo(() => {
        if (selectedAssignment) {
            return {
                id: selectedAssignment.id,
                status: selectedAssignment.status,
                prStatus: selectedAssignment.pr_status,
                prUrl: selectedAssignment.pr_url,
                score: selectedAssignment.score,
                xpEarned: selectedAssignment.xp_earned,
                timeSpentMinutes: selectedAssignment.time_spent_minutes || 0,
                hintsAvailable: selectedAssignment.hints_available || [],
                hintsRevealed: selectedAssignment.hints_revealed || [],
                acceptanceCriteria: selectedAssignment.homework_definition?.acceptance_criteria || [],
                fileScope: selectedAssignment.homework_definition?.file_scope || [],
                hints: selectedAssignment.homework_definition?.hints || [],
            };
        }
        return null;
    }, [selectedAssignment]);

    const toggleFileScope = useCallback(() => {
        setExpandedFileScope((prev) => !prev);
    }, []);

    const handleRevealHint = useCallback(async (level: number) => {
        if (!selectedAssignment?.id) return;

        // Optimistic update
        setLocalRevealedHints((prev) =>
            prev.includes(level) ? prev : [...prev, level].sort()
        );

        const result = await revealHint(selectedAssignment.id, level);
        if (!result.success) {
            // Revert on failure
            setLocalRevealedHints((prev) => prev.filter((l) => l !== level));
        }
    }, [selectedAssignment?.id, revealHint]);

    const toggleCriteria = useCallback((index: number) => {
        setCheckedCriteria((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    }, []);

    const handleStartAssignment = useCallback(async () => {
        if (!activeHomework) return;

        const result = await startAssignment(activeHomework.homework_id);
        if (result.success) {
            // Assignment started successfully
        }
    }, [activeHomework, startAssignment]);

    const handleCheckPRStatus = useCallback(() => {
        if (selectedAssignment?.id) {
            checkPRStatus(selectedAssignment.id);
        }
    }, [selectedAssignment?.id, checkPRStatus]);

    // Determine display variant
    const displayVariant = useMemo(() => {
        if (slotData.variant) return slotData.variant;
        if (!activeHomework) return "preview";
        if (activeHomework.user_assignment_status) {
            if (["completed", "submitted"].includes(activeHomework.user_assignment_status)) {
                return "completed";
            }
            return "active";
        }
        return "preview";
    }, [slotData.variant, activeHomework]);

    const isPreview = displayVariant === "preview";
    const isActive = displayVariant === "active";
    const isCompleted = displayVariant === "completed";

    // Map display variant to SlotCard variant
    const cardVariant: SlotCardVariant = isCompleted ? "success" : "default";

    // Loading state
    if (isLoading) {
        return (
            <SlotCard variant="default" className={className}>
                <SlotCard.Body className="p-8">
                    <div className="flex items-center justify-center gap-3 text-[var(--forge-text-muted)]">
                        <Loader2 size={20} className="animate-spin" />
                        <span>Loading homework...</span>
                    </div>
                </SlotCard.Body>
            </SlotCard>
        );
    }

    // Error state
    if (error) {
        return (
            <SlotCard variant="error" className={className}>
                <SlotCard.Body padding="md">
                    <div className="flex items-center gap-3 text-red-500">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                        <button
                            onClick={refresh}
                            className="ml-auto p-2 rounded-lg hover:bg-red-500/10 transition-colors"
                            data-testid="homework-refresh-btn"
                        >
                            <RefreshCw size={16} />
                        </button>
                    </div>
                </SlotCard.Body>
            </SlotCard>
        );
    }

    // No homeworks available
    if (!hasHomeworks && !slotData.featureId) {
        return (
            <SlotCard variant="default" className={className}>
                <SlotCard.Body className="p-8 text-center">
                    <GitBranch
                        size={32}
                        className="mx-auto mb-3 text-[var(--forge-text-muted)]"
                    />
                    <p className="text-[var(--forge-text-secondary)]">
                        No homework assignments available for this chapter.
                    </p>
                </SlotCard.Body>
            </SlotCard>
        );
    }

    return (
        <>
            <SlotCard
                variant={cardVariant}
                className={className}
                data-testid={`homework-slot-${slot.id}`}
            >
                {/* Header */}
                <SlotCard.Header>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <GitBranch
                                    size={ICON_SIZES.sm}
                                    className="text-[var(--ember)] shrink-0"
                                />
                                <span
                                    className={cn(
                                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                                        difficultyColors[featureData.difficulty]
                                    )}
                                >
                                    {featureData.difficulty}
                                </span>
                                {slotData.showEstimate !== false && (
                                    <span className="flex items-center gap-1 text-xs text-[var(--forge-text-muted)]">
                                        <Clock size={12} />
                                        ~{featureData.estimatedHours}h
                                    </span>
                                )}
                                <span className="flex items-center gap-1 text-xs text-[var(--gold)]">
                                    <Zap size={12} />
                                    {featureData.xpReward} XP
                                </span>
                            </div>
                            <h3 className="text-base font-semibold text-[var(--forge-text-primary)] truncate">
                                {featureData.name}
                            </h3>
                            {featureData.description && (
                                <p className="text-sm text-[var(--forge-text-secondary)] mt-1 line-clamp-2">
                                    {featureData.description}
                                </p>
                            )}
                        </div>

                        {/* Repo Link */}
                        {featureData.repoUrl && (
                            <a
                                href={featureData.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--forge-bg-elevated)] text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-anvil)] transition-colors shrink-0"
                                data-testid="homework-repo-link"
                            >
                                <FileCode2 size={14} />
                                {featureData.repoOwner}/{featureData.repoName}
                                <ExternalLink size={12} />
                            </a>
                        )}
                    </div>

                    {/* Completed Badge */}
                    {isCompleted && assignmentData?.score !== undefined && (
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-green-500/20">
                            <div className="flex items-center gap-1.5 text-green-500">
                                <Trophy size={16} />
                                <span className="text-sm font-semibold">
                                    Score: {assignmentData.score}%
                                </span>
                            </div>
                            {assignmentData.xpEarned !== undefined && (
                                <span className="text-xs text-[var(--forge-text-muted)]">
                                    +{assignmentData.xpEarned} XP earned
                                </span>
                            )}
                        </div>
                    )}
                </SlotCard.Header>

                {/* PR Status (for active assignments) */}
                {isActive && selectedAssignment && (
                    <SlotCard.Body bordered>
                        <PRStatusIndicator
                            prStatus={prStatus}
                            branchName={featureData.branchName}
                            repoUrl={featureData.repoUrl}
                            defaultBranch={featureData.defaultBranch}
                            isChecking={isCheckingPR}
                            onRefresh={handleCheckPRStatus}
                            variant="full"
                        />
                    </SlotCard.Body>
                )}

                {/* File Scope (Collapsible) */}
                {slotData.showFileScope !== false &&
                    assignmentData?.fileScope &&
                    assignmentData.fileScope.length > 0 && (
                        <SlotCard.Section>
                            <button
                                onClick={toggleFileScope}
                                className="w-full flex items-center justify-between px-5 py-3 hover:bg-[var(--forge-bg-elevated)] transition-colors"
                                data-testid="homework-file-scope-toggle"
                            >
                                <div className="flex items-center gap-2">
                                    <FolderTree
                                        size={ICON_SIZES.sm}
                                        className="text-[var(--forge-text-muted)]"
                                    />
                                    <span className="text-sm font-medium text-[var(--forge-text-secondary)]">
                                        Files to explore ({assignmentData.fileScope.length})
                                    </span>
                                </div>
                                {expandedFileScope ? (
                                    <ChevronDown
                                        size={ICON_SIZES.sm}
                                        className="text-[var(--forge-text-muted)]"
                                    />
                                ) : (
                                    <ChevronRight
                                        size={ICON_SIZES.sm}
                                        className="text-[var(--forge-text-muted)]"
                                    />
                                )}
                            </button>

                            {expandedFileScope && (
                                <div className="px-5 pb-4 space-y-2">
                                    {assignmentData.fileScope.map(
                                        (file: FileScope, index: number) => (
                                            <div
                                                key={index}
                                                className="flex items-start gap-3 p-2 rounded-lg bg-[var(--forge-bg-anvil)]"
                                                data-testid={`homework-file-scope-item-${index}`}
                                            >
                                                <FileCode2
                                                    size={14}
                                                    className="text-[var(--ember)] mt-0.5 shrink-0"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <code className="text-xs text-[var(--forge-text-primary)] font-mono">
                                                        {file.path}
                                                    </code>
                                                    <p className="text-xs text-[var(--forge-text-muted)] mt-0.5">
                                                        {file.purpose} (~{file.lines_estimate} lines)
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}
                        </SlotCard.Section>
                    )}

                {/* Acceptance Criteria */}
                {slotData.showAcceptanceCriteria !== false &&
                    assignmentData?.acceptanceCriteria &&
                    assignmentData.acceptanceCriteria.length > 0 && (
                        <SlotCard.Body bordered>
                            <h4 className="text-sm font-medium text-[var(--forge-text-secondary)] mb-3">
                                Acceptance Criteria
                            </h4>
                            <div className="space-y-2">
                                {assignmentData.acceptanceCriteria.map(
                                    (test: AcceptanceCriterion, index: number) => (
                                        <button
                                            key={index}
                                            onClick={() => isActive && toggleCriteria(index)}
                                            disabled={!isActive}
                                            className={cn(
                                                "w-full flex items-start gap-3 p-2 rounded-lg transition-colors text-left",
                                                isActive &&
                                                    "hover:bg-[var(--forge-bg-elevated)] cursor-pointer",
                                                !isActive && "cursor-default"
                                            )}
                                            data-testid={`homework-criteria-btn-${index}`}
                                        >
                                            {checkedCriteria.includes(index) || isCompleted ? (
                                                <CheckCircle2
                                                    size={16}
                                                    className="text-green-500 mt-0.5 shrink-0"
                                                />
                                            ) : (
                                                <Circle
                                                    size={16}
                                                    className="text-[var(--forge-text-muted)] mt-0.5 shrink-0"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className={cn(
                                                        "text-sm",
                                                        checkedCriteria.includes(index) || isCompleted
                                                            ? "text-[var(--forge-text-muted)] line-through"
                                                            : "text-[var(--forge-text-primary)]"
                                                    )}
                                                >
                                                    {test.description}
                                                </p>
                                                <p className="text-xs text-[var(--forge-text-muted)] mt-0.5">
                                                    Expected: {test.expected}
                                                </p>
                                            </div>
                                        </button>
                                    )
                                )}
                            </div>
                        </SlotCard.Body>
                    )}

                {/* Hints Section */}
                {slotData.showHints !== false &&
                    isActive &&
                    assignmentData?.hints &&
                    assignmentData.hints.length > 0 && (
                        <SlotCard.Body bordered>
                            <div className="flex items-center gap-2 mb-3">
                                <Lightbulb size={ICON_SIZES.sm} className="text-yellow-500" />
                                <h4 className="text-sm font-medium text-[var(--forge-text-secondary)]">
                                    Progressive Hints
                                </h4>
                                <span className="text-xs text-[var(--forge-text-muted)]">
                                    (using hints reduces XP)
                                </span>
                            </div>
                            <div className="space-y-2">
                                {assignmentData.hints.map(
                                    (hint: ProgressiveHint, index: number) => (
                                        <div
                                            key={index}
                                            className={cn(
                                                "p-3 rounded-lg",
                                                localRevealedHints.includes(hint.level)
                                                    ? "bg-yellow-500/10 border border-yellow-500/30"
                                                    : "bg-[var(--forge-bg-elevated)]"
                                            )}
                                            data-testid={`homework-hint-${index}`}
                                        >
                                            {localRevealedHints.includes(hint.level) ? (
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-medium text-yellow-500">
                                                            Hint Level {hint.level}
                                                        </span>
                                                        <span className="text-xs text-[var(--forge-text-muted)]">
                                                            (-{hint.cost_percent}% XP)
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-[var(--forge-text-primary)]">
                                                        {hint.hint}
                                                    </p>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => handleRevealHint(hint.level)}
                                                    className="w-full flex items-center justify-between"
                                                    data-testid={`homework-reveal-hint-btn-${index}`}
                                                >
                                                    <span className="text-sm text-[var(--forge-text-secondary)]">
                                                        Reveal Hint Level {hint.level}
                                                    </span>
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-600">
                                                        -{hint.cost_percent}% XP
                                                    </span>
                                                </button>
                                            )}
                                        </div>
                                    )
                                )}
                            </div>
                        </SlotCard.Body>
                    )}

                {/* Actions Footer */}
                <SlotCard.Footer>
                    {isPreview && (
                        <div className="space-y-3">
                            {/* Show selection if multiple homeworks */}
                            {homeworkData &&
                            homeworkData.grouped.available.length > 1 ? (
                                <button
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--ember)] text-white font-medium hover:bg-[var(--ember-hover)] transition-colors"
                                    onClick={() => selectHomework(null)}
                                    data-testid="homework-choose-btn"
                                >
                                    <Play size={16} />
                                    Choose Homework ({homeworkData.grouped.available.length}{" "}
                                    available)
                                </button>
                            ) : (
                                <button
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--ember)] text-white font-medium hover:bg-[var(--ember-hover)] transition-colors"
                                    onClick={handleStartAssignment}
                                    disabled={isLoadingAssignment}
                                    data-testid="homework-start-btn"
                                >
                                    {isLoadingAssignment ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Starting...
                                        </>
                                    ) : (
                                        <>
                                            <Play size={16} />
                                            Start Assignment
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}

                    {isActive && assignmentData && (
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 text-sm text-[var(--forge-text-muted)]">
                                    <Clock size={14} />
                                    <span>
                                        Time spent:{" "}
                                        {Math.floor(assignmentData.timeSpentMinutes / 60)}h{" "}
                                        {assignmentData.timeSpentMinutes % 60}m
                                    </span>
                                </div>
                                {assignmentData.acceptanceCriteria.length > 0 && (
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex-1 h-1.5 bg-[var(--forge-bg-anvil)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[var(--ember)] transition-all"
                                                style={{
                                                    width: `${
                                                        (checkedCriteria.length /
                                                            assignmentData.acceptanceCriteria
                                                                .length) *
                                                        100
                                                    }%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs text-[var(--forge-text-muted)]">
                                            {checkedCriteria.length}/
                                            {assignmentData.acceptanceCriteria.length} criteria
                                        </span>
                                    </div>
                                )}
                            </div>
                            <button
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors",
                                    prStatus?.pr_found
                                        ? "bg-green-500 text-white hover:bg-green-600"
                                        : "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-muted)] cursor-not-allowed"
                                )}
                                disabled={!prStatus?.pr_found}
                                onClick={() => {
                                    if (selectedAssignment?.id) {
                                        updateAssignment(selectedAssignment.id, {
                                            status: "submitted",
                                        });
                                    }
                                }}
                                data-testid="homework-submit-btn"
                            >
                                <Send size={16} />
                                {prStatus?.pr_found ? "Submit for Review" : "Create PR First"}
                            </button>
                        </div>
                    )}

                    {isCompleted && (
                        <div className="flex items-center justify-center gap-2 text-green-500">
                            <CheckCircle2 size={18} />
                            <span className="font-medium">Assignment Completed</span>
                        </div>
                    )}
                </SlotCard.Footer>
            </SlotCard>

            {/* Homework Selection Modal */}
            {homeworkData && (
                <HomeworkSelectionModal
                    isOpen={showSelectionModal}
                    homeworks={homeworkData.grouped.available}
                    onSelect={selectHomework}
                    onStartAssignment={startAssignment}
                    onClose={closeSelectionModal}
                />
            )}
        </>
    );
};

/**
 * Custom comparison function for HomeworkSlotRenderer
 */
function areHomeworkPropsEqual(
    prevProps: HomeworkSlotRendererProps,
    nextProps: HomeworkSlotRendererProps
): boolean {
    if (prevProps.slot.id !== nextProps.slot.id) return false;
    if (prevProps.className !== nextProps.className) return false;
    if (prevProps.chapterId !== nextProps.chapterId) return false;

    const prevData = prevProps.slot.data;
    const nextData = nextProps.slot.data;
    return (
        prevData.featureId === nextData.featureId &&
        prevData.assignmentId === nextData.assignmentId &&
        prevData.variant === nextData.variant &&
        prevData.showHints === nextData.showHints &&
        prevData.showAcceptanceCriteria === nextData.showAcceptanceCriteria &&
        prevData.title === nextData.title &&
        prevData.showEstimate === nextData.showEstimate &&
        prevData.showFileScope === nextData.showFileScope
    );
}

export const HomeworkSlotRenderer = memo(
    HomeworkSlotRendererComponent,
    areHomeworkPropsEqual
);

export default HomeworkSlotRenderer;
