"use client";

import { useEffect, useCallback } from "react";

interface KeyboardShortcutHandlers {
    onIncreaseSpeed?: () => void;
    onDecreaseSpeed?: () => void;
    onTogglePlay?: () => void;
    onToggleSkipSilence?: () => void;
    onToggleMute?: () => void;
    onSeekForward?: () => void;
    onSeekBackward?: () => void;
    onToggleFullscreen?: () => void;
    enabled?: boolean;
}

export function useVideoKeyboardShortcuts(handlers: KeyboardShortcutHandlers): void {
    const {
        onIncreaseSpeed,
        onDecreaseSpeed,
        onTogglePlay,
        onToggleSkipSilence,
        onToggleMute,
        onSeekForward,
        onSeekBackward,
        onToggleFullscreen,
        enabled = true,
    } = handlers;

    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Skip if user is typing in an input field
            const target = event.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            switch (event.key) {
                case ">":
                case ".":
                    // Shift + . = > for increase speed
                    if (event.shiftKey) {
                        event.preventDefault();
                        onIncreaseSpeed?.();
                    }
                    break;
                case "<":
                case ",":
                    // Shift + , = < for decrease speed
                    if (event.shiftKey) {
                        event.preventDefault();
                        onDecreaseSpeed?.();
                    }
                    break;
                case " ":
                case "k":
                    // Space or K to toggle play/pause
                    event.preventDefault();
                    onTogglePlay?.();
                    break;
                case "s":
                case "S":
                    // S to toggle skip silence
                    event.preventDefault();
                    onToggleSkipSilence?.();
                    break;
                case "m":
                case "M":
                    // M to toggle mute
                    event.preventDefault();
                    onToggleMute?.();
                    break;
                case "ArrowRight":
                case "l":
                case "L":
                    // Right arrow or L to seek forward
                    event.preventDefault();
                    onSeekForward?.();
                    break;
                case "ArrowLeft":
                case "j":
                case "J":
                    // Left arrow or J to seek backward
                    event.preventDefault();
                    onSeekBackward?.();
                    break;
                case "f":
                case "F":
                    // F to toggle fullscreen
                    event.preventDefault();
                    onToggleFullscreen?.();
                    break;
            }
        },
        [
            onIncreaseSpeed,
            onDecreaseSpeed,
            onTogglePlay,
            onToggleSkipSilence,
            onToggleMute,
            onSeekForward,
            onSeekBackward,
            onToggleFullscreen,
        ]
    );

    useEffect(() => {
        if (!enabled) return;

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown, enabled]);
}
