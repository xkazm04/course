"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    ArrowRight,
    Brain,
    ChevronDown,
    ChevronRight,
    CircleDot,
    Info,
    Lightbulb,
    Play,
    RefreshCw,
    Target,
    TrendingDown,
    X,
    Zap,
} from "lucide-react";
import {
    useConceptEntanglement,
    useConceptState,
    useRepairPath,
    useGraphHealth,
} from "../lib/useConceptEntanglement";
import type {
    ConceptId,
    EntanglementState,
} from "../lib/conceptEntanglementGraph";

// ============================================================================
// STYLING CONFIGURATIONS
// ============================================================================

const STATE_STYLES: Record<
    EntanglementState,
    {
        bg: string;
        border: string;
        text: string;
        icon: string;
        label: string;
        emoji: string;
    }
> = {
    mastered: {
        bg: "bg-purple-500/20",
        border: "border-purple-500/50",
        text: "text-purple-400",
        icon: "text-purple-400",
        label: "Mastered",
        emoji: "🚀",
    },
    stable: {
        bg: "bg-emerald-500/20",
        border: "border-emerald-500/50",
        text: "text-emerald-400",
        icon: "text-emerald-400",
        label: "Stable",
        emoji: "✅",
    },
    unstable: {
        bg: "bg-yellow-500/20",
        border: "border-yellow-500/50",
        text: "text-yellow-400",
        icon: "text-yellow-400",
        label: "Unstable",
        emoji: "⚠️",
    },
    struggling: {
        bg: "bg-orange-500/20",
        border: "border-orange-500/50",
        text: "text-orange-400",
        icon: "text-orange-400",
        label: "Struggling",
        emoji: "🔧",
    },
    collapsed: {
        bg: "bg-red-500/20",
        border: "border-red-500/50",
        text: "text-red-400",
        icon: "text-red-400",
        label: "Needs Review",
        emoji: "🔴",
    },
    unknown: {
        bg: "bg-slate-500/20",
        border: "border-slate-500/50",
        text: "text-slate-400",
        icon: "text-slate-400",
        label: "Not Started",
        emoji: "⭕",
    },
};

// ============================================================================
// GRAPH HEALTH OVERVIEW
// ============================================================================

interface GraphHealthOverviewProps {
    className?: string;
    onConceptClick?: (conceptId: ConceptId) => void;
}

export function GraphHealthOverview({
    className = "",
    onConceptClick,
}: GraphHealthOverviewProps) {
    const {
        score,
        stats,
        strugglingConcepts,
        hasIssues,
        criticalIssues,
    } = useGraphHealth();

    const [showDetails, setShowDetails] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm p-4 ${className}`}
            data-testid="graph-health-overview"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-400" />
                    <h3 className="font-semibold text-slate-200">Knowledge Graph Health</h3>
                </div>
                <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                        score >= 70
                            ? "bg-emerald-500/20 text-emerald-400"
                            : score >= 40
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                    }`}
                >
                    {score}%
                </div>
            </div>

            {/* Health Bar */}
            <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden mb-4">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${
                        score >= 70
                            ? "bg-gradient-to-r from-emerald-500 to-green-500"
                            : score >= 40
                            ? "bg-gradient-to-r from-yellow-500 to-amber-500"
                            : "bg-gradient-to-r from-red-500 to-orange-500"
                    }`}
                />
            </div>

            {/* State Distribution */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <StatBadge
                    label="Mastered"
                    count={stats.masteredCount}
                    color="purple"
                    emoji="🚀"
                />
                <StatBadge
                    label="Stable"
                    count={stats.stableCount}
                    color="emerald"
                    emoji="✅"
                />
                <StatBadge
                    label="Learning"
                    count={stats.unstableCount}
                    color="yellow"
                    emoji="📚"
                />
            </div>

            {/* Issues */}
            {hasIssues && (
                <div className="space-y-2 mb-4">
                    {criticalIssues > 0 && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-red-400">
                                {criticalIssues} concept{criticalIssues > 1 ? "s" : ""} need
                                immediate review
                            </span>
                        </div>
                    )}
                    {stats.strugglingCount > 0 && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                            <TrendingDown className="w-4 h-4 text-orange-400" />
                            <span className="text-sm text-orange-400">
                                {stats.strugglingCount} concept{stats.strugglingCount > 1 ? "s" : ""}{" "}
                                need practice
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Recommendations */}
            {stats.recommendations.length > 0 && (
                <div className="space-y-2">
                    {stats.recommendations.slice(0, 2).map((rec, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-2 text-sm text-slate-400"
                        >
                            <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Expand for details */}
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 mt-4 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                data-testid="graph-health-toggle-details"
            >
                {showDetails ? (
                    <ChevronDown className="w-4 h-4" />
                ) : (
                    <ChevronRight className="w-4 h-4" />
                )}
                {showDetails ? "Hide" : "Show"} struggling concepts
            </button>

            {/* Detailed list */}
            <AnimatePresence>
                {showDetails && strugglingConcepts.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 space-y-2 overflow-hidden"
                    >
                        {strugglingConcepts.map(({ concept, entanglement }) => (
                            <button
                                key={concept.id}
                                onClick={() => onConceptClick?.(concept.id)}
                                className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors text-left"
                                data-testid={`struggling-concept-${concept.id}`}
                            >
                                <div className="flex items-center gap-2">
                                    <span>
                                        {STATE_STYLES[entanglement.state].emoji}
                                    </span>
                                    <span className="text-sm text-slate-300">
                                        {concept.title}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`text-xs ${STATE_STYLES[entanglement.state].text}`}
                                    >
                                        {entanglement.comprehensionScore}%
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-slate-500" />
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function StatBadge({
    count,
    color,
    emoji,
}: {
    count: number;
    color: string;
    emoji: string;
}) {
    return (
        <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg bg-${color}-500/10 border border-${color}-500/20`}
        >
            <span className="text-xs">{emoji}</span>
            <span className="text-xs text-slate-400">{count}</span>
        </div>
    );
}

// ============================================================================
// CONCEPT NODE CARD
// ============================================================================

interface ConceptNodeCardProps {
    conceptId: ConceptId;
    showAnalysis?: boolean;
    onStartRepair?: () => void;
    className?: string;
}

export function ConceptNodeCard({
    conceptId,
    showAnalysis = false,
    onStartRepair,
    className = "",
}: ConceptNodeCardProps) {
    const { graph } = useConceptEntanglement();
    const { entanglement, state, score, rootCauses, forwardImpact } =
        useConceptState(conceptId);

    const concept = graph.nodes.get(conceptId);
    if (!concept) return null;

    const style = STATE_STYLES[state];
    const hasIssues = state === "struggling" || state === "collapsed";

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`rounded-xl border ${style.border} ${style.bg} backdrop-blur-sm p-4 ${className}`}
            data-testid={`concept-node-card-${conceptId}`}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{style.emoji}</span>
                    <div>
                        <h4 className="font-medium text-slate-200">{concept.title}</h4>
                        <p className="text-xs text-slate-500">{style.label}</p>
                    </div>
                </div>
                <div
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}
                >
                    {score}%
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-400 mb-3">{concept.description}</p>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden mb-3">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    className={`h-full rounded-full ${
                        state === "mastered"
                            ? "bg-purple-500"
                            : state === "stable"
                            ? "bg-emerald-500"
                            : state === "unstable"
                            ? "bg-yellow-500"
                            : state === "struggling"
                            ? "bg-orange-500"
                            : state === "collapsed"
                            ? "bg-red-500"
                            : "bg-slate-500"
                    }`}
                />
            </div>

            {/* Analysis section for struggling concepts */}
            {showAnalysis && hasIssues && (
                <div className="space-y-3 mt-4 pt-4 border-t border-slate-700/50">
                    {/* Root causes */}
                    {rootCauses && rootCauses.rootCauses.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4 text-red-400" />
                                <span className="text-xs font-medium text-slate-300">
                                    Root Causes Identified
                                </span>
                            </div>
                            <div className="space-y-1">
                                {rootCauses.rootCauses.slice(0, 3).map((cause) => {
                                    const causeNode = graph.nodes.get(cause.conceptId);
                                    return (
                                        <div
                                            key={cause.conceptId}
                                            className="flex items-center justify-between p-2 rounded-lg bg-red-500/10"
                                        >
                                            <span className="text-xs text-slate-300">
                                                {causeNode?.title ?? cause.conceptId}
                                            </span>
                                            <span
                                                className={`text-xs px-1.5 py-0.5 rounded ${
                                                    cause.severity === "critical"
                                                        ? "bg-red-500/30 text-red-400"
                                                        : cause.severity === "major"
                                                        ? "bg-orange-500/30 text-orange-400"
                                                        : "bg-yellow-500/30 text-yellow-400"
                                                }`}
                                            >
                                                {cause.severity}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Forward impact */}
                    {forwardImpact && forwardImpact.affectedConcepts.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                <span className="text-xs font-medium text-slate-300">
                                    Future Impact: {forwardImpact.totalAtRisk} concepts at risk
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Start repair button */}
                    {onStartRepair && (
                        <button
                            onClick={onStartRepair}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 text-indigo-400 transition-colors"
                            data-testid="start-repair-btn"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span className="text-sm font-medium">Start Repair Path</span>
                        </button>
                    )}
                </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between text-xs text-slate-500 mt-3">
                <span>
                    {entanglement?.attempts ?? 0} attempt
                    {(entanglement?.attempts ?? 0) !== 1 ? "s" : ""}
                </span>
                <span>
                    {Math.round((entanglement?.timeSpent ?? 0) / 60000)} min spent
                </span>
            </div>
        </motion.div>
    );
}

// ============================================================================
// REPAIR PATH WIZARD
// ============================================================================

interface RepairPathWizardProps {
    targetConceptId: ConceptId;
    onComplete?: () => void;
    onDismiss?: () => void;
    className?: string;
}

export function RepairPathWizard({
    targetConceptId,
    onComplete,
    onDismiss,
    className = "",
}: RepairPathWizardProps) {
    const { graph } = useConceptEntanglement();
    const { repairPath, currentStep, isActive, start, completeStep, dismiss } =
        useRepairPath(targetConceptId);

    const targetConcept = graph.nodes.get(targetConceptId);

    // Auto-start if not active
    React.useEffect(() => {
        if (!isActive && targetConcept) {
            start();
        }
    }, [isActive, targetConcept, start]);

    if (!repairPath || !targetConcept) return null;

    const handleStepComplete = (conceptId: ConceptId) => {
        completeStep(conceptId);
        if (currentStep >= repairPath.steps.length - 1) {
            onComplete?.();
        }
    };

    const handleDismiss = () => {
        dismiss();
        onDismiss?.();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`rounded-xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm p-5 ${className}`}
            data-testid="repair-path-wizard"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20">
                        <RefreshCw className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-slate-200">
                            Repair Path to &quot;{targetConcept.title}&quot;
                        </h3>
                        <p className="text-sm text-slate-400">
                            {repairPath.steps.length} step
                            {repairPath.steps.length !== 1 ? "s" : ""} •{" "}
                            {repairPath.totalEstimatedTime} min estimated
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleDismiss}
                    className="p-1 rounded hover:bg-slate-700/50 transition-colors"
                    data-testid="repair-path-dismiss"
                >
                    <X className="w-5 h-5 text-slate-400" />
                </button>
            </div>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-6">
                <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{
                            width: `${(currentStep / repairPath.steps.length) * 100}%`,
                        }}
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                    />
                </div>
                <span className="text-xs text-slate-400">
                    {currentStep}/{repairPath.steps.length}
                </span>
            </div>

            {/* Steps */}
            <div className="space-y-3">
                {repairPath.steps.map((step, idx) => {
                    const stepConcept = graph.nodes.get(step.conceptId);
                    const isComplete = idx < currentStep;
                    const isCurrent = idx === currentStep;
                    const isFuture = idx > currentStep;

                    return (
                        <motion.div
                            key={step.conceptId}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`p-3 rounded-lg border transition-all ${
                                isComplete
                                    ? "bg-emerald-500/10 border-emerald-500/30"
                                    : isCurrent
                                    ? "bg-indigo-500/10 border-indigo-500/50 ring-1 ring-indigo-500/30"
                                    : isFuture
                                    ? "bg-slate-800/50 border-slate-700/50 opacity-60"
                                    : "bg-slate-800/50 border-slate-700/50 opacity-60"
                            }`}
                            data-testid={`repair-step-${step.conceptId}`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                            isComplete
                                                ? "bg-emerald-500 text-white"
                                                : isCurrent
                                                ? "bg-indigo-500 text-white"
                                                : "bg-slate-700 text-slate-400"
                                        }`}
                                    >
                                        {isComplete ? "✓" : idx + 1}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-200">
                                            {stepConcept?.title ?? step.conceptId}
                                        </h4>
                                        <p className="text-xs text-slate-500">{step.reason}</p>
                                    </div>
                                </div>
                                <span
                                    className={`text-xs px-1.5 py-0.5 rounded ${
                                        step.priority === "required"
                                            ? "bg-red-500/20 text-red-400"
                                            : step.priority === "recommended"
                                            ? "bg-yellow-500/20 text-yellow-400"
                                            : "bg-slate-500/20 text-slate-400"
                                    }`}
                                >
                                    {step.priority}
                                </span>
                            </div>

                            {/* Activities */}
                            {isCurrent && (
                                <div className="mt-3 space-y-2">
                                    {step.activities.map((activity, actIdx) => (
                                        <div
                                            key={actIdx}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            {activity.type === "video" && (
                                                <Play className="w-3.5 h-3.5 text-blue-400" />
                                            )}
                                            {activity.type === "review" && (
                                                <Info className="w-3.5 h-3.5 text-slate-400" />
                                            )}
                                            {activity.type === "practice" && (
                                                <CircleDot className="w-3.5 h-3.5 text-emerald-400" />
                                            )}
                                            {activity.type === "quiz" && (
                                                <Target className="w-3.5 h-3.5 text-purple-400" />
                                            )}
                                            <span className="text-slate-300">
                                                {activity.description}
                                            </span>
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => handleStepComplete(step.conceptId)}
                                        className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors"
                                        data-testid="complete-step-btn"
                                    >
                                        <span className="text-sm font-medium">Complete Step</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Expected outcome */}
            <div className="mt-4 pt-4 border-t border-slate-700/50 flex items-center justify-between text-sm">
                <span className="text-slate-400">Expected improvement</span>
                <span className="text-emerald-400 font-medium">
                    +{repairPath.expectedImprovement}% comprehension
                </span>
            </div>
        </motion.div>
    );
}

// ============================================================================
// CASCADE VISUALIZATION
// ============================================================================

interface CascadeVisualizationProps {
    conceptId: ConceptId;
    className?: string;
}

export function CascadeVisualization({
    conceptId,
    className = "",
}: CascadeVisualizationProps) {
    const { graph, findRootCause, analyzeForwardImpact } = useConceptEntanglement();
    const concept = graph.nodes.get(conceptId);

    const rootCauses = useMemo(
        () => findRootCause(conceptId),
        [findRootCause, conceptId]
    );

    const forwardImpact = useMemo(
        () => analyzeForwardImpact(conceptId),
        [analyzeForwardImpact, conceptId]
    );

    if (!concept) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 ${className}`}
            data-testid="cascade-visualization"
        >
            <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-yellow-400" />
                <h3 className="font-semibold text-slate-200">Cascade Effect Analysis</h3>
            </div>

            {/* Root causes (backward) */}
            {rootCauses.rootCauses.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1 h-px bg-gradient-to-r from-red-500/50 to-transparent" />
                        <span className="text-xs text-slate-400">← Root Causes</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {rootCauses.rootCauses.map((cause) => {
                            const causeNode = graph.nodes.get(cause.conceptId);
                            return (
                                <motion.div
                                    key={cause.conceptId}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`px-3 py-1.5 rounded-lg border ${
                                        cause.severity === "critical"
                                            ? "bg-red-500/20 border-red-500/50 text-red-400"
                                            : cause.severity === "major"
                                            ? "bg-orange-500/20 border-orange-500/50 text-orange-400"
                                            : "bg-yellow-500/20 border-yellow-500/50 text-yellow-400"
                                    }`}
                                >
                                    <span className="text-sm">
                                        {causeNode?.title ?? cause.conceptId}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Current concept */}
            <div className="flex justify-center my-4">
                <div className="px-4 py-2 rounded-xl bg-indigo-500/20 border-2 border-indigo-500/50">
                    <span className="text-indigo-400 font-medium">{concept.title}</span>
                </div>
            </div>

            {/* Forward impact */}
            {forwardImpact.affectedConcepts.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-slate-400">Future Impact →</span>
                        <div className="flex-1 h-px bg-gradient-to-l from-yellow-500/50 to-transparent" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {forwardImpact.affectedConcepts.slice(0, 8).map((affected) => {
                            const affectedNode = graph.nodes.get(affected.conceptId);
                            return (
                                <motion.div
                                    key={affected.conceptId}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={`px-3 py-1.5 rounded-lg border ${
                                        affected.impactLevel === "high"
                                            ? "bg-red-500/10 border-red-500/30 text-red-400"
                                            : affected.impactLevel === "medium"
                                            ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                                            : "bg-slate-500/10 border-slate-500/30 text-slate-400"
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-sm">
                                            {affectedNode?.title ?? affected.conceptId}
                                        </span>
                                        <span className="text-xs opacity-60">
                                            -{affected.estimatedScoreReduction}%
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {forwardImpact.affectedConcepts.length > 8 && (
                            <div className="px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-400 text-sm">
                                +{forwardImpact.affectedConcepts.length - 8} more
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="mt-6 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-4 text-center">
                <div>
                    <div className="text-2xl font-bold text-red-400">
                        {rootCauses.rootCauses.length}
                    </div>
                    <div className="text-xs text-slate-500">Root causes found</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-yellow-400">
                        {forwardImpact.totalAtRisk}
                    </div>
                    <div className="text-xs text-slate-500">Future concepts at risk</div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default GraphHealthOverview;
