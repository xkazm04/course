"use client";

import React, { useMemo, memo, Suspense, lazy } from "react";
import { CodePlaygroundSkeleton, type CodeFile } from "@/app/features/code-playground";
import type { PlaygroundSlot } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";

// Lazy load the heavy CodePlayground component
// This reduces initial bundle size for non-IDE mode users (classic/expandable)
const LazyCodePlayground = lazy(() =>
    import("@/app/features/code-playground/components/CodePlayground").then(
        (mod) => ({ default: mod.CodePlayground })
    )
);

// Sample code files for the playground
const defaultFiles: CodeFile[] = [
    {
        id: "app-jsx",
        name: "App.jsx",
        language: "jsx",
        isEntry: true,
        content: `export default function App() {
  const [isOn, setIsOn] = React.useState(false);

  return (
    <div style={{
      padding: '40px',
      textAlign: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ marginBottom: '24px', color: '#1e293b' }}>
        Toggle Component Demo
      </h1>

      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        margin: '0 auto 24px',
        background: isOn
          ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
          : '#94a3b8',
        boxShadow: isOn
          ? '0 0 40px rgba(251, 191, 36, 0.6)'
          : 'none',
        transition: 'all 0.3s ease'
      }} />

      <p style={{ marginBottom: '16px', color: '#64748b' }}>
        The light is {isOn ? 'ON' : 'OFF'}
      </p>

      <button
        onClick={() => setIsOn(!isOn)}
        style={{
          padding: '12px 32px',
          fontSize: '16px',
          fontWeight: '600',
          color: 'white',
          background: isOn ? '#ef4444' : '#22c55e',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        {isOn ? 'Turn Off' : 'Turn On'}
      </button>
    </div>
  );
}`,
    },
];

export interface PlaygroundSlotRendererProps {
    slot: PlaygroundSlot;
    state: ChapterState;
    className?: string;
    files?: CodeFile[];
}

/**
 * PlaygroundSlotRenderer - Renders interactive code playground with lazy loading
 *
 * Uses React.lazy() and Suspense to defer loading the heavy CodePlayground component.
 * This reduces initial bundle size for users visiting classic/expandable modes,
 * as the IDE mode is the heaviest variant with ~400 lines and heavy dependencies.
 *
 * Memoized to prevent re-renders when unrelated ChapterState properties change.
 * This component only depends on slot data and files prop, not on state.
 */
const PlaygroundSlotRendererComponent: React.FC<PlaygroundSlotRendererProps> = ({
    slot,
    className,
    files,
}) => {
    const { data } = slot;

    // Memoize playground props
    const playgroundProps = useMemo(() => ({
        playgroundId: data.playgroundId,
        title: data.title,
        showFileExplorer: data.showFileExplorer ?? true,
        height: data.height ?? "700px",
    }), [data.playgroundId, data.title, data.showFileExplorer, data.height]);

    // Memoize files to use
    const playgroundFiles = useMemo(() => files ?? defaultFiles, [files]);

    // Memoize skeleton height to match playground
    const skeletonHeight = useMemo(() => data.height ?? "700px", [data.height]);

    return (
        <div className={className} data-testid={`playground-slot-${slot.id}`}>
            <Suspense
                fallback={
                    <CodePlaygroundSkeleton
                        height={skeletonHeight}
                        data-testid={`playground-skeleton-${slot.id}`}
                    />
                }
            >
                <LazyCodePlayground
                    {...playgroundProps}
                    initialFiles={playgroundFiles}
                />
            </Suspense>
        </div>
    );
};

/**
 * Custom comparison function for PlaygroundSlotRenderer
 * Only re-renders when slot, className, or files change (not state)
 */
function arePlaygroundPropsEqual(
    prevProps: PlaygroundSlotRendererProps,
    nextProps: PlaygroundSlotRendererProps
): boolean {
    if (prevProps.slot.id !== nextProps.slot.id) return false;
    if (prevProps.className !== nextProps.className) return false;
    if (prevProps.files !== nextProps.files) return false;

    const prevData = prevProps.slot.data;
    const nextData = nextProps.slot.data;
    return (
        prevData.playgroundId === nextData.playgroundId &&
        prevData.title === nextData.title &&
        prevData.showFileExplorer === nextData.showFileExplorer &&
        prevData.height === nextData.height
    );
}

export const PlaygroundSlotRenderer = memo(PlaygroundSlotRendererComponent, arePlaygroundPropsEqual);

export default PlaygroundSlotRenderer;
