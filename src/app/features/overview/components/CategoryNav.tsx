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
            <div className="text-xs font-semibold text-[var(--forge-text-muted)] uppercase tracking-wide mb-2 px-2">
                Categories
            </div>

            {/* All Categories option */}
            <button
                onClick={() => onSelectCategory(null)}
                className={cn(
                    "w-full icon-text-align px-3 py-2 rounded-lg text-left transition-colors",
                    selectedCategory === null
                        ? "bg-[var(--ember)]/20 text-[var(--ember)]"
                        : "hover:bg-[var(--forge-bg-workshop)] text-[var(--forge-text-secondary)]"
                )}
            >
                <span className="w-3 h-3 rounded-full bg-[var(--ember)]" data-icon />
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
                                    ? "bg-[var(--ember)]/20"
                                    : "hover:bg-[var(--forge-bg-workshop)]"
                            )}
                        >
                            {/* Expand/collapse button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCategory(item.id);
                                }}
                                className="p-0.5 hover:bg-[var(--forge-bg-workshop)] rounded"
                            >
                                {isExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-[var(--forge-text-muted)]" />
                                ) : (
                                    <ChevronRight className="w-3 h-3 text-[var(--forge-text-muted)]" />
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
                                        ? "text-[var(--ember)]"
                                        : "text-[var(--forge-text-primary)]"
                                )}>
                                    {item.name}
                                </span>
                            </button>

                            {/* Progress indicator */}
                            <div className="flex items-center gap-1">
                                {completionPercent === 100 ? (
                                    <CheckCircle2 className="w-4 h-4 text-[var(--forge-success)]" />
                                ) : (
                                    <>
                                        <div className="w-8 h-1 bg-[var(--forge-bg-workshop)] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[var(--forge-success)] transition-all duration-300"
                                                style={{ width: `${completionPercent}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-[var(--forge-text-muted)] w-6 text-right">
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
                                    <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-[var(--forge-border-subtle)] pl-2">
                                        {item.subcategories.map((sub) => (
                                            <div
                                                key={sub.id}
                                                className="flex items-center gap-2 px-2 py-1 text-xs text-[var(--forge-text-secondary)]"
                                            >
                                                <span className="flex-1 truncate">{sub.name}</span>
                                                <span className="text-[var(--forge-text-muted)]">
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
