"use client";

import React, { Suspense, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ThemeToggle } from "@/app/features/theme";
import { BackgroundAtmosphere } from "@/app/shared/components";

// Direct imports for simpler components
import { CodePlayground } from "@/app/features/code-playground";
import { SocialProofVisualization } from "@/app/features/social-proof";
import { KnowledgeUniverse } from "@/app/features/knowledge-universe";

// Adaptive Learning imports
import { AdaptiveLearningProvider, AdaptiveLearningMap } from "@/app/features/adaptive-learning";

// Path Comparison imports
import { PathComparisonModal, CompareButton, PathComparisonCard } from "@/app/features/path-comparison";
import { usePathComparison } from "@/app/features/path-comparison/lib/usePathComparison";
import { learningPaths as mockLearningPaths } from "@/app/shared/lib/mockData";

// Shareable Links imports
import { ShareModal, ShareButton } from "@/app/features/shareable-links";
import { useSharePath } from "@/app/features/shareable-links/lib/useSharePath";

// Experiment feature imports (Tasks 01-04)
import { DiscoveryDashboard } from "@/app/features/open-source-discovery";
import { SimulationWorkspace } from "@/app/features/client-simulation";
import { ChallengeDashboard } from "@/app/features/competition";
import { RemixWorkspace } from "@/app/features/remix-projects";

// Feature metadata
const featuresMeta: Record<string, { title: string; description: string; gradient: string }> = {
    "code-playground": {
        title: "Code Playground",
        description: "Interactive code editor with live preview",
        gradient: "from-cyan-500 to-blue-600"
    },
    "social-proof": {
        title: "Social Proof",
        description: "Animated learner journey visualization",
        gradient: "from-teal-500 to-emerald-600"
    },
    "knowledge-universe": {
        title: "Knowledge Universe",
        description: "Cosmic curriculum view with zoom levels",
        gradient: "from-indigo-500 to-violet-600"
    },
    "adaptive-learning": {
        title: "Adaptive Learning",
        description: "AI-powered learning path predictions",
        gradient: "from-yellow-500 to-amber-600"
    },
    "path-comparison": {
        title: "Path Comparison",
        description: "Compare multiple learning paths side-by-side",
        gradient: "from-orange-500 to-red-600"
    },
    "shareable-links": {
        title: "Shareable Links",
        description: "Social sharing with OG preview cards",
        gradient: "from-sky-500 to-blue-600"
    },
    // Experiment features (Tasks 01-04)
    "open-source-discovery": {
        title: "Open Source Discovery",
        description: "Living Product Model - Real-world project discovery and contribution",
        gradient: "from-emerald-500 to-teal-600"
    },
    "client-simulation": {
        title: "Client Simulation",
        description: "Generative Simulation Model - AI-powered client scenario practice",
        gradient: "from-violet-500 to-purple-600"
    },
    "competition": {
        title: "Competition Arena",
        description: "Competitive Ecosystem Model - Timed challenges and leaderboards",
        gradient: "from-orange-500 to-red-600"
    },
    "remix-projects": {
        title: "Remix & Extend",
        description: "Remix Model - Inherit and improve existing codebases",
        gradient: "from-blue-500 to-indigo-600"
    },
};

// Mock data for components that need props
const mockPlaygroundFiles = [
    {
        id: "1",
        name: "index.js",
        language: "javascript" as const,
        content: "// Welcome to the playground!\nconsole.log('Hello, World!');\n\n// Try editing this code!\nconst greeting = 'Hi there!';\nconsole.log(greeting);",
        isEntry: true
    }
];

// Loading fallback
const LoadingFallback = () => (
    <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
    </div>
);

// Adaptive Learning Demo Component
function AdaptiveLearningDemo() {
    return (
        <AdaptiveLearningProvider>
            <div className="space-y-6">
                <div className="p-4 bg-[var(--surface-overlay)] rounded-xl border border-[var(--border-default)]">
                    <p className="text-sm text-[var(--text-secondary)]">
                        This demo shows AI-powered learning recommendations. Click &quot;Refresh&quot; to generate personalized path suggestions based on your learning profile.
                    </p>
                </div>
                <AdaptiveLearningMap
                    onNavigateToNode={(nodeId) => {
                        console.log("Navigate to node:", nodeId);
                        alert(`Would navigate to: ${nodeId}`);
                    }}
                />
            </div>
        </AdaptiveLearningProvider>
    );
}

// Path Comparison Demo Component
function PathComparisonDemo() {
    const {
        session,
        comparisonData,
        togglePath,
        isSelected,
        openModal,
        closeModal,
        clearSelection,
        removePath,
        canAddMore,
        canCompare,
    } = usePathComparison({
        maxPaths: 3,
        allPaths: mockLearningPaths,
    });

    return (
        <div className="space-y-6">
            <div className="p-4 bg-[var(--surface-overlay)] rounded-xl border border-[var(--border-default)]">
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Select 2-3 learning paths to compare them side-by-side. Click &quot;Compare&quot; on a path to add it.
                </p>
                <div className="flex items-center gap-3">
                    <button
                        onClick={openModal}
                        disabled={!canCompare}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                            canCompare
                                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90"
                                : "bg-[var(--surface-inset)] text-[var(--text-muted)] cursor-not-allowed"
                        )}
                    >
                        Compare {session.selectedPaths.length} Paths
                    </button>
                    {session.selectedPaths.length > 0 && (
                        <button
                            onClick={clearSelection}
                            className="px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            Clear selection
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockLearningPaths.map((path) => (
                    <div
                        key={path.id}
                        className={cn(
                            "p-4 rounded-xl border transition-all",
                            isSelected(path.id)
                                ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]"
                                : "bg-[var(--surface-overlay)] border-[var(--border-default)] hover:border-[var(--border-strong)]"
                        )}
                    >
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-[var(--text-primary)]">{path.name}</h3>
                            <CompareButton
                                path={path}
                                isSelected={isSelected(path.id)}
                                canAddMore={canAddMore}
                                onToggle={togglePath}
                                size="sm"
                            />
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-3">{path.description}</p>
                        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                            <span>{path.courses} courses</span>
                            <span>{path.hours}h</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {path.skills.slice(0, 3).map((skill) => (
                                <span
                                    key={skill}
                                    className="px-2 py-0.5 text-xs bg-[var(--surface-inset)] text-[var(--text-muted)] rounded-md"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <PathComparisonModal
                isOpen={session.isOpen}
                onClose={closeModal}
                comparisonData={comparisonData}
                onRemovePath={removePath}
                onStartPath={(pathId) => {
                    console.log("Start path:", pathId);
                    alert(`Would start learning path: ${pathId}`);
                    closeModal();
                }}
            />
        </div>
    );
}

// Shareable Links Demo Component
function ShareableLinksDemo() {
    const {
        modalState,
        openShare,
        closeShare,
        copyShareUrl,
        shareToTwitter,
        shareToLinkedIn,
    } = useSharePath({ progress: 65 });

    return (
        <div className="space-y-6">
            <div className="p-4 bg-[var(--surface-overlay)] rounded-xl border border-[var(--border-default)]">
                <p className="text-sm text-[var(--text-secondary)]">
                    Share your learning progress on social media! Click the Share button on any path to generate a shareable link with an OG preview card.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockLearningPaths.map((path) => (
                    <div
                        key={path.id}
                        className="p-4 rounded-xl border bg-[var(--surface-overlay)] border-[var(--border-default)] hover:border-[var(--border-strong)] transition-all"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-[var(--text-primary)]">{path.name}</h3>
                            <ShareButton
                                path={path}
                                onShare={openShare}
                                size="sm"
                            />
                        </div>
                        <p className="text-sm text-[var(--text-secondary)] mb-3">{path.description}</p>
                        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                            <span>{path.courses} courses</span>
                            <span>{path.hours}h</span>
                        </div>
                    </div>
                ))}
            </div>

            <ShareModal
                state={modalState}
                onClose={closeShare}
                onCopy={copyShareUrl}
                onTwitterShare={shareToTwitter}
                onLinkedInShare={shareToLinkedIn}
            />
        </div>
    );
}

// Feature renderer
function FeatureRenderer({ featureId }: { featureId: string }) {
    switch (featureId) {
        case "code-playground":
            return <CodePlayground playgroundId="dev-playground" initialFiles={mockPlaygroundFiles} title="Dev Playground" />;
        case "social-proof":
            return <SocialProofVisualization />;
        case "knowledge-universe":
            return <KnowledgeUniverse />;
        case "adaptive-learning":
            return <AdaptiveLearningDemo />;
        case "path-comparison":
            return <PathComparisonDemo />;
        case "shareable-links":
            return <ShareableLinksDemo />;
        // Experiment features (Tasks 01-04)
        case "open-source-discovery":
            return <DiscoveryDashboard />;
        case "client-simulation":
            return <SimulationWorkspace />;
        case "competition":
            return <ChallengeDashboard />;
        case "remix-projects":
            return <RemixWorkspace />;
        default:
            return (
                <div className="text-center py-16">
                    <p className="text-[var(--text-muted)]">Unknown feature: {featureId}</p>
                </div>
            );
    }
}

export default function DevFeaturePage() {
    const params = useParams();
    const featureId = params.featureId as string;
    const meta = featuresMeta[featureId];

    if (!meta) {
        return (
            <div className="min-h-screen bg-[var(--surface-base)] flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Feature Not Found</h1>
                    <Link href="/" className="text-[var(--accent-primary)] hover:underline">
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--surface-base)] font-sans overflow-x-hidden transition-colors duration-300">
            <BackgroundAtmosphere variant="cool" />

            {/* Header */}
            <header className="sticky top-0 z-50 px-4 lg:px-8 py-4 bg-[var(--surface-base)]/80 backdrop-blur-md border-b border-[var(--border-default)]">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                        >
                            <ArrowLeft size={ICON_SIZES.md} />
                            <span className="text-sm font-medium">Back</span>
                        </Link>
                        <div className="w-px h-6 bg-[var(--border-default)]" />
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br",
                                meta.gradient
                            )}>
                                <FlaskConical size={ICON_SIZES.sm} />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-[var(--text-primary)]">{meta.title}</h1>
                                <p className="text-xs text-[var(--text-muted)]">{meta.description}</p>
                            </div>
                        </div>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 p-4 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <Suspense fallback={<LoadingFallback />}>
                        <FeatureRenderer featureId={featureId} />
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
