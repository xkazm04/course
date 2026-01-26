"use client";

/**
 * Breadcrumbs Component
 *
 * Provides navigation trail for treemap hierarchy.
 * Shows path from root to current level with clickable segments.
 *
 * Requirements covered:
 * - REQ-NAV-04: Breadcrumb trail shows path from root to current level
 * - REQ-NAV-05: Clicking any breadcrumb segment navigates directly to that level
 * - REQ-A11Y-01: Keyboard accessible navigation
 */

import { memo } from "react";
import { Home, ChevronRight } from "lucide-react";
import clsx from "clsx";
import type { BreadcrumbItem } from "../lib/types";

// ============================================================================
// TYPES
// ============================================================================

export interface BreadcrumbsProps {
  /** Breadcrumb items from navigationStore currentPath */
  items: BreadcrumbItem[];
  /** Callback for clicking segments. -1 for root, otherwise index in items array */
  onNavigate: (index: number) => void;
  /** Disable clicks during animation/transition */
  isTransitioning?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// BREADCRUMBS COMPONENT
// ============================================================================

export const Breadcrumbs = memo(function Breadcrumbs({
  items,
  onNavigate,
  isTransitioning = false,
  className,
}: BreadcrumbsProps) {
  // Don't render if no items (at root level)
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className={clsx(
        "flex items-center gap-1.5 text-sm",
        isTransitioning && "pointer-events-none opacity-70",
        className
      )}
    >
      {/* Home button - returns to root */}
      <button
        type="button"
        onClick={() => onNavigate(-1)}
        className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Navigate to root"
      >
        <Home size={16} />
      </button>

      {/* Separator after home */}
      <ChevronRight size={14} className="text-white/30 flex-shrink-0" aria-hidden="true" />

      {/* Breadcrumb segments */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={item.id} className="flex items-center gap-1.5">
            {isLast ? (
              // Current level - not clickable
              <span
                className="px-2 py-1 rounded text-white/90 cursor-default"
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              // Clickable segment
              <button
                type="button"
                onClick={() => onNavigate(index)}
                className="px-2 py-1 rounded text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                {item.label}
              </button>
            )}

            {/* Separator between segments (not after last) */}
            {!isLast && (
              <ChevronRight size={14} className="text-white/30 flex-shrink-0" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </nav>
  );
});

export default Breadcrumbs;
