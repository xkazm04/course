"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
    CourseProgress,
    ContinueLearningItem,
} from "./types";
import {
    getAllCoursesProgress,
    getContinueLearningItems,
    getTotalWatchTime,
    getOverallCompletionRate,
    clearAllProgress,
    downloadProgressData,
    exportProgressData,
    importProgressData,
} from "./progressStorage";

interface ProgressContextValue {
    courses: CourseProgress[];
    continueLearning: ContinueLearningItem[];
    totalWatchTime: number;
    overallCompletion: number;
    isLoading: boolean;
    refresh: () => void;
    clearAll: () => void;
    exportData: () => string;
    downloadData: (filename?: string) => void;
    importData: (jsonString: string) => boolean;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
    const [courses, setCourses] = useState<CourseProgress[]>([]);
    const [continueLearning, setContinueLearning] = useState<ContinueLearningItem[]>([]);
    const [totalWatchTime, setTotalWatchTime] = useState(0);
    const [overallCompletion, setOverallCompletion] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const refresh = useCallback(() => {
        setCourses(getAllCoursesProgress());
        setContinueLearning(getContinueLearningItems());
        setTotalWatchTime(getTotalWatchTime());
        setOverallCompletion(getOverallCompletionRate());
    }, []);

    useEffect(() => {
        refresh();
        setIsLoading(false);

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "course-progress") {
                refresh();
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, [refresh]);

    const clearAll = useCallback(() => {
        clearAllProgress();
        refresh();
    }, [refresh]);

    const exportData = useCallback(() => {
        return exportProgressData();
    }, []);

    const downloadData = useCallback((filename?: string) => {
        downloadProgressData(filename);
    }, []);

    const importData = useCallback((jsonString: string) => {
        const success = importProgressData(jsonString);
        if (success) {
            refresh();
        }
        return success;
    }, [refresh]);

    return (
        <ProgressContext.Provider
            value={{
                courses,
                continueLearning,
                totalWatchTime,
                overallCompletion,
                isLoading,
                refresh,
                clearAll,
                exportData,
                downloadData,
                importData,
            }}
        >
            {children}
        </ProgressContext.Provider>
    );
}

export function useProgressContext() {
    const context = useContext(ProgressContext);
    if (!context) {
        throw new Error("useProgressContext must be used within a ProgressProvider");
    }
    return context;
}
