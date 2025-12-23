"use client";

import React, { Suspense } from "react";
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
import { PathExplorer } from "@/app/features/generative-content";

// Placeholder for components that need complex props
const FeaturePlaceholder = ({ name, description }: { name: string; description: string }) => (
    <div className="p-8 bg-[var(--surface-overlay)] rounded-2xl border border-[var(--border-default)] text-center">
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">{name}</h3>
        <p className="text-[var(--text-muted)] mb-4">{description}</p>
        <p className="text-sm text-[var(--text-secondary)]">
            This component requires specific props from other modules.
            See the source code for integration examples.
        </p>
    </div>
);

// Feature metadata
const featuresMeta: Record<string, { title: string; description: string; gradient: string }> = {
    "code-playground": {
        title: "Code Playground",
        description: "Interactive code editor with live preview",
        gradient: "from-cyan-500 to-blue-600"
    },
    "skill-assessment": {
        title: "Skill Assessment",
        description: "Interactive skill evaluation with scoring",
        gradient: "from-rose-500 to-pink-600"
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
    "curriculum-generator": {
        title: "Curriculum Generator",
        description: "LLM-powered lesson content generation",
        gradient: "from-lime-500 to-green-600"
    },
    "generative-content": {
        title: "Generative Content",
        description: "AI-generated chapters from path seeds",
        gradient: "from-fuchsia-500 to-pink-600"
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

// Feature renderer
function FeatureRenderer({ featureId }: { featureId: string }) {
    switch (featureId) {
        case "code-playground":
            return <CodePlayground playgroundId="dev-playground" initialFiles={mockPlaygroundFiles} title="Dev Playground" />;
        case "skill-assessment":
            return <FeaturePlaceholder name="Skill Assessment" description="Interactive skill evaluation with adaptive scoring based on learner responses." />;
        case "social-proof":
            return <SocialProofVisualization />;
        case "knowledge-universe":
            return <KnowledgeUniverse />;
        case "adaptive-learning":
            return <FeaturePlaceholder name="Adaptive Learning" description="AI-powered learning map with personalized path predictions based on learner behavior." />;
        case "curriculum-generator":
            return <FeaturePlaceholder name="Curriculum Generator" description="LLM-powered curriculum generation with lessons, exercises, and projects." />;
        case "generative-content":
            return <PathExplorer />;
        case "path-comparison":
            return <FeaturePlaceholder name="Path Comparison" description="Side-by-side comparison of learning paths with skill overlap visualization and combined path suggestions." />;
        case "shareable-links":
            return <FeaturePlaceholder name="Shareable Links" description="Social sharing with OG preview cards for learning paths and achievements." />;
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
