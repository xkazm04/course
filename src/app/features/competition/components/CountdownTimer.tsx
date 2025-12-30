"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";

interface CountdownTimerProps {
    endDate: string;
    startDate?: string;
    variant?: "default" | "compact" | "large";
    showIcon?: boolean;
    onExpire?: () => void;
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
}

function calculateTimeLeft(endDate: string): TimeLeft {
    const difference = new Date(endDate).getTime() - Date.now();

    if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
    }

    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        total: difference,
    };
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
    endDate,
    startDate,
    variant = "default",
    showIcon = true,
    onExpire,
}) => {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(endDate));
    const [hasExpired, setHasExpired] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft(endDate);
            setTimeLeft(newTimeLeft);

            if (newTimeLeft.total <= 0 && !hasExpired) {
                setHasExpired(true);
                onExpire?.();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [endDate, hasExpired, onExpire]);

    const isUrgent = timeLeft.days === 0 && timeLeft.hours < 24;
    const isCritical = timeLeft.days === 0 && timeLeft.hours < 6;

    if (variant === "compact") {
        return (
            <CompactCountdown
                timeLeft={timeLeft}
                isUrgent={isUrgent}
                isCritical={isCritical}
                showIcon={showIcon}
            />
        );
    }

    if (variant === "large") {
        return (
            <LargeCountdown
                timeLeft={timeLeft}
                isUrgent={isUrgent}
                isCritical={isCritical}
            />
        );
    }

    return (
        <DefaultCountdown
            timeLeft={timeLeft}
            isUrgent={isUrgent}
            isCritical={isCritical}
            showIcon={showIcon}
        />
    );
};

// Compact variant
interface CountdownVariantProps {
    timeLeft: TimeLeft;
    isUrgent: boolean;
    isCritical: boolean;
    showIcon?: boolean;
}

const CompactCountdown: React.FC<CountdownVariantProps> = ({
    timeLeft,
    isUrgent,
    isCritical,
    showIcon,
}) => {
    const formatTime = () => {
        if (timeLeft.total <= 0) return "Ended";
        if (timeLeft.days > 0) return `${timeLeft.days}d ${timeLeft.hours}h`;
        if (timeLeft.hours > 0) return `${timeLeft.hours}h ${timeLeft.minutes}m`;
        return `${timeLeft.minutes}m ${timeLeft.seconds}s`;
    };

    return (
        <div
            className={cn(
                "inline-flex items-center gap-1 text-sm",
                isCritical ? "text-[var(--forge-error)]" : isUrgent ? "text-[var(--forge-warning)]" : "text-[var(--forge-text-muted)]"
            )}
        >
            {showIcon && (
                isCritical ? (
                    <AlertTriangle size={ICON_SIZES.sm} />
                ) : (
                    <Clock size={ICON_SIZES.sm} />
                )
            )}
            <span>{formatTime()}</span>
        </div>
    );
};

// Default variant
const DefaultCountdown: React.FC<CountdownVariantProps> = ({
    timeLeft,
    isUrgent,
    isCritical,
    showIcon,
}) => {
    if (timeLeft.total <= 0) {
        return (
            <div className="flex items-center gap-2 text-[var(--forge-error)]">
                <AlertTriangle size={ICON_SIZES.md} />
                <span className="font-medium">Challenge Ended</span>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex items-center gap-2",
                isCritical ? "text-[var(--forge-error)]" : isUrgent ? "text-[var(--forge-warning)]" : "text-[var(--forge-text-secondary)]"
            )}
        >
            {showIcon && (
                isCritical ? (
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    >
                        <AlertTriangle size={ICON_SIZES.md} />
                    </motion.div>
                ) : (
                    <Clock size={ICON_SIZES.md} />
                )
            )}
            <div className="flex items-baseline gap-1">
                {timeLeft.days > 0 && (
                    <>
                        <span className="font-bold">{timeLeft.days}</span>
                        <span className="text-xs text-[var(--forge-text-muted)]">d</span>
                    </>
                )}
                <span className="font-bold">{timeLeft.hours.toString().padStart(2, "0")}</span>
                <span className="text-xs text-[var(--forge-text-muted)]">h</span>
                <span className="font-bold">{timeLeft.minutes.toString().padStart(2, "0")}</span>
                <span className="text-xs text-[var(--forge-text-muted)]">m</span>
                {timeLeft.days === 0 && (
                    <>
                        <span className="font-bold">{timeLeft.seconds.toString().padStart(2, "0")}</span>
                        <span className="text-xs text-[var(--forge-text-muted)]">s</span>
                    </>
                )}
            </div>
        </div>
    );
};

// Large variant with boxes
const LargeCountdown: React.FC<Omit<CountdownVariantProps, "showIcon">> = ({
    timeLeft,
    isUrgent,
    isCritical,
}) => {
    if (timeLeft.total <= 0) {
        return (
            <div className="text-center p-4 rounded-lg bg-[var(--forge-error)]/10 border border-[var(--forge-error)]/20">
                <AlertTriangle size={ICON_SIZES.xl} className="text-[var(--forge-error)] mx-auto mb-2" />
                <span className="text-lg font-bold text-[var(--forge-error)]">Challenge Ended</span>
            </div>
        );
    }

    const TimeBox = ({ value, label }: { value: number; label: string }) => (
        <div className="flex flex-col items-center">
            <motion.div
                key={value}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className={cn(
                    "w-16 h-16 rounded-lg flex items-center justify-center text-2xl font-bold",
                    isCritical
                        ? "bg-[var(--forge-error)]/20 text-[var(--forge-error)]"
                        : isUrgent
                        ? "bg-[var(--forge-warning)]/20 text-[var(--forge-warning)]"
                        : "bg-[var(--forge-bg-anvil)] text-[var(--forge-text-primary)]"
                )}
            >
                {value.toString().padStart(2, "0")}
            </motion.div>
            <span className="text-xs text-[var(--forge-text-muted)] mt-1">{label}</span>
        </div>
    );

    return (
        <div className="flex items-center gap-3 justify-center">
            {timeLeft.days > 0 && <TimeBox value={timeLeft.days} label="Days" />}
            <TimeBox value={timeLeft.hours} label="Hours" />
            <TimeBox value={timeLeft.minutes} label="Minutes" />
            <TimeBox value={timeLeft.seconds} label="Seconds" />
        </div>
    );
};

// Progress bar showing time elapsed
interface TimeProgressProps {
    startDate: string;
    endDate: string;
}

export const TimeProgress: React.FC<TimeProgressProps> = ({ startDate, endDate }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const calculateProgress = () => {
            const start = new Date(startDate).getTime();
            const end = new Date(endDate).getTime();
            const now = Date.now();

            const total = end - start;
            const elapsed = now - start;

            return Math.min(100, Math.max(0, (elapsed / total) * 100));
        };

        setProgress(calculateProgress());

        const timer = setInterval(() => {
            setProgress(calculateProgress());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [startDate, endDate]);

    return (
        <div className="w-full">
            <div className="h-2 bg-[var(--forge-bg-anvil)] rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-[var(--ember)] rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
            <div className="flex justify-between text-xs text-[var(--forge-text-muted)] mt-1">
                <span>Started</span>
                <span>{Math.round(progress)}% elapsed</span>
                <span>Ends</span>
            </div>
        </div>
    );
};
