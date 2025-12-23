"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { AssessmentQuestion, AssessmentOption } from "../lib/types";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

interface QuestionCardProps {
    question: AssessmentQuestion;
    selectedOptions: string[];
    onSelect: (optionIds: string[]) => void;
    onContinue: () => void;
    canGoBack: boolean;
    onBack: () => void;
    className?: string;
}

/**
 * Interactive question card with 3D option selection
 */
export const QuestionCard = ({
    question,
    selectedOptions,
    onSelect,
    onContinue,
    canGoBack,
    onBack,
    className,
}: QuestionCardProps) => {
    const [localSelection, setLocalSelection] = useState<string[]>(selectedOptions);
    const [isAnimating, setIsAnimating] = useState(false);

    // Reset local selection when question changes
    useEffect(() => {
        setLocalSelection(selectedOptions);
    }, [selectedOptions, question.id]);

    const handleOptionClick = (optionId: string) => {
        if (isAnimating) return;

        let newSelection: string[];
        if (question.multiSelect) {
            newSelection = localSelection.includes(optionId)
                ? localSelection.filter((id) => id !== optionId)
                : [...localSelection, optionId];
        } else {
            newSelection = [optionId];
        }

        setLocalSelection(newSelection);

        // Auto-advance for single select after brief delay
        if (!question.multiSelect && newSelection.length > 0) {
            setIsAnimating(true);
            setTimeout(() => {
                onSelect(newSelection);
                onContinue();
                setIsAnimating(false);
            }, 400);
        }
    };

    const handleContinue = () => {
        if (localSelection.length === 0) return;
        onSelect(localSelection);
        onContinue();
    };

    return (
        <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn("w-full max-w-lg mx-auto", className)}
            data-testid={`question-card-${question.id}`}
        >
            {/* Question header */}
            <div className="text-center mb-6">
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white"
                >
                    {question.question}
                </motion.h2>
                {question.subtext && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-2 text-sm text-slate-500 dark:text-slate-400"
                    >
                        {question.subtext}
                    </motion.p>
                )}
            </div>

            {/* Options grid */}
            <div className="space-y-3">
                <AnimatePresence>
                    {question.options.map((option, index) => (
                        <OptionButton
                            key={option.id}
                            option={option}
                            isSelected={localSelection.includes(option.id)}
                            onClick={() => handleOptionClick(option.id)}
                            index={index}
                            isAnimating={isAnimating && localSelection.includes(option.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            {question.multiSelect && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mt-6 flex justify-between"
                >
                    {canGoBack && (
                        <button
                            onClick={onBack}
                            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                            data-testid="assessment-back-btn"
                        >
                            Back
                        </button>
                    )}
                    <button
                        onClick={handleContinue}
                        disabled={localSelection.length === 0}
                        className={cn(
                            "ml-auto px-6 py-2.5 rounded-xl font-semibold transition-all",
                            localSelection.length > 0
                                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
                        )}
                        data-testid="assessment-continue-btn"
                    >
                        Continue
                    </button>
                </motion.div>
            )}

            {/* Back button for single select */}
            {!question.multiSelect && canGoBack && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    onClick={onBack}
                    className="mt-4 w-full text-center text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                    data-testid="assessment-back-btn"
                >
                    ← Go back
                </motion.button>
            )}
        </motion.div>
    );
};

interface OptionButtonProps {
    option: AssessmentOption;
    isSelected: boolean;
    onClick: () => void;
    index: number;
    isAnimating?: boolean;
}

const OptionButton = ({
    option,
    isSelected,
    onClick,
    index,
    isAnimating,
}: OptionButtonProps) => {
    return (
        <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.08 }}
            onClick={onClick}
            className={cn(
                "w-full p-4 rounded-xl text-left transition-all duration-200",
                "border-2 backdrop-blur-sm",
                "hover:scale-[1.02] active:scale-[0.98]",
                isSelected
                    ? "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-900/30"
                    : "border-slate-200/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-800/60 hover:border-indigo-300 dark:hover:border-indigo-700"
            )}
            data-testid={`assessment-option-${option.id}`}
        >
            <div className="flex items-start gap-3">
                {/* Selection indicator */}
                <motion.div
                    className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        "border-2 transition-colors",
                        isSelected
                            ? "border-indigo-500 bg-indigo-500"
                            : "border-slate-300 dark:border-slate-600"
                    )}
                    animate={isAnimating ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                >
                    {isSelected && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2, type: "spring" }}
                        >
                            <Check size={ICON_SIZES.sm} className="text-white" strokeWidth={3} />
                        </motion.div>
                    )}
                </motion.div>

                {/* Option content */}
                <div className="flex-1">
                    <div
                        className={cn(
                            "font-semibold transition-colors",
                            isSelected
                                ? "text-indigo-700 dark:text-indigo-300"
                                : "text-slate-800 dark:text-white"
                        )}
                    >
                        {option.label}
                    </div>
                    {option.description && (
                        <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {option.description}
                        </div>
                    )}
                </div>
            </div>
        </motion.button>
    );
};
