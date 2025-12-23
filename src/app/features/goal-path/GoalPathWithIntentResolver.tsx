"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Target,
    Clock,
    Sparkles,
    ArrowRight,
    Zap,
    BarChart3,
    BookOpen,
    Rocket,
    CheckCircle2,
    Loader2,
    ChevronDown,
    Info,
} from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { FOCUS_AREAS } from "@/app/shared/lib/learningDomains";
import {
    useGoalPathResolver,
    planToLegacyResult,
    type GoalPathResolverState,
} from "./lib/useGoalPathResolver";
import type { ResolvedPlan, LearningStyle, SkillLevel } from "@/app/shared/lib/intent-resolver";

// ============================================================================
// CONSTANTS
// ============================================================================

const LEARNING_STYLES: Array<{ value: LearningStyle; label: string; icon: string }> = [
    { value: "video-based", label: "Video Based", icon: "📹" },
    { value: "text-based", label: "Text Based", icon: "📖" },
    { value: "project-based", label: "Project Based", icon: "🔨" },
    { value: "interactive", label: "Interactive", icon: "🎮" },
    { value: "mixed", label: "Mixed", icon: "🎯" },
];

const SKILL_LEVELS: Array<{ value: SkillLevel; label: string; description: string }> = [
    { value: "beginner", label: "Beginner", description: "Just starting out" },
    { value: "intermediate", label: "Intermediate", description: "Some experience" },
    { value: "advanced", label: "Advanced", description: "Significant experience" },
    { value: "expert", label: "Expert", description: "Professional level" },
];

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Goal Path Generator using the Intent Resolver system.
 * Demonstrates the integration of the IntentResolver abstraction
 * with the existing goal-path UI patterns.
 */
export const GoalPathWithIntentResolver = () => {
    // Form state
    const [goal, setGoal] = useState("Become a Full Stack Developer");
    const [timeCommitment, setTimeCommitment] = useState(15);
    const [deadline, setDeadline] = useState(6);
    const [focus, setFocus] = useState(["frontend", "backend"]);
    const [learningStyle, setLearningStyle] = useState<LearningStyle>("mixed");
    const [currentLevel, setCurrentLevel] = useState<SkillLevel>("beginner");
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Intent resolver hook
    const { generatePath, isGenerating, plan, getQuickMetrics, error, reset } =
        useGoalPathResolver({
            onPathGenerated: (plan) => {
                console.log("Path generated:", plan);
            },
            onError: (err) => {
                console.error("Path generation failed:", err);
            },
        });

    // Build form state object
    const formState: GoalPathResolverState = {
        goal,
        timeCommitment,
        deadline,
        focus,
        learningStyle,
        currentLevel,
    };

    // Quick metrics for live preview
    const metrics = getQuickMetrics(formState);

    const toggleFocus = (id: string) => {
        setFocus((prev) =>
            prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
        );
    };

    const handleGeneratePath = async () => {
        await generatePath(formState);
    };

    const handleReset = () => {
        reset();
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 font-bold tracking-wide text-xs uppercase mb-4"
                >
                    <Zap size={ICON_SIZES.sm} />
                    Intent-Based Path Generator
                </motion.div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">
                    Create Your Learning Path
                </h2>
                <p className="text-slate-600">
                    Powered by the Intent Resolver system for personalized curriculum
                    generation
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Form */}
                <div className="space-y-6">
                    <PrismaticCard>
                        <div className="p-6 space-y-6">
                            {/* Goal Input */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <Target size={ICON_SIZES.sm} className="inline mr-2" />
                                    Your End Goal
                                </label>
                                <input
                                    type="text"
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    data-testid="goal-input"
                                    className="w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-lg"
                                    placeholder="e.g., Become a Senior Backend Developer"
                                />
                            </div>

                            {/* Time Commitment Slider */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <Clock size={ICON_SIZES.sm} className="inline mr-2" />
                                    Hours per Week:{" "}
                                    <span className="text-indigo-600">{timeCommitment}h</span>
                                </label>
                                <input
                                    type="range"
                                    min="5"
                                    max="40"
                                    value={timeCommitment}
                                    onChange={(e) => setTimeCommitment(Number(e.target.value))}
                                    data-testid="time-commitment-slider"
                                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>5h (Casual)</span>
                                    <span>40h (Intensive)</span>
                                </div>
                            </div>

                            {/* Deadline Slider */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    <Rocket size={ICON_SIZES.sm} className="inline mr-2" />
                                    Target Timeline:{" "}
                                    <span className="text-indigo-600">{deadline} months</span>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="24"
                                    value={deadline}
                                    onChange={(e) => setDeadline(Number(e.target.value))}
                                    data-testid="deadline-slider"
                                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
                                />
                                <div className="flex justify-between text-xs text-slate-500 mt-1">
                                    <span>1 month</span>
                                    <span>24 months</span>
                                </div>
                            </div>

                            {/* Focus Areas */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">
                                    <Sparkles size={ICON_SIZES.sm} className="inline mr-2" />
                                    Focus Areas
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {FOCUS_AREAS.map((area) => (
                                        <button
                                            key={area.id}
                                            onClick={() => toggleFocus(area.id)}
                                            data-testid={`focus-area-${area.id}`}
                                            className={cn(
                                                "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1",
                                                focus.includes(area.id)
                                                    ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                                                    : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                                            )}
                                        >
                                            <area.icon size={ICON_SIZES.md} />
                                            <span className="text-xs font-medium">{area.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Advanced Options Toggle */}
                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                data-testid="advanced-options-toggle"
                                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                            >
                                <ChevronDown
                                    size={ICON_SIZES.sm}
                                    className={cn(
                                        "transition-transform",
                                        showAdvanced && "rotate-180"
                                    )}
                                />
                                Advanced Options
                            </button>

                            {/* Advanced Options */}
                            <AnimatePresence>
                                {showAdvanced && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-4 overflow-hidden"
                                    >
                                        {/* Learning Style */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                <BookOpen size={ICON_SIZES.sm} className="inline mr-2" />
                                                Learning Style
                                            </label>
                                            <div className="grid grid-cols-5 gap-2">
                                                {LEARNING_STYLES.map((style) => (
                                                    <button
                                                        key={style.value}
                                                        onClick={() => setLearningStyle(style.value)}
                                                        data-testid={`learning-style-${style.value}`}
                                                        className={cn(
                                                            "p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-1",
                                                            learningStyle === style.value
                                                                ? "bg-purple-50 border-purple-500 text-purple-700"
                                                                : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                                                        )}
                                                    >
                                                        <span className="text-lg">{style.icon}</span>
                                                        <span className="text-[10px] font-medium">
                                                            {style.label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Skill Level */}
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                                <BarChart3 size={ICON_SIZES.sm} className="inline mr-2" />
                                                Current Skill Level
                                            </label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {SKILL_LEVELS.map((level) => (
                                                    <button
                                                        key={level.value}
                                                        onClick={() => setCurrentLevel(level.value)}
                                                        data-testid={`skill-level-${level.value}`}
                                                        className={cn(
                                                            "p-2 rounded-lg border-2 transition-all text-center",
                                                            currentLevel === level.value
                                                                ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                                                                : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                                                        )}
                                                    >
                                                        <span className="text-xs font-bold">
                                                            {level.label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </PrismaticCard>
                </div>

                {/* Preview / Results */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                        <Zap size={ICON_SIZES.sm} className="text-amber-500" />
                        {plan ? "GENERATED PATH" : "LIVE PREVIEW"}
                    </div>

                    <PrismaticCard glowColor="purple">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center text-white">
                                    <Target size={ICON_SIZES.lg} />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 text-lg">
                                        {(plan?.title ?? goal) || "Your Learning Path"}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {plan ? "AI-Generated Curriculum" : "Preview updates as you type"}
                                    </p>
                                </div>
                            </div>

                            {/* Metrics */}
                            <div className="grid grid-cols-4 gap-3 mb-6">
                                <div className="text-center p-3 bg-slate-50 rounded-xl">
                                    <div className="text-xl font-black text-slate-900">
                                        {plan?.metrics.totalHours ?? metrics.totalHours}
                                    </div>
                                    <div className="text-xs text-slate-500">Hours</div>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-xl">
                                    <div className="text-xl font-black text-slate-900">
                                        {plan?.metrics.moduleCount ?? metrics.modules}
                                    </div>
                                    <div className="text-xs text-slate-500">Modules</div>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-xl">
                                    <div className="text-xl font-black text-slate-900">
                                        {plan?.metrics.topicCount ?? metrics.topics}
                                    </div>
                                    <div className="text-xs text-slate-500">Topics</div>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-xl">
                                    <div className="text-xl font-black text-slate-900">
                                        {plan?.metrics.estimatedWeeks ?? metrics.estimatedWeeks}
                                    </div>
                                    <div className="text-xs text-slate-500">Weeks</div>
                                </div>
                            </div>

                            {/* Plan Details (when generated) */}
                            {plan && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4 mb-6"
                                >
                                    {/* Modules */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-slate-700">
                                            Curriculum Modules
                                        </h4>
                                        {plan.modules.slice(0, 4).map((module, i) => (
                                            <div
                                                key={module.id}
                                                className="p-3 bg-white rounded-xl border border-slate-100 flex items-center gap-3"
                                            >
                                                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold">
                                                    {i + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-medium text-slate-700 block truncate">
                                                        {module.name}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {module.topics.length} topics •{" "}
                                                        {module.estimatedHours}h
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {plan.modules.length > 4 && (
                                            <div className="text-sm text-slate-500 text-center">
                                                + {plan.modules.length - 4} more modules
                                            </div>
                                        )}
                                    </div>

                                    {/* Milestones */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-slate-700">
                                            Key Milestones
                                        </h4>
                                        {plan.milestones.map((milestone) => (
                                            <div
                                                key={milestone.id}
                                                className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl flex items-center gap-3"
                                            >
                                                <CheckCircle2
                                                    size={ICON_SIZES.md}
                                                    className="text-emerald-500"
                                                />
                                                <div className="flex-1">
                                                    <span className="font-medium text-slate-700">
                                                        {milestone.title}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-slate-500">
                                                    Week {milestone.targetWeek}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Recommendations */}
                                    {plan.recommendations.length > 0 && (
                                        <div className="p-4 bg-amber-50 rounded-xl">
                                            <div className="flex items-center gap-2 text-sm font-bold text-amber-700 mb-2">
                                                <Info size={ICON_SIZES.sm} />
                                                Recommendations
                                            </div>
                                            <ul className="space-y-1">
                                                {plan.recommendations.slice(0, 2).map((rec, i) => (
                                                    <li
                                                        key={i}
                                                        className="text-sm text-amber-800"
                                                    >
                                                        <span className="font-medium">{rec.title}:</span>{" "}
                                                        {rec.message}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Confidence Score */}
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                        <span className="text-sm text-slate-600">Plan Confidence</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                                    style={{
                                                        width: `${plan.metrics.confidenceScore}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">
                                                {plan.metrics.confidenceScore}%
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Error State */}
                            {error && (
                                <div className="p-4 bg-red-50 rounded-xl text-red-700 mb-6">
                                    <span className="font-bold">Error:</span> {error}
                                </div>
                            )}

                            {/* Focus Areas Preview (when no plan) */}
                            {!plan && focus.length > 0 && (
                                <div className="space-y-3 mb-6">
                                    <h4 className="text-sm font-bold text-slate-700">
                                        Selected Focus Areas
                                    </h4>
                                    {focus.map((f, i) => (
                                        <motion.div
                                            key={f}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="p-3 bg-white rounded-xl border border-slate-100 flex items-center gap-3"
                                        >
                                            <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm font-bold">
                                                {i + 1}
                                            </div>
                                            <span className="font-medium text-slate-700 capitalize">
                                                {f} Development
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                {plan ? (
                                    <>
                                        <button
                                            onClick={handleReset}
                                            data-testid="reset-path-btn"
                                            className="flex-1 py-4 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                                        >
                                            Start Over
                                        </button>
                                        <button
                                            data-testid="start-learning-btn"
                                            className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                                        >
                                            Start Learning <ArrowRight size={ICON_SIZES.md} />
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleGeneratePath}
                                        disabled={isGenerating || focus.length === 0}
                                        data-testid="generate-path-btn"
                                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2
                                                    size={ICON_SIZES.md}
                                                    className="animate-spin"
                                                />
                                                Generating Path...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={ICON_SIZES.md} />
                                                Generate Full Path
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </PrismaticCard>
                </div>
            </div>
        </div>
    );
};

export default GoalPathWithIntentResolver;
