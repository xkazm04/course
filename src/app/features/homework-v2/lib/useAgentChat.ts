/**
 * useAgentChat Hook
 *
 * React hook for connecting to the agent chat API with SSE streaming.
 * Supports tool execution display.
 */

import { useState, useCallback, useRef } from 'react';
import type { AgentEvent } from '@/lib/agent/types';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  toolCalls?: ToolCallDisplay[];
}

export interface ToolCallDisplay {
  id: string;
  name: string;
  input?: string;
  result?: {
    success: boolean;
    output?: string;
    error?: string;
  };
  status: 'pending' | 'running' | 'complete' | 'error';
}

export interface UseAgentChatOptions {
  sessionId?: string;
  projectId?: string;
  onSessionCreated?: (sessionId: string) => void;
  onError?: (error: string) => void;
  onToolResult?: (toolName: string, result: { success: boolean; output?: string; error?: string }) => void;
}

export interface UseAgentChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sessionId: string | null;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  stopGeneration: () => void;
}

export function useAgentChat(options: UseAgentChatOptions = {}): UseAgentChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(options.sessionId || null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);

      // Add user message
      const userMessageId = `user-${Date.now()}`;
      const userMessage: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      // Add placeholder assistant message
      const assistantMessageId = `assistant-${Date.now()}`;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        toolCalls: [],
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      // Create abort controller
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch('/api/agent/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            projectId: options.projectId,
            message: content.trim(),
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        // Get session ID from header
        const newSessionId = response.headers.get('X-Session-Id');
        if (newSessionId && newSessionId !== sessionId) {
          setSessionId(newSessionId);
          options.onSessionCreated?.(newSessionId);
        }

        // Process SSE stream
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let currentToolCalls: ToolCallDisplay[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6)) as AgentEvent | { type: 'error'; error: string };

                if (data.type === 'text') {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: m.content + data.text }
                        : m
                    )
                  );
                } else if (data.type === 'thinking') {
                  // Handle thinking events (display as thinking indicator)
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: m.content + `\n<thinking>${data.text}</thinking>\n` }
                        : m
                    )
                  );
                } else if (data.type === 'tool_start') {
                  const toolCall: ToolCallDisplay = {
                    id: `tool-${Date.now()}-${currentToolCalls.length}`,
                    name: data.tool,
                    input: data.input ? JSON.stringify(data.input, null, 2) : undefined,
                    status: 'running',
                  };
                  currentToolCalls = [...currentToolCalls, toolCall];
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, toolCalls: [...currentToolCalls] }
                        : m
                    )
                  );
                } else if (data.type === 'tool_result') {
                  // Find the running tool and update it with result
                  currentToolCalls = currentToolCalls.map((tc) =>
                    tc.name === data.tool && tc.status === 'running'
                      ? {
                          ...tc,
                          status: data.result.success ? 'complete' : 'error',
                          result: data.result,
                        }
                      : tc
                  );
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, toolCalls: [...currentToolCalls] }
                        : m
                    )
                  );
                  // Notify callback
                  options.onToolResult?.(data.tool, data.result);
                } else if (data.type === 'done') {
                  if (data.sessionId) {
                    setSessionId(data.sessionId);
                  }
                } else if (data.type === 'error') {
                  const errorMsg = 'message' in data ? data.message : (data as any).error || 'Unknown error';
                  setError(errorMsg);
                  options.onError?.(errorMsg);
                }
              } catch {
                // Ignore parse errors for incomplete data
              }
            }
          }
        }

        // Mark streaming as complete
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId ? { ...m, isStreaming: false } : m
          )
        );
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User cancelled
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, isStreaming: false, content: m.content + ' [cancelled]' }
                : m
            )
          );
        } else {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setError(errorMessage);
          options.onError?.(errorMessage);
          // Remove the empty assistant message on error
          setMessages((prev) => prev.filter((m) => m.id !== assistantMessageId));
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, sessionId, options]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  return {
    messages,
    isLoading,
    sessionId,
    error,
    sendMessage,
    clearMessages,
    stopGeneration,
  };
}
