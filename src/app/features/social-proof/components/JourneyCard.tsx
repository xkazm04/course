"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import type { LearnerJourney } from "../lib/types";
import { getOutcomeLabel, getStartingPointLabel } from "../lib/mockData";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

interface JourneyCardProps {
  journey: LearnerJourney;
  isSelected: boolean;
  onSelect: () => void;
  reducedMotion: boolean;
}

/**
 * Card displaying journey details when a path is selected
 */
export function JourneyCard({
  journey,
  isSelected,
  onSelect,
  reducedMotion,
}: JourneyCardProps) {
  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-4 rounded-xl border backdrop-blur-md transition-all",
        isSelected
          ? "border-[var(--forge-accent-ember)]/50 bg-[var(--forge-accent-ember)]/20"
          : "border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/50 hover:bg-[var(--forge-bg-elevated)]"
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
              <div className="font-medium truncate text-[var(--forge-text-primary)]">
                {journey.profileLabel}
              </div>
              <div className="text-xs truncate text-[var(--forge-text-muted)]">
                {getStartingPointLabel(journey.startingPoint)}
                {journey.previousField && ` from ${journey.previousField}`}
              </div>
            </div>
          </div>

          {/* Outcome */}
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowRight
              size={ICON_SIZES.sm}
              className="text-[var(--forge-text-muted)]"
            />
            <span className="text-sm font-medium text-[var(--forge-accent-ember)]">
              {getOutcomeLabel(journey.outcome)}
            </span>
          </div>

          {/* Duration and activity */}
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-[var(--forge-text-muted)]">
              <Clock size={ICON_SIZES.xs} />
              {journey.durationMonths} months
            </span>
            <span className="flex items-center gap-1 text-[var(--forge-accent-spark)]">
              <Sparkles size={ICON_SIZES.xs} />
              {Math.round(journey.activityLevel * 100)}% active
            </span>
          </div>

          {/* Testimonial */}
          {journey.testimonial && isSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 pt-3 border-t text-sm italic border-[var(--forge-border-subtle)] text-[var(--forge-text-secondary)]"
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
          ? "border-[var(--forge-accent-ember)]/50 bg-[var(--forge-accent-ember)]/20"
          : "border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]/50 hover:bg-[var(--forge-bg-elevated)]"
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
        <div className="text-xs font-medium text-[var(--forge-text-primary)] truncate max-w-[100px]">
          {getOutcomeLabel(journey.outcome)}
        </div>
        <div className="text-[10px] text-[var(--forge-text-muted)]">
          {journey.durationMonths}mo
        </div>
      </div>
    </motion.button>
  );
}
