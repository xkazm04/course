"use client";

import React, { useState, Suspense, lazy } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { Skeleton } from "../components/LazySection";

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
    icon: React.ElementType;
    Component: React.LazyExoticComponent<React.ComponentType>;
}

// ============================================================================
// Step Fallback
// ============================================================================

function StepSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-10 w-64 rounded-lg" />
            <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-24 w-full rounded-lg" />
            </div>
            <Skeleton className="h-32 w-full rounded-lg" />
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
        <nav className="sticky top-8 space-y-1">
            {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === index;
                const isCompleted = index < activeStep;

                return (
                    <button
                        key={step.id}
                        onClick={() => onStepChange(index)}
                        className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                            isActive
                                ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                                : "hover:bg-[var(--surface-elevated)] text-[var(--text-secondary)]"
                        )}
                    >
                        <div
                            className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                isActive
                                    ? "bg-[var(--accent-primary)] text-white"
                                    : isCompleted
                                      ? "bg-[var(--forge-success)] text-white"
                                      : "bg-[var(--surface-overlay)]"
                            )}
                        >
                            {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                        </div>
                        <div className="min-w-0">
                            <p className={cn("font-medium truncate", isActive && "text-[var(--text-primary)]")}>
                                {step.title}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] truncate">
                                {step.description}
                            </p>
                        </div>
                    </button>
                );
            })}
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
        <div className="min-h-screen bg-[var(--surface-base)]">
            {/* Header */}
            <div className="border-b border-[var(--border-default)] bg-[var(--surface-elevated)]">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-4"
                    >
                        <ArrowLeft size={16} />
                        Back to Forge
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                            <GitBranch size={28} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                                Git Setup Guide
                            </h1>
                            <p className="text-[var(--text-secondary)]">
                                Set up Git and GitHub to start contributing to projects
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="flex gap-8">
                    {/* Sidebar Navigation */}
                    <div className="w-64 flex-shrink-0">
                        <StepNavigation activeStep={activeStep} onStepChange={setActiveStep} />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-[var(--surface-elevated)] rounded-xl border border-[var(--border-default)] p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center">
                                    {React.createElement(currentStep.icon, {
                                        size: 20,
                                        className: "text-white",
                                    })}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                                        {currentStep.title}
                                    </h2>
                                    <p className="text-sm text-[var(--text-muted)]">
                                        Step {activeStep + 1} of {steps.length}
                                    </p>
                                </div>
                            </div>

                            {/* Lazy loaded step content */}
                            <Suspense fallback={<StepSkeleton />}>
                                <StepComponent />
                            </Suspense>

                            {/* Navigation buttons */}
                            <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--border-default)]">
                                <button
                                    onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                                    disabled={activeStep === 0}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
                                        activeStep === 0
                                            ? "text-[var(--text-muted)] cursor-not-allowed"
                                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-overlay)]"
                                    )}
                                >
                                    <ArrowLeft size={16} />
                                    Previous
                                </button>

                                {activeStep < steps.length - 1 ? (
                                    <button
                                        onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:opacity-90 transition-opacity"
                                    >
                                        Next Step
                                        <ChevronRight size={16} />
                                    </button>
                                ) : (
                                    <Link
                                        href="/forge/dashboard"
                                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium hover:opacity-90 transition-opacity"
                                    >
                                        Start Learning
                                        <ChevronRight size={16} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
