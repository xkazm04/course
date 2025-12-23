/**
 * Goal Path Response Parsers
 *
 * Utilities for parsing and validating JSON responses from the Claude API.
 * Includes type guards, validators, and safe parsing functions.
 */

import type {
    LiveFormResponse,
    ChatResponse,
    EnhancedResponse,
    OracleResponse,
    PathModule,
    Milestone,
    APIError,
} from "./types";

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Create a standardized API error
 */
export function createAPIError(
    code: string,
    message: string,
    details?: Record<string, unknown>
): APIError {
    return { code, message, details };
}

/**
 * Common error codes
 */
export const ErrorCodes = {
    PARSE_ERROR: "PARSE_ERROR",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    API_ERROR: "API_ERROR",
    RATE_LIMIT: "RATE_LIMIT",
    TIMEOUT: "TIMEOUT",
    INVALID_REQUEST: "INVALID_REQUEST",
} as const;

// ============================================================================
// JSON PARSING
// ============================================================================

/**
 * Safely parse JSON from API response
 */
export function safeParseJSON<T>(text: string): { success: true; data: T } | { success: false; error: APIError } {
    try {
        // Remove potential markdown code blocks
        let cleanText = text.trim();
        if (cleanText.startsWith("```json")) {
            cleanText = cleanText.slice(7);
        }
        if (cleanText.startsWith("```")) {
            cleanText = cleanText.slice(3);
        }
        if (cleanText.endsWith("```")) {
            cleanText = cleanText.slice(0, -3);
        }
        cleanText = cleanText.trim();

        const data = JSON.parse(cleanText) as T;
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error: createAPIError(
                ErrorCodes.PARSE_ERROR,
                "Failed to parse JSON response",
                { originalError: error instanceof Error ? error.message : String(error) }
            ),
        };
    }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if value is a valid PathModule
 */
export function isValidPathModule(value: unknown): value is PathModule {
    if (!value || typeof value !== "object") return false;
    const mod = value as Record<string, unknown>;

    return (
        typeof mod.title === "string" &&
        typeof mod.description === "string" &&
        Array.isArray(mod.topics) &&
        typeof mod.estimatedHours === "number" &&
        typeof mod.sequence === "number" &&
        Array.isArray(mod.skills)
    );
}

/**
 * Check if value is a valid Milestone
 */
export function isValidMilestone(value: unknown): value is Milestone {
    if (!value || typeof value !== "object") return false;
    const ms = value as Record<string, unknown>;

    return (
        typeof ms.id === "string" &&
        typeof ms.title === "string" &&
        typeof ms.targetWeek === "number" &&
        Array.isArray(ms.skillsAcquired) &&
        typeof ms.jobMatchIncrease === "number"
    );
}

/**
 * Check if value is a valid LiveFormResponse
 */
export function isValidLiveFormResponse(value: unknown): value is LiveFormResponse {
    if (!value || typeof value !== "object") return false;
    const resp = value as Record<string, unknown>;

    return (
        typeof resp.pathId === "string" &&
        typeof resp.goal === "string" &&
        typeof resp.totalHours === "number" &&
        typeof resp.estimatedWeeks === "number" &&
        typeof resp.moduleCount === "number" &&
        typeof resp.topicCount === "number" &&
        Array.isArray(resp.modules) &&
        resp.modules.every(isValidPathModule) &&
        typeof resp.isJobReady === "boolean" &&
        typeof resp.skillLevel === "string" &&
        Array.isArray(resp.recommendations)
    );
}

/**
 * Check if value is a valid ChatResponse
 */
export function isValidChatResponse(value: unknown): value is ChatResponse {
    if (!value || typeof value !== "object") return false;
    const resp = value as Record<string, unknown>;

    return (
        typeof resp.message === "string" &&
        typeof resp.stage === "string" &&
        typeof resp.collectedData === "object" &&
        typeof resp.isComplete === "boolean"
    );
}

/**
 * Check if value is a valid EnhancedResponse
 */
export function isValidEnhancedResponse(value: unknown): value is EnhancedResponse {
    if (!value || typeof value !== "object") return false;
    const resp = value as Record<string, unknown>;

    return (
        typeof resp.pathId === "string" &&
        typeof resp.goal === "string" &&
        Array.isArray(resp.modules) &&
        Array.isArray(resp.milestones) &&
        typeof resp.estimatedWeeks === "number" &&
        typeof resp.lessonCount === "number" &&
        typeof resp.projectCount === "number"
    );
}

/**
 * Check if value is a valid OracleResponse
 */
export function isValidOracleResponse(value: unknown): value is OracleResponse {
    if (!value || typeof value !== "object") return false;
    const resp = value as Record<string, unknown>;

    return (
        typeof resp.action === "string" &&
        ["predictions", "path", "jobs"].includes(resp.action as string)
    );
}

// ============================================================================
// VALIDATORS
// ============================================================================

/**
 * Validate and normalize LiveFormResponse
 */
export function validateLiveFormResponse(
    data: unknown
): { valid: true; data: LiveFormResponse } | { valid: false; error: APIError } {
    const parseResult = typeof data === "string"
        ? safeParseJSON<LiveFormResponse>(data)
        : { success: true as const, data: data as LiveFormResponse };

    if (!parseResult.success) {
        return { valid: false, error: parseResult.error };
    }

    const response = parseResult.data;

    // Validate structure
    if (!isValidLiveFormResponse(response)) {
        return {
            valid: false,
            error: createAPIError(
                ErrorCodes.VALIDATION_ERROR,
                "Response does not match expected LiveFormResponse structure"
            ),
        };
    }

    // Normalize data
    const normalized: LiveFormResponse = {
        ...response,
        pathId: response.pathId || generateId(),
        totalHours: Math.max(0, response.totalHours),
        estimatedWeeks: Math.max(1, response.estimatedWeeks),
        moduleCount: response.modules.length,
        topicCount: response.modules.reduce((sum, m) => sum + m.topics.length, 0),
        modules: response.modules.map((m, i) => ({
            ...m,
            sequence: m.sequence ?? i + 1,
            estimatedHours: Math.max(0, m.estimatedHours),
            resources: m.resources || [],
        })),
    };

    return { valid: true, data: normalized };
}

/**
 * Validate and normalize ChatResponse
 */
export function validateChatResponse(
    data: unknown
): { valid: true; data: ChatResponse } | { valid: false; error: APIError } {
    const parseResult = typeof data === "string"
        ? safeParseJSON<ChatResponse>(data)
        : { success: true as const, data: data as ChatResponse };

    if (!parseResult.success) {
        return { valid: false, error: parseResult.error };
    }

    const response = parseResult.data;

    if (!isValidChatResponse(response)) {
        return {
            valid: false,
            error: createAPIError(
                ErrorCodes.VALIDATION_ERROR,
                "Response does not match expected ChatResponse structure"
            ),
        };
    }

    return { valid: true, data: response };
}

/**
 * Validate and normalize EnhancedResponse
 */
export function validateEnhancedResponse(
    data: unknown
): { valid: true; data: EnhancedResponse } | { valid: false; error: APIError } {
    const parseResult = typeof data === "string"
        ? safeParseJSON<EnhancedResponse>(data)
        : { success: true as const, data: data as EnhancedResponse };

    if (!parseResult.success) {
        return { valid: false, error: parseResult.error };
    }

    const response = parseResult.data;

    if (!isValidEnhancedResponse(response)) {
        return {
            valid: false,
            error: createAPIError(
                ErrorCodes.VALIDATION_ERROR,
                "Response does not match expected EnhancedResponse structure"
            ),
        };
    }

    // Normalize
    const normalized: EnhancedResponse = {
        ...response,
        pathId: response.pathId || generateId(),
        estimatedWeeks: Math.max(1, response.estimatedWeeks),
        lessonCount: Math.max(0, response.lessonCount),
        projectCount: Math.max(0, response.projectCount),
        successProbability: Math.min(100, Math.max(0, response.successProbability || 75)),
        skillProgression: response.skillProgression || [],
        tips: response.tips || [],
    };

    return { valid: true, data: normalized };
}

/**
 * Validate and normalize OracleResponse
 */
export function validateOracleResponse(
    data: unknown
): { valid: true; data: OracleResponse } | { valid: false; error: APIError } {
    const parseResult = typeof data === "string"
        ? safeParseJSON<OracleResponse>(data)
        : { success: true as const, data: data as OracleResponse };

    if (!parseResult.success) {
        return { valid: false, error: parseResult.error };
    }

    const response = parseResult.data;

    if (!isValidOracleResponse(response)) {
        return {
            valid: false,
            error: createAPIError(
                ErrorCodes.VALIDATION_ERROR,
                "Response does not match expected OracleResponse structure"
            ),
        };
    }

    return { valid: true, data: response };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Generate a unique ID
 */
export function generateId(): string {
    return `path-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Extract metrics from a path response
 */
export function extractPathMetrics(response: LiveFormResponse | EnhancedResponse): {
    totalHours: number;
    totalWeeks: number;
    moduleCount: number;
    topicCount: number;
    skillCount: number;
} {
    const modules = response.modules;

    return {
        totalHours: "totalHours" in response
            ? response.totalHours
            : modules.reduce((sum, m) => sum + m.estimatedHours, 0),
        totalWeeks: response.estimatedWeeks,
        moduleCount: modules.length,
        topicCount: modules.reduce((sum, m) => sum + m.topics.length, 0),
        skillCount: new Set(modules.flatMap(m => m.skills)).size,
    };
}

/**
 * Calculate completion percentage based on progress
 */
export function calculateCompletionPercentage(
    completedModules: number,
    totalModules: number
): number {
    if (totalModules === 0) return 0;
    return Math.round((completedModules / totalModules) * 100);
}

/**
 * Estimate time to complete remaining path
 */
export function estimateRemainingTime(
    response: LiveFormResponse | EnhancedResponse,
    completedModuleIds: string[]
): { hours: number; weeks: number } {
    const remainingModules = response.modules.filter(
        m => !completedModuleIds.includes(m.title) // Using title as ID fallback
    );

    const hours = remainingModules.reduce((sum, m) => sum + m.estimatedHours, 0);
    const avgHoursPerWeek = response.modules.reduce((sum, m) => sum + m.estimatedHours, 0) / response.estimatedWeeks;

    return {
        hours,
        weeks: Math.ceil(hours / avgHoursPerWeek),
    };
}

/**
 * Format duration for display
 */
export function formatDuration(hours: number): string {
    if (hours < 1) {
        return `${Math.round(hours * 60)} min`;
    }
    if (hours < 10) {
        return `${hours.toFixed(1)}h`;
    }
    return `${Math.round(hours)}h`;
}

/**
 * Format weeks for display
 */
export function formatWeeks(weeks: number): string {
    if (weeks < 4) {
        return `${weeks} week${weeks !== 1 ? "s" : ""}`;
    }
    const months = Math.round(weeks / 4);
    return `${months} month${months !== 1 ? "s" : ""}`;
}
