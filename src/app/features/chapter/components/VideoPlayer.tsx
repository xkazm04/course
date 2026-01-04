"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Video, ExternalLink, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import type { VideoVariant } from "../lib/contentSlots";

// ============================================================================
// Types
// ============================================================================

interface VideoPlayerProps {
    variants: VideoVariant[];
    selectedIndex?: number;
    onSelectVariant?: (index: number) => void;
    className?: string;
}

// ============================================================================
// Video Placeholder - Shown when no YouTube video is available
// ============================================================================

interface VideoPlaceholderProps {
    searchQuery?: string;
    title?: string;
}

function VideoPlaceholder({ searchQuery, title }: VideoPlaceholderProps) {
    const youtubeSearchUrl = searchQuery
        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`
        : null;

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[var(--forge-bg-void)] via-[var(--forge-bg-anvil)] to-[var(--forge-bg-void)]">
            {/* Decorative background */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,var(--ember)_0%,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,var(--ember-glow)_0%,transparent_50%)]" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-md">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Video className="w-10 h-10 text-white/40" />
                </div>

                <h3 className="text-xl font-semibold text-white/90 mb-2">
                    {title || "Video Coming Soon"}
                </h3>
                <p className="text-sm text-white/50 mb-6">
                    We're preparing the video content for this section.
                    {searchQuery && " In the meantime, you can search for related content on YouTube."}
                </p>

                {youtubeSearchUrl && (
                    <a
                        href={youtubeSearchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-600/20"
                    >
                        <Search className="w-4 h-4" />
                        Search on YouTube
                        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </a>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// YouTube Embed - Responsive YouTube iframe
// ============================================================================

interface YouTubeEmbedProps {
    youtubeId: string;
    title?: string;
}

function YouTubeEmbed({ youtubeId, title }: YouTubeEmbedProps) {
    return (
        <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            title={title || "Video"}
        />
    );
}

// ============================================================================
// Video Thumbnail - Clickable thumbnail for video selection
// ============================================================================

interface VideoThumbnailProps {
    variant: VideoVariant;
    isSelected: boolean;
    onClick: () => void;
}

function VideoThumbnail({ variant, isSelected, onClick }: VideoThumbnailProps) {
    // YouTube thumbnail URL (medium quality)
    const thumbnailUrl = variant.youtubeId
        ? `https://img.youtube.com/vi/${variant.youtubeId}/mqdefault.jpg`
        : null;

    return (
        <button
            onClick={onClick}
            className={cn(
                "relative flex-shrink-0 w-32 rounded-lg overflow-hidden transition-all",
                "border-2",
                isSelected
                    ? "border-[var(--ember)] ring-2 ring-[var(--ember)]/30"
                    : "border-transparent hover:border-white/20"
            )}
        >
            {/* Thumbnail */}
            <div className="aspect-video bg-[var(--forge-bg-void)] relative">
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={variant.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--forge-bg-elevated)] to-[var(--forge-bg-void)]">
                        <Video className="w-6 h-6 text-white/30" />
                    </div>
                )}

                {/* Play overlay */}
                <div className={cn(
                    "absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity",
                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}>
                    <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center">
                        <Play className="w-4 h-4 text-black ml-0.5" />
                    </div>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--ember)]" />
                )}
            </div>

            {/* Title */}
            <div className="p-2 bg-[var(--forge-bg-elevated)]">
                <p className="text-xs text-white/80 truncate font-medium">{variant.title}</p>
                {variant.instructorName && (
                    <p className="text-[10px] text-white/50 truncate">{variant.instructorName}</p>
                )}
            </div>
        </button>
    );
}

// ============================================================================
// Video Thumbnail Row - Horizontal scrollable row of thumbnails
// ============================================================================

interface VideoThumbnailRowProps {
    variants: VideoVariant[];
    selectedIndex: number;
    onSelect: (index: number) => void;
}

function VideoThumbnailRow({ variants, selectedIndex, onSelect }: VideoThumbnailRowProps) {
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
    }, []);

    const scroll = useCallback((direction: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        const scrollAmount = 200;
        el.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    }, []);

    if (variants.length <= 1) return null;

    return (
        <div className="relative mt-3">
            {/* Scroll buttons */}
            {canScrollLeft && (
                <button
                    onClick={() => scroll("left")}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
            )}
            {canScrollRight && (
                <button
                    onClick={() => scroll("right")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            )}

            {/* Thumbnails */}
            <div
                ref={scrollRef}
                onScroll={updateScrollState}
                className="flex gap-3 overflow-x-auto scrollbar-hide px-1 py-1"
            >
                {variants.map((variant, index) => (
                    <VideoThumbnail
                        key={variant.id}
                        variant={variant}
                        isSelected={index === selectedIndex}
                        onClick={() => onSelect(index)}
                    />
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// Main Video Player Component
// ============================================================================

export function VideoPlayer({
    variants,
    selectedIndex = 0,
    onSelectVariant,
    className,
}: VideoPlayerProps) {
    const [internalSelectedIndex, setInternalSelectedIndex] = useState(selectedIndex);
    const currentIndex = onSelectVariant ? selectedIndex : internalSelectedIndex;
    const currentVariant = variants[currentIndex];

    const handleSelect = useCallback((index: number) => {
        if (onSelectVariant) {
            onSelectVariant(index);
        } else {
            setInternalSelectedIndex(index);
        }
    }, [onSelectVariant]);

    const hasVideo = Boolean(currentVariant?.youtubeId);
    const hasMultipleVideos = variants.length > 1;

    return (
        <div className={cn("space-y-0", className)}>
            {/* Main Video Container */}
            <div className="relative aspect-video max-h-[520px] bg-[var(--forge-bg-void)] rounded-xl overflow-hidden border border-[var(--forge-border-subtle)]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentVariant?.id || "placeholder"}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0"
                    >
                        {hasVideo ? (
                            <YouTubeEmbed
                                youtubeId={currentVariant.youtubeId!}
                                title={currentVariant.title}
                            />
                        ) : (
                            <VideoPlaceholder
                                searchQuery={currentVariant?.searchQuery}
                                title={currentVariant?.title}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Video Thumbnails Row */}
            {hasMultipleVideos && (
                <VideoThumbnailRow
                    variants={variants}
                    selectedIndex={currentIndex}
                    onSelect={handleSelect}
                />
            )}

            {/* Current Video Info */}
            {currentVariant && (
                <div className="mt-3 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-[var(--forge-text-primary)]">
                            {currentVariant.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-[var(--forge-text-muted)]">
                            {currentVariant.instructorName && (
                                <span>{currentVariant.instructorName}</span>
                            )}
                            {currentVariant.style && (
                                <span className="capitalize px-2 py-0.5 rounded bg-[var(--forge-bg-elevated)] text-xs">
                                    {currentVariant.style}
                                </span>
                            )}
                            {currentVariant.duration && (
                                <span>{currentVariant.duration}</span>
                            )}
                        </div>
                    </div>
                    {hasMultipleVideos && (
                        <span className="text-sm text-[var(--forge-text-muted)]">
                            {currentIndex + 1} of {variants.length} videos
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

export default VideoPlayer;
