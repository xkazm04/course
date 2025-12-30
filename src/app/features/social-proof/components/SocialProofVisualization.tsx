"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/app/shared/lib/utils";
import { useReducedMotion } from "@/app/shared/lib/motionPrimitives";
import type { LearnerJourney, LearnerStartingPoint } from "../lib/types";
import {
  mockLearnerJourneys,
  calculatePathStats,
} from "../lib/mockData";
import { LearnerPath } from "./LearnerPath";
import { JourneyCard, JourneyCardCompact } from "./JourneyCard";
import { PathFilter, PathFilterCompact } from "./PathFilter";
import { SocialProofStats, SocialProofStatsCompact } from "./SocialProofStats";

export interface SocialProofVisualizationProps {
  className?: string;
  compact?: boolean;
}

/**
 * Social Proof Visualization Component
 *
 * Displays animated learner journeys through the knowledge graph,
 * showing real (anonymized) paths that users have taken to achieve
 * their career transformations.
 *
 * Features:
 * - Animated SVG paths showing skill trajectories
 * - Filtering by starting point (beginner, career switcher, etc.)
 * - Journey cards with testimonials
 * - Pulsing activity indicators
 * - Social proof statistics
 */
export function SocialProofVisualization({
  className,
  compact = false,
}: SocialProofVisualizationProps) {
  const prefersReducedMotion = useReducedMotion();
  const [selectedFilter, setSelectedFilter] = useState<LearnerStartingPoint | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<string | null>(null);

  // Filter journeys based on selected starting point
  const filteredJourneys = useMemo(() => {
    if (selectedFilter === null) return mockLearnerJourneys;
    return mockLearnerJourneys.filter(
      (journey) => journey.startingPoint === selectedFilter
    );
  }, [selectedFilter]);

  // Calculate stats
  const stats = useMemo(() => calculatePathStats(), []);

  // Handle filter change
  const handleFilterChange = useCallback((filter: LearnerStartingPoint | null) => {
    setSelectedFilter(filter);
    setSelectedJourney(null); // Reset selection when filter changes
  }, []);

  // Handle journey selection
  const handleJourneySelect = useCallback((journeyId: string) => {
    setSelectedJourney((prev) => (prev === journeyId ? null : journeyId));
  }, []);

  if (compact) {
    return (
      <CompactVisualization
        journeys={filteredJourneys}
        selectedFilter={selectedFilter}
        selectedJourney={selectedJourney}
        onFilterChange={handleFilterChange}
        onJourneySelect={handleJourneySelect}
        reducedMotion={prefersReducedMotion}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn("relative w-full", className)}
      data-testid="social-proof-visualization"
    >
      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-3 text-[var(--forge-text-primary)]">
          Real Learner Journeys
        </h2>
        <p className="text-lg max-w-2xl mx-auto text-[var(--forge-text-secondary)]">
          See how others like you transformed their careers through our platform.
          Each path represents a real success story.
        </p>
      </motion.div>

      {/* Stats */}
      <div className="mb-8">
        <SocialProofStats
          stats={stats}
          reducedMotion={prefersReducedMotion}
        />
      </div>

      {/* Filter */}
      <div className="mb-8">
        <motion.p
          className="text-center text-sm mb-4 text-[var(--forge-text-muted)]"
          initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
        >
          Filter by your starting point to see paths from people like you:
        </motion.p>
        <PathFilter
          selectedFilter={selectedFilter}
          onFilterChange={handleFilterChange}
          reducedMotion={prefersReducedMotion}
        />
      </div>

      {/* Main visualization */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* SVG Path Visualization */}
        <div
          className="flex-1 relative rounded-2xl overflow-hidden border bg-[var(--forge-bg-anvil)]/50 border-[var(--forge-border-subtle)]"
          style={{ minHeight: "400px" }}
        >
          {/* Background grid */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(to right, var(--forge-border-subtle) 1px, transparent 1px),
                linear-gradient(to bottom, var(--forge-border-subtle) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
            }}
          />

          {/* SVG Canvas */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-full"
            data-testid="path-visualization-svg"
          >
            {/* Gradient definitions */}
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-white" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Learner paths */}
            <AnimatePresence mode="wait">
              {filteredJourneys.map((journey, index) => (
                <LearnerPath
                  key={journey.id}
                  journey={journey}
                  isHighlighted={
                    selectedJourney === null || selectedJourney === journey.id
                  }
                  reducedMotion={prefersReducedMotion}
                  index={index}
                />
              ))}
            </AnimatePresence>

            {/* Start label */}
            <text
              x="5"
              y="95"
              className="text-[4px] font-medium fill-[var(--forge-text-muted)]"
            >
              START
            </text>

            {/* End label */}
            <text
              x="90"
              y="95"
              className="text-[4px] font-medium fill-[var(--forge-text-muted)]"
            >
              CAREER GOAL
            </text>
          </svg>

          {/* Empty state */}
          {filteredJourneys.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-lg text-[var(--forge-text-muted)]">
                No paths found for this filter
              </p>
            </div>
          )}
        </div>

        {/* Journey cards sidebar */}
        <div className="lg:w-80 space-y-3 max-h-[500px] overflow-y-auto">
          <AnimatePresence mode="popLayout">
            {filteredJourneys.map((journey) => (
              <JourneyCard
                key={journey.id}
                journey={journey}
                isSelected={selectedJourney === journey.id}
                onSelect={() => handleJourneySelect(journey.id)}
                reducedMotion={prefersReducedMotion}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact visualization for landing page integration
 */
interface CompactVisualizationProps {
  journeys: LearnerJourney[];
  selectedFilter: LearnerStartingPoint | null;
  selectedJourney: string | null;
  onFilterChange: (filter: LearnerStartingPoint | null) => void;
  onJourneySelect: (id: string) => void;
  reducedMotion: boolean;
  className?: string;
}

function CompactVisualization({
  journeys,
  selectedFilter,
  selectedJourney,
  onFilterChange,
  onJourneySelect,
  reducedMotion,
  className,
}: CompactVisualizationProps) {
  const stats = useMemo(() => calculatePathStats(), []);

  return (
    <div
      className={cn("relative w-full", className)}
      data-testid="social-proof-visualization-compact"
    >
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-[var(--forge-text-primary)] mb-1">
            Active Learning Paths
          </h3>
          <SocialProofStatsCompact stats={stats} reducedMotion={reducedMotion} />
        </div>
      </div>

      {/* Compact filter */}
      <PathFilterCompact
        selectedFilter={selectedFilter}
        onFilterChange={onFilterChange}
        reducedMotion={reducedMotion}
      />

      {/* Mini visualization */}
      <div className="mt-4 relative rounded-xl overflow-hidden bg-[var(--forge-bg-anvil)]/50 border border-[var(--forge-border-subtle)] h-48">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
          data-testid="path-visualization-svg-compact"
        >
          <defs>
            <filter id="glow-compact" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {journeys.slice(0, 4).map((journey, index) => (
            <LearnerPath
              key={journey.id}
              journey={journey}
              isHighlighted={
                selectedJourney === null || selectedJourney === journey.id
              }
              reducedMotion={reducedMotion}
              index={index}
            />
          ))}
        </svg>
      </div>

      {/* Compact journey cards */}
      <div className="flex flex-wrap gap-2 mt-4">
        {journeys.slice(0, 4).map((journey) => (
          <JourneyCardCompact
            key={journey.id}
            journey={journey}
            isSelected={selectedJourney === journey.id}
            onSelect={() => onJourneySelect(journey.id)}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
    </div>
  );
}
