/**
 * React Hook for Decision Tree
 *
 * Provides a React-friendly interface to the DecisionTreeEngine,
 * with state management and automatic message generation.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import {
    DecisionTreeEngine,
    createDecisionTreeEngine,
} from "./DecisionTreeEngine";
import type {
    DecisionTree,
    ChatMessage,
    TreeTraversalState,
    DecisionTreeEvent,
} from "./decisionTreeTypes";
import type { GoalFormState } from "@/app/shared/lib/learnerProfile";

// ============================================================================
// Hook Types
// ============================================================================

export interface UseDecisionTreeOptions {
    /** The decision tree to use */
    tree: DecisionTree;
    /** Callback when tree is completed */
    onComplete?: (formState: GoalFormState) => void;
    /** Callback for tree events (for analytics) */
    onEvent?: (event: DecisionTreeEvent) => void;
    /** Simulated typing delay in ms (0 to disable) */
    typingDelay?: number;
}

export interface UseDecisionTreeReturn {
    /** Chat messages to render */
    messages: ChatMessage[];
    /** Current traversal state */
    state: TreeTraversalState;
    /** Current form state being built */
    formState: GoalFormState;
    /** Whether the tree is complete */
    isComplete: boolean;
    /** Whether bot is "typing" (simulated delay) */
    isTyping: boolean;
    /** Select an option */
    selectOption: (option: string) => void;
    /** Submit free text input */
    submitInput: (text: string) => void;
    /** Go back one step */
    goBack: () => void;
    /** Reset the tree */
    reset: () => void;
    /** Current node ID */
    currentNodeId: string;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useDecisionTree({
    tree,
    onComplete,
    onEvent,
    typingDelay = 1200,
}: UseDecisionTreeOptions): UseDecisionTreeReturn {
    // Create engine instance (stable across renders)
    const engineRef = useRef<DecisionTreeEngine | null>(null);
    if (!engineRef.current) {
        engineRef.current = createDecisionTreeEngine(tree);
    }
    const engine = engineRef.current;

    // State
    const [state, setState] = useState<TreeTraversalState>(() => engine.getState());
    const [messages, setMessages] = useState<ChatMessage[]>(() => engine.toChatMessages());
    const [isTyping, setIsTyping] = useState(false);

    // Subscribe to engine events
    useEffect(() => {
        const unsubscribe = engine.subscribe((event) => {
            // Forward event to callback
            onEvent?.(event);

            // Handle completion
            if (event.type === "TREE_COMPLETED") {
                onComplete?.(event.formState);
            }
        });

        return unsubscribe;
    }, [engine, onComplete, onEvent]);

    // Sync state after engine updates
    const syncState = useCallback(() => {
        setState(engine.getState());
        setMessages(engine.toChatMessages());
    }, [engine]);

    /**
     * Select an option (with simulated typing delay)
     */
    const selectOption = useCallback(
        (option: string) => {
            if (state.isComplete) return;

            // Immediately add user message
            const userMessage: ChatMessage = {
                id: `user-${Date.now()}`,
                type: "user",
                content: option,
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, userMessage]);

            // Show typing indicator
            setIsTyping(true);

            // Process after delay
            const delay = typingDelay > 0 ? typingDelay : 0;
            setTimeout(() => {
                engine.selectOption(option);
                setIsTyping(false);
                syncState();
            }, delay);
        },
        [engine, state.isComplete, typingDelay, syncState]
    );

    /**
     * Submit free text input
     */
    const submitInput = useCallback(
        (text: string) => {
            if (!text.trim()) return;
            selectOption(text.trim());
        },
        [selectOption]
    );

    /**
     * Go back one step
     */
    const goBack = useCallback(() => {
        const success = engine.goBack();
        if (success) {
            syncState();
        }
    }, [engine, syncState]);

    /**
     * Reset the tree
     */
    const reset = useCallback(() => {
        engine.reset();
        syncState();
    }, [engine, syncState]);

    return {
        messages,
        state,
        formState: state.formState,
        isComplete: state.isComplete,
        isTyping,
        selectOption,
        submitInput,
        goBack,
        reset,
        currentNodeId: state.currentNodeId,
    };
}
