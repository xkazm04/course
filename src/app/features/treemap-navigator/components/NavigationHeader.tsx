"use client";

/**
 * NavigationHeader component for treemap navigation
 *
 * Combined navigation header with back button, breadcrumbs, and level indicator.
 * Only renders when not at root level (currentPath has items).
 *
 * Requirements covered:
 * - REQ-NAV-02: Back navigation button - visible, retreats one level, disabled at root
 * - REQ-NAV-04: Breadcrumb trail shows path from root to current level
 * - REQ-NAV-05: Clicking any breadcrumb segment navigates directly to that level
 * - REQ-NAV-06: Current level indicator - shows depth (Level X of 5)
 */

import { memo } from "react";
import { Breadcrumbs } from "./Breadcrumbs";
import { BackButton } from "./BackButton";
import { ResetButton } from "./ResetButton";
import { LevelIndicator } from "./LevelIndicator";
import type { BreadcrumbItem } from "../lib/types";

export interface NavigationHeaderProps {
  currentPath: BreadcrumbItem[];
  currentDepth: number;
  onGoBack: () => void;
  onNavigate: (index: number) => void;
  onReset: () => void;
  isTransitioning?: boolean;
}

export const NavigationHeader = memo(function NavigationHeader({
  currentPath,
  currentDepth,
  onGoBack,
  onNavigate,
  onReset,
  isTransitioning = false,
}: NavigationHeaderProps) {
  // Don't render at root level
  if (currentPath.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-black/40 backdrop-blur-sm rounded-lg border border-white/10">
      {/* Back button */}
      <BackButton
        onBack={onGoBack}
        disabled={currentPath.length === 0}
        isTransitioning={isTransitioning}
      />

      {/* Reset button */}
      <ResetButton
        onReset={onReset}
        isAtRoot={currentPath.length === 0}
        isTransitioning={isTransitioning}
      />

      {/* Divider */}
      <div className="h-5 w-px bg-white/20" aria-hidden="true" />

      {/* Breadcrumbs */}
      <div className="flex-1 min-w-0">
        <Breadcrumbs
          items={currentPath}
          onNavigate={onNavigate}
          isTransitioning={isTransitioning}
        />
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-white/20" aria-hidden="true" />

      {/* Level indicator */}
      <LevelIndicator currentDepth={currentDepth} />
    </div>
  );
});
