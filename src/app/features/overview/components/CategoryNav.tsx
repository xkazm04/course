"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { CurriculumCategory, CATEGORY_META, CurriculumData } from "../lib/curriculumTypes";
import { generateCategoryNav, CategoryNavItem } from "../lib/curriculumPositions";

interface CategoryNavProps {
    data: CurriculumData;
    selectedCategory: string | null;
    onSelectCategory: (category: string | null) => void;
    className?: string;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({
    data,
    selectedCategory,
    onSelectCategory,
    className,
}) => {
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const navItems = generateCategoryNav(data);

    const toggleCategory = (categoryId: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev);
            if (next.has(categoryId)) {
                next.delete(categoryId);
            } else {
                next.add(categoryId);
            }
            return next;
        });
    };

    const getCategoryMeta = (categoryId: CurriculumCategory) => {
        return CATEGORY_META.find(c => c.id === categoryId);
    };

    return (
        <div className={cn("space-y-1", className)}>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2 px-2">
                Categories
            </div>

            {/* All Categories option */}
            <button
                onClick={() => onSelectCategory(null)}
                className={cn(
                    "w-full icon-text-align px-3 py-2 rounded-lg text-left transition-colors",
                    selectedCategory === null
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700 text-[var(--text-secondary)]"
                )}
            >
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" data-icon />
                <span className="flex-1 text-sm font-medium">All Categories</span>
                <span className="text-xs opacity-60">{data.nodes.length}</span>
            </button>

            {/* Category list */}
            {navItems.map((item) => {
                const meta = getCategoryMeta(item.id);
                const isExpanded = expandedCategories.has(item.id);
                const isSelected = selectedCategory === item.id;
                const completionPercent = item.nodeCount > 0
                    ? Math.round((item.completedCount / item.nodeCount) * 100)
                    : 0;

                return (
                    <div key={item.id}>
                        <div
                            className={cn(
                                "icon-text-align px-3 py-2 rounded-lg transition-colors cursor-pointer",
                                isSelected
                                    ? "bg-indigo-100 dark:bg-indigo-900/30"
                                    : "hover:bg-slate-100 dark:hover:bg-slate-700"
                            )}
                        >
                            {/* Expand/collapse button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCategory(item.id);
                                }}
                                className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                ) : (
                                    <ChevronRight className="w-3 h-3 text-slate-400" />
                                )}
                            </button>

                            {/* Category button */}
                            <button
                                onClick={() => onSelectCategory(isSelected ? null : item.id)}
                                className="flex-1 icon-text-align text-left"
                            >
                                <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: meta?.color }}
                                    data-icon
                                />
                                <span className={cn(
                                    "flex-1 text-sm font-medium truncate",
                                    isSelected
                                        ? "text-indigo-700 dark:text-indigo-300"
                                        : "text-[var(--text-primary)]"
                                )}>
                                    {item.name}
                                </span>
                            </button>

                            {/* Progress indicator */}
                            <div className="flex items-center gap-1">
                                {completionPercent === 100 ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : (
                                    <>
                                        <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 transition-all duration-300"
                                                style={{ width: `${completionPercent}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-slate-400 w-6 text-right">
                                            {item.completedCount}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Subcategories */}
                        <AnimatePresence>
                            {isExpanded && item.subcategories.length > 0 && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                >
                                    <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                                        {item.subcategories.map((sub) => (
                                            <div
                                                key={sub.id}
                                                className="flex items-center gap-2 px-2 py-1 text-xs text-[var(--text-secondary)]"
                                            >
                                                <span className="flex-1 truncate">{sub.name}</span>
                                                <span className="text-slate-400">
                                                    {sub.completedCount}/{sub.nodeIds.length}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
        </div>
    );
};

export default CategoryNav;
