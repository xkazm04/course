"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    getPlaybackSpeed,
    setPlaybackSpeed,
    increaseSpeed,
    decreaseSpeed,
    getSkipSilence,
    setSkipSilence,
    toggleSkipSilence,
    PRESET_SPEEDS,
    MIN_SPEED,
    MAX_SPEED,
} from "./speedStorage";

interface UsePlaybackSpeedOptions {
    courseId?: string;
    onSpeedChange?: (speed: number) => void;
    onSkipSilenceChange?: (enabled: boolean) => void;
}

interface UsePlaybackSpeedReturn {
    speed: number;
    skipSilence: boolean;
    setSpeed: (speed: number) => void;
    increase: () => void;
    decrease: () => void;
    setCustomSpeed: (speed: number) => void;
    toggleSilenceSkip: () => void;
    presetSpeeds: number[];
    minSpeed: number;
    maxSpeed: number;
    isCustomSpeed: boolean;
}

export function usePlaybackSpeed(options: UsePlaybackSpeedOptions = {}): UsePlaybackSpeedReturn {
    const { courseId, onSpeedChange, onSkipSilenceChange } = options;
    const [speed, setSpeedState] = useState(1.0);
    const [skipSilence, setSkipSilenceState] = useState(false);
    const initializedRef = useRef(false);

    // Initialize from localStorage
    useEffect(() => {
        if (initializedRef.current) return;
        initializedRef.current = true;

        const storedSpeed = getPlaybackSpeed(courseId);
        const storedSkipSilence = getSkipSilence();
        setSpeedState(storedSpeed);
        setSkipSilenceState(storedSkipSilence);
    }, [courseId]);

    const handleSetSpeed = useCallback(
        (newSpeed: number) => {
            const clampedSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, newSpeed));
            setSpeedState(clampedSpeed);
            setPlaybackSpeed(clampedSpeed, courseId);
            onSpeedChange?.(clampedSpeed);
        },
        [courseId, onSpeedChange]
    );

    const handleIncrease = useCallback(() => {
        const newSpeed = increaseSpeed(courseId);
        setSpeedState(newSpeed);
        onSpeedChange?.(newSpeed);
    }, [courseId, onSpeedChange]);

    const handleDecrease = useCallback(() => {
        const newSpeed = decreaseSpeed(courseId);
        setSpeedState(newSpeed);
        onSpeedChange?.(newSpeed);
    }, [courseId, onSpeedChange]);

    const handleSetCustomSpeed = useCallback(
        (customSpeed: number) => {
            const roundedSpeed = Math.round(customSpeed * 100) / 100;
            handleSetSpeed(roundedSpeed);
        },
        [handleSetSpeed]
    );

    const handleToggleSilenceSkip = useCallback(() => {
        const newValue = toggleSkipSilence();
        setSkipSilenceState(newValue);
        onSkipSilenceChange?.(newValue);
    }, [onSkipSilenceChange]);

    const isCustomSpeed = !PRESET_SPEEDS.includes(speed);

    return {
        speed,
        skipSilence,
        setSpeed: handleSetSpeed,
        increase: handleIncrease,
        decrease: handleDecrease,
        setCustomSpeed: handleSetCustomSpeed,
        toggleSilenceSkip: handleToggleSilenceSkip,
        presetSpeeds: PRESET_SPEEDS,
        minSpeed: MIN_SPEED,
        maxSpeed: MAX_SPEED,
        isCustomSpeed,
    };
}
