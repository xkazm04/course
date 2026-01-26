"use client";

/**
 * EmptyState component for treemap navigation
 *
 * Displays an encouraging message when a level has no children.
 * Provides a Go Back button to return to the parent level.
 *
 * Requirements covered:
 * - REQ-VIS-05: Empty state handling - display clear message, not blank space
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { Layers, ArrowLeft } from "lucide-react";

export interface EmptyStateProps {
  onGoBack: () => void;
}

export const EmptyState = memo(function EmptyState({
  onGoBack,
}: EmptyStateProps) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Icon container */}
      <div className="w-16 h-16 rounded-full bg-[var(--ember)]/10 flex items-center justify-center">
        <Layers className="w-8 h-8 text-[var(--ember)]" />
      </div>

      {/* Heading */}
      <h2 className="text-lg font-medium text-[var(--forge-text-primary)]">
        Content Coming Soon
      </h2>

      {/* Subtext */}
      <p className="text-sm text-[var(--forge-text-muted)] max-w-xs">
        This area is still being developed. Explore other territories in the
        meantime!
      </p>

      {/* Go Back button */}
      <button
        onClick={onGoBack}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 transition-colors"
      >
        <ArrowLeft size={16} />
        <span>Go Back</span>
      </button>
    </motion.div>
  );
});
