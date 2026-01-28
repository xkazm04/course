/**
 * LLM Configuration
 *
 * Centralized configuration for LLM providers, models, and rate limits.
 */

// ============================================================================
// Model Definitions
// ============================================================================

export interface ModelConfig {
  id: string;
  name: string;
  context: number;
  maxOutput?: number;
  inputCostPer1k?: number;  // USD per 1k tokens
  outputCostPer1k?: number; // USD per 1k tokens
  capabilities?: string[];
}

export interface ProviderConfig {
  id: string;
  name: string;
  envKey: string;           // Environment variable name for API key
  baseUrl?: string;         // Optional custom base URL
  models: ModelConfig[];
  defaultModel: string;
}

// ============================================================================
// Anthropic Models
// ============================================================================

export const anthropicModels: ModelConfig[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    context: 200000,
    maxOutput: 16384,
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
    capabilities: ['vision', 'tool_use', 'streaming'],
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    context: 200000,
    maxOutput: 16384,
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.075,
    capabilities: ['vision', 'tool_use', 'streaming', 'extended_thinking'],
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    context: 200000,
    maxOutput: 8192,
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.015,
    capabilities: ['vision', 'tool_use', 'streaming'],
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    context: 200000,
    maxOutput: 8192,
    inputCostPer1k: 0.0008,
    outputCostPer1k: 0.004,
    capabilities: ['vision', 'tool_use', 'streaming'],
  },
];

// ============================================================================
// OpenAI Models
// ============================================================================

export const openaiModels: ModelConfig[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    context: 128000,
    maxOutput: 16384,
    inputCostPer1k: 0.005,
    outputCostPer1k: 0.015,
    capabilities: ['vision', 'tool_use', 'streaming'],
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    context: 128000,
    maxOutput: 16384,
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006,
    capabilities: ['vision', 'tool_use', 'streaming'],
  },
  {
    id: 'o1',
    name: 'O1',
    context: 200000,
    maxOutput: 100000,
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.06,
    capabilities: ['reasoning', 'streaming'],
  },
  {
    id: 'o1-mini',
    name: 'O1 Mini',
    context: 128000,
    maxOutput: 65536,
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.012,
    capabilities: ['reasoning', 'streaming'],
  },
];

// ============================================================================
// Google Models
// ============================================================================

export const googleModels: ModelConfig[] = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    context: 1000000,
    maxOutput: 8192,
    inputCostPer1k: 0.00035,
    outputCostPer1k: 0.0014,
    capabilities: ['vision', 'tool_use', 'streaming'],
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    context: 2000000,
    maxOutput: 8192,
    inputCostPer1k: 0.00125,
    outputCostPer1k: 0.005,
    capabilities: ['vision', 'tool_use', 'streaming'],
  },
];

// ============================================================================
// Provider Registry
// ============================================================================

export const providers: Record<string, ProviderConfig> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    models: anthropicModels,
    defaultModel: 'claude-sonnet-4-20250514',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    models: openaiModels,
    defaultModel: 'gpt-4o',
  },
  google: {
    id: 'google',
    name: 'Google AI',
    envKey: 'GOOGLE_AI_API_KEY',
    models: googleModels,
    defaultModel: 'gemini-2.0-flash',
  },
};

// ============================================================================
// Default Settings
// ============================================================================

export const defaultProvider = 'anthropic';
export const defaultModel = 'claude-sonnet-4-20250514';

// ============================================================================
// Rate Limit Configuration
// ============================================================================

export interface RateLimitTier {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  maxTokens: number;     // Max tokens per window
}

export const rateLimitTiers: Record<string, RateLimitTier> = {
  // Default limits for platform credentials
  platform: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 50,            // 50 requests per hour
    maxTokens: 100000,          // 100k tokens per hour
  },

  // Limits for users with their own API key
  user_connected: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 200,           // 200 requests per hour
    maxTokens: 500000,          // 500k tokens per hour
  },

  // Future premium tier
  premium: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 1000,          // 1000 requests per hour
    maxTokens: 2000000,         // 2M tokens per hour
  },
};

// ============================================================================
// Agent Configuration
// ============================================================================

export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  model: {
    provider: string;
    model: string;
  };
  tools: string[];
  maxTokens: number;
  temperature?: number;
}

export const defaultAgentConfig: AgentConfig = {
  name: 'coding-assistant',
  description: 'AI coding assistant with file and terminal access',
  systemPrompt: `You are an expert coding assistant. You help users write, debug, and understand code.

You have access to the following tools:
- read_file: Read the contents of a file
- write_file: Write content to a file
- list_files: List files in a directory
- execute_command: Execute a shell command (sandboxed)
- search_files: Search for text in files

When helping users:
1. First understand the project structure by listing files
2. Read relevant files before making changes
3. Explain your reasoning before making changes
4. Write clean, well-documented code
5. Test changes when possible

Always be helpful, accurate, and security-conscious.`,
  model: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
  },
  tools: ['read_file', 'write_file', 'list_files', 'execute_command', 'search_files'],
  maxTokens: 4096,
  temperature: 0.7,
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getProviderConfig(providerId: string): ProviderConfig | undefined {
  return providers[providerId];
}

export function getModelConfig(providerId: string, modelId: string): ModelConfig | undefined {
  const provider = providers[providerId];
  return provider?.models.find((m) => m.id === modelId);
}

export function getDefaultProviderConfig(): ProviderConfig {
  return providers[defaultProvider];
}

export function getDefaultModelConfig(): ModelConfig {
  const provider = providers[defaultProvider];
  return provider.models.find((m) => m.id === defaultModel) || provider.models[0];
}

export function getRateLimitTier(tier: string): RateLimitTier {
  return rateLimitTiers[tier] || rateLimitTiers.platform;
}

export function listAllModels(): Array<{ provider: ProviderConfig; model: ModelConfig }> {
  const allModels: Array<{ provider: ProviderConfig; model: ModelConfig }> = [];
  for (const provider of Object.values(providers)) {
    for (const model of provider.models) {
      allModels.push({ provider, model });
    }
  }
  return allModels;
}
