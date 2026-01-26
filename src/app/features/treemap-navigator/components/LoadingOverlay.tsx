"use client";

import { memo } from "react";

export interface LoadingOverlayProps {
  isVisible: boolean;
}

/**
 * LoadingOverlay displays a centered spinner when loading.
 *
 * Requirements:
 * - REQ-VIS-04: Loading state - Spinner shown while fetching children
 */
export const LoadingOverlay = memo(function LoadingOverlay({
  isVisible,
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-3">
        {/* Spinner */}
        <div className="relative h-12 w-12">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-white/20" />
          {/* Spinning arc */}
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-400" />
        </div>

        {/* Label */}
        <span className="text-sm text-white/70">Loading...</span>
      </div>
    </div>
  );
});
