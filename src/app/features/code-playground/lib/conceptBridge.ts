/**
 * Code-Concept Bridge: Bidirectional Linking System
 *
 * This module provides types and utilities for creating bidirectional links
 * between code in the playground and learning concepts in the curriculum.
 *
 * Code annotations use the format: // @concept:conceptId or // @concept:conceptId "description"
 * Multiple concepts can be linked: // @concept:closures,scopes "demonstrates closures and scopes"
 */

/** Represents a concept that can be linked to code regions */
export interface Concept {
    /** Unique identifier for the concept (e.g., "closures", "higher-order-functions") */
    id: string;
    /** Human-readable name for the concept */
    name: string;
    /** Optional description of the concept */
    description?: string;
    /** Optional URL to curriculum content */
    contentUrl?: string;
    /** Optional icon for the concept */
    icon?: string;
    /** Optional color theme for the concept */
    color?: string;
}

/** A region of code that is linked to one or more concepts */
export interface ConceptCodeRegion {
    /** Line number where the region starts (1-based) */
    startLine: number;
    /** Line number where the region ends (1-based, inclusive) */
    endLine: number;
    /** IDs of concepts linked to this region */
    conceptIds: string[];
    /** Optional inline description from the annotation */
    inlineDescription?: string;
    /** The file ID this region belongs to */
    fileId: string;
}

/** Parsed annotation from a code comment */
export interface ConceptAnnotation {
    /** Line number where the annotation appears */
    lineNumber: number;
    /** IDs of concepts referenced in the annotation */
    conceptIds: string[];
    /** Optional description from the annotation */
    description?: string;
    /** Whether this is an end marker (@concept:end) */
    isEndMarker: boolean;
    /** Whether this is a single-line annotation (no block) */
    isSingleLine: boolean;
}

/** State for the concept bridge */
export interface ConceptBridgeState {
    /** Currently active/highlighted concept ID */
    activeConceptId: string | null;
    /** Currently hovered line number */
    hoveredLine: number | null;
    /** Map of concept IDs to their definitions */
    concepts: Map<string, Concept>;
    /** Map of file IDs to their code regions */
    codeRegions: Map<string, ConceptCodeRegion[]>;
    /** Whether concept highlighting is enabled */
    isEnabled: boolean;
}

/**
 * Annotation pattern regex
 * Matches: // @concept:id1,id2 "optional description"
 * Also matches block end: // @concept:end
 */
const CONCEPT_ANNOTATION_PATTERN = /\/\/\s*@concept:([\w,-]+)(?:\s+"([^"]*)")?/;
const CONCEPT_END_PATTERN = /\/\/\s*@concept:end/;
const CONCEPT_SINGLE_LINE_PATTERN = /\/\/\s*@concept-line:([\w,-]+)(?:\s+"([^"]*)")?/;

/**
 * Parse concept annotations from code
 * @param code - The source code to parse
 * @param fileId - The file ID for this code
 * @returns Array of code regions with concept links
 */
export function parseConceptAnnotations(
    code: string,
    fileId: string
): { regions: ConceptCodeRegion[]; annotations: ConceptAnnotation[] } {
    const lines = code.split("\n");
    const annotations: ConceptAnnotation[] = [];
    const regions: ConceptCodeRegion[] = [];

    // First pass: find all annotations
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;

        // Check for single-line annotations
        const singleLineMatch = line.match(CONCEPT_SINGLE_LINE_PATTERN);
        if (singleLineMatch) {
            const conceptIds = singleLineMatch[1].split(",").map((id) => id.trim());
            const description = singleLineMatch[2];
            annotations.push({
                lineNumber,
                conceptIds,
                description,
                isEndMarker: false,
                isSingleLine: true,
            });
            continue;
        }

        // Check for end markers
        if (CONCEPT_END_PATTERN.test(line)) {
            annotations.push({
                lineNumber,
                conceptIds: [],
                isEndMarker: true,
                isSingleLine: false,
            });
            continue;
        }

        // Check for block start annotations
        const blockMatch = line.match(CONCEPT_ANNOTATION_PATTERN);
        if (blockMatch) {
            const conceptIds = blockMatch[1].split(",").map((id) => id.trim());
            const description = blockMatch[2];

            // Skip if it's actually an end marker
            if (conceptIds.length === 1 && conceptIds[0] === "end") {
                annotations.push({
                    lineNumber,
                    conceptIds: [],
                    isEndMarker: true,
                    isSingleLine: false,
                });
            } else {
                annotations.push({
                    lineNumber,
                    conceptIds,
                    description,
                    isEndMarker: false,
                    isSingleLine: false,
                });
            }
        }
    }

    // Second pass: create regions from annotations
    const blockStack: ConceptAnnotation[] = [];

    for (const annotation of annotations) {
        if (annotation.isSingleLine) {
            // Single line annotation - the next line is the concept region
            regions.push({
                startLine: annotation.lineNumber + 1,
                endLine: annotation.lineNumber + 1,
                conceptIds: annotation.conceptIds,
                inlineDescription: annotation.description,
                fileId,
            });
        } else if (annotation.isEndMarker) {
            // Close the most recent block
            if (blockStack.length > 0) {
                const startAnnotation = blockStack.pop()!;
                regions.push({
                    startLine: startAnnotation.lineNumber + 1,
                    endLine: annotation.lineNumber - 1,
                    conceptIds: startAnnotation.conceptIds,
                    inlineDescription: startAnnotation.description,
                    fileId,
                });
            }
        } else {
            // Start a new block
            blockStack.push(annotation);
        }
    }

    // Handle unclosed blocks - extend to end of file
    while (blockStack.length > 0) {
        const startAnnotation = blockStack.pop()!;
        regions.push({
            startLine: startAnnotation.lineNumber + 1,
            endLine: lines.length,
            conceptIds: startAnnotation.conceptIds,
            inlineDescription: startAnnotation.description,
            fileId,
        });
    }

    return { regions, annotations };
}

/**
 * Get all concepts that appear on a specific line
 */
export function getConceptsForLine(
    regions: ConceptCodeRegion[],
    lineNumber: number
): ConceptCodeRegion[] {
    return regions.filter(
        (region) => lineNumber >= region.startLine && lineNumber <= region.endLine
    );
}

/**
 * Get all lines that are linked to a specific concept
 */
export function getLinesForConcept(
    regions: ConceptCodeRegion[],
    conceptId: string
): number[] {
    const lines: Set<number> = new Set();

    for (const region of regions) {
        if (region.conceptIds.includes(conceptId)) {
            for (let line = region.startLine; line <= region.endLine; line++) {
                lines.add(line);
            }
        }
    }

    return Array.from(lines).sort((a, b) => a - b);
}

/**
 * Check if a line is within any concept region
 */
export function isLineInConceptRegion(
    regions: ConceptCodeRegion[],
    lineNumber: number
): boolean {
    return regions.some(
        (region) => lineNumber >= region.startLine && lineNumber <= region.endLine
    );
}

/**
 * Generate a unique color for a concept based on its ID
 */
export function getConceptColor(conceptId: string): string {
    // Pre-defined colors for common concepts
    const conceptColors: Record<string, string> = {
        closures: "#8b5cf6", // violet
        "higher-order-functions": "#06b6d4", // cyan
        "arrow-functions": "#f59e0b", // amber
        promises: "#10b981", // emerald
        "async-await": "#3b82f6", // blue
        destructuring: "#ec4899", // pink
        spread: "#f97316", // orange
        "template-literals": "#84cc16", // lime
        classes: "#6366f1", // indigo
        modules: "#14b8a6", // teal
        callbacks: "#a855f7", // purple
        "event-loop": "#ef4444", // red
        prototypes: "#0ea5e9", // sky
        scope: "#22c55e", // green
        hoisting: "#eab308", // yellow
        "this-binding": "#d946ef", // fuchsia
    };

    if (conceptColors[conceptId]) {
        return conceptColors[conceptId];
    }

    // Generate color from hash for unknown concepts
    let hash = 0;
    for (let i = 0; i < conceptId.length; i++) {
        const char = conceptId.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 55%)`;
}

/**
 * Format concept ID to human-readable name
 */
export function formatConceptName(conceptId: string): string {
    return conceptId
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}
