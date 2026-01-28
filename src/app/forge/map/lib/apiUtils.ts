/**
 * API Utilities
 * Shared utilities for API calls with retry logic, error handling, and error surfacing
 */

// ============================================================================
// ERROR TYPES
// ============================================================================

export type ApiErrorType =
    | "network"      // Network connectivity issues
    | "timeout"      // Request timeout
    | "server"       // 5xx server errors
    | "client"       // 4xx client errors
    | "parse"        // JSON parsing errors
    | "unknown";     // Unknown errors

export interface ApiError {
    type: ApiErrorType;
    message: string;
    statusCode?: number;
    retryable: boolean;
    originalError?: unknown;
}

export interface ApiResult<T> {
    data: T | null;
    error: ApiError | null;
    success: boolean;
}

// ============================================================================
// ERROR NOTIFICATION SYSTEM
// ============================================================================

export interface ErrorNotification {
    id: string;
    type: "error" | "warning" | "info";
    title: string;
    message: string;
    retryable: boolean;
    retryAction?: () => Promise<void>;
    dismissable: boolean;
    timestamp: number;
}

type ErrorListener = (notification: ErrorNotification) => void;

class ApiErrorNotifier {
    private listeners: Set<ErrorListener> = new Set();

    subscribe(listener: ErrorListener): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    notify(notification: ErrorNotification): void {
        this.listeners.forEach(listener => {
            try {
                listener(notification);
            } catch (e) {
                console.error("Error in error listener:", e);
            }
        });
    }

    notifyApiError(error: ApiError, context: string, retryAction?: () => Promise<void>): void {
        const notification: ErrorNotification = {
            id: `api-error-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            type: error.retryable ? "warning" : "error",
            title: this.getErrorTitle(error, context),
            message: error.message,
            retryable: error.retryable,
            retryAction,
            dismissable: true,
            timestamp: Date.now(),
        };
        this.notify(notification);
    }

    private getErrorTitle(error: ApiError, context: string): string {
        switch (error.type) {
            case "network":
                return `Connection Error - ${context}`;
            case "timeout":
                return `Request Timeout - ${context}`;
            case "server":
                return `Server Error - ${context}`;
            case "client":
                return `Request Failed - ${context}`;
            default:
                return `Error - ${context}`;
        }
    }
}

// Singleton instance for error notifications
export const apiErrorNotifier = new ApiErrorNotifier();

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

function classifyError(error: unknown, statusCode?: number): ApiError {
    // Network errors (no response)
    if (error instanceof TypeError && error.message.includes("fetch")) {
        return {
            type: "network",
            message: "Unable to connect. Please check your internet connection.",
            retryable: true,
            originalError: error,
        };
    }

    // Timeout errors
    if (error instanceof DOMException && error.name === "AbortError") {
        return {
            type: "timeout",
            message: "Request timed out. Please try again.",
            retryable: true,
            originalError: error,
        };
    }

    // Server errors (5xx)
    if (statusCode && statusCode >= 500) {
        return {
            type: "server",
            message: "Server error. Please try again later.",
            statusCode,
            retryable: true,
            originalError: error,
        };
    }

    // Client errors (4xx)
    if (statusCode && statusCode >= 400 && statusCode < 500) {
        const message = statusCode === 401
            ? "Authentication required. Please sign in."
            : statusCode === 403
            ? "Access denied."
            : statusCode === 404
            ? "Resource not found."
            : "Request failed.";

        return {
            type: "client",
            message,
            statusCode,
            retryable: false,
            originalError: error,
        };
    }

    // Parse errors
    if (error instanceof SyntaxError) {
        return {
            type: "parse",
            message: "Invalid response from server.",
            retryable: false,
            originalError: error,
        };
    }

    // Unknown errors
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return {
        type: "unknown",
        message: errorMessage,
        retryable: false,
        originalError: error,
    };
}

// ============================================================================
// RETRY CONFIGURATION
// ============================================================================

export interface RetryConfig {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
};

function calculateBackoffDelay(attempt: number, config: RetryConfig): number {
    const delay = Math.min(
        config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelayMs
    );
    // Add jitter (±25%)
    const jitter = delay * 0.25 * (Math.random() - 0.5);
    return Math.round(delay + jitter);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// FETCH WITH RETRY
// ============================================================================

export interface FetchWithRetryOptions extends RequestInit {
    retryConfig?: Partial<RetryConfig>;
    timeoutMs?: number;
    context?: string; // For error notification context
    notifyOnError?: boolean;
    silentRetry?: boolean; // Don't notify during retries, only on final failure
}

export async function fetchWithRetry<T>(
    url: string,
    options: FetchWithRetryOptions = {}
): Promise<ApiResult<T>> {
    const {
        retryConfig: userRetryConfig,
        timeoutMs = 30000,
        context = "API Request",
        notifyOnError = true,
        silentRetry = true,
        ...fetchOptions
    } = options;

    const retryConfig: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        ...userRetryConfig,
    };

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
        try {
            // Create abort controller for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            // Handle non-OK responses
            if (!response.ok) {
                const isRetryable = retryConfig.retryableStatuses.includes(response.status);

                // Try to get error message from response body
                let errorMessage = response.statusText;
                try {
                    const errorBody = await response.json();
                    errorMessage = errorBody.error || errorBody.message || errorMessage;
                } catch {
                    // Ignore JSON parse errors for error responses
                }

                lastError = classifyError(new Error(errorMessage), response.status);

                if (isRetryable && attempt < retryConfig.maxRetries) {
                    const delay = calculateBackoffDelay(attempt, retryConfig);
                    if (!silentRetry) {
                        console.log(`[${context}] Retry ${attempt + 1}/${retryConfig.maxRetries} in ${delay}ms...`);
                    }
                    await sleep(delay);
                    continue;
                }

                // Final failure
                if (notifyOnError) {
                    const retryAction = async () => {
                        await fetchWithRetry<T>(url, options);
                    };
                    apiErrorNotifier.notifyApiError(lastError, context, retryAction);
                }

                return { data: null, error: lastError, success: false };
            }

            // Parse successful response
            const data = await response.json() as T;
            return { data, error: null, success: true };

        } catch (error) {
            lastError = classifyError(error);

            // Retry on network errors and timeouts
            if (lastError.retryable && attempt < retryConfig.maxRetries) {
                const delay = calculateBackoffDelay(attempt, retryConfig);
                if (!silentRetry) {
                    console.log(`[${context}] Retry ${attempt + 1}/${retryConfig.maxRetries} in ${delay}ms...`);
                }
                await sleep(delay);
                continue;
            }

            // Final failure
            if (notifyOnError) {
                const retryAction = async () => {
                    await fetchWithRetry<T>(url, options);
                };
                apiErrorNotifier.notifyApiError(lastError, context, retryAction);
            }

            return { data: null, error: lastError, success: false };
        }
    }

    // Should not reach here, but handle edge case
    return {
        data: null,
        error: lastError || classifyError(new Error("Max retries exceeded")),
        success: false
    };
}

// ============================================================================
// CONVENIENCE WRAPPERS
// ============================================================================

export async function fetchWithRetryGet<T>(
    url: string,
    options: Omit<FetchWithRetryOptions, "method"> = {}
): Promise<ApiResult<T>> {
    return fetchWithRetry<T>(url, {
        ...options,
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    });
}

export async function fetchWithRetryPost<T>(
    url: string,
    body: unknown,
    options: Omit<FetchWithRetryOptions, "method" | "body"> = {}
): Promise<ApiResult<T>> {
    return fetchWithRetry<T>(url, {
        ...options,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        body: JSON.stringify(body),
    });
}

// ============================================================================
// LEGACY WRAPPER
// ============================================================================

/**
 * Legacy wrapper that throws errors like the original API
 * Use this for backward compatibility with existing code
 */
export async function fetchWithRetryThrow<T>(
    url: string,
    options: FetchWithRetryOptions = {}
): Promise<T> {
    const result = await fetchWithRetry<T>(url, { ...options, notifyOnError: false });

    if (!result.success || result.error) {
        const error = result.error || classifyError(new Error("Unknown error"));
        throw new Error(error.message);
    }

    return result.data as T;
}
