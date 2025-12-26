"use client";

import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn, elevation, type ElevationLevel } from "../lib/utils";

export type ElevationType = ElevationLevel;

interface PrismaticCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: "indigo" | "purple" | "cyan" | "emerald" | "orange";
    intensity?: "low" | "medium" | "high";
    cardElevation?: ElevationType;
    /**
     * When true, disables 3D spring animations and uses CSS-only hover effects.
     * Use this for list contexts where many cards are rendered to avoid
     * useSpring overhead (20 motion value subscriptions for 10 cards).
     */
    static?: boolean;
    "data-testid"?: string;
}

const glowColors = {
    indigo: "from-indigo-500/20 to-purple-500/0 dark:from-indigo-400/30 dark:to-purple-400/0",
    purple: "from-purple-500/20 to-pink-500/0 dark:from-purple-400/30 dark:to-pink-400/0",
    cyan: "from-cyan-500/20 to-blue-500/0 dark:from-cyan-400/30 dark:to-blue-400/0",
    emerald: "from-emerald-500/20 to-teal-500/0 dark:from-emerald-400/30 dark:to-teal-400/0",
    orange: "from-orange-500/20 to-red-500/0 dark:from-orange-400/30 dark:to-red-400/0",
};

const intensityMap = {
    low: { rotation: 3, parallax: 5 },
    medium: { rotation: 8, parallax: 10 },
    high: { rotation: 15, parallax: 15 },
};

/**
 * StaticPrismaticCard - CSS-only version without spring overhead.
 * Uses CSS transforms triggered by hover for list contexts.
 */
const StaticPrismaticCard: React.FC<Omit<PrismaticCardProps, "static">> = ({
    children,
    className,
    glowColor = "indigo",
    cardElevation = "hoverable",
    "data-testid": testId
}) => {
    return (
        <div
            className={cn(
                "relative group",
                // CSS-based 3D hover effect without JS spring overhead
                "transition-transform duration-300 ease-out",
                "hover:scale-[1.01]",
                className
            )}
            style={{
                transformStyle: "preserve-3d",
                perspective: "2000px",
                willChange: "transform"
            }}
            data-testid={testId}
        >
            {/* Holographic glow effect */}
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-to-br rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                    glowColors[glowColor]
                )}
                style={{ transform: "translateZ(-20px)" }}
            />

            {/* Main card surface */}
            <div
                className={cn(
                    "relative w-full h-full rounded-3xl overflow-hidden",
                    "bg-[var(--surface-elevated)] backdrop-blur-xl",
                    "border border-[var(--border-default)]",
                    elevation[cardElevation]
                )}
                style={{ transform: "translateZ(20px)" }}
            >
                {/* Noise texture overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
                />

                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-slate-700/40 to-transparent pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col">
                    {children}
                </div>
            </div>
        </div>
    );
};

/**
 * AnimatedPrismaticCard - Full spring-based 3D animation for hero cards.
 * Uses useSpring for smooth mouse-tracking rotation effects.
 */
const AnimatedPrismaticCard: React.FC<Omit<PrismaticCardProps, "static">> = ({
    children,
    className,
    glowColor = "indigo",
    intensity = "medium",
    cardElevation = "hoverable",
    "data-testid": testId
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

    const { rotation } = intensityMap[intensity];
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${rotation}deg`, `-${rotation}deg`]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`-${rotation}deg`, `${rotation}deg`]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ rotateY, rotateX, transformStyle: "preserve-3d" }}
            className={cn("relative group perspective-[2000px]", className)}
            data-testid={testId}
        >
            {/* Holographic glow effect */}
            <div
                style={{ transform: "translateZ(-20px)" }}
                className={cn(
                    "absolute inset-0 bg-gradient-to-br rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                    glowColors[glowColor]
                )}
            />

            {/* Main card surface */}
            <div
                style={{ transform: "translateZ(20px)" }}
                className={cn(
                    "relative w-full h-full rounded-3xl overflow-hidden",
                    "bg-[var(--surface-elevated)] backdrop-blur-xl",
                    "border border-[var(--border-default)]",
                    elevation[cardElevation]
                )}
            >
                {/* Noise texture overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
                />

                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-slate-700/40 to-transparent pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col">
                    {children}
                </div>
            </div>
        </motion.div>
    );
};

export const PrismaticCard: React.FC<PrismaticCardProps> = ({
    static: isStatic = false,
    ...props
}) => {
    // Use static CSS-only version for list contexts to avoid spring overhead
    if (isStatic) {
        return <StaticPrismaticCard {...props} />;
    }

    // Use full animated version for hero/feature cards
    return <AnimatedPrismaticCard {...props} />;
};
