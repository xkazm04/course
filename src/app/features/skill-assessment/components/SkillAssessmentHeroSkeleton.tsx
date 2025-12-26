"use client";

import React from "react";
import { cn } from "@/app/shared/lib/utils";
import { Layers } from "lucide-react";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

interface SkillAssessmentHeroSkeletonProps {
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
}

/**
 * Lightweight skeleton placeholder for SkillAssessmentHero.
 * Displayed while the main component is being lazy-loaded.
 * Matches the visual structure without heavy dependencies.
 */
export const SkillAssessmentHeroSkeleton = ({
    theme,
}: SkillAssessmentHeroSkeletonProps) => {
    return (
        <div
            className="relative group perspective-[2000px] w-full max-w-md aspect-[3/4]"
            data-testid="skill-assessment-hero-skeleton"
        >
            {/* Holographic Border / Shine placeholder */}
            <div
                style={{ transform: "translateZ(-20px)" }}
                className={cn(
                    "absolute inset-0 rounded-3xl blur-xl opacity-0 transition-opacity duration-500 pointer-events-none",
                    theme.card.shine
                )}
            />

            <div
                style={{ transform: "translateZ(20px)" }}
                className={cn(
                    "relative w-full h-full backdrop-blur-[10px] rounded-3xl overflow-hidden",
                    theme.card.container
                )}
            >
                {/* Noise Texture */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />

                {/* Content skeleton */}
                <div className="relative z-10 p-6 md:p-8 h-full flex flex-col">
                    {/* Header skeleton */}
                    <div className="flex justify-between items-start mb-6">
                        <div
                            className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg",
                                theme.card.iconContainer
                            )}
                        >
                            <Layers size={ICON_SIZES.lg} />
                        </div>
                        <div
                            className={cn(
                                "px-3 py-1 text-xs font-bold rounded-lg animate-pulse",
                                theme.card.liveTag
                            )}
                        >
                            LIVE
                        </div>
                    </div>

                    {/* Title skeleton */}
                    <div className="space-y-1 mb-4">
                        <div className={cn("h-8 w-3/4 rounded-lg animate-pulse bg-slate-200 dark:bg-slate-700")} />
                        <div className={cn("h-4 w-1/2 rounded animate-pulse bg-slate-100 dark:bg-slate-800")} />
                    </div>

                    {/* CTA skeleton */}
                    <div className="mb-4 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500/50 to-purple-600/50 animate-pulse h-12" />

                    {/* Module list skeleton */}
                    <div className="flex-1 space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className={cn(
                                    "p-3 rounded-xl border animate-pulse flex items-center gap-3",
                                    theme.card.moduleDefault
                                )}
                            >
                                <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-700" />
                                <div className="flex-1 h-4 rounded bg-slate-200 dark:bg-slate-700" />
                                <div className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
