"use client";

import { motion } from "framer-motion";

interface ForgeBackgroundProps {
    variant?: "dark" | "light";
}

export function ForgeBackground({ variant = "dark" }: ForgeBackgroundProps) {
    if (variant === "light") {
        return (
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[var(--forge-bg-daylight)]" />
                <motion.div
                    animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                    transition={{
                        rotate: { duration: 30, repeat: Infinity, ease: "linear" },
                        scale: { duration: 20, repeat: Infinity, ease: "easeInOut" },
                    }}
                    className="absolute -top-[50%] -left-[50%] w-[100vw] h-[100vw] bg-gradient-to-br from-[var(--ember)]/20 via-[var(--ember-glow)]/15 to-[var(--ember)]/20 rounded-full blur-[120px]"
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

            {/* Animated grid pattern - primary */}
            <motion.div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage: `
                        linear-gradient(var(--ember) 1px, transparent 1px),
                        linear-gradient(90deg, var(--ember) 1px, transparent 1px)
                    `,
                    backgroundSize: "80px 80px",
                }}
                animate={{ opacity: [0.04, 0.07, 0.04] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Secondary grid - slow drift */}
            <motion.div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `
                        linear-gradient(var(--gold) 1px, transparent 1px),
                        linear-gradient(90deg, var(--gold) 1px, transparent 1px)
                    `,
                    backgroundSize: "240px 240px",
                }}
                animate={{ backgroundPosition: ["0px 0px", "240px 240px"] }}
                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            />

            {/* Floating ember particles */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-[var(--ember)]"
                    style={{
                        left: `${15 + i * 15}%`,
                        top: `${20 + (i % 3) * 25}%`,
                        boxShadow: "0 0 8px var(--ember), 0 0 16px var(--gold)",
                    }}
                    animate={{
                        y: [-20, 20, -20],
                        opacity: [0.3, 0.6, 0.3],
                        scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                        duration: 4 + i,
                        delay: i * 0.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}

            {/* Vignette */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(0,0,0,0.5)_100%)]" />
        </div>
    );
}
