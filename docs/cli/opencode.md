# Implementation Plan: Phases 3 & 4

## Browser-Based AI Coding Agent with OpenCode

**Document Focus:** Workspace UI & User Features Implementation  
**Version:** 1.0  
**Date:** January 2025

---

## Table of Contents

1. [OpenCode Architecture Analysis](#1-opencode-architecture-analysis)
2. [Integration Strategy](#2-integration-strategy)
3. [Phase 3: Workspace UI Implementation](#3-phase-3-workspace-ui-implementation)
4. [Phase 4: User Features Implementation](#4-phase-4-user-features-implementation)
5. [Technical Specifications](#5-technical-specifications)
6. [Risk Mitigation](#6-risk-mitigation)

---

## 1. OpenCode Architecture Analysis

### 1.1 OpenCode Package Structure

OpenCode is a well-architected monorepo with clear separation of concerns:

```
anomalyco/opencode/
├── packages/
│   ├── opencode/           # Core CLI + HTTP Server (Bun)
│   │   ├── src/
│   │   │   ├── cli/        # CLI commands including TUI
│   │   │   ├── session/    # Session management
│   │   │   ├── tool/       # Tool system
│   │   │   ├── provider/   # LLM providers
│   │   │   ├── route/      # HTTP API routes
│   │   │   └── server.ts   # HTTP server
│   │   └── package.json
│   │
│   ├── sdk/                # @opencode-ai/sdk
│   │   └── js/             # TypeScript SDK (auto-generated from OpenAPI)
│   │
│   ├── ui/                 # @opencode-ai/ui
│   │   └── src/            # SolidJS UI components
│   │
│   ├── desktop/            # Tauri desktop app (SolidJS)
│   │   ├── src/
│   │   │   ├── context/    # State management
│   │   │   ├── pages/      # Route pages
│   │   │   └── components/ # UI components
│   │   └── package.json
│   │
│   ├── console/            # Web console (SolidJS Start)
│   │   ├── app/            # Frontend
│   │   ├── core/           # Backend logic
│   │   └── function/       # Serverless functions
│   │
│   └── plugin/             # @opencode-ai/plugin
│
└── sdks/
    └── vscode/             # VS Code extension
```

### 1.2 Key OpenCode Components We Can Leverage

| Component | Location | What It Provides | Our Usage |
|-----------|----------|------------------|-----------|
| **SDK** | `@opencode-ai/sdk` | Type-safe HTTP/SSE client | Direct use for API calls |
| **UI Components** | `@opencode-ai/ui` | Message rendering, diff viewer, code highlighting | Adapt for React or use directly |
| **Desktop State** | `packages/desktop/src/context/` | GlobalSync, Sync, Local state patterns | Reference architecture |
| **HTTP Server** | `packages/opencode/src/server.ts` | OpenAPI spec, route handlers | Run as backend |
| **Session System** | `packages/opencode/src/session/` | Session/message management | Use via API |
| **Tool System** | `packages/opencode/src/tool/` | File, shell, search tools | Use via API |
| **Provider System** | `packages/opencode/src/provider/` | 75+ LLM providers | Configure for our needs |

### 1.3 OpenCode Communication Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OpenCode Server (Bun)                                 │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         HTTP Server                                  │    │
│  │                                                                      │    │
│  │  GET  /health              → Server health check                    │    │
│  │  GET  /session             → List sessions                          │    │
│  │  POST /session             → Create session                         │    │
│  │  GET  /session/:id         → Get session                            │    │
│  │  POST /session/:id/prompt  → Send message (streaming)               │    │
│  │  GET  /session/:id/message → Get messages                           │    │
│  │  GET  /config              → Get configuration                      │    │
│  │  GET  /config/providers    → List providers & models                │    │
│  │  GET  /global/event        → SSE event stream                       │    │
│  │  POST /file/read           → Read file                              │    │
│  │  POST /file/write          → Write file                             │    │
│  │  POST /find/files          → Search files                           │    │
│  │  ...                                                                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Core Services                                   │    │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                 │    │
│  │  │   Session    │ │   Provider   │ │    Tool      │                 │    │
│  │  │   Manager    │ │   Router     │ │   Executor   │                 │    │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP + SSE
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Clients                                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │     TUI     │ │   Desktop   │ │   VS Code   │ │  Our Web Client     │   │
│  │ (@opentui)  │ │   (Tauri)   │ │ Extension   │ │  (NextJS/React)     │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘   │
│                                                                              │
│  All use: @opencode-ai/sdk for API communication                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Existing Web Client Reference

There's already a community project `opencode-web` (by chris-tse) that provides a React-based web UI:

```
opencode-web/
├── src/
│   ├── components/
│   │   ├── Chat/           # Chat interface components
│   │   └── Debug/          # Development debugging tools
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API integration
│   └── utils/              # Helper functions
├── package.json            # React 19, Vite, TypeScript
└── ...
```

**We can use this as a reference** for React-based OpenCode integration patterns.

---

## 2. Integration Strategy

### 2.1 Architecture Decision: Hybrid Approach

We will use a **hybrid architecture** that maximizes OpenCode reuse:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Our Platform                                       │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                     NextJS Application                                  │ │
│  │                                                                         │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                    Frontend (React)                               │  │ │
│  │  │                                                                   │  │ │
│  │  │  ┌─────────────────────────────────────────────────────────────┐ │  │ │
│  │  │  │  UI Components (Ported from @opencode-ai/ui or React equiv) │ │  │ │
│  │  │  │  - MessageList, MessagePart                                  │ │  │ │
│  │  │  │  - DiffViewer, CodeBlock                                     │ │  │ │
│  │  │  │  - PromptInput, FileTree                                     │ │  │ │
│  │  │  │  - ToolExecution display                                     │ │  │ │
│  │  │  └─────────────────────────────────────────────────────────────┘ │  │ │
│  │  │                              │                                    │  │ │
│  │  │  ┌─────────────────────────────────────────────────────────────┐ │  │ │
│  │  │  │              State Management (Zustand)                      │ │  │ │
│  │  │  │  - Pattern from desktop/src/context/                         │ │  │ │
│  │  │  │  - GlobalSync → Sync → Local hierarchy                       │ │  │ │
│  │  │  └─────────────────────────────────────────────────────────────┘ │  │ │
│  │  │                              │                                    │  │ │
│  │  │  ┌─────────────────────────────────────────────────────────────┐ │  │ │
│  │  │  │              OpenCode SDK Client                             │ │  │ │
│  │  │  │  - @opencode-ai/sdk (browser-compatible)                     │ │  │ │
│  │  │  │  - SSE event subscription                                    │ │  │ │
│  │  │  └─────────────────────────────────────────────────────────────┘ │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  │                              │                                          │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐  │ │
│  │  │                  NextJS API Routes                                │  │ │
│  │  │                                                                   │  │ │
│  │  │  /api/auth/*          → Supabase Auth (existing)                 │  │ │
│  │  │  /api/opencode/*      → Proxy to OpenCode server                 │  │ │
│  │  │  /api/credentials/*   → User API key management                  │  │ │
│  │  │  /api/usage/*         → Usage tracking & rate limiting           │  │ │
│  │  │                                                                   │  │ │
│  │  └──────────────────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                              │                                               │
│  ┌───────────────────────────▼────────────────────────────────────────────┐ │
│  │                    OpenCode Server Instance                             │ │
│  │                                                                         │ │
│  │  Option A: Shared instance (simpler, multi-tenant)                     │ │
│  │  Option B: Per-user container (isolated, more complex)                 │ │
│  │                                                                         │ │
│  │  Running: `opencode serve --port 4096`                                 │ │
│  │                                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                              │                                               │
└──────────────────────────────┼───────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          External Services                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │    Supabase     │  │  LLM Providers  │  │     File Storage            │  │
│  │  - Auth         │  │  - Anthropic    │  │  - Supabase Storage         │  │
│  │  - Database     │  │  - OpenAI       │  │  - Or local disk            │  │
│  │  - Realtime     │  │  - Google       │  │                             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 What We Build vs What We Reuse

| Component | Strategy | Source |
|-----------|----------|--------|
| **HTTP API** | REUSE | OpenCode server (`opencode serve`) |
| **SDK Client** | REUSE | `@opencode-ai/sdk` package |
| **Session Management** | REUSE | OpenCode server handles this |
| **Tool Execution** | REUSE | OpenCode server handles this |
| **LLM Integration** | REUSE | OpenCode's 75+ provider support |
| **Message Rendering** | PORT/ADAPT | `@opencode-ai/ui` → React components |
| **State Management** | ADAPT | Pattern from `desktop/src/context/` |
| **Auth Layer** | BUILD | NextJS + Supabase (extend existing) |
| **Rate Limiting** | BUILD | NextJS middleware |
| **User Settings** | BUILD | Supabase database |
| **Workspace Layout** | BUILD | React + resizable panels |

### 2.3 OpenCode Server Deployment Options

#### Option A: Shared Multi-Tenant Server (Recommended for MVP)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Single OpenCode Server                               │
│                                                                              │
│  - One server instance serves all users                                     │
│  - Each user has isolated sessions (via session ID)                         │
│  - File operations scoped to user's virtual directory                       │
│  - Simpler deployment, lower cost                                           │
│                                                                              │
│  Limitations:                                                                │
│  - All users share same OpenCode config                                     │
│  - File system isolation requires careful handling                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Configuration for shared server:**

```json
// opencode.json for shared server
{
  "provider": {
    "anthropic": {
      "disabled": false
    },
    "openai": {
      "disabled": false  
    }
  },
  "model": "anthropic/claude-sonnet-4-20250514"
}
```

#### Option B: Per-User Containers (Future Enhancement)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Container Orchestration                                 │
│                                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                           │
│  │ User A      │ │ User B      │ │ User C      │                           │
│  │ OpenCode    │ │ OpenCode    │ │ OpenCode    │  ...                      │
│  │ Container   │ │ Container   │ │ Container   │                           │
│  │ Port: 4096  │ │ Port: 4097  │ │ Port: 4098  │                           │
│  └─────────────┘ └─────────────┘ └─────────────┘                           │
│                                                                              │
│  Benefits:                                                                   │
│  - Full isolation per user                                                  │
│  - User-specific OpenCode config                                            │
│  - Better security for file operations                                      │
│                                                                              │
│  Complexity:                                                                 │
│  - Container orchestration (Docker/K8s)                                     │
│  - Dynamic port allocation                                                  │
│  - Resource management                                                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Phase 3: Workspace UI Implementation

### 3.1 Overview

**Duration:** 2 weeks  
**Goal:** Full IDE-like workspace leveraging OpenCode's existing capabilities

### 3.2 Component Architecture

```
src/
├── components/
│   ├── workspace/
│   │   ├── Workspace.tsx              # Main layout container
│   │   ├── WorkspaceHeader.tsx        # Top toolbar
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx            # Container
│   │   │   ├── FileExplorer.tsx       # File tree
│   │   │   ├── SessionList.tsx        # Chat sessions
│   │   │   └── ProjectInfo.tsx        # Project metadata
│   │   ├── Editor/
│   │   │   ├── EditorPane.tsx         # Monaco container
│   │   │   ├── EditorTabs.tsx         # File tabs
│   │   │   └── DiffViewer.tsx         # File diff (from @opencode-ai/ui)
│   │   ├── Terminal/
│   │   │   ├── TerminalPane.tsx       # xterm.js container
│   │   │   └── TerminalTabs.tsx       # Multiple terminals
│   │   └── Chat/
│   │       ├── ChatPanel.tsx          # Main chat container
│   │       ├── MessageList.tsx        # Messages display
│   │       ├── MessagePart.tsx        # Individual message part
│   │       ├── PromptInput.tsx        # Chat input
│   │       ├── ToolExecution.tsx      # Tool call display
│   │       └── CodeBlock.tsx          # Syntax highlighted code
│   │
│   └── ui/                            # shadcn/ui components
│       └── ...
│
├── hooks/
│   ├── useOpenCode.ts                 # OpenCode SDK wrapper
│   ├── useSession.ts                  # Session management
│   ├── useMessages.ts                 # Message streaming
│   ├── useFiles.ts                    # File operations
│   └── useEventStream.ts             # SSE subscription
│
├── stores/
│   ├── workspace.ts                   # Workspace layout state
│   ├── sync.ts                        # Server-synced state
│   ├── local.ts                       # Local UI state
│   └── opencode.ts                    # OpenCode connection state
│
└── lib/
    ├── opencode/
    │   ├── client.ts                  # SDK client wrapper
    │   ├── events.ts                  # Event handling
    │   └── types.ts                   # Type re-exports
    └── ...
```

### 3.3 Task Breakdown

#### Week 1: Core Integration & Chat UI

| Task | Description | Effort | Dependencies |
|------|-------------|--------|--------------|
| 3.1.1 | Set up OpenCode SDK client wrapper | 4h | - |
| 3.1.2 | Implement SSE event stream subscription | 4h | 3.1.1 |
| 3.1.3 | Create sync store (from desktop pattern) | 6h | 3.1.2 |
| 3.1.4 | Build MessageList component | 4h | 3.1.3 |
| 3.1.5 | Build MessagePart component (text, code, tool) | 6h | 3.1.4 |
| 3.1.6 | Build PromptInput with autocomplete | 8h | 3.1.3 |
| 3.1.7 | Implement chat streaming display | 4h | 3.1.4, 3.1.5 |
| 3.1.8 | Build ToolExecution component | 4h | 3.1.5 |

**Deliverables Week 1:**
- Working chat interface connected to OpenCode server
- Real-time streaming responses
- Tool execution display

#### Week 2: Workspace Layout & Editor

| Task | Description | Effort | Dependencies |
|------|-------------|--------|--------------|
| 3.2.1 | Build resizable Workspace layout | 6h | - |
| 3.2.2 | Integrate Monaco Editor | 6h | 3.2.1 |
| 3.2.3 | Build FileExplorer (using OpenCode file APIs) | 6h | 3.1.1 |
| 3.2.4 | Build EditorTabs component | 4h | 3.2.2 |
| 3.2.5 | Integrate xterm.js terminal | 6h | 3.2.1 |
| 3.2.6 | Build DiffViewer (port from @opencode-ai/ui) | 4h | 3.2.2 |
| 3.2.7 | Connect file changes to editor | 4h | 3.2.2, 3.2.3 |
| 3.2.8 | Keyboard shortcuts implementation | 4h | All above |

**Deliverables Week 2:**
- Full workspace layout with resizable panels
- Monaco editor with file editing
- File explorer connected to OpenCode
- Terminal integration

### 3.4 Key Implementation Details

#### 3.4.1 OpenCode SDK Client Setup

```typescript
// lib/opencode/client.ts
import { createOpencodeClient } from '@opencode-ai/sdk';

let client: ReturnType<typeof createOpencodeClient> | null = null;

export function getOpenCodeClient() {
  if (!client) {
    client = createOpencodeClient({
      baseUrl: process.env.NEXT_PUBLIC_OPENCODE_URL || 'http://localhost:4096',
    });
  }
  return client;
}

// Type-safe API calls
export async function createSession(title?: string) {
  const client = getOpenCodeClient();
  return client.session.create({ body: { title } });
}

export async function sendPrompt(sessionId: string, message: string, model?: string) {
  const client = getOpenCodeClient();
  return client.session.prompt({
    path: { id: sessionId },
    body: {
      parts: [{ type: 'text', text: message }],
      model: model ? { providerID: 'anthropic', modelID: model } : undefined,
    },
  });
}

export async function listFiles(path: string = '.') {
  const client = getOpenCodeClient();
  return client.find.files({ query: { query: '*', directory: path } });
}

export async function readFile(path: string) {
  const client = getOpenCodeClient();
  return client.file.read({ query: { path } });
}
```

#### 3.4.2 SSE Event Stream Hook

```typescript
// hooks/useEventStream.ts
import { useEffect, useCallback, useRef } from 'react';
import { useSyncStore } from '@/stores/sync';

export function useEventStream(baseUrl: string) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const { handleEvent } = useSyncStore();

  useEffect(() => {
    const url = `${baseUrl}/global/event`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleEvent(data);
      } catch (error) {
        console.error('Failed to parse event:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      // Implement reconnection logic
    };

    return () => {
      eventSource.close();
    };
  }, [baseUrl, handleEvent]);

  return eventSourceRef;
}
```

#### 3.4.3 Sync Store (Pattern from OpenCode Desktop)

```typescript
// stores/sync.ts
import { create } from 'zustand';
import type { Session, Message, Part } from '@opencode-ai/sdk';

interface SyncState {
  // Sessions
  sessions: Session[];
  currentSessionId: string | null;
  
  // Messages per session
  messages: Record<string, Message[]>;
  parts: Record<string, Part[]>;
  
  // Loading states
  isLoading: boolean;
  
  // Actions
  setCurrentSession: (id: string | null) => void;
  handleEvent: (event: OpenCodeEvent) => void;
  
  // Derived
  currentSession: () => Session | null;
  currentMessages: () => Message[];
}

export const useSyncStore = create<SyncState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  messages: {},
  parts: {},
  isLoading: false,

  setCurrentSession: (id) => set({ currentSessionId: id }),

  handleEvent: (event) => {
    switch (event.type) {
      case 'session.created':
        set((state) => ({
          sessions: [...state.sessions, event.properties.session],
        }));
        break;

      case 'session.updated':
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === event.properties.session.id ? event.properties.session : s
          ),
        }));
        break;

      case 'message.created':
        set((state) => {
          const sessionId = event.properties.message.sessionId;
          const current = state.messages[sessionId] || [];
          return {
            messages: {
              ...state.messages,
              [sessionId]: [...current, event.properties.message],
            },
          };
        });
        break;

      case 'part.created':
      case 'part.updated':
        set((state) => {
          const messageId = event.properties.part.messageId;
          const current = state.parts[messageId] || [];
          const existingIndex = current.findIndex(
            (p) => p.id === event.properties.part.id
          );
          
          if (existingIndex >= 0) {
            // Update existing part
            const updated = [...current];
            updated[existingIndex] = event.properties.part;
            return { parts: { ...state.parts, [messageId]: updated } };
          } else {
            // Add new part
            return {
              parts: { ...state.parts, [messageId]: [...current, event.properties.part] },
            };
          }
        });
        break;

      // Handle other event types...
    }
  },

  currentSession: () => {
    const state = get();
    return state.sessions.find((s) => s.id === state.currentSessionId) || null;
  },

  currentMessages: () => {
    const state = get();
    if (!state.currentSessionId) return [];
    return state.messages[state.currentSessionId] || [];
  },
}));
```

#### 3.4.4 Message Components (Ported from @opencode-ai/ui patterns)

```tsx
// components/workspace/Chat/MessagePart.tsx
import { Part } from '@opencode-ai/sdk';
import { CodeBlock } from './CodeBlock';
import { ToolExecution } from './ToolExecution';
import { DiffViewer } from '../Editor/DiffViewer';

interface MessagePartProps {
  part: Part;
}

export function MessagePart({ part }: MessagePartProps) {
  switch (part.type) {
    case 'text':
      return (
        <div className="prose prose-invert max-w-none">
          <MarkdownRenderer content={part.text} />
        </div>
      );

    case 'tool-invocation':
      return (
        <ToolExecution
          toolName={part.toolName}
          args={part.args}
          state={part.state}
        />
      );

    case 'tool-result':
      return (
        <div className="bg-muted rounded-md p-3 text-sm">
          <div className="font-medium text-muted-foreground mb-1">
            Tool Result: {part.toolName}
          </div>
          <pre className="whitespace-pre-wrap">{JSON.stringify(part.result, null, 2)}</pre>
        </div>
      );

    case 'file':
      return (
        <div className="border rounded-md overflow-hidden">
          <div className="bg-muted px-3 py-2 border-b font-mono text-sm">
            {part.path}
          </div>
          {part.diff ? (
            <DiffViewer diff={part.diff} />
          ) : (
            <CodeBlock code={part.content} language={getLanguage(part.path)} />
          )}
        </div>
      );

    default:
      return null;
  }
}
```

#### 3.4.5 Workspace Layout

```tsx
// components/workspace/Workspace.tsx
'use client';

import { useWorkspaceStore } from '@/stores/workspace';
import { Sidebar } from './Sidebar/Sidebar';
import { EditorPane } from './Editor/EditorPane';
import { TerminalPane } from './Terminal/TerminalPane';
import { ChatPanel } from './Chat/ChatPanel';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { useEventStream } from '@/hooks/useEventStream';

export function Workspace() {
  const { 
    sidebarOpen, 
    chatPanelOpen, 
    terminalOpen,
    sidebarSize,
    chatPanelSize,
    terminalSize,
  } = useWorkspaceStore();

  // Connect to OpenCode event stream
  useEventStream(process.env.NEXT_PUBLIC_OPENCODE_URL || 'http://localhost:4096');

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <WorkspaceHeader />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar */}
          {sidebarOpen && (
            <>
              <ResizablePanel 
                defaultSize={sidebarSize} 
                minSize={10} 
                maxSize={30}
                onResize={(size) => useWorkspaceStore.setState({ sidebarSize: size })}
              >
                <Sidebar />
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Editor + Terminal */}
          <ResizablePanel defaultSize={chatPanelOpen ? 50 : 85}>
            <ResizablePanelGroup direction="vertical">
              {/* Editor */}
              <ResizablePanel defaultSize={terminalOpen ? 100 - terminalSize : 100}>
                <EditorPane />
              </ResizablePanel>

              {/* Terminal */}
              {terminalOpen && (
                <>
                  <ResizableHandle withHandle />
                  <ResizablePanel 
                    defaultSize={terminalSize} 
                    minSize={10}
                    onResize={(size) => useWorkspaceStore.setState({ terminalSize: size })}
                  >
                    <TerminalPane />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* Chat Panel */}
          {chatPanelOpen && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel 
                defaultSize={chatPanelSize} 
                minSize={20} 
                maxSize={50}
                onResize={(size) => useWorkspaceStore.setState({ chatPanelSize: size })}
              >
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

## 4. Phase 4: User Features Implementation

### 4.1 Overview

**Duration:** 2 weeks  
**Goal:** User authentication integration, API key management, and usage tracking

### 4.2 Feature Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         User Features Layer                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     Authentication                                   │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────────┐   │    │
│  │  │  Supabase   │ │   Session   │ │    Protected Routes         │   │    │
│  │  │  OAuth      │ │  Management │ │    Middleware               │   │    │
│  │  │  (existing) │ │             │ │                             │   │    │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                   API Key Management                                 │    │
│  │  ┌─────────────────────────────────────────────────────────────┐   │    │
│  │  │                                                              │   │    │
│  │  │  User provides Anthropic API Key                            │   │    │
│  │  │         │                                                    │   │    │
│  │  │         ▼                                                    │   │    │
│  │  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │   │    │
│  │  │  │  Validate   │───▶│  Encrypt    │───▶│  Store in       │  │   │    │
│  │  │  │  API Key    │    │  (AES-256)  │    │  Supabase       │  │   │    │
│  │  │  └─────────────┘    └─────────────┘    └─────────────────┘  │   │    │
│  │  │                                                              │   │    │
│  │  │  On API Request:                                             │   │    │
│  │  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │   │    │
│  │  │  │  Check user │───▶│  Decrypt    │───▶│  Use for LLM    │  │   │    │
│  │  │  │  has key    │    │  in memory  │    │  request        │  │   │    │
│  │  │  └─────────────┘    └─────────────┘    └─────────────────┘  │   │    │
│  │  │         │                                                    │   │    │
│  │  │         │ No key? Use platform credentials                   │   │    │
│  │  │         ▼                                                    │   │    │
│  │  │  ┌─────────────────────────────────────────────────────┐    │   │    │
│  │  │  │  Platform API Key (from env vars)                    │    │   │    │
│  │  │  │  + Rate limiting applied                             │    │   │    │
│  │  │  └─────────────────────────────────────────────────────┘    │   │    │
│  │  └─────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Usage & Rate Limiting                             │    │
│  │  ┌──────────────────────────────────────────────────────────────┐   │    │
│  │  │                                                               │   │    │
│  │  │  Per Request:                                                 │   │    │
│  │  │  1. Check rate limit (in-memory counter)                      │   │    │
│  │  │  2. If exceeded → return 429                                  │   │    │
│  │  │  3. If allowed → proxy to OpenCode                            │   │    │
│  │  │  4. Log usage to Supabase (async)                             │   │    │
│  │  │                                                               │   │    │
│  │  │  Rate Limits:                                                 │   │    │
│  │  │  ┌─────────────────────────────────────────────────────────┐ │   │    │
│  │  │  │  Platform Credentials:  50 req/hour, 100k tokens/hour   │ │   │    │
│  │  │  │  User's Own Key:        200 req/hour, 500k tokens/hour  │ │   │    │
│  │  │  └─────────────────────────────────────────────────────────┘ │   │    │
│  │  │                                                               │   │    │
│  │  └──────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Settings UI                                     │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │    │
│  │  │  API Key    │ │   Model     │ │   Theme     │ │   Usage     │   │    │
│  │  │  Setup      │ │  Selection  │ │  Settings   │ │  Dashboard  │   │    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Task Breakdown

#### Week 1: Authentication & API Key Management

| Task | Description | Effort | Dependencies |
|------|-------------|--------|--------------|
| 4.1.1 | Extend auth middleware for OpenCode routes | 4h | - |
| 4.1.2 | Build API key validation endpoint | 4h | 4.1.1 |
| 4.1.3 | Implement API key encryption module | 4h | - |
| 4.1.4 | Create user_settings table migration | 2h | - |
| 4.1.5 | Build API key storage/retrieval service | 4h | 4.1.3, 4.1.4 |
| 4.1.6 | Create Settings page UI | 6h | 4.1.5 |
| 4.1.7 | Build API key connection flow UI | 6h | 4.1.6 |
| 4.1.8 | Implement credential injection for OpenCode | 6h | 4.1.5 |

**Deliverables Week 1:**
- Users can add/remove their Anthropic API key
- API keys encrypted at rest
- OpenCode uses user's key when available

#### Week 2: Rate Limiting & Usage Tracking

| Task | Description | Effort | Dependencies |
|------|-------------|--------|--------------|
| 4.2.1 | Implement in-memory rate limiter | 6h | - |
| 4.2.2 | Create rate_limit_log table migration | 2h | - |
| 4.2.3 | Build rate limit middleware | 4h | 4.2.1 |
| 4.2.4 | Create usage_analytics table migration | 2h | - |
| 4.2.5 | Implement async usage logging | 4h | 4.2.4 |
| 4.2.6 | Build usage dashboard UI | 6h | 4.2.5 |
| 4.2.7 | Add rate limit headers to responses | 2h | 4.2.3 |
| 4.2.8 | Build model selector component | 4h | - |
| 4.2.9 | Implement session persistence UI | 6h | - |
| 4.2.10 | Testing and polish | 4h | All above |

**Deliverables Week 2:**
- Rate limiting active for all users
- Usage tracking and display
- Model selection
- Session history persistence

### 4.4 Key Implementation Details

#### 4.4.1 OpenCode Proxy with Credential Injection

```typescript
// app/api/opencode/[...path]/route.ts
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/crypto';
import { checkRateLimit, recordUsage } from '@/lib/rate-limit';

const OPENCODE_URL = process.env.OPENCODE_URL || 'http://localhost:4096';

export async function POST(
  request: Request,
  { params }: { params: { path: string[] } }
) {
  // 1. Authenticate user
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Check rate limit
  const rateLimitResult = await checkRateLimit(user.id);
  if (!rateLimitResult.allowed) {
    return Response.json(
      { error: 'Rate limit exceeded', resetAt: rateLimitResult.resetAt },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toISOString(),
          'Retry-After': String(rateLimitResult.retryAfter),
        }
      }
    );
  }

  // 3. Get user's API key (if they have one connected)
  const { data: settings } = await supabase
    .from('user_settings')
    .select('anthropic_api_key_encrypted')
    .eq('user_id', user.id)
    .single();

  // 4. Prepare headers for OpenCode
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Inject API key if user has one, otherwise OpenCode uses its configured key
  if (settings?.anthropic_api_key_encrypted) {
    const apiKey = await decrypt(
      settings.anthropic_api_key_encrypted,
      process.env.ENCRYPTION_KEY!
    );
    // OpenCode supports ANTHROPIC_API_KEY header for per-request override
    headers['X-Anthropic-Api-Key'] = apiKey;
  }

  // 5. Proxy request to OpenCode
  const path = params.path.join('/');
  const body = await request.text();

  const response = await fetch(`${OPENCODE_URL}/${path}`, {
    method: 'POST',
    headers,
    body,
  });

  // 6. Handle streaming response
  if (response.headers.get('content-type')?.includes('text/event-stream')) {
    // Forward SSE stream with usage tracking
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        // Track token usage from streaming response
        const text = new TextDecoder().decode(chunk);
        if (text.includes('"usage"')) {
          // Parse and record usage asynchronously
          recordUsageFromStream(user.id, text).catch(console.error);
        }
        controller.enqueue(chunk);
      },
    });

    return new Response(response.body?.pipeThrough(transformStream), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        ...getRateLimitHeaders(rateLimitResult),
      },
    });
  }

  // 7. Forward regular response
  const data = await response.json();
  
  // Record usage
  if (data.usage) {
    await recordUsage(user.id, data.usage);
  }

  return Response.json(data, {
    status: response.status,
    headers: getRateLimitHeaders(rateLimitResult),
  });
}

// Similar handlers for GET, PUT, DELETE...
```

#### 4.4.2 API Key Management Service

```typescript
// lib/api-keys.ts
import { createClient } from '@/lib/supabase/server';
import { encrypt, decrypt } from '@/lib/crypto';
import Anthropic from '@anthropic-ai/sdk';

export async function validateAnthropicKey(apiKey: string): Promise<boolean> {
  try {
    const client = new Anthropic({ apiKey });
    // Make a minimal API call to validate
    await client.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'Hi' }],
    });
    return true;
  } catch (error) {
    return false;
  }
}

export async function storeApiKey(
  userId: string,
  provider: 'anthropic' | 'openai',
  apiKey: string
): Promise<void> {
  const supabase = createClient();
  const encryptedKey = await encrypt(apiKey, process.env.ENCRYPTION_KEY!);

  await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      [`${provider}_api_key_encrypted`]: encryptedKey,
      [`${provider}_connected_at`]: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
}

export async function removeApiKey(
  userId: string,
  provider: 'anthropic' | 'openai'
): Promise<void> {
  const supabase = createClient();

  await supabase
    .from('user_settings')
    .update({
      [`${provider}_api_key_encrypted`]: null,
      [`${provider}_connected_at`]: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
}

export async function getUserApiKey(
  userId: string,
  provider: 'anthropic' | 'openai'
): Promise<string | null> {
  const supabase = createClient();

  const { data } = await supabase
    .from('user_settings')
    .select(`${provider}_api_key_encrypted`)
    .eq('user_id', userId)
    .single();

  if (!data?.[`${provider}_api_key_encrypted`]) {
    return null;
  }

  return decrypt(
    data[`${provider}_api_key_encrypted`],
    process.env.ENCRYPTION_KEY!
  );
}

export async function hasUserApiKey(
  userId: string,
  provider: 'anthropic' | 'openai'
): Promise<boolean> {
  const supabase = createClient();

  const { data } = await supabase
    .from('user_settings')
    .select(`${provider}_api_key_encrypted`)
    .eq('user_id', userId)
    .single();

  return !!data?.[`${provider}_api_key_encrypted`];
}
```

#### 4.4.3 Settings Page

```tsx
// app/(dashboard)/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Check, X, Key, BarChart3 } from 'lucide-react';

export default function SettingsPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<{ apiKey: string }>();

  useEffect(() => {
    // Check if user has connected API key
    fetch('/api/credentials/status')
      .then((res) => res.json())
      .then((data) => {
        setIsConnected(data.anthropic?.connected || false);
        setIsLoading(false);
      });
  }, []);

  const onSubmit = async (data: { apiKey: string }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/credentials/anthropic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: data.apiKey }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to connect API key');
      }

      setIsConnected(true);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async () => {
    setIsSubmitting(true);

    try {
      await fetch('/api/credentials/anthropic', { method: 'DELETE' });
      setIsConnected(false);
    } catch (err) {
      setError('Failed to disconnect');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="container max-w-2xl py-8 space-y-8">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* API Key Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Anthropic API Key
          </CardTitle>
          <CardDescription>
            Connect your own Anthropic API key to use your Claude Pro/Max subscription.
            Your key is encrypted and never shared.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <Alert>
                <Check className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  Your Anthropic API key is connected. You're using your own subscription.
                </AlertDescription>
              </Alert>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <X className="mr-2" />}
                Disconnect API Key
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="sk-ant-..."
                  {...register('apiKey', { required: true })}
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from the{' '}
                  <a
                    href="https://console.anthropic.com/settings/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Anthropic Console
                  </a>
                </p>
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin mr-2" />}
                Connect API Key
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Usage Statistics
          </CardTitle>
          <CardDescription>
            Your usage this billing period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsageStats />
        </CardContent>
      </Card>
    </div>
  );
}

function UsageStats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/usage/stats')
      .then((res) => res.json())
      .then(setStats);
  }, []);

  if (!stats) return <Loader2 className="animate-spin" />;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-muted-foreground">Requests Today</p>
        <p className="text-2xl font-bold">{stats.requestsToday}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Tokens Used Today</p>
        <p className="text-2xl font-bold">{stats.tokensToday.toLocaleString()}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Rate Limit</p>
        <p className="text-2xl font-bold">
          {stats.remaining.requests} / {stats.limit.requests}
        </p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Resets In</p>
        <p className="text-2xl font-bold">{stats.resetIn}</p>
      </div>
    </div>
  );
}
```

#### 4.4.4 OpenCode Configuration for Multi-Provider

```json
// opencode.json (server configuration)
{
  "provider": {
    "anthropic": {
      "models": [
        "claude-sonnet-4-5-20250929",
        "claude-opus-4-5-20251101",
        "claude-haiku-4-5-20251001"
      ]
    },
    "google": {
      "models": [
        "gemini-3.0-flash-preview",
      ]
    }
  },
  "model": "anthropic/claude-haiku-4-5-20251001",
  "agent": {
    "build": {
      "model": "anthropic/claude-haiku-4-5-20251001",
      "tools": ["file", "shell", "browser"]
    },
    "plan": {
      "model": "anthropic/claude-sonnet-4-5-20250929",
      "tools": ["file"]
    }
  }
}
```

---

## 5. Technical Specifications

### 5.1 Environment Variables

```env
# Existing (Supabase)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenCode
OPENCODE_URL=http://localhost:4096
NEXT_PUBLIC_OPENCODE_URL=http://localhost:4096

# LLM Providers (Platform Keys)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=

# Encryption
ENCRYPTION_KEY=  # 32+ character random string for AES-256

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_HOUR=50
RATE_LIMIT_TOKENS_PER_HOUR=100000
```

### 5.2 Database Schema Additions

```sql
-- User settings (extends existing schema)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- API Keys (encrypted)
  anthropic_api_key_encrypted TEXT,
  anthropic_connected_at TIMESTAMP WITH TIME ZONE,
  openai_api_key_encrypted TEXT,
  openai_connected_at TIMESTAMP WITH TIME ZONE,
  
  -- Preferences
  preferred_provider VARCHAR(50) DEFAULT 'anthropic',
  preferred_model VARCHAR(100) DEFAULT 'claude-sonnet-4-20250514',
  theme VARCHAR(20) DEFAULT 'system',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting
CREATE TABLE IF NOT EXISTS rate_limit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  request_count INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  
  CONSTRAINT unique_user_window UNIQUE (user_id, window_start)
);

CREATE INDEX idx_rate_limit_user_window ON rate_limit_log(user_id, window_start DESC);

-- Usage analytics
CREATE TABLE IF NOT EXISTS usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  credential_type VARCHAR(20) NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_usage_user_created ON usage_analytics(user_id, created_at DESC);

-- RLS Policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_settings_policy ON user_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY rate_limit_policy ON rate_limit_log
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY usage_analytics_policy ON usage_analytics
  FOR ALL USING (auth.uid() = user_id);
```

### 5.3 Package Dependencies

```json
{
  "dependencies": {
    // Existing NextJS + Supabase dependencies...
    
    // OpenCode SDK
    "@opencode-ai/sdk": "^1.0.0",
    
    // UI Components
    "@radix-ui/react-resizable": "^1.0.0",
    "@monaco-editor/react": "^4.6.0",
    "xterm": "^5.3.0",
    "xterm-addon-fit": "^0.8.0",
    "xterm-addon-web-links": "^0.9.0",
    
    // State Management
    "zustand": "^4.5.0",
    
    // Utilities
    "react-markdown": "^9.0.0",
    "react-syntax-highlighter": "^15.5.0",
    "diff": "^5.2.0"
  }
}
```

---

## 6. Risk Mitigation

### 6.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| OpenCode SDK not browser-compatible | High | Test early; fallback to REST calls |
| SSE connection drops | Medium | Implement reconnection with exponential backoff |
| OpenCode server instability | High | Health checks, automatic restart, error boundaries |
| Rate limiting bypassed | Medium | Server-side validation, not just client |
| API key leakage | Critical | Never log keys, memory-only decryption, audit logs |

### 6.2 Fallback Strategies

1. **If OpenCode SDK doesn't work in browser:**
   - Use direct REST calls with fetch
   - Create thin wrapper matching SDK interface

2. **If SSE is unreliable:**
   - Fall back to polling (less ideal)
   - Use WebSocket alternative

3. **If OpenCode server needs isolation:**
   - Move to per-user containers (Phase 2)
   - Use WebContainers for sandboxing

### 6.3 Testing Strategy

| Test Type | Coverage | Tools |
|-----------|----------|-------|
| Unit Tests | Components, hooks, utilities | Vitest, React Testing Library |
| Integration Tests | API routes, OpenCode integration | Vitest, MSW |
| E2E Tests | Critical user flows | Playwright |
| Security Tests | API key handling, auth flows | Manual review, OWASP checks |

---

## Summary

This implementation plan leverages OpenCode's existing architecture significantly:

1. **Phase 3 (Workspace UI):**
   - Uses `@opencode-ai/sdk` for all API communication
   - Adapts state patterns from `packages/desktop/src/context/`
   - Ports UI components concepts from `@opencode-ai/ui`
   - Connects to OpenCode server for all agent functionality

2. **Phase 4 (User Features):**
   - Builds auth wrapper around OpenCode API
   - Implements API key management with encryption
   - Adds rate limiting layer
   - Creates usage tracking

The key insight is that **we don't need to rebuild the agent, tools, or LLM integration** - OpenCode already handles all of that. We're building a **web frontend** that connects to OpenCode's existing HTTP server, similar to how the desktop app and VS Code extension work.

---

*Document Version: 1.0*  
*Last Updated: January 2025*