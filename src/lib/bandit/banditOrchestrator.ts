/**
 * Bandit Orchestrator
 *
 * Main orchestration layer for the multi-armed bandit system.
 * Coordinates arm selection, outcome tracking, and state persistence.
 * Integrates with the proactive scaffolding engine.
 */

import type {
    ArmStatistics,
    BanditConfig,
    BanditState,
    BanditHealthMetrics,
    SelectionResult,
    InterventionType,
    LearnerContext,
} from "./types";
import { ThompsonSampler, getThompsonSampler } from "./thompsonSampler";
import { ContextEncoder, getContextEncoder } from "./contextEncoder";
import {
    OutcomeTracker,
    getOutcomeTracker,
    type OutcomeResolution,
} from "./outcomeTracker";

// ============================================================================
// Types
// ============================================================================

export interface SelectionRequest {
    userId: string;
    sectionId: string;
    availableInterventions: InterventionType[];
    learnerContext: Partial<LearnerContext>;
}

export interface SelectionResponse {
    success: boolean;
    selection?: SelectionResult;
    error?: string;
}

export interface RewardRequest {
    outcomeId: string;
    rawOutcome: "helped" | "ignored" | "dismissed";
    signals?: Array<{
        type: "engagement" | "learning_gain" | "completion";
        value: number;
    }>;
}

export interface RewardResponse {
    success: boolean;
    resolution?: OutcomeResolution;
    error?: string;
}

export interface OrchestratorConfig extends BanditConfig {
    /** Enable auto-sync with database */
    enableAutoSync: boolean;
    /** Sync interval in ms */
    syncIntervalMs: number;
    /** Enable local caching */
    enableLocalCache: boolean;
    /** Cache TTL in ms */
    cacheTtlMs: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
    algorithm: "thompson_sampling",
    priorAlpha: 1,
    priorBeta: 1,
    epsilon: 0.1,
    ucbConstant: 2,
    minPullsBeforeExploitation: 10,
    armRetirementThreshold: 0.1,
    minPullsBeforeRetirement: 50,
    enableContextual: true,
    contextSimilarityThreshold: 0.7,
    rewardConfig: {
        engagementWeight: 0.3,
        learningGainWeight: 0.5,
        completionWeight: 0.2,
        delayDecayFactor: 0.95,
        maxDelayMs: 24 * 60 * 60 * 1000,
    },
    enableAutoSync: true,
    syncIntervalMs: 60000, // 1 minute
    enableLocalCache: true,
    cacheTtlMs: 300000, // 5 minutes
};

// ============================================================================
// Intervention Type to Arm ID Mapping
// ============================================================================

const INTERVENTION_TO_ARM: Record<InterventionType, string> = {
    interactive_hint: "arm_interactive_hint",
    worked_example: "arm_worked_example",
    scaffolding_content: "arm_scaffolding_content",
    simplified_example: "arm_simplified_example",
    prerequisite_review: "arm_prerequisite_review",
    visual_aid: "arm_visual_aid",
    alternative_explanation: "arm_alternative_explanation",
    concept_bridge: "arm_concept_bridge",
    pace_adjustment: "arm_pace_adjustment",
    micro_practice: "arm_micro_practice",
};

const ARM_TO_INTERVENTION: Record<string, InterventionType> = Object.fromEntries(
    Object.entries(INTERVENTION_TO_ARM).map(([k, v]) => [v, k as InterventionType])
);

// ============================================================================
// Bandit Orchestrator Class
// ============================================================================

export class BanditOrchestrator {
    private config: OrchestratorConfig;
    private sampler: ThompsonSampler;
    private encoder: ContextEncoder;
    private tracker: OutcomeTracker;
    private initialized: boolean = false;
    private syncTimeoutId?: ReturnType<typeof setTimeout>;
    private lastSyncedAt?: string;
    private healthMetrics: BanditHealthMetrics;

    constructor(config: Partial<OrchestratorConfig> = {}) {
        this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config };

        // Initialize components
        this.sampler = getThompsonSampler({
            priorAlpha: this.config.priorAlpha,
            priorBeta: this.config.priorBeta,
            ucbConstant: this.config.ucbConstant,
            minPullsBeforeExploitation: this.config.minPullsBeforeExploitation,
            enableContextual: this.config.enableContextual,
            contextSimilarityThreshold: this.config.contextSimilarityThreshold,
        });

        this.encoder = getContextEncoder();

        this.tracker = getOutcomeTracker(this.config.rewardConfig, {
            onOutcomeResolved: (resolution) => this.handleOutcomeResolved(resolution),
        });

        this.healthMetrics = this.createInitialHealthMetrics();
    }

    /**
     * Initialize orchestrator with arm statistics from database
     */
    async initialize(armStats?: ArmStatistics[]): Promise<void> {
        if (armStats) {
            this.sampler.initializeArms(armStats);
        } else {
            // Initialize with default arms
            this.initializeDefaultArms();
        }

        this.initialized = true;

        // Start auto-sync if enabled
        if (this.config.enableAutoSync) {
            this.startAutoSync();
        }

        this.updateHealthMetrics();
    }

    /**
     * Initialize default arms for all intervention types
     */
    private initializeDefaultArms(): void {
        const interventionTypes: InterventionType[] = [
            "interactive_hint",
            "worked_example",
            "scaffolding_content",
            "simplified_example",
            "prerequisite_review",
            "visual_aid",
            "alternative_explanation",
            "concept_bridge",
            "pace_adjustment",
            "micro_practice",
        ];

        for (const type of interventionTypes) {
            const armId = INTERVENTION_TO_ARM[type];
            this.sampler.createArm(armId, type);
        }
    }

    /**
     * Select an intervention using Thompson Sampling
     */
    selectIntervention(request: SelectionRequest): SelectionResponse {
        if (!this.initialized) {
            return {
                success: false,
                error: "Orchestrator not initialized",
            };
        }

        try {
            // Encode learner context
            const context = this.encoder.encodePartial(request.learnerContext);

            // Map intervention types to arm IDs
            const availableArmIds = request.availableInterventions.map(
                (type) => INTERVENTION_TO_ARM[type]
            );

            // Select arm
            const selection = this.sampler.selectArm(availableArmIds, context);

            if (!selection) {
                return {
                    success: false,
                    error: "No available arms for selection",
                };
            }

            // Start tracking outcome
            this.tracker.trackOutcome(
                selection.outcomeId,
                request.userId,
                request.sectionId,
                selection.armId,
                selection.interventionType,
                context,
                {
                    reason: selection.reason,
                    sampledValue: selection.sampledValue,
                    confidence: selection.confidence,
                    isExploration: selection.isExploration,
                }
            );

            // Update health metrics
            this.healthMetrics.totalSelections++;
            if (selection.isExploration) {
                this.healthMetrics.recentExplorationRate =
                    (this.healthMetrics.recentExplorationRate * 99 + 1) / 100;
            } else {
                this.healthMetrics.recentExplorationRate =
                    (this.healthMetrics.recentExplorationRate * 99) / 100;
            }

            return {
                success: true,
                selection,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Selection failed",
            };
        }
    }

    /**
     * Record outcome and calculate reward
     */
    recordReward(request: RewardRequest): RewardResponse {
        if (!this.initialized) {
            return {
                success: false,
                error: "Orchestrator not initialized",
            };
        }

        try {
            // Record any additional signals
            if (request.signals) {
                for (const signal of request.signals) {
                    switch (signal.type) {
                        case "engagement":
                            this.tracker.recordEngagement(request.outcomeId, signal.value);
                            break;
                        case "learning_gain":
                            this.tracker.recordLearningGain(request.outcomeId, signal.value);
                            break;
                        case "completion":
                            this.tracker.recordCompletion(request.outcomeId, signal.value);
                            break;
                    }
                }
            }

            // Resolve outcome
            const resolution = this.tracker.resolveOutcome(
                request.outcomeId,
                request.rawOutcome
            );

            if (!resolution) {
                return {
                    success: false,
                    error: "Outcome not found or already resolved",
                };
            }

            return {
                success: true,
                resolution,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Reward recording failed",
            };
        }
    }

    /**
     * Handle outcome resolution - update sampler
     */
    private handleOutcomeResolved(resolution: OutcomeResolution): void {
        // Get the outcome to find context
        const outcomes = this.tracker.getResolvedOutcomes();
        const outcome = outcomes.find((o) => o.id === resolution.outcomeId);

        // Update sampler
        this.sampler.updateArm(
            outcome?.armId ?? "",
            resolution.reward,
            outcome?.context
        );

        // Update health metrics
        this.healthMetrics.totalRewards += resolution.reward;
        this.healthMetrics.averageReward =
            this.healthMetrics.totalRewards / this.healthMetrics.totalSelections;

        // Check for arm retirement
        const retired = this.sampler.checkArmRetirement(
            this.config.minPullsBeforeRetirement,
            this.config.armRetirementThreshold
        );

        if (retired.length > 0) {
            this.healthMetrics.retiredArms += retired.length;
            this.healthMetrics.activeArms -= retired.length;
        }

        // Update convergence metric
        this.healthMetrics.convergenceMetric = this.sampler.getConvergenceMetric();
        this.healthMetrics.lastUpdateAt = new Date().toISOString();
    }

    /**
     * Record engagement signal for pending outcome
     */
    recordEngagement(outcomeId: string, value: number): boolean {
        return this.tracker.recordEngagement(outcomeId, value);
    }

    /**
     * Record learning gain signal for pending outcome
     */
    recordLearningGain(outcomeId: string, value: number): boolean {
        return this.tracker.recordLearningGain(outcomeId, value);
    }

    /**
     * Record completion signal for pending outcome
     */
    recordCompletion(outcomeId: string, value: number): boolean {
        return this.tracker.recordCompletion(outcomeId, value);
    }

    /**
     * Get current arm statistics
     */
    getArmStatistics(): ArmStatistics[] {
        return this.sampler.getArmStatistics();
    }

    /**
     * Get health metrics
     */
    getHealthMetrics(): BanditHealthMetrics {
        return { ...this.healthMetrics };
    }

    /**
     * Get pending outcomes count
     */
    getPendingOutcomesCount(): number {
        return this.tracker.getPendingCount();
    }

    /**
     * Get full state for persistence
     */
    exportState(): BanditState {
        const trackerState = this.tracker.exportState();
        const arms = this.sampler.getArmStatistics();

        const armsRecord: Record<string, ArmStatistics> = {};
        for (const arm of arms) {
            armsRecord[arm.armId] = arm;
        }

        return {
            arms: armsRecord,
            pendingOutcomes: trackerState.pending,
            recentOutcomes: trackerState.resolved,
            config: this.config,
            health: this.healthMetrics,
            lastSyncedAt: this.lastSyncedAt ?? new Date().toISOString(),
            version: 1,
        };
    }

    /**
     * Import state from persistence
     */
    importState(state: BanditState): void {
        // Import arms
        const arms = Object.values(state.arms);
        this.sampler.initializeArms(arms);

        // Import tracker state
        this.tracker.importState({
            pending: state.pendingOutcomes,
            resolved: state.recentOutcomes,
        });

        // Import health metrics
        if (state.health) {
            this.healthMetrics = state.health;
        }

        this.lastSyncedAt = state.lastSyncedAt;
        this.initialized = true;
    }

    /**
     * Start auto-sync with database
     */
    private startAutoSync(): void {
        if (this.syncTimeoutId) {
            clearTimeout(this.syncTimeoutId);
        }

        this.syncTimeoutId = setInterval(() => {
            this.lastSyncedAt = new Date().toISOString();
            // In a real implementation, this would sync with Supabase
        }, this.config.syncIntervalMs);
    }

    /**
     * Stop auto-sync
     */
    stopAutoSync(): void {
        if (this.syncTimeoutId) {
            clearInterval(this.syncTimeoutId);
            this.syncTimeoutId = undefined;
        }
    }

    /**
     * Update health metrics
     */
    private updateHealthMetrics(): void {
        const arms = this.sampler.getArmStatistics();

        this.healthMetrics.activeArms = arms.filter((a) => a.isActive).length;
        this.healthMetrics.retiredArms = arms.filter((a) => !a.isActive).length;
        this.healthMetrics.convergenceMetric = this.sampler.getConvergenceMetric();
        this.healthMetrics.lastUpdateAt = new Date().toISOString();
    }

    /**
     * Create initial health metrics
     */
    private createInitialHealthMetrics(): BanditHealthMetrics {
        return {
            totalSelections: 0,
            totalRewards: 0,
            averageReward: 0,
            recentExplorationRate: 0,
            activeArms: 10,
            retiredArms: 0,
            lastUpdateAt: new Date().toISOString(),
            convergenceMetric: 0,
        };
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        this.stopAutoSync();
        this.tracker.clearPending();
    }

    /**
     * Check if initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Get arm ID for intervention type
     */
    static getArmId(interventionType: InterventionType): string {
        return INTERVENTION_TO_ARM[interventionType];
    }

    /**
     * Get intervention type for arm ID
     */
    static getInterventionType(armId: string): InterventionType | undefined {
        return ARM_TO_INTERVENTION[armId];
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let orchestratorInstance: BanditOrchestrator | null = null;

export function getBanditOrchestrator(
    config?: Partial<OrchestratorConfig>
): BanditOrchestrator {
    if (!orchestratorInstance) {
        orchestratorInstance = new BanditOrchestrator(config);
    }
    return orchestratorInstance;
}

export async function initializeBanditOrchestrator(
    armStats?: ArmStatistics[],
    config?: Partial<OrchestratorConfig>
): Promise<BanditOrchestrator> {
    const orchestrator = getBanditOrchestrator(config);
    await orchestrator.initialize(armStats);
    return orchestrator;
}

export function resetBanditOrchestrator(): void {
    if (orchestratorInstance) {
        orchestratorInstance.destroy();
    }
    orchestratorInstance = null;
}
