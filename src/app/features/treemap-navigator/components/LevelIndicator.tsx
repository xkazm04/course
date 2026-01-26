"use client";

/**
 * LevelIndicator component for treemap navigation
 *
 * Visual indicator showing current depth in the hierarchy.
 * Displays "Level X of Y" text plus visual dots.
 */

import { memo } from "react";
import clsx from "clsx";

export interface LevelIndicatorProps {
  currentDepth: number;
  maxDepth?: number;
}

export const LevelIndicator = memo(function LevelIndicator({
  currentDepth,
  maxDepth = 5,
}: LevelIndicatorProps) {
  // currentDepth is 0 at root, but we display as "Level 1" for users
  const displayDepth = currentDepth + 1;

  return (
    <div className="flex items-center gap-2 text-sm text-white/70">
      <span>Level {displayDepth} of {maxDepth}</span>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: maxDepth }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              "w-2 h-2 rounded-full transition-colors duration-200",
              i < displayDepth
                ? i === displayDepth - 1
                  ? "bg-blue-400"        // Current level - brightest
                  : "bg-blue-400/50"     // Past levels - dimmer
                : "bg-white/20"          // Future levels - dimmest
            )}
          />
        ))}
      </div>
    </div>
  );
});
