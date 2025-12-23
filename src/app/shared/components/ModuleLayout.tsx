"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home } from "lucide-react";
import Link from "next/link";
import { VariantTabs } from "./VariantTabs";
import { BackgroundAtmosphere } from "./BackgroundAtmosphere";
import { cn } from "../lib/utils";
import { ICON_SIZES } from "../lib/iconSizes";

interface ModuleLayoutProps {
    title: string;
    subtitle?: string;
    variants: {
        name: string;
        component: React.ReactNode;
    }[];
    atmosphereVariant?: "default" | "warm" | "cool" | "minimal";
}

export const ModuleLayout = ({
    title,
    subtitle,
    variants,
    atmosphereVariant = "default"
}: ModuleLayoutProps) => {
    const [activeVariant, setActiveVariant] = useState(0);

    return (
        <div className="min-h-screen bg-[var(--surface-base)] font-sans overflow-x-hidden">
            <BackgroundAtmosphere variant={atmosphereVariant} />

            <header className="sticky top-0 z-50 px-4 lg:px-8 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className={cn(
                                "p-2 rounded-xl transition-all",
                                "bg-[var(--surface-elevated)] backdrop-blur-md",
                                "border border-[var(--border-default)]",
                                "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                                "hover:bg-[var(--surface-overlay)]"
                            )}
                        >
                            <Home size={ICON_SIZES.md} />
                        </Link>
                        <div>
                            <h1 className="text-lg font-bold text-[var(--text-primary)]">{title}</h1>
                            {subtitle && (
                                <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>
                            )}
                        </div>
                    </div>

                    <VariantTabs
                        variants={variants.map(v => v.name)}
                        activeVariant={activeVariant}
                        onVariantChange={setActiveVariant}
                    />
                </div>
            </header>

            <main className="relative z-10 p-4 lg:p-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeVariant}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-7xl mx-auto"
                    >
                        {variants[activeVariant].component}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};
