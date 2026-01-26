"use client";

import { memo } from "react";

export interface ChildCountBadgeProps {
  count: number;
  nodeWidth: number;
}

/**
 * ChildCountBadge displays the number of children in a territory node.
 *
 * Only renders when:
 * - count > 0 (non-leaf nodes only)
 * - nodeWidth > 80px (prevents overlap on small nodes)
 */
export const ChildCountBadge = memo(function ChildCountBadge({
  count,
  nodeWidth,
}: ChildCountBadgeProps) {
  // Hide badge for leaf nodes or small territories
  if (count === 0 || nodeWidth <= 80) {
    return null;
  }

  return (
    <span className="absolute right-2 top-2 rounded-full border border-white/10 bg-white/15 px-2 py-0.5 text-xs text-white/90 backdrop-blur-sm">
      {count}
    </span>
  );
});
