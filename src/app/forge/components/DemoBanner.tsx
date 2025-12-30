"use client";

import { motion } from "framer-motion";

interface DemoBannerProps {
    className?: string;
}

export function DemoBanner({ className }: DemoBannerProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`inline-flex items-center gap-1.5 ${className}`}
        >
            <span
                className="
                    relative px-3 py-1 rounded-md
                    bg-[var(--forge-error)]/10 dark:bg-[var(--forge-error)]/20
                    border border-[var(--forge-error)]/30 dark:border-[var(--forge-error)]/40
                    text-[var(--forge-error)]
                    text-xs font-black tracking-[0.2em] uppercase
                    shadow-sm shadow-[var(--forge-error)]/10
                "
            >
                {/* Animated pulse effect */}
                <span className="absolute inset-0 rounded-md bg-[var(--forge-error)]/5 animate-pulse" />
                <span className="relative">DEMO</span>
            </span>
            <span className="text-xs text-[var(--forge-text-muted)] font-medium hidden sm:inline">
                Sample data
            </span>
        </motion.div>
    );
}
