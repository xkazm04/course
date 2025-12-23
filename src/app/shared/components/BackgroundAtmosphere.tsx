"use client";

import React from "react";
import { motion } from "framer-motion";

interface BackgroundAtmosphereProps {
    variant?: "default" | "warm" | "cool" | "minimal";
    showGridFloor?: boolean;
    showNoise?: boolean;
}

export const BackgroundAtmosphere = ({
    variant = "default",
    showGridFloor = false,
    showNoise = false,
}: BackgroundAtmosphereProps) => {
    // Gradient configurations for each variant
    // Light mode uses -200/30 colors, dark mode uses -900/30 colors
    const gradients = {
        default: {
            primary: "from-indigo-200/30 via-purple-200/30 to-blue-200/30 dark:from-indigo-900/30 dark:via-purple-900/30 dark:to-blue-900/30",
            secondary: "from-cyan-200/30 via-pink-200/30 to-indigo-200/30 dark:from-cyan-900/30 dark:via-pink-900/30 dark:to-indigo-900/30",
        },
        warm: {
            primary: "from-orange-200/30 via-amber-200/30 to-yellow-200/30 dark:from-orange-900/30 dark:via-amber-900/30 dark:to-yellow-900/30",
            secondary: "from-rose-200/30 via-pink-200/30 to-red-200/30 dark:from-rose-900/30 dark:via-pink-900/30 dark:to-red-900/30",
        },
        cool: {
            primary: "from-blue-200/30 via-cyan-200/30 to-teal-200/30 dark:from-blue-900/30 dark:via-cyan-900/30 dark:to-teal-900/30",
            secondary: "from-indigo-200/30 via-violet-200/30 to-purple-200/30 dark:from-indigo-900/30 dark:via-violet-900/30 dark:to-purple-900/30",
        },
        minimal: {
            primary: "from-slate-200/20 via-gray-200/20 to-zinc-200/20 dark:from-slate-900/20 dark:via-gray-900/20 dark:to-zinc-900/20",
            secondary: "from-slate-200/20 via-gray-200/20 to-zinc-200/20 dark:from-slate-900/20 dark:via-gray-900/20 dark:to-zinc-900/20",
        },
    };

    const { primary, secondary } = gradients[variant];

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {/* Primary gradient orb - top right */}
            <motion.div
                animate={{
                    rotate: 360,
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    rotate: { duration: 30, repeat: Infinity, ease: "linear" },
                    scale: { duration: 20, repeat: Infinity, ease: "easeInOut" },
                }}
                className={`absolute -top-[50%] -left-[50%] w-[100vw] h-[100vw] bg-gradient-to-br ${primary} rounded-full blur-[120px]`}
            />

            {/* Secondary gradient orb - bottom left */}
            <motion.div
                animate={{
                    rotate: -360,
                    scale: [1, 1.3, 1],
                }}
                transition={{
                    rotate: { duration: 40, repeat: Infinity, ease: "linear" },
                    scale: { duration: 25, repeat: Infinity, ease: "easeInOut" },
                }}
                className={`absolute top-[20%] right-[-20%] w-[80vw] h-[80vw] bg-gradient-to-tl ${secondary} rounded-full blur-[120px]`}
            />

            {/* 3D Grid Floor - Perspective effect at bottom */}
            {showGridFloor && (
                <div
                    className="absolute bottom-0 left-0 w-full h-[50vh] bg-gradient-to-t from-slate-200/50 dark:from-slate-800/30 to-transparent"
                    style={{
                        transform: "perspective(1000px) rotateX(60deg)",
                        transformOrigin: "bottom center",
                        backgroundSize: "var(--grid-size) var(--grid-size)",
                        backgroundImage: `
                            linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
                            linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)
                        `,
                    }}
                />
            )}

            {/* Noise texture overlay */}
            {showNoise && (
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{
                        backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')",
                    }}
                />
            )}
        </div>
    );
};
