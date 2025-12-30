"use client";

import { motion } from "framer-motion";
import { useForge } from "../../layout";
import { ForgeGlowButton } from "../ForgeGlowButton";

export function CTASection() {
    const { isNewUser } = useForge();

    return (
        <section className="relative py-24">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--ember)_0%,_transparent_60%)] opacity-10" />

            <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                        Ready to Start Learning?
                    </h2>
                    <p className="text-lg text-[var(--forge-text-secondary)] mb-10">
                        Tell us your goal and our AI will generate a personalized course just for you.
                    </p>

                    <ForgeGlowButton
                        href={isNewUser ? "/forge/onboarding" : "/forge/challenges"}
                        icon="sparkles"
                    >
                        {isNewUser ? "Generate My Course" : "Continue Learning"}
                    </ForgeGlowButton>
                </motion.div>
            </div>
        </section>
    );
}
