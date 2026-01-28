"use client";

/**
 * DetailPanel component for treemap navigation
 *
 * Slide-out panel that displays details for leaf nodes (lessons).
 * Includes title, description placeholder, and Start button.
 *
 * Requirements covered:
 * - REQ-CON-01: Lesson preview before starting
 */

import { memo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { X } from "lucide-react";
import type { TreemapNode } from "../lib/types";

/**
 * Difficulty badge colors mapping
 */
const DIFFICULTY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  beginner: { bg: "rgba(74, 222, 128, 0.2)", text: "#4ade80", label: "Beginner" },
  intermediate: { bg: "rgba(251, 191, 36, 0.2)", text: "#fbbf24", label: "Intermediate" },
  advanced: { bg: "rgba(249, 115, 22, 0.2)", text: "#f97316", label: "Advanced" },
  expert: { bg: "rgba(248, 113, 113, 0.2)", text: "#f87171", label: "Expert" },
};

/**
 * Get Lucide icon component by name
 */
function getIconComponent(iconName: string | null): React.ComponentType<{ size?: number; className?: string }> | null {
  if (!iconName) return null;
  const pascalName = iconName
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
  return (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[pascalName] || null;
}

export interface DetailPanelProps {
  node: TreemapNode | null;
  onClose: () => void;
  onStart: (nodeId: string) => void;
}

/**
 * Capitalize the first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const DetailPanel = memo(function DetailPanel({
  node,
  onClose,
  onStart,
}: DetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle click outside and Escape key
  useEffect(() => {
    if (!node) return;

    // Delay adding listeners to prevent immediate trigger on click that opened panel
    const timeoutId = setTimeout(() => {
      function handleClickOutside(e: MouseEvent) {
        if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
          onClose();
        }
      }

      function handleKeyDown(e: KeyboardEvent) {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown, true); // capture phase

      // Cleanup when node changes or unmounts
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown, true);
      };
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [node, onClose]);

  // Spring animation for slide-in effect
  const slideVariants = {
    initial: { opacity: 0, x: "100%" },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: "100%" },
  };

  const springTransition = {
    type: "spring" as const,
    damping: 25,
    stiffness: 300,
  };

  return (
    <AnimatePresence mode="wait">
      {node && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-panel-title"
            className="fixed right-0 top-0 h-full w-[500px] max-w-[90vw] bg-[var(--forge-bg-elevated)]/95 backdrop-blur-xl border-l border-[var(--forge-border-subtle)] z-50 flex flex-col"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={springTransition}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-[var(--forge-border-subtle)]">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-3 mb-2">
                  {/* Icon */}
                  {(() => {
                    const IconComponent = getIconComponent(node.icon);
                    return IconComponent ? (
                      <div className="p-2 rounded-lg bg-[var(--ember)]/20">
                        <IconComponent size={24} className="text-[var(--ember)]" />
                      </div>
                    ) : null;
                  })()}
                  <h2
                    id="detail-panel-title"
                    className="text-xl font-semibold text-white"
                  >
                    {node.label}
                  </h2>
                </div>
                {/* Subtitle from description */}
                {node.description && (
                  <p className="text-white/60 text-sm">{node.description}</p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close panel"
                className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Badges row */}
              <div className="flex flex-wrap gap-2">
                {/* Type badge */}
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-[var(--ember)]/20 text-[var(--ember)] border border-[var(--ember)]/30">
                  {capitalize(node.nodeType)}
                </span>
                {/* Difficulty badge */}
                {node.difficulty && DIFFICULTY_COLORS[node.difficulty] && (
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: DIFFICULTY_COLORS[node.difficulty].bg,
                      color: DIFFICULTY_COLORS[node.difficulty].text,
                    }}
                  >
                    {DIFFICULTY_COLORS[node.difficulty].label}
                  </span>
                )}
              </div>

              {/* Description / About section */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white/70">About</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {node.description || "Ready to explore this content? Click the button below to start your learning journey."}
                </p>
              </div>

              {/* Cover image placeholder (for future) */}
              {node.coverImageUrl && (
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={node.coverImageUrl}
                    alt={`Cover for ${node.label}`}
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              {/* Location / Depth indicator */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white/70">Location</h3>
                <p className="text-white/60 text-sm">
                  Level {node.depth + 1} • {node.childCount > 0 ? `${node.childCount} items inside` : "Leaf node"}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[var(--forge-border-subtle)]">
              <button
                onClick={() => onStart(node.id)}
                className="w-full py-3 px-6 rounded-xl font-medium text-white bg-[var(--ember)] hover:bg-[var(--ember-bright)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--ember)] focus:ring-offset-2 focus:ring-offset-[var(--forge-bg-elevated)]"
              >
                Start Lesson
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
