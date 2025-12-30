"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    ChevronDown,
    ChevronRight,
    Code,
    Link,
    GraduationCap,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { ConceptPrimer as ConceptPrimerType, Concept } from "../lib/types";

interface ConceptPrimerProps {
    primer: ConceptPrimerType;
}

export const ConceptPrimer: React.FC<ConceptPrimerProps> = ({ primer }) => {
    return (
        <div className="space-y-6">
            {/* Prerequisites */}
            <section>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <GraduationCap size={ICON_SIZES.sm} className="text-[var(--forge-warning)]" />
                    Prerequisites
                </h4>
                <div className="flex flex-wrap gap-2">
                    {primer.prerequisites.map((prereq, index) => (
                        <span
                            key={index}
                            className="px-3 py-1.5 rounded-lg text-sm bg-[var(--surface-overlay)] text-[var(--text-secondary)]"
                        >
                            {prereq}
                        </span>
                    ))}
                </div>
            </section>

            {/* Main concepts */}
            <section>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <BookOpen size={ICON_SIZES.sm} className="text-[var(--ember)]" />
                    Key Concepts
                </h4>
                <div className="space-y-3">
                    {primer.mainConcepts.map((concept, index) => (
                        <ConceptCard key={index} concept={concept} />
                    ))}
                </div>
            </section>

            {/* Recommended reading */}
            {primer.recommendedReading.length > 0 && (
                <section>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                        <Link size={ICON_SIZES.sm} className="text-[var(--forge-success)]" />
                        Recommended Reading
                    </h4>
                    <ul className="space-y-2">
                        {primer.recommendedReading.map((reading, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span className="text-[var(--forge-success)] mt-1">•</span>
                                <span className="text-sm text-[var(--text-secondary)]">{reading}</span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

// Concept card component
interface ConceptCardProps {
    concept: Concept;
}

const ConceptCard: React.FC<ConceptCardProps> = ({ concept }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const difficultyColors = {
        basic: "bg-[var(--forge-success)]/20 text-[var(--forge-success)]",
        intermediate: "bg-[var(--forge-warning)]/20 text-[var(--forge-warning)]",
        advanced: "bg-[var(--ember)]/20 text-[var(--ember)]",
    };

    return (
        <motion.div
            className={cn(
                "rounded-lg border border-[var(--border-subtle)]",
                "bg-[var(--surface-overlay)] overflow-hidden"
            )}
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-3 p-4"
            >
                <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                        <h5 className="font-medium text-[var(--text-primary)]">
                            {concept.name}
                        </h5>
                        <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            difficultyColors[concept.difficultyLevel]
                        )}>
                            {concept.difficultyLevel}
                        </span>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronDown size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />
                ) : (
                    <ChevronRight size={ICON_SIZES.sm} className="text-[var(--text-muted)]" />
                )}
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-[var(--border-subtle)]"
                    >
                        <div className="p-4 space-y-4">
                            {/* Explanation */}
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                {concept.explanation}
                            </p>

                            {/* Code example */}
                            {concept.codeExample && (
                                <div>
                                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-2">
                                        <Code size={ICON_SIZES.xs} />
                                        Example
                                    </div>
                                    <pre className="p-3 rounded-lg bg-[var(--surface-base)] overflow-x-auto">
                                        <code className="text-xs font-mono text-[var(--text-secondary)]">
                                            {concept.codeExample}
                                        </code>
                                    </pre>
                                </div>
                            )}

                            {/* Related concepts */}
                            {concept.relatedConcepts.length > 0 && (
                                <div>
                                    <span className="text-xs text-[var(--text-muted)]">Related:</span>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {concept.relatedConcepts.map((related, index) => (
                                            <span
                                                key={index}
                                                className="px-2 py-0.5 rounded text-xs bg-[var(--ember)]/20 text-[var(--ember)]"
                                            >
                                                {related}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
