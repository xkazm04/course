"use client";

import React, { useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Lightbulb,
    Code2,
    Trophy,
    BookOpen,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Brain,
    Zap
} from "lucide-react";
import { useAdaptiveSlots, useSectionAdaptation } from "../lib/useAdaptiveSlots";
import { useAdaptiveContentOptional } from "../lib/AdaptiveContentContext";
import type { ContentSlot } from "../../chapter/lib/contentSlots";
import type { AdaptationConfig, ComprehensionLevel } from "../lib/types";
import { cn } from "@/app/shared/lib/utils";

// ============================================================================
// Slot Type Styles
// ============================================================================

const SLOT_STYLES = {
    explanation: {
        bgColor: "bg-blue-500/10",
        borderColor: "border-blue-500/30",
        iconColor: "text-blue-400",
        icon: Lightbulb,
        label: "Simplified Explanation",
    },
    example: {
        bgColor: "bg-emerald-500/10",
        borderColor: "border-emerald-500/30",
        iconColor: "text-emerald-400",
        icon: Code2,
        label: "Simpler Example",
    },
    challenge: {
        bgColor: "bg-amber-500/10",
        borderColor: "border-amber-500/30",
        iconColor: "text-amber-400",
        icon: Trophy,
        label: "Advanced Challenge",
    },
    hint: {
        bgColor: "bg-purple-500/10",
        borderColor: "border-purple-500/30",
        iconColor: "text-purple-400",
        icon: Sparkles,
        label: "Helpful Hint",
    },
    deepDive: {
        bgColor: "bg-cyan-500/10",
        borderColor: "border-cyan-500/30",
        iconColor: "text-cyan-400",
        icon: BookOpen,
        label: "Deep Dive",
    },
};

// ============================================================================
// Adaptive Content Card Component
// ============================================================================

interface AdaptiveContentCardProps {
    slotType: keyof typeof SLOT_STYLES;
    title: string;
    content: string;
    code?: string;
    codeLanguage?: string;
    points?: string[];
    isExpanded?: boolean;
    onToggle?: () => void;
    className?: string;
}

export function AdaptiveContentCard({
    slotType,
    title,
    content,
    code,
    points,
    isExpanded = true,
    onToggle,
    className,
}: AdaptiveContentCardProps) {
    const style = SLOT_STYLES[slotType];
    const Icon = style.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
                "rounded-xl border p-4",
                style.bgColor,
                style.borderColor,
                className
            )}
            data-testid={`adaptive-content-${slotType}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-lg", style.bgColor)}>
                        <Icon className={cn("w-4 h-4", style.iconColor)} />
                    </div>
                    <div>
                        <span className={cn("text-xs font-medium", style.iconColor)}>
                            {style.label}
                        </span>
                        {title && (
                            <h4 className="text-sm font-semibold text-slate-200">
                                {title}
                            </h4>
                        )}
                    </div>
                </div>
                {onToggle && (
                    <button
                        onClick={onToggle}
                        className="p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
                        data-testid={`adaptive-content-toggle-${slotType}`}
                    >
                        {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                    </button>
                )}
            </div>

            {/* Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                    >
                        {content && (
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {content}
                            </p>
                        )}

                        {points && points.length > 0 && (
                            <ul className="space-y-1.5">
                                {points.map((point, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                                        <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full", style.iconColor.replace("text-", "bg-"))} />
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {code && (
                            <pre className="p-3 rounded-lg bg-slate-900/50 text-xs text-slate-300 overflow-x-auto font-mono">
                                <code>{code}</code>
                            </pre>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ============================================================================
// Adaptive Section Wrapper
// ============================================================================

interface AdaptiveSectionWrapperProps {
    sectionId: string;
    topic: string;
    children: React.ReactNode;
    showIndicator?: boolean;
    className?: string;
}

export function AdaptiveSectionWrapper({
    sectionId,
    topic,
    children,
    showIndicator = true,
    className,
}: AdaptiveSectionWrapperProps) {
    const { level, config, confidence, recordProgress } = useSectionAdaptation({
        sectionId,
    });
    const { enhanceTemplate, paceRecommendation, isAdaptive, comprehensionLevel } = useAdaptiveSlots({
        sectionId,
        topic,
    });

    const adaptiveContext = useAdaptiveContentOptional();

    // Record scroll progress on scroll
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const scrollPercentage = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
        recordProgress(Math.min(100, scrollPercentage));
    }, [recordProgress]);

    return (
        <div
            className={cn("relative", className)}
            onScroll={handleScroll}
            data-testid={`adaptive-section-${sectionId}`}
        >
            {/* Adaptive Indicator */}
            {showIndicator && isAdaptive && (
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="absolute -left-2 top-4 z-10"
                >
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/80 border border-slate-700/50 backdrop-blur-sm">
                        <Brain className="w-3 h-3 text-purple-400" />
                        <span className="text-xs text-slate-400">
                            Adapting
                        </span>
                    </div>
                </motion.div>
            )}

            {/* Pace Recommendation Banner */}
            {isAdaptive && config.paceRecommendation !== "normal" && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                        "mb-4 p-3 rounded-lg border flex items-center gap-3",
                        config.paceRecommendation === "slower"
                            ? "bg-blue-500/10 border-blue-500/30"
                            : "bg-amber-500/10 border-amber-500/30"
                    )}
                    data-testid="pace-recommendation-banner"
                >
                    <span className="text-xl">{paceRecommendation.icon}</span>
                    <span className="text-sm text-slate-300">
                        {paceRecommendation.message}
                    </span>
                </motion.div>
            )}

            {children}
        </div>
    );
}

// ============================================================================
// Adaptive Slot Injector
// ============================================================================

interface AdaptiveSlotInjectorProps {
    sectionId: string;
    topic: string;
    position?: "before" | "after" | "both";
    children: React.ReactNode;
    className?: string;
}

export function AdaptiveSlotInjector({
    sectionId,
    topic,
    position = "after",
    children,
    className,
}: AdaptiveSlotInjectorProps) {
    const [expandedSlots, setExpandedSlots] = React.useState<Set<number>>(new Set());
    const { getAdaptiveSlots, comprehensionLevel, isAdaptive } = useAdaptiveSlots({
        sectionId,
        topic,
    });

    const adaptiveSlots = useMemo(() => getAdaptiveSlots("main"), [getAdaptiveSlots]);

    const toggleSlot = useCallback((index: number) => {
        setExpandedSlots((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    }, []);

    if (!isAdaptive || adaptiveSlots.length === 0) {
        return <div className={className}>{children}</div>;
    }

    // Extract slot type from ID (e.g., "section-1-adaptive-explanation-0")
    const getSlotType = (slot: ContentSlot): keyof typeof SLOT_STYLES => {
        const idParts = slot.id.split("-adaptive-");
        if (idParts.length > 1) {
            const typeMatch = idParts[1].match(/^(explanation|example|challenge|hint|deepDive)/);
            if (typeMatch) {
                return typeMatch[1] as keyof typeof SLOT_STYLES;
            }
        }
        return "explanation";
    };

    const renderAdaptiveSlots = () => (
        <div className="space-y-4">
            <AnimatePresence mode="popLayout">
                {adaptiveSlots.map((slot, idx) => {
                    const slotType = getSlotType(slot);
                    const title = slot.type === "text" && "data" in slot && slot.data
                        ? (slot.data as { title?: string }).title || ""
                        : "";
                    const content = slot.type === "text" && "data" in slot && slot.data
                        ? (slot.data as { content?: string }).content || ""
                        : "";
                    const points = slot.type === "keyPoints" && "data" in slot && slot.data
                        ? (slot.data as { points?: string[] }).points
                        : undefined;
                    const code = slot.type === "code" && "data" in slot && slot.data
                        ? (slot.data as { code?: string }).code
                        : undefined;

                    return (
                        <AdaptiveContentCard
                            key={slot.id}
                            slotType={slotType}
                            title={title}
                            content={content}
                            points={points}
                            code={code}
                            isExpanded={!expandedSlots.has(idx)}
                            onToggle={() => toggleSlot(idx)}
                        />
                    );
                })}
            </AnimatePresence>
        </div>
    );

    return (
        <div className={className}>
            {(position === "before" || position === "both") && renderAdaptiveSlots()}
            {children}
            {(position === "after" || position === "both") && renderAdaptiveSlots()}
        </div>
    );
}

// ============================================================================
// Level Progress Indicator
// ============================================================================

interface LevelProgressProps {
    className?: string;
}

export function LevelProgress({ className }: LevelProgressProps) {
    const context = useAdaptiveContentOptional();

    if (!context) return null;

    const { comprehensionLevel, confidence, recentPerformance, trend } = context;

    const levelColors: Record<ComprehensionLevel, string> = {
        beginner: "from-blue-500 to-blue-600",
        intermediate: "from-emerald-500 to-emerald-600",
        advanced: "from-purple-500 to-purple-600",
    };

    const trendIcons = {
        improving: { icon: "📈", color: "text-green-400" },
        stable: { icon: "➡️", color: "text-slate-400" },
        struggling: { icon: "📉", color: "text-amber-400" },
    };

    return (
        <div
            className={cn(
                "p-4 rounded-xl bg-slate-800/50 border border-slate-700/50",
                className
            )}
            data-testid="level-progress"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-slate-300">
                        Learning Progress
                    </span>
                </div>
                <div className={cn("flex items-center gap-1", trendIcons[trend].color)}>
                    <span>{trendIcons[trend].icon}</span>
                    <span className="text-xs capitalize">{trend}</span>
                </div>
            </div>

            {/* Level Progress Bar */}
            <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
                <motion.div
                    className={cn(
                        "absolute h-full rounded-full bg-gradient-to-r",
                        levelColors[comprehensionLevel]
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${recentPerformance}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                />
            </div>

            {/* Level Labels */}
            <div className="flex justify-between text-xs text-slate-500">
                <span className={comprehensionLevel === "beginner" ? "text-blue-400 font-medium" : ""}>
                    Beginner
                </span>
                <span className={comprehensionLevel === "intermediate" ? "text-emerald-400 font-medium" : ""}>
                    Intermediate
                </span>
                <span className={comprehensionLevel === "advanced" ? "text-purple-400 font-medium" : ""}>
                    Advanced
                </span>
            </div>

            {/* Confidence Indicator */}
            <div className="mt-4 pt-3 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Assessment Confidence</span>
                    <span className="text-slate-300">{Math.round(confidence * 100)}%</span>
                </div>
                <div className="mt-1.5 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-slate-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${confidence * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Exports
// ============================================================================

// Main exports - AdaptiveSlotInjector is the primary component
export default AdaptiveSlotInjector;

// Re-export for convenience
export { SLOT_STYLES };
