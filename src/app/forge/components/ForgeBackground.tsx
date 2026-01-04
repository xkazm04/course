"use client";

import { memo } from "react";

interface ForgeBackgroundProps {
    variant?: "dark" | "light";
    showNoise?: boolean;
}

/**
 * Optimized Forge Background
 * Uses CSS animations instead of Framer Motion for better performance
 * Reduced particle count for lower resource consumption
 */
export const ForgeBackground = memo(function ForgeBackground({
    variant = "dark",
    showNoise = false,
}: ForgeBackgroundProps) {
    if (variant === "light") {
        return (
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[var(--forge-bg-daylight)]" />
                <div
                    className="absolute -top-[50%] -left-[50%] w-[100vw] h-[100vw] bg-gradient-to-br from-[var(--ember)]/20 via-[var(--ember-glow)]/15 to-[var(--ember)]/20 rounded-full blur-[120px] animate-forge-glow"
                    style={{ willChange: "transform" }}
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {/* Base dark gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b] via-[#0f0f10] to-[#0a0a0b]" />

            {/* Subtle radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--ember)_0%,_transparent_50%)] opacity-5" />

            {/* Animated grid pattern - using CSS animation */}
            <div
                className="absolute inset-0 opacity-[0.05] animate-forge-grid-pulse"
                style={{
                    backgroundImage: `
                        linear-gradient(var(--ember) 1px, transparent 1px),
                        linear-gradient(90deg, var(--ember) 1px, transparent 1px)
                    `,
                    backgroundSize: "80px 80px",
                    willChange: "opacity",
                }}
            />

            {/* Secondary grid - slow drift with CSS animation */}
            <div
                className="absolute inset-0 opacity-[0.03] animate-forge-grid-drift"
                style={{
                    backgroundImage: `
                        linear-gradient(var(--gold) 1px, transparent 1px),
                        linear-gradient(90deg, var(--gold) 1px, transparent 1px)
                    `,
                    backgroundSize: "240px 240px",
                    willChange: "background-position",
                }}
            />

            {/* Reduced ember particles (3 instead of 6) - using CSS animations */}
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-[var(--ember)] animate-forge-ember"
                    style={{
                        left: `${20 + i * 30}%`,
                        top: `${25 + (i % 2) * 30}%`,
                        boxShadow: "0 0 8px var(--ember), 0 0 16px var(--gold)",
                        animationDelay: `${i * 0.8}s`,
                        animationDuration: `${4 + i}s`,
                        willChange: "transform, opacity",
                    }}
                />
            ))}

            {/* Optional noise texture */}
            {showNoise && (
                <div
                    className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }}
                />
            )}

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.5)_100%)]" />
        </div>
    );
});
