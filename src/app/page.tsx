"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Compass, Target, Briefcase, BookOpen, Layers, ArrowRight,
    Sparkles, GraduationCap, FileText, Award, Code2,
    Brain, Globe2, Zap, BookMarked, Share2, GitCompare,
    Rocket, TestTube2, Beaker, GitFork, Users, Trophy, Search
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ThemeToggle } from "@/app/features/theme";
import { modules as modulesConfig } from "@/app/shared/lib/modules";
import { PrismaticCard } from "@/app/shared/components";

// Progress tracking imports
import {
    useProgressOverview,
    ContinueLearningSection,
    ProgressExportModal,
    ProgressBar,
    ContinueLearningItem,
    exportProgressData,
    downloadProgressData,
    importProgressData,
} from "@/app/features/progress";

// Streaks imports
import { StreakWidget, useStreaks } from "@/app/features/streaks";

// Icon map for modules
const iconMap: Record<string, typeof Compass> = {
    landing: Layers,
    overview: Compass,
    "goal-path": Target,
    "career-mapping": Briefcase,
    chapter: BookOpen,
    "my-notes": FileText,
    certificates: Award,
};

// Module definitions for display (uses shared config for routing data)
const modules = modulesConfig.map(m => ({
    ...m,
    icon: iconMap[m.id] || Compass,
}));

// Developer testing features (not in main navigation)
interface DevFeature {
    id: string;
    title: string;
    description: string;
    icon: typeof Compass;
    color: string;
    gradient: string;
    component: string;
}

const devFeatures: DevFeature[] = [
    {
        id: "code-playground",
        title: "Code Playground",
        description: "Interactive code editor with live preview",
        icon: Code2,
        color: "cyan",
        gradient: "from-cyan-500 to-blue-600",
        component: "CodePlayground",
    },
    {
        id: "skill-assessment",
        title: "Skill Assessment",
        description: "Interactive skill evaluation with scoring",
        icon: Brain,
        color: "rose",
        gradient: "from-rose-500 to-pink-600",
        component: "SkillAssessmentHero",
    },
    {
        id: "social-proof",
        title: "Social Proof",
        description: "Animated learner journey visualization",
        icon: Globe2,
        color: "teal",
        gradient: "from-teal-500 to-emerald-600",
        component: "SocialProofVisualization",
    },
    {
        id: "knowledge-universe",
        title: "Knowledge Universe",
        description: "Cosmic curriculum view with zoom levels",
        icon: Rocket,
        color: "indigo",
        gradient: "from-indigo-500 to-violet-600",
        component: "KnowledgeUniverse",
    },
    {
        id: "adaptive-learning",
        title: "Adaptive Learning",
        description: "AI-powered learning path predictions",
        icon: Zap,
        color: "yellow",
        gradient: "from-yellow-500 to-amber-600",
        component: "AdaptiveLearningMap",
    },
    {
        id: "curriculum-generator",
        title: "Curriculum Generator",
        description: "LLM-powered lesson content generation",
        icon: BookMarked,
        color: "lime",
        gradient: "from-lime-500 to-green-600",
        component: "CurriculumOverview",
    },
    {
        id: "generative-content",
        title: "Generative Content",
        description: "AI-generated chapters from path seeds",
        icon: Sparkles,
        color: "fuchsia",
        gradient: "from-fuchsia-500 to-pink-600",
        component: "PathExplorer",
    },
    {
        id: "path-comparison",
        title: "Path Comparison",
        description: "Compare multiple learning paths side-by-side",
        icon: GitCompare,
        color: "orange",
        gradient: "from-orange-500 to-red-600",
        component: "PathComparisonModal",
    },
    {
        id: "shareable-links",
        title: "Shareable Links",
        description: "Social sharing with OG preview cards",
        icon: Share2,
        color: "sky",
        gradient: "from-sky-500 to-blue-600",
        component: "ShareModal",
    },
];

// Experiment features (Tasks 01-04 from requirements)
interface ExperimentFeature {
    id: string;
    title: string;
    description: string;
    icon: typeof Compass;
    gradient: string;
    status: "ready" | "beta" | "alpha";
    taskNumber: string;
}

const experimentFeatures: ExperimentFeature[] = [
    {
        id: "open-source-discovery",
        title: "Open Source Discovery",
        description: "Living Product Model - Explore real GitHub projects and learn by contributing to active codebases",
        icon: Search,
        gradient: "from-emerald-500 to-teal-600",
        status: "ready",
        taskNumber: "01",
    },
    {
        id: "client-simulation",
        title: "Client Simulation",
        description: "Generative Simulation Model - Practice client interactions with AI-powered scenario simulations",
        icon: Users,
        gradient: "from-violet-500 to-purple-600",
        status: "ready",
        taskNumber: "02",
    },
    {
        id: "competition",
        title: "Competition Arena",
        description: "Competitive Ecosystem Model - Timed coding challenges, leaderboards, and peer reviews",
        icon: Trophy,
        gradient: "from-orange-500 to-red-600",
        status: "ready",
        taskNumber: "03",
    },
    {
        id: "remix-projects",
        title: "Remix & Extend",
        description: "Remix Model - Inherit imperfect codebases and improve them with guided objectives",
        icon: GitFork,
        gradient: "from-blue-500 to-indigo-600",
        status: "ready",
        taskNumber: "04",
    },
];

// Module Card for Home View
const ModuleCard = ({ module, index, progress = 0 }: {
    module: typeof modules[0];
    index: number;
    progress?: number;
}) => {
    // Get the first variant ID from the shared module config
    const moduleConfig = modulesConfig.find(m => m.id === module.id);
    const firstVariantId = moduleConfig?.variants[0]?.id || "default";
    const href = `/module/${module.id}/variant/${firstVariantId}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Link href={href} className="w-full text-left block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" data-testid={`module-card-${module.id}`}>
                <PrismaticCard className="h-full cursor-pointer" glowColor={module.color as "indigo" | "purple" | "cyan" | "emerald" | "orange"}>
                    <div className="p-6 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br",
                                module.gradient
                            )}>
                                <module.icon size={ICON_SIZES.xl} />
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="px-3 py-1 bg-[var(--surface-inset)] rounded-full text-xs font-bold text-[var(--text-muted)]">
                                    {module.subtitle}
                                </span>
                                {progress > 0 && (
                                    <span className="text-xs font-bold text-[var(--accent-primary)]">
                                        {progress}% complete
                                    </span>
                                )}
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                            {module.title}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-4 flex-grow">
                            {module.description}
                        </p>

                        {progress > 0 && (
                            <div className="mb-4">
                                <ProgressBar
                                    progress={progress}
                                    size="sm"
                                    color={module.color as "indigo" | "emerald" | "purple" | "cyan" | "orange"}
                                />
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2 mb-4">
                            {module.features.slice(0, 3).map((feature, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-1 bg-[var(--surface-inset)] rounded-lg text-xs font-medium text-[var(--text-secondary)]"
                                >
                                    {feature}
                                </span>
                            ))}
                            {module.features.length > 3 && (
                                <span className="px-2 py-1 bg-[var(--surface-inset)] rounded-lg text-xs font-medium text-[var(--text-muted)]">
                                    +{module.features.length - 3}
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors">
                            {progress > 0 ? "Continue Learning" : `Explore ${module.variants.length} Variants`} <ArrowRight size={ICON_SIZES.sm} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </PrismaticCard>
            </Link>
        </motion.div>
    );
};

// Developer Feature Card for testing hidden features
const DevFeatureCard = ({ feature, index }: {
    feature: DevFeature;
    index: number;
}) => {
    const href = `/dev/${feature.id}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <Link href={href} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" data-testid={`dev-feature-${feature.id}`}>
                <div className="p-4 bg-[var(--surface-overlay)] backdrop-blur-md rounded-2xl border border-[var(--border-default)] hover:border-[var(--border-strong)] transition-all hover:shadow-lg group">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-white bg-gradient-to-br shrink-0",
                            feature.gradient
                        )}>
                            <feature.icon size={ICON_SIZES.md} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
                                {feature.title}
                            </h4>
                            <p className="text-xs text-[var(--text-muted)] truncate">
                                {feature.description}
                            </p>
                        </div>
                        <ArrowRight size={ICON_SIZES.sm} className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-1 transition-all shrink-0" />
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

// Experiment Feature Card for new learning models
const ExperimentCard = ({ feature, index }: {
    feature: ExperimentFeature;
    index: number;
}) => {
    const href = `/dev/${feature.id}`;

    const statusConfig = {
        ready: { label: "Ready", color: "bg-emerald-500/20 text-emerald-400" },
        beta: { label: "Beta", color: "bg-amber-500/20 text-amber-400" },
        alpha: { label: "Alpha", color: "bg-red-500/20 text-red-400" },
    }[feature.status];

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <Link href={href} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" data-testid={`experiment-${feature.id}`}>
                <PrismaticCard className="h-full cursor-pointer" glowColor="purple">
                    <div className="p-6 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center text-white bg-gradient-to-br",
                                feature.gradient
                            )}>
                                <feature.icon size={ICON_SIZES.xl} />
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="px-2 py-0.5 bg-[var(--surface-inset)] rounded-full text-[10px] font-bold text-[var(--text-muted)]">
                                    TASK {feature.taskNumber}
                                </span>
                                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", statusConfig.color)}>
                                    {statusConfig.label}
                                </span>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                            {feature.title}
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-4 flex-grow">
                            {feature.description}
                        </p>

                        <div className="flex items-center gap-2 text-sm font-bold text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors">
                            Try Experiment <ArrowRight size={ICON_SIZES.sm} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </PrismaticCard>
            </Link>
        </motion.div>
    );
};

// Home View Component
const HomeView = ({
    continueLearning,
    totalWatchTime,
    overallCompletion,
    courseProgress,
    onExport,
    onClearAll,
    streakProps,
}: {
    continueLearning: ContinueLearningItem[];
    totalWatchTime: number;
    overallCompletion: number;
    courseProgress: Record<string, number>;
    onExport: () => void;
    onClearAll: () => void;
    streakProps: {
        streakData: ReturnType<typeof useStreaks>["streakData"];
        dailyProgress: number;
        isGoalMet: boolean;
        onRecordTime: (minutes: number) => number | null;
        onGoalChange: (minutes: number) => void;
    };
}) => (
    <>
        {/* Theme Toggle in top right */}
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <ThemeToggle />
        </div>

        {/* Streak Widget - Fixed position */}
        <div className="fixed top-4 left-4 z-50 w-80">
            <StreakWidget
                streakData={streakProps.streakData}
                dailyProgress={streakProps.dailyProgress}
                isGoalMet={streakProps.isGoalMet}
                onRecordTime={streakProps.onRecordTime}
                onGoalChange={streakProps.onGoalChange}
            />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
            {/* Header */}
            <div className="text-center mb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--surface-overlay)] backdrop-blur-md rounded-full border border-[var(--border-default)] mb-8"
                >
                    <GraduationCap size={ICON_SIZES.md} className="text-[var(--accent-primary)]" />
                    <span className="text-sm font-bold text-[var(--text-secondary)]">Course Platform Prototype</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-5xl md:text-7xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-[var(--gradient-hero-from)] via-[var(--gradient-hero-via)] to-[var(--gradient-hero-to)] mb-6"
                >
                    Module Prototypes
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto mb-4"
                >
                    Explore 7 UI modules for a dynamically generated education platform.
                    Each module features multiple variants to compare different approaches.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-center gap-4 text-sm text-[var(--text-muted)]"
                >
                    <span className="flex items-center gap-1">
                        <Sparkles size={ICON_SIZES.sm} className="text-[var(--accent-primary)]" />
                        Spatial Theme
                    </span>
                    <span className="w-1 h-1 bg-[var(--border-strong)] rounded-full" />
                    <span>3D Effects</span>
                    <span className="w-1 h-1 bg-[var(--border-strong)] rounded-full" />
                    <span>Framer Motion</span>
                </motion.div>
            </div>

            {/* Continue Learning Section */}
            {continueLearning.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-12"
                >
                    <ContinueLearningSection
                        items={continueLearning}
                        totalWatchTime={totalWatchTime}
                        overallCompletion={overallCompletion}
                        onContinue={(item) => {
                            // Navigate using URL - this is handled by the component's Link
                            const moduleConfig = modulesConfig.find(m => m.id === item.courseId);
                            if (moduleConfig) {
                                window.location.href = `/module/${item.courseId}/variant/${moduleConfig.variants[0].id}`;
                            }
                        }}
                        onExport={onExport}
                        onClearAll={onClearAll}
                    />
                </motion.div>
            )}

            {/* Module Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                {modules.map((module, index) => (
                    <ModuleCard
                        key={module.id}
                        module={module}
                        index={index}
                        progress={courseProgress[module.id] || 0}
                    />
                ))}
            </div>

            {/* Feature Experiments Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-16"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
                        <Beaker size={ICON_SIZES.lg} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Feature Experiments</h2>
                        <p className="text-sm text-[var(--text-muted)]">New learning models from requirements (Tasks 01-04)</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {experimentFeatures.map((feature, index) => (
                        <ExperimentCard key={feature.id} feature={feature} index={index} />
                    ))}
                </div>
            </motion.div>

            {/* Developer Testing Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-16"
            >
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
                        <TestTube2 size={ICON_SIZES.md} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">Developer Testing</h2>
                        <p className="text-sm text-[var(--text-muted)]">Hidden features not in main navigation</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {devFeatures.map((feature, index) => (
                        <DevFeatureCard key={feature.id} feature={feature} index={index} />
                    ))}
                </div>
            </motion.div>

            {/* Footer */}
            <div className="text-center">
                <span className="text-[10px] bg-[var(--surface-elevated)] px-3 py-1 rounded-full text-[var(--text-muted)] backdrop-blur-sm">
                    Designed for the Future of Learning
                </span>
            </div>
        </div>
    </>
);

// Main App Component
export default function HomePage() {
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // Progress tracking
    const {
        courses,
        continueLearning,
        totalWatchTime,
        overallCompletion,
        refresh: refreshProgress,
        clearAll,
    } = useProgressOverview();

    // Streaks tracking
    const {
        streakData,
        dailyProgress,
        isGoalMet,
        recordLearningTime,
        updateDailyGoal,
    } = useStreaks();

    // Build course progress map
    const courseProgress: Record<string, number> = {};
    courses.forEach((course) => {
        courseProgress[course.courseId] = course.overallProgress;
    });

    // Transform continue learning items to match module IDs
    const transformedContinueLearning: ContinueLearningItem[] = continueLearning.map((item) => ({
        ...item,
        // Map the course to a module if possible
        courseId: modules.find((m) => m.id === item.courseId)?.id || item.courseId,
    }));

    const handleExport = () => {
        setIsExportModalOpen(true);
    };

    const handleClearAll = () => {
        if (window.confirm("Are you sure you want to clear all progress data? This cannot be undone.")) {
            clearAll();
        }
    };

    return (
        <div className="min-h-screen bg-[var(--surface-base)] font-sans overflow-x-hidden selection:bg-indigo-100 dark:selection:bg-indigo-900 transition-colors duration-300">
            {/* Background for home view */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[30%] -left-[20%] w-[80vw] h-[80vw] bg-[var(--gradient-mesh-1)] rounded-full blur-[120px]"
                />
                <motion.div
                    animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                    transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
                    className="absolute top-[40%] right-[-20%] w-[60vw] h-[60vw] bg-[var(--gradient-mesh-2)] rounded-full blur-[100px]"
                />
            </div>

            <HomeView
                continueLearning={transformedContinueLearning}
                totalWatchTime={totalWatchTime}
                overallCompletion={overallCompletion}
                courseProgress={courseProgress}
                onExport={handleExport}
                onClearAll={handleClearAll}
                streakProps={{
                    streakData,
                    dailyProgress,
                    isGoalMet,
                    onRecordTime: recordLearningTime,
                    onGoalChange: updateDailyGoal,
                }}
            />

            {/* Export Modal */}
            <ProgressExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                onExport={exportProgressData}
                onDownload={downloadProgressData}
                onImport={(jsonString) => {
                    const success = importProgressData(jsonString);
                    if (success) refreshProgress();
                    return success;
                }}
            />
        </div>
    );
}
