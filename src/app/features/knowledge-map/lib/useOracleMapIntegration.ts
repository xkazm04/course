/**
 * Oracle Map Integration Hook
 *
 * Wraps useCareerOracle and adds knowledge map integration state
 * for managing recommended nodes, hypothetical nodes, and forge animations.
 */

'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useCareerOracle, type UseCareerOracleReturn } from '@/app/features/goal-path/lib/useCareerOracle';
import type { PredictiveModule, PredictiveLearningPath } from '@/app/features/goal-path/lib/predictiveTypes';
import type {
    OracleMapIntegrationState,
    OracleWizardStep,
    HypotheticalMapNode,
    RecommendedPathConnection,

    MapNode,
    NodeLevel,
} from './types';
import { mapModuleToHypotheticalNode, mapPathToConnections, findMatchingNodes } from './oracleNodeMapping';

// ============================================================================
// TYPES
// ============================================================================

export interface UseOracleMapIntegrationOptions {
    /** Enable debug logging */
    debug?: boolean;
    /** Auto-expand panel when path is generated */
    autoExpandOnPath?: boolean;

    /** Available map nodes for matching */
    existingNodes?: MapNode[];
}

export interface UseOracleMapIntegrationReturn extends UseCareerOracleReturn {
    // Map integration state
    integration: OracleMapIntegrationState;

    // Panel controls
    expandBottomPanel: () => void;
    collapseBottomPanel: () => void;
    toggleBottomPanel: () => void;

    // Path preview controls
    showPathPreview: () => void;
    hidePathPreview: () => void;
    togglePathPreview: () => void;

    // Wizard step controls (compact version)
    setActiveWizardStep: (step: OracleWizardStep) => void;
    nextWizardStep: () => void;
    prevWizardStep: () => void;
    canProceedToNext: boolean;
    canGoBack: boolean;

    // Node highlighting
    highlightRecommendedNodes: (nodeIds: string[]) => void;
    clearRecommendedNodes: () => void;

    // Hypothetical nodes
    addHypotheticalNodes: (nodes: HypotheticalMapNode[]) => void;
    clearHypotheticalNodes: () => void;

    // Path confirmation
    confirmPath: () => Promise<HypotheticalMapNode[]>;
    isConfirming: boolean;

    // Computed
    hasGeneratedPath: boolean;
    hypotheticalNodeCount: number;
    recommendedNodeCount: number;
}

// ============================================================================
// WIZARD STEP ORDER
// ============================================================================

const wizardStepOrder: OracleWizardStep[] = ['skills', 'goal', 'preferences', 'generating', 'complete'];

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useOracleMapIntegration(
    options: UseOracleMapIntegrationOptions = {}
): UseOracleMapIntegrationReturn {
    const { debug, autoExpandOnPath = true, existingNodes = [] } = options;

    // Wrap the base Career Oracle hook
    const oracle = useCareerOracle();

    // ========================================================================
    // INTEGRATION STATE
    // ========================================================================

    const [integration, setIntegration] = useState<OracleMapIntegrationState>({
        recommendedNodeIds: new Set<string>(),
        hypotheticalNodes: [],
        pathConnections: [],
        bottomPanelExpanded: false,
        pathPreviewVisible: false,
        activeStep: 'skills',
    });

    const [isConfirming, setIsConfirming] = useState(false);

    // ========================================================================
    // PANEL CONTROLS
    // ========================================================================

    const expandBottomPanel = useCallback(() => {
        if (debug) console.log('[OracleMapIntegration] Expanding bottom panel');
        setIntegration(prev => ({ ...prev, bottomPanelExpanded: true }));
    }, [debug]);

    const collapseBottomPanel = useCallback(() => {
        if (debug) console.log('[OracleMapIntegration] Collapsing bottom panel');
        setIntegration(prev => ({ ...prev, bottomPanelExpanded: false }));
    }, [debug]);

    const toggleBottomPanel = useCallback(() => {
        setIntegration(prev => {
            if (debug) console.log('[OracleMapIntegration] Toggling panel:', !prev.bottomPanelExpanded);
            return { ...prev, bottomPanelExpanded: !prev.bottomPanelExpanded };
        });
    }, [debug]);

    // ========================================================================
    // PATH PREVIEW CONTROLS
    // ========================================================================

    const showPathPreview = useCallback(() => {
        if (debug) console.log('[OracleMapIntegration] Showing path preview');
        setIntegration(prev => ({ ...prev, pathPreviewVisible: true }));
    }, [debug]);

    const hidePathPreview = useCallback(() => {
        if (debug) console.log('[OracleMapIntegration] Hiding path preview');
        setIntegration(prev => ({ ...prev, pathPreviewVisible: false }));
    }, [debug]);

    const togglePathPreview = useCallback(() => {
        setIntegration(prev => ({ ...prev, pathPreviewVisible: !prev.pathPreviewVisible }));
    }, [debug]);

    // ========================================================================
    // WIZARD STEP CONTROLS
    // ========================================================================

    const setActiveWizardStep = useCallback((step: OracleWizardStep) => {
        if (debug) console.log('[OracleMapIntegration] Setting wizard step:', step);
        setIntegration(prev => ({ ...prev, activeStep: step }));
    }, [debug]);

    const nextWizardStep = useCallback(() => {
        setIntegration(prev => {
            const currentIndex = wizardStepOrder.indexOf(prev.activeStep);
            const nextIndex = Math.min(currentIndex + 1, wizardStepOrder.length - 1);
            const nextStep = wizardStepOrder[nextIndex];
            if (debug) console.log('[OracleMapIntegration] Next step:', nextStep);
            return { ...prev, activeStep: nextStep };
        });
    }, [debug]);

    const prevWizardStep = useCallback(() => {
        setIntegration(prev => {
            const currentIndex = wizardStepOrder.indexOf(prev.activeStep);
            const prevIndex = Math.max(currentIndex - 1, 0);
            const prevStep = wizardStepOrder[prevIndex];
            if (debug) console.log('[OracleMapIntegration] Previous step:', prevStep);
            return { ...prev, activeStep: prevStep };
        });
    }, [debug]);

    const canProceedToNext = useMemo(() => {
        const step = integration.activeStep;
        const profile = oracle.state.userProfile;

        switch (step) {
            case 'skills':
                return (profile.currentSkills?.length ?? 0) >= 1;
            case 'goal':
                return !!profile.targetRole;
            case 'preferences':
                return true; // Preferences are optional
            case 'generating':
            case 'complete':
                return false;
            default:
                return false;
        }
    }, [integration.activeStep, oracle.state.userProfile]);

    const canGoBack = useMemo(() => {
        const currentIndex = wizardStepOrder.indexOf(integration.activeStep);
        return currentIndex > 0 && integration.activeStep !== 'generating';
    }, [integration.activeStep]);

    // ========================================================================
    // NODE HIGHLIGHTING
    // ========================================================================

    const highlightRecommendedNodes = useCallback((nodeIds: string[]) => {
        if (debug) console.log('[OracleMapIntegration] Highlighting nodes:', nodeIds);
        setIntegration(prev => ({
            ...prev,
            recommendedNodeIds: new Set(nodeIds),
        }));
    }, [debug]);

    const clearRecommendedNodes = useCallback(() => {
        if (debug) console.log('[OracleMapIntegration] Clearing recommended nodes');
        setIntegration(prev => ({
            ...prev,
            recommendedNodeIds: new Set<string>(),
        }));
    }, [debug]);

    // ========================================================================
    // HYPOTHETICAL NODES
    // ========================================================================

    const addHypotheticalNodes = useCallback((nodes: HypotheticalMapNode[]) => {
        if (debug) console.log('[OracleMapIntegration] Adding hypothetical nodes:', nodes.length);
        setIntegration(prev => ({
            ...prev,
            hypotheticalNodes: [...prev.hypotheticalNodes, ...nodes],
        }));
    }, [debug]);

    const clearHypotheticalNodes = useCallback(() => {
        if (debug) console.log('[OracleMapIntegration] Clearing hypothetical nodes');
        setIntegration(prev => ({
            ...prev,
            hypotheticalNodes: [],
            pathConnections: [],
        }));
    }, [debug]);

    // ========================================================================
    // PATH CONFIRMATION
    // ========================================================================

    const confirmPath = useCallback(async (): Promise<HypotheticalMapNode[]> => {
        if (debug) console.log('[OracleMapIntegration] Confirming path');
        setIsConfirming(true);

        const nodesToConfirm = [...integration.hypotheticalNodes];

        // Simulate API delay for creating nodes on backend
        await new Promise<void>(resolve => setTimeout(resolve, 800));

        // Clear hypothetical nodes (they're now "real" - handled by parent via onPathConfirmed)
        clearHypotheticalNodes();
        setIsConfirming(false);

        if (debug) console.log('[OracleMapIntegration] Path confirmed, returning nodes:', nodesToConfirm.length);
        return nodesToConfirm;
    }, [debug, integration.hypotheticalNodes, clearHypotheticalNodes]);

    // ========================================================================
    // EFFECTS: Sync with Oracle state
    // ========================================================================

    // When path is generated, map modules to nodes
    const processedPathRef = useRef<string | null>(null);

    useEffect(() => {
        const path = oracle.state.predictions.suggestedPath;

        // Guard: Only process if we have a new path
        const pathId = path ? `${path.modules.length}-${path.modules[0]?.id}` : null;
        if (pathId === processedPathRef.current) {
            return; // Already processed this path
        }

        if (path && path.modules.length > 0) {
            if (debug) console.log('[OracleMapIntegration] Path generated, mapping modules');
            processedPathRef.current = pathId;

            // Find which existing nodes match the path
            const matchingNodeIds = findMatchingNodes(path.modules, existingNodes);

            // Create hypothetical nodes for modules not matching existing nodes
            const hypotheticalNodes = path.modules
                .filter(module => !matchingNodeIds.some(id =>
                    id.toLowerCase().includes(module.skills[0]?.toLowerCase() ?? '')
                ))
                .map((module, index) => mapModuleToHypotheticalNode(module, index, existingNodes));

            // Create connections between nodes
            const connections = mapPathToConnections(path.modules, hypotheticalNodes, existingNodes);

            // Update all state in a single call
            setIntegration(prev => ({
                ...prev,
                recommendedNodeIds: new Set(matchingNodeIds),
                hypotheticalNodes,
                pathConnections: connections,
                activeStep: 'complete',
                pathPreviewVisible: autoExpandOnPath ? true : prev.pathPreviewVisible,
            }));
        }
    }, [oracle.state.predictions.suggestedPath, existingNodes, debug, autoExpandOnPath]);

    // Sync wizard step with oracle step
    useEffect(() => {
        const oracleStep = oracle.state.step;

        // Map oracle steps to wizard steps
        if (oracleStep === 'skills') {
            setActiveWizardStep('skills');
        } else if (oracleStep === 'goal') {
            setActiveWizardStep('goal');
        } else if (oracleStep === 'preferences') {
            setActiveWizardStep('preferences');
        } else if (oracleStep === 'analyzing') {
            setActiveWizardStep('generating');
        } else if (oracleStep === 'path' || oracleStep === 'insights') {
            setActiveWizardStep('complete');
        }
    }, [oracle.state.step, setActiveWizardStep]);

    // ========================================================================
    // COMPUTED VALUES
    // ========================================================================

    const hasGeneratedPath = useMemo(() => {
        return oracle.state.predictions.suggestedPath !== null;
    }, [oracle.state.predictions.suggestedPath]);

    const hypotheticalNodeCount = useMemo(() => {
        return integration.hypotheticalNodes.length;
    }, [integration.hypotheticalNodes]);

    const recommendedNodeCount = useMemo(() => {
        return integration.recommendedNodeIds.size;
    }, [integration.recommendedNodeIds]);

    // ========================================================================
    // RETURN
    // ========================================================================

    return {
        // Spread all oracle methods
        ...oracle,

        // Integration state
        integration,

        // Panel controls
        expandBottomPanel,
        collapseBottomPanel,
        toggleBottomPanel,

        // Path preview controls
        showPathPreview,
        hidePathPreview,
        togglePathPreview,

        // Wizard step controls
        setActiveWizardStep,
        nextWizardStep,
        prevWizardStep,
        canProceedToNext,
        canGoBack,

        // Node highlighting
        highlightRecommendedNodes,
        clearRecommendedNodes,

        // Hypothetical nodes
        addHypotheticalNodes,
        clearHypotheticalNodes,

        // Path confirmation
        confirmPath,
        isConfirming,

        // Computed
        hasGeneratedPath,
        hypotheticalNodeCount,
        recommendedNodeCount,
    };
}
