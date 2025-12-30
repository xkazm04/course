"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, ChevronLeft, Loader2, Check, X, AlertCircle } from "lucide-react";
import type { LearningPath, GeneratedPath } from "../lib/types";
import { DOMAIN_COLORS } from "../lib/types";
import { useOracle, OraclePhase } from "../lib/useOracle";

interface OracleProps {
    currentDomain: LearningPath | null;
    currentDepth: number;
    onPathSelected: (path: GeneratedPath) => void;
}

// Flag to toggle between API and mock mode
const USE_API = process.env.NEXT_PUBLIC_ORACLE_API_URL ? true : false;

export function Oracle({ currentDomain, currentDepth, onPathSelected }: OracleProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    // API-driven state
    const [oracleState, oracleActions] = useOracle();

    // Mock state for fallback
    const [mockStep, setMockStep] = useState<"idle" | "experience" | "focus" | "generating" | "paths" | "complete">("idle");
    const [mockExperience, setMockExperience] = useState<string | null>(null);
    const [mockFocus, setMockFocus] = useState<string | null>(null);
    const [mockPaths, setMockPaths] = useState<GeneratedPath[]>([]);

    // Sync domain with current map level
    useEffect(() => {
        // Domain is synced from parent, used in mock path generation
    }, [currentDomain]);

    const handleToggle = useCallback(() => {
        if (!isExpanded) {
            setIsExpanded(true);
            if (USE_API) {
                oracleActions.start();
            } else {
                setMockStep("experience");
            }
        } else {
            setIsExpanded(false);
            if (USE_API) {
                oracleActions.reset();
            } else {
                setMockStep("idle");
            }
        }
    }, [isExpanded, oracleActions]);

    const handleClose = useCallback(() => {
        setIsExpanded(false);
        if (USE_API) {
            oracleActions.reset();
        } else {
            setMockStep("idle");
        }
    }, [oracleActions]);

    // API-driven answer handler
    const handleApiAnswer = useCallback((answerId: string) => {
        oracleActions.answer(answerId);
    }, [oracleActions]);

    // Mock handlers
    const handleMockExperience = useCallback((exp: string) => {
        setMockExperience(exp);
        setMockStep("focus");
    }, []);

    const handleMockFocus = useCallback((focus: string) => {
        setMockFocus(focus);
        setMockStep("generating");

        // Simulate path generation
        setTimeout(() => {
            const generatedPaths: GeneratedPath[] = [
                {
                    id: "path-1",
                    name: `${currentDomain || "Learning"} Essentials`,
                    nodeIds: ["node-1", "node-2", "node-3"],
                    forgeNodeIds: ["forge-1", "forge-2"],
                    duration: "4 weeks",
                    color: DOMAIN_COLORS[currentDomain || "frontend"]?.base || "#6366f1",
                },
                {
                    id: "path-2",
                    name: `${currentDomain || "Learning"} Deep Dive`,
                    nodeIds: ["node-4", "node-5", "node-6", "node-7"],
                    forgeNodeIds: ["forge-3", "forge-4", "forge-5"],
                    duration: "8 weeks",
                    color: DOMAIN_COLORS[currentDomain || "frontend"]?.dark || "#4338ca",
                },
            ];
            setMockPaths(generatedPaths);
            setMockStep("paths");
        }, 1200);
    }, [currentDomain]);

    const handlePathSelect = useCallback((path: GeneratedPath) => {
        if (USE_API && path.id) {
            oracleActions.selectPath(path.id);
        } else {
            setMockStep("complete");
        }

        onPathSelected(path);

        setTimeout(() => {
            setIsExpanded(false);
            if (USE_API) {
                oracleActions.reset();
            } else {
                setMockStep("idle");
            }
        }, 1500);
    }, [oracleActions, onPathSelected]);

    const handleBack = useCallback(() => {
        if (USE_API) {
            // For API mode, we'd need to track which step we're on
            // For now, just reset
            oracleActions.reset();
            oracleActions.start();
        } else {
            if (mockStep === "focus") {
                setMockStep("experience");
                setMockExperience(null);
            } else if (mockStep === "paths") {
                setMockStep("focus");
                setMockFocus(null);
            }
        }
    }, [mockStep, oracleActions]);

    // Determine current step for progress indicator
    const getCurrentStepIndex = (): number => {
        if (USE_API) {
            const phaseMap: Record<OraclePhase, number> = {
                "idle": -1,
                "static": 0,
                "llm": 1,
                "generating": 1,
                "paths": 2,
                "complete": 3,
                "error": -1,
            };
            return phaseMap[oracleState.phase];
        } else {
            const stepMap: Record<string, number> = {
                "idle": -1,
                "experience": 0,
                "focus": 1,
                "generating": 1,
                "paths": 2,
                "complete": 3,
            };
            return stepMap[mockStep] ?? -1;
        }
    };

    // Convert API paths to GeneratedPath format
    const getDisplayPaths = (): GeneratedPath[] => {
        if (USE_API) {
            return oracleState.paths.map((p, index) => ({
                id: p.id || `path-${index}-${Date.now()}`,
                name: p.name,
                nodeIds: p.node_ids,
                forgeNodeIds: p.forge_suggestions.map(f => f.name),
                duration: p.estimated_weeks ? `${p.estimated_weeks} weeks` : "TBD",
                color: p.color || "#6366f1",
            }));
        }
        return mockPaths;
    };

    const isLoading = USE_API ? oracleState.isLoading : false;
    const error = USE_API ? oracleState.error : null;
    const currentStep = getCurrentStepIndex();

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-40"
        >
            <div className="bg-[var(--forge-bg-daylight)]/95 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-xl overflow-hidden">
                {/* Header - always visible */}
                <div
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        isExpanded ? "bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)]" : "hover:bg-[var(--forge-bg-elevated)]"
                    }`}
                    onClick={handleToggle}
                >
                    <div className={`p-1.5 rounded-lg ${isExpanded ? "bg-white/20" : "bg-[var(--ember)]/10"}`}>
                        <Sparkles className={`w-4 h-4 ${isExpanded ? "text-white" : "text-[var(--ember)]"}`} />
                    </div>
                    <span className={`font-medium ${isExpanded ? "text-white" : "text-[var(--forge-text-secondary)]"}`}>
                        {isExpanded ? "Learning Oracle" : "Ask Oracle for guidance"}
                    </span>
                    {isExpanded && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleClose(); }}
                            className="ml-auto p-1 rounded-lg hover:bg-white/20 transition-colors"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    )}
                </div>

                {/* Expandable content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            {/* Progress dots */}
                            <div className="flex items-center justify-center gap-2 py-2 bg-[var(--forge-bg-elevated)] border-b border-[var(--forge-border-subtle)]">
                                {[0, 1, 2].map((stepIdx) => (
                                    <div
                                        key={stepIdx}
                                        className={`w-2 h-2 rounded-full transition-colors ${
                                            currentStep === stepIdx
                                                ? "bg-[var(--ember)]"
                                                : currentStep > stepIdx
                                                ? "bg-[var(--ember)]/50"
                                                : "bg-[var(--forge-border-subtle)]"
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Content */}
                            <div className="p-4 min-w-[320px]">
                                <AnimatePresence mode="wait">
                                    {/* Error state */}
                                    {error && (
                                        <motion.div
                                            key="error"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="py-4 flex flex-col items-center gap-3"
                                        >
                                            <AlertCircle className="w-6 h-6 text-[var(--forge-error)]" />
                                            <p className="text-sm text-[var(--forge-error)]">{error}</p>
                                            <button
                                                onClick={() => oracleActions.start()}
                                                className="text-sm text-[var(--ember)] hover:underline"
                                            >
                                                Try again
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* API Mode - Dynamic Questions */}
                                    {USE_API && !error && (oracleState.phase === "static" || oracleState.phase === "llm") && oracleState.currentQuestion && (
                                        <motion.div
                                            key={`question-${oracleState.questionIndex}`}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-2"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-sm text-[var(--forge-text-secondary)]">{oracleState.currentQuestion.question}</p>
                                                {oracleState.questionIndex > 0 && (
                                                    <button
                                                        onClick={handleBack}
                                                        className="text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] flex items-center gap-1"
                                                    >
                                                        <ChevronLeft size={12} /> Reset
                                                    </button>
                                                )}
                                            </div>
                                            <div className={`grid ${oracleState.currentQuestion.options.length <= 3 ? "grid-cols-3" : "grid-cols-2"} gap-2`}>
                                                {oracleState.currentQuestion.options.map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleApiAnswer(opt.id)}
                                                        disabled={isLoading}
                                                        className="px-3 py-2 text-sm font-medium rounded-lg border border-[var(--forge-border-subtle)]
                                                                   hover:border-[var(--ember)]/50 hover:bg-[var(--ember)]/5 hover:text-[var(--ember)]
                                                                   transition-colors text-left disabled:opacity-50"
                                                    >
                                                        <span className="block">{opt.label}</span>
                                                        {opt.description && (
                                                            <span className="text-xs text-[var(--forge-text-muted)] block mt-0.5">{opt.description}</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                            {oracleState.currentQuestion.reasoning && (
                                                <p className="text-xs text-[var(--forge-text-muted)] mt-2 italic">
                                                    {oracleState.currentQuestion.reasoning}
                                                </p>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Mock Mode - Experience step */}
                                    {!USE_API && mockStep === "experience" && (
                                        <motion.div
                                            key="experience"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-2"
                                        >
                                            <p className="text-sm text-[var(--forge-text-secondary)] mb-3">Your experience level?</p>
                                            <div className="flex gap-2">
                                                {[
                                                    { id: "beginner", label: "Beginner" },
                                                    { id: "intermediate", label: "Intermediate" },
                                                    { id: "advanced", label: "Advanced" },
                                                ].map(opt => (
                                                    <button
                                                        key={opt.id}
                                                        onClick={() => handleMockExperience(opt.id)}
                                                        className="flex-1 px-3 py-2 text-sm font-medium rounded-lg border border-[var(--forge-border-subtle)]
                                                                   hover:border-[var(--ember)]/50 hover:bg-[var(--ember)]/5 hover:text-[var(--ember)]
                                                                   transition-colors"
                                                    >
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Mock Mode - Focus step */}
                                    {!USE_API && mockStep === "focus" && (
                                        <motion.div
                                            key="focus"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-2"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-sm text-[var(--forge-text-secondary)]">Your main goal?</p>
                                                <button
                                                    onClick={handleBack}
                                                    className="text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] flex items-center gap-1"
                                                >
                                                    <ChevronLeft size={12} /> Back
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {["Build projects", "Master fundamentals", "Job prep", "Side projects"].map(focus => (
                                                    <button
                                                        key={focus}
                                                        onClick={() => handleMockFocus(focus)}
                                                        className="px-3 py-2 text-sm font-medium rounded-lg border border-[var(--forge-border-subtle)]
                                                                   hover:border-[var(--ember)]/50 hover:bg-[var(--ember)]/5 hover:text-[var(--ember)]
                                                                   transition-colors text-left"
                                                    >
                                                        {focus}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* Generating step (both modes) */}
                                    {((USE_API && oracleState.phase === "generating") || (!USE_API && mockStep === "generating")) && (
                                        <motion.div
                                            key="generating"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="py-6 flex flex-col items-center gap-3"
                                        >
                                            <Loader2 className="w-6 h-6 text-[var(--ember)] animate-spin" />
                                            <p className="text-sm text-[var(--forge-text-secondary)]">Crafting your path...</p>
                                        </motion.div>
                                    )}

                                    {/* Loading state for API */}
                                    {USE_API && isLoading && oracleState.phase !== "generating" && (
                                        <motion.div
                                            key="loading"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="py-4 flex items-center justify-center"
                                        >
                                            <Loader2 className="w-5 h-5 text-[var(--ember)] animate-spin" />
                                        </motion.div>
                                    )}

                                    {/* Paths step (both modes) */}
                                    {((USE_API && oracleState.phase === "paths") || (!USE_API && mockStep === "paths")) && (
                                        <motion.div
                                            key="paths"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-2"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <p className="text-sm text-[var(--forge-text-secondary)]">Choose your path:</p>
                                                <button
                                                    onClick={handleBack}
                                                    className="text-xs text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] flex items-center gap-1"
                                                >
                                                    <ChevronLeft size={12} /> Back
                                                </button>
                                            </div>
                                            {getDisplayPaths().map(path => (
                                                <button
                                                    key={path.id}
                                                    onClick={() => handlePathSelect(path)}
                                                    className="w-full p-3 text-left rounded-xl border border-[var(--forge-border-subtle)]
                                                               hover:border-[var(--ember)]/50 hover:bg-[var(--ember)]/5
                                                               transition-colors group"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: path.color }}
                                                        />
                                                        <span className="font-medium text-[var(--forge-text-primary)] text-sm">
                                                            {path.name}
                                                        </span>
                                                        <ChevronRight size={14} className="ml-auto text-[var(--forge-text-muted)] group-hover:text-[var(--ember)]" />
                                                    </div>
                                                    <p className="text-xs text-[var(--forge-text-muted)] mt-1 ml-4">
                                                        {path.nodeIds.length} modules · {path.duration}
                                                    </p>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}

                                    {/* Complete step (both modes) */}
                                    {((USE_API && oracleState.phase === "complete") || (!USE_API && mockStep === "complete")) && (
                                        <motion.div
                                            key="complete"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="py-6 flex flex-col items-center gap-3"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-[var(--forge-success)]/10 flex items-center justify-center">
                                                <Check className="w-5 h-5 text-[var(--forge-success)]" />
                                            </div>
                                            <p className="text-sm font-medium text-[var(--forge-text-secondary)]">Path activated!</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
