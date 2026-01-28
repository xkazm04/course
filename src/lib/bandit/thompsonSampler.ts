/**
 * Thompson Sampler
 *
 * Implements Thompson Sampling with Beta priors for multi-armed bandit
 * intervention selection. Provides principled exploration/exploitation
 * through posterior sampling.
 */

import type {
    ArmStatistics,
    BetaParameters,
    SelectionResult,
    InterventionType,
    EncodedContext,
} from "./types";

// ============================================================================
// Beta Distribution Sampling
// ============================================================================

/**
 * Sample from Beta distribution using the Jöhnk algorithm
 * This is a rejection sampling method that works well for all parameter values
 */
export function sampleBeta(alpha: number, beta: number): number {
    // Handle edge cases
    if (alpha <= 0 || beta <= 0) {
        throw new Error(`Invalid beta parameters: alpha=${alpha}, beta=${beta}`);
    }

    // Use gamma sampling method for better numerical stability
    const gammaAlpha = sampleGamma(alpha, 1);
    const gammaBeta = sampleGamma(beta, 1);

    return gammaAlpha / (gammaAlpha + gammaBeta);
}

/**
 * Sample from Gamma distribution using Marsaglia and Tsang's method
 */
function sampleGamma(shape: number, scale: number): number {
    if (shape < 1) {
        // For shape < 1, use Ahrens-Dieter method
        const u = Math.random();
        return sampleGamma(1 + shape, scale) * Math.pow(u, 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
        let x: number;
        let v: number;

        do {
            x = randomNormal();
            v = 1 + c * x;
        } while (v <= 0);

        v = v * v * v;
        const u = Math.random();

        if (u < 1 - 0.0331 * x * x * x * x) {
            return d * v * scale;
        }

        if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
            return d * v * scale;
        }
    }
}

/**
 * Sample from standard normal distribution using Box-Muller transform
 */
function randomNormal(): number {
    const u1 = Math.random();
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

// ============================================================================
// UCB1 Calculation
// ============================================================================

/**
 * Calculate UCB1 value for an arm
 * Used as fallback during cold start or when Thompson Sampling is disabled
 */
export function calculateUCB1(
    armPulls: number,
    totalPulls: number,
    averageReward: number,
    ucbConstant: number = 2
): number {
    if (armPulls === 0) {
        return Infinity; // Unexplored arms have infinite UCB
    }

    if (totalPulls <= 0) {
        return averageReward;
    }

    const explorationBonus = ucbConstant * Math.sqrt(Math.log(totalPulls) / armPulls);
    return averageReward + explorationBonus;
}

// ============================================================================
// Thompson Sampler Class
// ============================================================================

export interface ThompsonSamplerConfig {
    priorAlpha: number;
    priorBeta: number;
    ucbConstant: number;
    minPullsBeforeExploitation: number;
    enableContextual: boolean;
    contextSimilarityThreshold: number;
}

export class ThompsonSampler {
    private config: ThompsonSamplerConfig;
    private arms: Map<string, ArmStatistics>;
    private totalPulls: number;

    constructor(config: Partial<ThompsonSamplerConfig> = {}) {
        this.config = {
            priorAlpha: config.priorAlpha ?? 1,
            priorBeta: config.priorBeta ?? 1,
            ucbConstant: config.ucbConstant ?? 2,
            minPullsBeforeExploitation: config.minPullsBeforeExploitation ?? 10,
            enableContextual: config.enableContextual ?? true,
            contextSimilarityThreshold: config.contextSimilarityThreshold ?? 0.7,
        };
        this.arms = new Map();
        this.totalPulls = 0;
    }

    /**
     * Initialize arms from database or defaults
     */
    initializeArms(armStats: ArmStatistics[]): void {
        this.arms.clear();
        this.totalPulls = 0;

        for (const arm of armStats) {
            this.arms.set(arm.armId, arm);
            this.totalPulls += arm.totalPulls;
        }
    }

    /**
     * Get or create arm statistics
     */
    getArm(armId: string): ArmStatistics | undefined {
        return this.arms.get(armId);
    }

    /**
     * Create a new arm with default priors
     */
    createArm(armId: string, interventionType: InterventionType): ArmStatistics {
        const arm: ArmStatistics = {
            armId,
            interventionType,
            totalPulls: 0,
            totalReward: 0,
            betaParams: {
                alpha: this.config.priorAlpha,
                beta: this.config.priorBeta,
            },
            ucb1Value: Infinity,
            averageReward: 0,
            lastUpdated: new Date().toISOString(),
            isActive: true,
            contextStats: new Map(),
        };

        this.arms.set(armId, arm);
        return arm;
    }

    /**
     * Select an arm using Thompson Sampling
     */
    selectArm(
        availableArmIds: string[],
        context?: EncodedContext
    ): SelectionResult | null {
        const activeArms = availableArmIds
            .map((id) => this.arms.get(id))
            .filter((arm): arm is ArmStatistics => arm !== undefined && arm.isActive);

        if (activeArms.length === 0) {
            return null;
        }

        // Check if we need warm-start exploration
        const needsWarmStart = this.totalPulls < this.config.minPullsBeforeExploitation;

        let selectedArm: ArmStatistics;
        let sampledValue: number;
        let reason: SelectionResult["reason"];
        let isExploration: boolean;

        if (needsWarmStart) {
            // During warm start, use round-robin or UCB1
            const leastPulledArm = this.selectLeastPulled(activeArms);
            selectedArm = leastPulledArm;
            sampledValue = calculateUCB1(
                leastPulledArm.totalPulls,
                this.totalPulls,
                leastPulledArm.averageReward,
                this.config.ucbConstant
            );
            reason = "warm_start";
            isExploration = true;
        } else {
            // Thompson Sampling: sample from posterior and select max
            const samples = this.sampleAllArms(activeArms, context);
            const sorted = samples.sort((a, b) => b.sample - a.sample);

            selectedArm = sorted[0].arm;
            sampledValue = sorted[0].sample;
            reason = "thompson_sampling";

            // Determine if this is exploration
            // (selected arm has significantly fewer pulls than average)
            const avgPulls = this.totalPulls / activeArms.length;
            isExploration = selectedArm.totalPulls < avgPulls * 0.5;
        }

        // Calculate confidence based on number of pulls
        const confidence = this.calculateConfidence(selectedArm);

        // Generate outcome tracking ID
        const outcomeId = this.generateOutcomeId();

        // Build alternatives list
        const alternatives = activeArms
            .filter((arm) => arm.armId !== selectedArm.armId)
            .map((arm) => {
                const betaParams = this.getEffectiveBetaParams(arm, context);
                return {
                    armId: arm.armId,
                    sampledValue: sampleBeta(betaParams.alpha, betaParams.beta),
                };
            })
            .slice(0, 5); // Top 5 alternatives

        return {
            armId: selectedArm.armId,
            interventionType: selectedArm.interventionType,
            sampledValue,
            reason,
            isExploration,
            confidence,
            outcomeId,
            alternatives,
        };
    }

    /**
     * Sample from all arms' posteriors
     */
    private sampleAllArms(
        arms: ArmStatistics[],
        context?: EncodedContext
    ): Array<{ arm: ArmStatistics; sample: number }> {
        return arms.map((arm) => {
            const betaParams = this.getEffectiveBetaParams(arm, context);
            const sample = sampleBeta(betaParams.alpha, betaParams.beta);
            return { arm, sample };
        });
    }

    /**
     * Get effective beta parameters (global or contextual)
     */
    private getEffectiveBetaParams(
        arm: ArmStatistics,
        context?: EncodedContext
    ): BetaParameters {
        if (!this.config.enableContextual || !context) {
            return arm.betaParams;
        }

        // Try to find contextual stats
        const contextStats = arm.contextStats.get(context.contextHash);

        if (contextStats && contextStats.pulls >= 5) {
            // Use contextual parameters if we have enough data
            return contextStats.betaParams;
        }

        // Check for similar contexts
        const similarContext = this.findSimilarContext(arm, context);

        if (similarContext) {
            // Blend contextual and global parameters
            return this.blendBetaParams(arm.betaParams, similarContext.betaParams, 0.5);
        }

        // Fall back to global parameters
        return arm.betaParams;
    }

    /**
     * Find a similar context in the arm's history
     */
    private findSimilarContext(
        arm: ArmStatistics,
        context: EncodedContext
    ): { betaParams: BetaParameters } | null {
        let bestMatch: { similarity: number; betaParams: BetaParameters } | null = null;

        for (const [, stats] of arm.contextStats) {
            if (stats.pulls < 3) continue; // Need minimum data

            // Simple hash similarity (in production, use feature similarity)
            const similarity = this.hashSimilarity(context.contextHash, stats.contextHash);

            if (
                similarity >= this.config.contextSimilarityThreshold &&
                (!bestMatch || similarity > bestMatch.similarity)
            ) {
                bestMatch = {
                    similarity,
                    betaParams: stats.betaParams,
                };
            }
        }

        return bestMatch;
    }

    /**
     * Simple hash similarity (placeholder - use cosine similarity on features)
     */
    private hashSimilarity(hash1: string, hash2: string): number {
        if (hash1 === hash2) return 1;

        // Simple Jaccard-like similarity on hash characters
        const set1 = new Set(hash1.split(""));
        const set2 = new Set(hash2.split(""));

        const intersection = [...set1].filter((c) => set2.has(c)).length;
        const union = new Set([...set1, ...set2]).size;

        return intersection / union;
    }

    /**
     * Blend two beta distributions
     */
    private blendBetaParams(
        params1: BetaParameters,
        params2: BetaParameters,
        weight2: number
    ): BetaParameters {
        const weight1 = 1 - weight2;
        return {
            alpha: params1.alpha * weight1 + params2.alpha * weight2,
            beta: params1.beta * weight1 + params2.beta * weight2,
        };
    }

    /**
     * Select arm with fewest pulls (for warm start)
     */
    private selectLeastPulled(arms: ArmStatistics[]): ArmStatistics {
        return arms.reduce((min, arm) =>
            arm.totalPulls < min.totalPulls ? arm : min
        );
    }

    /**
     * Calculate confidence based on number of pulls
     */
    private calculateConfidence(arm: ArmStatistics): number {
        // Confidence grows logarithmically with pulls
        // 0.5 at 1 pull, ~0.8 at 10 pulls, ~0.9 at 100 pulls
        const pulls = Math.max(1, arm.totalPulls);
        return Math.min(0.99, 0.5 + 0.15 * Math.log10(pulls));
    }

    /**
     * Generate unique outcome ID
     */
    private generateOutcomeId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 10);
        return `outcome_${timestamp}_${random}`;
    }

    /**
     * Update arm statistics after receiving reward
     */
    updateArm(
        armId: string,
        reward: number,
        context?: EncodedContext
    ): void {
        const arm = this.arms.get(armId);
        if (!arm) {
            throw new Error(`Arm not found: ${armId}`);
        }

        // Convert reward to binary outcome (success/failure)
        const isSuccess = reward > 0.5;

        // Update global statistics
        arm.totalPulls += 1;
        arm.totalReward += reward;
        arm.averageReward = arm.totalReward / arm.totalPulls;

        // Update beta parameters
        if (isSuccess) {
            arm.betaParams.alpha += 1;
        } else {
            arm.betaParams.beta += 1;
        }

        // Update UCB1 value
        this.totalPulls += 1;
        arm.ucb1Value = calculateUCB1(
            arm.totalPulls,
            this.totalPulls,
            arm.averageReward,
            this.config.ucbConstant
        );

        arm.lastUpdated = new Date().toISOString();

        // Update contextual statistics
        if (this.config.enableContextual && context) {
            this.updateContextualStats(arm, context, reward, isSuccess);
        }
    }

    /**
     * Update context-specific statistics
     */
    private updateContextualStats(
        arm: ArmStatistics,
        context: EncodedContext,
        reward: number,
        isSuccess: boolean
    ): void {
        let stats = arm.contextStats.get(context.contextHash);

        if (!stats) {
            stats = {
                contextHash: context.contextHash,
                pulls: 0,
                rewards: 0,
                betaParams: {
                    alpha: this.config.priorAlpha,
                    beta: this.config.priorBeta,
                },
            };
            arm.contextStats.set(context.contextHash, stats);
        }

        stats.pulls += 1;
        stats.rewards += reward;

        if (isSuccess) {
            stats.betaParams.alpha += 1;
        } else {
            stats.betaParams.beta += 1;
        }
    }

    /**
     * Check if any arms should be retired
     */
    checkArmRetirement(
        minPulls: number = 50,
        threshold: number = 0.1
    ): ArmStatistics[] {
        const retired: ArmStatistics[] = [];

        for (const arm of this.arms.values()) {
            if (
                arm.isActive &&
                arm.totalPulls >= minPulls &&
                arm.averageReward < threshold
            ) {
                arm.isActive = false;
                arm.lastUpdated = new Date().toISOString();
                retired.push(arm);
            }
        }

        return retired;
    }

    /**
     * Reactivate a retired arm
     */
    reactivateArm(armId: string): boolean {
        const arm = this.arms.get(armId);
        if (!arm || arm.isActive) {
            return false;
        }

        arm.isActive = true;
        arm.lastUpdated = new Date().toISOString();
        return true;
    }

    /**
     * Get current arm statistics for persistence
     */
    getArmStatistics(): ArmStatistics[] {
        return Array.from(this.arms.values());
    }

    /**
     * Get exploration rate over recent selections
     */
    getExplorationRate(): number {
        // This would need to be tracked externally
        // For now, return estimate based on arm pull distribution
        if (this.totalPulls === 0) return 1;

        const avgPulls = this.totalPulls / this.arms.size;
        let underExplored = 0;

        for (const arm of this.arms.values()) {
            if (arm.totalPulls < avgPulls * 0.5) {
                underExplored++;
            }
        }

        return underExplored / this.arms.size;
    }

    /**
     * Get convergence metric (variance of arm values)
     */
    getConvergenceMetric(): number {
        const values: number[] = [];

        for (const arm of this.arms.values()) {
            if (arm.isActive && arm.totalPulls > 0) {
                values.push(arm.averageReward);
            }
        }

        if (values.length < 2) return 0;

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance =
            values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;

        return Math.sqrt(variance);
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let samplerInstance: ThompsonSampler | null = null;

export function getThompsonSampler(
    config?: Partial<ThompsonSamplerConfig>
): ThompsonSampler {
    if (!samplerInstance) {
        samplerInstance = new ThompsonSampler(config);
    }
    return samplerInstance;
}

export function resetThompsonSampler(): void {
    samplerInstance = null;
}
