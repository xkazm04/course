/**
 * Signal Pipeline Presets
 *
 * Pre-configured pipeline templates for common use cases:
 * - Learning signals (comprehension tracking)
 * - Contribution events (PR timeline tracking)
 * - Quality metrics (code analysis)
 * - User velocity (engagement tracking)
 */

import { pipeline, createSignal, countByType, average, thresholdDecision } from "./PipelineBuilder";
import { BaseSignal, PipelineConfig } from "./types";

// ============================================================================
// Learning Signal Types (compatible with adaptive-content)
// ============================================================================

export interface LearningSignal extends BaseSignal {
    type: "quiz" | "playground" | "sectionTime" | "errorPattern" | "video" | "navigation";
    sectionId?: string;
    score?: number;
    timeSpentMs?: number;
    errorCount?: number;
    successCount?: number;
}

export interface LearningAggregate {
    totalSignals: number;
    signalsByType: Record<string, number>;
    averageScore: number;
    totalTimeSpentMs: number;
    errorRate: number;
    successRate: number;
    sectionProgress: Record<string, number>;
    lastActivity: number;
}

export type ComprehensionLevel = "beginner" | "intermediate" | "advanced";

export interface LearningDecision {
    level: ComprehensionLevel;
    confidence: number;
    recommendations: string[];
}

/**
 * Create a learning signal pipeline
 */
export function createLearningPipeline(
    courseId: string,
    userId?: string
): PipelineConfig<LearningSignal, LearningSignal, LearningAggregate, LearningDecision> {
    return pipeline(`learning-${courseId}${userId ? `-${userId}` : ""}`)
        .id(`learning-pipeline-${courseId}`)
        .version(1)
        .collect<LearningSignal, LearningSignal>(
            (input) => ({
                ...input,
                id: input.id || createSignal(input.type, {}).id,
                timestamp: input.timestamp || Date.now(),
            }),
            {
                validate: (input) => !!input.type,
            }
        )
        .aggregate<LearningAggregate>(
            (signals) => {
                const signalsByType = countByType(signals);
                const quizSignals = signals.filter((s) => s.signal.type === "quiz");
                const averageScore = average(quizSignals, (s) => s.score ?? 0);
                const totalTimeSpentMs = signals.reduce(
                    (sum, s) => sum + (s.signal.timeSpentMs ?? 0),
                    0
                );

                const errorSignals = signals.filter(
                    (s) => s.signal.type === "errorPattern" || s.signal.errorCount
                );
                const totalErrors = errorSignals.reduce(
                    (sum, s) => sum + (s.signal.errorCount ?? 1),
                    0
                );
                const totalSuccess = signals.reduce(
                    (sum, s) => sum + (s.signal.successCount ?? 0),
                    0
                );

                const sectionProgress: Record<string, number> = {};
                for (const { signal } of signals) {
                    if (signal.sectionId) {
                        sectionProgress[signal.sectionId] =
                            (sectionProgress[signal.sectionId] || 0) + 1;
                    }
                }

                return {
                    totalSignals: signals.length,
                    signalsByType,
                    averageScore,
                    totalTimeSpentMs,
                    errorRate:
                        signals.length > 0 ? totalErrors / signals.length : 0,
                    successRate:
                        signals.length > 0 ? totalSuccess / signals.length : 0,
                    sectionProgress,
                    lastActivity:
                        signals.length > 0
                            ? signals[signals.length - 1].signal.timestamp
                            : Date.now(),
                };
            },
            {
                window: { type: "session", size: 0 },
            }
        )
        .decide<LearningDecision>(
            (aggregate) => {
                const { averageScore, errorRate, successRate } = aggregate;

                // Calculate comprehension level
                const level = thresholdDecision<ComprehensionLevel>(averageScore, [
                    { min: 80, decision: "advanced" },
                    { min: 50, decision: "intermediate" },
                    { min: 0, decision: "beginner" },
                ]) ?? "beginner";

                // Calculate confidence based on signal count
                const confidence = Math.min(1, aggregate.totalSignals / 10);

                // Generate recommendations
                const recommendations: string[] = [];
                if (errorRate > 0.3) {
                    recommendations.push("Consider reviewing fundamentals");
                }
                if (successRate > 0.8 && level !== "advanced") {
                    recommendations.push("Ready for more challenging content");
                }
                if (aggregate.totalTimeSpentMs > 30 * 60 * 1000) {
                    recommendations.push("Consider taking a break");
                }

                return { level, confidence, recommendations };
            },
            {
                debounceMs: 5000, // Don't recalculate too frequently
            }
        )
        .persist({
            enabled: true,
            keyPrefix: "learning-signals",
            maxSignals: 500,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        })
        .buildConfig();
}

// ============================================================================
// Contribution Event Types (compatible with contribution-tracker)
// ============================================================================

export type ContributionEventType =
    | "claimed"
    | "started_work"
    | "pushed_commit"
    | "opened_pr"
    | "received_review"
    | "made_changes"
    | "approved"
    | "merged"
    | "closed"
    | "abandoned"
    | "note_added";

export interface ContributionSignal extends BaseSignal {
    type: ContributionEventType;
    projectId: string;
    prNumber?: number;
    branchName?: string;
    description?: string;
    metadata?: Record<string, unknown>;
}

export interface ContributionAggregate {
    totalEvents: number;
    eventsByType: Record<ContributionEventType, number>;
    currentStatus: ContributionEventType;
    timeInCurrentStatus: number;
    prCount: number;
    mergedCount: number;
    activeProjects: string[];
    timeline: Array<{ type: ContributionEventType; timestamp: number }>;
}

export type ContributionHealth = "on_track" | "at_risk" | "blocked" | "completed";

export interface ContributionDecision {
    health: ContributionHealth;
    nextAction?: string;
    alerts: string[];
}

/**
 * Create a contribution tracking pipeline
 */
export function createContributionPipeline(
    userId: string
): PipelineConfig<ContributionSignal, ContributionSignal, ContributionAggregate, ContributionDecision> {
    return pipeline(`contribution-${userId}`)
        .id(`contribution-pipeline-${userId}`)
        .version(1)
        .collect<ContributionSignal, ContributionSignal>(
            (input) => ({
                ...input,
                id: input.id || createSignal(input.type, {}).id,
                timestamp: input.timestamp || Date.now(),
            }),
            {
                validate: (input) => !!input.type && !!input.projectId,
            }
        )
        .aggregate<ContributionAggregate>((signals) => {
            const eventsByType = {} as Record<ContributionEventType, number>;
            const activeProjects = new Set<string>();
            let prCount = 0;
            let mergedCount = 0;

            for (const { signal } of signals) {
                eventsByType[signal.type] = (eventsByType[signal.type] || 0) + 1;
                activeProjects.add(signal.projectId);
                if (signal.type === "opened_pr") prCount++;
                if (signal.type === "merged") mergedCount++;
            }

            const lastSignal = signals[signals.length - 1]?.signal;
            const currentStatus = lastSignal?.type || "claimed";
            const timeInCurrentStatus = lastSignal
                ? Date.now() - lastSignal.timestamp
                : 0;

            const timeline = signals
                .map(({ signal }) => ({
                    type: signal.type,
                    timestamp: signal.timestamp,
                }))
                .sort((a, b) => a.timestamp - b.timestamp);

            return {
                totalEvents: signals.length,
                eventsByType,
                currentStatus,
                timeInCurrentStatus,
                prCount,
                mergedCount,
                activeProjects: Array.from(activeProjects),
                timeline,
            };
        })
        .decide<ContributionDecision>((aggregate) => {
            const { currentStatus, timeInCurrentStatus, eventsByType } = aggregate;
            const alerts: string[] = [];
            let health: ContributionHealth = "on_track";
            let nextAction: string | undefined;

            // Determine health based on status and time
            if (currentStatus === "merged" || currentStatus === "closed") {
                health = "completed";
            } else if (currentStatus === "abandoned") {
                health = "blocked";
                nextAction = "Consider resuming or archiving this contribution";
            } else if (timeInCurrentStatus > 7 * 24 * 60 * 60 * 1000) {
                // More than 7 days in same status
                health = "at_risk";
                alerts.push("No activity for over a week");
                nextAction = "Check in on progress";
            }

            // Add status-specific recommendations
            switch (currentStatus) {
                case "claimed":
                    nextAction = nextAction || "Start working on the issue";
                    break;
                case "started_work":
                    nextAction = nextAction || "Push your first commit";
                    break;
                case "pushed_commit":
                    nextAction = nextAction || "Open a pull request for review";
                    break;
                case "opened_pr":
                case "received_review":
                    nextAction = nextAction || "Address review feedback";
                    break;
                case "made_changes":
                    nextAction = nextAction || "Request another review";
                    break;
                case "approved":
                    nextAction = nextAction || "Merge your pull request!";
                    break;
            }

            // Check for stuck reviews
            if (
                eventsByType["received_review"] > 2 &&
                currentStatus === "made_changes"
            ) {
                alerts.push("Multiple review cycles - consider reaching out for help");
            }

            return { health, nextAction, alerts };
        })
        .persist({
            enabled: true,
            keyPrefix: "contribution-signals",
            maxSignals: 200,
        })
        .buildConfig();
}

// ============================================================================
// Quality Metrics Types (compatible with remix-projects)
// ============================================================================

export interface QualitySignal extends BaseSignal {
    type: "file_change" | "test_result" | "lint_error" | "complexity_change";
    filePath?: string;
    linesAdded?: number;
    linesRemoved?: number;
    testsPassed?: number;
    testsFailed?: number;
    errorCount?: number;
    complexityDelta?: number;
}

export interface QualityAggregate {
    totalChanges: number;
    linesAdded: number;
    linesRemoved: number;
    netLines: number;
    testPassRate: number;
    lintErrorCount: number;
    averageComplexityDelta: number;
    filesChanged: number;
    changedFiles: string[];
}

export type QualityGrade = "A" | "B" | "C" | "D" | "F";

export interface QualityDecision {
    grade: QualityGrade;
    score: number;
    issues: string[];
    evolutionEligible: boolean;
}

/**
 * Create a quality metrics pipeline
 */
export function createQualityPipeline(
    projectId: string
): PipelineConfig<QualitySignal, QualitySignal, QualityAggregate, QualityDecision> {
    return pipeline(`quality-${projectId}`)
        .id(`quality-pipeline-${projectId}`)
        .version(1)
        .collect<QualitySignal, QualitySignal>(
            (input) => ({
                ...input,
                id: input.id || createSignal(input.type, {}).id,
                timestamp: input.timestamp || Date.now(),
            })
        )
        .aggregate<QualityAggregate>((signals) => {
            let linesAdded = 0;
            let linesRemoved = 0;
            let testsPassed = 0;
            let testsFailed = 0;
            let lintErrorCount = 0;
            let complexitySum = 0;
            let complexityCount = 0;
            const changedFiles = new Set<string>();

            for (const { signal } of signals) {
                linesAdded += signal.linesAdded ?? 0;
                linesRemoved += signal.linesRemoved ?? 0;
                testsPassed += signal.testsPassed ?? 0;
                testsFailed += signal.testsFailed ?? 0;
                lintErrorCount += signal.errorCount ?? 0;

                if (signal.complexityDelta !== undefined) {
                    complexitySum += signal.complexityDelta;
                    complexityCount++;
                }

                if (signal.filePath) {
                    changedFiles.add(signal.filePath);
                }
            }

            const totalTests = testsPassed + testsFailed;
            const testPassRate = totalTests > 0 ? testsPassed / totalTests : 1;
            const averageComplexityDelta =
                complexityCount > 0 ? complexitySum / complexityCount : 0;

            return {
                totalChanges: signals.length,
                linesAdded,
                linesRemoved,
                netLines: linesAdded - linesRemoved,
                testPassRate,
                lintErrorCount,
                averageComplexityDelta,
                filesChanged: changedFiles.size,
                changedFiles: Array.from(changedFiles),
            };
        })
        .decide<QualityDecision>((aggregate) => {
            const { testPassRate, lintErrorCount, averageComplexityDelta, netLines } =
                aggregate;
            const issues: string[] = [];
            let score = 100;

            // Deduct for failed tests
            if (testPassRate < 1) {
                const deduction = Math.round((1 - testPassRate) * 40);
                score -= deduction;
                issues.push(`Test pass rate: ${Math.round(testPassRate * 100)}%`);
            }

            // Deduct for lint errors
            if (lintErrorCount > 0) {
                const deduction = Math.min(20, lintErrorCount * 2);
                score -= deduction;
                issues.push(`${lintErrorCount} lint error(s)`);
            }

            // Deduct for increased complexity
            if (averageComplexityDelta > 5) {
                const deduction = Math.min(15, averageComplexityDelta);
                score -= deduction;
                issues.push("Significant complexity increase");
            }

            // Bonus for net line reduction (refactoring)
            if (netLines < -10) {
                score = Math.min(100, score + 5);
            }

            // Determine grade
            const grade = thresholdDecision<QualityGrade>(score, [
                { min: 90, decision: "A" },
                { min: 80, decision: "B" },
                { min: 70, decision: "C" },
                { min: 60, decision: "D" },
                { min: 0, decision: "F" },
            ]) ?? "F";

            return {
                grade,
                score: Math.max(0, Math.min(100, score)),
                issues,
                evolutionEligible: score >= 85 && testPassRate === 1,
            };
        })
        .persist({
            enabled: true,
            keyPrefix: "quality-signals",
            maxSignals: 100,
        })
        .buildConfig();
}

// ============================================================================
// User Velocity Types
// ============================================================================

export interface VelocitySignal extends BaseSignal {
    type: "page_view" | "action" | "session_start" | "session_end" | "milestone";
    action?: string;
    page?: string;
    durationMs?: number;
    value?: number;
}

export interface VelocityAggregate {
    totalActions: number;
    actionsPerMinute: number;
    sessionDurationMs: number;
    pagesVisited: string[];
    uniquePages: number;
    milestonesReached: number;
    engagementScore: number;
}

export type EngagementLevel = "high" | "medium" | "low" | "inactive";

export interface VelocityDecision {
    engagementLevel: EngagementLevel;
    trend: "increasing" | "stable" | "decreasing";
    suggestions: string[];
}

/**
 * Create a user velocity pipeline
 */
export function createVelocityPipeline(
    userId: string
): PipelineConfig<VelocitySignal, VelocitySignal, VelocityAggregate, VelocityDecision> {
    return pipeline(`velocity-${userId}`)
        .id(`velocity-pipeline-${userId}`)
        .version(1)
        .collect<VelocitySignal, VelocitySignal>((input) => ({
            ...input,
            id: input.id || createSignal(input.type, {}).id,
            timestamp: input.timestamp || Date.now(),
        }))
        .aggregate<VelocityAggregate>((signals) => {
            const actions = signals.filter((s) => s.signal.type === "action");
            const pages = signals
                .filter((s) => s.signal.page)
                .map((s) => s.signal.page!);
            const milestones = signals.filter((s) => s.signal.type === "milestone");

            // Calculate session duration from first to last signal
            const timestamps = signals.map((s) => s.signal.timestamp);
            const windowStart = timestamps.length > 0 ? Math.min(...timestamps) : Date.now();
            const windowEnd = timestamps.length > 0 ? Math.max(...timestamps) : Date.now();
            const sessionDurationMs = windowEnd - windowStart;
            const actionsPerMinute =
                sessionDurationMs > 0
                    ? (actions.length / sessionDurationMs) * 60000
                    : 0;

            // Calculate engagement score (0-100)
            let engagementScore = 50; // Base score
            engagementScore += Math.min(25, actionsPerMinute * 5);
            engagementScore += Math.min(15, new Set(pages).size * 3);
            engagementScore += Math.min(10, milestones.length * 5);

            return {
                totalActions: actions.length,
                actionsPerMinute,
                sessionDurationMs,
                pagesVisited: pages,
                uniquePages: new Set(pages).size,
                milestonesReached: milestones.length,
                engagementScore: Math.min(100, Math.max(0, engagementScore)),
            };
        })
        .withSessionWindow()
        .decide<VelocityDecision>((aggregate, context) => {
            const { engagementScore, actionsPerMinute } = aggregate;

            const engagementLevel = thresholdDecision<EngagementLevel>(
                engagementScore,
                [
                    { min: 75, decision: "high" },
                    { min: 50, decision: "medium" },
                    { min: 25, decision: "low" },
                    { min: 0, decision: "inactive" },
                ]
            ) ?? "inactive";

            // Determine trend based on previous decision
            let trend: "increasing" | "stable" | "decreasing" = "stable";
            if (context.previousDecision) {
                const prevScore = (context.previousDecision as VelocityDecision)
                    .engagementLevel;
                const levels = ["inactive", "low", "medium", "high"];
                const prevIndex = levels.indexOf(prevScore);
                const currIndex = levels.indexOf(engagementLevel);
                if (currIndex > prevIndex) trend = "increasing";
                else if (currIndex < prevIndex) trend = "decreasing";
            }

            const suggestions: string[] = [];
            if (engagementLevel === "low" || engagementLevel === "inactive") {
                suggestions.push("Try completing a quick challenge");
                suggestions.push("Check out recommended content");
            }
            if (actionsPerMinute < 0.5 && aggregate.sessionDurationMs > 5 * 60000) {
                suggestions.push("Need help? Check the documentation");
            }

            return { engagementLevel, trend, suggestions };
        })
        .debounce(30000) // Update every 30 seconds at most
        .persist({
            enabled: true,
            keyPrefix: "velocity-signals",
            maxSignals: 1000,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        })
        .buildConfig();
}
