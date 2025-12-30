"use client";

import { motion, AnimatePresence } from "framer-motion";

interface LayerTransitionProps {
    isTransitioning: boolean;
    direction: "in" | "out";
}

export function LayerTransition({ isTransitioning, direction }: LayerTransitionProps) {
    return (
        <AnimatePresence>
            {isTransitioning && (
                <motion.div
                    initial={{
                        opacity: 0,
                        scale: direction === "in" ? 0.8 : 1.2,
                    }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                    }}
                    exit={{
                        opacity: 0,
                        scale: direction === "in" ? 1.2 : 0.8,
                    }}
                    transition={{
                        duration: 0.3,
                        ease: [0.23, 1, 0.32, 1],
                    }}
                    className="fixed inset-0 z-50 pointer-events-none"
                >
                    {/* Radial gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--ember)]/20 via-transparent to-[var(--ember-glow)]/20" />

                    {/* Pulsing rings */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        {[1, 2, 3].map(i => (
                            <motion.div
                                key={i}
                                initial={{ scale: 0, opacity: 0.5 }}
                                animate={{ scale: 2 + i, opacity: 0 }}
                                transition={{
                                    duration: 0.6,
                                    delay: i * 0.1,
                                    ease: "easeOut",
                                }}
                                className="absolute w-32 h-32 rounded-full border-2 border-[var(--ember)]/30"
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
