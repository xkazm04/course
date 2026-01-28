"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Clock,
    Zap,
    Target,
    Github,
    FileCode,
    Lightbulb,
    ChevronRight,
    Check,
    AlertCircle,
    Users,
    Play,
    Eye,
    Flame,
    Sparkles,
    Trophy,
    BookOpen,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useForge } from "../../layout";
import { mockChallenges, mockProjects } from "../../lib/mockData";
import type { ChallengeHint, ChallengeDifficulty } from "../../lib/types";
import { LeaderboardPanel } from "../components/LeaderboardPanel";
import { ForgeGlowButton } from "../../components/ForgeGlowButton";
import { forgeEasing, staggerDelay, fadeUpVariants, textGradientEmber } from "../../lib/animations";

// ============================================================================
// DIFFICULTY CONFIG
// ============================================================================

const difficultyConfig: Record<ChallengeDifficulty, {
    color: string;
    bgColor: string;
    borderColor: string;
    gradient: string;
    icon: string;
}> = {
    beginner: {
        color: "text-[var(--forge-success)]",
        bgColor: "bg-[var(--forge-success)]/10",
        borderColor: "border-[var(--forge-success)]/20",
        gradient: "from-[var(--forge-success)] to-emerald-400",
        icon: "🌱",
    },
    intermediate: {
        color: "text-[var(--gold)]",
        bgColor: "bg-[var(--gold)]/10",
        borderColor: "border-[var(--gold)]/20",
        gradient: "from-[var(--gold)] to-amber-400",
        icon: "🔥",
    },
    advanced: {
        color: "text-[var(--forge-error)]",
        bgColor: "bg-[var(--forge-error)]/10",
        borderColor: "border-[var(--forge-error)]/20",
        gradient: "from-[var(--forge-error)] to-red-400",
        icon: "💎",
    },
};

const typeEmojis: Record<string, string> = {
    bug: "🐛",
    feature: "✨",
    refactor: "🔧",
    test: "🧪",
    docs: "📚",
    performance: "⚡",
    security: "🔒",
};

// ============================================================================
// CHALLENGE HERO
// ============================================================================

interface ChallengeHeroProps {
    title: string;
    description: string;
    difficulty: ChallengeDifficulty;
    type: string;
    xpReward: number;
    estimatedMinutes: number;
    timesCompleted: number;
    successRate: number;
}

function ChallengeHero({
    title,
    description,
    difficulty,
    type,
    xpReward,
    estimatedMinutes,
    timesCompleted,
    successRate,
}: ChallengeHeroProps) {
    const config = difficultyConfig[difficulty];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: forgeEasing }}
            className="relative overflow-hidden rounded-2xl mb-8"
        >
            {/* Gradient background */}
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-20", config.gradient)} />
            <div className="absolute inset-0 bg-[var(--forge-bg-daylight)]/90 backdrop-blur-xl" />

            {/* Decorative elements */}
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-[var(--ember)]/10 to-transparent blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-gradient-to-tr from-[var(--gold)]/10 to-transparent blur-3xl" />

            <div className="relative p-8">
                {/* Header row */}
                <div className="flex items-start gap-6 mb-6">
                    <motion.div
                        className={cn(
                            "text-5xl p-4 rounded-2xl",
                            config.bgColor,
                            "border",
                            config.borderColor
                        )}
                        whileHover={{ rotate: [0, -5, 5, 0], scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                    >
                        {typeEmojis[type]}
                    </motion.div>

                    <div className="flex-1">
                        {/* Badges */}
                        <div className="flex items-center gap-3 mb-3">
                            <motion.span
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium capitalize border",
                                    config.bgColor,
                                    config.color,
                                    config.borderColor
                                )}
                            >
                                <span>{config.icon}</span>
                                {difficulty}
                            </motion.span>
                            <motion.span
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.15 }}
                                className="text-sm text-[var(--forge-text-muted)] capitalize"
                            >
                                {type} Challenge
                            </motion.span>
                        </div>

                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl font-bold text-[var(--forge-text-primary)] mb-3"
                        >
                            {title}
                        </motion.h1>

                        {/* Description */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.25 }}
                            className="text-[var(--forge-text-secondary)] text-lg max-w-2xl"
                        >
                            {description}
                        </motion.p>
                    </div>
                </div>

                {/* Stats row */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap items-center gap-6 pt-6 border-t border-[var(--forge-border-subtle)]"
                >
                    <StatItem icon={Zap} label="XP Reward" value={`+${xpReward}`} highlight />
                    <StatItem icon={Clock} label="Est. Time" value={`${estimatedMinutes}min`} />
                    <StatItem icon={Users} label="Completed" value={timesCompleted.toString()} />
                    <StatItem
                        icon={Trophy}
                        label="Success Rate"
                        value={`${Math.round(successRate * 100)}%`}
                        color={successRate >= 0.8 ? "success" : successRate >= 0.5 ? "gold" : "error"}
                    />
                </motion.div>
            </div>
        </motion.div>
    );
}

function StatItem({
    icon: Icon,
    label,
    value,
    highlight = false,
    color,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    highlight?: boolean;
    color?: "success" | "gold" | "error";
}) {
    const colorClasses = {
        success: "text-[var(--forge-success)]",
        gold: "text-[var(--gold)]",
        error: "text-[var(--forge-error)]",
    };

    return (
        <div className="flex items-center gap-2">
            <div className={cn(
                "p-2 rounded-lg",
                highlight ? "bg-[var(--gold)]/10" : "bg-[var(--forge-bg-elevated)]"
            )}>
                <Icon className={cn("w-4 h-4", highlight ? "text-[var(--gold)]" : "text-[var(--forge-text-muted)]")} />
            </div>
            <div>
                <div className={cn(
                    "text-sm font-semibold",
                    highlight ? textGradientEmber : color ? colorClasses[color] : "text-[var(--forge-text-primary)]"
                )}>
                    {value}
                </div>
                <div className="text-xs text-[var(--forge-text-muted)]">{label}</div>
            </div>
        </div>
    );
}

// ============================================================================
// CONTENT SECTIONS
// ============================================================================

function ContentSection({
    title,
    icon: Icon,
    children,
    delay = 0,
}: {
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: forgeEasing }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] p-6"
        >
            <div className="flex items-center gap-2 mb-4">
                <Icon className="w-5 h-5 text-[var(--ember)]" />
                <h2 className="text-lg font-semibold text-[var(--forge-text-primary)]">{title}</h2>
            </div>
            {children}
        </motion.div>
    );
}

// ============================================================================
// HINT SECTION
// ============================================================================

function HintSection({ hints }: { hints: ChallengeHint[] }) {
    const [revealedHints, setRevealedHints] = useState<number[]>([]);

    const revealHint = (level: number) => {
        if (!revealedHints.includes(level)) {
            setRevealedHints([...revealedHints, level]);
        }
    };

    return (
        <ContentSection title="Hints" icon={Lightbulb} delay={0.5}>
            <p className="text-sm text-[var(--forge-text-secondary)] mb-4">
                Use hints if you get stuck. Each hint reduces XP reward.
            </p>
            <div className="space-y-3">
                {hints.map((hint, index) => {
                    const isRevealed = revealedHints.includes(hint.level);
                    return (
                        <motion.div
                            key={hint.level}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                "p-4 rounded-xl border transition-all",
                                isRevealed
                                    ? "bg-[var(--gold)]/5 border-[var(--gold)]/30"
                                    : "bg-[var(--forge-bg-elevated)] border-[var(--forge-border-subtle)] hover:border-[var(--gold)]/30"
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                                    Hint {hint.level}
                                </span>
                                <span className="text-xs text-[var(--forge-error)]">
                                    -{hint.xpPenalty} XP
                                </span>
                            </div>
                            <AnimatePresence mode="wait">
                                {isRevealed ? (
                                    <motion.p
                                        key="content"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="text-sm text-[var(--forge-text-secondary)]"
                                    >
                                        {hint.content}
                                    </motion.p>
                                ) : (
                                    <motion.button
                                        key="button"
                                        onClick={() => revealHint(hint.level)}
                                        className="flex items-center gap-2 text-sm text-[var(--gold)] hover:text-[var(--gold)]/80 transition-colors"
                                        whileHover={{ x: 4 }}
                                    >
                                        <Eye size={14} />
                                        Reveal hint
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </ContentSection>
    );
}

// ============================================================================
// CODE SNIPPET
// ============================================================================

function CodeSnippet({ code, file, startLine }: { code: string; file: string; startLine: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[var(--forge-bg-elevated)] rounded-xl border border-[var(--forge-border-subtle)] overflow-hidden"
        >
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--forge-bg-bench)] border-b border-[var(--forge-border-subtle)]">
                <div className="flex items-center gap-2">
                    <FileCode size={14} className="text-[var(--forge-text-muted)]" />
                    <span className="text-sm text-[var(--forge-text-secondary)] font-mono">{file}</span>
                </div>
                <span className="text-xs text-[var(--forge-text-muted)]">Line {startLine}</span>
            </div>
            <pre className="p-4 overflow-x-auto">
                <code className="text-sm text-[var(--forge-text-secondary)] font-mono">
                    {code}
                </code>
            </pre>
        </motion.div>
    );
}

// ============================================================================
// SIDEBAR COMPONENTS
// ============================================================================

function StartChallengeCard({
    isStarting,
    onStart,
    hasUser,
}: {
    isStarting: boolean;
    onStart: () => void;
    hasUser: boolean;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] p-6"
        >
            {hasUser ? (
                <div className="text-center">
                    <ForgeGlowButton href="#" icon="flame">
                        <span onClick={(e) => { e.preventDefault(); onStart(); }}>
                            {isStarting ? "Starting..." : "Start Challenge"}
                        </span>
                    </ForgeGlowButton>
                </div>
            ) : (
                <>
                    <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)] cursor-not-allowed"
                    >
                        <Play size={18} />
                        Start Challenge
                    </button>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-start gap-2 mt-4 p-3 bg-[var(--gold)]/10 rounded-lg border border-[var(--gold)]/20"
                    >
                        <AlertCircle size={16} className="text-[var(--gold)] flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-[var(--forge-text-secondary)]">
                            Sign in to start contributing to open source projects.
                        </p>
                    </motion.div>
                </>
            )}
        </motion.div>
    );
}

function SidebarSection({
    title,
    children,
    delay = 0,
}: {
    title: string;
    children: React.ReactNode;
    delay?: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4, ease: forgeEasing }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] p-6"
        >
            <h3 className="font-semibold text-[var(--forge-text-primary)] mb-4">{title}</h3>
            {children}
        </motion.div>
    );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ChallengeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useForge();
    const id = params.id as string;

    const challenge = mockChallenges.find((c) => c.id === id);
    const project = challenge ? mockProjects.find((p) => p.id === challenge.projectId) : null;

    const [isStarting, setIsStarting] = useState(false);

    if (!challenge || !project) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <div className="w-20 h-20 rounded-full bg-[var(--forge-bg-elevated)] flex items-center justify-center mx-auto mb-6">
                        <Target size={32} className="text-[var(--forge-text-muted)]" />
                    </div>
                    <h1 className="text-2xl font-bold text-[var(--forge-text-primary)] mb-4">
                        Challenge Not Found
                    </h1>
                    <p className="text-[var(--forge-text-secondary)] mb-8">
                        The challenge you're looking for doesn't exist or has been removed.
                    </p>
                    <ForgeGlowButton href="/forge/challenges" icon="sparkles">
                        Browse Challenges
                    </ForgeGlowButton>
                </motion.div>
            </div>
        );
    }

    const handleStartChallenge = () => {
        setIsStarting(true);
        setTimeout(() => {
            router.push(`/forge/workspace/${challenge.id}`);
        }, 1000);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Back Link */}
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <Link
                    href="/forge/challenges"
                    className="inline-flex items-center gap-2 text-sm text-[var(--forge-text-muted)] hover:text-[var(--ember)] transition-colors mb-6"
                >
                    <ArrowLeft size={16} />
                    Back to Challenges
                </Link>
            </motion.div>

            {/* Hero */}
            <ChallengeHero
                title={challenge.title}
                description={challenge.description}
                difficulty={challenge.difficulty}
                type={challenge.type}
                xpReward={challenge.xpReward}
                estimatedMinutes={challenge.estimatedMinutes}
                timesCompleted={challenge.timesCompleted}
                successRate={challenge.successRate || 0}
            />

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Context */}
                    <ContentSection title="Context" icon={BookOpen} delay={0.1}>
                        <p className="text-[var(--forge-text-secondary)]">{challenge.context}</p>
                    </ContentSection>

                    {/* Code Location */}
                    {challenge.codeSnippet && challenge.location && (
                        <div>
                            <motion.h2
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.35 }}
                                className="text-lg font-semibold text-[var(--forge-text-primary)] mb-4 flex items-center gap-2"
                            >
                                <FileCode size={20} className="text-[var(--ember)]" />
                                Code Location
                            </motion.h2>
                            <CodeSnippet
                                code={challenge.codeSnippet}
                                file={challenge.location.file}
                                startLine={challenge.location.startLine}
                            />
                        </div>
                    )}

                    {/* Instructions */}
                    <ContentSection title="Instructions" icon={Target} delay={0.2}>
                        <div className="text-[var(--forge-text-secondary)] whitespace-pre-line">
                            {challenge.instructions}
                        </div>
                    </ContentSection>

                    {/* Expected Outcome */}
                    <ContentSection title="Expected Outcome" icon={Check} delay={0.3}>
                        <div className="flex items-start gap-3 p-4 bg-[var(--forge-success)]/10 rounded-xl border border-[var(--forge-success)]/20">
                            <Check size={20} className="text-[var(--forge-success)] flex-shrink-0 mt-0.5" />
                            <p className="text-[var(--forge-text-secondary)]">
                                {challenge.expectedOutcome}
                            </p>
                        </div>
                    </ContentSection>

                    {/* Hints */}
                    {challenge.hints.length > 0 && <HintSection hints={challenge.hints} />}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Start Button */}
                    <StartChallengeCard
                        isStarting={isStarting}
                        onStart={handleStartChallenge}
                        hasUser={!!user}
                    />

                    {/* Project Info */}
                    <SidebarSection title="Project" delay={0.3}>
                        <Link
                            href={`/forge/projects/${project.slug}`}
                            className="flex items-center gap-3 p-3 bg-[var(--forge-bg-elevated)] rounded-xl hover:bg-[var(--forge-bg-bench)] transition-colors group"
                        >
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--ember)]/20 to-[var(--gold)]/20 flex items-center justify-center">
                                <Flame size={20} className="text-[var(--ember)]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-[var(--forge-text-primary)] group-hover:text-[var(--ember)] transition-colors">
                                    {project.name}
                                </div>
                                <div className="text-xs text-[var(--forge-text-muted)]">
                                    {project.targetProduct} alternative
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-[var(--forge-text-muted)] group-hover:text-[var(--ember)] transition-colors" />
                        </Link>

                        <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--forge-border-subtle)] text-sm text-[var(--forge-text-secondary)] hover:text-[var(--ember)] transition-colors"
                        >
                            <Github size={16} />
                            View Repository
                        </a>
                    </SidebarSection>

                    {/* Skills Required */}
                    <SidebarSection title="Skills Required" delay={0.4}>
                        <div className="flex flex-wrap gap-2">
                            {challenge.skillsRequired.map((skill, i) => (
                                <motion.span
                                    key={skill}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.4 + i * 0.05 }}
                                    className="px-3 py-1.5 rounded-lg bg-[var(--forge-bg-elevated)] text-sm text-[var(--forge-text-secondary)]"
                                >
                                    {skill}
                                </motion.span>
                            ))}
                        </div>
                    </SidebarSection>

                    {/* Skills You'll Learn */}
                    <SidebarSection title="Skills You'll Learn" delay={0.5}>
                        <div className="flex flex-wrap gap-2">
                            {challenge.skillsTaught.map((skill, i) => (
                                <motion.span
                                    key={skill}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + i * 0.05 }}
                                    className="px-3 py-1.5 rounded-lg bg-[var(--forge-success)]/10 text-sm text-[var(--forge-success)]"
                                >
                                    {skill}
                                </motion.span>
                            ))}
                        </div>
                    </SidebarSection>

                    {/* Tags */}
                    <SidebarSection title="Tags" delay={0.6}>
                        <div className="flex flex-wrap gap-2">
                            {challenge.tags.map((tag, i) => (
                                <motion.span
                                    key={tag}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.6 + i * 0.03 }}
                                    className="px-2 py-1 rounded text-xs bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]"
                                >
                                    #{tag}
                                </motion.span>
                            ))}
                        </div>
                    </SidebarSection>

                    {/* Leaderboard */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                    >
                        <LeaderboardPanel challengeId={challenge.id} maxEntries={5} />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
