"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import type { CodeFile } from "./types";
import {
    type Concept,
    type ConceptCodeRegion,
    type ConceptBridgeState,
    parseConceptAnnotations,
    getConceptsForLine,
    getLinesForConcept,
    getConceptColor,
    formatConceptName,
} from "./conceptBridge";

export interface UseConceptBridgeOptions {
    /** Files to parse for concept annotations */
    files: CodeFile[];
    /** Optional map of concept definitions */
    conceptDefinitions?: Map<string, Concept>;
    /** Whether concept highlighting is initially enabled */
    initialEnabled?: boolean;
    /** Callback when a concept is activated (clicked) */
    onConceptActivate?: (conceptId: string | null) => void;
    /** Callback when hovering over a concept region */
    onConceptHover?: (conceptIds: string[] | null) => void;
}

export interface UseConceptBridgeReturn {
    /** Current state of the concept bridge */
    state: ConceptBridgeState;
    /** All parsed code regions across all files */
    allRegions: ConceptCodeRegion[];
    /** Get regions for a specific file */
    getRegionsForFile: (fileId: string) => ConceptCodeRegion[];
    /** Get concepts that apply to a specific line in a file */
    getConceptsForLine: (fileId: string, lineNumber: number) => Concept[];
    /** Get all lines in a file that are linked to a concept */
    getLinesForConcept: (fileId: string, conceptId: string) => number[];
    /** Set the currently active concept (for highlighting) */
    setActiveConcept: (conceptId: string | null) => void;
    /** Set the currently hovered line */
    setHoveredLine: (lineNumber: number | null) => void;
    /** Toggle concept highlighting on/off */
    toggleEnabled: () => void;
    /** Check if a line is highlighted by the active concept */
    isLineHighlighted: (fileId: string, lineNumber: number) => boolean;
    /** Check if a line is in any concept region */
    isLineInConcept: (fileId: string, lineNumber: number) => boolean;
    /** Get color for a concept */
    getConceptColor: (conceptId: string) => string;
    /** Get formatted name for a concept */
    getConceptName: (conceptId: string) => string;
    /** Get all unique concepts across all files */
    allConcepts: Concept[];
}

/**
 * Hook for managing the bidirectional code-concept bridge
 */
export function useConceptBridge({
    files,
    conceptDefinitions = new Map(),
    initialEnabled = true,
    onConceptActivate,
    onConceptHover,
}: UseConceptBridgeOptions): UseConceptBridgeReturn {
    // State
    const [activeConceptId, setActiveConceptId] = useState<string | null>(null);
    const [hoveredLine, setHoveredLine] = useState<number | null>(null);
    const [isEnabled, setIsEnabled] = useState(initialEnabled);
    const [concepts] = useState<Map<string, Concept>>(conceptDefinitions);

    // Parse all files for concept annotations
    const { codeRegions, allRegions, allConcepts } = useMemo(() => {
        const regionsMap = new Map<string, ConceptCodeRegion[]>();
        const allRegions: ConceptCodeRegion[] = [];
        const uniqueConceptIds = new Set<string>();

        for (const file of files) {
            const { regions } = parseConceptAnnotations(file.content, file.id);
            regionsMap.set(file.id, regions);
            allRegions.push(...regions);

            // Collect unique concept IDs
            for (const region of regions) {
                for (const conceptId of region.conceptIds) {
                    uniqueConceptIds.add(conceptId);
                }
            }
        }

        // Create concept objects for all found concepts
        const allConcepts: Concept[] = Array.from(uniqueConceptIds).map((id) => {
            // Use provided definition or create default
            const definition = concepts.get(id);
            return (
                definition || {
                    id,
                    name: formatConceptName(id),
                    color: getConceptColor(id),
                }
            );
        });

        return { codeRegions: regionsMap, allRegions, allConcepts };
    }, [files, concepts]);

    // Get regions for a specific file
    const getRegionsForFile = useCallback(
        (fileId: string): ConceptCodeRegion[] => {
            return codeRegions.get(fileId) || [];
        },
        [codeRegions]
    );

    // Get concepts for a specific line
    const getConceptsForLineInFile = useCallback(
        (fileId: string, lineNumber: number): Concept[] => {
            const regions = getRegionsForFile(fileId);
            const matchingRegions = getConceptsForLine(regions, lineNumber);

            const conceptIds = new Set<string>();
            for (const region of matchingRegions) {
                for (const id of region.conceptIds) {
                    conceptIds.add(id);
                }
            }

            return Array.from(conceptIds).map((id) => {
                const definition = concepts.get(id);
                return (
                    definition || {
                        id,
                        name: formatConceptName(id),
                        color: getConceptColor(id),
                    }
                );
            });
        },
        [getRegionsForFile, concepts]
    );

    // Get lines for a concept in a file
    const getLinesForConceptInFile = useCallback(
        (fileId: string, conceptId: string): number[] => {
            const regions = getRegionsForFile(fileId);
            return getLinesForConcept(regions, conceptId);
        },
        [getRegionsForFile]
    );

    // Set active concept
    const setActiveConcept = useCallback(
        (conceptId: string | null) => {
            setActiveConceptId(conceptId);
            onConceptActivate?.(conceptId);
        },
        [onConceptActivate]
    );

    // Handle hovered line change
    const handleSetHoveredLine = useCallback(
        (lineNumber: number | null) => {
            setHoveredLine(lineNumber);
        },
        []
    );

    // Notify when hovering over concept regions
    useEffect(() => {
        if (hoveredLine === null) {
            onConceptHover?.(null);
            return;
        }

        // Find concepts for the hovered line in any file
        const conceptIds: string[] = [];
        for (const [, regions] of codeRegions) {
            const matching = getConceptsForLine(regions, hoveredLine);
            for (const region of matching) {
                conceptIds.push(...region.conceptIds);
            }
        }

        if (conceptIds.length > 0) {
            onConceptHover?.(Array.from(new Set(conceptIds)));
        } else {
            onConceptHover?.(null);
        }
    }, [hoveredLine, codeRegions, onConceptHover]);

    // Toggle enabled state
    const toggleEnabled = useCallback(() => {
        setIsEnabled((prev) => !prev);
    }, []);

    // Check if a line is highlighted by the active concept
    const isLineHighlighted = useCallback(
        (fileId: string, lineNumber: number): boolean => {
            if (!isEnabled || !activeConceptId) return false;
            const lines = getLinesForConceptInFile(fileId, activeConceptId);
            return lines.includes(lineNumber);
        },
        [isEnabled, activeConceptId, getLinesForConceptInFile]
    );

    // Check if a line is in any concept region
    const isLineInConcept = useCallback(
        (fileId: string, lineNumber: number): boolean => {
            if (!isEnabled) return false;
            const regions = getRegionsForFile(fileId);
            return regions.some(
                (region) => lineNumber >= region.startLine && lineNumber <= region.endLine
            );
        },
        [isEnabled, getRegionsForFile]
    );

    // Get concept color wrapper
    const getConceptColorWrapper = useCallback((conceptId: string): string => {
        return getConceptColor(conceptId);
    }, []);

    // Get concept name wrapper
    const getConceptNameWrapper = useCallback((conceptId: string): string => {
        const definition = concepts.get(conceptId);
        return definition?.name || formatConceptName(conceptId);
    }, [concepts]);

    // Build state object
    const state: ConceptBridgeState = useMemo(
        () => ({
            activeConceptId,
            hoveredLine,
            concepts,
            codeRegions,
            isEnabled,
        }),
        [activeConceptId, hoveredLine, concepts, codeRegions, isEnabled]
    );

    return {
        state,
        allRegions,
        getRegionsForFile,
        getConceptsForLine: getConceptsForLineInFile,
        getLinesForConcept: getLinesForConceptInFile,
        setActiveConcept,
        setHoveredLine: handleSetHoveredLine,
        toggleEnabled,
        isLineHighlighted,
        isLineInConcept,
        getConceptColor: getConceptColorWrapper,
        getConceptName: getConceptNameWrapper,
        allConcepts,
    };
}
