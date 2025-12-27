// Quality Gates - Submission quality checks and evolution eligibility

import {
    Submission,
    SubmissionAnalysis,
    QualityMetrics,
    SeedProject,
} from "./types";

// Quality gate thresholds
export const QUALITY_THRESHOLDS = {
    minimumScore: 60, // Minimum score to pass
    evolutionEligible: 85, // Score needed to become new seed project
    objectivesRequired: 0.8, // 80% of required objectives must be met
    maxRegressions: 1, // Maximum allowed regressions
    maxUnnecessaryChanges: 2, // Maximum scope violations
};

// Quality gate result
export interface QualityGateResult {
    passed: boolean;
    evolutionEligible: boolean;
    gates: GateCheck[];
    summary: string;
}

export interface GateCheck {
    name: string;
    passed: boolean;
    message: string;
    severity: "info" | "warning" | "error";
}

// Run all quality gates
export function runQualityGates(
    submission: Submission,
    analysis: SubmissionAnalysis
): QualityGateResult {
    const gates: GateCheck[] = [];

    // Gate 1: Minimum score
    const scoreGate = checkScoreGate(submission.scores.overall);
    gates.push(scoreGate);

    // Gate 2: Required objectives
    const objectivesGate = checkObjectivesGate(analysis);
    gates.push(objectivesGate);

    // Gate 3: No critical regressions
    const regressionsGate = checkRegressionsGate(analysis);
    gates.push(regressionsGate);

    // Gate 4: Appropriate scope
    const scopeGate = checkScopeGate(analysis);
    gates.push(scopeGate);

    // Gate 5: Tests still passing
    const testsGate = checkTestsGate(analysis);
    gates.push(testsGate);

    // Determine overall result
    const criticalFailures = gates.filter((g) => !g.passed && g.severity === "error");
    const passed = criticalFailures.length === 0;
    const evolutionEligible = passed && submission.scores.overall >= QUALITY_THRESHOLDS.evolutionEligible;

    // Generate summary
    let summary = "";
    if (passed) {
        if (evolutionEligible) {
            summary = "Excellent work! Your submission qualifies to become a new seed project version.";
        } else {
            summary = "Good work! Your submission passes all quality gates.";
        }
    } else {
        summary = `Submission needs improvement: ${criticalFailures.map((g) => g.name).join(", ")}`;
    }

    return { passed, evolutionEligible, gates, summary };
}

// Individual gate checks
function checkScoreGate(score: number): GateCheck {
    const passed = score >= QUALITY_THRESHOLDS.minimumScore;
    return {
        name: "Minimum Score",
        passed,
        message: passed
            ? `Score ${score} meets minimum threshold of ${QUALITY_THRESHOLDS.minimumScore}`
            : `Score ${score} below minimum threshold of ${QUALITY_THRESHOLDS.minimumScore}`,
        severity: passed ? "info" : "error",
    };
}

function checkObjectivesGate(analysis: SubmissionAnalysis): GateCheck {
    const metObjectives = analysis.objectivesMet.filter((o) => o.met).length;
    const totalObjectives = analysis.objectivesMet.length;
    const ratio = totalObjectives > 0 ? metObjectives / totalObjectives : 0;
    const passed = ratio >= QUALITY_THRESHOLDS.objectivesRequired;

    return {
        name: "Required Objectives",
        passed,
        message: passed
            ? `${metObjectives}/${totalObjectives} objectives met (${Math.round(ratio * 100)}%)`
            : `Only ${metObjectives}/${totalObjectives} objectives met, need ${Math.round(QUALITY_THRESHOLDS.objectivesRequired * 100)}%`,
        severity: passed ? "info" : "error",
    };
}

function checkRegressionsGate(analysis: SubmissionAnalysis): GateCheck {
    const criticalRegressions = analysis.regressions.filter(
        (r) => r.severity === "major" || r.severity === "critical"
    );
    const passed = criticalRegressions.length <= QUALITY_THRESHOLDS.maxRegressions;

    return {
        name: "No Critical Regressions",
        passed,
        message: passed
            ? analysis.regressions.length === 0
                ? "No regressions detected"
                : `${analysis.regressions.length} minor regression(s) detected`
            : `${criticalRegressions.length} critical regression(s) must be fixed`,
        severity: passed
            ? analysis.regressions.length > 0 ? "warning" : "info"
            : "error",
    };
}

function checkScopeGate(analysis: SubmissionAnalysis): GateCheck {
    const unnecessaryCount = analysis.scopeAssessment.unnecessaryChanges.length;
    const passed = unnecessaryCount <= QUALITY_THRESHOLDS.maxUnnecessaryChanges;

    return {
        name: "Appropriate Scope",
        passed,
        message: passed
            ? analysis.scopeAssessment.appropriateScope
                ? "All changes are relevant to the assignment"
                : `${unnecessaryCount} unnecessary change(s) detected`
            : `Too many unnecessary changes (${unnecessaryCount}), keep focused on the assignment`,
        severity: passed
            ? unnecessaryCount > 0 ? "warning" : "info"
            : "warning", // Scope issues are warnings, not errors
    };
}

function checkTestsGate(analysis: SubmissionAnalysis): GateCheck {
    const testsDelta = analysis.testsPassingAfter - analysis.testsPassingBefore;
    const passed = testsDelta >= 0;

    return {
        name: "Tests Passing",
        passed,
        message: passed
            ? testsDelta > 0
                ? `${testsDelta} more test(s) passing than before`
                : "All previously passing tests still pass"
            : `${Math.abs(testsDelta)} test(s) now failing that passed before`,
        severity: passed ? "info" : "error",
    };
}

// Calculate quality metrics for a project
export function calculateQualityMetrics(files: { content: string; path: string }[]): QualityMetrics {
    let totalComplexity = 0;
    let totalLines = 0;
    let lintErrors = 0;
    let securityIssues = 0;
    let documentedLines = 0;

    for (const file of files) {
        const lines = file.content.split("\n");
        totalLines += lines.length;

        // Simple complexity estimation (count control structures)
        const controlStructures = (file.content.match(/\b(if|for|while|switch|catch|&&|\|\|)\b/g) || []).length;
        totalComplexity += controlStructures;

        // Count comments for documentation coverage
        const comments = (file.content.match(/\/\/|\/\*|\*\//g) || []).length;
        documentedLines += comments;

        // Simple lint check (look for common issues)
        if (file.content.includes("console.log")) lintErrors++;
        if (file.content.includes("var ")) lintErrors++;
        if (file.content.includes("any")) lintErrors++;

        // Security checks
        if (file.content.includes("eval(")) securityIssues++;
        if (file.content.includes("innerHTML")) securityIssues++;
        if (file.content.match(/password.*=.*['"][^'"]+['"]/i)) securityIssues++;
    }

    // Calculate metrics (normalized to 0-100 scale where applicable)
    const complexity = Math.min(100, totalComplexity);
    const documentationCoverage = totalLines > 0 ? Math.min(100, (documentedLines / totalLines) * 500) : 0;

    return {
        complexity,
        testCoverage: 0, // Would need actual test runner
        duplication: 0, // Would need actual analysis
        lintErrors,
        documentationCoverage: Math.round(documentationCoverage),
        securityIssues,
    };
}

// Check if submission can evolve the project
export function canEvolveProject(
    submission: Submission,
    gateResult: QualityGateResult
): { canEvolve: boolean; reason: string } {
    if (!gateResult.evolutionEligible) {
        return {
            canEvolve: false,
            reason: `Score of ${submission.scores.overall} is below evolution threshold of ${QUALITY_THRESHOLDS.evolutionEligible}`,
        };
    }

    // Additional checks for evolution
    const hasTests = submission.diff.changes.some((c) => c.path.includes("test"));
    if (!hasTests) {
        return {
            canEvolve: false,
            reason: "Submissions that evolve the project should include tests",
        };
    }

    return {
        canEvolve: true,
        reason: "Submission meets all criteria for project evolution",
    };
}

// Get improvement suggestions
export function getImprovementSuggestions(
    gateResult: QualityGateResult,
    analysis: SubmissionAnalysis
): string[] {
    const suggestions: string[] = [];

    // Based on failed gates
    for (const gate of gateResult.gates) {
        if (!gate.passed) {
            if (gate.name === "Minimum Score") {
                suggestions.push("Complete more assignment objectives to improve your score");
            }
            if (gate.name === "Required Objectives") {
                const unmet = analysis.objectivesMet.filter((o) => !o.met);
                suggestions.push(`Focus on completing: ${unmet.map((o) => o.objectiveId).join(", ")}`);
            }
            if (gate.name === "No Critical Regressions") {
                suggestions.push("Review and fix the regressions before resubmitting");
            }
            if (gate.name === "Tests Passing") {
                suggestions.push("Run tests locally and fix any failures before submitting");
            }
        }
    }

    // Based on analysis
    if (analysis.qualityDelta.overallTrend === "degraded") {
        suggestions.push("Consider refactoring to reduce complexity");
    }

    if (analysis.scopeAssessment.missedOpportunities.length > 0) {
        suggestions.push(...analysis.scopeAssessment.missedOpportunities);
    }

    return suggestions;
}
