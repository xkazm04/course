/**
 * Test Results Storage and Comparison
 *
 * Utilities for storing, retrieving, and comparing test results.
 * Uses in-memory storage for simplicity (can be extended to persistent storage).
 */

import type { TestResult } from "../lib/types";
import type { TestRunSummary } from "./testRunner";

// ============================================================================
// TYPES
// ============================================================================

/**
 * A complete test run with all results and metadata
 */
export interface TestRun {
    id: string;
    timestamp: string;
    variant?: "live-form" | "ai-chat" | "enhanced" | "oracle" | "all";
    results: TestResult[];
    summary: TestRunSummary;
    metadata?: {
        triggeredBy?: string;
        environment?: string;
        notes?: string;
    };
}

/**
 * Comparison between two test runs
 */
export interface TestRunComparison {
    baseRun: TestRun;
    compareRun: TestRun;
    changes: {
        passRateChange: number;
        durationChange: number;
        tokenUsageChange: number;
        newFailures: string[];
        newPasses: string[];
    };
}

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

// Store test runs in memory (would be replaced with database in production)
const testRunStore: Map<string, TestRun> = new Map();

// Maximum number of runs to keep in memory
const MAX_STORED_RUNS = 50;

// ============================================================================
// STORAGE FUNCTIONS
// ============================================================================

/**
 * Save a test run
 */
export function saveTestRun(
    results: TestResult[],
    summary: TestRunSummary,
    variant?: TestRun["variant"],
    metadata?: TestRun["metadata"]
): TestRun {
    const id = generateRunId();
    const run: TestRun = {
        id,
        timestamp: new Date().toISOString(),
        variant,
        results,
        summary,
        metadata,
    };

    // Add to store
    testRunStore.set(id, run);

    // Cleanup old runs if over limit
    if (testRunStore.size > MAX_STORED_RUNS) {
        const entries = Array.from(testRunStore.entries());
        entries.sort((a, b) => a[1].timestamp.localeCompare(b[1].timestamp));

        // Remove oldest runs
        const toRemove = entries.slice(0, entries.length - MAX_STORED_RUNS);
        for (const [key] of toRemove) {
            testRunStore.delete(key);
        }
    }

    return run;
}

/**
 * Get a test run by ID
 */
export function getTestRun(id: string): TestRun | undefined {
    return testRunStore.get(id);
}

/**
 * Get the most recent test run
 */
export function getLatestTestRun(): TestRun | undefined {
    const runs = Array.from(testRunStore.values());
    if (runs.length === 0) return undefined;

    runs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return runs[0];
}

/**
 * Get all test runs (most recent first)
 */
export function getAllTestRuns(): TestRun[] {
    const runs = Array.from(testRunStore.values());
    runs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return runs;
}

/**
 * Get test runs by variant
 */
export function getTestRunsByVariant(variant: TestRun["variant"]): TestRun[] {
    return getAllTestRuns().filter(run => run.variant === variant);
}

/**
 * Delete a test run
 */
export function deleteTestRun(id: string): boolean {
    return testRunStore.delete(id);
}

/**
 * Clear all test runs
 */
export function clearTestRuns(): void {
    testRunStore.clear();
}

// ============================================================================
// COMPARISON FUNCTIONS
// ============================================================================

/**
 * Compare two test runs
 */
export function compareTestRuns(baseId: string, compareId: string): TestRunComparison | null {
    const baseRun = getTestRun(baseId);
    const compareRun = getTestRun(compareId);

    if (!baseRun || !compareRun) return null;

    const baseResultMap = new Map(baseRun.results.map(r => [r.configId, r]));
    const compareResultMap = new Map(compareRun.results.map(r => [r.configId, r]));

    const newFailures: string[] = [];
    const newPasses: string[] = [];

    // Find tests that changed status
    for (const [configId, compareResult] of compareResultMap) {
        const baseResult = baseResultMap.get(configId);

        if (baseResult) {
            if (baseResult.success && !compareResult.success) {
                newFailures.push(configId);
            } else if (!baseResult.success && compareResult.success) {
                newPasses.push(configId);
            }
        }
    }

    return {
        baseRun,
        compareRun,
        changes: {
            passRateChange: compareRun.summary.passRate - baseRun.summary.passRate,
            durationChange: compareRun.summary.avgDuration - baseRun.summary.avgDuration,
            tokenUsageChange: compareRun.summary.avgTokensPerTest - baseRun.summary.avgTokensPerTest,
            newFailures,
            newPasses,
        },
    };
}

/**
 * Compare latest run to previous run
 */
export function compareLatestRuns(): TestRunComparison | null {
    const runs = getAllTestRuns();
    if (runs.length < 2) return null;

    return compareTestRuns(runs[1].id, runs[0].id);
}

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Get failure patterns across runs
 */
export function getFailurePatterns(): {
    configId: string;
    failureCount: number;
    lastFailure: string;
    commonErrors: string[];
}[] {
    const runs = getAllTestRuns();
    const failureMap = new Map<string, { count: number; lastFailure: string; errors: string[] }>();

    for (const run of runs) {
        for (const result of run.results) {
            if (!result.success) {
                const existing = failureMap.get(result.configId) || {
                    count: 0,
                    lastFailure: "",
                    errors: [],
                };

                existing.count++;
                if (!existing.lastFailure || result.timestamp > existing.lastFailure) {
                    existing.lastFailure = result.timestamp;
                }
                if (result.error?.message) {
                    existing.errors.push(result.error.message);
                }

                failureMap.set(result.configId, existing);
            }
        }
    }

    return Array.from(failureMap.entries())
        .map(([configId, data]) => ({
            configId,
            failureCount: data.count,
            lastFailure: data.lastFailure,
            commonErrors: [...new Set(data.errors)],
        }))
        .sort((a, b) => b.failureCount - a.failureCount);
}

/**
 * Get performance trends over time
 */
export function getPerformanceTrends(): {
    runId: string;
    timestamp: string;
    passRate: number;
    avgDuration: number;
    avgTokens: number;
}[] {
    return getAllTestRuns().map(run => ({
        runId: run.id,
        timestamp: run.timestamp,
        passRate: run.summary.passRate,
        avgDuration: run.summary.avgDuration,
        avgTokens: run.summary.avgTokensPerTest,
    }));
}

/**
 * Get summary statistics across all runs
 */
export function getAggregateStats(): {
    totalRuns: number;
    totalTests: number;
    overallPassRate: number;
    avgDuration: number;
    avgTokens: number;
    bestPassRate: number;
    worstPassRate: number;
} {
    const runs = getAllTestRuns();

    if (runs.length === 0) {
        return {
            totalRuns: 0,
            totalTests: 0,
            overallPassRate: 0,
            avgDuration: 0,
            avgTokens: 0,
            bestPassRate: 0,
            worstPassRate: 0,
        };
    }

    const totalTests = runs.reduce((sum, r) => sum + r.summary.totalTests, 0);
    const totalPassed = runs.reduce((sum, r) => sum + r.summary.passed, 0);
    const totalDuration = runs.reduce((sum, r) => sum + r.summary.avgDuration * r.summary.totalTests, 0);
    const totalTokens = runs.reduce((sum, r) => sum + r.summary.totalTokens, 0);

    const passRates = runs.map(r => r.summary.passRate);

    return {
        totalRuns: runs.length,
        totalTests,
        overallPassRate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0,
        avgDuration: totalTests > 0 ? Math.round(totalDuration / totalTests) : 0,
        avgTokens: totalTests > 0 ? Math.round(totalTokens / totalTests) : 0,
        bestPassRate: Math.max(...passRates),
        worstPassRate: Math.min(...passRates),
    };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate a unique run ID
 */
function generateRunId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 8);
    return `run-${timestamp}-${random}`;
}

/**
 * Export test results as JSON
 */
export function exportResults(runId?: string): string {
    if (runId) {
        const run = getTestRun(runId);
        return JSON.stringify(run, null, 2);
    }
    return JSON.stringify(getAllTestRuns(), null, 2);
}

/**
 * Import test results from JSON
 */
export function importResults(json: string): number {
    try {
        const data = JSON.parse(json);
        const runs = Array.isArray(data) ? data : [data];

        let imported = 0;
        for (const run of runs) {
            if (run.id && run.results && run.summary) {
                testRunStore.set(run.id, run);
                imported++;
            }
        }

        return imported;
    } catch {
        return 0;
    }
}
