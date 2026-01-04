"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, LogIn } from "lucide-react";
import type { LearningPath, GeneratedPath } from "../lib/types";
import type { OraclePath, PathNode } from "../lib/oracleApi";
import { OracleStepper } from "./OracleStepper";
import type { DomainId } from "../lib/oracleQuestions";
import { useForge } from "../../components/ForgeProvider";
import { SignInModal } from "../../components/SignInModal";

interface OracleProps {
    currentDomain: LearningPath | null;
    currentDepth: number;
    onPathSelected: (path: GeneratedPath) => void;
    onAcceptPath?: (path: OraclePath) => Promise<void>;
    onNavigateToNode?: (node: PathNode) => void;
}

// Map LearningPath type to DomainId
const DOMAIN_MAP: Record<LearningPath, DomainId> = {
    frontend: "frontend",
    backend: "backend",
    fullstack: "fullstack",
    mobile: "mobile",
    data: "data",
    devops: "devops",
    databases: "databases",
    games: "games",
};

export function Oracle({
    currentDomain,
    currentDepth,
    onPathSelected,
    onAcceptPath,
    onNavigateToNode
}: OracleProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [signInModalOpen, setSignInModalOpen] = useState(false);
    const { isAuthenticated } = useForge();

    const handleOpen = useCallback(() => {
        if (!currentDomain || !isAuthenticated) return;
        setIsOpen(true);
    }, [currentDomain, isAuthenticated]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
    }, []);

    const handleComplete = useCallback((pathId: string) => {
        // Convert to GeneratedPath format for compatibility
        const path: GeneratedPath = {
            id: pathId,
            name: "Selected Path",
            nodeIds: [],
            forgeNodeIds: [],
            duration: "TBD",
            color: "#6366f1",
        };
        onPathSelected(path);
    }, [onPathSelected]);

    const handleAcceptPath = useCallback(async (path: OraclePath) => {
        if (onAcceptPath) {
            await onAcceptPath(path);
        }
        // Close the Oracle after accepting
        setIsOpen(false);
    }, [onAcceptPath]);

    // Don't show if no domain selected
    if (!currentDomain) {
        return null;
    }

    const domainId = DOMAIN_MAP[currentDomain];

    return (
        <>
            {/* Floating trigger button */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed top-20 left-1/2 -translate-x-1/2 z-40"
            >
                {isAuthenticated ? (
                    <button
                        onClick={handleOpen}
                        className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[var(--forge-bg-daylight)]/95 backdrop-blur-xl border border-[var(--forge-border-subtle)] shadow-xl hover:shadow-2xl hover:border-[var(--ember)]/30 transition-all group"
                    >
                        <div className="p-1.5 rounded-lg bg-[var(--ember)]/10 group-hover:bg-[var(--ember)]/20 transition-colors">
                            <Sparkles className="w-4 h-4 text-[var(--ember)]" />
                        </div>
                        <span className="font-medium text-[var(--forge-text-secondary)] group-hover:text-[var(--forge-text-primary)] transition-colors">
                            Ask Oracle for guidance
                        </span>
                        <ChevronRight className="w-4 h-4 text-[var(--forge-text-muted)] group-hover:text-[var(--ember)] group-hover:translate-x-0.5 transition-all" />
                    </button>
                ) : (
                    <button
                        onClick={() => setSignInModalOpen(true)}
                        className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all group"
                    >
                        <LogIn className="w-4 h-4 text-[var(--oracle-text-on-ember)]" />
                        <span className="font-medium text-[var(--oracle-text-on-ember)]">
                            Sign in to use Oracle
                        </span>
                    </button>
                )}
            </motion.div>

            {/* Sign In Modal */}
            <SignInModal
                isOpen={signInModalOpen}
                onClose={() => setSignInModalOpen(false)}
                redirectPath="/forge/map"
            />

            {/* Full-screen Oracle Stepper Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Slide-in Panel */}
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 z-50 h-full w-full max-w-xl"
                        >
                            <div className="h-full bg-[var(--forge-bg-void)] border-l border-[var(--forge-border-subtle)] shadow-2xl">
                                <OracleStepper
                                    domain={domainId}
                                    onComplete={handleComplete}
                                    onAcceptPath={handleAcceptPath}
                                    onNavigateToNode={onNavigateToNode}
                                    onClose={handleClose}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
