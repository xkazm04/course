"use client";

import { useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Wand2,
    ChevronLeft,
    Layers,
    Loader2,
    RotateCcw,
    RefreshCw,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { HexLayoutNode, NodeGenerationStatus } from "../lib/types";

interface NodeContextMenuProps {
    node: HexLayoutNode;
    position: { x: number; y: number };
    onClose: () => void;
    onOpenChapter: (nodeId: string) => void;
    onGenerateContent: (nodeId: string) => void;
    onRegenerateContent: (nodeId: string) => void;
    onDrillDown: (nodeId: string) => void;
    onGoBack: () => void;
    generationStatus?: NodeGenerationStatus;
    generationProgress?: number;
    canGoBack?: boolean;
}

interface MenuItemProps {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: "default" | "primary" | "warning";
    loading?: boolean;
    sublabel?: string;
}

function MenuItem({
    icon: Icon,
    label,
    onClick,
    disabled,
    variant = "default",
    loading,
    sublabel,
}: MenuItemProps) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled && !loading) {
                    onClick();
                }
            }}
            disabled={disabled || loading}
            className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-[var(--ember)] focus:ring-offset-1 focus:ring-offset-[var(--forge-bg-elevated)]",
                variant === "default" && "text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-anvil)]",
                variant === "primary" && "text-[var(--ember)] hover:bg-[var(--ember)]/10",
                variant === "warning" && "text-[var(--forge-warning)] hover:bg-[var(--forge-warning)]/10",
                (disabled || loading) && "opacity-50 cursor-not-allowed"
            )}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : (
                <Icon className="w-4 h-4 flex-shrink-0" />
            )}
            <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{label}</span>
                {sublabel && (
                    <span className="text-xs text-[var(--forge-text-muted)] truncate">
                        {sublabel}
                    </span>
                )}
            </div>
        </button>
    );
}

export function NodeContextMenu({
    node,
    position,
    onClose,
    onOpenChapter,
    onGenerateContent,
    onRegenerateContent,
    onDrillDown,
    onGoBack,
    generationStatus,
    generationProgress,
    canGoBack = true,
}: NodeContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    // Node type checks
    const isChapter = node.level === "chapter";

    // Content checks - courseId indicates content exists for chapters
    // For mock data, courseId is a string like "html-fundamentals"
    // For real data, it would be a UUID
    // Note: HexLayoutNode uses [key: string]: unknown so we need explicit access
    const courseIdRaw = node["courseId"];
    const courseId = typeof courseIdRaw === "string" ? courseIdRaw : undefined;
    const hasContent = isChapter && !!courseId;

    // Children check - childIds should always be an array but verify
    const childIdsRaw = node.childIds;
    const childIds = Array.isArray(childIdsRaw) ? childIdsRaw : [];
    const hasChildren = childIds.length > 0;

    // Generation state (for real database nodes with UUID IDs)
    const isGenerating = generationStatus === "generating" || generationStatus === "pending";
    const hasFailed = generationStatus === "failed";

    // A chapter is "ready" if it has content OR generation status is ready
    const isReady = hasContent || generationStatus === "ready";

    // For chapters without content, allow content generation
    const canGenerateContent = isChapter && !hasContent && !isGenerating && !hasFailed;

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    // Adjust position to keep menu in viewport
    const adjustedPosition = useCallback(() => {
        const menuWidth = 220;
        const menuHeight = 200;
        const padding = 16;

        let x = position.x;
        let y = position.y;

        // Check right edge
        if (x + menuWidth + padding > window.innerWidth) {
            x = window.innerWidth - menuWidth - padding;
        }

        // Check bottom edge
        if (y + menuHeight + padding > window.innerHeight) {
            y = window.innerHeight - menuHeight - padding;
        }

        // Ensure not off left/top edge
        x = Math.max(padding, x);
        y = Math.max(padding, y);

        return { x, y };
    }, [position]);

    const { x, y } = adjustedPosition();

    const handleOpenChapter = () => {
        onOpenChapter(node.id);
        onClose();
    };

    const handleGenerateContent = () => {
        onGenerateContent(node.id);
        onClose();
    };

    const handleRegenerateContent = () => {
        onRegenerateContent(node.id);
        onClose();
    };

    const handleDrillDown = () => {
        onDrillDown(node.id);
        onClose();
    };

    const handleGoBack = () => {
        onGoBack();
        onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.15 }}
                className="fixed z-[9999] w-56 py-2 bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] rounded-xl shadow-xl backdrop-blur-sm"
                style={{ left: x, top: y }}
            >
                {/* Node info header */}
                <div className="px-3 py-2 border-b border-[var(--forge-border-subtle)]">
                    <p className="text-xs text-[var(--forge-text-muted)] uppercase tracking-wide">
                        {node.level}
                    </p>
                    <p className="text-sm font-medium text-[var(--forge-text-primary)] truncate">
                        {node.name}
                    </p>
                    {/* Debug info - remove in production */}
                    {process.env.NODE_ENV === "development" && (
                        <div className="text-[10px] text-[var(--forge-text-muted)] mt-1 font-mono space-y-0.5">
                            <p>level: {node.level} | children: {childIds.length}</p>
                            <p>courseId: {courseId || "none"} | isChapter: {isChapter ? "Y" : "N"}</p>
                            <p>isReady: {isReady ? "Y" : "N"} | genStatus: {generationStatus || "none"}</p>
                        </div>
                    )}
                </div>

                {/* Menu items */}
                <div className="py-1">
                    {/* Chapter-specific options */}
                    {isChapter && (
                        <>
                            {/* Open chapter - if has content (courseId exists) */}
                            {isReady && (
                                <MenuItem
                                    icon={BookOpen}
                                    label="Open Chapter"
                                    onClick={handleOpenChapter}
                                    variant="primary"
                                />
                            )}

                            {/* Re-generate content - if has content and not currently generating */}
                            {hasContent && !isGenerating && (
                                <MenuItem
                                    icon={RefreshCw}
                                    label="Re-generate Content"
                                    onClick={handleRegenerateContent}
                                    sublabel="Delete and regenerate chapter"
                                />
                            )}

                            {/* Generate content - if no content and not generating */}
                            {canGenerateContent && (
                                <MenuItem
                                    icon={Wand2}
                                    label="Generate Content"
                                    onClick={handleGenerateContent}
                                    variant="primary"
                                    sublabel="AI-powered content creation"
                                />
                            )}

                            {/* Generating status */}
                            {isGenerating && (
                                <MenuItem
                                    icon={Loader2}
                                    label="Generating..."
                                    onClick={() => {}}
                                    loading
                                    sublabel={generationProgress ? `${generationProgress}%` : "Please wait"}
                                    disabled
                                />
                            )}

                            {/* Failed - show retry */}
                            {hasFailed && (
                                <MenuItem
                                    icon={RotateCcw}
                                    label="Retry Generation"
                                    onClick={handleGenerateContent}
                                    variant="warning"
                                    sublabel="Previous attempt failed"
                                />
                            )}
                        </>
                    )}

                    {/* Drill down - if has children (works for domains, courses, chapters) */}
                    {hasChildren && (
                        <MenuItem
                            icon={Layers}
                            label="View Contents"
                            onClick={handleDrillDown}
                            sublabel={`${childIds.length} ${node.level === "course" ? "chapters" : node.level === "chapter" ? "sections" : "items"}`}
                        />
                    )}

                    {/* Separator - show if we have any actions above Go Back */}
                    {(isChapter || hasChildren) && canGoBack && (
                        <div className="my-1 border-t border-[var(--forge-border-subtle)]" />
                    )}

                    {/* Go back */}
                    {canGoBack && (
                        <MenuItem
                            icon={ChevronLeft}
                            label="Go Back"
                            onClick={handleGoBack}
                        />
                    )}
                </div>

                {/* Status indicator for generation */}
                {isGenerating && generationProgress !== undefined && (
                    <div className="px-3 pb-2">
                        <div className="h-1 bg-[var(--forge-bg-anvil)] rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-[var(--ember)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${generationProgress}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
