/**
 * Intent Resolver - Core Abstract Class
 *
 * The IntentResolver is the foundational abstraction for transforming user intents
 * into structured, actionable plans. This pattern enables consistent plan generation
 * across multiple features: learning paths, project planning, skill gap analysis,
 * and course recommendations.
 *
 * Key Design Principles:
 * 1. Single Responsibility: Each resolver handles one intent type
 * 2. Open/Closed: Easy to add new resolvers without modifying existing code
 * 3. Dependency Inversion: Resolvers depend on abstractions, not concrete implementations
 * 4. Template Method: Defines the skeleton of resolution, subclasses fill in specifics
 */

import {
    Intent,
    IntentType,
    Constraints,
    ResolutionContext,
    ResolutionResult,
    ResolvedPlan,
    PlanModule,
    PlanStep,
    Milestone,
    PlanMetrics,
    PlanRecommendation,
    MissingInput,
    Priority,
    Resource,
} from "./types";

// ============================================================================
// RESOLVER CONFIGURATION
// ============================================================================

/**
 * Configuration options for an IntentResolver
 */
export interface ResolverConfig {
    /** Enable verbose logging */
    debug?: boolean;
    /** Maximum resolution time in ms before timeout */
    timeoutMs?: number;
    /** Whether to simulate async behavior (for demo/testing) */
    simulateAsync?: boolean;
    /** Simulated delay in ms when simulateAsync is true */
    simulatedDelayMs?: number;
}

const DEFAULT_CONFIG: Required<ResolverConfig> = {
    debug: false,
    timeoutMs: 30000,
    simulateAsync: true,
    simulatedDelayMs: 1500,
};

// ============================================================================
// ABSTRACT INTENT RESOLVER
// ============================================================================

/**
 * Abstract base class for all intent resolvers.
 *
 * Subclasses must implement:
 * - `resolverType`: The intent type this resolver handles
 * - `validateIntent`: Validate the specific intent
 * - `generatePlan`: Generate the plan for the specific intent
 *
 * @template T - The specific Intent type this resolver handles
 */
export abstract class IntentResolver<T extends Intent = Intent> {
    protected config: Required<ResolverConfig>;

    constructor(config: ResolverConfig = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * The intent type this resolver handles
     */
    abstract readonly resolverType: IntentType;

    /**
     * Validate the intent and return any missing required inputs
     */
    protected abstract validateIntent(intent: T): MissingInput[];

    /**
     * Generate the plan for the given intent
     */
    protected abstract generatePlan(
        intent: T,
        constraints: Constraints,
        context: ResolutionContext
    ): ResolvedPlan;

    /**
     * Resolve an intent into a structured plan.
     * This is the main entry point for plan generation.
     */
    async resolve(
        intent: T,
        constraints: Constraints,
        context: ResolutionContext
    ): Promise<ResolutionResult> {
        const startTime = Date.now();

        try {
            // Validate intent type
            if (intent.type !== this.resolverType) {
                return this.createFailureResult(
                    `Invalid intent type. Expected '${this.resolverType}', got '${intent.type}'`,
                    startTime
                );
            }

            // Validate required fields
            const missingInputs = this.validateIntent(intent);
            if (missingInputs.length > 0) {
                return {
                    status: "requires-input",
                    missingInput: missingInputs,
                    durationMs: Date.now() - startTime,
                };
            }

            // Simulate async behavior if configured
            if (this.config.simulateAsync) {
                await this.delay(this.config.simulatedDelayMs);
            }

            // Generate the plan
            const plan = this.generatePlan(intent, constraints, context);

            // Generate recommendations based on plan analysis
            const recommendations = this.analyzeAndRecommend(plan, constraints);
            plan.recommendations = [...plan.recommendations, ...recommendations];

            return {
                status: "completed",
                plan,
                durationMs: Date.now() - startTime,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error occurred";
            return this.createFailureResult(message, startTime);
        }
    }

    /**
     * Synchronous version of resolve (no async delay simulation)
     */
    resolveSync(
        intent: T,
        constraints: Constraints,
        context: ResolutionContext
    ): ResolutionResult {
        const startTime = Date.now();

        try {
            if (intent.type !== this.resolverType) {
                return this.createFailureResult(
                    `Invalid intent type. Expected '${this.resolverType}', got '${intent.type}'`,
                    startTime
                );
            }

            const missingInputs = this.validateIntent(intent);
            if (missingInputs.length > 0) {
                return {
                    status: "requires-input",
                    missingInput: missingInputs,
                    durationMs: Date.now() - startTime,
                };
            }

            const plan = this.generatePlan(intent, constraints, context);
            const recommendations = this.analyzeAndRecommend(plan, constraints);
            plan.recommendations = [...plan.recommendations, ...recommendations];

            return {
                status: "completed",
                plan,
                durationMs: Date.now() - startTime,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error occurred";
            return this.createFailureResult(message, startTime);
        }
    }

    /**
     * Analyze the plan and generate additional recommendations
     */
    protected analyzeAndRecommend(
        plan: ResolvedPlan,
        constraints: Constraints
    ): PlanRecommendation[] {
        const recommendations: PlanRecommendation[] = [];

        // Check if plan is too aggressive
        if (plan.metrics.estimatedWeeks < 4 && plan.metrics.totalHours > 100) {
            recommendations.push({
                type: "warning",
                title: "Intense Schedule",
                message: "This plan requires significant time commitment. Consider extending the deadline for a more sustainable pace.",
                action: "Consider extending deadline to " + Math.ceil(plan.metrics.estimatedWeeks * 1.5) + " weeks",
            });
        }

        // Check for low confidence
        if (plan.metrics.confidenceScore < 70) {
            recommendations.push({
                type: "optimization",
                title: "Provide More Details",
                message: "Adding more information about your goals and preferences would help generate a more accurate plan.",
            });
        }

        // Check for resource constraints
        if (constraints.resources?.budget !== undefined && constraints.resources.budget !== null) {
            if (constraints.resources.budget < 50) {
                recommendations.push({
                    type: "alternative",
                    title: "Free Resources Available",
                    message: "Given your budget constraints, we've prioritized free and open-source resources in your plan.",
                });
            }
        }

        return recommendations;
    }

    /**
     * Helper to create a failure result
     */
    protected createFailureResult(error: string, startTime: number): ResolutionResult {
        return {
            status: "failed",
            error,
            durationMs: Date.now() - startTime,
        };
    }

    /**
     * Helper to generate a unique ID
     */
    protected generateId(prefix: string = "item"): string {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Helper to create a plan step
     */
    protected createStep(
        title: string,
        description: string,
        estimatedHours: number,
        options: Partial<PlanStep> = {}
    ): PlanStep {
        return {
            id: this.generateId("step"),
            title,
            description,
            estimatedHours,
            priority: options.priority ?? "medium",
            dependencies: options.dependencies ?? [],
            resources: options.resources ?? [],
            skillsGained: options.skillsGained ?? [],
            metadata: options.metadata ?? {},
        };
    }

    /**
     * Helper to create a plan module
     */
    protected createModule(
        name: string,
        description: string,
        order: number,
        topics: string[],
        steps: PlanStep[],
        options: Partial<PlanModule> = {}
    ): PlanModule {
        const estimatedHours = steps.reduce((sum, step) => sum + step.estimatedHours, 0);
        return {
            id: this.generateId("module"),
            name,
            description,
            order,
            estimatedHours,
            topics,
            steps,
            prerequisites: options.prerequisites ?? [],
        };
    }

    /**
     * Helper to create a milestone
     */
    protected createMilestone(
        title: string,
        description: string,
        targetWeek: number,
        completionCriteria: string[],
        stepIds: string[]
    ): Milestone {
        return {
            id: this.generateId("milestone"),
            title,
            description,
            targetWeek,
            completionCriteria,
            stepIds,
        };
    }

    /**
     * Helper to calculate plan metrics
     */
    protected calculateMetrics(
        modules: PlanModule[],
        hoursPerWeek: number,
        confidenceScore: number = 80
    ): PlanMetrics {
        const totalHours = modules.reduce((sum, m) => sum + m.estimatedHours, 0);
        const topicCount = modules.reduce((sum, m) => sum + m.topics.length, 0);
        const projectCount = modules.filter(m =>
            m.steps.some(s => s.title.toLowerCase().includes("project") ||
                            s.title.toLowerCase().includes("build"))
        ).length;

        return {
            totalHours,
            moduleCount: modules.length,
            topicCount,
            projectCount: Math.max(1, projectCount),
            estimatedWeeks: Math.ceil(totalHours / hoursPerWeek),
            confidenceScore,
        };
    }

    /**
     * Helper for async delay
     */
    protected delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Debug logging helper
     */
    protected log(message: string, data?: unknown): void {
        if (this.config.debug) {
            console.log(`[IntentResolver:${this.resolverType}] ${message}`, data ?? "");
        }
    }
}

// ============================================================================
// RESOLVER REGISTRY
// ============================================================================

/**
 * Registry for managing multiple intent resolvers.
 * Allows dynamic routing of intents to appropriate resolvers.
 */
export class ResolverRegistry {
    private resolvers: Map<IntentType, IntentResolver> = new Map();

    /**
     * Register a resolver for an intent type
     */
    register<T extends Intent>(resolver: IntentResolver<T>): void {
        this.resolvers.set(resolver.resolverType, resolver as IntentResolver);
    }

    /**
     * Get a resolver for an intent type
     */
    get<T extends Intent>(type: IntentType): IntentResolver<T> | undefined {
        return this.resolvers.get(type) as IntentResolver<T> | undefined;
    }

    /**
     * Check if a resolver exists for an intent type
     */
    has(type: IntentType): boolean {
        return this.resolvers.has(type);
    }

    /**
     * Resolve an intent using the appropriate resolver
     */
    async resolve(
        intent: Intent,
        constraints: Constraints,
        context: ResolutionContext
    ): Promise<ResolutionResult> {
        const resolver = this.resolvers.get(intent.type);
        if (!resolver) {
            return {
                status: "failed",
                error: `No resolver registered for intent type: ${intent.type}`,
                durationMs: 0,
            };
        }
        return resolver.resolve(intent, constraints, context);
    }

    /**
     * Get all registered intent types
     */
    getRegisteredTypes(): IntentType[] {
        return Array.from(this.resolvers.keys());
    }
}
