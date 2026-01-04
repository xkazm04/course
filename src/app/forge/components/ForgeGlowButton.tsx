"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Sparkles } from "lucide-react";

// Seeded pseudo-random number generator for deterministic values
function seededRandom(seed: number): number {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
}

function ButtonSparkle({ delay, index }: { delay: number; index: number }) {
    // Use seeded random values based on index for deterministic server/client rendering
    const randomDuration = useMemo(() => 1.2 + seededRandom(index * 4 + 1) * 1.2, [index]);
    const randomSize = useMemo(() => 2 + seededRandom(index * 4 + 2) * 3, [index]);
    const startX = useMemo(() => (index % 2 === 0 ? -1 : 1) * (10 + seededRandom(index * 4 + 3) * 30), [index]);
    const endX = useMemo(() => startX + (seededRandom(index * 4 + 4) - 0.5) * 40, [index, startX]);
    const endY = useMemo(() => -50 - seededRandom(index * 4 + 5) * 30, [index]);

    return (
        <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
                width: randomSize,
                height: randomSize,
                background: `radial-gradient(circle, var(--gold) 0%, var(--ember) 60%, transparent 100%)`,
                boxShadow: `0 0 ${randomSize * 2}px var(--ember), 0 0 ${randomSize * 3}px var(--gold)`,
                left: "50%",
                bottom: "100%",
            }}
            initial={{ opacity: 0, y: 20, x: startX, scale: 0 }}
            animate={{
                opacity: [0, 1, 1, 0],
                y: endY,
                x: endX,
                scale: [0, 1.2, 0.6, 0],
            }}
            transition={{
                duration: randomDuration,
                delay: delay,
                repeat: Infinity,
                ease: "easeOut",
            }}
        />
    );
}

interface ForgeGlowButtonProps {
    href: string;
    children: React.ReactNode;
    icon?: "flame" | "sparkles";
}

export function ForgeGlowButton({ href, children, icon = "flame" }: ForgeGlowButtonProps) {
    const sparkles = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);
    const [isHovered, setIsHovered] = useState(false);
    const Icon = icon === "flame" ? Flame : Sparkles;

    return (
        <Link href={href} className="relative inline-block group">
            {/* Lava glow underneath */}
            <motion.div
                className="absolute -inset-3 rounded-2xl blur-xl pointer-events-none"
                style={{
                    background: "radial-gradient(ellipse at center, var(--ember) 0%, var(--gold) 50%, transparent 80%)",
                }}
                animate={{
                    opacity: isHovered ? [0.5, 0.7, 0.5] : [0.25, 0.4, 0.25],
                    scale: isHovered ? [1, 1.08, 1] : [1, 1.03, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Outer glow ring */}
            <motion.div
                className="absolute -inset-[2px] rounded-xl pointer-events-none"
                style={{
                    background: "linear-gradient(135deg, var(--gold) 0%, var(--ember) 50%, var(--ember-glow) 100%)",
                }}
                animate={{
                    opacity: isHovered ? [0.7, 0.9, 0.7] : [0.4, 0.6, 0.4],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* Button */}
            <motion.div
                className="relative overflow-visible"
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
            >
                <div className="relative px-8 py-4 rounded-xl bg-gradient-to-r from-[#1a1a1a] via-[#252525] to-[#1a1a1a] border border-[var(--ember)]/30">
                    {/* Inner glow on top */}
                    <motion.div
                        className="absolute inset-x-0 top-0 h-[2px] rounded-t-xl"
                        style={{
                            background: "linear-gradient(90deg, transparent, var(--gold), var(--ember), var(--gold), transparent)",
                        }}
                        animate={{
                            opacity: isHovered ? [0.6, 1, 0.6] : [0.3, 0.5, 0.3],
                        }}
                        transition={{ duration: 1, repeat: Infinity }}
                    />

                    {/* Button content */}
                    <span className="relative z-10 flex items-center gap-3 text-white font-semibold text-lg">
                        <Icon size={20} className="text-[var(--gold)]" />
                        {children}
                        <motion.span animate={{ x: isHovered ? 4 : 0 }} transition={{ duration: 0.2 }}>
                            <ArrowRight size={18} />
                        </motion.span>
                    </span>
                </div>

                {/* Sparkles rising from button */}
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                    {sparkles.map((_, i) => (
                        <ButtonSparkle key={i} delay={i * 0.25} index={i} />
                    ))}
                </div>
            </motion.div>
        </Link>
    );
}
