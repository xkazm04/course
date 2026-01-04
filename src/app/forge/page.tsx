"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MyProgressView } from "./components/MyProgressView";
import {
    ForgeTabs,
    ForgeTabId,
    HeroSection,
    HowItWorksSection,
    LearningPathSection,
    CTASection,
    CommunityPathsView,
} from "./components";

export default function ForgePage() {
    const [activeTab, setActiveTab] = useState<ForgeTabId>("home");

    return (
        <div className="relative min-h-screen">
            {/* Tab Navigation */}
            <ForgeTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                {activeTab === "home" && (
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
                        <CTASection />
                    </motion.div>
                )}

                {activeTab === "progress" && (
                    <motion.div
                        key="progress"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <MyProgressView />
                    </motion.div>
                )}

                {activeTab === "community" && (
                    <motion.div
                        key="community"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <CommunityPathsView />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
