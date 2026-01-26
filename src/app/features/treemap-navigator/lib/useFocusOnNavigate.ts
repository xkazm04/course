"use client";

import { useRef, useEffect } from "react";

/**
 * Hook that manages focus after navigation completes.
 *
 * When the path changes (navigation occurred) and loading finishes,
 * focus moves to the first focusable territory element.
 *
 * This satisfies REQ-A11Y-02: Focus moves logically after drill-down.
 */
export function useFocusOnNavigate(
  currentPathLength: number,
  isLoading: boolean
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousPathLength = useRef(currentPathLength);
  const wasLoading = useRef(false);

  useEffect(() => {
    // Track loading state transitions
    const justFinishedLoading = wasLoading.current && !isLoading;
    const pathChanged = currentPathLength !== previousPathLength.current;

    // Focus after navigation completes (path changed and loading finished)
    if (pathChanged && justFinishedLoading) {
      // Small delay allows animation to start before focus
      // Using requestAnimationFrame + setTimeout for reliability
      requestAnimationFrame(() => {
        setTimeout(() => {
          const firstFocusable = containerRef.current?.querySelector(
            '[role="button"], button, [tabindex="0"]'
          ) as HTMLElement | null;

          if (firstFocusable) {
            firstFocusable.focus();
          }
        }, 50);
      });
    }

    // Update refs for next render
    previousPathLength.current = currentPathLength;
    wasLoading.current = isLoading;
  }, [currentPathLength, isLoading]);

  return containerRef;
}
