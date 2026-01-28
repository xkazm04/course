/**
 * LLM Provider Configuration
 *
 * Defines available LLM providers and their models.
 * Uses centralized config from @/config/llm.
 */

import type { Model, Credentials, ChatRequest, ChatChunk } from './types';
import { createClient } from '@/lib/supabase/server';
import {
  providers as providerConfigs,
  defaultProvider,
  defaultModel,
  type ProviderConfig,
} from '@config/llm';

// ============================================================================
// Provider Interface
// ============================================================================

export interface LLMProvider {
  id: string;
  name: string;
  models: Model[];
  getCredentials: (userId: string) => Promise<Credentials>;
  chat: (
    request: ChatRequest,
    credentials: Credentials
  ) => AsyncGenerator<ChatChunk>;
}

// ============================================================================
// Anthropic Provider
// ============================================================================

async function* anthropicChat(
  request: ChatRequest,
  credentials: Credentials
): AsyncGenerator<ChatChunk> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;

  const client = new Anthropic({
    apiKey: credentials.apiKey,
  });

  // Convert tools to Anthropic format
  const tools = request.tools?.map((tool) => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema,
  }));

  const stream = client.messages.stream({
    model: request.model,
    max_tokens: request.maxTokens || 4096,
    system: request.system,
    messages: request.messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    tools: tools as any,
  });

  // Track tool IDs by index (Anthropic uses index for streaming, but gives ID at start)
  const toolIdsByIndex = new Map<number, string>();

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      const delta = event.delta as any;
      if (delta.type === 'text_delta') {
        yield { type: 'text', text: delta.text };
      } else if (delta.type === 'input_json_delta') {
        // Use the tool ID we stored when the tool started
        const toolId = toolIdsByIndex.get(event.index) || String(event.index);
        yield {
          type: 'tool_input',
          toolId,
          partialJson: delta.partial_json,
        };
      }
    } else if (event.type === 'content_block_start') {
      const block = event.content_block as any;
      if (block.type === 'tool_use') {
        // Store the mapping between index and tool ID
        toolIdsByIndex.set(event.index, block.id);
        yield {
          type: 'tool_start',
          toolId: block.id,
          toolName: block.name,
        };
      }
    } else if (event.type === 'content_block_stop') {
      // Tool call completed - check if it was a tool
      const toolId = toolIdsByIndex.get(event.index);
      if (toolId) {
        yield { type: 'tool_end', toolId };
      }
    } else if (event.type === 'message_delta') {
      const finalMessage = await stream.finalMessage();
      yield {
        type: 'usage',
        usage: {
          input_tokens: finalMessage.usage.input_tokens,
          output_tokens: finalMessage.usage.output_tokens,
          total_tokens:
            finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
        },
      };
    }
  }
}

// ============================================================================
// Provider Registry
// ============================================================================

// Build models from config
const anthropicConfig = providerConfigs.anthropic;
const anthropicModels: Model[] = anthropicConfig.models.map((m) => ({
  id: m.id,
  name: m.name,
  context: m.context,
  maxOutput: m.maxOutput,
}));

export const providers: Record<string, LLMProvider> = {
  anthropic: {
    id: anthropicConfig.id,
    name: anthropicConfig.name,
    models: anthropicModels,
    getCredentials: async (userId: string): Promise<Credentials> => {
      // Check if user has connected their Claude account
      const userKey = await getUserApiKey(userId, 'claude');
      if (userKey) {
        return { type: 'user', apiKey: userKey };
      }
      // Fall back to platform key
      const platformKey = process.env[anthropicConfig.envKey];
      if (!platformKey) {
        throw new Error(`No ${anthropicConfig.name} API key configured`);
      }
      return { type: 'platform', apiKey: platformKey };
    },
    chat: anthropicChat,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get user's API key from settings.
 * Note: Using 'as any' to bypass strict Supabase types until migration is applied.
 */
async function getUserApiKey(
  userId: string,
  provider: 'claude' | 'openai'
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const column =
      provider === 'claude'
        ? 'claude_api_key_encrypted'
        : 'openai_api_key_encrypted';

    // Use 'as any' to bypass strict typing for agent_user_settings table
    const { data } = await (supabase as any)
      .from('agent_user_settings')
      .select(column)
      .eq('user_id', userId)
      .single();

    if (!data || !data[column]) {
      return null;
    }

    // Decrypt the API key
    const { decrypt } = await import('./crypto');
    return decrypt(data[column], process.env.ENCRYPTION_KEY!);
  } catch {
    return null;
  }
}

export function getProvider(providerId: string): LLMProvider {
  const provider = providers[providerId];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }
  return provider;
}

export function getDefaultProvider(): LLMProvider {
  return providers[defaultProvider];
}

export function getDefaultModel(): Model {
  const provider = providers[defaultProvider];
  const model = provider.models.find((m) => m.id === defaultModel);
  return model || provider.models[0];
}
