/**
 * useOracle Hook
 * React hook for managing Oracle session state and API calls
 */

import { useState, useCallback } from "react";
import {
    oracleApi,
    OracleQuestion,
    OraclePath,
    StartSessionResponse,
    AnswerResponse,
} from "./oracleApi";

export type OraclePhase = "idle" | "static" | "llm" | "generating" | "paths" | "complete" | "error";

export interface OracleHookState {
    sessionId: string | null;
    phase: OraclePhase;
    questionIndex: number;
    currentQuestion: OracleQuestion | null;
    totalStaticQuestions: number;
    paths: OraclePath[];
    selectedPath: OraclePath | null;
    isLoading: boolean;
    error: string | null;
    // Track answers for display
    answers: Record<string, string>;
}

export interface OracleHookActions {
    start: (userId?: string) => Promise<void>;
    answer: (answer: string) => Promise<void>;
    selectPath: (pathId: string) => Promise<void>;
    reset: () => void;
}

const initialState: OracleHookState = {
    sessionId: null,
    phase: "idle",
    questionIndex: 0,
    currentQuestion: null,
    totalStaticQuestions: 3,
    paths: [],
    selectedPath: null,
    isLoading: false,
    error: null,
    answers: {},
};

export function useOracle(): [OracleHookState, OracleHookActions] {
    const [state, setState] = useState<OracleHookState>(initialState);

    /**
     * Start a new Oracle session
     */
    const start = useCallback(async (userId?: string) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response: StartSessionResponse = await oracleApi.startSession(userId);

            setState(prev => ({
                ...prev,
                sessionId: response.session_id,
                phase: "static",
                questionIndex: response.question_index,
                currentQuestion: response.question,
                totalStaticQuestions: response.total_static_questions,
                isLoading: false,
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                phase: "error",
                error: error instanceof Error ? error.message : "Failed to start session",
                isLoading: false,
            }));
        }
    }, []);

    /**
     * Submit an answer
     */
    const answer = useCallback(async (answerValue: string) => {
        if (!state.sessionId) {
            setState(prev => ({ ...prev, error: "No active session" }));
            return;
        }

        // Store the answer
        const questionId = state.currentQuestion?.id || `q${state.questionIndex}`;
        setState(prev => ({
            ...prev,
            isLoading: true,
            error: null,
            answers: { ...prev.answers, [questionId]: answerValue },
        }));

        // Show generating state when transitioning from static to LLM
        if (state.questionIndex === state.totalStaticQuestions - 1) {
            setState(prev => ({ ...prev, phase: "generating" }));
        }

        try {
            const response: AnswerResponse = await oracleApi.submitAnswer(
                state.sessionId,
                answerValue,
                state.questionIndex
            );

            if (response.phase === "complete") {
                // Add colors to paths for display
                const pathsWithColors = (response.paths || []).map((path, i) => ({
                    ...path,
                    color: ["#6366f1", "#8b5cf6", "#ec4899"][i % 3],
                }));

                setState(prev => ({
                    ...prev,
                    phase: "paths",
                    paths: pathsWithColors,
                    currentQuestion: null,
                    isLoading: false,
                }));
            } else {
                setState(prev => ({
                    ...prev,
                    phase: response.phase,
                    questionIndex: response.question_index,
                    currentQuestion: response.question || null,
                    isLoading: false,
                }));
            }
        } catch (error) {
            setState(prev => ({
                ...prev,
                phase: "error",
                error: error instanceof Error ? error.message : "Failed to submit answer",
                isLoading: false,
            }));
        }
    }, [state.sessionId, state.questionIndex, state.totalStaticQuestions, state.currentQuestion?.id]);

    /**
     * Select a generated path
     */
    const selectPath = useCallback(async (pathId: string) => {
        if (!state.sessionId) {
            setState(prev => ({ ...prev, error: "No active session" }));
            return;
        }

        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await oracleApi.selectPath(state.sessionId, pathId);

            setState(prev => ({
                ...prev,
                phase: "complete",
                selectedPath: response.path,
                isLoading: false,
            }));
        } catch (error) {
            setState(prev => ({
                ...prev,
                error: error instanceof Error ? error.message : "Failed to select path",
                isLoading: false,
            }));
        }
    }, [state.sessionId]);

    /**
     * Reset to initial state
     */
    const reset = useCallback(() => {
        setState(initialState);
    }, []);

    return [
        state,
        { start, answer, selectPath, reset },
    ];
}
