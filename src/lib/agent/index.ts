/**
 * AI Agent Platform - Public Exports
 */

// Types
export type {
  Model,
  Credentials,
  ChatRequest,
  ChatChunk,
  TokenUsage,
  Message,
  ToolMessage,
  Tool,
  ToolCall,
  ToolResult,
  ToolContext,
  AgentConfig,
  AgentContext,
  AgentEvent,
  RateLimitConfig,
  RateLimitResult,
  ChatAPIRequest,
  Session,
  Project,
} from './types';

// Agent
export { Agent, createAgent, defaultAgentConfig } from './agent';

// Router
export { LLMRouter, llmRouter } from './router';

// Providers
export {
  providers,
  getProvider,
  getDefaultProvider,
  getDefaultModel,
} from './providers';
export type { LLMProvider } from './providers';

// Tools
export {
  toolRegistry,
  defineTool,
  getVirtualFS,
  deleteVirtualFS,
} from './tools';
export type { ToolDefinition } from './tools';

// Rate Limiting
export {
  checkRateLimit,
  recordTokenUsage,
  getRateLimitStatus,
  RateLimitError,
  rateLimitConfig,
} from './rate-limit';

// Crypto
export { encrypt, decrypt, generateEncryptionKey } from './crypto';
