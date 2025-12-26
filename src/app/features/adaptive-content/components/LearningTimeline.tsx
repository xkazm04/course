"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    TrendingUp,
    TrendingDown,
    Minus,
    Award,
    AlertCircle,
    CheckCircle,
    Play,
    Code,
    BookOpen,
    Navigation,
    ChevronDown,
    ChevronUp,
    Filter,
    Sparkles,
    Calendar,
    Zap,
    Target,
    Lightbulb,
} from "lucide-react";
import type { LearningEvent, EventCategory, EventSignificance } from "../lib/learningEvents";
import type { TimelineInsight, LearningPattern, LearnerProfile } from "../lib/timelineAnalysis";
import {
    segmentTimeline,
    discoverPatterns,
    generateInsights,
    buildLearnerProfile,
} from "../lib/timelineAnalysis";
import { sortByTime } from "../lib/learningEvents";

// ============================================================================
// Configuration
// ============================================================================

const CATEGORY_CONFIG: Record<
    EventCategory,
    { icon: React.ReactNode; label: string; color: string; bgColor: string }
> = {
    assessment: {
        icon: <Target className="w-4 h-4" />,
        label: "Quiz",
        color: "text-blue-400",
        bgColor: "bg-blue-500/10",
    },
    practice: {
        icon: <Code className="w-4 h-4" />,
        label: "Practice",
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/10",
    },
    consumption: {
        icon: <BookOpen className="w-4 h-4" />,
        label: "Learning",
        color: "text-purple-400",
        bgColor: "bg-purple-500/10",
    },
    navigation: {
        icon: <Navigation className="w-4 h-4" />,
        label: "Navigation",
        color: "text-slate-400",
        bgColor: "bg-slate-500/10",
    },
    error: {
        icon: <AlertCircle className="w-4 h-4" />,
        label: "Error",
        color: "text-amber-400",
        bgColor: "bg-amber-500/10",
    },
    milestone: {
        icon: <Award className="w-4 h-4" />,
        label: "Milestone",
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/10",
    },
    session: {
        icon: <Play className="w-4 h-4" />,
        label: "Session",
        color: "text-cyan-400",
        bgColor: "bg-cyan-500/10",
    },
};

const SIGNIFICANCE_CONFIG: Record<
    EventSignificance,
    { icon: React.ReactNode; label: string; color: string }
> = {
    breakthrough: {
        icon: <Sparkles className="w-3 h-3" />,
        label: "Breakthrough",
        color: "text-green-400",
    },
    notable: {
        icon: <Zap className="w-3 h-3" />,
        label: "Notable",
        color: "text-blue-400",
    },
    routine: {
        icon: <Minus className="w-3 h-3" />,
        label: "Routine",
        color: "text-slate-400",
    },
    struggle: {
        icon: <AlertCircle className="w-3 h-3" />,
        label: "Challenge",
        color: "text-amber-400",
    },
};

// ============================================================================
// Timeline Event Item
// ============================================================================

interface TimelineEventItemProps {
    event: LearningEvent;
    isFirst?: boolean;
    isLast?: boolean;
}

function TimelineEventItem({ event, isFirst = false, isLast = false }: TimelineEventItemProps) {
    const categoryConfig = CATEGORY_CONFIG[event.meta.category];
    const significanceConfig = SIGNIFICANCE_CONFIG[event.meta.significance];
    const timestamp = new Date(event.meta.timestamp);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const getEventDescription = () => {
        const signal = event.signal;
        switch (signal.type) {
            case "quiz":
                return `Scored ${signal.correctAnswers}/${signal.totalQuestions}`;
            case "playground":
                return `${signal.successfulRuns} successful runs, ${signal.modificationsCount} edits`;
            case "video":
                return `Watched ${signal.watchedPercentage}% of video`;
            case "sectionTime":
                return `Spent ${Math.round(signal.timeSpentMs / 60000)} min on section`;
            case "navigation":
                return signal.isBackward ? "Went back to review" : "Moved forward";
            case "errorPattern":
                return `${signal.errorType} error (${signal.repeatedCount}x)`;
            case "milestone":
                return signal.milestoneType.replace(/_/g, " ");
            default:
                return signal.type;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative flex gap-3"
            data-testid="timeline-event-item"
        >
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
                <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${categoryConfig.bgColor} ${categoryConfig.color}`}
                >
                    {categoryConfig.icon}
                </div>
                {!isLast && <div className="w-0.5 flex-1 bg-slate-700/50 my-1" />}
            </div>

            {/* Event content */}
            <div className="flex-1 pb-4">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${categoryConfig.color}`}>
                                {categoryConfig.label}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${significanceConfig.color}`}
                            >
                                {significanceConfig.icon}
                                {significanceConfig.label}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{getEventDescription()}</p>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                        {formatTime(timestamp)}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Pattern Card
// ============================================================================

interface PatternCardProps {
    pattern: LearningPattern;
}

function PatternCard({ pattern }: PatternCardProps) {
    const isPositive = ["breakthrough", "speedup", "quiz_master", "explorer", "fast_learner"].includes(
        pattern.type
    );
    const isWarning = ["struggle", "plateau", "distracted", "error_prone"].includes(pattern.type);

    const bgColor = isPositive
        ? "bg-green-500/10 border-green-500/20"
        : isWarning
        ? "bg-amber-500/10 border-amber-500/20"
        : "bg-slate-500/10 border-slate-500/20";
    const textColor = isPositive
        ? "text-green-400"
        : isWarning
        ? "text-amber-400"
        : "text-slate-400";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-lg border p-3 ${bgColor}`}
            data-testid="pattern-card"
        >
            <div className="flex items-start gap-2">
                {isPositive ? (
                    <CheckCircle className={`w-4 h-4 mt-0.5 ${textColor}`} />
                ) : isWarning ? (
                    <AlertCircle className={`w-4 h-4 mt-0.5 ${textColor}`} />
                ) : (
                    <Lightbulb className={`w-4 h-4 mt-0.5 ${textColor}`} />
                )}
                <div className="flex-1">
                    <p className={`text-sm font-medium ${textColor}`}>
                        {pattern.type
                            .replace(/_/g, " ")
                            .replace(/\b\w/g, (c) => c.toUpperCase())}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{pattern.description}</p>
                    {pattern.recommendation && (
                        <p className="text-xs text-slate-300 mt-2 italic">
                            💡 {pattern.recommendation}
                        </p>
                    )}
                </div>
                <span className="text-xs text-slate-500">
                    {Math.round(pattern.confidence * 100)}%
                </span>
            </div>
        </motion.div>
    );
}

// ============================================================================
// Profile Card
// ============================================================================

interface ProfileCardProps {
    profile: LearnerProfile;
}

function ProfileCard({ profile }: ProfileCardProps) {
    const styleEmoji: Record<LearnerProfile["learningStyle"], string> = {
        visual: "👁️",
        practice: "🛠️",
        quiz: "📝",
        balanced: "⚖️",
    };

    const paceEmoji: Record<LearnerProfile["pacePreference"], string> = {
        fast: "🏃",
        moderate: "🚶",
        thorough: "🔬",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4"
            data-testid="learner-profile-card"
        >
            <h4 className="text-sm font-medium text-slate-200 mb-3">Your Learning Profile</h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                    <span className="text-slate-500">Style</span>
                    <p className="text-slate-200 mt-0.5">
                        {styleEmoji[profile.learningStyle]} {profile.learningStyle}
                    </p>
                </div>
                <div>
                    <span className="text-slate-500">Pace</span>
                    <p className="text-slate-200 mt-0.5">
                        {paceEmoji[profile.pacePreference]} {profile.pacePreference}
                    </p>
                </div>
                <div>
                    <span className="text-slate-500">Best Time</span>
                    <p className="text-slate-200 mt-0.5 capitalize">{profile.bestPerformanceTime}</p>
                </div>
                <div>
                    <span className="text-slate-500">Session Length</span>
                    <p className="text-slate-200 mt-0.5">{profile.optimalSessionLength} min</p>
                </div>
            </div>

            {profile.strengthAreas.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <span className="text-xs text-slate-500">Strengths</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {profile.strengthAreas.map((area) => (
                            <span
                                key={area}
                                className={`text-xs px-1.5 py-0.5 rounded ${CATEGORY_CONFIG[area].bgColor} ${CATEGORY_CONFIG[area].color}`}
                            >
                                {CATEGORY_CONFIG[area].label}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

// ============================================================================
// Main Timeline Component
// ============================================================================

interface LearningTimelineProps {
    events: LearningEvent[];
    className?: string;
    showPatterns?: boolean;
    showProfile?: boolean;
    showFilters?: boolean;
    maxEvents?: number;
}

export function LearningTimeline({
    events,
    className = "",
    showPatterns = true,
    showProfile = true,
    showFilters = true,
    maxEvents = 20,
}: LearningTimelineProps) {
    const [expandedSection, setExpandedSection] = useState<"events" | "patterns" | "profile" | null>(
        "events"
    );
    const [categoryFilter, setCategoryFilter] = useState<EventCategory | "all">("all");
    const [significanceFilter, setSignificanceFilter] = useState<EventSignificance | "all">("all");

    // Sort and filter events
    const filteredEvents = useMemo(() => {
        let result = sortByTime(events, false);

        if (categoryFilter !== "all") {
            result = result.filter((e) => e.meta.category === categoryFilter);
        }
        if (significanceFilter !== "all") {
            result = result.filter((e) => e.meta.significance === significanceFilter);
        }

        return result.slice(0, maxEvents);
    }, [events, categoryFilter, significanceFilter, maxEvents]);

    // Compute patterns and profile
    const patterns = useMemo(() => (showPatterns ? discoverPatterns(events) : []), [events, showPatterns]);
    const profile = useMemo(() => (showProfile ? buildLearnerProfile(events) : null), [events, showProfile]);
    const insights = useMemo(() => generateInsights(events), [events]);

    if (events.length === 0) {
        return (
            <div
                className={`rounded-lg border border-slate-700/50 bg-slate-800/50 p-6 text-center ${className}`}
                data-testid="learning-timeline-empty"
            >
                <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No learning events yet</p>
                <p className="text-xs text-slate-500 mt-1">
                    Your learning journey will appear here as you progress
                </p>
            </div>
        );
    }

    const toggleSection = (section: "events" | "patterns" | "profile") => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    return (
        <div
            className={`rounded-lg border border-slate-700/50 bg-slate-800/50 overflow-hidden ${className}`}
            data-testid="learning-timeline"
        >
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <h3 className="text-sm font-medium text-slate-200">Learning Journey</h3>
                    </div>
                    <span className="text-xs text-slate-500">{events.length} events</span>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-4 mt-3 text-xs">
                    {Object.entries(
                        events.reduce((acc, e) => {
                            acc[e.meta.significance] = (acc[e.meta.significance] || 0) + 1;
                            return acc;
                        }, {} as Record<EventSignificance, number>)
                    ).map(([sig, count]) => (
                        <div key={sig} className={`flex items-center gap-1 ${SIGNIFICANCE_CONFIG[sig as EventSignificance].color}`}>
                            {SIGNIFICANCE_CONFIG[sig as EventSignificance].icon}
                            <span>{count}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="px-4 py-2 border-b border-slate-700/50 flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value as EventCategory | "all")}
                        className="text-xs bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-slate-300"
                        data-testid="category-filter"
                    >
                        <option value="all">All Categories</option>
                        {Object.entries(CATEGORY_CONFIG).map(([cat, config]) => (
                            <option key={cat} value={cat}>
                                {config.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={significanceFilter}
                        onChange={(e) =>
                            setSignificanceFilter(e.target.value as EventSignificance | "all")
                        }
                        className="text-xs bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-slate-300"
                        data-testid="significance-filter"
                    >
                        <option value="all">All Types</option>
                        {Object.entries(SIGNIFICANCE_CONFIG).map(([sig, config]) => (
                            <option key={sig} value={sig}>
                                {config.label}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Events Section */}
            <div className="border-b border-slate-700/50">
                <button
                    onClick={() => toggleSection("events")}
                    className="w-full px-4 py-2 flex items-center justify-between text-sm text-slate-300 hover:bg-slate-700/30 transition-colors"
                    data-testid="toggle-events-btn"
                >
                    <span>Recent Activity</span>
                    {expandedSection === "events" ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )}
                </button>
                <AnimatePresence>
                    {expandedSection === "events" && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-4 max-h-80 overflow-y-auto">
                                {filteredEvents.map((event, index) => (
                                    <TimelineEventItem
                                        key={event.meta.id}
                                        event={event}
                                        isFirst={index === 0}
                                        isLast={index === filteredEvents.length - 1}
                                    />
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Patterns Section */}
            {showPatterns && patterns.length > 0 && (
                <div className="border-b border-slate-700/50">
                    <button
                        onClick={() => toggleSection("patterns")}
                        className="w-full px-4 py-2 flex items-center justify-between text-sm text-slate-300 hover:bg-slate-700/30 transition-colors"
                        data-testid="toggle-patterns-btn"
                    >
                        <span>Patterns & Insights ({patterns.length})</span>
                        {expandedSection === "patterns" ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>
                    <AnimatePresence>
                        {expandedSection === "patterns" && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-4 space-y-2">
                                    {patterns.map((pattern, index) => (
                                        <PatternCard key={`${pattern.type}-${index}`} pattern={pattern} />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Profile Section */}
            {showProfile && profile && (
                <div>
                    <button
                        onClick={() => toggleSection("profile")}
                        className="w-full px-4 py-2 flex items-center justify-between text-sm text-slate-300 hover:bg-slate-700/30 transition-colors"
                        data-testid="toggle-profile-btn"
                    >
                        <span>Your Profile</span>
                        {expandedSection === "profile" ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </button>
                    <AnimatePresence>
                        {expandedSection === "profile" && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-4">
                                    <ProfileCard profile={profile} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Compact Timeline View
// ============================================================================

interface CompactTimelineProps {
    events: LearningEvent[];
    className?: string;
    maxEvents?: number;
}

export function CompactTimeline({ events, className = "", maxEvents = 5 }: CompactTimelineProps) {
    const recentEvents = useMemo(() => sortByTime(events, false).slice(0, maxEvents), [events, maxEvents]);

    if (recentEvents.length === 0) {
        return null;
    }

    return (
        <div
            className={`flex items-center gap-1.5 ${className}`}
            data-testid="compact-timeline"
        >
            {recentEvents.map((event) => {
                const categoryConfig = CATEGORY_CONFIG[event.meta.category];
                const significanceConfig = SIGNIFICANCE_CONFIG[event.meta.significance];

                return (
                    <motion.div
                        key={event.meta.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${categoryConfig.bgColor}`}
                        title={`${categoryConfig.label} - ${significanceConfig.label}`}
                    >
                        <span className={categoryConfig.color}>{categoryConfig.icon}</span>
                    </motion.div>
                );
            })}
            {events.length > maxEvents && (
                <span className="text-xs text-slate-500">+{events.length - maxEvents}</span>
            )}
        </div>
    );
}

export default LearningTimeline;
