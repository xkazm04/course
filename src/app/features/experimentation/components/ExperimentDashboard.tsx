"use client";

/**
 * Experiment Dashboard
 *
 * Admin UI for viewing and managing experiments.
 * Shows real-time metrics, statistical analysis, and controls.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play,
    Pause,
    CheckCircle,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Users,
    Target,
    BarChart3,
    Settings,
    RefreshCw,
    ChevronDown,
    ChevronRight,
    Award,
    Percent,
} from "lucide-react";
import clsx from "clsx";
import type {
    Experiment,
    ExperimentStatus,
    ExperimentAnalysis,
    VariantComparison,
    SignificanceLevel,
} from "../lib/types";
import { experimentManager } from "../lib/experimentManager";

// ============================================================================
// Types
// ============================================================================

interface DashboardProps {
    className?: string;
}

interface ExperimentWithAnalysis extends Experiment {
    analysis?: ExperimentAnalysis;
}

// ============================================================================
// Status Badge Component
// ============================================================================

const STATUS_STYLES: Record<ExperimentStatus, { bg: string; text: string; icon: typeof Play }> = {
    draft: { bg: "bg-gray-500/20", text: "text-gray-400", icon: Settings },
    running: { bg: "bg-green-500/20", text: "text-green-400", icon: Play },
    paused: { bg: "bg-yellow-500/20", text: "text-yellow-400", icon: Pause },
    concluded: { bg: "bg-blue-500/20", text: "text-blue-400", icon: CheckCircle },
    rolled_out: { bg: "bg-purple-500/20", text: "text-purple-400", icon: Award },
};

function StatusBadge({ status }: { status: ExperimentStatus }) {
    const style = STATUS_STYLES[status];
    const Icon = style.icon;

    return (
        <span
            className={clsx(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                style.bg,
                style.text
            )}
        >
            <Icon className="w-3 h-3" />
            {status.replace("_", " ")}
        </span>
    );
}

// ============================================================================
// Significance Badge Component
// ============================================================================

const SIGNIFICANCE_STYLES: Record<SignificanceLevel, { bg: string; text: string }> = {
    not_significant: { bg: "bg-gray-500/20", text: "text-gray-400" },
    marginally: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
    significant: { bg: "bg-green-500/20", text: "text-green-400" },
    highly_significant: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
};

function SignificanceBadge({ level, pValue }: { level: SignificanceLevel; pValue: number }) {
    const style = SIGNIFICANCE_STYLES[level];

    return (
        <span
            className={clsx(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                style.bg,
                style.text
            )}
        >
            p = {pValue.toFixed(4)}
        </span>
    );
}

// ============================================================================
// Metric Card Component
// ============================================================================

interface MetricCardProps {
    label: string;
    value: string | number;
    change?: number;
    icon?: typeof Users;
}

function MetricCard({ label, value, change, icon: Icon }: MetricCardProps) {
    return (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
                {Icon && <Icon className="w-4 h-4 text-slate-500" />}
            </div>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{value}</span>
                {change !== undefined && (
                    <span
                        className={clsx(
                            "flex items-center text-xs font-medium",
                            change > 0 ? "text-green-400" : change < 0 ? "text-red-400" : "text-slate-400"
                        )}
                    >
                        {change > 0 ? (
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                        ) : change < 0 ? (
                            <TrendingDown className="w-3 h-3 mr-0.5" />
                        ) : null}
                        {Math.abs(change).toFixed(1)}%
                    </span>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Variant Comparison Row
// ============================================================================

interface VariantRowProps {
    comparison: VariantComparison;
    isWinner: boolean;
}

function VariantRow({ comparison, isWinner }: VariantRowProps) {
    const { treatment, testResult, relativeLift, probabilityBetter } = comparison;

    return (
        <div
            className={clsx(
                "flex items-center gap-4 p-4 rounded-lg border",
                isWinner
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-slate-800/50 border-slate-700/50"
            )}
        >
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{comparison.treatmentId}</span>
                    {isWinner && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">
                            <Award className="w-3 h-3" />
                            Winner
                        </span>
                    )}
                </div>
                <div className="text-sm text-slate-400 mt-1">
                    n = {treatment.sampleSize.toLocaleString()} | Mean: {treatment.mean.toFixed(2)}
                </div>
            </div>

            <div className="text-right">
                <div
                    className={clsx(
                        "text-lg font-bold",
                        relativeLift > 0 ? "text-green-400" : relativeLift < 0 ? "text-red-400" : "text-slate-400"
                    )}
                >
                    {relativeLift > 0 ? "+" : ""}
                    {relativeLift.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500">relative lift</div>
            </div>

            <div className="text-right">
                <div className="text-lg font-bold text-white">
                    {(probabilityBetter * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-slate-500">prob. better</div>
            </div>

            <SignificanceBadge level={testResult.significance} pValue={testResult.pValue} />
        </div>
    );
}

// ============================================================================
// Experiment Card Component
// ============================================================================

interface ExperimentCardProps {
    experiment: ExperimentWithAnalysis;
    onStart: () => void;
    onPause: () => void;
    onConclude: (variantId: string) => void;
    onRefresh: () => void;
}

function ExperimentCard({
    experiment,
    onStart,
    onPause,
    onConclude,
    onRefresh,
}: ExperimentCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const { analysis } = experiment;

    const controlVariant = experiment.variants.find((v) => v.isControl);
    // Treatment variants are displayed via analysis.comparisons

    return (
        <motion.div
            layout
            className="bg-slate-900/80 rounded-xl border border-slate-700/50 overflow-hidden"
        >
            {/* Header */}
            <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-800/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <button className="text-slate-400 hover:text-white transition-colors">
                    {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                    ) : (
                        <ChevronRight className="w-5 h-5" />
                    )}
                </button>

                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-white">{experiment.name}</h3>
                        <StatusBadge status={experiment.status} />
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                            {experiment.type}
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                            {experiment.targetArea}
                        </span>
                    </div>
                    {experiment.description && (
                        <p className="text-sm text-slate-400 mt-1">{experiment.description}</p>
                    )}
                </div>

                <div className="flex items-center gap-3 text-sm text-slate-400">
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {analysis?.totalParticipants.toLocaleString() || 0}
                    </div>
                    <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        {experiment.variants.length} variants
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onRefresh();
                        }}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Refresh analysis"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>

                    {experiment.status === "draft" && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onStart();
                            }}
                            className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
                        >
                            Start
                        </button>
                    )}

                    {experiment.status === "running" && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onPause();
                            }}
                            className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors text-sm font-medium"
                        >
                            Pause
                        </button>
                    )}

                    {experiment.status === "paused" && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onStart();
                            }}
                            className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
                        >
                            Resume
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-slate-700/50"
                    >
                        <div className="p-4 space-y-4">
                            {/* Metrics Overview */}
                            <div className="grid grid-cols-4 gap-4">
                                <MetricCard
                                    label="Total Participants"
                                    value={analysis?.totalParticipants.toLocaleString() || "0"}
                                    icon={Users}
                                />
                                <MetricCard
                                    label="Statistical Power"
                                    value={`${((analysis?.power || 0) * 100).toFixed(0)}%`}
                                    icon={BarChart3}
                                />
                                <MetricCard
                                    label="Min Detectable Effect"
                                    value={`${(analysis?.mde || 0).toFixed(1)}%`}
                                    icon={Target}
                                />
                                <MetricCard
                                    label="Traffic Allocation"
                                    value={`${experiment.trafficAllocation}%`}
                                    icon={Percent}
                                />
                            </div>

                            {/* Variants Comparison */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-slate-300">Variant Performance</h4>

                                {/* Control */}
                                <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-white">
                                                {controlVariant?.name || "Control"}
                                            </span>
                                            <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">
                                                Control
                                            </span>
                                        </div>
                                        {analysis?.variantMetrics[controlVariant?.id || ""] && (
                                            <div className="text-sm text-slate-400 mt-1">
                                                n ={" "}
                                                {analysis.variantMetrics[controlVariant?.id || ""]?.[0]?.sampleSize?.toLocaleString() || 0}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right text-slate-400 text-sm">Baseline</div>
                                </div>

                                {/* Treatments */}
                                {analysis?.comparisons.map((comparison) => (
                                    <VariantRow
                                        key={comparison.treatmentId}
                                        comparison={comparison}
                                        isWinner={analysis.winner?.variantId === comparison.treatmentId}
                                    />
                                ))}
                            </div>

                            {/* Warnings */}
                            {analysis?.warnings && analysis.warnings.length > 0 && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                                    <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium mb-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Warnings
                                    </div>
                                    <ul className="text-sm text-yellow-400/80 space-y-1">
                                        {analysis.warnings.map((warning, i) => (
                                            <li key={i}>• {warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Winner & Actions */}
                            {analysis?.winner && experiment.status === "running" && (
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-emerald-400 font-medium">
                                            <Award className="w-5 h-5" />
                                            Winner Detected: {analysis.winner.variantId}
                                        </div>
                                        <p className="text-sm text-emerald-400/80 mt-1">
                                            {(analysis.winner.confidence * 100).toFixed(1)}% confidence on{" "}
                                            {analysis.winner.metric}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onConclude(analysis.winner!.variantId)}
                                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
                                    >
                                        Conclude Experiment
                                    </button>
                                </div>
                            )}

                            {/* Experiment Details */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-500">Primary Metric:</span>{" "}
                                    <span className="text-white">{experiment.primaryMetric}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Significance Threshold:</span>{" "}
                                    <span className="text-white">{experiment.significanceThreshold}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Min Sample Size:</span>{" "}
                                    <span className="text-white">{experiment.minSampleSize} per variant</span>
                                </div>
                                {experiment.startedAt && (
                                    <div>
                                        <span className="text-slate-500">Started:</span>{" "}
                                        <span className="text-white">
                                            {new Date(experiment.startedAt).toLocaleDateString()}
                                        </span>
                                    </div>
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
// Main Dashboard Component
// ============================================================================

export function ExperimentDashboard({ className }: DashboardProps) {
    const [experiments, setExperiments] = useState<ExperimentWithAnalysis[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<ExperimentStatus | "all">("all");
    const [error, setError] = useState<string | null>(null);

    // Fetch experiments
    const fetchExperiments = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const filters = statusFilter === "all" ? {} : { status: statusFilter };
            const { experiments: data } = await experimentManager.list(filters);

            // Fetch analysis for each experiment
            const withAnalysis = await Promise.all(
                data.map(async (exp) => {
                    try {
                        const response = await fetch(`/api/experiments/${exp.id}/analysis`);
                        if (response.ok) {
                            const analysis = await response.json();
                            return { ...exp, analysis };
                        }
                    } catch {
                        // Ignore analysis fetch errors
                    }
                    return exp;
                })
            );

            setExperiments(withAnalysis);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch experiments");
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchExperiments();
    }, [fetchExperiments]);

    // Handlers
    const handleStart = useCallback(
        async (id: string) => {
            try {
                await experimentManager.start(id);
                fetchExperiments();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to start experiment");
            }
        },
        [fetchExperiments]
    );

    const handlePause = useCallback(
        async (id: string) => {
            try {
                await experimentManager.pause(id);
                fetchExperiments();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to pause experiment");
            }
        },
        [fetchExperiments]
    );

    const handleConclude = useCallback(
        async (id: string, variantId: string) => {
            try {
                await experimentManager.conclude(id, variantId);
                fetchExperiments();
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to conclude experiment");
            }
        },
        [fetchExperiments]
    );

    // Stats
    const stats = useMemo(() => {
        const running = experiments.filter((e) => e.status === "running").length;
        const totalParticipants = experiments.reduce(
            (sum, e) => sum + (e.analysis?.totalParticipants || 0),
            0
        );
        const withSignificance = experiments.filter(
            (e) =>
                e.analysis?.comparisons.some(
                    (c) =>
                        c.testResult.significance === "significant" ||
                        c.testResult.significance === "highly_significant"
                )
        ).length;

        return { running, totalParticipants, withSignificance };
    }, [experiments]);

    return (
        <div className={clsx("space-y-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Experiments</h1>
                    <p className="text-slate-400 mt-1">
                        Manage A/B tests and analyze results
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchExperiments}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className={clsx("w-5 h-5", isLoading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <MetricCard label="Total Experiments" value={experiments.length} icon={BarChart3} />
                <MetricCard label="Running" value={stats.running} icon={Play} />
                <MetricCard
                    label="Total Participants"
                    value={stats.totalParticipants.toLocaleString()}
                    icon={Users}
                />
                <MetricCard
                    label="With Significance"
                    value={stats.withSignificance}
                    icon={CheckCircle}
                />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                {(["all", "running", "paused", "draft", "concluded", "rolled_out"] as const).map(
                    (status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={clsx(
                                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                statusFilter === status
                                    ? "bg-slate-700 text-white"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )}
                        >
                            {status === "all" ? "All" : status.replace("_", " ")}
                        </button>
                    )
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        {error}
                    </div>
                </div>
            )}

            {/* Experiments List */}
            <div className="space-y-4">
                {isLoading && experiments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3" />
                        Loading experiments...
                    </div>
                ) : experiments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <BarChart3 className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        No experiments found
                    </div>
                ) : (
                    experiments.map((experiment) => (
                        <ExperimentCard
                            key={experiment.id}
                            experiment={experiment}
                            onStart={() => handleStart(experiment.id)}
                            onPause={() => handlePause(experiment.id)}
                            onConclude={(variantId) => handleConclude(experiment.id, variantId)}
                            onRefresh={fetchExperiments}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
