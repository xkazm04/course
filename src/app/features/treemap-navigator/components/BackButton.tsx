"use client";

/**
 * BackButton component for treemap navigation
 *
 * Provides a visible way to go back one level (in addition to Escape key).
 * Uses Framer Motion for subtle scale animation on hover/tap.
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import clsx from "clsx";

export interface BackButtonProps {
  onBack: () => void;
  disabled: boolean;
  isTransitioning?: boolean;
}

export const BackButton = memo(function BackButton({
  onBack,
  disabled,
  isTransitioning = false,
}: BackButtonProps) {
  const isDisabled = disabled || isTransitioning;

  return (
    <motion.button
      onClick={onBack}
      disabled={isDisabled}
      className={clsx(
        "p-2 rounded-md transition-colors",
        isDisabled
          ? "text-white/30 cursor-not-allowed"
          : "text-white/70 hover:text-white hover:bg-white/10"
      )}
      whileHover={!isDisabled ? { scale: 1.05 } : {}}
      whileTap={!isDisabled ? { scale: 0.95 } : {}}
      aria-label="Go back one level"
      title={disabled ? "Already at root" : "Go back (Escape)"}
    >
      <ChevronLeft size={20} />
    </motion.button>
  );
});
