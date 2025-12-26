"use client";

/**
 * LandingProgressive - Unified Progressive Disclosure Landing Page
 *
 * This component combines all three landing variants (Polymorphic, SocialProof, Universe)
 * into a single progressive disclosure experience. Instead of picking one variant,
 * users experience all layers through scroll engagement:
 *
 * Layer 1 (Hero): Minimal entry point with core CTA (from LandingPolymorphic)
 * Layer 2 (Social Proof): Social validation appears on scroll
 * Layer 3 (Universe): Content preview/exploration on deeper engagement
 *
 * This approach:
 * - Reduces decision paralysis for site owners
 * - Increases engagement through graduated exposure
 * - New users get minimal view, engaged users discover more
 */

import React, { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ScanFace,
    BoxSelect,
    Hexagon,
    Cpu,
    Globe,
    Sparkles,
    Users,
    TrendingUp,
    ArrowRight,
    Target,
    ChevronDown,
    Globe2,
    Layers,
    Sun,
    Star,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import {
    getExtendedTheme,
    type ExtendedThemeScheme,
} from "@/app/shared/lib/variantMachine";
import {
    useMeshGradient,
    useVisibility,
    useReducedMotion,
    DURATION_ENTRANCE,
} from "@/app/shared/lib/motionPrimitives";
import {
    useUserVelocity,
    useVelocityAnimation,
    useVelocityPrefetch,
} from "@/app/features/user-velocity";
import { FloatingBadge, Button } from "@/app/shared/components";
import { SkillAssessmentHeroLazy, assessmentStorage } from "@/app/features/skill-assessment";
import { Target as TargetIcon, Award, Rocket, Zap } from "lucide-react";
import { SocialProofVisualization, SocialProofStatsCompact } from "@/app/features/social-proof";
import { KnowledgeUniversePreview } from "@/app/features/knowledge-universe";

// ============================================================================
// TYPES
// ============================================================================

export interface LandingProgressiveProps {
    className?: string;
    theme?: "light" | "dark";
    /** Initial disclosure level (0-2). Mainly for testing. */
    initialLevel?: 0 | 1 | 2;
}

type DisclosureLevel = 0 | 1 | 2;

// ============================================================================
// CONSTANTS
// ============================================================================

const floatingBadges = [
    { icon: Cpu, text: "AI Powered", delay: 0.2, x: "10%", y: "20%" },
    { icon: Globe, text: "Global Access", delay: 0.6, x: "80%", y: "15%" },
    { icon: Hexagon, text: "Career Ready", delay: 0.9, x: "75%", y: "80%" },
    { icon: Sparkles, text: "Dynamic", delay: 1.2, x: "5%", y: "75%" },
];

// Scroll thresholds for progressive disclosure
const SCROLL_THRESHOLD_SOCIAL_PROOF = 0.25; // Show social proof at 25% scroll
const SCROLL_THRESHOLD_UNIVERSE = 0.55; // Show universe preview at 55% scroll

// ============================================================================
// PROGRESSIVE LANDING COMPONENT
// ============================================================================

export function LandingProgressive({
    className,
    theme = "dark",
    initialLevel = 0,
}: LandingProgressiveProps) {
    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useReducedMotion();
    const isDark = theme === "dark";

    // Theme injection
    const themeScheme = getExtendedTheme(theme);

    // Track current disclosure level for UI state
    const [disclosureLevel, setDisclosureLevel] = useState<DisclosureLevel>(initialLevel);
    const [hasScrolled, setHasScrolled] = useState(false);

    // Scroll progress tracking
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Update disclosure level based on scroll
    useMotionValueEvent(scrollYProgress, "change", (progress) => {
        if (!hasScrolled && progress > 0.05) {
            setHasScrolled(true);
        }

        if (progress >= SCROLL_THRESHOLD_UNIVERSE) {
            setDisclosureLevel(2);
        } else if (progress >= SCROLL_THRESHOLD_SOCIAL_PROOF) {
            setDisclosureLevel(1);
        } else {
            setDisclosureLevel(0);
        }
    });

    // User velocity context for adaptive behavior
    const { adaptations, velocity } = useUserVelocity();
    const { shouldAnimate, intensity, showDecorations, durationMultiplier } = useVelocityAnimation();
    const { shouldPrefetchOnHover, shouldPrefetchAll } = useVelocityPrefetch();

    // Visibility detection for gradient animations
    const [gradientContainerRef, isGradientVisible] = useVisibility<HTMLDivElement>({ threshold: 0.1 });

    // Personalized badges based on assessment
    const [personalizedBadges, setPersonalizedBadges] = useState(floatingBadges);

    useEffect(() => {
        const profile = assessmentStorage.getProfile();
        if (profile?.result?.personalizedTags) {
            const tags = profile.result.personalizedTags;
            const personalizedIcons = [TargetIcon, Award, Rocket, Zap];
            const newBadges = tags.slice(0, 4).map((tag, index) => ({
                icon: personalizedIcons[index] || Sparkles,
                text: tag,
                delay: 0.2 + index * 0.3,
                x: floatingBadges[index]?.x || `${10 + index * 20}%`,
                y: floatingBadges[index]?.y || `${20 + index * 15}%`,
            }));
            setPersonalizedBadges(newBadges);
        }
    }, []);

    // Prefetch routes for exploring mode
    useEffect(() => {
        if (shouldPrefetchAll) {
            router.prefetch("/overview");
            router.prefetch("/goal-path");
        }
    }, [shouldPrefetchAll, router]);

    const handlePrefetch = useCallback((href: string) => {
        if (shouldPrefetchOnHover) {
            router.prefetch(href);
        }
    }, [shouldPrefetchOnHover, router]);

    // Mesh gradient animations
    const primaryGradient = useMeshGradient({
        rotationDirection: 1,
        rotateDuration: 30 / (durationMultiplier || 0.1),
        scaleKeyframes: shouldAnimate ? [1, 1 + 0.2 * intensity, 1] : [1],
        reducedMotion: !shouldAnimate,
        isPaused: !isGradientVisible,
    });
    const secondaryGradient = useMeshGradient({
        rotationDirection: -1,
        rotateDuration: 40 / (durationMultiplier || 0.1),
        scaleKeyframes: shouldAnimate ? [1, 1 + 0.3 * intensity, 1] : [1],
        reducedMotion: !shouldAnimate,
        isPaused: !isGradientVisible,
    });

    // Parallax transforms for sections
    const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.3]);
    const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);
    const socialProofOpacity = useTransform(scrollYProgress, [0.15, 0.3, 0.5, 0.6], [0, 1, 1, 0.3]);
    const universeOpacity = useTransform(scrollYProgress, [0.45, 0.6], [0, 1]);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative",
                isDark ? "bg-slate-950" : "bg-slate-50",
                className
            )}
            style={{ height: "300vh" }} // Scrollable height for progressive disclosure
            data-testid="landing-progressive"
            data-disclosure-level={disclosureLevel}
            data-velocity={velocity}
            data-density={adaptations.contentDensity}
        >
            {/* Fixed viewport container */}
            <div className="fixed inset-0 overflow-hidden">
                {/* Background gradients */}
                <div ref={gradientContainerRef} className="absolute inset-0 overflow-hidden" data-testid="landing-gradient-container">
                    <motion.div
                        {...primaryGradient}
                        className={cn(
                            "absolute -top-[50%] -left-[50%] w-[100vw] h-[100vw] rounded-full blur-[120px]",
                            isDark
                                ? "bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-transparent"
                                : "bg-gradient-to-br from-indigo-200/40 via-purple-200/30 to-transparent"
                        )}
                    />
                    <motion.div
                        {...secondaryGradient}
                        className={cn(
                            "absolute top-[20%] right-[-20%] w-[80vw] h-[80vw] rounded-full blur-[120px]",
                            isDark
                                ? "bg-gradient-to-tl from-cyan-900/20 via-emerald-900/20 to-transparent"
                                : "bg-gradient-to-tl from-cyan-200/30 via-emerald-200/20 to-transparent"
                        )}
                    />

                    {/* 3D Grid Floor */}
                    <div
                        className={cn(
                            "absolute bottom-0 left-0 w-full h-[50vh] transform perspective-[1000px] rotate-x-[60deg] opacity-30",
                            isDark
                                ? "bg-[linear-gradient(to_right,rgba(99,102,241,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.1)_1px,transparent_1px)]"
                                : "bg-[linear-gradient(to_right,rgba(99,102,241,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,102,241,0.15)_1px,transparent_1px)]"
                        )}
                        style={{ backgroundSize: "40px 40px" }}
                    />
                </div>

                {/* Layer 1: Hero Section (Always visible, fades on scroll) */}
                <motion.section
                    style={{
                        opacity: prefersReducedMotion ? 1 : heroOpacity,
                        scale: prefersReducedMotion ? 1 : heroScale,
                    }}
                    className="absolute inset-0 z-10"
                >
                    <HeroLayer
                        theme={themeScheme}
                        isDark={isDark}
                        badges={personalizedBadges}
                        showDecorations={showDecorations}
                        shouldAnimate={shouldAnimate}
                        intensity={intensity}
                        durationMultiplier={durationMultiplier}
                        onPrefetch={handlePrefetch}
                        prefersReducedMotion={prefersReducedMotion}
                    />
                </motion.section>

                {/* Layer 2: Social Proof Section */}
                <motion.section
                    style={{
                        opacity: prefersReducedMotion ? (disclosureLevel >= 1 ? 1 : 0) : socialProofOpacity,
                    }}
                    className={cn(
                        "absolute inset-0 z-20 flex items-center justify-center",
                        disclosureLevel < 1 && "pointer-events-none"
                    )}
                >
                    <SocialProofLayer
                        isDark={isDark}
                        isActive={disclosureLevel >= 1}
                        prefersReducedMotion={prefersReducedMotion}
                    />
                </motion.section>

                {/* Layer 3: Universe Preview Section */}
                <motion.section
                    style={{
                        opacity: prefersReducedMotion ? (disclosureLevel >= 2 ? 1 : 0) : universeOpacity,
                    }}
                    className={cn(
                        "absolute inset-0 z-30 flex items-center justify-center",
                        disclosureLevel < 2 && "pointer-events-none"
                    )}
                >
                    <UniverseLayer
                        isDark={isDark}
                        isActive={disclosureLevel >= 2}
                        prefersReducedMotion={prefersReducedMotion}
                    />
                </motion.section>

                {/* Scroll indicator */}
                {!hasScrolled && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2, duration: 0.5 }}
                        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2"
                    >
                        <span className={cn(
                            "text-sm font-medium",
                            isDark ? "text-slate-400" : "text-slate-500"
                        )}>
                            Scroll to explore more
                        </span>
                        <ChevronDown
                            size={24}
                            className={cn(
                                "animate-bounce",
                                isDark ? "text-indigo-400" : "text-indigo-600"
                            )}
                        />
                    </motion.div>
                )}

                {/* Progress indicator */}
                <ProgressIndicator
                    level={disclosureLevel}
                    isDark={isDark}
                    prefersReducedMotion={prefersReducedMotion}
                />
            </div>
        </div>
    );
}

// ============================================================================
// LAYER COMPONENTS
// ============================================================================

interface HeroLayerProps {
    theme: ExtendedThemeScheme;
    isDark: boolean;
    badges: typeof floatingBadges;
    showDecorations: boolean;
    shouldAnimate: boolean;
    intensity: number;
    durationMultiplier: number;
    onPrefetch: (href: string) => void;
    prefersReducedMotion: boolean;
}

function HeroLayer({
    theme,
    isDark,
    badges,
    showDecorations,
    shouldAnimate,
    intensity,
    durationMultiplier,
    onPrefetch,
    prefersReducedMotion,
}: HeroLayerProps) {
    return (
        <div className="container max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10 py-20 px-4 h-full">
            {/* Left: Typography & Controls */}
            <div className="flex-1 space-y-10 text-center lg:text-left">
                <motion.div
                    initial={{ opacity: shouldAnimate ? 0 : 1, y: shouldAnimate ? 20 * intensity : 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: shouldAnimate ? DURATION_ENTRANCE * durationMultiplier : 0 }}
                >
                    <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-sm font-bold tracking-widest text-[10px] uppercase mb-8",
                        isDark
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            : "bg-indigo-100 text-indigo-700 border border-indigo-200"
                    )}>
                        <ScanFace size={ICON_SIZES.xs} /> Spatial Learning V1.0
                    </div>

                    <h1 className={cn(
                        "text-7xl lg:text-8xl font-black tracking-tighter drop-shadow-sm leading-[0.9]",
                        isDark ? "text-white" : "text-slate-900"
                    )}>
                        KNOWLEDGE<br />
                        <span className={cn(
                            "text-6xl lg:text-7xl font-light italic bg-clip-text text-transparent bg-gradient-to-r",
                            isDark
                                ? "from-indigo-400 via-purple-400 to-cyan-400"
                                : "from-indigo-600 via-purple-600 to-cyan-600"
                        )}>IS SPATIAL</span>
                    </h1>

                    <p className={cn(
                        "mt-8 text-xl max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed",
                        isDark ? "text-slate-300" : "text-slate-600"
                    )}>
                        Don't just learn.{" "}
                        <span className={cn(
                            "font-bold",
                            isDark ? "text-indigo-400" : "text-indigo-600"
                        )}>
                            Experience
                        </span>{" "}
                        education through AI-powered paths, career mapping, and dynamic content.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: shouldAnimate ? 0 : 1 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: shouldAnimate ? 0.4 * durationMultiplier : 0 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                >
                    <Link href="/overview">
                        <Button
                            size="lg"
                            variant="primary"
                            dark={isDark}
                            onMouseEnter={() => onPrefetch("/overview")}
                            className="group shadow-xl"
                            data-testid="progressive-enter-platform-btn"
                        >
                            <span className="flex items-center gap-2">
                                Enter Platform <BoxSelect size={ICON_SIZES.md} />
                            </span>
                        </Button>
                    </Link>
                    <Link href="/goal-path">
                        <Button
                            size="lg"
                            variant="secondary"
                            dark={isDark}
                            onMouseEnter={() => onPrefetch("/goal-path")}
                            className="backdrop-blur-md"
                            data-testid="progressive-define-goal-btn"
                        >
                            Define Your Goal
                        </Button>
                    </Link>
                </motion.div>
            </div>

            {/* Right: The Floating Interface */}
            <div className="flex-1 w-full h-[600px] relative flex items-center justify-center">
                {/* Floating Badges */}
                {showDecorations && badges.map((badge) => (
                    <FloatingBadge
                        key={badge.text}
                        {...badge}
                        theme={theme.badge}
                        reducedMotion={!shouldAnimate}
                    />
                ))}

                {/* Main Stack */}
                <div className="relative w-full max-w-md aspect-[3/4]">
                    {/* Back Card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: shouldAnimate ? 0 : 1, y: shouldAnimate ? 50 * intensity : 0 }}
                        animate={{ scale: 0.9, opacity: 1, y: 0 }}
                        transition={{ delay: shouldAnimate ? 0.2 * durationMultiplier : 0 }}
                        className={cn(
                            "absolute inset-0 rounded-3xl blur-[1px] opacity-60 translate-y-8 translate-x-8",
                            isDark
                                ? "bg-gradient-to-br from-purple-600 to-indigo-800"
                                : "bg-gradient-to-br from-purple-300 to-indigo-400"
                        )}
                    />

                    {/* Middle Card */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: shouldAnimate ? 0 : 1, y: shouldAnimate ? 50 * intensity : 0 }}
                        animate={{ scale: 0.95, opacity: 1, y: 0 }}
                        transition={{ delay: shouldAnimate ? 0.3 * durationMultiplier : 0 }}
                        className={cn(
                            "absolute inset-0 rounded-3xl shadow-xl translate-y-4 translate-x-4 flex items-center justify-center border",
                            isDark
                                ? "bg-slate-900/80 border-white/10"
                                : "bg-white/80 border-slate-200"
                        )}
                    >
                        <div className={cn(
                            "w-full text-center font-black text-5xl tracking-tighter",
                            isDark ? "text-white/10" : "text-slate-200"
                        )}>
                            LEARNING
                        </div>
                    </motion.div>

                    {/* Front Card - Interactive Skill Assessment */}
                    <SkillAssessmentHeroLazy theme={theme} reducedMotion={!shouldAnimate} />
                </div>
            </div>
        </div>
    );
}

interface SocialProofLayerProps {
    isDark: boolean;
    isActive: boolean;
    prefersReducedMotion: boolean;
}

function SocialProofLayer({
    isDark,
    isActive,
    prefersReducedMotion,
}: SocialProofLayerProps) {
    return (
        <div className={cn(
            "w-full h-full flex flex-col items-center justify-center px-6",
            isDark ? "bg-slate-950/90" : "bg-slate-50/90",
            "backdrop-blur-sm"
        )}>
            <div className="container max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <span
                        className={cn(
                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4",
                            isDark
                                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                                : "bg-indigo-100 text-indigo-700 border border-indigo-200",
                            !prefersReducedMotion && isActive && "animate-entrance-fade-up"
                        )}
                        data-testid="social-proof-layer-badge"
                    >
                        <Users size={ICON_SIZES.sm} />
                        Live Success Stories
                        <span
                            className={cn(
                                "w-2 h-2 rounded-full",
                                isDark ? "bg-emerald-400" : "bg-emerald-500",
                                !prefersReducedMotion && "animate-pulse-indicator"
                            )}
                        />
                    </span>

                    <h2 className={cn(
                        "text-3xl md:text-5xl font-black tracking-tight mb-4",
                        isDark ? "text-white" : "text-slate-900",
                        !prefersReducedMotion && isActive && "animate-entrance-fade-up animation-delay-100"
                    )}>
                        Watch Careers{" "}
                        <span className={cn(
                            "bg-clip-text text-transparent bg-gradient-to-r",
                            isDark
                                ? "from-indigo-400 via-purple-400 to-cyan-400"
                                : "from-indigo-600 via-purple-600 to-cyan-600"
                        )}>
                            Transform
                        </span>
                    </h2>

                    <p className={cn(
                        "text-lg max-w-2xl mx-auto",
                        isDark ? "text-slate-400" : "text-slate-600",
                        !prefersReducedMotion && isActive && "animate-entrance-fade-up animation-delay-200"
                    )}>
                        See real learning paths from people who started exactly where you are.
                    </p>
                </div>

                {/* Compact visualization for overlay */}
                <div className={cn(
                    "w-full max-w-4xl mx-auto",
                    !prefersReducedMotion && isActive && "animate-entrance-fade-up animation-delay-300"
                )}>
                    {isActive && (
                        <SocialProofStatsCompact theme={isDark ? "dark" : "light"} />
                    )}
                </div>

                {/* CTA */}
                <div className={cn(
                    "mt-8 text-center",
                    !prefersReducedMotion && isActive && "animate-entrance-fade-up animation-delay-400"
                )}>
                    <Link href="/overview">
                        <Button
                            size="lg"
                            variant="primary"
                            dark={isDark}
                            className="group"
                            data-testid="social-proof-layer-cta-btn"
                        >
                            <TrendingUp size={ICON_SIZES.md} />
                            Start Your Journey
                            <ArrowRight
                                size={ICON_SIZES.md}
                                className="group-hover:translate-x-1 transition-transform"
                            />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

interface UniverseLayerProps {
    isDark: boolean;
    isActive: boolean;
    prefersReducedMotion: boolean;
}

function UniverseLayer({
    isDark,
    isActive,
    prefersReducedMotion,
}: UniverseLayerProps) {
    const router = useRouter();

    const handleEnterUniverse = useCallback(() => {
        router.push("/overview");
    }, [router]);

    // Memoize star elements
    const starElements = useMemo(() => {
        if (prefersReducedMotion) return null;
        return Array.from({ length: 50 }).map((_, i) => (
            <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    opacity: 0.1 + Math.random() * 0.3,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 3}s`,
                }}
            />
        ));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={cn(
            "w-full h-full flex flex-col items-center justify-center px-6 relative",
            "bg-slate-950"
        )}>
            {/* Background stars */}
            <div className="absolute inset-0 overflow-hidden">
                {starElements}
            </div>

            {/* Nebula gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-transparent to-purple-950/20 pointer-events-none" />

            <div className="container max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-12">
                {/* Left: Content */}
                <div className="flex-1 space-y-6 text-center lg:text-left">
                    <span
                        className={cn(
                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium",
                            !prefersReducedMotion && isActive && "animate-entrance-fade-up"
                        )}
                    >
                        <Globe2 size={ICON_SIZES.sm} />
                        Knowledge Universe
                    </span>

                    <h2 className={cn(
                        "text-4xl lg:text-6xl font-black tracking-tight text-white",
                        !prefersReducedMotion && isActive && "animate-entrance-fade-up animation-delay-100"
                    )}>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-200">
                            Your Learning
                        </span>
                        <br />
                        <span className="text-indigo-400">Cosmos</span>
                    </h2>

                    <p className={cn(
                        "text-lg text-slate-300 max-w-xl mx-auto lg:mx-0",
                        !prefersReducedMotion && isActive && "animate-entrance-fade-up animation-delay-200"
                    )}>
                        Explore hundreds of interconnected lessons as a cosmic journey.
                        See the full scope of your learning path at a glance.
                    </p>

                    {/* Stats */}
                    <div className={cn(
                        "flex flex-wrap gap-6 justify-center lg:justify-start",
                        !prefersReducedMotion && isActive && "animate-entrance-fade-up animation-delay-300"
                    )}>
                        <StatItem icon={Sun} value="6" label="Domains" color="text-orange-400" />
                        <StatItem icon={Layers} value="60+" label="Chapters" color="text-indigo-400" />
                        <StatItem icon={Star} value="200+" label="Lessons" color="text-yellow-400" />
                    </div>

                    {/* CTA */}
                    <div className={cn(
                        "flex flex-wrap gap-4 justify-center lg:justify-start",
                        !prefersReducedMotion && isActive && "animate-entrance-fade-up animation-delay-400"
                    )}>
                        <Button
                            size="lg"
                            variant="primary"
                            dark
                            onClick={handleEnterUniverse}
                            className="group"
                            data-testid="universe-layer-explore-btn"
                        >
                            <Sparkles size={ICON_SIZES.md} />
                            Explore Universe
                            <ArrowRight
                                size={ICON_SIZES.md}
                                className="group-hover:translate-x-1 transition-transform"
                            />
                        </Button>
                        <Link href="/goal-path">
                            <Button
                                size="lg"
                                variant="secondary"
                                dark
                                data-testid="universe-layer-goals-btn"
                            >
                                <Target size={ICON_SIZES.md} />
                                Set Your Goals
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Right: Universe Preview */}
                <div className={cn(
                    "flex-1 w-full max-w-xl aspect-[4/3]",
                    !prefersReducedMotion && isActive && "animate-entrance-fade-scale animation-delay-300"
                )}>
                    {isActive && (
                        <KnowledgeUniversePreview onEnter={handleEnterUniverse} />
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatItemProps {
    icon: typeof Star;
    value: string;
    label: string;
    color: string;
}

function StatItem({ icon: Icon, value, label, color }: StatItemProps) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-white/5", color)}>
                <Icon size={ICON_SIZES.md} />
            </div>
            <div>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-sm text-slate-400">{label}</div>
            </div>
        </div>
    );
}

interface ProgressIndicatorProps {
    level: DisclosureLevel;
    isDark: boolean;
    prefersReducedMotion: boolean;
}

function ProgressIndicator({ level, isDark, prefersReducedMotion }: ProgressIndicatorProps) {
    const labels = ["Hero", "Social Proof", "Universe"];

    return (
        <div
            className={cn(
                "fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3",
                !prefersReducedMotion && "animate-entrance-fade-left animation-delay-500"
            )}
            data-testid="progressive-disclosure-indicator"
        >
            {[0, 1, 2].map((idx) => (
                <div
                    key={idx}
                    className="flex items-center gap-2 group"
                    data-testid={`disclosure-level-${idx}`}
                >
                    <span
                        className={cn(
                            "text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity",
                            level === idx
                                ? isDark ? "text-indigo-400" : "text-indigo-600"
                                : isDark ? "text-slate-500" : "text-slate-400"
                        )}
                    >
                        {labels[idx]}
                    </span>
                    <div
                        className={cn(
                            "w-2 h-2 rounded-full transition-all duration-300",
                            level === idx
                                ? cn(
                                    "scale-125",
                                    isDark ? "bg-indigo-400" : "bg-indigo-600"
                                )
                                : level > idx
                                    ? isDark ? "bg-slate-600" : "bg-slate-400"
                                    : isDark ? "bg-slate-700" : "bg-slate-300"
                        )}
                    />
                </div>
            ))}
        </div>
    );
}

export default LandingProgressive;
