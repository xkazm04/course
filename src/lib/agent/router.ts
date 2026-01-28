/**
 * LLM Router Service
 *
 * Routes LLM requests to the appropriate provider,
 * handles credentials, rate limiting, and usage tracking.
 */

import type { Message, Tool, ChatChunk, Credentials } from './types';
import { getProvider } from './providers';
import { checkRateLimit, recordTokenUsage, RateLimitError } from './rate-limit';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// LLM Router
// ============================================================================

export class LLMRouter {
  /**
   * Send a chat request to an LLM provider
   */
  async *chat(
    userId: string,
    providerId: string,
    modelId: string,
    messages: Message[],
    options: {
      system?: string;
      tools?: Tool[];
      maxTokens?: number;
    } = {}
  ): AsyncGenerator<ChatChunk> {
    // 1. Get provider
    const provider = getProvider(providerId);

    // 2. Check rate limit
    const rateLimitResult = await checkRateLimit(userId, providerId);
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(
        rateLimitResult.resetAt,
        rateLimitResult.retryAfter
      );
    }

    // 3. Get credentials (user's or platform's)
    const credentials = await provider.getCredentials(userId);

    // 4. Track start time for latency
    const startTime = Date.now();

    // 5. Make the request
    const stream = provider.chat(
      {
        model: modelId,
        messages,
        system: options.system,
        tools: options.tools,
        maxTokens: options.maxTokens,
        stream: true,
      },
      credentials
    );

    // 6. Track usage and yield chunks
    let totalTokens = 0;

    try {
      for await (const chunk of stream) {
        if (chunk.type === 'usage') {
          totalTokens = chunk.usage.total_tokens;
        }
        yield chunk;
      }
    } finally {
      // 7. Record usage after completion
      const latencyMs = Date.now() - startTime;

      await Promise.all([
        recordTokenUsage(userId, providerId, totalTokens),
        this.logUsage(
          userId,
          providerId,
          modelId,
          totalTokens,
          latencyMs,
          credentials.type
        ),
      ]);
    }
  }

  /**
   * Log usage to database for analytics
   * Note: Using 'as any' to bypass strict Supabase types until migration is applied.
   */
  private async logUsage(
    userId: string,
    provider: string,
    model: string,
    totalTokens: number,
    latencyMs: number,
    credentialType: Credentials['type']
  ): Promise<void> {
    try {
      const supabase = await createClient();

      // Use 'as any' to bypass strict typing for agent_usage_analytics table
      await (supabase as any).from('agent_usage_analytics').insert({
        user_id: userId,
        provider,
        model,
        credential_type: credentialType,
        total_tokens: totalTokens,
        input_tokens: 0, // Could be tracked separately if needed
        output_tokens: totalTokens,
        latency_ms: latencyMs,
      });
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to log usage:', error);
    }
  }
}

// Singleton instance
export const llmRouter = new LLMRouter();
