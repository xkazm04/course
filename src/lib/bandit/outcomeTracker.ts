/**
 * Outcome Tracker
 *
 * Tracks intervention outcomes and calculates composite rewards
 * for multi-armed bandit feedback. Handles delayed outcomes,
 * attribution, and reward calculation.
 */

import type {
    InterventionOutcome,
    RewardConfig,
    EncodedContext,
    InterventionType,
} from "./types";

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_REWARD_CONFIG: RewardConfig = {
    engagementWeight: 0.3,
    learningGainWeight: 0.5,
    completionWeight: 0.2,
    delayDecayFactor: 0.95,
    maxDelayMs: 24 * 60 * 60 * 1000, // 24 hours
};

// ============================================================================
// Types
// ============================================================================

export interface OutcomeSignal {
    /** Type of signal */
    type: "engagement" | "learning_gain" | "completion";
    /** Signal value (0-1) */
    value: number;
    /** Signal timestamp */
    timestamp: number;
    /** Additional context */
    metadata?: Record<string, unknown>;
}

export interface PendingOutcome extends InterventionOutcome {
    /** Collected signals for reward calculation */
    signals: OutcomeSignal[];
    /** Timeout handle for auto-resolution */
    timeoutId?: ReturnType<typeof setTimeout>;
}

export interface OutcomeResolution {
    /** Outcome ID */
    outcomeId: string;
    /** Raw outcome */
    rawOutcome: "helped" | "ignored" | "dismissed";
    /** Calculated reward */
    reward: number;
    /** Reward breakdown */
    components: {
        engagement: number;
        learningGain: number;
        completion: number;
    };
    /** Attribution confidence */
    confidence: number;
    /** Time to resolution (ms) */
    resolutionTimeMs: number;
}

// ============================================================================
// Outcome Tracker Class
// ============================================================================

export class OutcomeTracker {
    private config: RewardConfig;
    private pendingOutcomes: Map<string, PendingOutcome>;
    private resolvedOutcomes: InterventionOutcome[];
    private maxResolvedHistory: number;
    private onOutcomeResolved?: (outcome: OutcomeResolution) => void;

    constructor(
        config: Partial<RewardConfig> = {},
        options: {
            maxResolvedHistory?: number;
            onOutcomeResolved?: (outcome: OutcomeResolution) => void;
        } = {}
    ) {
        this.config = { ...DEFAULT_REWARD_CONFIG, ...config };
        this.pendingOutcomes = new Map();
        this.resolvedOutcomes = [];
        this.maxResolvedHistory = options.maxResolvedHistory ?? 100;
        this.onOutcomeResolved = options.onOutcomeResolved;
    }

    /**
     * Start tracking a new outcome
     */
    trackOutcome(
        outcomeId: string,
        userId: string,
        sectionId: string,
        armId: string,
        interventionType: InterventionType,
        context: EncodedContext,
        selectionMetadata: {
            reason: string;
            sampledValue?: number;
            confidence?: number;
            isExploration?: boolean;
        }
    ): PendingOutcome {
        // Store selection metadata for debugging/analytics
        void selectionMetadata;

        const outcome: PendingOutcome = {
            id: outcomeId,
            userId,
            sectionId,
            armId,
            interventionType,
            context,
            selectedAt: new Date().toISOString(),
            signals: [],
        };

        // Set up auto-expiration timeout
        const timeoutId = setTimeout(() => {
            this.expireOutcome(outcomeId);
        }, this.config.maxDelayMs);

        outcome.timeoutId = timeoutId;

        this.pendingOutcomes.set(outcomeId, outcome);

        return outcome;
    }

    /**
     * Record a signal for an outcome
     */
    recordSignal(
        outcomeId: string,
        signal: Omit<OutcomeSignal, "timestamp">
    ): boolean {
        const outcome = this.pendingOutcomes.get(outcomeId);
        if (!outcome) {
            return false;
        }

        outcome.signals.push({
            ...signal,
            timestamp: Date.now(),
        });

        return true;
    }

    /**
     * Record engagement signal
     */
    recordEngagement(
        outcomeId: string,
        value: number,
        metadata?: Record<string, unknown>
    ): boolean {
        return this.recordSignal(outcomeId, {
            type: "engagement",
            value: Math.max(0, Math.min(1, value)),
            metadata,
        });
    }

    /**
     * Record learning gain signal
     */
    recordLearningGain(
        outcomeId: string,
        value: number,
        metadata?: Record<string, unknown>
    ): boolean {
        return this.recordSignal(outcomeId, {
            type: "learning_gain",
            value: Math.max(0, Math.min(1, value)),
            metadata,
        });
    }

    /**
     * Record completion signal
     */
    recordCompletion(
        outcomeId: string,
        value: number,
        metadata?: Record<string, unknown>
    ): boolean {
        return this.recordSignal(outcomeId, {
            type: "completion",
            value: Math.max(0, Math.min(1, value)),
            metadata,
        });
    }

    /**
     * Resolve an outcome with raw result
     */
    resolveOutcome(
        outcomeId: string,
        rawOutcome: "helped" | "ignored" | "dismissed"
    ): OutcomeResolution | null {
        const outcome = this.pendingOutcomes.get(outcomeId);
        if (!outcome) {
            return null;
        }

        // Clear timeout
        if (outcome.timeoutId) {
            clearTimeout(outcome.timeoutId);
        }

        // Calculate reward
        const resolution = this.calculateReward(outcome, rawOutcome);

        // Update outcome record
        outcome.rawOutcome = rawOutcome;
        outcome.reward = resolution.reward;
        outcome.rewardComponents = resolution.components;
        outcome.resolvedAt = new Date().toISOString();
        outcome.attributionConfidence = resolution.confidence;

        // Move to resolved
        this.pendingOutcomes.delete(outcomeId);
        this.resolvedOutcomes.push(outcome);

        // Trim history
        if (this.resolvedOutcomes.length > this.maxResolvedHistory) {
            this.resolvedOutcomes.shift();
        }

        // Callback
        if (this.onOutcomeResolved) {
            this.onOutcomeResolved(resolution);
        }

        return resolution;
    }

    /**
     * Calculate composite reward from signals
     */
    private calculateReward(
        outcome: PendingOutcome,
        rawOutcome: "helped" | "ignored" | "dismissed"
    ): OutcomeResolution {
        const selectionTime = new Date(outcome.selectedAt).getTime();
        const resolutionTime = Date.now();
        const delayMs = resolutionTime - selectionTime;

        // Calculate component rewards from signals
        const components = this.aggregateSignals(outcome.signals);

        // Apply raw outcome modifier
        const outcomeModifier = this.getOutcomeModifier(rawOutcome);

        // Apply delay decay
        const delayFactor = this.calculateDelayFactor(delayMs);

        // Calculate final reward
        const rawReward =
            components.engagement * this.config.engagementWeight +
            components.learningGain * this.config.learningGainWeight +
            components.completion * this.config.completionWeight;

        const reward = rawReward * outcomeModifier * delayFactor;

        // Calculate attribution confidence
        const confidence = this.calculateAttributionConfidence(
            outcome.signals,
            delayMs,
            rawOutcome
        );

        return {
            outcomeId: outcome.id,
            rawOutcome,
            reward: Math.max(0, Math.min(1, reward)),
            components,
            confidence,
            resolutionTimeMs: delayMs,
        };
    }

    /**
     * Aggregate signals by type
     */
    private aggregateSignals(signals: OutcomeSignal[]): {
        engagement: number;
        learningGain: number;
        completion: number;
    } {
        const byType: Record<string, number[]> = {
            engagement: [],
            learning_gain: [],
            completion: [],
        };

        for (const signal of signals) {
            byType[signal.type]?.push(signal.value);
        }

        // Use weighted average favoring more recent signals
        const aggregate = (values: number[]): number => {
            if (values.length === 0) return 0.5; // Default neutral

            // Weighted average with recency bias
            let weightedSum = 0;
            let weightSum = 0;

            for (let i = 0; i < values.length; i++) {
                const weight = 1 + i * 0.1; // Later signals weighted more
                weightedSum += values[i] * weight;
                weightSum += weight;
            }

            return weightedSum / weightSum;
        };

        return {
            engagement: aggregate(byType.engagement),
            learningGain: aggregate(byType.learning_gain),
            completion: aggregate(byType.completion),
        };
    }

    /**
     * Get outcome modifier based on raw result
     */
    private getOutcomeModifier(rawOutcome: "helped" | "ignored" | "dismissed"): number {
        switch (rawOutcome) {
            case "helped":
                return 1.0;
            case "ignored":
                return 0.5;
            case "dismissed":
                return 0.2;
        }
    }

    /**
     * Calculate delay decay factor
     */
    private calculateDelayFactor(delayMs: number): number {
        if (delayMs <= 0) return 1;

        // Exponential decay
        const normalizedDelay = delayMs / this.config.maxDelayMs;
        return Math.pow(this.config.delayDecayFactor, normalizedDelay * 10);
    }

    /**
     * Calculate attribution confidence
     */
    private calculateAttributionConfidence(
        signals: OutcomeSignal[],
        delayMs: number,
        rawOutcome: "helped" | "ignored" | "dismissed"
    ): number {
        let confidence = 0.5; // Base confidence

        // More signals = higher confidence
        confidence += Math.min(0.2, signals.length * 0.05);

        // Shorter delay = higher confidence
        const normalizedDelay = delayMs / this.config.maxDelayMs;
        confidence += 0.2 * (1 - normalizedDelay);

        // Explicit outcome = higher confidence
        if (rawOutcome === "helped" || rawOutcome === "dismissed") {
            confidence += 0.1;
        }

        return Math.min(1, confidence);
    }

    /**
     * Expire an outcome that wasn't resolved in time
     */
    private expireOutcome(outcomeId: string): void {
        const outcome = this.pendingOutcomes.get(outcomeId);
        if (!outcome) return;

        // Resolve as ignored by default
        this.resolveOutcome(outcomeId, "ignored");
    }

    /**
     * Get pending outcome
     */
    getPendingOutcome(outcomeId: string): PendingOutcome | undefined {
        return this.pendingOutcomes.get(outcomeId);
    }

    /**
     * Get all pending outcomes for a user
     */
    getPendingOutcomesForUser(userId: string): PendingOutcome[] {
        return Array.from(this.pendingOutcomes.values()).filter(
            (o) => o.userId === userId
        );
    }

    /**
     * Get recent resolved outcomes
     */
    getResolvedOutcomes(): InterventionOutcome[] {
        return [...this.resolvedOutcomes];
    }

    /**
     * Get pending outcome count
     */
    getPendingCount(): number {
        return this.pendingOutcomes.size;
    }

    /**
     * Clear all pending outcomes (for cleanup)
     */
    clearPending(): void {
        for (const outcome of this.pendingOutcomes.values()) {
            if (outcome.timeoutId) {
                clearTimeout(outcome.timeoutId);
            }
        }
        this.pendingOutcomes.clear();
    }

    /**
     * Export state for persistence
     */
    exportState(): {
        pending: InterventionOutcome[];
        resolved: InterventionOutcome[];
    } {
        return {
            pending: Array.from(this.pendingOutcomes.values()).map((o) => ({
                id: o.id,
                userId: o.userId,
                sectionId: o.sectionId,
                armId: o.armId,
                interventionType: o.interventionType,
                context: o.context,
                selectedAt: o.selectedAt,
            })),
            resolved: this.resolvedOutcomes,
        };
    }

    /**
     * Import state from persistence
     */
    importState(state: {
        pending?: InterventionOutcome[];
        resolved?: InterventionOutcome[];
    }): void {
        // Import pending (without signals - they would be lost)
        for (const outcome of state.pending ?? []) {
            const pending: PendingOutcome = {
                ...outcome,
                signals: [],
            };

            // Calculate remaining time until expiration
            const selectionTime = new Date(outcome.selectedAt).getTime();
            const elapsed = Date.now() - selectionTime;
            const remaining = Math.max(0, this.config.maxDelayMs - elapsed);

            if (remaining > 0) {
                pending.timeoutId = setTimeout(() => {
                    this.expireOutcome(outcome.id);
                }, remaining);

                this.pendingOutcomes.set(outcome.id, pending);
            }
        }

        // Import resolved
        this.resolvedOutcomes = state.resolved ?? [];
    }

    /**
     * Get statistics about outcomes
     */
    getStatistics(): {
        pendingCount: number;
        resolvedCount: number;
        averageReward: number;
        averageResolutionTime: number;
        outcomeDistribution: Record<string, number>;
    } {
        const resolved = this.resolvedOutcomes.filter((o) => o.reward !== undefined);

        const averageReward =
            resolved.length > 0
                ? resolved.reduce((sum, o) => sum + (o.reward ?? 0), 0) / resolved.length
                : 0;

        const resolutionTimes = resolved
            .filter((o) => o.resolvedAt && o.selectedAt)
            .map((o) => {
                const selected = new Date(o.selectedAt).getTime();
                const resolved = new Date(o.resolvedAt!).getTime();
                return resolved - selected;
            });

        const averageResolutionTime =
            resolutionTimes.length > 0
                ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
                : 0;

        const outcomeDistribution: Record<string, number> = {
            helped: 0,
            ignored: 0,
            dismissed: 0,
        };

        for (const o of resolved) {
            if (o.rawOutcome) {
                outcomeDistribution[o.rawOutcome]++;
            }
        }

        return {
            pendingCount: this.pendingOutcomes.size,
            resolvedCount: resolved.length,
            averageReward,
            averageResolutionTime,
            outcomeDistribution,
        };
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let trackerInstance: OutcomeTracker | null = null;

export function getOutcomeTracker(
    config?: Partial<RewardConfig>,
    options?: {
        maxResolvedHistory?: number;
        onOutcomeResolved?: (outcome: OutcomeResolution) => void;
    }
): OutcomeTracker {
    if (!trackerInstance) {
        trackerInstance = new OutcomeTracker(config, options);
    }
    return trackerInstance;
}

export function resetOutcomeTracker(): void {
    if (trackerInstance) {
        trackerInstance.clearPending();
    }
    trackerInstance = null;
}
