/**
 * Rate Limiting for AI Agent Platform
 *
 * In-memory rate limiter with per-user and per-provider limits.
 * Can be upgraded to Redis for production.
 */

import type { RateLimitConfig, RateLimitResult } from './types';
import { createClient } from '@/lib/supabase/server';
import { rateLimitTiers, getRateLimitTier } from '@config/llm';

// ============================================================================
// Rate Limit Configuration (from centralized config)
// ============================================================================

export const rateLimitConfig: Record<string, RateLimitConfig> = {
  platform: rateLimitTiers.platform,
  user_connected: rateLimitTiers.user_connected,
};

// ============================================================================
// In-Memory Store
// ============================================================================

interface RateLimitEntry {
  requests: number;
  tokens: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, entry] of rateLimitStore.entries()) {
        if (now - entry.windowStart > 2 * 60 * 60 * 1000) {
          // 2 hours
          rateLimitStore.delete(key);
        }
      }
    },
    5 * 60 * 1000
  );
}

// ============================================================================
// Rate Limit Functions
// ============================================================================

/**
 * Check if a request is within rate limits
 */
export async function checkRateLimit(
  userId: string,
  provider: string = 'anthropic',
  tokensToUse: number = 0
): Promise<RateLimitResult> {
  const config = await getUserRateLimitConfig(userId);
  const key = `${userId}:${provider}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Check if window has expired
  if (!entry || now - entry.windowStart > config.windowMs) {
    entry = {
      requests: 0,
      tokens: 0,
      windowStart: now,
    };
    rateLimitStore.set(key, entry);
  }

  const resetAt = new Date(entry.windowStart + config.windowMs);

  // Check request limit
  if (entry.requests >= config.maxRequests) {
    return {
      allowed: false,
      remaining: {
        requests: 0,
        tokens: Math.max(0, config.maxTokens - entry.tokens),
      },
      resetAt,
      retryAfter: Math.ceil(
        (entry.windowStart + config.windowMs - now) / 1000
      ),
    };
  }

  // Check token limit
  if (entry.tokens + tokensToUse > config.maxTokens) {
    return {
      allowed: false,
      remaining: {
        requests: Math.max(0, config.maxRequests - entry.requests),
        tokens: 0,
      },
      resetAt,
      retryAfter: Math.ceil(
        (entry.windowStart + config.windowMs - now) / 1000
      ),
    };
  }

  // Increment request counter (tokens are tracked after completion)
  entry.requests += 1;

  return {
    allowed: true,
    remaining: {
      requests: config.maxRequests - entry.requests,
      tokens: config.maxTokens - entry.tokens,
    },
    resetAt,
  };
}

/**
 * Record token usage after a request completes
 */
export async function recordTokenUsage(
  userId: string,
  provider: string,
  tokens: number
): Promise<void> {
  const key = `${userId}:${provider}`;
  const entry = rateLimitStore.get(key);

  if (entry) {
    entry.tokens += tokens;
  }
}

/**
 * Get rate limit configuration based on user's connection status
 */
async function getUserRateLimitConfig(
  userId: string
): Promise<RateLimitConfig> {
  const hasUserCredentials = await checkUserHasApiKey(userId);
  return hasUserCredentials
    ? rateLimitConfig.user_connected
    : rateLimitConfig.platform;
}

/**
 * Check if user has connected their own API key
 * Note: Using 'as any' to bypass strict Supabase types until migration is applied.
 */
async function checkUserHasApiKey(userId: string): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Use 'as any' to bypass strict typing for agent_user_settings table
    const { data } = await (supabase as any)
      .from('agent_user_settings')
      .select('claude_api_key_encrypted, openai_api_key_encrypted')
      .eq('user_id', userId)
      .single();

    return !!(data?.claude_api_key_encrypted || data?.openai_api_key_encrypted);
  } catch {
    return false;
  }
}

/**
 * Get current rate limit status for a user
 */
export async function getRateLimitStatus(
  userId: string,
  provider: string = 'anthropic'
): Promise<RateLimitResult> {
  return checkRateLimit(userId, provider, 0);
}

// ============================================================================
// Rate Limit Error
// ============================================================================

export class RateLimitError extends Error {
  resetAt: Date;
  retryAfter: number;

  constructor(resetAt: Date, retryAfter?: number) {
    super('Rate limit exceeded');
    this.name = 'RateLimitError';
    this.resetAt = resetAt;
    this.retryAfter =
      retryAfter || Math.ceil((resetAt.getTime() - Date.now()) / 1000);
  }
}
