"use client";

import { useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ForgeBackground,
    HeroSection,
    HowItWorksSection,
    LearningPathSection,
    CTASection,
    Skeleton,
} from "./forge/components";
import { ForgeTabs, type ForgeTabId } from "./forge/components/ForgeTabs";
import { ForgeProvider } from "./forge/components/ForgeProvider";

// Lazy load heavy sections that are below the fold
const KnowledgeUniverseSection = lazy(() =>
    import("./forge/components/sections/KnowledgeUniverseSection").then((m) => ({
        default: m.KnowledgeUniverseSection,
    }))
);

// Skeleton for the Knowledge Universe section
function UniverseSkeleton() {
    return (
        <section className="relative py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-10">
                    <Skeleton className="h-8 w-40 mx-auto mb-4 rounded-full" />
                    <Skeleton className="h-10 w-96 mx-auto mb-4" />
                    <Skeleton className="h-6 w-[32rem] mx-auto" />
                </div>
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                        <Skeleton className="h-[625px] rounded-2xl" />
                    </div>
                    <div className="lg:w-72 flex flex-col gap-4">
                        <Skeleton className="h-32 rounded-xl" />
                        <Skeleton className="h-[300px] rounded-xl" />
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function HomePage() {
    const [activeTab, setActiveTab] = useState<ForgeTabId>("home");

    return (
        <ForgeProvider redirectPath="/">
            <div className="relative min-h-screen">
                <ForgeBackground variant="dark" />
                <div className="relative z-10">
                    <ForgeTabs activeTab={activeTab} onTabChange={setActiveTab} />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key="home"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <HeroSection />
                            <HowItWorksSection />
                            <LearningPathSection />
                            <Suspense fallback={<UniverseSkeleton />}>
                                <KnowledgeUniverseSection />
                            </Suspense>
                            <CTASection />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </ForgeProvider>
    );
}
