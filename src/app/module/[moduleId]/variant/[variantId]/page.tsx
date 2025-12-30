"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BackgroundAtmosphere, VariantTabs, Breadcrumb, BreadcrumbItem } from "@/app/shared/components";
import { ThemeToggle } from "@/app/features/theme";
import { getModuleById, getVariantIndex } from "@/app/shared/lib/modules";

// Feature imports - Legacy variants
import { KnowledgeMap } from "@/app/features/knowledge-map";
import {
    VariantD as CareerD
} from "@/app/features/career-mapping";
import { ChapterView, ChapterClassicVariants } from "@/app/features/chapter";
import { MyNotesPage } from "@/app/features/bookmarks";
import { CertificatesPage } from "@/app/features/certificates";

// Variant components
const variantComponents: Record<string, Record<string, React.ReactNode>> = {
    overview: {
        "knowledge-map": <KnowledgeMap height="calc(100vh - 180px)" />,
    },
    "career-mapping": {
        gamified: <CareerD />,
    },
    chapter: {
        classic: <ChapterClassicVariants />,
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
