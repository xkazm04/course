/**
 * useChapterHomework - Hook for managing chapter homework state
 *
 * Fetches and manages homework assignments for a chapter:
 * - Loads available homeworks from API
 * - Tracks user's assignment status
 * - Provides actions for starting/submitting assignments
 * - Handles PR status checking
 */

import { useState, useEffect, useCallback, useMemo } from "react";

// ============================================================================
// Types
// ============================================================================

export interface HomeworkDefinition {
    homework_id: string;
    homework_name: string;
    homework_slug: string;
    homework_type: HomeworkType;
    difficulty: Difficulty;
    estimated_hours: number;
    xp_reward: number;
    description: string | null;
    branch_prefix: string;
    relevance_score: number;
    project_id: string | null;
    project_name: string | null;
    project_owner: string | null;
    source_repo_url: string | null;
    default_branch: string | null;
    feature_id: string | null;
    feature_name: string | null;
    // User-specific fields (if authenticated)
    user_assignment_id: string | null;
    user_assignment_status: AssignmentStatus | null;
    user_pr_status: PRStatus | null;
    user_branch_name: string | null;
}

export type HomeworkType =
    | "implementation"
    | "ui_design"
    | "responsive"
    | "performance"
    | "testing"
    | "accessibility"
    | "edge_cases"
    | "documentation";

export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

export type AssignmentStatus =
    | "assigned"
    | "in_progress"
    | "submitted"
    | "reviewing"
    | "completed"
    | "archived";

export type PRStatus =
    | "pending"
    | "submitted"
    | "reviewing"
    | "approved"
    | "changes_requested"
    | "winner"
    | "closed";

export interface HomeworkGroups {
    available: HomeworkDefinition[];
    in_progress: HomeworkDefinition[];
    completed: HomeworkDefinition[];
}

export interface ChapterHomeworkData {
    chapter_id: string;
    homeworks: HomeworkDefinition[];
    grouped: HomeworkGroups;
    total_count: number;
    has_active_homework: boolean;
    requires_pr: boolean;
    can_complete_chapter: boolean;
}

export interface PRStatusResponse {
    pr_found: boolean;
    pr?: {
        number: number;
        url: string;
        title: string;
        state: string;
        draft: boolean;
        merged: boolean;
        created_at: string;
        updated_at: string;
    };
    pr_status?: PRStatus;
    assignment_status?: AssignmentStatus;
    expected_branch?: string;
    repo_url?: string;
    instructions?: string;
    message?: string;
}

export interface AssignmentDetails {
    id: string;
    status: AssignmentStatus;
    pr_status: PRStatus | null;
    pr_url: string | null;
    pr_number: number | null;
    branch_name: string | null;
    hints_used: number;
    hints_revealed: string[];
    hints_available: string[] | null;
    score: number | null;
    score_breakdown: Record<string, number> | null;
    ai_feedback: string | null;
    time_spent_minutes: number | null;
    xp_earned: number | null;
    is_winner: boolean;
    instructions: string | null;
    created_at: string;
    started_at: string | null;
    submitted_at: string | null;
    completed_at: string | null;
    homework_definition: {
        id: string;
        name: string;
        slug: string;
        homework_type: HomeworkType;
        difficulty: Difficulty;
        estimated_hours: number;
        xp_reward: number;
        description: string | null;
        instructions: string | null;
        acceptance_criteria: AcceptanceCriterion[];
        hints: ProgressiveHint[];
        file_scope: FileScope[];
        skills_reinforced: string[];
        feature: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            repo: {
                id: string;
                name: string;
                owner: string;
                source_repo_url: string;
                default_branch: string;
                tech_stack: string[];
            } | null;
        } | null;
    };
}

export interface AcceptanceCriterion {
    description: string;
    validation_type: string;
    expected: string;
}

export interface ProgressiveHint {
    level: number;
    hint: string;
    cost_percent: number;
}

export interface FileScope {
    path: string;
    purpose: string;
    lines_estimate: number;
}

// ============================================================================
// Hook Configuration
// ============================================================================

export interface UseChapterHomeworkConfig {
    chapterId: string;
    enabled?: boolean;
}

export interface UseChapterHomeworkReturn {
    // State
    isLoading: boolean;
    error: string | null;
    data: ChapterHomeworkData | null;

    // Selected assignment
    selectedAssignment: AssignmentDetails | null;
    isLoadingAssignment: boolean;

    // PR Status
    prStatus: PRStatusResponse | null;
    isCheckingPR: boolean;

    // Computed
    hasHomeworks: boolean;
    activeHomework: HomeworkDefinition | null;
    canCompleteChapter: boolean;
    showSelectionModal: boolean;

    // Actions
    refresh: () => Promise<void>;
    startAssignment: (homeworkDefinitionId: string) => Promise<{ success: boolean; assignmentId?: string; error?: string }>;
    updateAssignment: (assignmentId: string, updates: Partial<AssignmentDetails>) => Promise<{ success: boolean; error?: string }>;
    checkPRStatus: (assignmentId: string) => Promise<void>;
    revealHint: (assignmentId: string, hintIndex: number) => Promise<{ success: boolean; error?: string }>;
    selectHomework: (homework: HomeworkDefinition | null) => void;
    closeSelectionModal: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useChapterHomework(config: UseChapterHomeworkConfig): UseChapterHomeworkReturn {
    const { chapterId, enabled = true } = config;

    // Core state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<ChapterHomeworkData | null>(null);

    // Selected assignment state
    const [selectedAssignment, setSelectedAssignment] = useState<AssignmentDetails | null>(null);
    const [isLoadingAssignment, setIsLoadingAssignment] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState<HomeworkDefinition | null>(null);

    // PR status state
    const [prStatus, setPRStatus] = useState<PRStatusResponse | null>(null);
    const [isCheckingPR, setIsCheckingPR] = useState(false);

    // Modal state
    const [showSelectionModal, setShowSelectionModal] = useState(false);

    // ========================================================================
    // Fetch chapter homeworks
    // ========================================================================

    const fetchHomeworks = useCallback(async () => {
        if (!chapterId || !enabled) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/chapters/${chapterId}/homeworks`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const result: ChapterHomeworkData = await response.json();
            setData(result);

            // Auto-select if there's exactly one in-progress homework
            if (result.grouped.in_progress.length === 1) {
                setSelectedHomework(result.grouped.in_progress[0]);
            }
            // Show modal if multiple available and none in progress
            else if (result.grouped.available.length > 1 && result.grouped.in_progress.length === 0) {
                setShowSelectionModal(true);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch homeworks");
        } finally {
            setIsLoading(false);
        }
    }, [chapterId, enabled]);

    // Fetch on mount and when chapterId changes
    useEffect(() => {
        fetchHomeworks();
    }, [fetchHomeworks]);

    // ========================================================================
    // Fetch assignment details when selected
    // ========================================================================

    useEffect(() => {
        const fetchAssignmentDetails = async () => {
            if (!selectedHomework?.user_assignment_id) {
                setSelectedAssignment(null);
                return;
            }

            setIsLoadingAssignment(true);

            try {
                const response = await fetch(`/api/projects/homework/${selectedHomework.user_assignment_id}`);

                if (response.ok) {
                    const { assignment } = await response.json();
                    setSelectedAssignment(assignment);
                }
            } catch (err) {
                console.error("Failed to fetch assignment details:", err);
            } finally {
                setIsLoadingAssignment(false);
            }
        };

        fetchAssignmentDetails();
    }, [selectedHomework?.user_assignment_id]);

    // ========================================================================
    // Actions
    // ========================================================================

    const startAssignment = useCallback(async (homeworkDefinitionId: string): Promise<{ success: boolean; assignmentId?: string; error?: string }> => {
        try {
            const response = await fetch("/api/projects/homework", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    homework_definition_id: homeworkDefinitionId,
                    chapter_id: chapterId,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                return { success: false, error: result.error || "Failed to start assignment" };
            }

            // Refresh homeworks list
            await fetchHomeworks();

            return { success: true, assignmentId: result.assignment?.id };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
        }
    }, [chapterId, fetchHomeworks]);

    const updateAssignment = useCallback(async (assignmentId: string, updates: Partial<AssignmentDetails>): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`/api/projects/homework/${assignmentId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
            });

            const result = await response.json();

            if (!response.ok) {
                return { success: false, error: result.error || "Failed to update assignment" };
            }

            // Update local state
            if (selectedAssignment?.id === assignmentId) {
                setSelectedAssignment(prev => prev ? { ...prev, ...result.assignment } : null);
            }

            // Refresh homeworks list
            await fetchHomeworks();

            return { success: true };
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
        }
    }, [selectedAssignment?.id, fetchHomeworks]);

    const checkPRStatus = useCallback(async (assignmentId: string): Promise<void> => {
        setIsCheckingPR(true);

        try {
            const response = await fetch(`/api/projects/homework/${assignmentId}/pr-status`, {
                method: "POST",
            });

            if (response.ok) {
                const result: PRStatusResponse = await response.json();
                setPRStatus(result);

                // Refresh data if PR was found
                if (result.pr_found) {
                    await fetchHomeworks();
                }
            }
        } catch (err) {
            console.error("Failed to check PR status:", err);
        } finally {
            setIsCheckingPR(false);
        }
    }, [fetchHomeworks]);

    const revealHint = useCallback(async (assignmentId: string, hintIndex: number): Promise<{ success: boolean; error?: string }> => {
        if (!selectedAssignment) {
            return { success: false, error: "No assignment selected" };
        }

        const currentRevealed = selectedAssignment.hints_revealed || [];
        const newRevealed = [...currentRevealed, String(hintIndex)];

        return updateAssignment(assignmentId, {
            hints_revealed: newRevealed,
            hints_used: newRevealed.length,
        });
    }, [selectedAssignment, updateAssignment]);

    const selectHomework = useCallback((homework: HomeworkDefinition | null) => {
        setSelectedHomework(homework);
        setShowSelectionModal(false);
    }, []);

    const closeSelectionModal = useCallback(() => {
        setShowSelectionModal(false);
    }, []);

    // ========================================================================
    // Computed values
    // ========================================================================

    const hasHomeworks = useMemo(() => {
        return (data?.total_count ?? 0) > 0;
    }, [data?.total_count]);

    const activeHomework = useMemo(() => {
        // Return currently selected homework, or first in-progress one
        if (selectedHomework) return selectedHomework;
        return data?.grouped.in_progress[0] ?? null;
    }, [selectedHomework, data?.grouped.in_progress]);

    const canCompleteChapter = useMemo(() => {
        return data?.can_complete_chapter ?? true;
    }, [data?.can_complete_chapter]);

    // ========================================================================
    // Return
    // ========================================================================

    return {
        // State
        isLoading,
        error,
        data,

        // Selected assignment
        selectedAssignment,
        isLoadingAssignment,

        // PR Status
        prStatus,
        isCheckingPR,

        // Computed
        hasHomeworks,
        activeHomework,
        canCompleteChapter,
        showSelectionModal,

        // Actions
        refresh: fetchHomeworks,
        startAssignment,
        updateAssignment,
        checkPRStatus,
        revealHint,
        selectHomework,
        closeSelectionModal,
    };
}

export default useChapterHomework;
