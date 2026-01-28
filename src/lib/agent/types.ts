/**
 * AI Agent Platform - Type Definitions
 */

// ============================================================================
// LLM Provider Types
// ============================================================================

export interface Model {
  id: string;
  name: string;
  context: number;
  maxOutput?: number;
}

export interface Credentials {
  type: 'platform' | 'user';
  apiKey: string;
}

export interface ChatRequest {
  model: string;
  messages: Message[];
  system?: string;
  tools?: Tool[];
  maxTokens?: number;
  stream?: boolean;
}

export type ChatChunk =
  | { type: 'text'; text: string }
  | { type: 'tool_start'; toolId: string; toolName: string }
  | { type: 'tool_input'; toolId: string; partialJson: string }
  | { type: 'tool_end'; toolId: string }
  | { type: 'usage'; usage: TokenUsage }
  | { type: 'error'; error: string };

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

// ============================================================================
// Message Types
// ============================================================================

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolMessage {
  role: 'tool';
  toolCallId: string;
  content: string;
}

// ============================================================================
// Tool Types
// ============================================================================

export interface Tool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  input: string;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
}

export interface ToolContext {
  userId: string;
  sessionId: string;
  projectId?: string;
  workingDirectory: string;
}

// ============================================================================
// Agent Types
// ============================================================================

export interface AgentConfig {
  name: string;
  description?: string;
  systemPrompt: string;
  tools: string[];
  model: {
    provider: string;
    model: string;
  };
  maxTokens?: number;
  temperature?: number;
}

export interface AgentContext {
  projectId?: string;
  workingDirectory: string;
  recentMessages: Message[];
}

export type AgentEvent =
  | { type: 'text'; text: string }
  | { type: 'thinking'; text: string }
  | { type: 'tool_start'; tool: string; input?: Record<string, unknown> }
  | { type: 'tool_result'; tool: string; result: ToolResult }
  | { type: 'error'; message: string }
  | { type: 'done'; sessionId: string };

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  maxTokens: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: {
    requests: number;
    tokens: number;
  };
  resetAt: Date;
  retryAfter?: number;
}

// ============================================================================
// API Types
// ============================================================================

export interface ChatAPIRequest {
  sessionId?: string;
  projectId?: string;
  message: string;
  model?: {
    provider: string;
    model: string;
  };
}

export interface Session {
  id: string;
  userId: string;
  projectId?: string;
  title?: string;
  modelProvider: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}
