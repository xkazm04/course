/**
 * Current User Hook
 *
 * Simplified hook for getting current user ID (demo purposes).
 */

"use client";

const DEMO_USER_ID = "demo_user_001";

/**
 * Get current user ID (simplified for demo)
 */
export function useCurrentUser() {
    return {
        userId: DEMO_USER_ID,
        isAuthenticated: true,
    };
}
