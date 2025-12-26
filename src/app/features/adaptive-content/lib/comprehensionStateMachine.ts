/**
 * Comprehension State Machine
 *
 * Models comprehension as explicit state transitions rather than a simple score.
 * States: confusion → struggling → progressing → breakthrough → mastery
 *
 * Each state has entry/exit conditions and tracks the path a learner takes,
 * making the system explainable, predictable, and gamifiable.
 */

import type { BehaviorSignal, ComprehensionLevel } from "./types";

// ============================================================================
// State Types
// ============================================================================

/**
 * Comprehension states that model the learning journey
 */
export type ComprehensionState =
    | "confusion" // Lost, needs fundamental help
    | "struggling" // Making effort but hitting walls
    | "progressing" // Moving forward steadily
    | "breakthrough" // Just had an "aha" moment
    | "mastery"; // Deep understanding achieved

/**
 * Possible transitions between states
 */
export type StateTransition =
    | "confusion_to_struggling"
    | "struggling_to_confusion"
    | "struggling_to_progressing"
    | "progressing_to_struggling"
    | "progressing_to_breakthrough"
    | "breakthrough_to_progressing"
    | "breakthrough_to_mastery"
    | "mastery_to_progressing"
    | "stuck_in_state"; // Anti-pattern: stayed too long in same state

/**
 * Entry condition for a state
 */
export interface StateEntryCondition {
    /** Human-readable description */
    description: string;
    /** Function to check if condition is met */
    check: (metrics: TransitionMetrics) => boolean;
}

/**
 * Exit condition for a state
 */
export interface StateExitCondition {
    /** Target state when condition is met */
    targetState: ComprehensionState;
    /** Human-readable description */
    description: string;
    /** Function to check if condition is met */
    check: (metrics: TransitionMetrics) => boolean;
    /** Priority (higher = checked first) */
    priority: number;
}

/**
 * State definition with all conditions
 */
export interface StateDefinition {
    state: ComprehensionState;
    /** Maps to legacy ComprehensionLevel for backwards compatibility */
    legacyLevel: ComprehensionLevel;
    /** Display label */
    label: string;
    /** User-friendly description */
    description: string;
    /** Emoji icon */
    icon: string;
    /** Color scheme */
    color: {
        text: string;
        bg: string;
        border: string;
        gradient: string;
    };
    /** Conditions to enter this state */
    entryConditions: StateEntryCondition[];
    /** Conditions to exit this state */
    exitConditions: StateExitCondition[];
}

/**
 * Metrics used to evaluate state transitions
 */
export interface TransitionMetrics {
    /** Recent score (last N signals) */
    recentScore: number;
    /** Older score (previous N signals) */
    olderScore: number;
    /** Score change rate */
    scoreDelta: number;
    /** Number of signals in current state */
    signalsInState: number;
    /** Time spent in current state (ms) */
    timeInState: number;
    /** Consecutive successful signals */
    consecutiveSuccesses: number;
    /** Consecutive failed signals */
    consecutiveFailures: number;
    /** Quiz accuracy in recent window */
    recentQuizAccuracy: number;
    /** Playground success rate in recent window */
    recentPlaygroundSuccess: number;
    /** Error repetition count */
    repeatedErrors: number;
    /** Backward navigation count */
    backwardNavigations: number;
    /** Total signal count */
    totalSignals: number;
}

/**
 * A recorded state transition event
 */
export interface StateTransitionEvent {
    id: string;
    timestamp: number;
    fromState: ComprehensionState;
    toState: ComprehensionState;
    transition: StateTransition;
    /** Metrics at time of transition */
    metrics: TransitionMetrics;
    /** Which exit condition triggered the transition */
    triggeredBy: string;
    /** Section where transition occurred */
    sectionId?: string;
}

/**
 * Comprehensive state machine model
 */
export interface ComprehensionStateMachineModel {
    /** Current state */
    currentState: ComprehensionState;
    /** When current state was entered */
    stateEnteredAt: number;
    /** All signals since entering current state */
    signalsInCurrentState: BehaviorSignal[];
    /** History of state transitions */
    transitionHistory: StateTransitionEvent[];
    /** Current metrics snapshot */
    currentMetrics: TransitionMetrics;
    /** Last updated timestamp */
    lastUpdated: number;
}

// ============================================================================
// State Definitions
// ============================================================================

/**
 * All state definitions with entry/exit conditions
 */
export const STATE_DEFINITIONS: Record<ComprehensionState, StateDefinition> = {
    confusion: {
        state: "confusion",
        legacyLevel: "beginner",
        label: "Finding Footing",
        description: "Taking time to understand the fundamentals",
        icon: "🌊",
        color: {
            text: "text-blue-400",
            bg: "bg-blue-500/10",
            border: "border-blue-500/30",
            gradient: "from-blue-500/20 to-blue-600/20",
        },
        entryConditions: [
            {
                description: "Multiple consecutive failures",
                check: (m) => m.consecutiveFailures >= 3,
            },
            {
                description: "Very low recent score",
                check: (m) => m.recentScore < 25,
            },
            {
                description: "High repeated errors",
                check: (m) => m.repeatedErrors >= 3,
            },
        ],
        exitConditions: [
            {
                targetState: "struggling",
                description: "Starting to make progress",
                check: (m) => m.recentScore >= 30 && m.consecutiveFailures < 2,
                priority: 10,
            },
            {
                targetState: "progressing",
                description: "Sudden comprehension jump",
                check: (m) => m.scoreDelta >= 25 && m.recentScore >= 45,
                priority: 20,
            },
        ],
    },
    struggling: {
        state: "struggling",
        legacyLevel: "beginner",
        label: "Building Foundation",
        description: "Working through challenges, learning from mistakes",
        icon: "🔧",
        color: {
            text: "text-amber-400",
            bg: "bg-amber-500/10",
            border: "border-amber-500/30",
            gradient: "from-amber-500/20 to-orange-500/20",
        },
        entryConditions: [
            {
                description: "Low but improving scores",
                check: (m) => m.recentScore >= 25 && m.recentScore < 45 && m.scoreDelta >= 0,
            },
            {
                description: "Recovering from confusion",
                check: (m) => m.consecutiveSuccesses >= 1 && m.recentScore < 45,
            },
        ],
        exitConditions: [
            {
                targetState: "confusion",
                description: "Falling back to confusion",
                check: (m) => m.consecutiveFailures >= 3 || m.recentScore < 20,
                priority: 10,
            },
            {
                targetState: "progressing",
                description: "Starting to progress",
                check: (m) => m.recentScore >= 45 && m.scoreDelta >= 5,
                priority: 20,
            },
            {
                targetState: "breakthrough",
                description: "Sudden breakthrough!",
                check: (m) => m.scoreDelta >= 30 && m.recentScore >= 60,
                priority: 30,
            },
        ],
    },
    progressing: {
        state: "progressing",
        legacyLevel: "intermediate",
        label: "Growing Skills",
        description: "Making steady progress, concepts are clicking",
        icon: "🌱",
        color: {
            text: "text-emerald-400",
            bg: "bg-emerald-500/10",
            border: "border-emerald-500/30",
            gradient: "from-emerald-500/20 to-green-500/20",
        },
        entryConditions: [
            {
                description: "Stable intermediate performance",
                check: (m) => m.recentScore >= 45 && m.recentScore < 75,
            },
            {
                description: "Recovered from struggling",
                check: (m) => m.scoreDelta >= 10 && m.recentScore >= 45,
            },
        ],
        exitConditions: [
            {
                targetState: "struggling",
                description: "Hitting a wall",
                check: (m) => m.scoreDelta <= -15 || (m.recentScore < 40 && m.consecutiveFailures >= 2),
                priority: 10,
            },
            {
                targetState: "breakthrough",
                description: "Breakthrough moment!",
                check: (m) =>
                    (m.scoreDelta >= 20 && m.recentScore >= 70) ||
                    (m.consecutiveSuccesses >= 4 && m.recentScore >= 65),
                priority: 20,
            },
        ],
    },
    breakthrough: {
        state: "breakthrough",
        legacyLevel: "advanced",
        label: "Breakthrough!",
        description: "Concepts just clicked - building momentum!",
        icon: "💡",
        color: {
            text: "text-yellow-400",
            bg: "bg-yellow-500/10",
            border: "border-yellow-500/30",
            gradient: "from-yellow-500/20 to-amber-500/20",
        },
        entryConditions: [
            {
                description: "Significant score jump",
                check: (m) => m.scoreDelta >= 20 && m.recentScore >= 65,
            },
            {
                description: "Streak of successes",
                check: (m) => m.consecutiveSuccesses >= 4,
            },
        ],
        exitConditions: [
            {
                targetState: "progressing",
                description: "Stabilizing after breakthrough",
                check: (m) =>
                    m.signalsInState >= 5 && m.scoreDelta < 5 && m.recentScore < 80,
                priority: 10,
            },
            {
                targetState: "mastery",
                description: "Achieving mastery!",
                check: (m) =>
                    m.recentScore >= 85 &&
                    m.signalsInState >= 3 &&
                    m.consecutiveSuccesses >= 3,
                priority: 20,
            },
        ],
    },
    mastery: {
        state: "mastery",
        legacyLevel: "advanced",
        label: "Mastery",
        description: "Deep understanding achieved - ready for challenges",
        icon: "🚀",
        color: {
            text: "text-purple-400",
            bg: "bg-purple-500/10",
            border: "border-purple-500/30",
            gradient: "from-purple-500/20 to-violet-500/20",
        },
        entryConditions: [
            {
                description: "Consistently high scores",
                check: (m) => m.recentScore >= 85 && m.olderScore >= 70,
            },
            {
                description: "Perfect recent performance",
                check: (m) => m.recentScore >= 90 && m.consecutiveSuccesses >= 3,
            },
        ],
        exitConditions: [
            {
                targetState: "progressing",
                description: "Revisiting fundamentals",
                check: (m) => m.recentScore < 70 || m.consecutiveFailures >= 2,
                priority: 10,
            },
        ],
    },
};

// ============================================================================
// Transition Descriptions (for UI/gamification)
// ============================================================================

export interface TransitionMessage {
    title: string;
    message: string;
    encouragement: string;
    celebration: boolean;
}

export const TRANSITION_MESSAGES: Record<StateTransition, TransitionMessage> = {
    confusion_to_struggling: {
        title: "Progress!",
        message: "You're starting to find your footing",
        encouragement: "Keep exploring - each attempt teaches something",
        celebration: true,
    },
    struggling_to_confusion: {
        title: "Let's Pause",
        message: "This concept needs more exploration",
        encouragement: "No worries - let's try a different angle",
        celebration: false,
    },
    struggling_to_progressing: {
        title: "Breaking Through!",
        message: "You're starting to get it",
        encouragement: "Your persistence is paying off",
        celebration: true,
    },
    progressing_to_struggling: {
        title: "Challenge Ahead",
        message: "This part takes more practice",
        encouragement: "Every expert was once a beginner",
        celebration: false,
    },
    progressing_to_breakthrough: {
        title: "Breakthrough!",
        message: "Something just clicked!",
        encouragement: "You're on fire - keep the momentum",
        celebration: true,
    },
    breakthrough_to_progressing: {
        title: "Consolidating",
        message: "Building on your breakthrough",
        encouragement: "Solid foundation being built",
        celebration: false,
    },
    breakthrough_to_mastery: {
        title: "Mastery Achieved!",
        message: "You've truly understood this concept",
        encouragement: "Ready for advanced challenges",
        celebration: true,
    },
    mastery_to_progressing: {
        title: "New Territory",
        message: "Exploring new concepts",
        encouragement: "Your mastery of basics will help here",
        celebration: false,
    },
    stuck_in_state: {
        title: "Let's Try Something Different",
        message: "You've been here a while",
        encouragement: "Sometimes a fresh approach helps",
        celebration: false,
    },
};

// ============================================================================
// Metrics Calculation
// ============================================================================

/**
 * Score a single signal (0-100)
 */
function scoreSignal(signal: BehaviorSignal): number {
    switch (signal.type) {
        case "quiz": {
            const accuracy = (signal.correctAnswers / signal.totalQuestions) * 100;
            const attemptPenalty = Math.max(0, (signal.attemptsUsed - 1) * 10);
            return Math.max(0, Math.min(100, accuracy - attemptPenalty));
        }
        case "playground": {
            if (signal.runCount === 0) return 50;
            const successRate = (signal.successfulRuns / signal.runCount) * 100;
            const errorPenalty = (signal.errorCount / signal.runCount) * 20;
            return Math.max(0, Math.min(100, successRate - errorPenalty));
        }
        case "sectionTime": {
            let score = signal.completionPercentage;
            if (signal.revisitCount > 2) score -= 5 * (signal.revisitCount - 2);
            return Math.max(0, Math.min(100, score));
        }
        case "errorPattern": {
            return Math.max(0, 100 - signal.repeatedCount * 20);
        }
        case "video": {
            let score = signal.watchedPercentage;
            score -= Math.min(15, signal.rewindCount * 3);
            return Math.max(0, Math.min(100, score));
        }
        case "navigation": {
            return signal.isBackward ? 60 : 80;
        }
        default:
            return 50;
    }
}

/**
 * Check if a signal represents success
 */
function isSuccessSignal(signal: BehaviorSignal): boolean {
    return scoreSignal(signal) >= 70;
}

/**
 * Check if a signal represents failure
 */
function isFailureSignal(signal: BehaviorSignal): boolean {
    return scoreSignal(signal) < 40;
}

/**
 * Calculate transition metrics from signals
 */
export function calculateTransitionMetrics(
    allSignals: BehaviorSignal[],
    signalsInCurrentState: BehaviorSignal[],
    stateEnteredAt: number
): TransitionMetrics {
    const now = Date.now();
    const recentWindow = 10;
    const olderWindow = 20;

    const recentSignals = allSignals.slice(-recentWindow);
    const olderSignals = allSignals.slice(-olderWindow, -recentWindow);

    // Calculate scores
    const recentScores = recentSignals.map(scoreSignal);
    const olderScores = olderSignals.map(scoreSignal);

    const recentScore =
        recentScores.length > 0
            ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
            : 50;
    const olderScore =
        olderScores.length > 0
            ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length
            : 50;

    // Count consecutive successes/failures from end
    let consecutiveSuccesses = 0;
    let consecutiveFailures = 0;

    for (let i = recentSignals.length - 1; i >= 0; i--) {
        if (isSuccessSignal(recentSignals[i])) {
            consecutiveSuccesses++;
        } else {
            break;
        }
    }

    for (let i = recentSignals.length - 1; i >= 0; i--) {
        if (isFailureSignal(recentSignals[i])) {
            consecutiveFailures++;
        } else {
            break;
        }
    }

    // Quiz accuracy
    const quizSignals = recentSignals.filter((s) => s.type === "quiz");
    const recentQuizAccuracy =
        quizSignals.length > 0
            ? quizSignals.reduce((acc, s) => {
                  if (s.type === "quiz") {
                      return acc + (s.correctAnswers / s.totalQuestions) * 100;
                  }
                  return acc;
              }, 0) / quizSignals.length
            : 50;

    // Playground success
    const playgroundSignals = recentSignals.filter((s) => s.type === "playground");
    const recentPlaygroundSuccess =
        playgroundSignals.length > 0
            ? playgroundSignals.reduce((acc, s) => {
                  if (s.type === "playground" && s.runCount > 0) {
                      return acc + (s.successfulRuns / s.runCount) * 100;
                  }
                  return acc;
              }, 0) / playgroundSignals.length
            : 50;

    // Error patterns
    const errorSignals = recentSignals.filter((s) => s.type === "errorPattern");
    const repeatedErrors = errorSignals.reduce((acc, s) => {
        if (s.type === "errorPattern") {
            return acc + s.repeatedCount;
        }
        return acc;
    }, 0);

    // Backward navigations
    const navSignals = recentSignals.filter((s) => s.type === "navigation");
    const backwardNavigations = navSignals.filter(
        (s) => s.type === "navigation" && s.isBackward
    ).length;

    return {
        recentScore,
        olderScore,
        scoreDelta: recentScore - olderScore,
        signalsInState: signalsInCurrentState.length,
        timeInState: now - stateEnteredAt,
        consecutiveSuccesses,
        consecutiveFailures,
        recentQuizAccuracy,
        recentPlaygroundSuccess,
        repeatedErrors,
        backwardNavigations,
        totalSignals: allSignals.length,
    };
}

// ============================================================================
// State Machine Engine
// ============================================================================

/**
 * Generate a unique ID for transition events
 */
function generateTransitionId(): string {
    return `tr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Determine the transition name between two states
 */
function getTransitionName(
    from: ComprehensionState,
    to: ComprehensionState
): StateTransition {
    if (from === to) return "stuck_in_state";
    return `${from}_to_${to}` as StateTransition;
}

/**
 * Evaluate exit conditions and determine next state
 */
export function evaluateTransitions(
    currentState: ComprehensionState,
    metrics: TransitionMetrics
): { shouldTransition: boolean; nextState: ComprehensionState; triggeredBy: string } {
    const stateDef = STATE_DEFINITIONS[currentState];

    // Sort exit conditions by priority (highest first)
    const sortedConditions = [...stateDef.exitConditions].sort(
        (a, b) => b.priority - a.priority
    );

    for (const condition of sortedConditions) {
        if (condition.check(metrics)) {
            return {
                shouldTransition: true,
                nextState: condition.targetState,
                triggeredBy: condition.description,
            };
        }
    }

    return {
        shouldTransition: false,
        nextState: currentState,
        triggeredBy: "",
    };
}

/**
 * Detect if learner is stuck in a state (anti-pattern)
 */
export function detectStuckPattern(
    model: ComprehensionStateMachineModel
): { isStuck: boolean; recommendation: string } {
    const { currentState, currentMetrics } = model;
    const minSignalsToDetectStuck = 15;
    const minTimeToDetectStuck = 5 * 60 * 1000; // 5 minutes

    // Need enough data to make a determination
    if (
        currentMetrics.signalsInState < minSignalsToDetectStuck &&
        currentMetrics.timeInState < minTimeToDetectStuck
    ) {
        return { isStuck: false, recommendation: "" };
    }

    // Check for stuck patterns based on state
    switch (currentState) {
        case "confusion":
            if (currentMetrics.signalsInState >= 20 && currentMetrics.scoreDelta < 5) {
                return {
                    isStuck: true,
                    recommendation: "Try reviewing the prerequisite material or watching the video at 0.75x speed",
                };
            }
            break;
        case "struggling":
            if (currentMetrics.signalsInState >= 15 && Math.abs(currentMetrics.scoreDelta) < 3) {
                return {
                    isStuck: true,
                    recommendation: "Consider trying the interactive examples before the quiz",
                };
            }
            break;
        case "progressing":
            // It's okay to stay in progressing for a while
            if (currentMetrics.signalsInState >= 30 && currentMetrics.scoreDelta < 2) {
                return {
                    isStuck: true,
                    recommendation: "Ready to try some advanced challenges?",
                };
            }
            break;
        case "breakthrough":
            // Breakthroughs should be transient
            if (currentMetrics.signalsInState >= 8) {
                return {
                    isStuck: true,
                    recommendation: "Time to solidify this understanding with practice",
                };
            }
            break;
        case "mastery":
            // Mastery is fine to stay in
            return { isStuck: false, recommendation: "" };
    }

    return { isStuck: false, recommendation: "" };
}

/**
 * Create initial state machine model
 */
export function createStateMachineModel(): ComprehensionStateMachineModel {
    const now = Date.now();
    return {
        currentState: "progressing",
        stateEnteredAt: now,
        signalsInCurrentState: [],
        transitionHistory: [],
        currentMetrics: {
            recentScore: 50,
            olderScore: 50,
            scoreDelta: 0,
            signalsInState: 0,
            timeInState: 0,
            consecutiveSuccesses: 0,
            consecutiveFailures: 0,
            recentQuizAccuracy: 50,
            recentPlaygroundSuccess: 50,
            repeatedErrors: 0,
            backwardNavigations: 0,
            totalSignals: 0,
        },
        lastUpdated: now,
    };
}

/**
 * Update state machine with a new signal
 */
export function updateStateMachine(
    model: ComprehensionStateMachineModel,
    signal: BehaviorSignal,
    allSignals: BehaviorSignal[],
    sectionId?: string
): {
    model: ComprehensionStateMachineModel;
    transition: StateTransitionEvent | null;
} {
    const now = Date.now();
    const newSignalsInState = [...model.signalsInCurrentState, signal];

    // Calculate new metrics
    const newMetrics = calculateTransitionMetrics(
        allSignals,
        newSignalsInState,
        model.stateEnteredAt
    );

    // Evaluate if we should transition
    const { shouldTransition, nextState, triggeredBy } = evaluateTransitions(
        model.currentState,
        newMetrics
    );

    if (shouldTransition && nextState !== model.currentState) {
        // Create transition event
        const transitionEvent: StateTransitionEvent = {
            id: generateTransitionId(),
            timestamp: now,
            fromState: model.currentState,
            toState: nextState,
            transition: getTransitionName(model.currentState, nextState),
            metrics: newMetrics,
            triggeredBy,
            sectionId,
        };

        // Update model with new state
        const newModel: ComprehensionStateMachineModel = {
            currentState: nextState,
            stateEnteredAt: now,
            signalsInCurrentState: [],
            transitionHistory: [...model.transitionHistory, transitionEvent].slice(-50),
            currentMetrics: {
                ...newMetrics,
                signalsInState: 0,
                timeInState: 0,
            },
            lastUpdated: now,
        };

        return { model: newModel, transition: transitionEvent };
    }

    // No transition - just update metrics
    return {
        model: {
            ...model,
            signalsInCurrentState: newSignalsInState,
            currentMetrics: newMetrics,
            lastUpdated: now,
        },
        transition: null,
    };
}

/**
 * Get progress toward next positive state transition
 */
export function getProgressToNextState(
    model: ComprehensionStateMachineModel
): { progress: number; nextState: ComprehensionState; requirements: string[] } {
    const { currentState, currentMetrics } = model;
    const stateDef = STATE_DEFINITIONS[currentState];

    // Find the most achievable positive transition
    const positiveTransitions = stateDef.exitConditions.filter((c) => {
        const targetDef = STATE_DEFINITIONS[c.targetState];
        const currentIndex = Object.keys(STATE_DEFINITIONS).indexOf(currentState);
        const targetIndex = Object.keys(STATE_DEFINITIONS).indexOf(c.targetState);
        return targetIndex > currentIndex; // Forward progress
    });

    if (positiveTransitions.length === 0) {
        return {
            progress: 100,
            nextState: currentState,
            requirements: ["You've achieved mastery!"],
        };
    }

    // Use lowest priority (most achievable) positive transition
    const nextTransition = positiveTransitions.sort((a, b) => a.priority - b.priority)[0];
    const requirements: string[] = [];
    let progress = 0;

    // Calculate approximate progress based on current state
    switch (currentState) {
        case "confusion":
            progress = Math.min(100, (currentMetrics.recentScore / 30) * 100);
            if (currentMetrics.recentScore < 30) {
                requirements.push("Improve score to 30+");
            }
            if (currentMetrics.consecutiveFailures >= 2) {
                requirements.push("Get 2 correct in a row");
            }
            break;
        case "struggling":
            progress = Math.min(100, ((currentMetrics.recentScore - 25) / 20) * 100);
            if (currentMetrics.recentScore < 45) {
                requirements.push("Reach score of 45+");
            }
            if (currentMetrics.scoreDelta < 5) {
                requirements.push("Show improving trend");
            }
            break;
        case "progressing":
            progress = Math.min(100, ((currentMetrics.recentScore - 45) / 25) * 100);
            if (currentMetrics.recentScore < 70) {
                requirements.push("Reach score of 70+");
            }
            if (currentMetrics.consecutiveSuccesses < 4) {
                requirements.push(`Get ${4 - currentMetrics.consecutiveSuccesses} more correct`);
            }
            break;
        case "breakthrough":
            progress = Math.min(100, ((currentMetrics.recentScore - 70) / 15) * 100);
            if (currentMetrics.recentScore < 85) {
                requirements.push("Reach score of 85+");
            }
            if (currentMetrics.consecutiveSuccesses < 3) {
                requirements.push(`Maintain streak of ${3 - currentMetrics.consecutiveSuccesses} more`);
            }
            break;
        default:
            progress = 100;
    }

    return {
        progress: Math.max(0, Math.min(100, progress)),
        nextState: nextTransition.targetState,
        requirements,
    };
}

/**
 * Map state machine state to legacy comprehension level
 */
export function stateToLegacyLevel(state: ComprehensionState): ComprehensionLevel {
    return STATE_DEFINITIONS[state].legacyLevel;
}

/**
 * Get the state definition for a given state
 */
export function getStateDefinition(state: ComprehensionState): StateDefinition {
    return STATE_DEFINITIONS[state];
}
