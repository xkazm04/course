"use client";

/**
 * Video Lab - Remotion Code Animation Preview
 *
 * Consolidated hybrid approach combining:
 * - Cinematic shadow content and polished layout
 * - Typewriter character-by-character animation
 * - Split flow data visualization
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Film, Info, Zap, Clock, Layers, MessageSquare } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { HybridVariant } from "./variants/HybridVariant";

// ============================================================================
// SAMPLE CODE AND FLOW CONFIGURATION
// ============================================================================

const SAMPLE_CODE = `// React Hook: useDebounce
// A custom hook for debouncing rapidly changing values
import { useState, useEffect, useRef } from 'react';

/**
 * useDebounce - Delays updating a value until after a specified delay
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  // Store the debounced value in state
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  // Track if this is the first render
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip debouncing on first render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Set up timeout to update debounced value
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function: cancel timeout if value changes
    // This prevents stale updates from firing
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Example usage:
// const searchTerm = useDebounce(inputValue, 500);`;

const SAMPLE_FLOW_STEPS = [
  {
    label: "Hook Setup",
    description: "Import dependencies and define the hook signature with TypeScript generics.",
    highlight: [3, 11, 12, 13],
    charRange: [0, 350] as [number, number],
    stateChanges: { input: '""', timer: "null", output: '""' },
    activeNode: "input" as const,
    annotations: [
      "Generic type T preserves input type through the hook",
      "Delay parameter controls debounce timing",
      "Returns the same type as input for type safety",
    ],
  },
  {
    label: "State Init",
    description: "Initialize state to hold the debounced value and track first render.",
    highlight: [14, 15, 17, 18],
    charRange: [350, 520] as [number, number],
    stateChanges: { input: '"react"', timer: "null", output: '""' },
    activeNode: "input" as const,
    annotations: [
      "useState stores the debounced value",
      "useRef tracks first render to skip initial debounce",
      "Refs persist across renders without causing re-renders",
    ],
  },
  {
    label: "Effect Logic",
    description: "useEffect runs when value changes, skipping the first render.",
    highlight: [20, 21, 22, 23, 24, 25],
    charRange: [520, 720] as [number, number],
    stateChanges: { input: '"react"', timer: "pending", output: '""' },
    activeNode: "process" as const,
    annotations: [
      "useEffect reacts to value/delay changes",
      "First render check prevents unnecessary initial delay",
      "Early return pattern keeps code clean",
    ],
  },
  {
    label: "Timer Created",
    description: "setTimeout schedules the state update after the specified delay.",
    highlight: [27, 28, 29, 30],
    charRange: [720, 880] as [number, number],
    stateChanges: { input: '"react"', timer: "500ms", output: '""' },
    activeNode: "process" as const,
    annotations: [
      "setTimeout creates async delay",
      "State update scheduled for future execution",
      "Delay is configurable per use case",
    ],
  },
  {
    label: "Cleanup",
    description: "Cleanup function cancels pending timer when value changes.",
    highlight: [32, 33, 34, 35],
    charRange: [880, 1020] as [number, number],
    stateChanges: { input: '"hooks"', timer: "cleared", output: '""' },
    activeNode: "process" as const,
    annotations: [
      "Cleanup runs before next effect execution",
      "clearTimeout prevents stale updates",
      "Essential for avoiding race conditions",
    ],
  },
  {
    label: "Return Value",
    description: "The debounced value is returned and updates downstream consumers.",
    highlight: [38, 41, 42],
    charRange: [1020, SAMPLE_CODE.length] as [number, number],
    stateChanges: { input: '"hooks"', timer: "done", output: '"hooks"' },
    activeNode: "output" as const,
    annotations: [
      "Consumers receive stable, debounced value",
      "Only updates after delay completes",
      "Reduces unnecessary re-renders downstream",
    ],
  },
];

// ============================================================================
// FEATURE CARDS
// ============================================================================

const FEATURES = [
  {
    icon: Film,
    title: "Cinematic Layout",
    description: "Shadow preview of upcoming code with polished visual hierarchy",
  },
  {
    icon: Zap,
    title: "Typewriter Animation",
    description: "Character-by-character typing with variable speed and cursor",
  },
  {
    icon: Layers,
    title: "Flow Visualization",
    description: "Animated data flow diagram synced with code progression",
  },
];

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function VideoLabPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(true);

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleReset = () => {
    setIsPlaying(false);
    setResetKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-[var(--forge-bg-void)]">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--ember)] to-orange-600 flex items-center justify-center shadow-lg shadow-[var(--ember)]/20">
                <Film size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Remotion Video Lab</h1>
                <p className="text-sm text-white/50">Animated code walkthrough preview</p>
              </div>
            </div>

            {/* Feature pills */}
            <div className="hidden lg:flex items-center gap-2">
              {FEATURES.map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
                >
                  <feature.icon size={12} className="text-[var(--ember)]" />
                  <span className="text-xs text-white/60">{feature.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr,320px] gap-8">
          {/* Video Preview */}
          <div className="space-y-4">
            {/* Preview Container - taller aspect ratio for more code visibility */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50" style={{ aspectRatio: "16/10" }}>
              {/* Video Content */}
              <motion.div
                key={resetKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0"
              >
                <HybridVariant
                  code={SAMPLE_CODE}
                  flowSteps={SAMPLE_FLOW_STEPS}
                  isPlaying={isPlaying}
                  onComplete={() => setIsPlaying(false)}
                  showAnnotations={showAnnotations}
                />
              </motion.div>

              {/* Play overlay (when paused at start) */}
              {!isPlaying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                >
                  <button
                    onClick={handlePlay}
                    className="group relative"
                  >
                    {/* Glow */}
                    <div className="absolute inset-0 bg-[var(--ember)] rounded-full blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
                    {/* Button */}
                    <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-[var(--ember)] to-orange-600 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform">
                      <Play size={32} className="text-white ml-1" />
                    </div>
                  </button>
                </motion.div>
              )}

              {/* Remotion badge */}
              <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm border border-white/10">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-white/70">Remotion Preview</span>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <RotateCcw size={16} />
                Reset
              </button>
              <button
                onClick={isPlaying ? handlePause : handlePlay}
                className={cn(
                  "flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all",
                  isPlaying
                    ? "bg-white/10 text-white border border-white/20 hover:bg-white/15"
                    : "bg-gradient-to-r from-[var(--ember)] to-orange-600 text-white shadow-lg shadow-[var(--ember)]/20 hover:shadow-xl"
                )}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? "Pause" : "Play Animation"}
              </button>
              <button
                onClick={() => setShowAnnotations(!showAnnotations)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all",
                  showAnnotations
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                )}
                title="Toggle annotation sidebar"
              >
                <MessageSquare size={16} />
                Annotations
              </button>
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* About */}
            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Info size={18} className="text-[var(--ember)]" />
                Hybrid Approach
              </h3>
              <p className="text-sm text-white/60 leading-relaxed mb-4">
                This preview demonstrates the consolidated video animation style that combines the best
                elements from three distinct approaches into one cohesive experience.
              </p>
              <div className="space-y-3">
                {FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--ember)]/10 flex items-center justify-center flex-shrink-0">
                      <feature.icon size={14} className="text-[var(--ember)]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white/80">{feature.title}</div>
                      <div className="text-xs text-white/50">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Specs */}
            <div className="p-5 rounded-xl bg-violet-500/5 border border-violet-500/20">
              <h4 className="text-sm font-semibold text-violet-400 mb-4 flex items-center gap-2">
                <Layers size={14} />
                Remotion Specs
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-white/40 mb-1">Complexity</div>
                  <div className="text-sm font-medium text-amber-400">Medium</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Render Time</div>
                  <div className="text-sm font-medium text-white/70">~60s / 60s video</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Resolution</div>
                  <div className="text-sm font-medium text-white/70">1920×1080</div>
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">FPS</div>
                  <div className="text-sm font-medium text-white/70">30</div>
                </div>
              </div>
            </div>

            {/* Generation Note */}
            <div className="p-4 rounded-xl bg-[var(--ember)]/5 border border-[var(--ember)]/20">
              <p className="text-xs text-white/50 leading-relaxed">
                <span className="text-[var(--ember)] font-medium">Claude Code + Remotion:</span>{" "}
                This animation can be generated programmatically using{" "}
                <code className="px-1.5 py-0.5 bg-black/30 rounded text-[var(--ember)]">
                  npx remotion render
                </code>{" "}
                with lesson content extracted from the database.
              </p>
            </div>

            {/* Keyboard shortcuts */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="text-xs text-white/40 mb-3">Keyboard Shortcuts</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Play / Pause</span>
                  <kbd className="px-2 py-1 bg-white/5 rounded text-white/60">Space</kbd>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/50">Reset</span>
                  <kbd className="px-2 py-1 bg-white/5 rounded text-white/60">R</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
