"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Clock, Rocket, ArrowRight } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { ForgeProject, Challenge } from "../../lib/types";
import { mockProjectFeatures } from "../../lib/mockData";
import { forgeEasing, staggerDelay } from "../../lib/animations";

interface ProjectTabsProps {
    project: ForgeProject;
    challenges: Challenge[];
}

type TabId = "about" | "challenges" | "features";

const tabs: { id: TabId; label: string }[] = [
    { id: "about", label: "About" },
    { id: "challenges", label: "Challenges" },
    { id: "features", label: "Features" },
];

export function ProjectTabs({ project, challenges }: ProjectTabsProps) {
    const [activeTab, setActiveTab] = useState<TabId>("about");
    const features = mockProjectFeatures[project.id] || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ease: forgeEasing }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] overflow-hidden"
        >
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1.5 bg-[var(--forge-bg-elevated)]/50 border-b border-[var(--forge-border-subtle)]">
                {tabs.map((tab) => {
                    const count = tab.id === "challenges" ? challenges.length : tab.id === "features" ? features.length : null;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "relative px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                                activeTab === tab.id
                                    ? "text-[var(--forge-text-primary)]"
                                    : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                            )}
                        >
                            {activeTab === tab.id && (
                                <motion.div
                                    layoutId="tab-indicator"
                                    className="absolute inset-0 bg-[var(--forge-bg-daylight)] rounded-lg border border-[var(--forge-border-subtle)]"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">{tab.label}</span>
                            {count !== null && (
                                <span className={cn(
                                    "relative z-10 px-1.5 py-0.5 rounded text-xs",
                                    activeTab === tab.id
                                        ? "bg-[var(--ember)]/10 text-[var(--ember)]"
                                        : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]"
                                )}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="p-4 h-[180px] overflow-y-auto">
                <AnimatePresence mode="wait">
                    {activeTab === "about" && (
                        <TabContent key="about">
                            <p className="text-sm text-[var(--forge-text-secondary)] leading-relaxed">
                                {project.description}
                            </p>
                            <div className="mt-3 pt-3 border-t border-[var(--forge-border-subtle)]">
                                <p className="text-xs text-[var(--forge-text-muted)]">
                                    <span className="font-medium text-[var(--forge-text-secondary)]">Category:</span>{" "}
                                    {project.category.replace("_", " ")}
                                </p>
                            </div>
                        </TabContent>
                    )}

                    {activeTab === "challenges" && (
                        <TabContent key="challenges">
                            {challenges.length > 0 ? (
                                <div className="space-y-2">
                                    {challenges.slice(0, 5).map((challenge, i) => (
                                        <ChallengeItem key={challenge.id} challenge={challenge} index={i} />
                                    ))}
                                    {challenges.length > 5 && (
                                        <Link
                                            href={`/forge/challenges?project=${project.id}`}
                                            className="flex items-center justify-center gap-2 py-2 text-sm font-medium text-[var(--ember)] hover:text-[var(--ember-glow)] transition-colors"
                                        >
                                            View all {challenges.length} challenges
                                            <ArrowRight size={14} />
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <EmptyState message="No challenges available yet" />
                            )}
                        </TabContent>
                    )}

                    {activeTab === "features" && (
                        <TabContent key="features">
                            {features.length > 0 ? (
                                <div className="space-y-2">
                                    {features.map((feature, i) => (
                                        <FeatureItem key={i} feature={feature} index={i} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="Feature roadmap coming soon" />
                            )}
                        </TabContent>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// Tab content wrapper with animation
function TabContent({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: forgeEasing }}
        >
            {children}
        </motion.div>
    );
}

// Challenge item row
function ChallengeItem({ challenge, index }: { challenge: Challenge; index: number }) {
    const difficultyColors = {
        beginner: "text-[var(--forge-success)]",
        intermediate: "text-[var(--gold)]",
        advanced: "text-[var(--forge-error)]",
    };

    const typeEmoji: Record<string, string> = {
        bug: "🐛",
        feature: "✨",
        refactor: "🔧",
        test: "🧪",
        docs: "📝",
        performance: "⚡",
        security: "🔒",
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: staggerDelay(index, 0.05) }}
        >
            <Link
                href={`/forge/challenges/${challenge.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--forge-bg-elevated)]/50 transition-colors group"
            >
                <span className="text-lg">{typeEmoji[challenge.type] || "📋"}</span>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--forge-text-primary)] truncate group-hover:text-[var(--ember)] transition-colors">
                        {challenge.title}
                    </div>
                </div>
                <span className={cn("text-xs font-medium capitalize", difficultyColors[challenge.difficulty])}>
                    {challenge.difficulty}
                </span>
                <span className="text-xs text-[var(--ember)] font-semibold">+{challenge.xpReward}</span>
            </Link>
        </motion.div>
    );
}

// Feature item row
function FeatureItem({ feature, index }: { feature: { title: string; description: string; status: string; challengeCount: number }; index: number }) {
    const statusConfig = {
        completed: { icon: CheckCircle, color: "text-[var(--forge-success)]", bg: "bg-[var(--forge-success)]/10" },
        in_progress: { icon: Clock, color: "text-[var(--gold)]", bg: "bg-[var(--gold)]/10" },
        planned: { icon: Rocket, color: "text-[var(--forge-text-muted)]", bg: "bg-[var(--forge-bg-elevated)]" },
    };

    const config = statusConfig[feature.status as keyof typeof statusConfig] || statusConfig.planned;
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: staggerDelay(index, 0.05) }}
            className="flex items-center gap-3 p-2 rounded-lg"
        >
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", config.bg)}>
                <Icon size={12} className={config.color} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--forge-text-primary)] truncate">
                    {feature.title}
                </div>
            </div>
            <span className="text-xs text-[var(--forge-text-muted)]">
                {feature.challengeCount} tasks
            </span>
        </motion.div>
    );
}

// Empty state
function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex items-center justify-center h-full">
            <p className="text-sm text-[var(--forge-text-muted)]">{message}</p>
        </div>
    );
}
