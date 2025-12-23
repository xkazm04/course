"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";
import { BackgroundAtmosphere, VariantTabs, Breadcrumb, BreadcrumbItem } from "@/app/shared/components";
import { ThemeToggle } from "@/app/features/theme";
import { modules, getModuleById, getVariantIndex } from "@/app/shared/lib/modules";

// Feature imports - Legacy variants
import {
    VariantB as OverviewB,
    VariantF as OverviewF,
} from "@/app/features/overview";
import { KnowledgeMap } from "@/app/features/knowledge-map";
import {
    VariantD as CareerD
} from "@/app/features/career-mapping";
import { ChapterView } from "@/app/features/chapter";
import { MyNotesPage } from "@/app/features/bookmarks";
import { CertificatesPage } from "@/app/features/certificates";

// Polymorphic variant imports - New state machine pattern
// These replace the legacy VariantX imports with mode-based components
import {
    LandingPolymorphic,
    type LandingMode,
} from "@/app/features/landing";
import { VariantE as CareerOracle } from "@/app/features/goal-path";

/**
 * Variant ID to Mode Mapping
 *
 * This maps the URL variant IDs to the polymorphic component modes.
 * The polymorphic pattern treats variants as "modes" or "states" of
 * a single component, making it trivial to add new variants.
 */
const variantToLandingMode: Record<string, LandingMode> = {
    spatial: "spatial",
    dark: "dark",
};

/**
 * Polymorphic Variant Component Factory
 *
 * Creates variant components using the new polymorphic pattern.
 * This demonstrates how the "variant pattern as state machine" works:
 * - One component, multiple modes
 * - Mode changes transform rendering strategy
 * - Same data flows through all modes
 */
const createPolymorphicVariants = () => ({
    // Landing uses polymorphic pattern - single component with mode prop
    landing: {
        spatial: <LandingPolymorphic mode="spatial" />,
        dark: <LandingPolymorphic mode="dark" />,
    },
    // Goal Path - AI Career Oracle with predictive intelligence
    "goal-path": {
        "career-oracle": <CareerOracle />,
    },
});

// Legacy variant components (these will gradually migrate to polymorphic pattern)
const legacyVariantComponents: Record<string, Record<string, React.ReactNode>> = {
    overview: {
        "split-view": <OverviewB />,
        "knowledge-map": <KnowledgeMap height="calc(100vh - 180px)" />,
        "skill-progress": <OverviewF />,
    },
    "career-mapping": {
        gamified: <CareerD />,
    },
    chapter: {
        classic: <ChapterView mode="classic" />,
        expandable: <ChapterView mode="expandable" />,
        ide: <ChapterView mode="ide" />,
    },
    "my-notes": {
        library: <MyNotesPage />,
    },
    certificates: {
        gallery: <CertificatesPage />,
    },
};

// Combine polymorphic and legacy variants
const variantComponents: Record<string, Record<string, React.ReactNode>> = {
    ...createPolymorphicVariants(),
    ...legacyVariantComponents,
};

export default function ModuleVariantPage() {
    const params = useParams();

    const moduleId = params.moduleId as string;
    const variantId = params.variantId as string;

    const module = getModuleById(moduleId);

    if (!module) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--surface-base)]">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                        Module Not Found
                    </h1>
                    <Link
                        href="/"
                        className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg hover:opacity-90 transition-opacity inline-block"
                        data-testid="back-to-home-btn"
                    >
                        Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    const activeVariantIndex = getVariantIndex(module, variantId);
    const currentVariant = module.variants[activeVariantIndex];

    // Variant change is handled via Link navigation in VariantTabs
    const handleVariantChange = () => {
        // No-op - navigation is handled by Link components in VariantTabs
    };

    const breadcrumbItems: BreadcrumbItem[] = [
        { label: "Home", href: "/" },
        { label: module.title },
        { label: currentVariant.name, active: true },
    ];

    const variantComponent = variantComponents[moduleId]?.[variantId] || variantComponents[moduleId]?.[module.variants[0].id];

    return (
        <div
            className="min-h-screen bg-[var(--surface-base)] font-sans overflow-x-hidden selection:bg-indigo-100 dark:selection:bg-indigo-900 transition-colors duration-300"
            data-testid={`module-page-${moduleId}`}
        >
            <BackgroundAtmosphere variant={module.atmosphereVariant} />

            <header className="sticky top-0 z-50 px-4 lg:px-8 py-4" data-testid="module-header">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Breadcrumb items={breadcrumbItems} />
                    </div>

                    <div className="flex items-center gap-4" data-testid="module-header-actions">
                        <VariantTabs
                            variants={module.variants.map(v => v.name)}
                            activeVariant={activeVariantIndex}
                            onVariantChange={handleVariantChange}
                            moduleId={moduleId}
                        />
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="relative z-10 p-4 lg:p-8" data-testid="module-main-content">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={variantId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-7xl mx-auto"
                        data-testid={`variant-content-${variantId}`}
                    >
                        {variantComponent}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
