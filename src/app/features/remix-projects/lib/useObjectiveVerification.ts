"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Assignment, ModifiedFile, ObjectiveResult } from "./types";
import { generateDiff, analyzeObjectives } from "./diffAnalyzer";

export type VerificationState = "not_started" | "partial" | "confident";

export interface ObjectiveVerificationStatus {
    objectiveId: string;
    state: VerificationState;
    confidence: number;
    evidence: string;
    previousState: VerificationState | null;
    stateChangedAt: number | null;
}

interface UseObjectiveVerificationOptions {
    assignment: Assignment | null;
    files: ModifiedFile[];
    debounceMs?: number;
}

interface UseObjectiveVerificationReturn {
    verificationStatuses: ObjectiveVerificationStatus[];
    isAnalyzing: boolean;
    getStatusForObjective: (objectiveId: string) => ObjectiveVerificationStatus | undefined;
}

// Convert confidence score to verification state
function confidenceToState(confidence: number): VerificationState {
    if (confidence >= 0.7) return "confident";
    if (confidence >= 0.3) return "partial";
    return "not_started";
}

export function useObjectiveVerification(
    options: UseObjectiveVerificationOptions
): UseObjectiveVerificationReturn {
    const { assignment, files, debounceMs = 300 } = options;

    const [verificationStatuses, setVerificationStatuses] = useState<ObjectiveVerificationStatus[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const previousStatesRef = useRef<Map<string, VerificationState>>(new Map());
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Analyze objectives when files change
    const analyzeFiles = useCallback(() => {
        if (!assignment || files.length === 0) {
            setVerificationStatuses([]);
            return;
        }

        setIsAnalyzing(true);

        // Generate diff from current files
        const diff = generateDiff(files);

        // Analyze objectives
        const results = analyzeObjectives(assignment, diff, files);

        // Convert results to verification statuses with state tracking
        const newStatuses: ObjectiveVerificationStatus[] = results.map((result) => {
            const newState = confidenceToState(result.confidence);
            const previousState = previousStatesRef.current.get(result.objectiveId) || null;
            const stateChanged = previousState !== null && previousState !== newState;

            // Update previous state tracking
            previousStatesRef.current.set(result.objectiveId, newState);

            return {
                objectiveId: result.objectiveId,
                state: newState,
                confidence: result.confidence,
                evidence: result.evidence,
                previousState: stateChanged ? previousState : null,
                stateChangedAt: stateChanged ? Date.now() : null,
            };
        });

        setVerificationStatuses(newStatuses);
        setIsAnalyzing(false);
    }, [assignment, files]);

    // Debounced analysis on file changes
    useEffect(() => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        debounceTimerRef.current = setTimeout(() => {
            analyzeFiles();
        }, debounceMs);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [analyzeFiles, debounceMs]);

    // Initialize statuses when assignment loads
    useEffect(() => {
        if (assignment && assignment.objectives.length > 0) {
            const initialStatuses: ObjectiveVerificationStatus[] = assignment.objectives.map((obj) => ({
                objectiveId: obj.id,
                state: "not_started" as VerificationState,
                confidence: 0,
                evidence: "",
                previousState: null,
                stateChangedAt: null,
            }));
            setVerificationStatuses(initialStatuses);
            previousStatesRef.current = new Map();
        }
    }, [assignment?.id]);

    // Get status for a specific objective
    const getStatusForObjective = useCallback(
        (objectiveId: string): ObjectiveVerificationStatus | undefined => {
            return verificationStatuses.find((s) => s.objectiveId === objectiveId);
        },
        [verificationStatuses]
    );

    return {
        verificationStatuses,
        isAnalyzing,
        getStatusForObjective,
    };
}
