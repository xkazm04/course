"use client";

import React, { useMemo, memo, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, ChevronDown, ExternalLink, Search } from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { TRANSITIONS } from "@/app/shared/lib/animationTiming";
import { PlaybackSpeedControl, SpeedIndicator, SpeedChangeToast } from "../components";
import { useBehaviorTrackingContext } from "../lib/BehaviorTrackingContext";
import type { VideoSlot, VideoVariant } from "../lib/contentSlots";
import type { ChapterState } from "../lib/useChapterState";

/**
 * Helper to parse time string (mm:ss or h:mm:ss) to seconds
 */
function parseTimeToSeconds(timeStr: string): number {
    const parts = timeStr.split(":").map(Number);
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
}

/**
 * Helper to format seconds to time string (mm:ss or h:mm:ss)
 */
function formatSecondsToTime(seconds: number, includeHours: boolean = false): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (includeHours || hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export interface VideoSlotRendererProps {
    slot: VideoSlot;
    state: ChapterState;
}

/**
 * VideoVariantSelector - Dropdown to select video variant
 */
interface VideoVariantSelectorProps {
    variants: VideoVariant[];
    selectedIndex: number;
    onSelect: (index: number) => void;
}

function VideoVariantSelector({ variants, selectedIndex, onSelect }: VideoVariantSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selectedVariant = variants[selectedIndex];

    if (variants.length <= 1) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] rounded-lg text-sm text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-bench)] transition-colors"
                data-testid="video-variant-selector-btn"
            >
                <span className="truncate max-w-[200px]">{selectedVariant?.title || "Select Video"}</span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute top-full left-0 right-0 mt-1 bg-[var(--forge-bg-elevated)] border border-[var(--forge-border-subtle)] rounded-lg shadow-xl z-20 overflow-hidden min-w-[280px]"
                        data-testid="video-variant-dropdown"
                    >
                        {variants.map((variant, index) => (
                            <button
                                key={variant.id}
                                onClick={() => {
                                    onSelect(index);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--forge-bg-bench)] transition-colors ${
                                    index === selectedIndex ? "bg-[var(--ember)]/10 text-[var(--ember)]" : "text-[var(--forge-text-secondary)]"
                                }`}
                                data-testid={`video-variant-item-${variant.id}`}
                            >
                                <div className="font-medium">{variant.title}</div>
                                <div className="text-xs text-[var(--forge-text-muted)] mt-0.5">
                                    {variant.style && <span className="capitalize">{variant.style}</span>}
                                    {variant.instructorName && <span> • {variant.instructorName}</span>}
                                    {variant.duration && <span> • {variant.duration}</span>}
                                </div>
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/**
 * VideoPlaceholder - Shown when no YouTube video is available
 */
interface VideoPlaceholderProps {
    searchQuery?: string;
    onTogglePlay?: () => void;
    isPlaying?: boolean;
}

function VideoPlaceholder({ searchQuery, onTogglePlay, isPlaying }: VideoPlaceholderProps) {
    const youtubeSearchUrl = searchQuery
        ? `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`
        : null;

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            {/* Play button overlay for mock mode */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onTogglePlay}
                className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20"
                data-testid="video-slot-play-btn"
            >
                {isPlaying ? <Pause size={ICON_SIZES.xl} /> : <Play size={ICON_SIZES.xl} className="ml-1" />}
            </motion.button>

            {/* Find video on YouTube link */}
            {youtubeSearchUrl && (
                <a
                    href={youtubeSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    data-testid="video-youtube-search-link"
                >
                    <Search size={16} />
                    Find Video on YouTube
                    <ExternalLink size={14} />
                </a>
            )}
        </div>
    );
}

/**
 * VideoSlotRenderer - Renders video player with YouTube embed or mock player
 *
 * Supports:
 * - YouTube iframe embedding when youtubeId is available
 * - Video variant selection when multiple variants exist
 * - Fallback to mock player with "Find on YouTube" link
 *
 * Memoized to prevent re-renders when unrelated ChapterState properties change.
 * Integrates with BehaviorTrackingContext for AI Conductor behavior tracking.
 */
const VideoSlotRendererComponent: React.FC<VideoSlotRendererProps> = ({ slot, state }) => {
    const {
        isPlaying,
        isMuted,
        showSpeedToast,
        speed,
        skipSilence,
        togglePlay,
        toggleMute,
        setSpeed,
        toggleSilenceSkip,
    } = state;

    const { data } = slot;

    // Behavior tracking context (available when wrapped in ConductorChapterView)
    const behaviorTracking = useBehaviorTrackingContext();

    // Video variant state
    const [selectedVariantIndex, setSelectedVariantIndex] = useState(data?.selectedVariantIndex ?? 0);

    // Progress bar hover and focus state
    const [isProgressHovered, setIsProgressHovered] = useState(false);
    const [isProgressFocused, setIsProgressFocused] = useState(false);
    const [hoverPosition, setHoverPosition] = useState<number>(0);
    const [hoverTime, setHoverTime] = useState<string>("");
    const [tooltipX, setTooltipX] = useState<number>(0);
    const [thumbPulse, setThumbPulse] = useState(false);
    const progressBarRef = useRef<HTMLDivElement>(null);

    // Track previous playing state and speed for detecting changes
    const prevIsPlayingRef = useRef(isPlaying);
    const prevSpeedRef = useRef(speed);
    const lastSeekPositionRef = useRef<number>(0);

    // Get video variants and current variant
    const videoVariants = useMemo(() => data?.videoVariants ?? [], [data?.videoVariants]);
    const currentVariant = useMemo(() => videoVariants[selectedVariantIndex], [videoVariants, selectedVariantIndex]);
    const hasYoutubeVideo = Boolean(currentVariant?.youtubeId);

    // Memoize derived video data to prevent recalculation on every render
    const videoData = useMemo(() => ({
        currentTime: data?.currentTime ?? "8:30",
        totalTime: data?.totalTime ?? "25:00",
        progress: data?.progress ?? 33,
        resolution: data?.resolution ?? "1080p",
    }), [data?.currentTime, data?.totalTime, data?.progress, data?.resolution]);

    const { currentTime, totalTime, progress, resolution } = videoData;

    // Calculate total duration in seconds for tooltip calculation
    const totalDurationSeconds = useMemo(() => parseTimeToSeconds(totalTime), [totalTime]);
    const includeHoursInFormat = totalDurationSeconds >= 3600;

    // Track play/pause state changes for behavior tracking
    useEffect(() => {
        const currentTimeSeconds = parseTimeToSeconds(currentTime);

        if (prevIsPlayingRef.current !== isPlaying) {
            if (isPlaying) {
                // Video started playing
                behaviorTracking.trackVideoPlay(currentTimeSeconds);
            } else {
                // Video paused
                behaviorTracking.trackVideoPause(currentTimeSeconds);
            }
            prevIsPlayingRef.current = isPlaying;
        }
    }, [isPlaying, currentTime, behaviorTracking]);

    // Track speed changes for behavior tracking
    useEffect(() => {
        if (prevSpeedRef.current !== speed) {
            behaviorTracking.trackVideoSpeedChange(speed);
            prevSpeedRef.current = speed;
        }
    }, [speed, behaviorTracking]);

    // Track video progress periodically (when playing)
    useEffect(() => {
        if (!isPlaying) return;

        const intervalId = setInterval(() => {
            const currentSeconds = parseTimeToSeconds(currentTime);
            behaviorTracking.trackVideoProgress(currentSeconds, totalDurationSeconds);
        }, 5000); // Track every 5 seconds

        return () => clearInterval(intervalId);
    }, [isPlaying, currentTime, totalDurationSeconds, behaviorTracking]);

    // Handle play/pause with tracking
    const handleTogglePlay = useCallback(() => {
        togglePlay();
        // Tracking happens in useEffect above when isPlaying state changes
    }, [togglePlay]);

    // Handle seek (clicking on progress bar)
    const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const seekToTime = (percentage / 100) * totalDurationSeconds;

        // Track the seek
        const currentTimeSeconds = parseTimeToSeconds(currentTime);
        behaviorTracking.trackVideoSeek(currentTimeSeconds, seekToTime);
        lastSeekPositionRef.current = seekToTime;
    }, [totalDurationSeconds, currentTime, behaviorTracking]);

    // Handle replay from a specific position (rewind button)
    const handleReplay = useCallback(() => {
        const currentTimeSeconds = parseTimeToSeconds(currentTime);
        // Replay the last 10 seconds
        const replayStart = Math.max(0, currentTimeSeconds - 10);
        behaviorTracking.trackVideoReplay(replayStart, currentTimeSeconds);
    }, [currentTime, behaviorTracking]);

    // Handle mouse move on progress bar to calculate hover time
    const handleProgressMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const timeAtPosition = (percentage / 100) * totalDurationSeconds;

        setHoverPosition(percentage);
        setHoverTime(formatSecondsToTime(timeAtPosition, includeHoursInFormat));
        setTooltipX(x);
    }, [totalDurationSeconds, includeHoursInFormat]);

    const handleProgressMouseEnter = useCallback(() => {
        setIsProgressHovered(true);
    }, []);

    const handleProgressMouseLeave = useCallback(() => {
        setIsProgressHovered(false);
    }, []);

    // Handle focus/blur for keyboard accessibility
    const handleProgressFocus = useCallback(() => {
        setIsProgressFocused(true);
    }, []);

    const handleProgressBlur = useCallback(() => {
        setIsProgressFocused(false);
    }, []);

    // Trigger thumb pulse animation for keyboard changes
    const triggerThumbPulse = useCallback(() => {
        setThumbPulse(true);
        setTimeout(() => setThumbPulse(false), 300);
    }, []);

    // Handle keyboard navigation for progress bar
    const handleProgressKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        const currentTimeSeconds = parseTimeToSeconds(currentTime);
        let newPosition: number | null = null;

        switch (e.key) {
            case "ArrowLeft":
                // 5 second jump backward
                e.preventDefault();
                newPosition = Math.max(0, currentTimeSeconds - 5);
                break;
            case "ArrowRight":
                // 5 second jump forward
                e.preventDefault();
                newPosition = Math.min(totalDurationSeconds, currentTimeSeconds + 5);
                break;
            case "ArrowUp":
                // 10% jump forward
                e.preventDefault();
                newPosition = Math.min(totalDurationSeconds, currentTimeSeconds + totalDurationSeconds * 0.1);
                break;
            case "ArrowDown":
                // 10% jump backward
                e.preventDefault();
                newPosition = Math.max(0, currentTimeSeconds - totalDurationSeconds * 0.1);
                break;
            case "Home":
                // Jump to start
                e.preventDefault();
                newPosition = 0;
                break;
            case "End":
                // Jump to end
                e.preventDefault();
                newPosition = totalDurationSeconds;
                break;
            default:
                return;
        }

        if (newPosition !== null) {
            // Track the seek
            behaviorTracking.trackVideoSeek(currentTimeSeconds, newPosition);
            lastSeekPositionRef.current = newPosition;
            triggerThumbPulse();
        }
    }, [currentTime, totalDurationSeconds, behaviorTracking, triggerThumbPulse]);

    // Combined active state for hover OR focus
    const isProgressActive = isProgressHovered || isProgressFocused;

    return (
        <div className="space-y-3">
            {/* Video Variant Selector */}
            {videoVariants.length > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--forge-text-muted)]">Video Style:</span>
                    <VideoVariantSelector
                        variants={videoVariants}
                        selectedIndex={selectedVariantIndex}
                        onSelect={setSelectedVariantIndex}
                    />
                </div>
            )}

            <PrismaticCard glowColor="indigo">
                <div className="aspect-video max-h-[480px] bg-[var(--forge-bg-void)] rounded-t-2xl relative overflow-hidden">
                    {hasYoutubeVideo ? (
                        /* YouTube Iframe */
                        <iframe
                            src={`https://www.youtube.com/embed/${currentVariant.youtubeId}?rel=0&modestbranding=1`}
                            className="absolute inset-0 w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            title={currentVariant.title || "Video"}
                        />
                    ) : (
                        /* Mock Player with Find Video Link */
                        <>
                            {/* Animated Background */}
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
                                transition={TRANSITIONS.decorative}
                                className="absolute inset-0 bg-gradient-to-br from-[var(--ember)]/20 via-[var(--forge-bg-void)] to-[var(--ember-glow)]/20 opacity-80"
                            />
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />

                            {/* Speed Indicator Overlay */}
                            <SpeedIndicator
                                speed={speed}
                                skipSilence={skipSilence}
                                variant="overlay"
                            />

                            {/* Speed Change Toast */}
                            <SpeedChangeToast speed={speed} visible={showSpeedToast} />

                            {/* Placeholder with Play Button and YouTube Link */}
                            <VideoPlaceholder
                                searchQuery={currentVariant?.searchQuery}
                                onTogglePlay={handleTogglePlay}
                                isPlaying={isPlaying}
                            />

                            {/* Controls (only for mock player) */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                {/* Enhanced Progress Bar with Slider Semantics */}
                                <div
                                    ref={progressBarRef}
                                    role="slider"
                                    aria-label="Video progress"
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={Math.round(progress)}
                                    aria-valuetext={`${currentTime} of ${totalTime}`}
                                    tabIndex={0}
                                    className={`relative w-full mb-3 cursor-pointer group py-2 rounded-sm outline-none transition-shadow duration-150 ${
                                        isProgressFocused
                                            ? "ring-2 ring-[var(--ember)]/50 ring-offset-2 ring-offset-[var(--forge-bg-void)]"
                                            : ""
                                    }`}
                                    onClick={handleProgressClick}
                                    onMouseEnter={handleProgressMouseEnter}
                                    onMouseLeave={handleProgressMouseLeave}
                                    onMouseMove={handleProgressMouseMove}
                                    onFocus={handleProgressFocus}
                                    onBlur={handleProgressBlur}
                                    onKeyDown={handleProgressKeyDown}
                                    data-testid="video-progress-slider"
                                >
                                    {/* Time Tooltip */}
                                    <AnimatePresence>
                                        {isProgressHovered && hoverTime && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 4 }}
                                                transition={{ duration: 0.15 }}
                                                className="absolute -top-8 px-2 py-1 bg-black/90 text-white text-xs rounded pointer-events-none whitespace-nowrap z-10"
                                                style={{
                                                    left: `${tooltipX}px`,
                                                    transform: "translateX(-50%)",
                                                }}
                                                data-testid="video-progress-tooltip"
                                            >
                                                {hoverTime}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Progress Bar Track - Uses CSS transform for smooth height expansion */}
                                    <div
                                        className="relative w-full bg-white/20 rounded-full overflow-visible transition-transform duration-150 origin-center"
                                        style={{
                                            height: "4px",
                                            transform: isProgressActive ? "scaleY(2)" : "scaleY(1)",
                                        }}
                                    >
                                        {/* Filled Progress */}
                                        <div
                                            className="absolute top-0 left-0 h-full bg-[var(--ember)] rounded-full transition-colors duration-150"
                                            style={{
                                                width: `${progress}%`,
                                                backgroundColor: isProgressActive ? "var(--ember-glow)" : "var(--ember)",
                                            }}
                                            data-testid="video-progress-filled"
                                        />

                                        {/* Hover Preview Position Indicator */}
                                        <AnimatePresence>
                                            {isProgressHovered && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 0.5 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.1 }}
                                                    className="absolute top-0 h-full bg-white/30 rounded-full"
                                                    style={{
                                                        left: 0,
                                                        width: `${hoverPosition}%`,
                                                    }}
                                                    data-testid="video-progress-hover-preview"
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Thumb Indicator - Appears on hover or focus, with pulse animation on keyboard changes */}
                                    <motion.div
                                        initial={false}
                                        animate={{
                                            scale: isProgressActive ? (thumbPulse ? 1.3 : 1) : 0,
                                            opacity: isProgressActive ? 1 : 0,
                                        }}
                                        transition={{
                                            duration: thumbPulse ? 0.15 : 0.15,
                                            scale: thumbPulse ? { type: "spring", stiffness: 500, damping: 15 } : { duration: 0.15 }
                                        }}
                                        className={`absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-[var(--ember)] pointer-events-none ${
                                            thumbPulse ? "shadow-[0_0_12px_rgba(255,100,50,0.6)]" : ""
                                        }`}
                                        style={{
                                            left: `${progress}%`,
                                            transform: "translate(-50%, -50%)",
                                        }}
                                        data-testid="video-progress-thumb"
                                    />
                                </div>
                                <div className="flex items-center justify-between text-white text-sm">
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={handleTogglePlay}
                                            data-testid="video-slot-play-control-btn"
                                            className="hover:text-white/80 transition-colors"
                                        >
                                            {isPlaying ? <Pause size={ICON_SIZES.md} /> : <Play size={ICON_SIZES.md} />}
                                        </button>
                                        <button
                                            onClick={handleReplay}
                                            data-testid="video-slot-replay-btn"
                                            className="hover:text-white/80 transition-colors"
                                            title="Replay last 10 seconds"
                                        >
                                            <RotateCcw size={ICON_SIZES.md} />
                                        </button>
                                        <button
                                            onClick={toggleMute}
                                            data-testid="video-slot-mute-btn"
                                            className="hover:text-white/80 transition-colors"
                                        >
                                            {isMuted ? <VolumeX size={ICON_SIZES.md} /> : <Volume2 size={ICON_SIZES.md} />}
                                        </button>
                                        <span className="text-xs" data-testid="video-time-display">{currentTime} / {totalTime}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <PlaybackSpeedControl
                                            speed={speed}
                                            skipSilence={skipSilence}
                                            onSpeedChange={setSpeed}
                                            onSkipSilenceToggle={toggleSilenceSkip}
                                            compact
                                        />
                                        <span className="text-xs" data-testid="video-resolution-display">{resolution}</span>
                                        <button data-testid="video-slot-fullscreen-btn" className="hover:text-white/80 transition-colors">
                                            <Maximize2 size={ICON_SIZES.md} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </PrismaticCard>
        </div>
    );
};

/**
 * Custom comparison function for VideoSlotRenderer
 * Only re-renders when video-related props change
 */
function areVideoPropsEqual(
    prevProps: VideoSlotRendererProps,
    nextProps: VideoSlotRendererProps
): boolean {
    // Check slot identity
    if (prevProps.slot.id !== nextProps.slot.id) return false;

    // Check slot data changes
    const prevData = prevProps.slot.data;
    const nextData = nextProps.slot.data;
    if (
        prevData?.currentTime !== nextData?.currentTime ||
        prevData?.totalTime !== nextData?.totalTime ||
        prevData?.progress !== nextData?.progress ||
        prevData?.resolution !== nextData?.resolution ||
        prevData?.selectedVariantIndex !== nextData?.selectedVariantIndex ||
        prevData?.videoVariants?.length !== nextData?.videoVariants?.length
    ) {
        return false;
    }

    // Check video-specific state
    const prevState = prevProps.state;
    const nextState = nextProps.state;
    return (
        prevState.isPlaying === nextState.isPlaying &&
        prevState.isMuted === nextState.isMuted &&
        prevState.showSpeedToast === nextState.showSpeedToast &&
        prevState.speed === nextState.speed &&
        prevState.skipSilence === nextState.skipSilence &&
        prevState.togglePlay === nextState.togglePlay &&
        prevState.toggleMute === nextState.toggleMute &&
        prevState.setSpeed === nextState.setSpeed &&
        prevState.toggleSilenceSkip === nextState.toggleSilenceSkip
    );
}

export const VideoSlotRenderer = memo(VideoSlotRendererComponent, areVideoPropsEqual);

export default VideoSlotRenderer;
