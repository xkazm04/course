/**
 * Unified chapter state hook
 * Consolidates shared state logic from VariantA, VariantC, and VariantD
 */

import { useState, useCallback, useEffect } from "react";
import { usePlaybackSpeed } from "./usePlaybackSpeed";
import { useVideoKeyboardShortcuts } from "./useKeyboardShortcuts";
import type { CourseInfo, ChapterSection } from "./chapterData";

export interface ChapterStateConfig {
    courseInfo: CourseInfo;
    sections: ChapterSection[];
    initialSection?: number;
    enableVideoControls?: boolean;
}

export interface ChapterState {
    // Video player state
    isPlaying: boolean;
    isMuted: boolean;
    showSpeedToast: boolean;
    speed: number;
    skipSilence: boolean;

    // Section state
    currentSection: number;
    expandedSection: number | null;
    activeSection: number;

    // Quiz state
    showQuiz: number | null;
    showSectionQuiz: boolean;

    // Actions
    togglePlay: () => void;
    toggleMute: () => void;
    setSpeed: (speed: number) => void;
    increaseSpeed: () => void;
    decreaseSpeed: () => void;
    toggleSilenceSkip: () => void;
    setCurrentSection: (index: number) => void;
    setExpandedSection: (id: number | null) => void;
    setActiveSection: (id: number) => void;
    setShowQuiz: (id: number | null) => void;
    setShowSectionQuiz: (show: boolean) => void;

    // Computed
    progress: number;
    totalDuration: string;
    courseInfo: CourseInfo;
    sections: ChapterSection[];
}

/**
 * Custom hook that consolidates all chapter state management
 * Used by the unified ChapterView component
 */
export function useChapterState(config: ChapterStateConfig): ChapterState {
    const { courseInfo, sections, initialSection = 0, enableVideoControls = true } = config;

    // Video player state
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showSpeedToast, setShowSpeedToast] = useState(false);

    // Section state
    const [currentSection, setCurrentSection] = useState(initialSection);
    const [expandedSection, setExpandedSection] = useState<number | null>(1);
    const [activeSection, setActiveSection] = useState(
        sections.find((s) => !s.completed)?.id ?? sections[0]?.id ?? 1
    );

    // Quiz state
    const [showQuiz, setShowQuiz] = useState<number | null>(null);
    const [showSectionQuiz, setShowSectionQuiz] = useState(false);

    // Playback speed with memory per course
    const {
        speed,
        skipSilence,
        setSpeed,
        increase: increaseSpeed,
        decrease: decreaseSpeed,
        toggleSilenceSkip,
    } = usePlaybackSpeed({
        courseId: courseInfo.courseId,
        onSpeedChange: () => {
            setShowSpeedToast(true);
        },
    });

    // Hide speed toast after delay
    useEffect(() => {
        if (showSpeedToast) {
            const timer = setTimeout(() => setShowSpeedToast(false), 1000);
            return () => clearTimeout(timer);
        }
    }, [showSpeedToast]);

    // Toggle callbacks
    const togglePlay = useCallback(() => {
        setIsPlaying((prev) => !prev);
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted((prev) => !prev);
    }, []);

    // Keyboard shortcuts for video player
    useVideoKeyboardShortcuts({
        onIncreaseSpeed: increaseSpeed,
        onDecreaseSpeed: decreaseSpeed,
        onTogglePlay: togglePlay,
        onToggleSkipSilence: toggleSilenceSkip,
        onToggleMute: toggleMute,
        enabled: enableVideoControls,
    });

    // Computed values
    const progress = (sections.filter((s) => s.completed).length / sections.length) * 100;

    const totalDuration = (() => {
        const totalMinutes = sections.reduce((sum, section) => {
            const minutes = parseInt(section.duration, 10);
            return sum + (isNaN(minutes) ? 0 : minutes);
        }, 0);
        return `~${totalMinutes} min`;
    })();

    return {
        // Video state
        isPlaying,
        isMuted,
        showSpeedToast,
        speed,
        skipSilence,

        // Section state
        currentSection,
        expandedSection,
        activeSection,

        // Quiz state
        showQuiz,
        showSectionQuiz,

        // Actions
        togglePlay,
        toggleMute,
        setSpeed,
        increaseSpeed,
        decreaseSpeed,
        toggleSilenceSkip,
        setCurrentSection,
        setExpandedSection,
        setActiveSection,
        setShowQuiz,
        setShowSectionQuiz,

        // Computed
        progress,
        totalDuration,
        courseInfo,
        sections,
    };
}
