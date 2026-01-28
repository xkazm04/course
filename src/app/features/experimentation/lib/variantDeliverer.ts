/**
 * Variant Deliverer
 *
 * Serves the appropriate variant configuration for a user.
 * Integrates with cohort assignment and provides variant config access.
 */

import type {
    Experiment,
    ExperimentVariant,
    CohortAssignment,
    TargetArea,
} from "./types";
import {
    assignCohort,
    getCachedAssignment,
    preloadAssignments,
} from "./cohortAssigner";

// ============================================================================
// Types
// ============================================================================

/**
 * Delivered variant result
 */
export interface DeliveredVariant {
    /** Experiment ID */
    experimentId: string;
    /** Experiment name */
    experimentName: string;
    /** Variant ID */
    variantId: string;
    /** Variant name */
    variantName: string;
    /** Whether this is the control variant */
    isControl: boolean;
    /** Variant configuration */
    config: Record<string, unknown>;
    /** Assignment info */
    assignment: CohortAssignment;
}

/**
 * Variant delivery context
 */
export interface DeliveryContext {
    userId: string;
    courseId?: string;
    domainId?: string;
    isNewUser?: boolean;
    sessionCount?: number;
    cohorts?: string[];
}

// ============================================================================
// Variant Deliverer Class
// ============================================================================

export class VariantDeliverer {
    private experiments: Map<string, Experiment> = new Map();
    private experimentsByArea: Map<TargetArea, Experiment[]> = new Map();

    /**
     * Load experiments from API or cache
     */
    async loadExperiments(apiBase: string = "/api/experiments"): Promise<void> {
        try {
            const response = await fetch(`${apiBase}?status=running`);
            if (!response.ok) {
                throw new Error("Failed to load experiments");
            }

            const { experiments } = await response.json();
            this.indexExperiments(experiments);
        } catch (error) {
            console.error("Failed to load experiments:", error);
        }
    }

    /**
     * Index experiments for fast lookup
     */
    indexExperiments(experiments: Experiment[]): void {
        this.experiments.clear();
        this.experimentsByArea.clear();

        for (const experiment of experiments) {
            this.experiments.set(experiment.id, experiment);

            const areaExperiments = this.experimentsByArea.get(experiment.targetArea) || [];
            areaExperiments.push(experiment);
            this.experimentsByArea.set(experiment.targetArea, areaExperiments);
        }
    }

    /**
     * Add a single experiment (for real-time updates)
     */
    addExperiment(experiment: Experiment): void {
        this.experiments.set(experiment.id, experiment);

        const areaExperiments = this.experimentsByArea.get(experiment.targetArea) || [];
        const existingIndex = areaExperiments.findIndex((e) => e.id === experiment.id);
        if (existingIndex >= 0) {
            areaExperiments[existingIndex] = experiment;
        } else {
            areaExperiments.push(experiment);
        }
        this.experimentsByArea.set(experiment.targetArea, areaExperiments);
    }

    /**
     * Remove an experiment
     */
    removeExperiment(experimentId: string): void {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) return;

        this.experiments.delete(experimentId);

        const areaExperiments = this.experimentsByArea.get(experiment.targetArea) || [];
        const filtered = areaExperiments.filter((e) => e.id !== experimentId);
        this.experimentsByArea.set(experiment.targetArea, filtered);
    }

    /**
     * Preload user assignments from database
     */
    preloadUserAssignments(
        assignments: Array<{
            experimentId: string;
            userId: string;
            variantId: string;
            assignedAt: string;
            experimentVersion: number;
        }>
    ): void {
        preloadAssignments(assignments);
    }

    /**
     * Get variant for a specific experiment
     */
    getVariantForExperiment(
        experimentId: string,
        context: DeliveryContext
    ): DeliveredVariant | null {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            return null;
        }

        return this.deliverVariant(experiment, context);
    }

    /**
     * Get variants for a target area
     */
    getVariantsForArea(
        targetArea: TargetArea,
        context: DeliveryContext
    ): DeliveredVariant[] {
        const experiments = this.experimentsByArea.get(targetArea) || [];
        const delivered: DeliveredVariant[] = [];

        for (const experiment of experiments) {
            const variant = this.deliverVariant(experiment, context);
            if (variant) {
                delivered.push(variant);
            }
        }

        return delivered;
    }

    /**
     * Get all variants for a user across all areas
     */
    getAllVariants(context: DeliveryContext): Map<TargetArea, DeliveredVariant[]> {
        const result = new Map<TargetArea, DeliveredVariant[]>();

        for (const area of this.experimentsByArea.keys()) {
            const variants = this.getVariantsForArea(area, context);
            if (variants.length > 0) {
                result.set(area, variants);
            }
        }

        return result;
    }

    /**
     * Get a specific config value from an experiment variant
     */
    getConfigValue<T>(
        experimentId: string,
        configKey: string,
        context: DeliveryContext,
        defaultValue: T
    ): T {
        const variant = this.getVariantForExperiment(experimentId, context);
        if (!variant) {
            return defaultValue;
        }

        const value = variant.config[configKey];
        return value !== undefined ? (value as T) : defaultValue;
    }

    /**
     * Check if user is in treatment for an experiment
     */
    isInTreatment(experimentId: string, context: DeliveryContext): boolean {
        const variant = this.getVariantForExperiment(experimentId, context);
        return variant !== null && !variant.isControl;
    }

    /**
     * Get control variant for an experiment
     */
    getControlVariant(experimentId: string): ExperimentVariant | null {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            return null;
        }

        return experiment.variants.find((v) => v.isControl) || null;
    }

    // ========================================================================
    // Private Methods
    // ========================================================================

    /**
     * Deliver variant for an experiment
     */
    private deliverVariant(
        experiment: Experiment,
        context: DeliveryContext
    ): DeliveredVariant | null {
        // Check for cached assignment first
        const cached = getCachedAssignment(experiment.id, context.userId);
        if (cached && cached.experimentVersion === experiment.version) {
            const variant = experiment.variants.find((v) => v.id === cached.variantId);
            if (variant) {
                return {
                    experimentId: experiment.id,
                    experimentName: experiment.name,
                    variantId: variant.id,
                    variantName: variant.name,
                    isControl: variant.isControl,
                    config: variant.config,
                    assignment: {
                        experimentId: experiment.id,
                        userId: context.userId,
                        variantId: variant.id,
                        assignedAt: cached.assignedAt,
                        hashValue: 0, // Not available from cache
                        cached: true,
                    },
                };
            }
        }

        // Perform new assignment
        const assignment = assignCohort(experiment, context.userId, {
            courseId: context.courseId,
            domainId: context.domainId,
            isNewUser: context.isNewUser,
            sessionCount: context.sessionCount,
            cohorts: context.cohorts,
        });

        if (!assignment) {
            return null;
        }

        const variant = experiment.variants.find((v) => v.id === assignment.variantId);
        if (!variant) {
            return null;
        }

        return {
            experimentId: experiment.id,
            experimentName: experiment.name,
            variantId: variant.id,
            variantName: variant.name,
            isControl: variant.isControl,
            config: variant.config,
            assignment,
        };
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const variantDeliverer = new VariantDeliverer();

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Initialize variant deliverer with experiments
 */
export async function initializeVariantDeliverer(
    apiBase?: string
): Promise<VariantDeliverer> {
    await variantDeliverer.loadExperiments(apiBase);
    return variantDeliverer;
}

/**
 * Get orchestration variant for conductor decisions
 */
export function getOrchestrationVariant(
    context: DeliveryContext
): DeliveredVariant | null {
    const variants = variantDeliverer.getVariantsForArea("orchestration", context);
    return variants[0] || null;
}

/**
 * Get slot variant for UI components
 */
export function getSlotVariant(
    experimentId: string,
    context: DeliveryContext
): DeliveredVariant | null {
    return variantDeliverer.getVariantForExperiment(experimentId, context);
}

/**
 * Get content variant
 */
export function getContentVariant(
    experimentId: string,
    context: DeliveryContext
): Record<string, unknown> {
    const variant = variantDeliverer.getVariantForExperiment(experimentId, context);
    return variant?.config || {};
}

/**
 * Get timing configuration from experiment
 */
export function getTimingConfig<T>(
    experimentId: string,
    configKey: string,
    context: DeliveryContext,
    defaultValue: T
): T {
    return variantDeliverer.getConfigValue(experimentId, configKey, context, defaultValue);
}
