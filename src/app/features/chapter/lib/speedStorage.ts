"use client";

import { createTimestampedStorage } from "@/app/shared/lib/storageFactory";

const GLOBAL_KEY = "__global__";

export interface SpeedPreferences {
    speeds: Record<string, number>; // courseId -> speed
    skipSilence: boolean;
    lastUpdated: string;
}

const DEFAULT_SPEED = 1.0;
const PRESET_SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
const MIN_SPEED = 0.25;
const MAX_SPEED = 3.0;
const SPEED_STEP = 0.25;

function getDefaultPreferences(): SpeedPreferences {
    return {
        speeds: {},
        skipSilence: false,
        lastUpdated: new Date().toISOString(),
    };
}

// Create storage using the factory
const speedStorage = createTimestampedStorage<SpeedPreferences>({
    storageKey: "course-playback-speeds",
    getDefault: getDefaultPreferences,
});

export function getSpeedPreferences(): SpeedPreferences {
    return speedStorage.get();
}

function saveSpeedPreferences(prefs: SpeedPreferences): void {
    speedStorage.save(prefs);
}

export function getPlaybackSpeed(courseId?: string): number {
    const prefs = getSpeedPreferences();
    if (courseId && prefs.speeds[courseId] !== undefined) {
        return prefs.speeds[courseId];
    }
    if (prefs.speeds[GLOBAL_KEY] !== undefined) {
        return prefs.speeds[GLOBAL_KEY];
    }
    return DEFAULT_SPEED;
}

export function setPlaybackSpeed(speed: number, courseId?: string): void {
    const prefs = getSpeedPreferences();
    const key = courseId || GLOBAL_KEY;
    const clampedSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
    prefs.speeds[key] = clampedSpeed;
    saveSpeedPreferences(prefs);
}

export function increaseSpeed(courseId?: string): number {
    const currentSpeed = getPlaybackSpeed(courseId);
    const newSpeed = Math.min(MAX_SPEED, currentSpeed + SPEED_STEP);
    setPlaybackSpeed(newSpeed, courseId);
    return newSpeed;
}

export function decreaseSpeed(courseId?: string): number {
    const currentSpeed = getPlaybackSpeed(courseId);
    const newSpeed = Math.max(MIN_SPEED, currentSpeed - SPEED_STEP);
    setPlaybackSpeed(newSpeed, courseId);
    return newSpeed;
}

export function getSkipSilence(): boolean {
    const prefs = getSpeedPreferences();
    return prefs.skipSilence;
}

export function setSkipSilence(enabled: boolean): void {
    const prefs = getSpeedPreferences();
    prefs.skipSilence = enabled;
    saveSpeedPreferences(prefs);
}

export function toggleSkipSilence(): boolean {
    const current = getSkipSilence();
    setSkipSilence(!current);
    return !current;
}

export function clearSpeedPreference(courseId: string): void {
    const prefs = getSpeedPreferences();
    delete prefs.speeds[courseId];
    saveSpeedPreferences(prefs);
}

export function resetAllSpeedPreferences(): void {
    saveSpeedPreferences(getDefaultPreferences());
}

export function formatSpeed(speed: number): string {
    return speed === 1 ? "Normal" : `${speed}x`;
}

export { PRESET_SPEEDS, MIN_SPEED, MAX_SPEED, SPEED_STEP, DEFAULT_SPEED };
