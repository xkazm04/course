/**
 * Experiment Manager
 *
 * CRUD operations for experiments with version control.
 * Handles experiment lifecycle and validation.
 */

import type {
    Experiment,
    ExperimentVariant,
    ExperimentStatus,
    ExperimentType,
    TargetArea,
    RolloutConfig,
    RolloutStatus,
} from "./types";
import { validateVariantWeights, validateControlVariant } from "./cohortAssigner";

// ============================================================================
// Experiment Manager Class
// ============================================================================

export class ExperimentManager {
    private apiBase: string;

    constructor(apiBase: string = "/api/experiments") {
        this.apiBase = apiBase;
    }

    // ========================================================================
    // CRUD Operations
    // ========================================================================

    /**
     * Create a new experiment
     */
    async create(
        experiment: Omit<Experiment, "id" | "createdAt" | "updatedAt" | "version">
    ): Promise<Experiment> {
        // Validate before creation
        this.validateExperiment(experiment);

        const response = await fetch(this.apiBase, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(experiment),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to create experiment");
        }

        return response.json();
    }

    /**
     * Get experiment by ID
     */
    async get(id: string): Promise<Experiment | null> {
        const response = await fetch(`${this.apiBase}/${id}`);

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to fetch experiment");
        }

        return response.json();
    }

    /**
     * List experiments with optional filters
     */
    async list(filters?: {
        status?: ExperimentStatus;
        targetArea?: TargetArea;
        type?: ExperimentType;
        limit?: number;
        offset?: number;
    }): Promise<{ experiments: Experiment[]; total: number }> {
        const params = new URLSearchParams();
        if (filters?.status) params.set("status", filters.status);
        if (filters?.targetArea) params.set("targetArea", filters.targetArea);
        if (filters?.type) params.set("type", filters.type);
        if (filters?.limit) params.set("limit", String(filters.limit));
        if (filters?.offset) params.set("offset", String(filters.offset));

        const response = await fetch(`${this.apiBase}?${params.toString()}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to list experiments");
        }

        return response.json();
    }

    /**
     * Update an experiment
     */
    async update(
        id: string,
        updates: Partial<Omit<Experiment, "id" | "createdAt" | "updatedAt">>,
        expectedVersion: number
    ): Promise<Experiment> {
        const response = await fetch(`${this.apiBase}/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "If-Match": String(expectedVersion),
            },
            body: JSON.stringify(updates),
        });

        if (response.status === 409) {
            throw new Error("Experiment was modified by another user. Please refresh and try again.");
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to update experiment");
        }

        return response.json();
    }

    /**
     * Delete an experiment (only drafts)
     */
    async delete(id: string): Promise<void> {
        const response = await fetch(`${this.apiBase}/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to delete experiment");
        }
    }

    // ========================================================================
    // Lifecycle Operations
    // ========================================================================

    /**
     * Start an experiment
     */
    async start(id: string): Promise<Experiment> {
        const experiment = await this.get(id);
        if (!experiment) {
            throw new Error("Experiment not found");
        }

        if (experiment.status !== "draft" && experiment.status !== "paused") {
            throw new Error(`Cannot start experiment in ${experiment.status} status`);
        }

        // Validate before starting
        this.validateExperiment(experiment);

        return this.update(
            id,
            {
                status: "running",
                startedAt: experiment.startedAt || new Date().toISOString(),
            },
            experiment.version
        );
    }

    /**
     * Pause an experiment
     */
    async pause(id: string): Promise<Experiment> {
        const experiment = await this.get(id);
        if (!experiment) {
            throw new Error("Experiment not found");
        }

        if (experiment.status !== "running") {
            throw new Error("Can only pause running experiments");
        }

        return this.update(id, { status: "paused" }, experiment.version);
    }

    /**
     * Resume a paused experiment
     */
    async resume(id: string): Promise<Experiment> {
        const experiment = await this.get(id);
        if (!experiment) {
            throw new Error("Experiment not found");
        }

        if (experiment.status !== "paused") {
            throw new Error("Can only resume paused experiments");
        }

        return this.update(id, { status: "running" }, experiment.version);
    }

    /**
     * Conclude an experiment with a winner
     */
    async conclude(id: string, winningVariantId: string): Promise<Experiment> {
        const experiment = await this.get(id);
        if (!experiment) {
            throw new Error("Experiment not found");
        }

        if (experiment.status !== "running" && experiment.status !== "paused") {
            throw new Error("Can only conclude running or paused experiments");
        }

        // Validate winning variant exists
        const winningVariant = experiment.variants.find((v) => v.id === winningVariantId);
        if (!winningVariant) {
            throw new Error("Winning variant not found in experiment");
        }

        return this.update(
            id,
            {
                status: "concluded",
                endedAt: new Date().toISOString(),
                winningVariantId,
            },
            experiment.version
        );
    }

    /**
     * Start rollout of a concluded experiment
     */
    async startRollout(
        id: string,
        config: Partial<RolloutConfig>
    ): Promise<RolloutStatus> {
        const experiment = await this.get(id);
        if (!experiment) {
            throw new Error("Experiment not found");
        }

        if (experiment.status !== "concluded") {
            throw new Error("Can only roll out concluded experiments");
        }

        if (!experiment.winningVariantId) {
            throw new Error("No winning variant set for experiment");
        }

        const response = await fetch(`${this.apiBase}/${id}/rollout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(config),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to start rollout");
        }

        return response.json();
    }

    /**
     * Get rollout status
     */
    async getRolloutStatus(id: string): Promise<RolloutStatus | null> {
        const response = await fetch(`${this.apiBase}/${id}/rollout`);

        if (response.status === 404) {
            return null;
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to get rollout status");
        }

        return response.json();
    }

    /**
     * Update rollout percentage
     */
    async updateRolloutPercentage(
        id: string,
        percentage: number
    ): Promise<RolloutStatus> {
        const response = await fetch(`${this.apiBase}/${id}/rollout`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPercentage: percentage }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || "Failed to update rollout");
        }

        return response.json();
    }

    // ========================================================================
    // Variant Management
    // ========================================================================

    /**
     * Add a variant to an experiment
     */
    async addVariant(
        id: string,
        variant: Omit<ExperimentVariant, "id">
    ): Promise<Experiment> {
        const experiment = await this.get(id);
        if (!experiment) {
            throw new Error("Experiment not found");
        }

        if (experiment.status !== "draft") {
            throw new Error("Can only modify variants in draft experiments");
        }

        const newVariant: ExperimentVariant = {
            ...variant,
            id: crypto.randomUUID(),
        };

        const updatedVariants = [...experiment.variants, newVariant];

        return this.update(id, { variants: updatedVariants }, experiment.version);
    }

    /**
     * Update a variant
     */
    async updateVariant(
        experimentId: string,
        variantId: string,
        updates: Partial<Omit<ExperimentVariant, "id">>
    ): Promise<Experiment> {
        const experiment = await this.get(experimentId);
        if (!experiment) {
            throw new Error("Experiment not found");
        }

        if (experiment.status !== "draft") {
            throw new Error("Can only modify variants in draft experiments");
        }

        const variantIndex = experiment.variants.findIndex((v) => v.id === variantId);
        if (variantIndex === -1) {
            throw new Error("Variant not found");
        }

        const updatedVariants = [...experiment.variants];
        updatedVariants[variantIndex] = {
            ...updatedVariants[variantIndex],
            ...updates,
        };

        return this.update(experimentId, { variants: updatedVariants }, experiment.version);
    }

    /**
     * Remove a variant
     */
    async removeVariant(experimentId: string, variantId: string): Promise<Experiment> {
        const experiment = await this.get(experimentId);
        if (!experiment) {
            throw new Error("Experiment not found");
        }

        if (experiment.status !== "draft") {
            throw new Error("Can only modify variants in draft experiments");
        }

        if (experiment.variants.length <= 2) {
            throw new Error("Experiment must have at least 2 variants");
        }

        const updatedVariants = experiment.variants.filter((v) => v.id !== variantId);

        return this.update(experimentId, { variants: updatedVariants }, experiment.version);
    }

    // ========================================================================
    // Validation
    // ========================================================================

    /**
     * Validate experiment configuration
     */
    validateExperiment(
        experiment: Partial<Experiment>
    ): void {
        const errors: string[] = [];

        // Check required fields
        if (!experiment.name) {
            errors.push("Experiment name is required");
        }

        if (!experiment.primaryMetric) {
            errors.push("Primary metric is required");
        }

        if (!experiment.variants || experiment.variants.length < 2) {
            errors.push("Experiment must have at least 2 variants");
        }

        // Validate variants
        if (experiment.variants) {
            if (!validateVariantWeights(experiment.variants)) {
                errors.push("Variant weights must sum to 100%");
            }

            if (!validateControlVariant(experiment.variants)) {
                errors.push("Experiment must have exactly one control variant");
            }

            // Check for unique variant IDs
            const variantIds = experiment.variants.map((v) => v.id);
            if (new Set(variantIds).size !== variantIds.length) {
                errors.push("Variant IDs must be unique");
            }
        }

        // Validate significance threshold
        if (
            experiment.significanceThreshold !== undefined &&
            (experiment.significanceThreshold <= 0 || experiment.significanceThreshold >= 1)
        ) {
            errors.push("Significance threshold must be between 0 and 1");
        }

        // Validate traffic allocation
        if (
            experiment.trafficAllocation !== undefined &&
            (experiment.trafficAllocation < 0 || experiment.trafficAllocation > 100)
        ) {
            errors.push("Traffic allocation must be between 0 and 100");
        }

        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join(", ")}`);
        }
    }

    // ========================================================================
    // Helpers
    // ========================================================================

    /**
     * Create a default A/B test structure
     */
    static createDefaultABTest(
        name: string,
        targetArea: TargetArea,
        primaryMetric: string
    ): Omit<Experiment, "id" | "createdAt" | "updatedAt" | "version"> {
        return {
            name,
            type: "ab_test",
            targetArea,
            status: "draft",
            variants: [
                {
                    id: crypto.randomUUID(),
                    name: "Control",
                    weight: 50,
                    isControl: true,
                    config: {},
                },
                {
                    id: crypto.randomUUID(),
                    name: "Treatment",
                    weight: 50,
                    isControl: false,
                    config: {},
                },
            ],
            trafficAllocation: 100,
            primaryMetric,
            secondaryMetrics: [],
            minSampleSize: 100,
            significanceThreshold: 0.05,
        };
    }

    /**
     * Clone an experiment as a new draft
     */
    async clone(id: string, newName: string): Promise<Experiment> {
        const original = await this.get(id);
        if (!original) {
            throw new Error("Experiment not found");
        }

        const cloned: Omit<Experiment, "id" | "createdAt" | "updatedAt" | "version"> = {
            name: newName,
            description: original.description,
            type: original.type,
            targetArea: original.targetArea,
            status: "draft",
            variants: original.variants.map((v) => ({
                ...v,
                id: crypto.randomUUID(),
            })),
            trafficAllocation: original.trafficAllocation,
            targeting: original.targeting,
            primaryMetric: original.primaryMetric,
            secondaryMetrics: original.secondaryMetrics,
            minSampleSize: original.minSampleSize,
            significanceThreshold: original.significanceThreshold,
            metadata: {
                ...original.metadata,
                clonedFrom: id,
            },
        };

        return this.create(cloned);
    }
}

// ============================================================================
// Default Instance
// ============================================================================

export const experimentManager = new ExperimentManager();
