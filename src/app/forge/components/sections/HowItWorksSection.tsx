"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STEPS } from "./how-it-works";

export function HowItWorksSection() {
    const [activeStep, setActiveStep] = useState(STEPS[0]);

    return (
        <section className="relative py-20">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--forge-bg-elevated)]/30 to-transparent" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10"
                >
                    <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
                    <p className="text-[var(--forge-text-secondary)] max-w-2xl mx-auto">
                        From goal to mastery - AI guides your entire learning journey.
                    </p>
                </motion.div>

                <div className="flex flex-col gap-6">
                    {/* Screenshot viewer + Description panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col lg:flex-row gap-4"
                    >
                        {/* Screenshot/GIF placeholder */}
                        <div className="flex-1 bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] overflow-hidden">
                            <div className="relative aspect-video">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeStep.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#0d0d0e] to-[#141416]"
                                    >
                                        <div className="text-center">
                                            <activeStep.icon size={48} className="mx-auto mb-4 text-[var(--ember)]/40" />
                                            <p className="text-sm text-[var(--forge-text-muted)]">{activeStep.placeholder}</p>
                                            <p className="text-xs text-[var(--forge-text-muted)]/60 mt-1">Screenshot/GIF placeholder</p>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Description panel */}
                        <div className="lg:w-80 bg-[var(--forge-bg-elevated)]/40 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] p-5">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeStep.id}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--ember)]/20">
                                            <activeStep.icon size={20} className="text-[var(--ember)]" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-white">{activeStep.title}</h3>
                                    </div>
                                    <p className="text-sm text-[var(--forge-text-secondary)] mb-5 leading-relaxed">
                                        {activeStep.description}
                                    </p>
                                    <div className="space-y-3">
                                        {activeStep.bullets.map((bullet, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, x: 10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.1 }}
                                                className="flex items-start gap-3"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--ember)] mt-2 flex-shrink-0" />
                                                <span className="text-sm text-[var(--forge-text-secondary)]">{bullet}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>

                    {/* Step buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-wrap justify-center gap-2"
                    >
                        {STEPS.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = activeStep.id === step.id;
                            return (
                                <button
                                    key={step.id}
                                    onClick={() => setActiveStep(step)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors ${
                                        isActive
                                            ? "bg-[var(--ember)]/10 border-[var(--ember)]/40 text-white"
                                            : "bg-[var(--forge-bg-elevated)]/40 border-transparent hover:bg-[var(--forge-bg-bench)] text-[var(--forge-text-secondary)]"
                                    }`}
                                >
                                    <span className="text-xs font-medium text-[var(--forge-text-muted)]">{index + 1}</span>
                                    <Icon size={18} className={isActive ? "text-[var(--ember)]" : ""} />
                                    <span className="text-sm font-medium">{step.title}</span>
                                </button>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
