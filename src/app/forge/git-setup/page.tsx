"use client";

import React, { useState, Suspense, lazy } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    GitBranch,
    Check,
    ChevronRight,
    ArrowLeft,
    Download,
    Settings,
    Key,
    FolderGit,
    GitPullRequest,
    Loader2,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { Skeleton } from "../components/LazySection";
import { forgeEasing, staggerDelay } from "../lib/animations";

// ============================================================================
// Lazy load step components for better initial load
// ============================================================================

const InstallGitStep = lazy(() => import("./components/steps/InstallGitStep"));
const ConfigureGitStep = lazy(() => import("./components/steps/ConfigureGitStep"));
const SSHKeyStep = lazy(() => import("./components/steps/SSHKeyStep"));
const GitHubSSHStep = lazy(() => import("./components/steps/GitHubSSHStep"));
const ForkAndCloneStep = lazy(() => import("./components/steps/ForkAndCloneStep"));
const CreatePRStep = lazy(() => import("./components/steps/CreatePRStep"));

// ============================================================================
// Types
// ============================================================================

interface Step {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    Component: React.LazyExoticComponent<React.ComponentType>;
}

// ============================================================================
// Step Fallback
// ============================================================================

function StepSkeleton() {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-[var(--ember)]" />
        </div>
    );
}

// ============================================================================
// Steps Configuration
// ============================================================================

const steps: Step[] = [
    {
        id: "install",
        title: "Install Git",
        description: "Get Git installed on your computer",
        icon: Download,
        Component: InstallGitStep,
    },
    {
        id: "configure",
        title: "Configure Git",
        description: "Set up your identity",
        icon: Settings,
        Component: ConfigureGitStep,
    },
    {
        id: "ssh-key",
        title: "Generate SSH Key",
        description: "Create a secure SSH key",
        icon: Key,
        Component: SSHKeyStep,
    },
    {
        id: "github-ssh",
        title: "Add SSH Key to GitHub",
        description: "Connect your key to your account",
        icon: GitBranch,
        Component: GitHubSSHStep,
    },
    {
        id: "fork-clone",
        title: "Fork & Clone",
        description: "Get the project on your machine",
        icon: FolderGit,
        Component: ForkAndCloneStep,
    },
    {
        id: "create-pr",
        title: "Create Pull Request",
        description: "Submit your homework",
        icon: GitPullRequest,
        Component: CreatePRStep,
    },
];

// ============================================================================
// Sidebar Navigation
// ============================================================================

function StepNavigation({
    activeStep,
    onStepChange,
}: {
    activeStep: number;
    onStepChange: (index: number) => void;
}) {
    return (
        <nav className="sticky top-8 space-y-2">
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ease: forgeEasing }}
                className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] p-2 shadow-sm"
            >
                {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = activeStep === index;
                    const isCompleted = index < activeStep;

                    return (
                        <motion.button
                            key={step.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: staggerDelay(index, 0.05), ease: forgeEasing }}
                            onClick={() => onStepChange(index)}
                            className={cn(
                                "relative w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                                isActive
                                    ? "text-[var(--ember)]"
                                    : "hover:bg-[var(--forge-bg-elevated)]/50 text-[var(--forge-text-secondary)]"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="step-indicator"
                                    className="absolute inset-0 bg-[var(--ember)]/10 rounded-lg border border-[var(--ember)]/30"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <div
                                className={cn(
                                    "relative w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                                    isActive
                                        ? "bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] text-white shadow-lg shadow-[var(--ember)]/30"
                                        : isCompleted
                                          ? "bg-[var(--forge-success)] text-white"
                                          : "bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)]"
                                )}
                            >
                                {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                            </div>
                            <div className="relative min-w-0 flex-1">
                                <p className={cn(
                                    "font-medium truncate text-sm",
                                    isActive ? "text-[var(--forge-text-primary)]" : ""
                                )}>
                                    {step.title}
                                </p>
                                <p className="text-xs text-[var(--forge-text-muted)] truncate">
                                    {step.description}
                                </p>
                            </div>
                        </motion.button>
                    );
                })}
            </motion.div>

            {/* Progress indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, ease: forgeEasing }}
                className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] p-3 shadow-sm"
            >
                <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-[var(--forge-text-muted)]">Progress</span>
                    <span className="text-[var(--ember)] font-medium">
                        {activeStep + 1} / {steps.length}
                    </span>
                </div>
                <div className="h-1.5 bg-[var(--forge-bg-elevated)] rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                        transition={{ duration: 0.5, ease: forgeEasing }}
                    />
                </div>
            </motion.div>
        </nav>
    );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function GitSetupPage() {
    const [activeStep, setActiveStep] = useState(0);
    const currentStep = steps[activeStep];
    const StepComponent = currentStep.Component;

    return (
        <div className="min-h-screen">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ease: forgeEasing }}
                className="border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl"
            >
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1, ease: forgeEasing }}
                    >
                        <Link
                            href="/forge"
                            className="inline-flex items-center gap-2 text-sm text-[var(--forge-text-muted)] hover:text-[var(--ember)] transition-colors mb-4"
                        >
                            <ArrowLeft size={16} />
                            Back to Forge
                        </Link>
                    </motion.div>
                    <div className="flex items-center gap-4">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.15, ease: forgeEasing }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--ember)] to-[var(--gold)] rounded-xl blur-md opacity-50" />
                            <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--ember)] to-[var(--gold)] flex items-center justify-center shadow-lg">
                                <GitBranch size={28} className="text-white" />
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, ease: forgeEasing }}
                        >
                            <h1 className="text-2xl font-bold text-[var(--forge-text-primary)]">
                                Git Setup Guide
                            </h1>
                            <p className="text-[var(--forge-text-secondary)]">
                                Set up Git and GitHub to start contributing to projects
                            </p>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <div className="flex gap-6 lg:gap-8">
                    {/* Sidebar Navigation */}
                    <div className="hidden md:block w-64 flex-shrink-0">
                        <StepNavigation activeStep={activeStep} onStepChange={setActiveStep} />
                    </div>

                    {/* Mobile Step Indicator */}
                    <div className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-[var(--forge-bg-daylight)]/95 backdrop-blur-xl border-t border-[var(--forge-border-subtle)] p-4">
                        <div className="flex items-center justify-between gap-4">
                            <button
                                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                                disabled={activeStep === 0}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
                                    activeStep === 0
                                        ? "text-[var(--forge-text-muted)] cursor-not-allowed"
                                        : "text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-elevated)]"
                                )}
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <div className="flex-1 text-center">
                                <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                                    {currentStep.title}
                                </span>
                                <span className="text-xs text-[var(--forge-text-muted)] ml-2">
                                    ({activeStep + 1}/{steps.length})
                                </span>
                            </div>
                            {activeStep < steps.length - 1 ? (
                                <button
                                    onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white font-medium"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            ) : (
                                <Link
                                    href="/forge/dashboard"
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white font-medium"
                                >
                                    Done
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0 pb-24 md:pb-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeStep}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, ease: forgeEasing }}
                                className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-lg overflow-hidden"
                            >
                                {/* Step Header */}
                                <div className="flex items-center gap-3 p-5 border-b border-[var(--forge-border-subtle)]">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] flex items-center justify-center shadow-md">
                                        {React.createElement(currentStep.icon, {
                                            size: 20,
                                            className: "text-white",
                                        })}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[var(--forge-text-primary)]">
                                            {currentStep.title}
                                        </h2>
                                        <p className="text-sm text-[var(--forge-text-muted)]">
                                            Step {activeStep + 1} of {steps.length}
                                        </p>
                                    </div>
                                </div>

                                {/* Step Content */}
                                <div className="p-5">
                                    <Suspense fallback={<StepSkeleton />}>
                                        <StepComponent />
                                    </Suspense>
                                </div>

                                {/* Desktop Navigation buttons */}
                                <div className="hidden md:flex items-center justify-between p-5 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/30">
                                    <button
                                        onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                                        disabled={activeStep === 0}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all",
                                            activeStep === 0
                                                ? "text-[var(--forge-text-muted)] cursor-not-allowed"
                                                : "text-[var(--forge-text-secondary)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-elevated)]"
                                        )}
                                    >
                                        <ArrowLeft size={16} />
                                        Previous
                                    </button>

                                    {activeStep < steps.length - 1 ? (
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                                            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white font-medium shadow-lg shadow-[var(--ember)]/20 hover:shadow-xl hover:shadow-[var(--ember)]/30 transition-shadow"
                                        >
                                            Next Step
                                            <ChevronRight size={16} />
                                        </motion.button>
                                    ) : (
                                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                            <Link
                                                href="/forge/dashboard"
                                                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-[var(--forge-success)] to-emerald-500 text-white font-medium shadow-lg shadow-[var(--forge-success)]/20 hover:shadow-xl hover:shadow-[var(--forge-success)]/30 transition-shadow"
                                            >
                                                Start Learning
                                                <ChevronRight size={16} />
                                            </Link>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
