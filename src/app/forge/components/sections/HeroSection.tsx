"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useForge } from "../../layout";
import { ForgeGlowButton } from "../ForgeGlowButton";

const STATS = [
    { value: "AI-Powered", label: "Course Generation" },
    { value: "500+", label: "Learning Paths" },
    { value: "2,400+", label: "Learners" },
    { value: "Real-Time", label: "Adaptation" },
];

export function HeroSection() {
    const { isNewUser } = useForge();

    return (
        <section className="relative pt-24 sm:pt-32 pb-16">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center max-w-4xl mx-auto">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--ember)]/10 border border-[var(--ember)]/20 mb-6"
                    >
                        <Sparkles size={16} className="text-[var(--gold)]" />
                        <span className="text-sm text-[var(--forge-text-secondary)]">
                            AI-Generated Learning Paths
                        </span>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
                    >
                        Learn Anything with{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--ember)] via-[var(--gold)] to-[var(--ember-glow)]">
                            Dynamic Courses
                        </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg sm:text-xl text-[var(--forge-text-secondary)] mb-10 max-w-2xl mx-auto"
                    >
                        Our AI generates personalized learning courses in real-time,
                        adapting to your skill level and goals. From coding to design,
                        master any skill with project-based learning.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12"
                    >
                        <ForgeGlowButton href={isNewUser ? "/forge/onboarding" : "/forge/dashboard"}>
                            {isNewUser ? "Start Learning" : "Continue Learning"}
                        </ForgeGlowButton>
                        <Link
                            href="/forge/projects"
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm border border-[var(--forge-border-subtle)] text-[var(--forge-text-primary)] font-medium hover:border-[var(--ember)]/30 transition-all"
                        >
                            Explore Courses
                        </Link>
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-[var(--forge-border-subtle)]"
                    >
                        {STATS.map((stat) => (
                            <div key={stat.label} className="text-center">
                                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-[var(--forge-text-secondary)]">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-[var(--forge-text-muted)]">{stat.label}</div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
