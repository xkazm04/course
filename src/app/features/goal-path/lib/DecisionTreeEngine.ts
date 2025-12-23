/**
 * Decision Tree Engine
 *
 * Manages traversal through a decision tree, handling:
 * - State management (current node, form state, history)
 * - Condition evaluation for dynamic branching
 * - Value transformation before storing
 * - Event emission for analytics/debugging
 */

import type {
    DecisionTree,
    DecisionNode,
    DecisionOption,
    DecisionNodeId,
    DecisionContext,
    TreeTraversalState,
    ConversationStep,
    ChatMessage,
    DecisionTreeEvent,
    DecisionTreeEventListener,
} from "./decisionTreeTypes";
import type { GoalFormState } from "@/app/shared/lib/learnerProfile";

// ============================================================================
// Engine Class
// ============================================================================

export class DecisionTreeEngine {
    private tree: DecisionTree;
    private state: TreeTraversalState;
    private listeners: Set<DecisionTreeEventListener> = new Set();
    private messageIdCounter = 0;

    constructor(tree: DecisionTree) {
        this.tree = tree;
        this.state = this.createInitialState();
    }

    // =========================================================================
    // State Management
    // =========================================================================

    private createInitialState(): TreeTraversalState {
        return {
            currentNodeId: this.tree.rootNodeId,
            history: [],
            formState: { ...this.tree.initialFormState },
            isComplete: false,
            isProcessing: false,
        };
    }

    /**
     * Get the current traversal state
     */
    getState(): TreeTraversalState {
        return { ...this.state };
    }

    /**
     * Get the current form state being built
     */
    getFormState(): GoalFormState {
        return { ...this.state.formState };
    }

    /**
     * Get the current node
     */
    getCurrentNode(): DecisionNode | null {
        return this.tree.nodes[this.state.currentNodeId] ?? null;
    }

    /**
     * Check if the tree traversal is complete
     */
    isComplete(): boolean {
        return this.state.isComplete;
    }

    // =========================================================================
    // Context Creation
    // =========================================================================

    private createContext(rawValue?: string): DecisionContext {
        const answerHistory: Record<DecisionNodeId, string> = {};
        for (const step of this.state.history) {
            answerHistory[step.nodeId] = step.selectedOption;
        }

        return {
            formState: this.state.formState,
            answerHistory,
            rawValue,
        };
    }

    // =========================================================================
    // Option Filtering
    // =========================================================================

    /**
     * Get the visible options for the current node, filtered by conditions
     */
    getVisibleOptions(): DecisionOption[] {
        const node = this.getCurrentNode();
        if (!node?.options) return [];

        const context = this.createContext();
        return node.options.filter((option) => {
            if (!option.showWhen) return true;
            return option.showWhen(context);
        });
    }

    // =========================================================================
    // Navigation
    // =========================================================================

    /**
     * Select an option and advance to the next node
     */
    selectOption(selectedLabel: string): void {
        if (this.state.isComplete) return;

        const node = this.getCurrentNode();
        if (!node) return;

        this.state.isProcessing = true;

        // Find the selected option
        const option = node.options?.find((o) => o.label === selectedLabel);
        const context = this.createContext(selectedLabel);

        // Transform the value if needed
        let value: unknown = option?.value ?? selectedLabel;
        if (node.transformValue) {
            value = node.transformValue(selectedLabel, context);
        }

        // Update form state if this node maps to a field
        if (node.field) {
            this.state.formState = {
                ...this.state.formState,
                [node.field]: value,
            };
        }

        // Record this step in history
        const step: ConversationStep = {
            nodeId: node.id,
            selectedOption: selectedLabel,
            timestamp: Date.now(),
        };
        this.state.history = [...this.state.history, step];

        // Emit selection event
        this.emit({
            type: "OPTION_SELECTED",
            nodeId: node.id,
            option: selectedLabel,
            value,
        });

        // Determine next node
        const nextNodeId = option?.nextNodeId ?? node.defaultNextNodeId;

        if (!nextNodeId || node.isTerminal) {
            // Tree is complete
            this.state.isComplete = true;
            this.state.isProcessing = false;
            this.emit({
                type: "TREE_COMPLETED",
                formState: this.state.formState,
            });
            return;
        }

        // Move to next node, skipping any that fail their conditions
        this.navigateToNode(nextNodeId);
        this.state.isProcessing = false;
    }

    /**
     * Navigate to a specific node, skipping if conditions aren't met
     */
    private navigateToNode(nodeId: DecisionNodeId): void {
        const node = this.tree.nodes[nodeId];
        if (!node) {
            // Node doesn't exist, mark as complete
            this.state.isComplete = true;
            return;
        }

        // Check if this node should be shown
        if (node.showWhen) {
            const context = this.createContext();
            if (!node.showWhen(context)) {
                // Skip this node, go to default next
                if (node.defaultNextNodeId) {
                    this.emit({
                        type: "BRANCHING_OCCURRED",
                        fromNodeId: this.state.currentNodeId,
                        toNodeId: node.defaultNextNodeId,
                        reason: `Skipped node ${nodeId} due to condition`,
                    });
                    this.navigateToNode(node.defaultNextNodeId);
                    return;
                }
                // No next node, we're done
                this.state.isComplete = true;
                return;
            }
        }

        // Update current node
        const previousNodeId = this.state.currentNodeId;
        this.state.currentNodeId = nodeId;

        if (previousNodeId !== nodeId) {
            this.emit({
                type: "BRANCHING_OCCURRED",
                fromNodeId: previousNodeId,
                toNodeId: nodeId,
                reason: "Normal progression",
            });
        }

        this.emit({
            type: "NODE_ENTERED",
            nodeId,
            node,
        });
    }

    /**
     * Go back one step in the tree
     */
    goBack(): boolean {
        if (this.state.history.length === 0) return false;

        // Remove the last step
        const history = [...this.state.history];
        const lastStep = history.pop()!;

        // Rebuild form state from remaining history
        let formState = { ...this.tree.initialFormState };
        for (const step of history) {
            const node = this.tree.nodes[step.nodeId];
            if (node?.field) {
                const context: DecisionContext = {
                    formState,
                    answerHistory: {},
                    rawValue: step.selectedOption,
                };
                let value: unknown = step.selectedOption;
                if (node.transformValue) {
                    value = node.transformValue(step.selectedOption, context);
                }
                formState = { ...formState, [node.field]: value };
            }
        }

        // Find the last step's node to return to
        const returnToNodeId = lastStep.nodeId;

        this.state = {
            ...this.state,
            currentNodeId: returnToNodeId,
            history,
            formState,
            isComplete: false,
        };

        return true;
    }

    /**
     * Reset the tree to the beginning
     */
    reset(): void {
        this.state = this.createInitialState();
        this.emit({ type: "TREE_RESET" });
    }

    // =========================================================================
    // Message Generation
    // =========================================================================

    /**
     * Generate a unique message ID
     */
    private generateMessageId(): string {
        return `msg-${++this.messageIdCounter}-${Date.now()}`;
    }

    /**
     * Convert the current state to chat messages for rendering
     */
    toChatMessages(): ChatMessage[] {
        const messages: ChatMessage[] = [];

        // Add welcome message if present
        if (this.tree.welcomeMessage) {
            messages.push({
                id: this.generateMessageId(),
                type: "bot",
                content: this.tree.welcomeMessage,
                timestamp: Date.now() - (this.state.history.length + 1) * 1000,
            });
        }

        // Add messages for each step in history
        for (let i = 0; i < this.state.history.length; i++) {
            const step = this.state.history[i];
            const node = this.tree.nodes[step.nodeId];

            // Bot question
            let questionContent = node.question;
            // If there's an acknowledgment template from previous answer, prepend it
            if (i > 0 && node.acknowledgmentTemplate) {
                const prevAnswer = this.state.history[i - 1].selectedOption;
                questionContent =
                    node.acknowledgmentTemplate.replace("{answer}", prevAnswer) +
                    " " +
                    node.question;
            }

            messages.push({
                id: this.generateMessageId(),
                type: "bot",
                content: questionContent,
                nodeId: step.nodeId,
                timestamp: step.timestamp - 1000,
            });

            // User response
            messages.push({
                id: this.generateMessageId(),
                type: "user",
                content: step.selectedOption,
                nodeId: step.nodeId,
                timestamp: step.timestamp,
            });
        }

        // Add current node's question if not complete
        if (!this.state.isComplete) {
            const currentNode = this.getCurrentNode();
            if (currentNode) {
                let questionContent = currentNode.question;
                // Add acknowledgment for previous answer if applicable
                if (this.state.history.length > 0 && currentNode.acknowledgmentTemplate) {
                    const lastAnswer =
                        this.state.history[this.state.history.length - 1].selectedOption;
                    questionContent =
                        currentNode.acknowledgmentTemplate.replace("{answer}", lastAnswer) +
                        " " +
                        currentNode.question;
                }

                messages.push({
                    id: this.generateMessageId(),
                    type: "bot",
                    content: questionContent,
                    options: this.getVisibleOptions(),
                    allowFreeInput: currentNode.allowFreeInput,
                    inputPlaceholder: currentNode.inputPlaceholder,
                    nodeId: currentNode.id,
                    timestamp: Date.now(),
                });
            }
        } else {
            // Add completion message
            if (this.tree.completionMessage) {
                messages.push({
                    id: this.generateMessageId(),
                    type: "bot",
                    content: this.tree.completionMessage,
                    timestamp: Date.now(),
                });
            }
        }

        return messages;
    }

    // =========================================================================
    // Event System
    // =========================================================================

    /**
     * Subscribe to tree events
     */
    subscribe(listener: DecisionTreeEventListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Emit an event to all listeners
     */
    private emit(event: DecisionTreeEvent): void {
        for (const listener of this.listeners) {
            listener(event);
        }
    }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new decision tree engine instance
 */
export function createDecisionTreeEngine(tree: DecisionTree): DecisionTreeEngine {
    return new DecisionTreeEngine(tree);
}
