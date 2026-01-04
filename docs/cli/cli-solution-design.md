# Browser-Based AI Coding Agent Platform

## Solution Design Document

**Version:** 1.0  
**Date:** January 2025  
**Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Goals & Requirements](#2-goals--requirements)
3. [Architecture Overview](#3-architecture-overview)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [LLM Provider Integration](#5-llm-provider-integration)
6. [OpenCode Integration](#6-opencode-integration)
7. [Database Schema](#7-database-schema)
8. [API Design](#8-api-design)
9. [Rate Limiting](#9-rate-limiting)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Security Considerations](#11-security-considerations)
12. [Implementation Phases](#12-implementation-phases)
13. [Future Enhancements](#13-future-enhancements)

---

## 1. Executive Summary

### Project Vision

Build a browser-based AI coding agent platform that provides users with a Claude Code / OpenCode-like experience directly in their web browser. The platform will be offered free initially, using platform-owned LLM credentials, with the option for users to connect their Claude Pro/Max subscriptions.

### Key Features

- **Browser-based IDE**: Terminal emulator, Monaco editor, file explorer
- **AI Coding Agent**: OpenCode-based agent with tool execution capabilities
- **Multi-Provider LLM Support**: Anthropic (Claude), OpenAI, Google, etc.
- **Claude Pro/Max Integration**: Users can authenticate with their existing Claude subscription
- **Virtual Filesystem**: Sandboxed project workspace per user
- **Real-time Streaming**: WebSocket-based streaming for LLM responses

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (App Router), React, TypeScript |
| UI Components | shadcn/ui, Tailwind CSS |
| Terminal | xterm.js |
| Code Editor | Monaco Editor |
| Backend | Next.js API Routes, Server Actions |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (OAuth) |
| Rate Limiting | In-memory → Redis (future) |
| AI Engine | OpenCode (forked/adapted) |
| Deployment | Vercel / Railway |

---

## 2. Goals & Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | Users can sign in via Supabase OAuth | ✅ Exists |
| FR-02 | Users can create and manage coding projects | High |
| FR-03 | Users can interact with AI agent via chat interface | High |
| FR-04 | AI agent can read/write files in virtual filesystem | High |
| FR-05 | AI agent can execute terminal commands (sandboxed) | High |
| FR-06 | Users can connect Claude Pro/Max subscription | High |
| FR-07 | Platform provides fallback LLM credentials | High |
| FR-08 | Real-time streaming of AI responses | High |
| FR-09 | Rate limiting per user | High |
| FR-10 | Session persistence and history | Medium |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | Response latency (time to first token) | < 2 seconds |
| NFR-02 | Concurrent users supported | 100+ initial |
| NFR-03 | Uptime | 99.5% |
| NFR-04 | Data encryption | At rest & in transit |
| NFR-05 | Session data retention | 30 days |

---

## 3. Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                 BROWSER                                      │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                     Next.js Frontend (React)                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                      App Shell                                   │  │  │
│  │  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │  │  │
│  │  │  │   Sidebar   │ │   Editor    │ │  Terminal   │ │   Chat    │  │  │  │
│  │  │  │  (Files)    │ │  (Monaco)   │ │  (xterm)    │ │  Panel    │  │  │  │
│  │  │  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  │                                │                                       │  │
│  │              ┌─────────────────▼─────────────────┐                     │  │
│  │              │     State Management (Zustand)    │                     │  │
│  │              │  - Auth state (Supabase client)   │                     │  │
│  │              │  - Project state                  │                     │  │
│  │              │  - Chat/session state             │                     │  │
│  │              └─────────────────┬─────────────────┘                     │  │
│  │                                │                                       │  │
│  │              ┌─────────────────▼─────────────────┐                     │  │
│  │              │      API Client Layer             │                     │  │
│  │              │  - REST (fetch)                   │                     │  │
│  │              │  - WebSocket (streaming)          │                     │  │
│  │              │  - Supabase Realtime              │                     │  │
│  │              └─────────────────┬─────────────────┘                     │  │
│  └────────────────────────────────┼──────────────────────────────────────┘  │
└───────────────────────────────────┼──────────────────────────────────────────┘
                                    │
                  ══════════════════╪══════════════════
                       HTTPS / WSS (JWT Authenticated)
                  ══════════════════╪══════════════════
                                    │
┌───────────────────────────────────▼──────────────────────────────────────────┐
│                          NEXT.JS SERVER                                       │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         MIDDLEWARE                                       │ │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌───────────────────────────┐  │ │
│  │  │ Auth Middleware │ │  Rate Limiter   │ │  Request Logging          │  │ │
│  │  │ (Supabase JWT)  │ │  (In-memory)    │ │  (Optional)               │  │ │
│  │  └─────────────────┘ └─────────────────┘ └───────────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         API ROUTES                                       │ │
│  │                                                                          │ │
│  │  /api/projects/*        - Project CRUD operations                       │ │
│  │  /api/sessions/*        - Chat session management                       │ │
│  │  /api/chat              - Main LLM chat endpoint (streaming)            │ │
│  │  /api/tools/*           - Tool execution (file ops, terminal)           │ │
│  │  /api/auth/claude       - Claude OAuth flow                             │ │
│  │  /api/files/*           - Virtual filesystem operations                 │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         CORE SERVICES                                    │ │
│  │                                                                          │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │  │                     LLM Router Service                            │   │ │
│  │  │  ┌────────────────┐ ┌────────────────┐ ┌──────────────────────┐  │   │ │
│  │  │  │ Platform Keys  │ │ Claude OAuth   │ │  Provider Adapters   │  │   │ │
│  │  │  │ (env vars)     │ │ (user tokens)  │ │  (Anthropic, OpenAI) │  │   │ │
│  │  │  └────────────────┘ └────────────────┘ └──────────────────────┘  │   │ │
│  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                          │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │  │                    Agent Engine (OpenCode Core)                   │   │ │
│  │  │  ┌────────────────┐ ┌────────────────┐ ┌──────────────────────┐  │   │ │
│  │  │  │ Agent System   │ │ Tool Registry  │ │ Context Manager      │  │   │ │
│  │  │  │ - System prompt│ │ - File tools   │ │ - Message history    │  │   │ │
│  │  │  │ - Orchestration│ │ - Shell tools  │ │ - Token counting     │  │   │ │
│  │  │  └────────────────┘ └────────────────┘ └──────────────────────┘  │   │ │
│  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                          │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │ │
│  │  │                    Virtual Filesystem                             │   │ │
│  │  │  - In-memory file tree per session                                │   │ │
│  │  │  - Persistence to Supabase Storage (optional)                     │   │ │
│  │  │  - Sandboxed operations                                           │   │ │
│  │  └──────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────┬───────────────────────────────────────┘
                                        │
              ┌─────────────────────────┴─────────────────────────┐
              │                                                   │
              ▼                                                   ▼
┌──────────────────────────────┐              ┌──────────────────────────────────┐
│       SUPABASE                │              │        LLM PROVIDERS              │
│  ┌─────────────────────────┐ │              │  ┌────────────────────────────┐  │
│  │      PostgreSQL         │ │              │  │   Anthropic API            │  │
│  │  ┌───────────────────┐  │ │              │  │   - Platform key           │  │
│  │  │ users (auth)      │  │ │              │  │   - User OAuth token       │  │
│  │  │ projects          │  │ │              │  └────────────────────────────┘  │
│  │  │ sessions          │  │ │              │  ┌────────────────────────────┐  │
│  │  │ messages          │  │ │              │  │   OpenAI API               │  │
│  │  │ user_settings     │  │ │              │  │   - Platform key           │  │
│  │  │ rate_limit_log    │  │ │              │  └────────────────────────────┘  │
│  │  └───────────────────┘  │ │              │  ┌────────────────────────────┐  │
│  └─────────────────────────┘ │              │  │   Google AI                │  │
│  ┌─────────────────────────┐ │              │  │   - Platform key           │  │
│  │      Auth               │ │              │  └────────────────────────────┘  │
│  │  - OAuth providers     │ │              └──────────────────────────────────┘
│  │  - JWT tokens          │ │
│  └─────────────────────────┘ │
│  ┌─────────────────────────┐ │
│  │      Storage            │ │
│  │  - Project files       │ │
│  │  - User uploads        │ │
│  └─────────────────────────┘ │
└──────────────────────────────┘
```

### Data Flow: Chat Request

```
┌────────┐     ┌─────────┐     ┌──────────┐     ┌─────────┐     ┌─────────┐
│ User   │────▶│ Frontend│────▶│ API Route│────▶│  Agent  │────▶│   LLM   │
│        │     │         │     │          │     │ Engine  │     │Provider │
└────────┘     └─────────┘     └──────────┘     └─────────┘     └─────────┘
    │               │               │               │               │
    │  1. Send      │               │               │               │
    │  message      │               │               │               │
    │──────────────▶│               │               │               │
    │               │  2. POST      │               │               │
    │               │  /api/chat    │               │               │
    │               │──────────────▶│               │               │
    │               │               │  3. Validate  │               │
    │               │               │  auth & rate  │               │
    │               │               │  limit        │               │
    │               │               │──────────────▶│               │
    │               │               │               │  4. Build     │
    │               │               │               │  context &    │
    │               │               │               │  call LLM     │
    │               │               │               │──────────────▶│
    │               │               │               │               │
    │               │               │  5. Stream response chunks    │
    │               │◀──────────────│◀──────────────│◀──────────────│
    │               │               │               │               │
    │  6. Display   │               │               │               │
    │  streaming    │               │               │               │
    │◀──────────────│               │               │               │
    │               │               │               │               │
```

---

## 4. Authentication & Authorization

### Current State (Existing)

- Supabase Auth with OAuth providers (Google, GitHub, etc.)
- JWT-based session management
- User data stored in Supabase `auth.users`

### Extensions Required

#### 4.1 Claude Pro/Max OAuth Integration

Claude.ai uses OAuth for third-party integrations. Users with Pro/Max subscriptions can authorize our app to use their subscription.

**OAuth Flow:**

```
┌────────┐     ┌─────────┐     ┌──────────────┐     ┌────────────┐
│  User  │     │ Our App │     │ Claude OAuth │     │ Claude API │
└────────┘     └─────────┘     └──────────────┘     └────────────┘
    │               │                  │                   │
    │ 1. Click      │                  │                   │
    │ "Connect      │                  │                   │
    │  Claude"      │                  │                   │
    │──────────────▶│                  │                   │
    │               │                  │                   │
    │               │ 2. Redirect to   │                   │
    │               │ Claude OAuth     │                   │
    │◀──────────────│─────────────────▶│                   │
    │               │                  │                   │
    │ 3. User       │                  │                   │
    │ authorizes    │                  │                   │
    │──────────────────────────────────▶│                   │
    │               │                  │                   │
    │               │ 4. Callback with │                   │
    │               │ auth code        │                   │
    │               │◀─────────────────│                   │
    │               │                  │                   │
    │               │ 5. Exchange code │                   │
    │               │ for tokens       │                   │
    │               │─────────────────▶│                   │
    │               │                  │                   │
    │               │ 6. Access token  │                   │
    │               │ + refresh token  │                   │
    │               │◀─────────────────│                   │
    │               │                  │                   │
    │               │ 7. Store tokens  │                   │
    │               │ (encrypted)      │                   │
    │               │                  │                   │
    │               │ 8. Use token for │                   │
    │               │ API calls        │                   │
    │               │─────────────────────────────────────▶│
    │               │                  │                   │
```

**Note:** Claude's OAuth for API access may have specific requirements. If direct OAuth isn't available, alternative approaches:

1. **Session Token Extraction**: User provides session token from claude.ai (less secure, not recommended)
2. **API Key Input**: User creates API key in Anthropic Console and provides it (encrypted storage)
3. **Anthropic OAuth**: Wait for official OAuth support from Anthropic

**Implementation (API Key approach as fallback):**

```typescript
// app/api/auth/claude/route.ts
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/crypto';

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { apiKey } = await request.json();
  
  // Validate the API key by making a test request
  const isValid = await validateAnthropicKey(apiKey);
  if (!isValid) {
    return Response.json({ error: 'Invalid API key' }, { status: 400 });
  }

  // Encrypt and store
  const encryptedKey = await encrypt(apiKey, process.env.ENCRYPTION_KEY!);
  
  await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      claude_api_key_encrypted: encryptedKey,
      claude_connected_at: new Date().toISOString(),
    });

  return Response.json({ success: true });
}
```

### Authorization Levels

| Level | Access |
|-------|--------|
| Anonymous | None (must sign in) |
| Free User | Platform LLM credits, rate limited |
| Connected User | Own Claude subscription, higher limits |

---

## 5. LLM Provider Integration

### 5.1 Provider Configuration

```typescript
// lib/llm/providers.ts

export interface LLMProvider {
  id: string;
  name: string;
  models: Model[];
  getCredentials: (userId: string) => Promise<Credentials>;
  chat: (request: ChatRequest, credentials: Credentials) => AsyncIterable<ChatChunk>;
}

export const providers: Record<string, LLMProvider> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', context: 200000 },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', context: 200000 },
      { id: 'claude-haiku-3-5-20241022', name: 'Claude 3.5 Haiku', context: 200000 },
    ],
    getCredentials: async (userId) => {
      // Check if user has connected their Claude account
      const userKey = await getUserClaudeKey(userId);
      if (userKey) {
        return { type: 'user', apiKey: userKey };
      }
      // Fall back to platform key
      return { type: 'platform', apiKey: process.env.ANTHROPIC_API_KEY! };
    },
    chat: anthropicChat,
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', context: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', context: 128000 },
    ],
    getCredentials: async () => {
      return { type: 'platform', apiKey: process.env.OPENAI_API_KEY! };
    },
    chat: openaiChat,
  },
  google: {
    id: 'google',
    name: 'Google AI',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', context: 1000000 },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', context: 2000000 },
    ],
    getCredentials: async () => {
      return { type: 'platform', apiKey: process.env.GOOGLE_AI_API_KEY! };
    },
    chat: googleChat,
  },
};
```

### 5.2 LLM Router Service

```typescript
// lib/llm/router.ts

import { providers } from './providers';
import { trackUsage } from './usage';
import { checkRateLimit } from './rate-limit';

export class LLMRouter {
  async chat(
    userId: string,
    providerId: string,
    modelId: string,
    messages: Message[],
    tools?: Tool[]
  ): AsyncIterable<ChatChunk> {
    // 1. Get provider
    const provider = providers[providerId];
    if (!provider) {
      throw new Error(`Unknown provider: ${providerId}`);
    }

    // 2. Check rate limit
    const rateLimitResult = await checkRateLimit(userId, providerId);
    if (!rateLimitResult.allowed) {
      throw new RateLimitError(rateLimitResult.resetAt);
    }

    // 3. Get credentials (user's or platform's)
    const credentials = await provider.getCredentials(userId);

    // 4. Make the request
    const stream = provider.chat({
      model: modelId,
      messages,
      tools,
      stream: true,
    }, credentials);

    // 5. Track usage and yield chunks
    let totalTokens = 0;
    for await (const chunk of stream) {
      if (chunk.usage) {
        totalTokens = chunk.usage.total_tokens;
      }
      yield chunk;
    }

    // 6. Log usage for analytics
    await trackUsage(userId, providerId, modelId, totalTokens, credentials.type);
  }
}

export const llmRouter = new LLMRouter();
```

### 5.3 Anthropic Provider Implementation

```typescript
// lib/llm/anthropic.ts

import Anthropic from '@anthropic-ai/sdk';

export async function* anthropicChat(
  request: ChatRequest,
  credentials: Credentials
): AsyncIterable<ChatChunk> {
  const client = new Anthropic({
    apiKey: credentials.apiKey,
  });

  const stream = await client.messages.stream({
    model: request.model,
    max_tokens: request.maxTokens || 4096,
    system: request.system,
    messages: request.messages,
    tools: request.tools?.map(convertTool),
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta') {
      if (event.delta.type === 'text_delta') {
        yield {
          type: 'text',
          text: event.delta.text,
        };
      } else if (event.delta.type === 'input_json_delta') {
        yield {
          type: 'tool_input',
          toolId: event.index,
          partialJson: event.delta.partial_json,
        };
      }
    } else if (event.type === 'message_delta') {
      yield {
        type: 'usage',
        usage: {
          input_tokens: stream.currentMessage.usage.input_tokens,
          output_tokens: event.usage.output_tokens,
          total_tokens: stream.currentMessage.usage.input_tokens + event.usage.output_tokens,
        },
      };
    } else if (event.type === 'content_block_start') {
      if (event.content_block.type === 'tool_use') {
        yield {
          type: 'tool_start',
          toolId: event.index,
          toolName: event.content_block.name,
        };
      }
    }
  }
}
```

---

## 6. OpenCode Integration

### 6.1 Integration Strategy

Rather than running OpenCode as a separate process, we'll extract and adapt its core modules:

```
OpenCode Repository
├── packages/opencode/src/
│   ├── agent/           ◄── Extract: Agent orchestration
│   ├── tool/            ◄── Extract: Tool definitions & execution
│   ├── session/         ◄── Adapt: Use our session management
│   ├── provider/        ◄── Replace: Use our LLM router
│   └── ...
```

### 6.2 Agent System

```typescript
// lib/agent/agent.ts

import { llmRouter } from '@/lib/llm/router';
import { toolRegistry } from '@/lib/tools/registry';

export interface AgentConfig {
  name: string;
  systemPrompt: string;
  tools: string[];  // Tool IDs
  model: {
    provider: string;
    model: string;
  };
}

export const defaultAgent: AgentConfig = {
  name: 'coding-assistant',
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
  tools: ['read_file', 'write_file', 'list_files', 'execute_command', 'search_files'],
  model: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-20250514',
  },
};

export class Agent {
  private config: AgentConfig;
  private userId: string;
  private sessionId: string;

  constructor(userId: string, sessionId: string, config: AgentConfig = defaultAgent) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.config = config;
  }

  async *chat(userMessage: string, context: AgentContext): AsyncIterable<AgentEvent> {
    // Build messages array with history
    const messages = this.buildMessages(userMessage, context);

    // Get available tools
    const tools = this.config.tools.map(id => toolRegistry.get(id));

    // Start LLM stream
    const stream = llmRouter.chat(
      this.userId,
      this.config.model.provider,
      this.config.model.model,
      messages,
      tools
    );

    // Process stream and handle tool calls
    let currentToolCall: ToolCall | null = null;
    let assistantMessage = '';

    for await (const chunk of stream) {
      if (chunk.type === 'text') {
        assistantMessage += chunk.text;
        yield { type: 'text', text: chunk.text };
      } else if (chunk.type === 'tool_start') {
        currentToolCall = {
          id: chunk.toolId,
          name: chunk.toolName,
          input: '',
        };
        yield { type: 'tool_start', tool: chunk.toolName };
      } else if (chunk.type === 'tool_input') {
        if (currentToolCall) {
          currentToolCall.input += chunk.partialJson;
        }
      } else if (chunk.type === 'tool_end') {
        if (currentToolCall) {
          // Execute the tool
          const result = await this.executeTool(currentToolCall, context);
          yield { type: 'tool_result', tool: currentToolCall.name, result };
          
          // Continue conversation with tool result
          // (recursive call or message continuation)
        }
      }
    }
  }

  private async executeTool(toolCall: ToolCall, context: AgentContext): Promise<ToolResult> {
    const tool = toolRegistry.get(toolCall.name);
    const input = JSON.parse(toolCall.input);
    
    // Execute with user's context (project files, etc.)
    return tool.execute(input, {
      userId: this.userId,
      sessionId: this.sessionId,
      projectId: context.projectId,
      workingDirectory: context.workingDirectory,
    });
  }

  private buildMessages(userMessage: string, context: AgentContext): Message[] {
    return [
      { role: 'user', content: userMessage },
      // Include relevant context from history
      ...context.recentMessages.slice(-10),
    ];
  }
}
```

### 6.3 Tool Registry

```typescript
// lib/tools/registry.ts

export interface Tool {
  name: string;
  description: string;
  inputSchema: object;
  execute: (input: any, context: ToolContext) => Promise<ToolResult>;
}

export interface ToolContext {
  userId: string;
  sessionId: string;
  projectId: string;
  workingDirectory: string;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
}

class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    return tool;
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }
}

export const toolRegistry = new ToolRegistry();

// Register built-in tools
toolRegistry.register({
  name: 'read_file',
  description: 'Read the contents of a file at the specified path',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'The file path to read' },
    },
    required: ['path'],
  },
  execute: async (input, context) => {
    const fs = getVirtualFS(context.projectId);
    try {
      const content = await fs.readFile(input.path);
      return { success: true, output: content };
    } catch (error) {
      return { success: false, error: `Failed to read file: ${error.message}` };
    }
  },
});

toolRegistry.register({
  name: 'write_file',
  description: 'Write content to a file at the specified path',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'The file path to write' },
      content: { type: 'string', description: 'The content to write' },
    },
    required: ['path', 'content'],
  },
  execute: async (input, context) => {
    const fs = getVirtualFS(context.projectId);
    try {
      await fs.writeFile(input.path, input.content);
      return { success: true, output: `Successfully wrote to ${input.path}` };
    } catch (error) {
      return { success: false, error: `Failed to write file: ${error.message}` };
    }
  },
});

toolRegistry.register({
  name: 'list_files',
  description: 'List files and directories at the specified path',
  inputSchema: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'The directory path to list', default: '.' },
    },
  },
  execute: async (input, context) => {
    const fs = getVirtualFS(context.projectId);
    try {
      const entries = await fs.readdir(input.path || '.');
      return { success: true, output: entries.join('\n') };
    } catch (error) {
      return { success: false, error: `Failed to list directory: ${error.message}` };
    }
  },
});

toolRegistry.register({
  name: 'execute_command',
  description: 'Execute a shell command in the project directory (sandboxed)',
  inputSchema: {
    type: 'object',
    properties: {
      command: { type: 'string', description: 'The command to execute' },
    },
    required: ['command'],
  },
  execute: async (input, context) => {
    // Use WebContainer or sandboxed execution
    const sandbox = getSandbox(context.projectId);
    try {
      const result = await sandbox.exec(input.command, {
        cwd: context.workingDirectory,
        timeout: 30000, // 30 second timeout
      });
      return { success: true, output: result.stdout + result.stderr };
    } catch (error) {
      return { success: false, error: `Command failed: ${error.message}` };
    }
  },
});

toolRegistry.register({
  name: 'search_files',
  description: 'Search for text pattern in files',
  inputSchema: {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'The text pattern to search for' },
      path: { type: 'string', description: 'The directory to search in', default: '.' },
      filePattern: { type: 'string', description: 'File glob pattern', default: '*' },
    },
    required: ['pattern'],
  },
  execute: async (input, context) => {
    const fs = getVirtualFS(context.projectId);
    try {
      const results = await fs.search(input.pattern, input.path, input.filePattern);
      return { success: true, output: formatSearchResults(results) };
    } catch (error) {
      return { success: false, error: `Search failed: ${error.message}` };
    }
  },
});
```

---

## 7. Database Schema

### 7.1 Supabase Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT unique_user_project_name UNIQUE (user_id, name)
);

-- Create index for user lookups
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Sessions table (chat sessions)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title VARCHAR(255),
  model_provider VARCHAR(50) NOT NULL DEFAULT 'anthropic',
  model_id VARCHAR(100) NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_project_id ON sessions(project_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT,
  tool_calls JSONB,
  tool_results JSONB,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- For ordering within a session
  sequence_number SERIAL
);

-- Create indexes
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_session_sequence ON messages(session_id, sequence_number);

-- User settings table
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Claude connection
  claude_api_key_encrypted TEXT,
  claude_connected_at TIMESTAMP WITH TIME ZONE,
  
  -- Preferences
  preferred_provider VARCHAR(50) DEFAULT 'anthropic',
  preferred_model VARCHAR(100) DEFAULT 'claude-sonnet-4-20250514',
  theme VARCHAR(20) DEFAULT 'dark',
  
  -- Settings blob
  settings JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting log table
CREATE TABLE rate_limit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100),
  tokens_used INTEGER NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Composite key for upsert
  CONSTRAINT unique_user_provider_window UNIQUE (user_id, provider, window_start)
);

-- Create index for rate limit lookups
CREATE INDEX idx_rate_limit_user_window ON rate_limit_log(user_id, window_start DESC);

-- Usage analytics table
CREATE TABLE usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  credential_type VARCHAR(20) NOT NULL CHECK (credential_type IN ('platform', 'user')),
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics
CREATE INDEX idx_usage_user_id ON usage_analytics(user_id);
CREATE INDEX idx_usage_created_at ON usage_analytics(created_at DESC);
CREATE INDEX idx_usage_provider ON usage_analytics(provider);

-- Virtual filesystem metadata table
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path VARCHAR(1000) NOT NULL,
  is_directory BOOLEAN NOT NULL DEFAULT FALSE,
  content TEXT,  -- For small files, stored directly
  storage_path VARCHAR(500),  -- For large files, reference to Supabase Storage
  size_bytes INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_project_path UNIQUE (project_id, path)
);

-- Create index for file lookups
CREATE INDEX idx_project_files_project_path ON project_files(project_id, path);

-- Row Level Security (RLS) Policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Projects: users can only access their own projects
CREATE POLICY projects_user_policy ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Sessions: users can only access their own sessions
CREATE POLICY sessions_user_policy ON sessions
  FOR ALL USING (auth.uid() = user_id);

-- Messages: users can access messages from their sessions
CREATE POLICY messages_user_policy ON messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = messages.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

-- User settings: users can only access their own settings
CREATE POLICY user_settings_user_policy ON user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Rate limit log: users can only see their own rate limits
CREATE POLICY rate_limit_user_policy ON rate_limit_log
  FOR ALL USING (auth.uid() = user_id);

-- Usage analytics: users can only see their own usage
CREATE POLICY usage_analytics_user_policy ON usage_analytics
  FOR ALL USING (auth.uid() = user_id);

-- Project files: users can access files from their projects
CREATE POLICY project_files_user_policy ON project_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Helper functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER project_files_updated_at
  BEFORE UPDATE ON project_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 7.2 Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   auth.users     │       │    projects      │       │  project_files   │
│  (Supabase)      │       │                  │       │                  │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │───┐   │ id (PK)          │───────│ project_id (FK)  │
│ email            │   │   │ user_id (FK)     │       │ path             │
│ ...              │   │   │ name             │       │ content          │
└──────────────────┘   │   │ description      │       │ is_directory     │
                       │   │ settings         │       └──────────────────┘
                       │   └──────────────────┘
                       │           │
                       │           │
┌──────────────────┐   │   ┌───────▼──────────┐       ┌──────────────────┐
│  user_settings   │   │   │    sessions      │       │    messages      │
│                  │   │   │                  │       │                  │
├──────────────────┤   │   ├──────────────────┤       ├──────────────────┤
│ user_id (PK,FK)  │◄──┼───│ user_id (FK)     │       │ id (PK)          │
│ claude_api_key   │   │   │ project_id (FK)  │───────│ session_id (FK)  │
│ preferred_model  │   │   │ title            │       │ role             │
│ settings         │   │   │ model_provider   │       │ content          │
└──────────────────┘   │   │ model_id         │       │ tool_calls       │
                       │   └──────────────────┘       │ tool_results     │
                       │                              └──────────────────┘
┌──────────────────┐   │
│  rate_limit_log  │   │   ┌──────────────────┐
│                  │   │   │ usage_analytics  │
├──────────────────┤   │   │                  │
│ id (PK)          │   │   ├──────────────────┤
│ user_id (FK)     │◄──┴───│ user_id (FK)     │
│ provider         │       │ session_id (FK)  │
│ tokens_used      │       │ provider         │
│ window_start     │       │ tokens_used      │
└──────────────────┘       │ credential_type  │
                           └──────────────────┘
```

---

## 8. API Design

### 8.1 REST Endpoints

```typescript
// API Routes Structure

app/api/
├── auth/
│   └── claude/
│       ├── route.ts          // POST: Connect Claude API key
│       └── disconnect/
│           └── route.ts      // POST: Remove Claude connection
│
├── projects/
│   ├── route.ts              // GET: List projects, POST: Create project
│   └── [projectId]/
│       ├── route.ts          // GET: Get project, PUT: Update, DELETE: Delete
│       └── files/
│           └── route.ts      // GET: List files, POST: Create file
│
├── sessions/
│   ├── route.ts              // GET: List sessions, POST: Create session
│   └── [sessionId]/
│       ├── route.ts          // GET: Get session, DELETE: Delete session
│       └── messages/
│           └── route.ts      // GET: Get messages
│
├── chat/
│   └── route.ts              // POST: Send message (streaming)
│
├── tools/
│   └── execute/
│       └── route.ts          // POST: Execute tool directly
│
└── files/
    ├── read/
    │   └── route.ts          // POST: Read file
    ├── write/
    │   └── route.ts          // POST: Write file
    └── list/
        └── route.ts          // POST: List directory
```

### 8.2 Chat Endpoint (Main API)

```typescript
// app/api/chat/route.ts

import { createClient } from '@/lib/supabase/server';
import { Agent } from '@/lib/agent/agent';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // 1. Authenticate
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse request
  const { sessionId, message, projectId } = await request.json();

  // 3. Check rate limit
  const rateLimitResult = await checkRateLimit(user.id);
  if (!rateLimitResult.allowed) {
    return Response.json({
      error: 'Rate limit exceeded',
      resetAt: rateLimitResult.resetAt,
    }, { status: 429 });
  }

  // 4. Get or create session
  let session;
  if (sessionId) {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();
    session = data;
  }

  if (!session) {
    const { data } = await supabase
      .from('sessions')
      .insert({
        user_id: user.id,
        project_id: projectId,
        title: message.substring(0, 50),
      })
      .select()
      .single();
    session = data;
  }

  // 5. Save user message
  await supabase.from('messages').insert({
    session_id: session.id,
    role: 'user',
    content: message,
  });

  // 6. Create streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const agent = new Agent(user.id, session.id);
        
        const context = {
          projectId,
          workingDirectory: '/',
          recentMessages: await getRecentMessages(supabase, session.id),
        };

        let fullResponse = '';
        const toolCalls: any[] = [];
        const toolResults: any[] = [];

        for await (const event of agent.chat(message, context)) {
          if (event.type === 'text') {
            fullResponse += event.text;
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } else if (event.type === 'tool_start') {
            toolCalls.push({ name: event.tool, started_at: new Date() });
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          } else if (event.type === 'tool_result') {
            toolResults.push({ name: event.tool, result: event.result });
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
          }
        }

        // Save assistant message
        await supabase.from('messages').insert({
          session_id: session.id,
          role: 'assistant',
          content: fullResponse,
          tool_calls: toolCalls.length > 0 ? toolCalls : null,
          tool_results: toolResults.length > 0 ? toolResults : null,
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', sessionId: session.id })}\n\n`));
        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function getRecentMessages(supabase: any, sessionId: string) {
  const { data } = await supabase
    .from('messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('sequence_number', { ascending: false })
    .limit(20);
  
  return (data || []).reverse();
}
```

### 8.3 API Response Types

```typescript
// types/api.ts

// Chat request
export interface ChatRequest {
  sessionId?: string;
  projectId?: string;
  message: string;
  model?: {
    provider: string;
    model: string;
  };
}

// Streaming events
export type ChatEvent =
  | { type: 'text'; text: string }
  | { type: 'tool_start'; tool: string }
  | { type: 'tool_result'; tool: string; result: ToolResult }
  | { type: 'done'; sessionId: string }
  | { type: 'error'; message: string };

// Project
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Session
export interface Session {
  id: string;
  projectId?: string;
  title?: string;
  modelProvider: string;
  modelId: string;
  createdAt: string;
  updatedAt: string;
}

// Message
export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  createdAt: string;
}
```

---

## 9. Rate Limiting

### 9.1 Rate Limit Configuration

```typescript
// lib/rate-limit/config.ts

export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Max requests per window
  maxTokens: number;       // Max tokens per window
}

export const rateLimitConfig: Record<string, RateLimitConfig> = {
  // Default limits for platform credentials
  platform: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 50,            // 50 requests per hour
    maxTokens: 100000,          // 100k tokens per hour
  },
  
  // Limits for users with their own Claude connection
  user_connected: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxRequests: 200,           // 200 requests per hour
    maxTokens: 500000,          // 500k tokens per hour
  },
};
```

### 9.2 In-Memory Rate Limiter

```typescript
// lib/rate-limit/memory-limiter.ts

interface RateLimitEntry {
  requests: number;
  tokens: number;
  windowStart: number;
}

// In-memory store (will be replaced with Redis later)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > 2 * 60 * 60 * 1000) { // 2 hours
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: {
    requests: number;
    tokens: number;
  };
  resetAt: Date;
  retryAfter?: number;
}

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
  
  // Check limits
  if (entry.requests >= config.maxRequests) {
    return {
      allowed: false,
      remaining: {
        requests: 0,
        tokens: Math.max(0, config.maxTokens - entry.tokens),
      },
      resetAt,
      retryAfter: Math.ceil((entry.windowStart + config.windowMs - now) / 1000),
    };
  }
  
  if (entry.tokens + tokensToUse > config.maxTokens) {
    return {
      allowed: false,
      remaining: {
        requests: Math.max(0, config.maxRequests - entry.requests),
        tokens: 0,
      },
      resetAt,
      retryAfter: Math.ceil((entry.windowStart + config.windowMs - now) / 1000),
    };
  }
  
  // Increment counters
  entry.requests += 1;
  entry.tokens += tokensToUse;
  
  return {
    allowed: true,
    remaining: {
      requests: config.maxRequests - entry.requests,
      tokens: config.maxTokens - entry.tokens,
    },
    resetAt,
  };
}

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

async function getUserRateLimitConfig(userId: string): Promise<RateLimitConfig> {
  // Check if user has connected their own Claude account
  const hasUserCredentials = await checkUserHasClaudeConnection(userId);
  
  return hasUserCredentials 
    ? rateLimitConfig.user_connected 
    : rateLimitConfig.platform;
}

async function checkUserHasClaudeConnection(userId: string): Promise<boolean> {
  // This would check the database
  // For now, return false (use platform credentials)
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = createClient();
  
  const { data } = await supabase
    .from('user_settings')
    .select('claude_api_key_encrypted')
    .eq('user_id', userId)
    .single();
  
  return !!data?.claude_api_key_encrypted;
}
```

### 9.3 Rate Limit Middleware

```typescript
// middleware.ts (partial)

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return res;
  }
  
  // Skip auth endpoints
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return res;
  }
  
  // Check authentication
  const supabase = createMiddlewareClient({ req: request, res });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Rate limiting is handled in individual API routes
  // to allow for token-based limiting
  
  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};
```

### 9.4 Rate Limit Headers

```typescript
// lib/rate-limit/headers.ts

export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  const headers = new Headers(response.headers);
  
  headers.set('X-RateLimit-Limit-Requests', String(result.remaining.requests + 1));
  headers.set('X-RateLimit-Remaining-Requests', String(result.remaining.requests));
  headers.set('X-RateLimit-Limit-Tokens', String(result.remaining.tokens));
  headers.set('X-RateLimit-Reset', result.resetAt.toISOString());
  
  if (result.retryAfter) {
    headers.set('Retry-After', String(result.retryAfter));
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
```

---

## 10. Frontend Architecture

### 10.1 Component Structure

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── callback/
│       └── route.ts
│
├── (dashboard)/
│   ├── layout.tsx              # Main app shell
│   ├── page.tsx                # Dashboard/home
│   │
│   ├── projects/
│   │   ├── page.tsx            # Projects list
│   │   └── [projectId]/
│   │       └── page.tsx        # Project workspace
│   │
│   └── settings/
│       └── page.tsx            # User settings
│
└── components/
    ├── ui/                     # shadcn/ui components
    │
    ├── workspace/
    │   ├── Workspace.tsx       # Main workspace container
    │   ├── Sidebar.tsx         # File explorer sidebar
    │   ├── Editor.tsx          # Monaco editor wrapper
    │   ├── Terminal.tsx        # xterm.js terminal
    │   └── ChatPanel.tsx       # AI chat interface
    │
    ├── chat/
    │   ├── ChatContainer.tsx   # Chat messages container
    │   ├── ChatMessage.tsx     # Individual message
    │   ├── ChatInput.tsx       # Message input
    │   ├── ToolExecution.tsx   # Tool execution display
    │   └── StreamingText.tsx   # Streaming text component
    │
    └── settings/
        ├── ClaudeConnection.tsx  # Claude API key setup
        ├── ModelSelector.tsx     # Model selection
        └── ThemeSelector.tsx     # Theme settings
```

### 10.2 State Management

```typescript
// stores/workspace.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkspaceState {
  // Project state
  currentProjectId: string | null;
  setCurrentProject: (id: string | null) => void;
  
  // Session state
  currentSessionId: string | null;
  setCurrentSession: (id: string | null) => void;
  
  // Editor state
  openFiles: string[];
  activeFile: string | null;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string) => void;
  
  // Layout state
  sidebarOpen: boolean;
  chatPanelOpen: boolean;
  terminalOpen: boolean;
  toggleSidebar: () => void;
  toggleChatPanel: () => void;
  toggleTerminal: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentProjectId: null,
      setCurrentProject: (id) => set({ currentProjectId: id }),
      
      currentSessionId: null,
      setCurrentSession: (id) => set({ currentSessionId: id }),
      
      openFiles: [],
      activeFile: null,
      openFile: (path) => set((state) => ({
        openFiles: state.openFiles.includes(path) 
          ? state.openFiles 
          : [...state.openFiles, path],
        activeFile: path,
      })),
      closeFile: (path) => set((state) => ({
        openFiles: state.openFiles.filter((f) => f !== path),
        activeFile: state.activeFile === path 
          ? state.openFiles[0] || null 
          : state.activeFile,
      })),
      setActiveFile: (path) => set({ activeFile: path }),
      
      sidebarOpen: true,
      chatPanelOpen: true,
      terminalOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      toggleChatPanel: () => set((state) => ({ chatPanelOpen: !state.chatPanelOpen })),
      toggleTerminal: () => set((state) => ({ terminalOpen: !state.terminalOpen })),
    }),
    {
      name: 'workspace-storage',
    }
  )
);
```

### 10.3 Chat Store

```typescript
// stores/chat.ts

import { create } from 'zustand';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: any[];
  isStreaming?: boolean;
  createdAt: Date;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
  addMessage: (message: Omit<Message, 'id' | 'createdAt'>) => string;
  updateMessage: (id: string, content: string) => void;
  appendToMessage: (id: string, text: string) => void;
  setMessageStreaming: (id: string, streaming: boolean) => void;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  
  addMessage: (message) => {
    const id = crypto.randomUUID();
    set((state) => ({
      messages: [
        ...state.messages,
        { ...message, id, createdAt: new Date() },
      ],
    }));
    return id;
  },
  
  updateMessage: (id, content) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content } : m
      ),
    }));
  },
  
  appendToMessage: (id, text) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content: m.content + text } : m
      ),
    }));
  },
  
  setMessageStreaming: (id, streaming) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isStreaming: streaming } : m
      ),
    }));
  },
  
  clearMessages: () => set({ messages: [] }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
```

### 10.4 Chat Hook

```typescript
// hooks/useChat.ts

import { useCallback } from 'react';
import { useChatStore } from '@/stores/chat';
import { useWorkspaceStore } from '@/stores/workspace';

export function useChat() {
  const {
    messages,
    isLoading,
    error,
    addMessage,
    appendToMessage,
    setMessageStreaming,
    setLoading,
    setError,
  } = useChatStore();
  
  const { currentSessionId, currentProjectId, setCurrentSession } = useWorkspaceStore();

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    // Add user message
    addMessage({ role: 'user', content });
    
    // Create placeholder for assistant response
    const assistantMessageId = addMessage({
      role: 'assistant',
      content: '',
      isStreaming: true,
    });
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          projectId: currentProjectId,
          message: content,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            switch (data.type) {
              case 'text':
                appendToMessage(assistantMessageId, data.text);
                break;
              case 'tool_start':
                // Handle tool start UI
                break;
              case 'tool_result':
                // Handle tool result UI
                break;
              case 'done':
                if (data.sessionId && !currentSessionId) {
                  setCurrentSession(data.sessionId);
                }
                break;
              case 'error':
                throw new Error(data.message);
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setMessageStreaming(assistantMessageId, false);
      setLoading(false);
    }
  }, [
    isLoading,
    currentSessionId,
    currentProjectId,
    addMessage,
    appendToMessage,
    setMessageStreaming,
    setLoading,
    setError,
    setCurrentSession,
  ]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
  };
}
```

### 10.5 Workspace Layout

```tsx
// components/workspace/Workspace.tsx

'use client';

import { useWorkspaceStore } from '@/stores/workspace';
import { Sidebar } from './Sidebar';
import { Editor } from './Editor';
import { Terminal } from './Terminal';
import { ChatPanel } from './ChatPanel';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';

export function Workspace() {
  const { sidebarOpen, chatPanelOpen, terminalOpen } = useWorkspaceStore();

  return (
    <div className="h-screen flex flex-col">
      {/* Top toolbar */}
      <header className="h-12 border-b flex items-center px-4">
        <h1 className="font-semibold">AI Code Agent</h1>
        {/* Toolbar items */}
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar */}
          {sidebarOpen && (
            <>
              <ResizablePanel defaultSize={15} minSize={10} maxSize={25}>
                <Sidebar />
              </ResizablePanel>
              <ResizableHandle />
            </>
          )}

          {/* Editor + Terminal */}
          <ResizablePanel defaultSize={chatPanelOpen ? 55 : 85}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={terminalOpen ? 70 : 100}>
                <Editor />
              </ResizablePanel>
              
              {terminalOpen && (
                <>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={30} minSize={15}>
                    <Terminal />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* Chat Panel */}
          {chatPanelOpen && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                <ChatPanel />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
```

---

## 11. Security Considerations

### 11.1 API Key Security

```typescript
// lib/crypto.ts

import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

export async function encrypt(plaintext: string, masterKey: string): Promise<string> {
  // Generate random salt and IV
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  
  // Derive key from master key
  const key = (await scryptAsync(masterKey, salt, KEY_LENGTH)) as Buffer;
  
  // Encrypt
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  // Combine: salt + iv + authTag + encrypted
  const combined = Buffer.concat([
    salt,
    iv,
    authTag,
    Buffer.from(encrypted, 'hex'),
  ]);
  
  return combined.toString('base64');
}

export async function decrypt(encryptedData: string, masterKey: string): Promise<string> {
  const combined = Buffer.from(encryptedData, 'base64');
  
  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const authTag = combined.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
  );
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
  
  // Derive key
  const key = (await scryptAsync(masterKey, salt, KEY_LENGTH)) as Buffer;
  
  // Decrypt
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

### 11.2 Security Checklist

| Category | Measure | Status |
|----------|---------|--------|
| Authentication | Supabase Auth with JWT | ✅ Existing |
| Authorization | Row Level Security (RLS) | ✅ Implemented |
| API Security | Rate limiting | ✅ Designed |
| Data Encryption | API keys encrypted at rest | ✅ Designed |
| Transport Security | HTTPS only | ✅ Default |
| Input Validation | Zod schemas for all inputs | 📋 TODO |
| SQL Injection | Parameterized queries (Supabase) | ✅ Default |
| XSS Prevention | React auto-escaping | ✅ Default |
| CSRF Protection | Same-site cookies | ✅ Default |
| Sandboxing | Tool execution in sandbox | 📋 TODO |

### 11.3 Tool Execution Sandboxing

```typescript
// lib/sandbox/sandbox.ts

import { WebContainer } from '@webcontainer/api';

let webcontainer: WebContainer | null = null;

export async function getSandbox(projectId: string) {
  if (!webcontainer) {
    webcontainer = await WebContainer.boot();
  }
  
  return {
    async exec(command: string, options: ExecOptions = {}): Promise<ExecResult> {
      const { cwd = '/', timeout = 30000 } = options;
      
      // Parse command
      const [cmd, ...args] = command.split(' ');
      
      // Validate command (whitelist approach)
      const allowedCommands = ['ls', 'cat', 'echo', 'node', 'npm', 'npx', 'git'];
      if (!allowedCommands.some(allowed => cmd.startsWith(allowed))) {
        throw new Error(`Command not allowed: ${cmd}`);
      }
      
      // Execute with timeout
      const process = await webcontainer.spawn(cmd, args, { cwd });
      
      let stdout = '';
      let stderr = '';
      
      process.output.pipeTo(new WritableStream({
        write(chunk) {
          stdout += chunk;
        },
      }));
      
      // Wait for completion with timeout
      const exitCode = await Promise.race([
        process.exit,
        new Promise<number>((_, reject) =>
          setTimeout(() => reject(new Error('Command timeout')), timeout)
        ),
      ]);
      
      return { stdout, stderr, exitCode };
    },
    
    async readFile(path: string): Promise<string> {
      const file = await webcontainer.fs.readFile(path, 'utf-8');
      return file;
    },
    
    async writeFile(path: string, content: string): Promise<void> {
      await webcontainer.fs.writeFile(path, content);
    },
    
    async readdir(path: string): Promise<string[]> {
      const entries = await webcontainer.fs.readdir(path, { withFileTypes: true });
      return entries.map(e => e.isDirectory() ? `${e.name}/` : e.name);
    },
  };
}
```

---

## 12. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Basic chat functionality with LLM integration

| Task | Priority | Effort |
|------|----------|--------|
| Set up project structure | High | 2h |
| Implement database schema | High | 4h |
| Create LLM router service | High | 8h |
| Implement basic chat API | High | 8h |
| Build chat UI components | High | 16h |
| Implement rate limiting | High | 4h |
| Add streaming support | High | 4h |

**Deliverables:**
- Users can sign in and chat with AI
- Basic rate limiting works
- Streaming responses work

### Phase 2: Agent Capabilities (Week 3-4)

**Goal:** Full agent with tool execution

| Task | Priority | Effort |
|------|----------|--------|
| Implement tool registry | High | 4h |
| Build file tools (read/write/list) | High | 8h |
| Implement sandbox execution | High | 16h |
| Build agent orchestration | High | 16h |
| Add tool execution UI | High | 8h |

**Deliverables:**
- AI can read/write files
- AI can execute commands
- Tool execution visible in UI

### Phase 3: Workspace UI (Week 5-6)

**Goal:** Full IDE-like experience

| Task | Priority | Effort |
|------|----------|--------|
| Integrate Monaco Editor | Medium | 8h |
| Integrate xterm.js | Medium | 8h |
| Build file explorer | Medium | 12h |
| Implement resizable panels | Medium | 4h |
| Add keyboard shortcuts | Low | 4h |

**Deliverables:**
- Full workspace UI
- File editing works
- Terminal integration

### Phase 4: User Features (Week 7-8)

**Goal:** Claude connection and persistence

| Task | Priority | Effort |
|------|----------|--------|
| Claude API key connection | High | 8h |
| Project management | Medium | 8h |
| Session persistence | Medium | 8h |
| Usage analytics | Low | 4h |
| Settings UI | Low | 4h |

**Deliverables:**
- Users can connect Claude API key
- Projects persist
- Chat history persists

### Phase 5: Polish & Launch (Week 9-10)

**Goal:** Production readiness

| Task | Priority | Effort |
|------|----------|--------|
| Error handling improvements | High | 8h |
| Performance optimization | Medium | 8h |
| Mobile responsiveness | Low | 8h |
| Documentation | Medium | 8h |
| Testing | High | 16h |

**Deliverables:**
- Production-ready application
- User documentation
- Test coverage

---

## 13. Future Enhancements

### 13.1 Redis Rate Limiting

```typescript
// lib/rate-limit/redis-limiter.ts (Future)

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function checkRateLimitRedis(
  userId: string,
  provider: string
): Promise<RateLimitResult> {
  const config = await getUserRateLimitConfig(userId);
  const key = `ratelimit:${userId}:${provider}`;
  const now = Date.now();
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;
  const windowKey = `${key}:${windowStart}`;

  // Use Redis transaction for atomic operations
  const pipeline = redis.pipeline();
  pipeline.hincrby(windowKey, 'requests', 1);
  pipeline.hget(windowKey, 'tokens');
  pipeline.pexpire(windowKey, config.windowMs);
  
  const results = await pipeline.exec();
  const requests = results[0] as number;
  const tokens = (results[1] as number) || 0;
  
  // ... rest of implementation
}
```

### 13.2 Stripe Integration

```typescript
// Future: lib/billing/stripe.ts

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const plans = {
  free: {
    tokens: 100000,
    requests: 50,
  },
  pro: {
    priceId: 'price_xxx',
    tokens: 2000000,
    requests: 500,
  },
  team: {
    priceId: 'price_yyy',
    tokens: 10000000,
    requests: 2000,
  },
};
```

### 13.3 Collaboration Features

- Real-time collaborative editing
- Shared projects
- Team workspaces
- Comment threads on code

### 13.4 Advanced Agent Features

- Multi-agent orchestration
- Custom agent creation
- MCP server integration
- Git integration (commits, PRs)

---

## Appendix A: Environment Variables

```env
# Supabase (Existing)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LLM Providers (Platform Keys)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=

# Encryption
ENCRYPTION_KEY=  # 32+ character random string

# Optional: Future Redis
# UPSTASH_REDIS_URL=
# UPSTASH_REDIS_TOKEN=

# Optional: Future Stripe
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
```

---

## Appendix B: Quick Start Commands

```bash
# Install dependencies
npm install

# Set up database
npx supabase db push

# Run development server
npm run dev

# Run tests
npm test
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2025 | - | Initial design document |

---

*End of Document*