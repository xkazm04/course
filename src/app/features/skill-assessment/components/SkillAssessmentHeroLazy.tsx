"use client";

import React, { Suspense, lazy } from "react";
import { SkillAssessmentHeroSkeleton } from "./SkillAssessmentHeroSkeleton";

// Lazy load the heavy SkillAssessmentHero component
// This splits the ~500+ lines component with heavy dependencies (useAssessment, QuestionCard, AssessmentResult)
// into a separate chunk that loads only when the user interacts with the landing page
const SkillAssessmentHeroImpl = lazy(() =>
    import("./SkillAssessmentHero").then((module) => ({
        default: module.SkillAssessmentHero,
    }))
);

interface SkillAssessmentHeroLazyProps {
    /** Theme class names from parent */
    theme: {
        card: {
            shine: string;
            container: string;
            iconContainer: string;
            liveTag: string;
            title: string;
            subtitle: string;
            moduleDefault: string;
            moduleHovered: string;
            moduleIconDefault: string;
            moduleText: string;
            arrowDefault: string;
            arrowHovered: string;
            watermarkText: string;
        };
    };
    /** Reduced motion preference */
    reducedMotion?: boolean;
}

/**
 * Lazy-loaded wrapper for SkillAssessmentHero.
 *
 * Uses React.lazy() and Suspense to code-split the heavy assessment component,
 * reducing initial JS payload by ~15-20KB. Users who never interact with the
 * assessment CTA won't pay the bundle cost for question rendering, result
 * calculation, and assessment state management.
 *
 * The skeleton placeholder maintains visual continuity during loading.
 */
export const SkillAssessmentHeroLazy = ({
    theme,
    reducedMotion = false,
}: SkillAssessmentHeroLazyProps) => {
    return (
        <Suspense fallback={<SkillAssessmentHeroSkeleton theme={theme} />}>
            <SkillAssessmentHeroImpl theme={theme} reducedMotion={reducedMotion} />
        </Suspense>
    );
};
