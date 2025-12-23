/**
 * Decision Tree Types for Goal Path Chat Interface
 *
 * The chat flow is a decision tree in disguise. This architecture makes the
 * tree structure explicit, enabling:
 * - Dynamic branching based on prior answers
 * - A/B testing different question orderings
 * - Conditional questions (skip deadline if user says "flexible")
 * - Easy expansion with goal-specific follow-up questions
 */

import type { GoalFormState } from "@/app/shared/lib/learnerProfile";

// ============================================================================
// Core Decision Tree Types
// ============================================================================

/** Unique identifier for a decision tree node */
export type DecisionNodeId = string;

/** The field in GoalFormState that a node updates */
export type FormField = keyof GoalFormState;

/** Result of evaluating a condition */
export type ConditionResult = boolean;

/**
 * A condition function that determines whether to show a node/option.
 * Has access to current form state and the full answer history.
 */
export type DecisionCondition = (
    context: DecisionContext
) => ConditionResult;

/**
 * Context passed to condition functions and transformers
 */
export interface DecisionContext {
    /** Current form state being built */
    formState: GoalFormState;
    /** History of selected option labels by node ID */
    answerHistory: Record<DecisionNodeId, string>;
    /** The raw value selected (before transformation) */
    rawValue?: string;
}

/**
 * A function that transforms the user's selected option into a form value.
 * For example, "5-10 hours" -> 7 (number)
 */
export type ValueTransformer<T = unknown> = (
    selectedOption: string,
    context: DecisionContext
) => T;

/**
 * An option that the user can select in response to a question
 */
export interface DecisionOption {
    /** Display label shown to user */
    label: string;
    /** Optional value (defaults to label if not provided) */
    value?: string | number;
    /** Description shown below the option */
    description?: string;
    /** Whether this option is recommended */
    isRecommended?: boolean;
    /** Condition to show this option (default: always show) */
    showWhen?: DecisionCondition;
    /** ID of the next node to go to after selecting this option */
    nextNodeId?: DecisionNodeId;
    /** Custom test ID for this option */
    testId?: string;
}

/**
 * A single node in the decision tree.
 * Represents a question or terminal state.
 */
export interface DecisionNode {
    /** Unique identifier for this node */
    id: DecisionNodeId;
    /** The question text shown as a bot message */
    question: string;
    /** Optional subtext/helper shown under the question */
    subtext?: string;
    /** Which form field this node updates (if any) */
    field?: FormField;
    /** Available options for user selection */
    options?: DecisionOption[];
    /** Allow free text input instead of/in addition to options */
    allowFreeInput?: boolean;
    /** Placeholder for free text input */
    inputPlaceholder?: string;
    /** Condition to show this node (default: always show) */
    showWhen?: DecisionCondition;
    /** Transform selected value before storing in form state */
    transformValue?: ValueTransformer;
    /** Default next node if option doesn't specify one */
    defaultNextNodeId?: DecisionNodeId;
    /** Whether this is a terminal node (end of tree) */
    isTerminal?: boolean;
    /** Custom message template using {answer} placeholder for previous answer */
    acknowledgmentTemplate?: string;
}

/**
 * The complete decision tree definition
 */
export interface DecisionTree {
    /** Human-readable name for this tree */
    name: string;
    /** Description of what this tree is for */
    description?: string;
    /** The starting node ID */
    rootNodeId: DecisionNodeId;
    /** All nodes in the tree, keyed by ID */
    nodes: Record<DecisionNodeId, DecisionNode>;
    /** Initial form state to start with */
    initialFormState: GoalFormState;
    /** Welcome message shown before first question */
    welcomeMessage?: string;
    /** Message shown when tree is complete */
    completionMessage?: string;
}

// ============================================================================
// Tree Traversal Types
// ============================================================================

/**
 * A single step in the conversation history
 */
export interface ConversationStep {
    /** The node that was shown */
    nodeId: DecisionNodeId;
    /** The option selected by the user */
    selectedOption: string;
    /** Timestamp of selection */
    timestamp: number;
}

/**
 * The current state of tree traversal
 */
export interface TreeTraversalState {
    /** The current node we're at */
    currentNodeId: DecisionNodeId;
    /** History of steps taken */
    history: ConversationStep[];
    /** Current form state being built */
    formState: GoalFormState;
    /** Whether the tree is complete */
    isComplete: boolean;
    /** Whether we're showing typing indicator */
    isProcessing: boolean;
}

// ============================================================================
// Chat Rendering Types
// ============================================================================

/**
 * A message in the chat interface
 */
export interface ChatMessage {
    /** Unique ID for this message */
    id: string;
    /** Who sent the message */
    type: "bot" | "user";
    /** The message content */
    content: string;
    /** Options to show (for bot messages) */
    options?: DecisionOption[];
    /** Whether to allow free text input */
    allowFreeInput?: boolean;
    /** Input placeholder */
    inputPlaceholder?: string;
    /** Node ID this message corresponds to */
    nodeId?: DecisionNodeId;
    /** Timestamp */
    timestamp: number;
}

// ============================================================================
// Engine Events
// ============================================================================

/**
 * Events emitted by the decision tree engine
 */
export type DecisionTreeEvent =
    | { type: "NODE_ENTERED"; nodeId: DecisionNodeId; node: DecisionNode }
    | { type: "OPTION_SELECTED"; nodeId: DecisionNodeId; option: string; value: unknown }
    | { type: "TREE_COMPLETED"; formState: GoalFormState }
    | { type: "TREE_RESET" }
    | { type: "BRANCHING_OCCURRED"; fromNodeId: DecisionNodeId; toNodeId: DecisionNodeId; reason: string };

/**
 * Event listener callback
 */
export type DecisionTreeEventListener = (event: DecisionTreeEvent) => void;
