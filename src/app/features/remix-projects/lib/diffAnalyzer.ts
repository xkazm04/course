// Diff Analyzer - Analyze changes between original and modified code

import {
    ProjectDiff,
    FileChange,
    DiffHunk,
    ModifiedFile,
    SubmissionAnalysis,
    ObjectiveResult,
    QualityDelta,
    ScopeAssessment,
    Assignment,
} from "./types";

// Generate diff between original and modified files
export function generateDiff(files: ModifiedFile[]): ProjectDiff {
    let totalAdded = 0;
    let totalRemoved = 0;
    const changes: FileChange[] = [];

    for (const file of files) {
        if (file.originalContent === file.currentContent) continue;

        const fileChange = analyzeFileChange(file);
        if (fileChange) {
            changes.push(fileChange);
            totalAdded += fileChange.linesAdded;
            totalRemoved += fileChange.linesRemoved;
        }
    }

    return {
        filesModified: changes.filter((c) => c.type === "modified").length,
        filesAdded: changes.filter((c) => c.type === "added").length,
        filesDeleted: changes.filter((c) => c.type === "deleted").length,
        linesAdded: totalAdded,
        linesRemoved: totalRemoved,
        changes,
    };
}

// Analyze a single file change
function analyzeFileChange(file: ModifiedFile): FileChange | null {
    const originalLines = file.originalContent.split("\n");
    const currentLines = file.currentContent.split("\n");

    // Determine change type
    let type: FileChange["type"] = "modified";
    if (file.originalContent === "" && file.currentContent !== "") {
        type = "added";
    } else if (file.originalContent !== "" && file.currentContent === "") {
        type = "deleted";
    }

    // Simple line-by-line diff (in production, use a proper diff library)
    const hunks: DiffHunk[] = [];
    let linesAdded = 0;
    let linesRemoved = 0;

    // Find changed sections
    let i = 0;
    let j = 0;
    let hunkContent = "";
    let hunkStartOld = 1;
    let hunkStartNew = 1;
    let inHunk = false;

    while (i < originalLines.length || j < currentLines.length) {
        const origLine = originalLines[i] ?? "";
        const currLine = currentLines[j] ?? "";

        if (origLine === currLine && i < originalLines.length && j < currentLines.length) {
            if (inHunk) {
                hunks.push({
                    oldStart: hunkStartOld,
                    oldLines: i - hunkStartOld + 1,
                    newStart: hunkStartNew,
                    newLines: j - hunkStartNew + 1,
                    content: hunkContent,
                });
                inHunk = false;
                hunkContent = "";
            }
            i++;
            j++;
        } else {
            if (!inHunk) {
                hunkStartOld = i + 1;
                hunkStartNew = j + 1;
                inHunk = true;
            }

            if (i < originalLines.length && (j >= currentLines.length || origLine !== currLine)) {
                hunkContent += `- ${origLine}\n`;
                linesRemoved++;
                i++;
            }
            if (j < currentLines.length && (i > originalLines.length || origLine !== currLine)) {
                hunkContent += `+ ${currLine}\n`;
                linesAdded++;
                j++;
            }
        }
    }

    if (inHunk) {
        hunks.push({
            oldStart: hunkStartOld,
            oldLines: originalLines.length - hunkStartOld + 1,
            newStart: hunkStartNew,
            newLines: currentLines.length - hunkStartNew + 1,
            content: hunkContent,
        });
    }

    if (hunks.length === 0) return null;

    return {
        path: file.path,
        type,
        hunks,
        linesAdded,
        linesRemoved,
    };
}

// Analyze submission against assignment objectives
export function analyzeSubmission(
    assignment: Assignment,
    diff: ProjectDiff,
    files: ModifiedFile[]
): SubmissionAnalysis {
    const objectivesMet = analyzeObjectives(assignment, diff, files);
    const regressions = detectRegressions(diff, files);
    const qualityDelta = analyzeQualityDelta(diff, files);
    const scopeAssessment = assessScope(assignment, diff);

    return {
        objectivesMet,
        regressions,
        testsPassingBefore: 8, // Mock data
        testsPassingAfter: regressions.length > 0 ? 7 : 10, // Mock data
        qualityDelta,
        scopeAssessment,
    };
}

// Analyze if objectives were met
function analyzeObjectives(
    assignment: Assignment,
    diff: ProjectDiff,
    files: ModifiedFile[]
): ObjectiveResult[] {
    return assignment.objectives.map((objective) => {
        // Simple keyword-based detection (in production, use LLM or AST analysis)
        const allContent = files.map((f) => f.currentContent).join("\n").toLowerCase();
        const objectiveKeywords = objective.description.toLowerCase().split(" ");

        // Check for relevant changes
        let evidence = "";
        let confidence = 0;

        if (objective.description.toLowerCase().includes("validation")) {
            if (allContent.includes("validate") || allContent.includes("validator") || allContent.includes("joi") || allContent.includes("zod")) {
                evidence = "Found validation-related code changes";
                confidence = 0.85;
            }
        } else if (objective.description.toLowerCase().includes("test")) {
            if (diff.changes.some((c) => c.path.includes("test"))) {
                evidence = "Test files were modified or added";
                confidence = 0.9;
            }
        } else if (objective.description.toLowerCase().includes("error")) {
            if (allContent.includes("error") && allContent.includes("message")) {
                evidence = "Error handling code detected";
                confidence = 0.75;
            }
        } else {
            // Generic check - changes were made
            confidence = diff.linesAdded > 5 ? 0.6 : 0.3;
            evidence = `${diff.linesAdded} lines added, ${diff.linesRemoved} lines removed`;
        }

        return {
            objectiveId: objective.id,
            met: confidence > 0.7,
            evidence,
            confidence,
        };
    });
}

// Detect potential regressions
function detectRegressions(diff: ProjectDiff, files: ModifiedFile[]): SubmissionAnalysis["regressions"] {
    const regressions: SubmissionAnalysis["regressions"] = [];

    // Check for removed functionality
    for (const change of diff.changes) {
        if (change.linesRemoved > change.linesAdded * 2) {
            regressions.push({
                type: "functionality",
                description: `Significant code removal in ${change.path}`,
                severity: "moderate",
                location: { file: change.path, startLine: 1, endLine: 1 },
            });
        }
    }

    // Check for deleted test files
    const deletedTests = diff.changes.filter(
        (c) => c.type === "deleted" && c.path.includes("test")
    );
    if (deletedTests.length > 0) {
        regressions.push({
            type: "test",
            description: "Test files were deleted",
            severity: "major",
        });
    }

    return regressions;
}

// Analyze quality impact
function analyzeQualityDelta(diff: ProjectDiff, files: ModifiedFile[]): QualityDelta {
    // Simple heuristics (in production, use actual linting/analysis tools)
    const totalLines = files.reduce((sum, f) => sum + f.currentContent.split("\n").length, 0);
    const addedComplexity = diff.linesAdded > 50 ? 5 : diff.linesAdded > 20 ? 2 : 0;

    // Check for test additions
    const testChanges = diff.changes.filter((c) => c.path.includes("test"));
    const testCoverageChange = testChanges.length > 0 ? 10 : 0;

    // Determine overall trend
    let overallTrend: QualityDelta["overallTrend"] = "stable";
    if (testCoverageChange > 0 && addedComplexity < 5) {
        overallTrend = "improved";
    } else if (addedComplexity > 5) {
        overallTrend = "degraded";
    }

    return {
        complexityChange: addedComplexity,
        duplicationChange: 0,
        testCoverageChange,
        lintErrorsChange: -2, // Assume improvement
        typeErrorsChange: 0,
        overallTrend,
    };
}

// Assess if changes are appropriately scoped
function assessScope(assignment: Assignment, diff: ProjectDiff): ScopeAssessment {
    const unnecessaryChanges: ScopeAssessment["unnecessaryChanges"] = [];
    const missedOpportunities: string[] = [];

    // Check for changes to unrelated files
    for (const change of diff.changes) {
        if (change.path.includes("README") && !assignment.type.includes("documentation")) {
            unnecessaryChanges.push({
                file: change.path,
                description: "README changes not required for this assignment",
                recommendation: "Revert documentation changes unless fixing errors",
            });
        }
        if (change.path.includes("package.json") && change.linesAdded > 5) {
            unnecessaryChanges.push({
                file: change.path,
                description: "Significant package.json changes",
                recommendation: "Only add necessary dependencies",
            });
        }
    }

    // Check for missed opportunities
    if (assignment.type === "security_fix" && diff.linesAdded < 10) {
        missedOpportunities.push("Security fix seems minimal - ensure all endpoints are covered");
    }

    return {
        appropriateScope: unnecessaryChanges.length === 0,
        unnecessaryChanges,
        missedOpportunities,
    };
}

// Calculate overall score
export function calculateSubmissionScore(
    analysis: SubmissionAnalysis,
    hintsUsed: number,
    hintPenalties: number[]
): { overall: number; breakdown: Record<string, number> } {
    // Objectives score (60%)
    const metObjectives = analysis.objectivesMet.filter((o) => o.met).length;
    const totalObjectives = analysis.objectivesMet.length;
    const objectivesScore = (metObjectives / totalObjectives) * 60;

    // Quality score (25%)
    let qualityScore = 25;
    if (analysis.qualityDelta.overallTrend === "improved") qualityScore = 30;
    if (analysis.qualityDelta.overallTrend === "degraded") qualityScore = 15;
    if (analysis.regressions.length > 0) {
        qualityScore -= analysis.regressions.length * 5;
    }

    // Scope score (15%)
    let scopeScore = 15;
    if (!analysis.scopeAssessment.appropriateScope) {
        scopeScore -= analysis.scopeAssessment.unnecessaryChanges.length * 3;
    }

    // Apply hint penalties
    const totalPenalty = hintPenalties.slice(0, hintsUsed).reduce((sum, p) => sum + p, 0);

    const overall = Math.max(0, Math.min(100,
        objectivesScore + qualityScore + scopeScore - totalPenalty
    ));

    return {
        overall: Math.round(overall * 10) / 10,
        breakdown: {
            objectives: Math.round(objectivesScore * 10) / 10,
            quality: Math.max(0, qualityScore),
            scope: Math.max(0, scopeScore),
            penalties: -totalPenalty,
        },
    };
}
