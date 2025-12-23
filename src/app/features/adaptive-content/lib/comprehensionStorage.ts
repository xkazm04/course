/**
 * Comprehension Storage
 *
 * Persists comprehension model to localStorage with versioning
 * and migration support.
 */

import type {
    ComprehensionModel,
    StoredComprehensionData,
    BehaviorSignal,
} from "./types";
import {
    COMPREHENSION_STORAGE_KEY,
    COMPREHENSION_VERSION,
} from "./types";
import {
    createComprehensionModel,
    updateComprehensionModel,
} from "./comprehensionEngine";

/**
 * Get storage key for a course
 */
function getStorageKey(courseId: string): string {
    return `${COMPREHENSION_STORAGE_KEY}-${courseId}`;
}

/**
 * Load comprehension model from storage
 */
export function loadComprehensionModel(courseId: string, userId?: string): ComprehensionModel {
    if (typeof window === "undefined") {
        return createComprehensionModel(courseId, userId);
    }

    try {
        const key = getStorageKey(courseId);
        const stored = localStorage.getItem(key);

        if (!stored) {
            return createComprehensionModel(courseId, userId);
        }

        const data: StoredComprehensionData = JSON.parse(stored);

        // Handle version migrations here if needed
        if (data.version < COMPREHENSION_VERSION) {
            // Future migration logic
            console.log(`Migrating comprehension data from v${data.version} to v${COMPREHENSION_VERSION}`);
        }

        return data.model;
    } catch (error) {
        console.warn("Failed to load comprehension model:", error);
        return createComprehensionModel(courseId, userId);
    }
}

/**
 * Save comprehension model to storage
 */
export function saveComprehensionModel(model: ComprehensionModel): void {
    if (typeof window === "undefined") return;

    try {
        const key = getStorageKey(model.courseId);
        const data: StoredComprehensionData = {
            model,
            version: COMPREHENSION_VERSION,
        };
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.warn("Failed to save comprehension model:", error);
    }
}

/**
 * Record a behavior signal and update the model
 */
export function recordSignal(courseId: string, signal: BehaviorSignal): ComprehensionModel {
    const model = loadComprehensionModel(courseId);
    const updatedModel = updateComprehensionModel(model, signal);
    saveComprehensionModel(updatedModel);
    return updatedModel;
}

/**
 * Clear comprehension data for a course
 */
export function clearComprehensionData(courseId: string): void {
    if (typeof window === "undefined") return;

    try {
        const key = getStorageKey(courseId);
        localStorage.removeItem(key);
    } catch (error) {
        console.warn("Failed to clear comprehension data:", error);
    }
}

/**
 * Get all stored course IDs with comprehension data
 */
export function getStoredCourseIds(): string[] {
    if (typeof window === "undefined") return [];

    const courseIds: string[] = [];
    const prefix = `${COMPREHENSION_STORAGE_KEY}-`;

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(prefix)) {
                courseIds.push(key.slice(prefix.length));
            }
        }
    } catch (error) {
        console.warn("Failed to get stored course IDs:", error);
    }

    return courseIds;
}

/**
 * Export comprehension data for backup/transfer
 */
export function exportComprehensionData(courseId: string): string | null {
    if (typeof window === "undefined") return null;

    try {
        const key = getStorageKey(courseId);
        return localStorage.getItem(key);
    } catch (error) {
        console.warn("Failed to export comprehension data:", error);
        return null;
    }
}

/**
 * Import comprehension data from backup
 */
export function importComprehensionData(courseId: string, data: string): boolean {
    if (typeof window === "undefined") return false;

    try {
        // Validate the data structure
        const parsed = JSON.parse(data) as StoredComprehensionData;
        if (!parsed.model || typeof parsed.version !== "number") {
            throw new Error("Invalid comprehension data format");
        }

        const key = getStorageKey(courseId);
        localStorage.setItem(key, data);
        return true;
    } catch (error) {
        console.warn("Failed to import comprehension data:", error);
        return false;
    }
}
