"use client";

import { memo, useState, useCallback } from "react";
import type { TreemapNode } from "../lib/types";
import { canShowLabel, calculateFontSize } from "../lib/layoutEngine";
import { ChildCountBadge } from "./ChildCountBadge";

export interface TerritoryProps {
  node: TreemapNode;
  onClick: (node: TreemapNode) => void;
  onKeyDown?: (e: React.KeyboardEvent, node: TreemapNode) => void;
  isFocused?: boolean;
}

/**
 * Territory component renders a single treemap node.
 *
 * Features:
 * - Dark background with glowing border on hover/focus
 * - Label text (hidden if node too small)
 * - Child count badge
 * - Keyboard accessible (Tab, Enter, Space)
 */
export const Territory = memo(function Territory({
  node,
  onClick,
  onKeyDown,
  isFocused = false,
}: TerritoryProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(() => {
    onClick(node);
  }, [onClick, node]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick(node);
      }
      onKeyDown?.(e, node);
    },
    [onClick, onKeyDown, node]
  );

  const showLabel = canShowLabel(node);
  const fontSize = calculateFontSize(node);

  // Visual state
  const isActive = isHovered || isFocused;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={
        node.nodeType === "lesson" || node.childCount === 0
          ? `${node.label}. Lesson. Press Enter to view details.`
          : `${node.label}. ${node.childCount} ${node.childCount === 1 ? "item" : "items"}. Press Enter to explore.`
      }
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="absolute cursor-pointer transition-all duration-150 ease-out"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        backgroundColor: node.color,
        border: `1px solid ${isActive ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.1)"}`,
        borderRadius: "4px",
        boxShadow: isActive
          ? `0 0 20px ${node.color}80, inset 0 1px 0 rgba(255,255,255,0.1)`
          : "inset 0 1px 0 rgba(255,255,255,0.05)",
        transform: isActive ? "scale(1.02)" : "scale(1)",
        zIndex: isActive ? 10 : 1,
      }}
    >
      {/* Child count badge - positioned relative to Territory, not affected by flex centering */}
      <ChildCountBadge count={node.childCount} nodeWidth={node.width} />

      {/* Content container */}
      <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden p-2">
        {/* Label */}
        {showLabel && (
          <span
            className="max-w-full truncate text-center font-medium leading-tight text-white"
            style={{
              fontSize: `${fontSize}px`,
              textShadow: "0 1px 2px rgba(0, 0, 0, 0.5), 0 0 8px rgba(0, 0, 0, 0.3)",
            }}
          >
            {node.label}
          </span>
        )}
      </div>

      {/* Focus ring (keyboard navigation) */}
      {isFocused && (
        <div
          className="pointer-events-none absolute inset-0 rounded"
          style={{
            border: "2px solid var(--ember-bright)",
            boxShadow: "0 0 0 2px rgba(234, 88, 12, 0.3)",
          }}
        />
      )}
    </div>
  );
});
