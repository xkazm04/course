// @ts-nocheck
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lightbulb,
    X,
    ChevronRight,
    ChevronDown,
    Sparkles,
    Clock,
    Users,
    TrendingUp,
    AlertTriangle,
    BookOpen,
    Code,
    PlayCircle,
    Layers,
    Link as LinkIcon,
    Beaker,
    RefreshCw,
    Eye,
    ThumbsUp,
    ThumbsDown,
} from "lucide-react";
import type {
    InterventionRecommendation,
    InterventionType,
    StruggePrediction,
    ScaffoldingSlot,
} from "../lib/predictiveLearning.types";
import { INTERVENTION_DISPLAY } from "../lib/proactiveScaffoldingEngine";

// ============================================================================
// Icon Mapping
// ============================================================================

const INTERVENTION_ICONS: Record<InterventionType, React.ReactNode> = {
    scaffolding_content: <Layers className="w-5 h-5" />,
    simplified_example: <Code className="w-5 h-5" />,
    prerequisite_review: <BookOpen className="w-5 h-5" />,
    visual_aid: <Eye className="w-5 h-5" />,
    interactive_hint: <Lightbulb className="w-5 h-5" />,
    pace_adjustment: <Clock className="w-5 h-5" />,
    alternative_explanation: <LinkIcon className="w-5 h-5" />,
    worked_example: <PlayCircle className="w-5 h-5" />,
    concept_bridge: <LinkIcon className="w-5 h-5" />,
    micro_practice: <Beaker className="w-5 h-5" />,
};

// ============================================================================
// Severity Config
// ============================================================================

const SEVERITY_CONFIG = {
    mild: {
        color: "text-[var(--forge-info)]",
        bg: "bg-[var(--forge-info)]/10",
        border: "border-[var(--forge-info)]/30",
        label: "Helpful Tip",
    },
    moderate: {
        color: "text-[var(--forge-warning)]",
        bg: "bg-[var(--forge-warning)]/10",
        border: "border-[var(--forge-warning)]/30",
        label: "Recommended",
    },
    severe: {
        color: "text-[var(--forge-error)]",
        bg: "bg-[var(--forge-error)]/10",
        border: "border-[var(--forge-error)]/30",
        label: "Strongly Suggested",
    },
};

// ============================================================================
// Main Panel Component
// ============================================================================

interface PredictiveInterventionPanelProps {
    intervention: InterventionRecommendation;
    prediction: StruggePrediction;
    onDismiss: () => void;
    onEngage: () => void;
    onFeedback: (helpful: boolean) => void;
    className?: string;
}

export function PredictiveInterventionPanel({
    intervention,
    prediction,
    onDismiss,
    onEngage,
    onFeedback,
    className = "",
}: PredictiveInterventionPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [hasEngaged, setHasEngaged] = useState(false);

    const displayConfig = INTERVENTION_DISPLAY[intervention.type];
    const severityConfig = SEVERITY_CONFIG[prediction.severity];
    const icon = INTERVENTION_ICONS[intervention.type];

    const handleEngage = useCallback(() => {
        setIsExpanded(true);
        setHasEngaged(true);
        onEngage();
    }, [onEngage]);

    const handleDismiss = useCallback(() => {
        if (hasEngaged) {
            setShowFeedback(true);
        } else {
            onDismiss();
        }
    }, [hasEngaged, onDismiss]);

    const handleFeedback = useCallback(
        (helpful: boolean) => {
            onFeedback(helpful);
            onDismiss();
        },
        [onFeedback, onDismiss]
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`relative rounded-xl border ${displayConfig.borderStyle} bg-gradient-to-br ${displayConfig.accentColor} backdrop-blur-sm overflow-hidden ${className}`}
            data-testid="predictive-intervention-panel"
        >
            {/* Proactive Indicator */}
            <div className="absolute top-0 right-0 px-2 py-1 text-xs font-medium bg-gradient-to-r from-[var(--ember)]/20 to-[var(--gold)]/20 text-[var(--ember-glow)] rounded-bl-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Proactive Help</span>
            </div>

            {/* Header */}
            <div className="p-4 pb-2">
                <div className="flex items-start gap-3">
                    <div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg ${severityConfig.bg} ${severityConfig.border} border flex items-center justify-center ${severityConfig.color}`}
                    >
                        {icon}
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-center gap-2 mb-1">
                            <span
                                className={`text-xs font-medium px-1.5 py-0.5 rounded ${severityConfig.bg} ${severityConfig.color}`}
                            >
                                {severityConfig.label}
                            </span>
                            <span className="text-xs text-[var(--forge-text-muted)]">
                                {Math.round(prediction.probability * 100)}% confidence
                            </span>
                        </div>
                        <h3 className="text-sm font-semibold text-[var(--forge-text-primary)] line-clamp-1">
                            {intervention.content.title}
                        </h3>
                        <p className="text-xs text-[var(--forge-text-muted)] mt-0.5 line-clamp-2">
                            {intervention.content.description}
                        </p>
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 p-1 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] transition-colors"
                        data-testid="intervention-dismiss-btn"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="px-4 py-2 flex items-center gap-4 text-xs text-[var(--forge-text-muted)] border-t border-[var(--forge-border-subtle)]">
                <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>
                        {Math.round(intervention.collectiveSuccessRate * 100)}% success rate
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>
                        +{Math.round(intervention.expectedImpact * 100)}% expected improvement
                    </span>
                </div>
                {prediction.stepsAhead > 1 && (
                    <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{prediction.stepsAhead} steps ahead</span>
                    </div>
                )}
            </div>

            {/* Expandable Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 py-3 border-t border-[var(--forge-border-subtle)] space-y-3">
                            {/* Code Example */}
                            {intervention.content.code && (
                                <div className="rounded-lg bg-[var(--forge-bg-void)] p-3 overflow-x-auto">
                                    <pre className="text-xs text-[var(--forge-text-secondary)] font-mono">
                                        <code>{intervention.content.code}</code>
                                    </pre>
                                </div>
                            )}

                            {/* Key Points */}
                            {intervention.content.points && intervention.content.points.length > 0 && (
                                <ul className="space-y-1.5">
                                    {intervention.content.points.map((point, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-2 text-xs text-[var(--forge-text-muted)]"
                                        >
                                            <ChevronRight className="w-3 h-3 mt-0.5 text-[var(--forge-text-muted)] flex-shrink-0" />
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* Contributing Factors */}
                            {prediction.contributingFactors.length > 0 && (
                                <div className="pt-2 border-t border-[var(--forge-border-subtle)]">
                                    <div className="flex items-center gap-1 text-xs text-[var(--forge-text-muted)] mb-1.5">
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>Based on:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {prediction.contributingFactors.map((factor, i) => (
                                            <span
                                                key={i}
                                                className="text-xs px-2 py-0.5 rounded-full bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]"
                                            >
                                                {factor}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Duration */}
                            {intervention.content.duration && (
                                <div className="flex items-center gap-1 text-xs text-[var(--forge-text-muted)]">
                                    <Clock className="w-3 h-3" />
                                    <span>~{Math.ceil(intervention.content.duration / 60)} min</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Feedback Section */}
            <AnimatePresence>
                {showFeedback && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-4 py-3 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-anvil)]"
                    >
                        <p className="text-xs text-[var(--forge-text-muted)] mb-2">Was this helpful?</p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleFeedback(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--forge-success)] bg-[var(--forge-success)]/10 hover:bg-[var(--forge-success)]/20 rounded-lg transition-colors"
                                data-testid="intervention-feedback-helpful-btn"
                            >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                <span>Yes, helpful</span>
                            </button>
                            <button
                                onClick={() => handleFeedback(false)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--forge-text-muted)] bg-[var(--forge-bg-elevated)] hover:bg-[var(--forge-border-default)] rounded-lg transition-colors"
                                data-testid="intervention-feedback-not-helpful-btn"
                            >
                                <ThumbsDown className="w-3.5 h-3.5" />
                                <span>Not really</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Action Button */}
            {!isExpanded && !showFeedback && (
                <div className="px-4 py-3 border-t border-[var(--forge-border-subtle)]">
                    <button
                        onClick={handleEngage}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium ${severityConfig.color} ${severityConfig.bg} hover:opacity-80 rounded-lg transition-all`}
                        data-testid="intervention-engage-btn"
                    >
                        <span>Show me</span>
                        <ChevronDown className="w-4 h-4" />
                    </button>
                </div>
            )}
        </motion.div>
    );
}

// ============================================================================
// Floating Intervention Container
// ============================================================================

interface FloatingInterventionContainerProps {
    interventions: {
        intervention: InterventionRecommendation;
        prediction: StruggePrediction;
    }[];
    onDismiss: (interventionId: string) => void;
    onEngage: (interventionId: string) => void;
    onFeedback: (interventionId: string, helpful: boolean) => void;
    position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
    className?: string;
}

export function FloatingInterventionContainer({
    interventions,
    onDismiss,
    onEngage,
    onFeedback,
    position = "bottom-right",
    className = "",
}: FloatingInterventionContainerProps) {
    const positionClasses = {
        "bottom-right": "fixed bottom-4 right-4",
        "bottom-left": "fixed bottom-4 left-4",
        "top-right": "fixed top-20 right-4",
        "top-left": "fixed top-20 left-4",
    };

    return (
        <div
            className={`${positionClasses[position]} z-50 w-96 max-w-[calc(100vw-2rem)] space-y-3 ${className}`}
            data-testid="floating-intervention-container"
        >
            <AnimatePresence mode="popLayout">
                {interventions.map(({ intervention, prediction }) => (
                    <PredictiveInterventionPanel
                        key={intervention.id}
                        intervention={intervention}
                        prediction={prediction}
                        onDismiss={() => onDismiss(intervention.id)}
                        onEngage={() => onEngage(intervention.id)}
                        onFeedback={(helpful) => onFeedback(intervention.id, helpful)}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
}

// ============================================================================
// Inline Intervention Card (for in-content placement)
// ============================================================================

interface InlineInterventionCardProps {
    intervention: InterventionRecommendation;
    prediction: StruggePrediction;
    onDismiss?: () => void;
    onEngage?: () => void;
    className?: string;
}

export function InlineInterventionCard({
    intervention,
    prediction,
    onDismiss,
    onEngage,
    className = "",
}: InlineInterventionCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const displayConfig = INTERVENTION_DISPLAY[intervention.type];
    const icon = INTERVENTION_ICONS[intervention.type];

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`rounded-lg border ${displayConfig.borderStyle} bg-gradient-to-r ${displayConfig.accentColor} overflow-hidden ${className}`}
            data-testid="inline-intervention-card"
        >
            <button
                onClick={() => {
                    setIsExpanded(!isExpanded);
                    if (!isExpanded && onEngage) onEngage();
                }}
                className="w-full p-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
                data-testid="inline-intervention-toggle-btn"
            >
                <div className="flex-shrink-0 text-[var(--forge-text-secondary)]">{icon}</div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-[var(--ember)] flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Proactive Help
                        </span>
                    </div>
                    <h4 className="text-sm font-medium text-[var(--forge-text-primary)] truncate">
                        {intervention.content.title}
                    </h4>
                </div>
                <ChevronRight
                    className={`w-4 h-4 text-[var(--forge-text-muted)] transition-transform ${
                        isExpanded ? "rotate-90" : ""
                    }`}
                />
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-3 pb-3 space-y-2 border-t border-[var(--forge-border-subtle)] pt-2">
                            <p className="text-xs text-[var(--forge-text-muted)]">
                                {intervention.content.description}
                            </p>

                            {intervention.content.code && (
                                <div className="rounded-lg bg-[var(--forge-bg-void)] p-2 overflow-x-auto">
                                    <pre className="text-xs text-[var(--forge-text-secondary)] font-mono">
                                        <code>{intervention.content.code}</code>
                                    </pre>
                                </div>
                            )}

                            {intervention.content.points && (
                                <ul className="space-y-1">
                                    {intervention.content.points.map((point, i) => (
                                        <li
                                            key={i}
                                            className="flex items-start gap-1.5 text-xs text-[var(--forge-text-muted)]"
                                        >
                                            <span className="text-[var(--forge-text-muted)]">•</span>
                                            <span>{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="flex items-center justify-between pt-2">
                                <span className="text-xs text-[var(--forge-text-muted)] flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {Math.round(intervention.collectiveSuccessRate * 100)}% found helpful
                                </span>
                                {onDismiss && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDismiss();
                                        }}
                                        className="text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] transition-colors"
                                        data-testid="inline-intervention-dismiss-btn"
                                    >
                                        Dismiss
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============================================================================
// Prediction Preview Badge
// ============================================================================

interface PredictionPreviewBadgeProps {
    prediction: StruggePrediction;
    onClick?: () => void;
    className?: string;
}

export function PredictionPreviewBadge({
    prediction,
    onClick,
    className = "",
}: PredictionPreviewBadgeProps) {
    const severityConfig = SEVERITY_CONFIG[prediction.severity];

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            onClick={onClick}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${severityConfig.bg} ${severityConfig.border} border transition-all hover:opacity-80 ${className}`}
            data-testid="prediction-preview-badge"
        >
            <Lightbulb className={`w-3.5 h-3.5 ${severityConfig.color}`} />
            <span className={`text-xs font-medium ${severityConfig.color}`}>
                {prediction.stepsAhead > 1
                    ? `Help available ${prediction.stepsAhead} steps ahead`
                    : "Help available"}
            </span>
            <motion.div
                className="w-1.5 h-1.5 rounded-full bg-current"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
            />
        </motion.button>
    );
}

// ============================================================================
// Prediction Stats Display
// ============================================================================

interface PredictionStatsProps {
    predictionAccuracy: number;
    interventionSuccessRate: number;
    totalPredictions: number;
    className?: string;
}

export function PredictionStats({
    predictionAccuracy,
    interventionSuccessRate,
    totalPredictions,
    className = "",
}: PredictionStatsProps) {
    return (
        <div
            className={`grid grid-cols-3 gap-3 p-3 rounded-lg bg-[var(--forge-bg-anvil)] border border-[var(--forge-border-subtle)] ${className}`}
            data-testid="prediction-stats"
        >
            <div className="text-center">
                <div className="text-lg font-semibold text-[var(--forge-success)]">
                    {Math.round(predictionAccuracy * 100)}%
                </div>
                <div className="text-xs text-[var(--forge-text-muted)]">Prediction Accuracy</div>
            </div>
            <div className="text-center border-x border-[var(--forge-border-subtle)]">
                <div className="text-lg font-semibold text-[var(--forge-info)]">
                    {Math.round(interventionSuccessRate * 100)}%
                </div>
                <div className="text-xs text-[var(--forge-text-muted)]">Help Success Rate</div>
            </div>
            <div className="text-center">
                <div className="text-lg font-semibold text-[var(--ember)]">{totalPredictions}</div>
                <div className="text-xs text-[var(--forge-text-muted)]">Predictions Made</div>
            </div>
        </div>
    );
}

export default PredictiveInterventionPanel;
