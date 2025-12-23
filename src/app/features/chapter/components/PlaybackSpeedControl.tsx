"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gauge, ChevronDown, Zap, Check, X } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { TRANSITIONS, ANIMATION_VARIANTS, SPRINGS } from "@/app/shared/lib/animationTiming";
import { formatSpeed, PRESET_SPEEDS, MIN_SPEED, MAX_SPEED } from "../lib/speedStorage";

interface PlaybackSpeedControlProps {
    speed: number;
    skipSilence: boolean;
    onSpeedChange: (speed: number) => void;
    onSkipSilenceToggle: () => void;
    presetSpeeds?: number[];
    className?: string;
    compact?: boolean;
}

export const PlaybackSpeedControl: React.FC<PlaybackSpeedControlProps> = ({
    speed,
    skipSilence,
    onSpeedChange,
    onSkipSilenceToggle,
    presetSpeeds = PRESET_SPEEDS,
    className,
    compact = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customValue, setCustomValue] = useState(speed.toString());
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowCustomInput(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Focus input when custom input is shown
    useEffect(() => {
        if (showCustomInput && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [showCustomInput]);

    const handleCustomSpeedSubmit = () => {
        const parsed = parseFloat(customValue);
        if (!isNaN(parsed) && parsed >= MIN_SPEED && parsed <= MAX_SPEED) {
            onSpeedChange(parsed);
            setShowCustomInput(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleCustomSpeedSubmit();
        } else if (e.key === "Escape") {
            setShowCustomInput(false);
            setCustomValue(speed.toString());
        }
    };

    const isCustomSpeed = !presetSpeeds.includes(speed);

    if (compact) {
        return (
            <div className={cn("relative", className)} ref={menuRef}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white/80 hover:text-white transition-colors rounded hover:bg-white/10"
                    data-testid="speed-control-btn-compact"
                    title={`Playback speed: ${formatSpeed(speed)}${skipSilence ? " (Skip silence on)" : ""}`}
                >
                    <span>{speed}x</span>
                    {skipSilence && <Zap size={ICON_SIZES.xs} className="text-yellow-400" />}
                </button>
                <AnimatePresence>
                    {isOpen && (
                        <SpeedMenu
                            speed={speed}
                            skipSilence={skipSilence}
                            presetSpeeds={presetSpeeds}
                            showCustomInput={showCustomInput}
                            customValue={customValue}
                            inputRef={inputRef}
                            onSpeedChange={onSpeedChange}
                            onSkipSilenceToggle={onSkipSilenceToggle}
                            setShowCustomInput={setShowCustomInput}
                            setCustomValue={setCustomValue}
                            handleCustomSpeedSubmit={handleCustomSpeedSubmit}
                            handleKeyDown={handleKeyDown}
                            setIsOpen={setIsOpen}
                            isCustomSpeed={isCustomSpeed}
                        />
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className={cn("relative", className)} ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors border border-white/10"
                data-testid="speed-control-btn"
            >
                <Gauge size={ICON_SIZES.sm} className="text-white/80" />
                <span className="text-sm font-medium text-white">{formatSpeed(speed)}</span>
                {skipSilence && <Zap size={ICON_SIZES.xs} className="text-yellow-400" />}
                <ChevronDown
                    size={ICON_SIZES.sm}
                    className={cn(
                        "text-white/60 transition-transform",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <SpeedMenu
                        speed={speed}
                        skipSilence={skipSilence}
                        presetSpeeds={presetSpeeds}
                        showCustomInput={showCustomInput}
                        customValue={customValue}
                        inputRef={inputRef}
                        onSpeedChange={onSpeedChange}
                        onSkipSilenceToggle={onSkipSilenceToggle}
                        setShowCustomInput={setShowCustomInput}
                        setCustomValue={setCustomValue}
                        handleCustomSpeedSubmit={handleCustomSpeedSubmit}
                        handleKeyDown={handleKeyDown}
                        setIsOpen={setIsOpen}
                        isCustomSpeed={isCustomSpeed}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

interface SpeedMenuProps {
    speed: number;
    skipSilence: boolean;
    presetSpeeds: number[];
    showCustomInput: boolean;
    customValue: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
    onSpeedChange: (speed: number) => void;
    onSkipSilenceToggle: () => void;
    setShowCustomInput: (show: boolean) => void;
    setCustomValue: (value: string) => void;
    handleCustomSpeedSubmit: () => void;
    handleKeyDown: (e: React.KeyboardEvent) => void;
    setIsOpen: (open: boolean) => void;
    isCustomSpeed: boolean;
}

const SpeedMenu: React.FC<SpeedMenuProps> = ({
    speed,
    skipSilence,
    presetSpeeds,
    showCustomInput,
    customValue,
    inputRef,
    onSpeedChange,
    onSkipSilenceToggle,
    setShowCustomInput,
    setCustomValue,
    handleCustomSpeedSubmit,
    handleKeyDown,
    setIsOpen,
    isCustomSpeed,
}) => {
    return (
        <motion.div
            initial={ANIMATION_VARIANTS.fadeInDown.initial}
            animate={ANIMATION_VARIANTS.fadeInDown.animate}
            exit={ANIMATION_VARIANTS.fadeInDown.exit}
            transition={TRANSITIONS.fast}
            className="absolute bottom-full mb-2 right-0 min-w-[180px] bg-slate-900/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl overflow-hidden z-50"
        >
            <div className="p-2">
                <div className="text-xs font-medium text-white/50 px-2 py-1 mb-1">
                    Playback Speed
                </div>

                {/* Preset Speeds */}
                <div className="grid grid-cols-4 gap-1 mb-2">
                    {presetSpeeds.map((presetSpeed) => (
                        <button
                            key={presetSpeed}
                            onClick={() => {
                                onSpeedChange(presetSpeed);
                                setIsOpen(false);
                            }}
                            className={cn(
                                "px-2 py-1.5 text-xs font-medium rounded-lg transition-colors",
                                speed === presetSpeed
                                    ? "bg-indigo-500 text-white"
                                    : "text-white/70 hover:bg-white/10 hover:text-white"
                            )}
                            data-testid={`speed-preset-${presetSpeed}`}
                        >
                            {presetSpeed}x
                        </button>
                    ))}
                </div>

                {/* Custom Speed */}
                {showCustomInput ? (
                    <div className="flex items-center gap-1 px-1 mb-2">
                        <input
                            ref={inputRef}
                            type="number"
                            min={MIN_SPEED}
                            max={MAX_SPEED}
                            step={0.05}
                            value={customValue}
                            onChange={(e) => setCustomValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="flex-1 px-2 py-1 text-xs bg-white/10 border border-white/20 rounded-lg text-white outline-none focus:border-indigo-500"
                            data-testid="custom-speed-input"
                        />
                        <button
                            onClick={handleCustomSpeedSubmit}
                            className="p-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-lg transition-colors"
                            data-testid="custom-speed-submit-btn"
                        >
                            <Check size={ICON_SIZES.xs} className="text-white" />
                        </button>
                        <button
                            onClick={() => {
                                setShowCustomInput(false);
                                setCustomValue(speed.toString());
                            }}
                            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            data-testid="custom-speed-cancel-btn"
                        >
                            <X size={ICON_SIZES.xs} className="text-white" />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => {
                            setCustomValue(speed.toString());
                            setShowCustomInput(true);
                        }}
                        className={cn(
                            "w-full px-2 py-1.5 text-xs font-medium text-left rounded-lg transition-colors mb-2",
                            isCustomSpeed
                                ? "bg-indigo-500/20 text-indigo-300"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                        )}
                        data-testid="custom-speed-btn"
                    >
                        Custom {isCustomSpeed && `(${speed}x)`}
                    </button>
                )}

                {/* Divider */}
                <div className="h-px bg-white/10 my-2" />

                {/* Skip Silence Toggle */}
                <button
                    onClick={onSkipSilenceToggle}
                    className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-white/10 transition-colors"
                    data-testid="skip-silence-toggle-btn"
                >
                    <div className="flex items-center gap-2">
                        <Zap
                            size={ICON_SIZES.sm}
                            className={skipSilence ? "text-yellow-400" : "text-white/50"}
                        />
                        <span className="text-xs font-medium text-white/80">Skip Silence</span>
                    </div>
                    <div
                        className={cn(
                            "w-8 h-4 rounded-full transition-colors relative",
                            skipSilence ? "bg-indigo-500" : "bg-white/20"
                        )}
                    >
                        <motion.div
                            className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow"
                            animate={{ x: skipSilence ? 17 : 2 }}
                            transition={SPRINGS.snappy}
                        />
                    </div>
                </button>

                {/* Keyboard Shortcuts Hint */}
                <div className="mt-2 px-2 py-1.5 bg-white/5 rounded-lg">
                    <div className="text-[10px] text-white/40 space-y-0.5">
                        <div className="flex justify-between">
                            <span>Increase speed</span>
                            <kbd className="px-1 bg-white/10 rounded">Shift + .</kbd>
                        </div>
                        <div className="flex justify-between">
                            <span>Decrease speed</span>
                            <kbd className="px-1 bg-white/10 rounded">Shift + ,</kbd>
                        </div>
                        <div className="flex justify-between">
                            <span>Skip silence</span>
                            <kbd className="px-1 bg-white/10 rounded">S</kbd>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default PlaybackSpeedControl;
