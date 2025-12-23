/**
 * Storage Helper Functions
 *
 * Generic helpers for localStorage operations.
 */

/**
 * Get storage item with type safety
 */
export function getStorageItem<T>(key: string, defaultValue: T): T {
    if (typeof window === "undefined") return defaultValue;

    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
}

/**
 * Set storage item with type safety
 */
export function setStorageItem<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error(`Failed to save to localStorage: ${key}`, error);
    }
}
