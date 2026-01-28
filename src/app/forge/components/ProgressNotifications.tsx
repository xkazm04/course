"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, AlertTriangle, Info, X, RefreshCw } from "lucide-react";
import { XPToast } from "./XPToast";
import { AchievementModal } from "./AchievementModal";
import { apiErrorNotifier, type ErrorNotification } from "../map/lib/apiUtils";
import { cn } from "@/app/shared/lib/utils";

interface Achievement {
    id: string;
    slug: string;
    title: string;
    description: string;
    xpReward: number;
    rarity: string;
    icon: string;
    color: string;
}

interface XPNotification {
    xpAwarded: number;
    bonusXp?: number;
    leveledUp?: boolean;
    newLevel?: number;
    streakBonus?: boolean;
}

interface ProgressNotificationsContextValue {
    showXPToast: (notification: XPNotification) => void;
    showAchievementModal: (achievement: Achievement) => void;
    queueAchievements: (achievements: Achievement[]) => void;
    showErrorNotification: (notification: ErrorNotification) => void;
    dismissErrorNotification: (id: string) => void;
    clearAllErrors: () => void;
}

const ProgressNotificationsContext = createContext<ProgressNotificationsContextValue | null>(null);

export function useProgressNotifications() {
    const context = useContext(ProgressNotificationsContext);
    if (!context) {
        throw new Error("useProgressNotifications must be used within ProgressNotificationsProvider");
    }
    return context;
}

interface ProgressNotificationsProviderProps {
    children: ReactNode;
}

export function ProgressNotificationsProvider({ children }: ProgressNotificationsProviderProps) {
    // XP Toast state
    const [xpToast, setXpToast] = useState<XPNotification | null>(null);
    const [isXpToastVisible, setIsXpToastVisible] = useState(false);

    // Achievement Modal state
    const [achievementQueue, setAchievementQueue] = useState<Achievement[]>([]);
    const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
    const [isAchievementVisible, setIsAchievementVisible] = useState(false);

    // Error notification state
    const [errorNotifications, setErrorNotifications] = useState<ErrorNotification[]>([]);
    const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

    // Subscribe to API error notifier
    useEffect(() => {
        const unsubscribe = apiErrorNotifier.subscribe((notification) => {
            setErrorNotifications(prev => {
                // Avoid duplicates within 2 seconds
                const isDuplicate = prev.some(
                    n => n.title === notification.title &&
                        n.message === notification.message &&
                        notification.timestamp - n.timestamp < 2000
                );
                if (isDuplicate) return prev;

                // Keep max 5 notifications
                const updated = [...prev, notification];
                if (updated.length > 5) {
                    return updated.slice(-5);
                }
                return updated;
            });

            // Auto-dismiss non-retryable errors after 8 seconds
            if (!notification.retryable && notification.dismissable) {
                setTimeout(() => {
                    setErrorNotifications(prev => prev.filter(n => n.id !== notification.id));
                }, 8000);
            }
        });

        return unsubscribe;
    }, []);

    // Show error notification manually
    const showErrorNotification = useCallback((notification: ErrorNotification) => {
        setErrorNotifications(prev => [...prev, notification]);
    }, []);

    // Dismiss error notification
    const dismissErrorNotification = useCallback((id: string) => {
        setErrorNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Clear all errors
    const clearAllErrors = useCallback(() => {
        setErrorNotifications([]);
    }, []);

    // Handle retry action
    const handleRetry = useCallback(async (notification: ErrorNotification) => {
        if (!notification.retryAction) return;

        setRetryingIds(prev => new Set(prev).add(notification.id));

        try {
            await notification.retryAction();
            // If successful, dismiss the notification
            setErrorNotifications(prev => prev.filter(n => n.id !== notification.id));
        } catch {
            // If retry fails, it will trigger a new notification
        } finally {
            setRetryingIds(prev => {
                const next = new Set(prev);
                next.delete(notification.id);
                return next;
            });
        }
    }, []);

    // Show XP toast
    const showXPToast = useCallback((notification: XPNotification) => {
        setXpToast(notification);
        setIsXpToastVisible(true);

        // Auto-hide after 3 seconds
        setTimeout(() => {
            setIsXpToastVisible(false);
        }, 3000);
    }, []);

    // Handle XP toast complete
    const handleXpToastComplete = useCallback(() => {
        setXpToast(null);
    }, []);

    // Show single achievement
    const showAchievementModal = useCallback((achievement: Achievement) => {
        setCurrentAchievement(achievement);
        setIsAchievementVisible(true);
    }, []);

    // Queue multiple achievements
    const queueAchievements = useCallback((achievements: Achievement[]) => {
        if (achievements.length === 0) return;

        if (currentAchievement || isAchievementVisible) {
            // Add to queue if modal is already showing
            setAchievementQueue(prev => [...prev, ...achievements]);
        } else {
            // Show first one immediately, queue the rest
            const [first, ...rest] = achievements;
            setCurrentAchievement(first);
            setIsAchievementVisible(true);
            setAchievementQueue(rest);
        }
    }, [currentAchievement, isAchievementVisible]);

    // Close achievement modal and show next in queue
    const closeAchievementModal = useCallback(() => {
        setIsAchievementVisible(false);

        // Show next achievement after a short delay
        setTimeout(() => {
            setCurrentAchievement(null);
            if (achievementQueue.length > 0) {
                const [next, ...rest] = achievementQueue;
                setCurrentAchievement(next);
                setIsAchievementVisible(true);
                setAchievementQueue(rest);
            }
        }, 300);
    }, [achievementQueue]);

    // Get icon for notification type
    const getNotificationIcon = (type: ErrorNotification["type"]) => {
        switch (type) {
            case "error":
                return AlertCircle;
            case "warning":
                return AlertTriangle;
            default:
                return Info;
        }
    };

    // Get colors for notification type
    const getNotificationColors = (type: ErrorNotification["type"]) => {
        switch (type) {
            case "error":
                return {
                    border: "border-red-500/40",
                    bg: "bg-red-500/10",
                    icon: "text-red-500",
                    title: "text-red-400",
                };
            case "warning":
                return {
                    border: "border-amber-500/40",
                    bg: "bg-amber-500/10",
                    icon: "text-amber-500",
                    title: "text-amber-400",
                };
            default:
                return {
                    border: "border-blue-500/40",
                    bg: "bg-blue-500/10",
                    icon: "text-blue-500",
                    title: "text-blue-400",
                };
        }
    };

    return (
        <ProgressNotificationsContext.Provider
            value={{
                showXPToast,
                showAchievementModal,
                queueAchievements,
                showErrorNotification,
                dismissErrorNotification,
                clearAllErrors,
            }}
        >
            {children}

            {/* XP Toast */}
            <XPToast
                isVisible={isXpToastVisible}
                xpAwarded={xpToast?.xpAwarded || 0}
                bonusXp={xpToast?.bonusXp}
                leveledUp={xpToast?.leveledUp}
                newLevel={xpToast?.newLevel}
                streakBonus={xpToast?.streakBonus}
                onComplete={handleXpToastComplete}
            />

            {/* Achievement Modal */}
            <AchievementModal
                isVisible={isAchievementVisible}
                achievement={currentAchievement}
                onClose={closeAchievementModal}
            />

            {/* Error Notifications */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
                <AnimatePresence mode="popLayout">
                    {errorNotifications.map((notification) => {
                        const Icon = getNotificationIcon(notification.type);
                        const colors = getNotificationColors(notification.type);
                        const isRetrying = retryingIds.has(notification.id);

                        return (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                                transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
                                className={cn(
                                    "relative overflow-hidden rounded-xl border backdrop-blur-xl shadow-lg",
                                    colors.border,
                                    colors.bg,
                                    "bg-[var(--forge-bg-daylight)]/95"
                                )}
                                data-testid={`error-notification-${notification.id}`}
                            >
                                <div className="p-4">
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className={cn("mt-0.5 flex-shrink-0", colors.icon)}>
                                            <Icon className="w-5 h-5" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className={cn("font-semibold text-sm", colors.title)}>
                                                {notification.title}
                                            </h4>
                                            <p className="text-sm text-[var(--forge-text-secondary)] mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>

                                            {/* Retry button */}
                                            {notification.retryable && notification.retryAction && (
                                                <button
                                                    onClick={() => handleRetry(notification)}
                                                    disabled={isRetrying}
                                                    className={cn(
                                                        "mt-2 inline-flex items-center gap-1.5 text-xs font-medium",
                                                        "px-2.5 py-1 rounded-md",
                                                        "bg-white/10 hover:bg-white/20",
                                                        "text-[var(--forge-text-primary)]",
                                                        "transition-colors duration-150",
                                                        "disabled:opacity-50 disabled:cursor-not-allowed"
                                                    )}
                                                    data-testid={`error-retry-btn-${notification.id}`}
                                                >
                                                    <RefreshCw className={cn(
                                                        "w-3.5 h-3.5",
                                                        isRetrying && "animate-spin"
                                                    )} />
                                                    {isRetrying ? "Retrying..." : "Retry"}
                                                </button>
                                            )}
                                        </div>

                                        {/* Dismiss button */}
                                        {notification.dismissable && (
                                            <button
                                                onClick={() => dismissErrorNotification(notification.id)}
                                                className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors"
                                                data-testid={`error-dismiss-btn-${notification.id}`}
                                            >
                                                <X className="w-4 h-4 text-[var(--forge-text-secondary)]" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Auto-dismiss progress bar for retryable errors */}
                                {notification.retryable && (
                                    <motion.div
                                        initial={{ scaleX: 1 }}
                                        animate={{ scaleX: 0 }}
                                        transition={{ duration: 15, ease: "linear" }}
                                        onAnimationComplete={() => {
                                            if (!retryingIds.has(notification.id)) {
                                                dismissErrorNotification(notification.id);
                                            }
                                        }}
                                        className={cn(
                                            "h-0.5 origin-left",
                                            notification.type === "error" ? "bg-red-500/50" :
                                            notification.type === "warning" ? "bg-amber-500/50" :
                                            "bg-blue-500/50"
                                        )}
                                    />
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ProgressNotificationsContext.Provider>
    );
}
