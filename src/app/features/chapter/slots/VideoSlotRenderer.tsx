"use client";

import React, { useMemo, memo, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from "lucide-react";
import { PrismaticCard } from "@/app/shared/components";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { TRANSITIONS } from "@/app/shared/lib/animationTiming";
import { PlaybackSpeedControl, SpeedIndicator, SpeedChangeToast } from "../components";
import { useBehaviorTrackingContext } from "../lib/BehaviorTrackingContext";
import type { VideoSlot } from "../lib/contentSlots";
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
 * VideoSlotRenderer - Renders video player with playback controls
 *
 * Memoized to prevent re-renders when unrelated ChapterState properties change.
 * Only re-renders when video-specific state (isPlaying, isMuted, speed, etc.) changes.
 *
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

    // Progress bar hover state
    const [isProgressHovered, setIsProgressHovered] = useState(false);
    const [hoverPosition, setHoverPosition] = useState<number>(0);
    const [hoverTime, setHoverTime] = useState<string>("");
    const [tooltipX, setTooltipX] = useState<number>(0);
    const progressBarRef = useRef<HTMLDivElement>(null);

    // Track previous playing state and speed for detecting changes
    const prevIsPlayingRef = useRef(isPlaying);
    const prevSpeedRef = useRef(speed);
    const lastSeekPositionRef = useRef<number>(0);

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

    return (
        <PrismaticCard glowColor="indigo">
            <div className="aspect-video bg-[var(--forge-bg-void)] rounded-t-2xl relative overflow-hidden">
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

                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleTogglePlay}
                        className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20"
                        data-testid="video-slot-play-btn"
                    >
                        {isPlaying ? <Pause size={ICON_SIZES.xl} /> : <Play size={ICON_SIZES.xl} className="ml-1" />}
                    </motion.button>
                </div>

                {/* Controls */}
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
                        className="relative w-full mb-3 cursor-pointer group py-2"
                        onClick={handleProgressClick}
                        onMouseEnter={handleProgressMouseEnter}
                        onMouseLeave={handleProgressMouseLeave}
                        onMouseMove={handleProgressMouseMove}
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
                                transform: isProgressHovered ? "scaleY(2)" : "scaleY(1)",
                            }}
                        >
                            {/* Filled Progress */}
                            <div
                                className="absolute top-0 left-0 h-full bg-[var(--ember)] rounded-full transition-colors duration-150"
                                style={{
                                    width: `${progress}%`,
                                    backgroundColor: isProgressHovered ? "var(--ember-glow)" : "var(--ember)",
                                }}
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
                                    />
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Thumb Indicator - Appears on hover */}
                        <motion.div
                            initial={false}
                            animate={{
                                scale: isProgressHovered ? 1 : 0,
                                opacity: isProgressHovered ? 1 : 0,
                            }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-[var(--ember)] pointer-events-none"
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
                            <span className="text-xs">{currentTime} / {totalTime}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <PlaybackSpeedControl
                                speed={speed}
                                skipSilence={skipSilence}
                                onSpeedChange={setSpeed}
                                onSkipSilenceToggle={toggleSilenceSkip}
                                compact
                            />
                            <span className="text-xs">{resolution}</span>
                            <button data-testid="video-slot-fullscreen-btn" className="hover:text-white/80 transition-colors">
                                <Maximize2 size={ICON_SIZES.md} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </PrismaticCard>
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
        prevData?.resolution !== nextData?.resolution
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
