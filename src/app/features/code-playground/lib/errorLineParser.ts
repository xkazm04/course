/**
 * Parses error messages to extract line numbers
 * Supports common error formats from JavaScript/React errors
 */

export interface ParsedErrorLine {
    lineNumber: number;
    columnNumber?: number;
    source?: string;
}

/**
 * Extract line numbers from error message strings
 * Handles multiple common formats:
 * - "at line X" / "at line X, column Y"
 * - "Line X:" / "Line X, Column Y:"
 * - ":X:Y" (file:line:column format)
 * - "(X:Y)" (parenthetical format)
 * - "line X" in stack traces
 */
export function parseErrorLineNumbers(errorMessage: string): ParsedErrorLine[] {
    const results: ParsedErrorLine[] = [];
    const seenLines = new Set<number>();

    // Pattern 1: "at line X" or "at line X, column Y" (case insensitive)
    const atLinePattern = /at\s+line\s+(\d+)(?:,?\s*column\s+(\d+))?/gi;
    let match;
    while ((match = atLinePattern.exec(errorMessage)) !== null) {
        const lineNum = parseInt(match[1], 10);
        if (!seenLines.has(lineNum)) {
            seenLines.add(lineNum);
            results.push({
                lineNumber: lineNum,
                columnNumber: match[2] ? parseInt(match[2], 10) : undefined,
            });
        }
    }

    // Pattern 2: "Line X:" or "Line X, Column Y:" at start of message
    const lineColonPattern = /\bLine\s+(\d+)(?:,?\s*Column\s+(\d+))?:/gi;
    while ((match = lineColonPattern.exec(errorMessage)) !== null) {
        const lineNum = parseInt(match[1], 10);
        if (!seenLines.has(lineNum)) {
            seenLines.add(lineNum);
            results.push({
                lineNumber: lineNum,
                columnNumber: match[2] ? parseInt(match[2], 10) : undefined,
            });
        }
    }

    // Pattern 3: ":X:Y" format (file:line:column) - common in stack traces
    // e.g., "script.js:12:5" or "<anonymous>:5:10"
    const fileLineColPattern = /(?:[\w.<>]+)?:(\d+):(\d+)/g;
    while ((match = fileLineColPattern.exec(errorMessage)) !== null) {
        const lineNum = parseInt(match[1], 10);
        if (lineNum > 0 && lineNum < 10000 && !seenLines.has(lineNum)) {
            seenLines.add(lineNum);
            results.push({
                lineNumber: lineNum,
                columnNumber: parseInt(match[2], 10),
            });
        }
    }

    // Pattern 4: "(X:Y)" format - parenthetical line:column
    const parenPattern = /\((\d+):(\d+)\)/g;
    while ((match = parenPattern.exec(errorMessage)) !== null) {
        const lineNum = parseInt(match[1], 10);
        if (lineNum > 0 && lineNum < 10000 && !seenLines.has(lineNum)) {
            seenLines.add(lineNum);
            results.push({
                lineNumber: lineNum,
                columnNumber: parseInt(match[2], 10),
            });
        }
    }

    // Pattern 5: "line X" anywhere in message (case insensitive)
    const genericLinePattern = /\bline\s+(\d+)\b/gi;
    while ((match = genericLinePattern.exec(errorMessage)) !== null) {
        const lineNum = parseInt(match[1], 10);
        if (lineNum > 0 && lineNum < 10000 && !seenLines.has(lineNum)) {
            seenLines.add(lineNum);
            results.push({
                lineNumber: lineNum,
            });
        }
    }

    return results;
}

/**
 * Get the first/primary error line from a message
 */
export function getPrimaryErrorLine(errorMessage: string): ParsedErrorLine | null {
    const lines = parseErrorLineNumbers(errorMessage);
    return lines.length > 0 ? lines[0] : null;
}

/**
 * Check if a line number appears in the error message
 */
export function hasErrorAtLine(errorMessage: string, lineNumber: number): boolean {
    const lines = parseErrorLineNumbers(errorMessage);
    return lines.some(l => l.lineNumber === lineNumber);
}
