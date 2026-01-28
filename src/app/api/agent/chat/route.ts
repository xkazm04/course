/**
 * Agent Chat API
 *
 * Streaming chat endpoint for the AI agent platform.
 * Uses Server-Sent Events (SSE) for real-time response streaming.
 * Supports tool execution via the Agent class.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAgent } from '@/lib/agent/agent';
import { RateLimitError, checkRateLimit } from '@/lib/agent/rate-limit';
import { getDefaultProvider, getDefaultModel } from '@/lib/agent/providers';
import type { ChatAPIRequest, Message, AgentEvent } from '@/lib/agent/types';

// Type for raw database rows (bypassing strict Supabase types until migration is applied)
interface DbSession {
  id: string;
  user_id: string;
  project_id: string | null;
  model_provider: string;
  model_id: string;
}

interface DbMessage {
  role: string;
  content: string;
}

/**
 * POST /api/agent/chat
 *
 * Stream a chat response from the LLM.
 * Supports session management and message persistence.
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request
    const body = (await request.json()) as ChatAPIRequest;
    const { sessionId, projectId, message, model } = body;

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get or create session
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      // Use 'as any' to bypass strict Supabase types until migration is applied
      const insertResult = await (supabase as any)
        .from('agent_sessions')
        .insert({
          user_id: user.id,
          project_id: projectId || null,
          model_provider: model?.provider || getDefaultProvider().id,
          model_id: model?.model || getDefaultModel().id,
        })
        .select('id')
        .single();

      if (insertResult.error || !insertResult.data) {
        return new Response(
          JSON.stringify({ error: 'Failed to create session', details: insertResult.error?.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      currentSessionId = insertResult.data.id;
    }

    // Get conversation history - use 'as any' to bypass strict typing
    const { data: history } = await (supabase as any)
      .from('agent_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(50) as { data: DbMessage[] | null };

    const messages: Message[] = [
      ...(history || []).map((m: DbMessage) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Save user message - use 'as any' to bypass strict typing
    await (supabase as any).from('agent_messages').insert({
      session_id: currentSessionId,
      role: 'user',
      content: message,
    });

    // Check rate limit before starting
    const rateLimitResult = await checkRateLimit(user.id);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          resetAt: rateLimitResult.resetAt.toISOString(),
          retryAfter: rateLimitResult.retryAfter,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Provider/model selection
    const providerId = model?.provider || getDefaultProvider().id;
    const modelId = model?.model || getDefaultModel().id;

    // Create Agent with configuration
    const agent = createAgent(user.id, currentSessionId!, {
      model: {
        provider: providerId,
        model: modelId,
      },
    });

    // Build agent context
    const agentContext = {
      projectId: projectId || currentSessionId,
      workingDirectory: '/',
      recentMessages: (history || []).map((m: DbMessage) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    };

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';
          const toolCalls: Array<{ name: string; input?: Record<string, unknown> }> = [];
          const toolResults: Array<{ name: string; result: unknown }> = [];

          // Stream from Agent
          const agentStream = agent.chat(message, agentContext);

          for await (const event of agentStream) {
            // Send event as SSE
            const data = JSON.stringify(event);
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));

            // Track for persistence
            if (event.type === 'text') {
              fullResponse += event.text;
            } else if (event.type === 'tool_start') {
              toolCalls.push({ name: event.tool, input: event.input });
            } else if (event.type === 'tool_result') {
              toolResults.push({ name: event.tool, result: event.result });
            }
          }

          // Save assistant response - use 'as any' to bypass strict typing
          if (fullResponse || toolCalls.length > 0) {
            await (supabase as any).from('agent_messages').insert({
              session_id: currentSessionId,
              role: 'assistant',
              content: fullResponse,
              tool_calls: toolCalls.length > 0 ? toolCalls : null,
              tool_results: toolResults.length > 0 ? toolResults : null,
            });
          }

          controller.close();
        } catch (error) {
          // Handle errors in stream
          if (error instanceof RateLimitError) {
            const errorData = JSON.stringify({
              type: 'error',
              error: 'Rate limit exceeded',
              retryAfter: error.retryAfter,
              resetAt: error.resetAt.toISOString(),
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          } else {
            const errorData = JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          }
          controller.close();
        }
      },
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Session-Id': currentSessionId || '',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
