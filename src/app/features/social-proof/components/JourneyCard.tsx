"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Briefcase, Sparkles } from "lucide-react";
import type { LearnerJourney } from "../lib/types";
import { getOutcomeLabel, getStartingPointLabel } from "../lib/mockData";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

interface JourneyCardProps {
  journey: LearnerJourney;
  isSelected: boolean;
  onSelect: () => void;
  reducedMotion: boolean;
  theme?: "light" | "dark";
}

/**
 * Card displaying journey details when a path is selected
 */
export function JourneyCard({
  journey,
  isSelected,
  onSelect,
  reducedMotion,
  theme = "dark",
}: JourneyCardProps) {
  const isDark = theme === "dark";

  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-xl border backdrop-blur-md transition-all",
        isSelected
          ? isDark
            ? "border-indigo-500/50 bg-indigo-500/20"
            : "border-indigo-400/50 bg-indigo-100/80"
          : isDark
          ? "border-white/10 bg-white/5 hover:bg-white/10"
          : "border-slate-200 bg-white/50 hover:bg-white/80"
      )}
      initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: reducedMotion ? 0 : 0.2 }}
      data-testid={`journey-card-${journey.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Profile and starting point */}
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: journey.pathColor }}
              data-testid={`journey-avatar-${journey.id}`}
            >
              {journey.profileLabel.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  "font-medium truncate",
                  isDark ? "text-white" : "text-slate-900"
                )}
              >
                {journey.profileLabel}
              </div>
              <div
                className={cn(
                  "text-xs truncate",
                  isDark ? "text-slate-400" : "text-slate-500"
                )}
              >
                {getStartingPointLabel(journey.startingPoint)}
                {journey.previousField && ` from ${journey.previousField}`}
              </div>
            </div>
          </div>

          {/* Outcome */}
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowRight
              size={ICON_SIZES.sm}
              className={isDark ? "text-slate-500" : "text-slate-400"}
            />
            <span
              className={cn(
                "text-sm font-medium",
                isDark ? "text-indigo-300" : "text-indigo-600"
              )}
            >
              {getOutcomeLabel(journey.outcome)}
            </span>
          </div>

          {/* Duration and activity */}
          <div className="flex items-center gap-3 text-xs">
            <span
              className={cn(
                "flex items-center gap-1",
                isDark ? "text-slate-400" : "text-slate-500"
              )}
            >
              <Clock size={ICON_SIZES.xs} />
              {journey.durationMonths} months
            </span>
            <span
              className={cn(
                "flex items-center gap-1",
                isDark ? "text-emerald-400" : "text-emerald-600"
              )}
            >
              <Sparkles size={ICON_SIZES.xs} />
              {Math.round(journey.activityLevel * 100)}% active
            </span>
          </div>

          {/* Testimonial */}
          {journey.testimonial && isSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className={cn(
                "mt-3 pt-3 border-t text-sm italic",
                isDark
                  ? "border-white/10 text-slate-300"
                  : "border-slate-200 text-slate-600"
              )}
            >
              &ldquo;{journey.testimonial}&rdquo;
            </motion.div>
          )}
        </div>

        {/* Activity indicator */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: journey.pathColor }}
              animate={
                !reducedMotion
                  ? {
                      scale: [1, 1.3, 1],
                      opacity: [0.8, 1, 0.8],
                    }
                  : {}
              }
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {!reducedMotion && (
              <motion.div
                className="absolute inset-0 w-3 h-3 rounded-full"
                style={{ backgroundColor: journey.pathColor }}
                animate={{
                  scale: [1, 2],
                  opacity: [0.5, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

interface JourneyCardCompactProps {
  journey: LearnerJourney;
  isSelected: boolean;
  onSelect: () => void;
  reducedMotion: boolean;
}

/**
 * Compact version of journey card for smaller displays
 */
export function JourneyCardCompact({
  journey,
  isSelected,
  onSelect,
  reducedMotion,
}: JourneyCardCompactProps) {
  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm transition-all",
        isSelected
          ? "border-indigo-500/50 bg-indigo-500/20"
          : "border-white/10 bg-white/5 hover:bg-white/10"
      )}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: reducedMotion ? 0 : 0.15 }}
      data-testid={`journey-card-compact-${journey.id}`}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
        style={{ backgroundColor: journey.pathColor }}
      >
        {journey.profileLabel.charAt(0)}
      </div>
      <div className="text-left">
        <div className="text-xs font-medium text-white truncate max-w-[100px]">
          {getOutcomeLabel(journey.outcome)}
        </div>
        <div className="text-[10px] text-slate-400">
          {journey.durationMonths}mo
        </div>
      </div>
    </motion.button>
  );
}
