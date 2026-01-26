"use client";

/**
 * ResetButton component for treemap navigation
 *
 * Provides a way to reset navigation to root level from any depth.
 * Hidden at root level, visible when navigated into hierarchy.
 *
 * Requirements covered:
 * - REQ-CON-02: Reset to root level navigation
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { Home } from "lucide-react";
import clsx from "clsx";

export interface ResetButtonProps {
  onReset: () => void;
  isAtRoot: boolean;
  isTransitioning?: boolean;
}

export const ResetButton = memo(function ResetButton({
  onReset,
  isAtRoot,
  isTransitioning = false,
}: ResetButtonProps) {
  // Hidden at root level
  if (isAtRoot) {
    return null;
  }

  const isDisabled = isTransitioning;

  return (
    <motion.button
      onClick={onReset}
      disabled={isDisabled}
      className={clsx(
        "p-2 rounded-md transition-colors",
        isDisabled
          ? "text-white/30 cursor-not-allowed"
          : "text-white/70 hover:text-white hover:bg-white/10"
      )}
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      aria-label="Reset to root level"
      title="Go to root (Home)"
    >
      <Home size={20} />
    </motion.button>
  );
});
