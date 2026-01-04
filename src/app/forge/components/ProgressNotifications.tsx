"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { XPToast } from "./XPToast";
import { AchievementModal } from "./AchievementModal";

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

    return (
        <ProgressNotificationsContext.Provider
            value={{
                showXPToast,
                showAchievementModal,
                queueAchievements,
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
        </ProgressNotificationsContext.Provider>
    );
}
