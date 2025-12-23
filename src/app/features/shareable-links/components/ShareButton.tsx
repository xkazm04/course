"use client";

import React from "react";
import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { LearningPath } from "@/app/shared/lib/types";

interface ShareButtonProps {
    /** The learning path to share */
    path: LearningPath;
    /** Click handler to open share modal */
    onShare: (path: LearningPath) => void;
    /** Button size variant */
    size?: "sm" | "md" | "lg";
    /** Show label text */
    showLabel?: boolean;
    /** Additional className */
    className?: string;
}

const sizeStyles = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-3",
};

const iconSizes = {
    sm: ICON_SIZES.xs,
    md: ICON_SIZES.sm,
    lg: ICON_SIZES.md,
};

export const ShareButton: React.FC<ShareButtonProps> = ({
    path,
    onShare,
    size = "md",
    showLabel = false,
    className,
}) => {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onShare(path);
    };

    return (
        <motion.button
            data-testid={`share-path-${path.id}-btn`}
            onClick={handleClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={cn(
                "flex items-center gap-1.5 rounded-lg transition-colors",
                "bg-[var(--surface-elevated)] hover:bg-[var(--surface-overlay)]",
                "border border-[var(--border-default)] hover:border-[var(--border-strong)]",
                "text-[var(--text-muted)] hover:text-[var(--text-primary)]",
                sizeStyles[size],
                className
            )}
            aria-label={`Share ${path.name} learning path`}
        >
            <Share2 size={iconSizes[size]} />
            {showLabel && (
                <span className="text-xs font-medium">Share</span>
            )}
        </motion.button>
    );
};

export default ShareButton;
