/**
 * Code Diff Utility
 *
 * Computes line-by-line differences between code versions
 * for GitHub-style diff display in progressive tutorials.
 */

export type DiffLineType = "unchanged" | "added" | "removed" | "context";

export interface DiffLine {
    type: DiffLineType;
    content: string;
    oldLineNumber: number | null;
    newLineNumber: number | null;
}

export interface DiffHunk {
    lines: DiffLine[];
    startOld: number;
    startNew: number;
    collapsed?: boolean;
}

export interface DiffResult {
    hunks: DiffHunk[];
    stats: DiffStats;
}

export interface DiffStats {
    added: number;
    removed: number;
    unchanged: number;
}

/**
 * Simple Longest Common Subsequence (LCS) based diff algorithm
 * Computes the difference between two code strings
 */
export function computeDiff(oldCode: string, newCode: string): DiffResult {
    const oldLines = oldCode.split("\n");
    const newLines = newCode.split("\n");

    // Build LCS matrix
    const lcs = buildLcsMatrix(oldLines, newLines);

    // Backtrack to get diff lines
    const diffLines = backtrackDiff(oldLines, newLines, lcs);

    // Group into hunks with context
    const hunks = groupIntoHunks(diffLines, 3); // 3 lines of context

    // Calculate stats
    const stats = calculateStats(diffLines);

    return { hunks, stats };
}

/**
 * Build LCS (Longest Common Subsequence) matrix
 */
function buildLcsMatrix(oldLines: string[], newLines: string[]): number[][] {
    const m = oldLines.length;
    const n = newLines.length;

    // Initialize matrix with zeros
    const matrix: number[][] = Array(m + 1)
        .fill(null)
        .map(() => Array(n + 1).fill(0));

    // Fill matrix
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (oldLines[i - 1] === newLines[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1] + 1;
            } else {
                matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
            }
        }
    }

    return matrix;
}

/**
 * Backtrack through LCS matrix to generate diff lines
 */
function backtrackDiff(
    oldLines: string[],
    newLines: string[],
    lcs: number[][]
): DiffLine[] {
    const result: DiffLine[] = [];
    let i = oldLines.length;
    let j = newLines.length;
    let oldLineNum = oldLines.length;
    let newLineNum = newLines.length;

    // Temporary storage for reversed order
    const temp: DiffLine[] = [];

    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
            // Lines are the same - unchanged
            temp.push({
                type: "unchanged",
                content: oldLines[i - 1],
                oldLineNumber: oldLineNum,
                newLineNumber: newLineNum,
            });
            i--;
            j--;
            oldLineNum--;
            newLineNum--;
        } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
            // Line added in new version
            temp.push({
                type: "added",
                content: newLines[j - 1],
                oldLineNumber: null,
                newLineNumber: newLineNum,
            });
            j--;
            newLineNum--;
        } else if (i > 0) {
            // Line removed from old version
            temp.push({
                type: "removed",
                content: oldLines[i - 1],
                oldLineNumber: oldLineNum,
                newLineNumber: null,
            });
            i--;
            oldLineNum--;
        }
    }

    // Reverse to get correct order
    return temp.reverse();
}

/**
 * Group diff lines into hunks with surrounding context
 */
function groupIntoHunks(diffLines: DiffLine[], contextSize: number): DiffHunk[] {
    const hunks: DiffHunk[] = [];
    let currentHunk: DiffLine[] = [];
    let hunkStartOld = 1;
    let hunkStartNew = 1;
    let lastChangeIndex = -contextSize - 1;

    for (let i = 0; i < diffLines.length; i++) {
        const line = diffLines[i];
        const isChange = line.type === "added" || line.type === "removed";

        if (isChange) {
            // If there's a gap larger than 2 * contextSize, start a new hunk
            if (i - lastChangeIndex > 2 * contextSize && currentHunk.length > 0) {
                // Finish current hunk with trailing context
                const trailingEnd = Math.min(lastChangeIndex + contextSize + 1, i);
                for (let j = lastChangeIndex + 1; j < trailingEnd; j++) {
                    if (j < diffLines.length) {
                        currentHunk.push({ ...diffLines[j], type: "context" as DiffLineType });
                    }
                }

                hunks.push({
                    lines: currentHunk,
                    startOld: hunkStartOld,
                    startNew: hunkStartNew,
                });

                currentHunk = [];

                // Add leading context for new hunk
                const leadingStart = Math.max(0, i - contextSize);
                hunkStartOld = diffLines[leadingStart]?.oldLineNumber ?? 1;
                hunkStartNew = diffLines[leadingStart]?.newLineNumber ?? 1;

                for (let j = leadingStart; j < i; j++) {
                    currentHunk.push({ ...diffLines[j], type: "context" as DiffLineType });
                }
            } else if (currentHunk.length === 0) {
                // Starting first hunk - add leading context
                const leadingStart = Math.max(0, i - contextSize);
                hunkStartOld = diffLines[leadingStart]?.oldLineNumber ?? 1;
                hunkStartNew = diffLines[leadingStart]?.newLineNumber ?? 1;

                for (let j = leadingStart; j < i; j++) {
                    currentHunk.push({ ...diffLines[j], type: "context" as DiffLineType });
                }
            } else {
                // Fill in any gap since last change
                for (let j = lastChangeIndex + 1; j < i; j++) {
                    currentHunk.push({ ...diffLines[j], type: "context" as DiffLineType });
                }
            }

            currentHunk.push(line);
            lastChangeIndex = i;
        }
    }

    // Finish last hunk
    if (currentHunk.length > 0) {
        const trailingEnd = Math.min(lastChangeIndex + contextSize + 1, diffLines.length);
        for (let j = lastChangeIndex + 1; j < trailingEnd; j++) {
            currentHunk.push({ ...diffLines[j], type: "context" as DiffLineType });
        }

        hunks.push({
            lines: currentHunk,
            startOld: hunkStartOld,
            startNew: hunkStartNew,
        });
    }

    // If no changes, show the entire code as a collapsed context
    if (hunks.length === 0 && diffLines.length > 0) {
        hunks.push({
            lines: diffLines.map(l => ({ ...l, type: "unchanged" as DiffLineType })),
            startOld: 1,
            startNew: 1,
            collapsed: true,
        });
    }

    return hunks;
}

/**
 * Calculate diff statistics
 */
function calculateStats(diffLines: DiffLine[]): DiffStats {
    return diffLines.reduce(
        (stats, line) => {
            if (line.type === "added") stats.added++;
            else if (line.type === "removed") stats.removed++;
            else stats.unchanged++;
            return stats;
        },
        { added: 0, removed: 0, unchanged: 0 }
    );
}

/**
 * Format stats as a summary string
 */
export function formatDiffStats(stats: DiffStats): string {
    const parts: string[] = [];
    if (stats.added > 0) parts.push(`+${stats.added}`);
    if (stats.removed > 0) parts.push(`-${stats.removed}`);
    return parts.join(" / ") || "No changes";
}

/**
 * Check if there are actual changes between two code strings
 */
export function hasChanges(oldCode: string, newCode: string): boolean {
    return oldCode.trim() !== newCode.trim();
}
