"use client";

import React from "react";
import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { useSectionBookmarks } from "../lib/useBookmarks";

interface BookmarkIndicatorProps {
    courseId: string;
    chapterId: string;
    sectionId: string;
    className?: string;
    size?: "sm" | "md";
}

export const BookmarkIndicator: React.FC<BookmarkIndicatorProps> = ({
    courseId,
    chapterId,
    sectionId,
    className,
    size = "sm",
}) => {
    const { bookmarks } = useSectionBookmarks(courseId, chapterId, sectionId);
    const hasBookmark = bookmarks.length > 0;

    if (!hasBookmark) return null;

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
                "text-[var(--ember)]",
                className
            )}
            title="Has bookmark"
            data-testid={`bookmark-indicator-${sectionId}`}
        >
            <Bookmark size={size === "sm" ? ICON_SIZES.xs : ICON_SIZES.sm} fill="currentColor" />
        </motion.div>
    );
};
