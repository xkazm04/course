"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    ScanFace, BoxSelect, Hexagon, Cpu, Globe, Sparkles
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import {
    createVariantConfig,
    createMode,
    PolymorphicVariantProps,
    ExtendedThemeScheme,
    getExtendedTheme,
    themeCompiler,
    type ThemePreset,
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
import { Target, Award, Rocket, Zap } from "lucide-react";

// ============================================================================
// Landing Mode Configuration
// ============================================================================

export type LandingMode = "spatial" | "dark";

/**
 * Extended landing modes including compiled theme presets.
 * These leverage the ThemeCompiler for programmatic theme generation.
 */
export type ExtendedLandingMode = LandingMode | ThemePreset;

export const landingConfig = createVariantConfig<LandingMode>({
    id: "landing",
    name: "Landing Page",
    modes: [
        createMode("spatial", "Spatial", "Light theme with 3D stacked cards"),
        createMode("dark", "Dark", "Dark mode mirror of spatial variant"),
    ],
    defaultMode: "spatial",
});

/**
 * Resolve theme from mode - supports both legacy modes and ThemeCompiler presets.
 * This demonstrates the UI-as-compilation pattern where themes are not hand-crafted
 * but programmatically generated from semantic intent.
 */
function resolveThemeFromMode(mode: ExtendedLandingMode): ExtendedThemeScheme {
    // Legacy mode support
    if (mode === "spatial" || mode === "dark" || mode === "light") {
        return getExtendedTheme(mode);
    }

    // For ThemeCompiler presets, compile the theme
    try {
        return themeCompiler.compilePreset(mode as ThemePreset);
    } catch {
        // Fallback to light theme on invalid preset
        return getExtendedTheme("light");
    }
}

// ============================================================================
// Shared Data & Constants
// ============================================================================

const floatingBadges = [
    { icon: Cpu, text: "AI Powered", delay: 0.2, x: "10%", y: "20%" },
    { icon: Globe, text: "Global Access", delay: 0.6, x: "80%", y: "15%" },
    { icon: Hexagon, text: "Career Ready", delay: 0.9, x: "75%", y: "80%" },
    { icon: Sparkles, text: "Dynamic", delay: 1.2, x: "5%", y: "75%" },
];


// ============================================================================
// Polymorphic Landing Component
// ============================================================================

export type LandingPolymorphicProps = Omit<PolymorphicVariantProps<LandingMode>, 'data'> & {
    /**
     * Extended mode support - can use either legacy modes (spatial/dark)
     * or ThemeCompiler presets (midnight, ocean, highContrast, etc.)
     */
    extendedMode?: ExtendedLandingMode;
};

/**
 * Polymorphic Landing Component
 *
 * A single component that can render in multiple modes (spatial/dark).
 * This replaces the need for separate VariantC and VariantD components.
 * The mode prop transforms the rendering strategy while maintaining
 * identical structure, data, and interactions.
 *
 * Uses ThemeScheme injection pattern to eliminate isDark ternaries.
 * Adding new themes (high-contrast, sepia) requires only adding a new
 * ExtendedThemeScheme definition - no structural changes needed.
 *
 * Now supports ThemeCompiler presets for programmatic theme generation:
 * - highContrast / highContrastDark for accessibility
 * - protanopia / deuteranopia / tritanopia for colorblind users
 * - midnight / forest / ocean / sunset for aesthetic themes
 *
 * @example
 * ```tsx
 * // Legacy mode
 * <LandingPolymorphic mode="dark" />
 *
 * // ThemeCompiler preset
 * <LandingPolymorphic mode="spatial" extendedMode="midnight" />
 * ```
 */
export const LandingPolymorphic = ({
    mode,
    extendedMode,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onModeChange,
    className,
}: LandingPolymorphicProps) => {
    // Theme injection - supports both legacy modes and ThemeCompiler presets
    // When extendedMode is provided, use it; otherwise use legacy mode
    const effectiveMode = extendedMode ?? mode;
    const theme = resolveThemeFromMode(effectiveMode);
    const router = useRouter();

    // Use velocity context for adaptive UI behavior
    const { adaptations, velocity } = useUserVelocity();
    const { shouldAnimate, intensity, showDecorations, durationMultiplier } = useVelocityAnimation();
    const { shouldPrefetchOnHover, shouldPrefetchAll } = useVelocityPrefetch();

    // Detect visibility for lazy loading animations
    // Pauses gradient animations when page is scrolled away or tab is hidden
    const [gradientContainerRef, isGradientVisible] = useVisibility<HTMLDivElement>({ threshold: 0.1 });

    // Check for personalized assessment profile to customize floating badges
    const [personalizedBadges, setPersonalizedBadges] = React.useState(floatingBadges);

    React.useEffect(() => {
        const profile = assessmentStorage.getProfile();
        if (profile?.result?.personalizedTags) {
            const tags = profile.result.personalizedTags;
            const personalizedIcons = [Target, Award, Rocket, Zap];
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

    // Prefetch all routes immediately if in exploring mode
    React.useEffect(() => {
        if (shouldPrefetchAll) {
            router.prefetch("/overview");
            router.prefetch("/goal-path");
        }
    }, [shouldPrefetchAll, router]);

    // Prefetch route on hover for instant navigation (velocity-aware)
    const handlePrefetch = (href: string) => {
        if (shouldPrefetchOnHover) {
            router.prefetch(href);
        }
    };

    // Use mesh gradient primitives for ambient background animations
    // Disable animations based on velocity adaptations OR when not visible
    const primaryGradient = useMeshGradient({
        rotationDirection: 1,
        rotateDuration: 30 / (durationMultiplier || 0.1), // Slower when focused
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

    return (
        <div
            className={cn(
                "min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden perspective-[2000px]",
                theme.page.container,
                className
            )}
            data-testid={`landing-${mode}`}
            data-mode={mode}
            data-velocity={velocity}
            data-density={adaptations.contentDensity}
        >
            {/* Abstract Background - "The Void" */}
            <div ref={gradientContainerRef} className="absolute inset-0 overflow-hidden" data-testid="landing-gradient-container">
                <motion.div
                    {...primaryGradient}
                    className={cn(
                        "absolute -top-[50%] -left-[50%] w-[100vw] h-[100vw] rounded-full blur-[120px]",
                        theme.gradients.primaryBlob
                    )}
                />
                <motion.div
                    {...secondaryGradient}
                    className={cn(
                        "absolute top-[20%] right-[-20%] w-[80vw] h-[80vw] rounded-full blur-[120px]",
                        theme.gradients.secondaryBlob
                    )}
                />

                {/* 3D Grid Floor */}
                <div
                    className={cn(
                        "absolute bottom-0 left-0 w-full h-[50vh] transform perspective-[1000px] rotate-x-[60deg]",
                        theme.gradients.gridFloor
                    )}
                    style={{
                        backgroundSize: '40px 40px',
                        backgroundImage: theme.gradients.gridLines
                    }}
                />
            </div>

            <div className="container max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10 py-20">
                {/* Left: Typography & Controls */}
                <div className="flex-1 space-y-10 text-center lg:text-left">
                    <motion.div
                        initial={{ opacity: shouldAnimate ? 0 : 1, y: shouldAnimate ? 20 * intensity : 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: shouldAnimate ? DURATION_ENTRANCE * durationMultiplier : 0 }}
                    >
                        <div className={cn(
                            "inline-flex items-center gap-2 px-4 py-1.5 rounded-full backdrop-blur-sm font-bold tracking-widest text-[10px] uppercase mb-8",
                            theme.hero.tagline
                        )}>
                            <ScanFace size={ICON_SIZES.xs} /> Spatial Learning V1.0
                        </div>

                        <h1 className={cn(
                            "text-7xl lg:text-8xl font-black tracking-tighter drop-shadow-sm leading-[0.9]",
                            theme.hero.title
                        )}>
                            KNOWLEDGE<br />
                            <span className="text-6xl lg:text-7xl font-light italic">IS SPATIAL</span>
                        </h1>

                        <p className={cn(
                            "mt-8 text-xl max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed",
                            theme.hero.subtitle
                        )}>
                            Don't just learn.{" "}
                            <span className={theme.hero.emphasis}>
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
                                onMouseEnter={() => handlePrefetch("/overview")}
                                className={cn(
                                    "group relative shadow-xl overflow-hidden",
                                    theme.buttons.primary
                                )}
                                data-testid="landing-enter-platform-btn"
                            >
                                <div className={cn(
                                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                                    theme.buttons.primaryHoverOverlay
                                )} />
                                <span className={cn(
                                    "relative z-10 flex items-center gap-2",
                                    theme.buttons.primaryTextHover
                                )}>
                                    Enter Platform <BoxSelect size={ICON_SIZES.md} />
                                </span>
                            </Button>
                        </Link>
                        <Link href="/goal-path">
                            <Button
                                size="lg"
                                variant="secondary"
                                onMouseEnter={() => handlePrefetch("/goal-path")}
                                className={cn(
                                    "backdrop-blur-md",
                                    theme.buttons.secondary
                                )}
                                data-testid="landing-define-goal-btn"
                            >
                                Define Your Goal
                            </Button>
                        </Link>
                    </motion.div>
                </div>

                {/* Right: The Floating Interface */}
                <div className="flex-1 w-full h-[600px] relative flex items-center justify-center">
                    {/* Floating Badges - personalized when user completes assessment */}
                    {showDecorations && personalizedBadges.map((badge) => (
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
                                theme.gradients.backCard
                            )}
                        />

                        {/* Middle Card */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: shouldAnimate ? 0 : 1, y: shouldAnimate ? 50 * intensity : 0 }}
                            animate={{ scale: 0.95, opacity: 1, y: 0 }}
                            transition={{ delay: shouldAnimate ? 0.3 * durationMultiplier : 0 }}
                            className={cn(
                                "absolute inset-0 rounded-3xl shadow-xl translate-y-4 translate-x-4 flex items-center justify-center border",
                                theme.gradients.middleCard,
                                theme.gradients.middleCardBorder
                            )}
                        >
                            <div className={cn(
                                "w-full text-center font-black text-5xl tracking-tighter",
                                theme.card.watermarkText
                            )}>
                                LEARNING
                            </div>
                        </motion.div>

                        {/* Front Card - Interactive Skill Assessment (Lazy-loaded) */}
                        <SkillAssessmentHeroLazy theme={theme} reducedMotion={!shouldAnimate} />
                    </div>
                </div>
            </div>

            <footer className="absolute bottom-4 text-center w-full">
                <span className={cn(
                    "text-[10px] px-3 py-1 rounded-full backdrop-blur-sm",
                    theme.footer.container
                )}>
                    Designed for the Future of Learning
                </span>
            </footer>
        </div>
    );
};

// ============================================================================
// Convenience Exports for Backward Compatibility
// ============================================================================

/** Spatial mode (light theme) - maintains backward compatibility */
export const LandingSpatial = () => <LandingPolymorphic mode="spatial" />;

/** Dark mode - maintains backward compatibility */
export const LandingDark = () => <LandingPolymorphic mode="dark" />;
