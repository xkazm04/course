"use client";

import React from "react";
import { motion } from "framer-motion";
import { PrismaticCard } from "@/app/shared/components";
import { cn } from "@/app/shared/lib/utils";

interface VariantPlaceholderProps {
    variant: "knowledge-map";
    className?: string;
}

/**
 * Lightweight placeholder shown while heavy variants (Knowledge Map)
 * are being lazy-loaded. Displays a loading skeleton that matches the variant's layout.
 */
export const VariantPlaceholder: React.FC<VariantPlaceholderProps> = ({
    className,
}) => {

    return (
        <div className={cn("space-y-6", className)} data-testid="knowledge-map-placeholder">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
                <div>
                    <div className="h-9 w-48 bg-[var(--surface-inset)] rounded-lg animate-pulse mb-2" />
                    <div className="h-5 w-64 bg-[var(--surface-inset)] rounded-lg animate-pulse opacity-70" />
                </div>
                <div className="flex gap-2">
                    <div className="w-12 h-12 bg-[var(--surface-inset)] rounded-xl animate-pulse" />
                </div>
            </div>

            {/* Main Content Area */}
            <PrismaticCard>
                <div className="relative h-[600px] overflow-hidden flex items-center justify-center">
                    {/* Background Grid Skeleton */}
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{
                            backgroundSize: "40px 40px",
                            backgroundImage:
                                "linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.03) 1px, transparent 1px)",
                        }}
                    />

                    {/* Radial Gradient */}
                    <div className="absolute inset-0 bg-gradient-radial from-[var(--ember)]/10 via-transparent to-transparent" />

                    {/* Loading Animation */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative z-10 flex flex-col items-center gap-4"
                    >
                        {/* Orbital Loading Animation for Knowledge Map */}
                        <div className="relative w-32 h-32">
                            {/* Outer orbit */}
                            <motion.div
                                className="absolute inset-0 border-2 border-dashed border-[var(--border-strong)] rounded-full"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            />
                            {/* Middle orbit */}
                            <motion.div
                                className="absolute inset-4 border-2 border-dashed border-[var(--border-default)] rounded-full"
                                animate={{ rotate: -360 }}
                                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                            />
                            {/* Inner dot */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div
                                    className="w-4 h-4 bg-[var(--accent-primary)] rounded-full"
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                            </div>
                            {/* Orbiting dots */}
                            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-3 h-3 bg-[var(--surface-overlay)] border border-[var(--border-default)] rounded-full"
                                    style={{
                                        left: "50%",
                                        top: "50%",
                                        marginLeft: "-6px",
                                        marginTop: "-6px",
                                    }}
                                    animate={{
                                        x: Math.cos((angle * Math.PI) / 180 + Date.now() / 2000) * 48,
                                        y: Math.sin((angle * Math.PI) / 180 + Date.now() / 2000) * 48,
                                        opacity: [0.4, 1, 0.4],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: i * 0.2,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Loading Text */}
                        <div className="text-center">
                            <motion.p
                                className="text-sm font-medium text-[var(--forge-text-secondary)]"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                Loading Knowledge Map...
                            </motion.p>
                            <p className="text-xs text-[var(--forge-text-muted)] mt-1">
                                Preparing interactive visualization
                            </p>
                        </div>
                    </motion.div>

                    {/* Node Skeleton Positions */}
                    {[
                        { x: 50, y: 15 },
                        { x: 50, y: 50 },
                        { x: 50, y: 85 },
                        { x: 15, y: 70 },
                        { x: 20, y: 30 },
                        { x: 80, y: 30 },
                    ].map((pos, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-16 h-16 bg-[var(--surface-inset)]/30 rounded-full"
                            style={{
                                left: `${pos.x}%`,
                                top: `${pos.y}%`,
                                transform: "translate(-50%, -50%)",
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.1, 0.3, 0.1] }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.15,
                            }}
                        />
                    ))}
                </div>
            </PrismaticCard>

            {/* Info Panel Skeleton */}
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <PrismaticCard key={i}>
                        <div className="p-4 text-center">
                            <div className="h-8 w-12 mx-auto bg-[var(--surface-inset)] rounded-lg animate-pulse mb-2" />
                            <div className="h-4 w-24 mx-auto bg-[var(--surface-inset)] rounded-lg animate-pulse opacity-70" />
                        </div>
                    </PrismaticCard>
                ))}
            </div>
        </div>
    );
};

export default VariantPlaceholder;
