"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Assignment,
    UserFork,
    ModifiedFile,
    Submission,
    ProjectDiff,
    SubmissionAnalysis,
} from "./types";
import {
    claimAssignment,
    createFork,
    updateForkFile,
    getForkForAssignment,
    revealHint,
    markObjectiveCompleted,
    submitAssignment,
    getUserAssignments,
    getAssignment,
    getAssignmentProgress,
} from "./projectStorage";
import { getAssignmentById } from "./seedProjectTemplates";
import { getSeedProjectById } from "./seedProjectTemplates";
import { generateDiff, analyzeSubmission, calculateSubmissionScore } from "./diffAnalyzer";
import { runQualityGates, getImprovementSuggestions } from "./qualityGates";

interface UseAssignmentOptions {
    assignmentId?: string;
}

interface UseAssignmentReturn {
    assignment: Assignment | null;
    fork: UserFork | null;
    userAssignments: Assignment[];
    isLoading: boolean;
    isSaving: boolean;
    isSubmitting: boolean;
    lastSaved: string | null;
    // Actions
    claim: (templateAssignment: Assignment) => Assignment;
    updateFile: (filePath: string, content: string) => void;
    revealNextHint: () => void;
    completeObjective: (objectiveId: string) => void;
    submit: () => Promise<Submission | null>;
    // Computed
    modifiedFiles: ModifiedFile[];
    hintsAvailable: number;
    hintsRevealed: number;
    objectivesCompleted: number;
    totalObjectives: number;
    canSubmit: boolean;
}

export function useAssignment(options: UseAssignmentOptions = {}): UseAssignmentReturn {
    const { assignmentId } = options;

    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [fork, setFork] = useState<UserFork | null>(null);
    const [userAssignments, setUserAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    // Load assignment and fork
    useEffect(() => {
        setIsLoading(true);
        try {
            // Load user's assignments
            const assignments = getUserAssignments();
            setUserAssignments(assignments);

            // Load specific assignment if ID provided
            if (assignmentId) {
                const found = getAssignment(assignmentId);
                if (found) {
                    setAssignment(found);
                    const existingFork = getForkForAssignment(assignmentId);
                    setFork(existingFork);
                }
            }
        } finally {
            setIsLoading(false);
        }
    }, [assignmentId]);

    // Claim an assignment
    const claim = useCallback((templateAssignment: Assignment): Assignment => {
        const claimed = claimAssignment(templateAssignment);
        setAssignment(claimed);
        setUserAssignments((prev) => [claimed, ...prev]);

        // Create initial fork with project files
        const project = getSeedProjectById(claimed.seedProjectId);
        if (project) {
            const modifiedFiles: ModifiedFile[] = project.repository.files.map((file) => ({
                path: file.path,
                originalContent: file.content,
                currentContent: file.content,
                changeCount: 0,
            }));
            const newFork = createFork(claimed.id, modifiedFiles);
            setFork(newFork);
        }

        return claimed;
    }, []);

    // Update a file in the fork
    const updateFile = useCallback((filePath: string, content: string) => {
        if (!fork) return;

        setIsSaving(true);
        updateForkFile(fork.id, filePath, content);

        // Update local state
        setFork((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                lastModified: new Date().toISOString(),
                files: prev.files.map((f) =>
                    f.path === filePath
                        ? { ...f, currentContent: content, changeCount: f.changeCount + 1 }
                        : f
                ),
            };
        });

        setLastSaved(new Date().toISOString());
        setIsSaving(false);
    }, [fork]);

    // Reveal next hint
    const revealNextHint = useCallback(() => {
        if (!assignment) return;

        const nextHint = assignment.hints
            .filter((h) => !h.revealed)
            .sort((a, b) => a.revealOrder - b.revealOrder)[0];

        if (nextHint) {
            revealHint(assignment.id, nextHint.id);
            setAssignment((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    hints: prev.hints.map((h) =>
                        h.id === nextHint.id ? { ...h, revealed: true } : h
                    ),
                };
            });
        }
    }, [assignment]);

    // Complete an objective
    const completeObjective = useCallback((objectiveId: string) => {
        if (!assignment) return;

        markObjectiveCompleted(assignment.id, objectiveId);
        setAssignment((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                objectives: prev.objectives.map((o) =>
                    o.id === objectiveId ? { ...o, completed: true } : o
                ),
            };
        });
    }, [assignment]);

    // Submit assignment
    const submit = useCallback(async (): Promise<Submission | null> => {
        if (!assignment || !fork) return null;

        setIsSubmitting(true);
        try {
            // Generate diff
            const diff = generateDiff(fork.files);

            // Analyze submission
            const analysis = analyzeSubmission(assignment, diff, fork.files);

            // Calculate scores
            const hintsUsed = assignment.hints.filter((h) => h.revealed).length;
            const hintPenalties = assignment.hints.map((h) => h.penaltyPercent);
            const { overall, breakdown } = calculateSubmissionScore(analysis, hintsUsed, hintPenalties);

            // Create submission
            const submission = submitAssignment(assignment.id, {
                assignmentId: assignment.id,
                forkId: fork.id,
                submittedAt: new Date().toISOString(),
                diff,
                analysis,
                scores: {
                    overall,
                    objectivesScore: breakdown.objectives,
                    qualityScore: breakdown.quality,
                    scopeScore: breakdown.scope,
                    bonusPoints: 0,
                    penalties: breakdown.penalties,
                },
            });

            // Update assignment state
            setAssignment((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    status: "submitted",
                    submittedAt: new Date().toISOString(),
                    submission,
                };
            });

            return submission;
        } finally {
            setIsSubmitting(false);
        }
    }, [assignment, fork]);

    // Computed values
    const modifiedFiles = useMemo(() => {
        if (!fork) return [];
        return fork.files.filter((f) => f.originalContent !== f.currentContent);
    }, [fork]);

    const hintsAvailable = useMemo(() => {
        if (!assignment) return 0;
        return assignment.hints.filter((h) => !h.revealed).length;
    }, [assignment]);

    const hintsRevealed = useMemo(() => {
        if (!assignment) return 0;
        return assignment.hints.filter((h) => h.revealed).length;
    }, [assignment]);

    const objectivesCompleted = useMemo(() => {
        if (!assignment) return 0;
        return assignment.objectives.filter((o) => o.completed).length;
    }, [assignment]);

    const totalObjectives = useMemo(() => {
        if (!assignment) return 0;
        return assignment.objectives.length;
    }, [assignment]);

    const canSubmit = useMemo(() => {
        if (!assignment || !fork) return false;
        if (assignment.status === "submitted") return false;
        return modifiedFiles.length > 0;
    }, [assignment, fork, modifiedFiles]);

    return {
        assignment,
        fork,
        userAssignments,
        isLoading,
        isSaving,
        isSubmitting,
        lastSaved,
        claim,
        updateFile,
        revealNextHint,
        completeObjective,
        submit,
        modifiedFiles,
        hintsAvailable,
        hintsRevealed,
        objectivesCompleted,
        totalObjectives,
        canSubmit,
    };
}
