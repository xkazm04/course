"use client";

/**
 * Landing Social Proof Variant
 *
 * A landing page variant that replaces static module navigation with
 * an animated real-time visualization of learning paths taken by actual users.
 * Shows anonymous skill trajectories flowing through the knowledge graph.
 *
 * Features:
 * - Animated learner journey paths through skill nodes
 * - Filtering by starting point (beginner, career switcher, etc.)
 * - Pulsing activity indicators showing the platform is alive
 * - Journey cards with testimonials
 * - Social proof statistics
 *
 * Performance: Uses CSS animations (animate-entrance-*) defined in globals.css
 * instead of framer-motion to reduce JS overhead and bundle size.
 */

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { Button } from "@/app/shared/components";
import {
  useReducedMotion,
  useMeshGradient,
  useVisibility,
} from "@/app/shared/lib/motionPrimitives";
import { SocialProofVisualization } from "@/app/features/social-proof";


export interface LandingSocialProofProps {
  className?: string;
  theme?: "light" | "dark";
}

export function LandingSocialProof({
  className,
  theme = "dark",
}: LandingSocialProofProps) {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const isDark = theme === "dark";

  // Visibility detection for lazy loading gradient animations
  const [gradientRef, isGradientVisible] = useVisibility<HTMLDivElement>({
    threshold: 0.1,
  });

  // Ambient background gradients - still using useMeshGradient for complex rotate animations
  const primaryGradient = useMeshGradient({
    rotationDirection: 1,
    rotateDuration: 40,
    scaleKeyframes: [1, 1.1, 1],
    reducedMotion: prefersReducedMotion,
    isPaused: !isGradientVisible,
  });

  const secondaryGradient = useMeshGradient({
    rotationDirection: -1,
    rotateDuration: 50,
    scaleKeyframes: [1, 1.15, 1],
    reducedMotion: prefersReducedMotion,
    isPaused: !isGradientVisible,
  });

  return (
    <div
      className={cn(
        "min-h-screen relative overflow-hidden",
        isDark ? "bg-slate-950" : "bg-slate-50",
        className
      )}
      data-testid="landing-social-proof"
    >
      {/* Ambient Background */}
      <div
        ref={gradientRef}
        className="absolute inset-0 overflow-hidden pointer-events-none"
      >
        <div
          style={primaryGradient.style}
          className={cn(
            "absolute -top-1/4 -left-1/4 w-[80vw] h-[80vw] rounded-full blur-[120px]",
            isDark
              ? "bg-gradient-to-br from-indigo-900/20 via-purple-900/20 to-transparent"
              : "bg-gradient-to-br from-indigo-200/40 via-purple-200/30 to-transparent"
          )}
        />
        <div
          style={secondaryGradient.style}
          className={cn(
            "absolute top-1/3 -right-1/4 w-[70vw] h-[70vw] rounded-full blur-[120px]",
            isDark
              ? "bg-gradient-to-tl from-cyan-900/20 via-emerald-900/20 to-transparent"
              : "bg-gradient-to-tl from-cyan-200/30 via-emerald-200/20 to-transparent"
          )}
        />
      </div>

      {/* Hero Section */}
      <header className="relative z-10 pt-16 pb-12 px-6">
        <div className="container max-w-6xl mx-auto">
          {/* Badge */}
          <div
            className={cn(
              "text-center mb-6",
              !prefersReducedMotion && "animate-entrance-fade-up"
            )}
          >
            <span
              className={cn(
                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium",
                isDark
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "bg-indigo-100 text-indigo-700 border border-indigo-200"
              )}
              data-testid="social-proof-badge"
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
          </div>

          {/* Title */}
          <h1
            className={cn(
              "text-4xl md:text-6xl font-black tracking-tight text-center mb-4",
              isDark ? "text-white" : "text-slate-900",
              !prefersReducedMotion && "animate-entrance-fade-up animation-delay-100"
            )}
          >
            Watch Careers{" "}
            <span
              className={cn(
                "bg-clip-text text-transparent bg-gradient-to-r",
                isDark
                  ? "from-indigo-400 via-purple-400 to-cyan-400"
                  : "from-indigo-600 via-purple-600 to-cyan-600"
              )}
            >
              Transform
            </span>
          </h1>

          {/* Subtitle */}
          <p
            className={cn(
              "text-lg md:text-xl text-center max-w-2xl mx-auto mb-8",
              isDark ? "text-slate-400" : "text-slate-600",
              !prefersReducedMotion && "animate-entrance-fade-up animation-delay-200"
            )}
          >
            See real learning paths from people who started exactly where you are.
            From complete beginners to senior engineers, career switchers to tech leads.
          </p>

          {/* CTAs */}
          <div
            className={cn(
              "flex flex-wrap gap-4 justify-center",
              !prefersReducedMotion && "animate-entrance-fade-up animation-delay-300"
            )}
          >
            <Link href="/overview">
              <Button
                size="lg"
                variant="primary"
                dark={isDark}
                onMouseEnter={() => router.prefetch("/overview")}
                className="group"
                data-testid="start-your-journey-btn"
              >
                <Sparkles size={ICON_SIZES.md} />
                Start Your Journey
                <ArrowRight
                  size={ICON_SIZES.md}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Button>
            </Link>
            <Link href="/goal-path">
              <Button
                size="lg"
                variant="secondary"
                dark={isDark}
                onMouseEnter={() => router.prefetch("/goal-path")}
                data-testid="set-your-goal-btn"
              >
                <Target size={ICON_SIZES.md} />
                Set Your Goal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Visualization */}
      <main className="relative z-10 px-6 pb-16">
        <div className="container max-w-7xl mx-auto">
          <div
            className={cn(
              !prefersReducedMotion && "animate-entrance-fade-up animation-delay-400"
            )}
          >
            <SocialProofVisualization theme={theme} />
          </div>
        </div>
      </main>

      {/* Bottom CTA */}
      <footer
        className={cn(
          "relative z-10 py-12 px-6 border-t",
          isDark ? "border-white/10 bg-slate-900/50" : "border-slate-200 bg-white/50",
          !prefersReducedMotion && "animate-entrance-fade-up animation-delay-600"
        )}
      >
        <div className="container max-w-4xl mx-auto text-center">
          <h3
            className={cn(
              "text-2xl font-bold mb-4",
              isDark ? "text-white" : "text-slate-900"
            )}
          >
            Ready to Write Your Success Story?
          </h3>
          <p
            className={cn(
              "text-lg mb-6",
              isDark ? "text-slate-400" : "text-slate-600"
            )}
          >
            Join thousands of learners who have transformed their careers.
            Your path starts here.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/overview">
              <Button
                size="lg"
                variant="primary"
                dark={isDark}
                className="group text-lg"
                data-testid="begin-learning-btn"
              >
                <TrendingUp size={ICON_SIZES.lg} />
                Begin Your Learning Path
                <ArrowRight
                  size={ICON_SIZES.lg}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Button>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingSocialProof;
