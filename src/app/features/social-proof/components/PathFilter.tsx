"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";
import type { LearnerStartingPoint } from "../lib/types";
import { startingPointFilters } from "../lib/mockData";

interface PathFilterProps {
  selectedFilter: LearnerStartingPoint | null;
  onFilterChange: (filter: LearnerStartingPoint | null) => void;
  reducedMotion: boolean;
  theme?: "light" | "dark";
}

/**
 * Filter bar for selecting starting point to view similar paths
 */
export function PathFilter({
  selectedFilter,
  onFilterChange,
  reducedMotion,
  theme = "dark",
}: PathFilterProps) {
  const isDark = theme === "dark";

  return (
    <div
      className="flex flex-wrap gap-2 justify-center"
      data-testid="path-filter-container"
    >
      {startingPointFilters.map((filter, index) => {
        const isSelected =
          filter.id === "all"
            ? selectedFilter === null
            : filter.value === selectedFilter;

        return (
          <motion.button
            key={filter.id}
            onClick={() =>
              onFilterChange(filter.id === "all" ? null : filter.value)
            }
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border",
              isSelected
                ? isDark
                  ? "bg-indigo-500 text-white border-indigo-400"
                  : "bg-indigo-600 text-white border-indigo-500"
                : isDark
                ? "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                : "bg-white/50 text-slate-700 border-slate-200 hover:bg-white/80"
            )}
            initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: reducedMotion ? 0 : index * 0.05,
              duration: reducedMotion ? 0 : 0.3,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            data-testid={`path-filter-${filter.id}`}
          >
            <span className="text-base">{filter.icon}</span>
            <span>{filter.label}</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded-full text-xs",
                isSelected
                  ? isDark
                    ? "bg-white/20 text-white"
                    : "bg-white/30 text-white"
                  : isDark
                  ? "bg-white/10 text-slate-400"
                  : "bg-slate-200 text-slate-600"
              )}
            >
              {filter.count}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}

interface PathFilterCompactProps {
  selectedFilter: LearnerStartingPoint | null;
  onFilterChange: (filter: LearnerStartingPoint | null) => void;
  reducedMotion: boolean;
}

/**
 * Compact filter for mobile/small displays
 */
export function PathFilterCompact({
  selectedFilter,
  onFilterChange,
  reducedMotion,
}: PathFilterCompactProps) {
  return (
    <div
      className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide"
      data-testid="path-filter-compact-container"
    >
      {startingPointFilters.map((filter, index) => {
        const isSelected =
          filter.id === "all"
            ? selectedFilter === null
            : filter.value === selectedFilter;

        return (
          <motion.button
            key={filter.id}
            onClick={() =>
              onFilterChange(filter.id === "all" ? null : filter.value)
            }
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
              isSelected
                ? "bg-indigo-500 text-white border-indigo-400"
                : "bg-white/5 text-slate-300 border-white/10"
            )}
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reducedMotion ? 0 : index * 0.03 }}
            data-testid={`path-filter-compact-${filter.id}`}
          >
            <span>{filter.icon}</span>
            <span>{filter.id === "all" ? "All" : filter.label.split(" ")[0]}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
