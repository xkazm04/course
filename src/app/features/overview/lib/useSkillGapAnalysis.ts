/**
 * useSkillGapAnalysis Hook
 *
 * React hook that integrates skill gap analysis with ProgressContext
 * to provide real-time skill gap overlay data for the Knowledge Map.
 */

import { useMemo } from "react";
import { CurriculumNode, CurriculumConnection, CurriculumData } from "./curriculumTypes";
import {
    analyzeSkillGaps,
    SkillGapAnalysis,
    NodeSkillGapResult,
    SkillMasteryLevel,
} from "./skillGapAnalysis";

interface UseSkillGapAnalysisOptions {
    /** Curriculum data with nodes and connections */
    curriculumData: CurriculumData;
    /** IDs of nodes the user has completed */
    completedNodeIds: Set<string>;
    /** IDs of nodes the user is currently working on */
    inProgressNodeIds: Set<string>;
    /** Whether skill gap mode is enabled */
    enabled: boolean;
}

interface UseSkillGapAnalysisResult {
    /** Full skill gap analysis result */
    analysis: SkillGapAnalysis | null;
    /** Get mastery level for a specific node */
    getNodeMastery: (nodeId: string) => SkillMasteryLevel | null;
    /** Get full gap result for a specific node */
    getNodeGapResult: (nodeId: string) => NodeSkillGapResult | null;
    /** Check if a connection is a recommended path */
    isRecommendedPath: (fromId: string, toId: string) => boolean;
    /** Stats summary */
    stats: {
        totalMastered: number;
        totalPartial: number;
        totalGap: number;
        masteredSkillCount: number;
    };
}

/**
 * Hook to perform skill gap analysis based on user progress
 */
export function useSkillGapAnalysis({
    curriculumData,
    completedNodeIds,
    inProgressNodeIds,
    enabled,
}: UseSkillGapAnalysisOptions): UseSkillGapAnalysisResult {
    const analysis = useMemo(() => {
        if (!enabled) return null;

        return analyzeSkillGaps(
            curriculumData.nodes,
            curriculumData.connections,
            completedNodeIds,
            inProgressNodeIds
        );
    }, [curriculumData, completedNodeIds, inProgressNodeIds, enabled]);

    const getNodeMastery = useMemo(() => {
        return (nodeId: string): SkillMasteryLevel | null => {
            if (!analysis) return null;
            return analysis.nodeResults.get(nodeId)?.masteryLevel ?? null;
        };
    }, [analysis]);

    const getNodeGapResult = useMemo(() => {
        return (nodeId: string): NodeSkillGapResult | null => {
            if (!analysis) return null;
            return analysis.nodeResults.get(nodeId) ?? null;
        };
    }, [analysis]);

    const isRecommendedPath = useMemo(() => {
        return (fromId: string, toId: string): boolean => {
            if (!analysis) return false;
            return analysis.recommendedPaths.has(`${fromId}->${toId}`);
        };
    }, [analysis]);

    const stats = useMemo(() => {
        if (!analysis) {
            return {
                totalMastered: 0,
                totalPartial: 0,
                totalGap: 0,
                masteredSkillCount: 0,
            };
        }
        return {
            totalMastered: analysis.totalMastered,
            totalPartial: analysis.totalPartial,
            totalGap: analysis.totalGap,
            masteredSkillCount: analysis.userMasteredSkills.size,
        };
    }, [analysis]);

    return {
        analysis,
        getNodeMastery,
        getNodeGapResult,
        isRecommendedPath,
        stats,
    };
}

/**
 * Extract completed and in-progress node IDs from curriculum data based on node status.
 * This is used when ProgressContext data isn't available and we rely on
 * the static status in curriculumData.
 */
export function extractProgressFromCurriculumStatus(
    nodes: CurriculumNode[]
): { completedNodeIds: Set<string>; inProgressNodeIds: Set<string> } {
    const completedNodeIds = new Set<string>();
    const inProgressNodeIds = new Set<string>();

    for (const node of nodes) {
        if (node.status === "completed") {
            completedNodeIds.add(node.id);
        } else if (node.status === "in_progress") {
            inProgressNodeIds.add(node.id);
        }
    }

    return { completedNodeIds, inProgressNodeIds };
}
