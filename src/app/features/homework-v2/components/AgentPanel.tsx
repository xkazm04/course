/**
 * Agent Panel
 *
 * A chat panel for testing the AI agent API.
 * Uses the real streaming API endpoint.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  Bot,
  User,
  AlertCircle,
  Trash2,
  Square,
  ChevronRight,
  Code,
  FileText,
} from 'lucide-react';
import { useAgentChat, ChatMessage, ToolCallDisplay } from '../lib/useAgentChat';

interface AgentPanelProps {
  className?: string;
  projectId?: string;
  onFilesChanged?: () => void;
}

export function AgentPanel({ className = '', projectId, onFilesChanged }: AgentPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    sessionId,
    error,
    sendMessage,
    clearMessages,
    stopGeneration,
  } = useAgentChat({
    projectId,
    onError: (err) => console.error('Agent error:', err),
    onToolResult: (toolName, result) => {
      // Notify parent when file operations complete
      if (result.success && ['write_file', 'delete_file', 'create_directory'].includes(toolName)) {
        onFilesChanged?.();
      }
    },
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input;
    setInput('');
    await sendMessage(message);
    inputRef.current?.focus();
  };

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[var(--forge-bg-base)] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--forge-text-primary)]">
              Agent Chat
            </h2>
            <p className="text-xs text-[var(--forge-text-muted)]">
              {sessionId ? `Session: ${sessionId.slice(0, 8)}...` : 'New session'}
            </p>
          </div>
        </div>
        <button
          onClick={clearMessages}
          disabled={isLoading || messages.length === 0}
          className="p-2 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-bench)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Clear chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-12 h-12 text-[var(--forge-text-muted)] mb-4" />
            <h3 className="text-lg font-medium text-[var(--forge-text-primary)] mb-2">
              Start a conversation
            </h3>
            <p className="text-sm text-[var(--forge-text-muted)] max-w-sm">
              Ask me anything about coding, software development, or get help with your projects.
            </p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
              disabled={isLoading}
              rows={1}
              className="w-full px-4 py-3 bg-[var(--forge-bg-bench)] border border-[var(--forge-border-subtle)] rounded-lg text-[var(--forge-text-primary)] placeholder-[var(--forge-text-muted)] focus:outline-none focus:border-[var(--ember)] resize-none disabled:opacity-50"
              style={{
                minHeight: '48px',
                maxHeight: '200px',
              }}
            />
          </div>
          {isLoading ? (
            <button
              type="button"
              onClick={stopGeneration}
              className="px-4 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-3 bg-[var(--ember)] text-white rounded-lg hover:bg-[var(--ember-glow)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-[var(--ember)]/20 text-[var(--ember)]'
            : 'bg-purple-500/20 text-purple-400'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[80%] ${isUser ? 'flex justify-end' : ''}`}>
        <div
          className={`px-4 py-3 rounded-lg ${
            isUser
              ? 'bg-[var(--ember)]/10 border border-[var(--ember)]/20'
              : 'bg-[var(--forge-bg-bench)] border border-[var(--forge-border-subtle)]'
          }`}
        >
          {/* Tool calls */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mb-3 space-y-2">
              {message.toolCalls.map((tool) => (
                <ToolCallCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}

          {/* Text content */}
          <div className="text-sm text-[var(--forge-text-primary)] whitespace-pre-wrap">
            {message.content}
            {message.isStreaming && (
              <span className="inline-block w-2 h-4 bg-[var(--ember)] ml-1 animate-pulse" />
            )}
          </div>

          {/* Timestamp */}
          <div className="mt-2 text-xs text-[var(--forge-text-muted)]">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Tool info helper - inspired by OpenCode's getToolInfo pattern
function getToolInfo(name: string, input?: string): { icon: React.ReactNode; title: string; subtitle?: string } {
  let parsedInput: Record<string, unknown> = {};
  if (input) {
    try {
      parsedInput = JSON.parse(input);
    } catch {
      // Ignore parse errors
    }
  }

  switch (name) {
    case 'read_file':
      return {
        icon: <FileText className="w-3.5 h-3.5 text-blue-400" />,
        title: 'Read',
        subtitle: parsedInput.path as string | undefined,
      };
    case 'write_file':
      return {
        icon: <FileText className="w-3.5 h-3.5 text-green-400" />,
        title: 'Write',
        subtitle: parsedInput.path as string | undefined,
      };
    case 'list_files':
      return {
        icon: <FileText className="w-3.5 h-3.5 text-yellow-400" />,
        title: 'List',
        subtitle: (parsedInput.path as string) || '/',
      };
    case 'search_files':
      return {
        icon: <FileText className="w-3.5 h-3.5 text-purple-400" />,
        title: 'Search',
        subtitle: parsedInput.pattern as string | undefined,
      };
    case 'delete_file':
      return {
        icon: <FileText className="w-3.5 h-3.5 text-red-400" />,
        title: 'Delete',
        subtitle: parsedInput.path as string | undefined,
      };
    case 'create_directory':
      return {
        icon: <FileText className="w-3.5 h-3.5 text-cyan-400" />,
        title: 'Mkdir',
        subtitle: parsedInput.path as string | undefined,
      };
    case 'execute_command':
      return {
        icon: <Code className="w-3.5 h-3.5 text-orange-400" />,
        title: 'Shell',
        subtitle: parsedInput.command as string | undefined,
      };
    default:
      return {
        icon: <Code className="w-3.5 h-3.5 text-[var(--forge-text-muted)]" />,
        title: name,
      };
  }
}

// Tool Call Card Component - inspired by OpenCode's BasicTool pattern
function ToolCallCard({ tool }: { tool: ToolCallDisplay }) {
  const [expanded, setExpanded] = useState(false);
  const toolInfo = getToolInfo(tool.name, tool.input);

  const getStatusStyles = () => {
    switch (tool.status) {
      case 'running':
        return { color: 'text-[var(--ember)]', bg: 'bg-[var(--ember)]/10' };
      case 'complete':
        return { color: 'text-green-400', bg: 'bg-green-500/10' };
      case 'error':
        return { color: 'text-red-400', bg: 'bg-red-500/10' };
      default:
        return { color: 'text-[var(--forge-text-muted)]', bg: 'bg-[var(--forge-bg-bench)]' };
    }
  };

  const statusStyles = getStatusStyles();

  return (
    <div className="border border-[var(--forge-border-subtle)] rounded-lg overflow-hidden bg-[var(--forge-bg-base)]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--forge-bg-bench)] transition-colors"
      >
        <ChevronRight
          className={`w-3 h-3 text-[var(--forge-text-muted)] transition-transform flex-shrink-0 ${
            expanded ? 'rotate-90' : ''
          }`}
        />
        {toolInfo.icon}
        <span className="text-[var(--forge-text-primary)] font-medium">{toolInfo.title}</span>
        {toolInfo.subtitle && (
          <span className="text-[var(--forge-text-muted)] truncate max-w-[200px]" title={toolInfo.subtitle}>
            {toolInfo.subtitle}
          </span>
        )}
        <span className={`ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full ${statusStyles.color} ${statusStyles.bg}`}>
          {tool.status === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
          {tool.status === 'running' && 'Running'}
          {tool.status === 'complete' && 'Done'}
          {tool.status === 'error' && 'Failed'}
          {tool.status === 'pending' && 'Pending'}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-[var(--forge-border-subtle)]">
          {tool.input && (
            <div className="px-3 py-2 bg-[var(--forge-bg-bench)]">
              <div className="text-[10px] uppercase tracking-wider text-[var(--forge-text-muted)] mb-1 font-medium">Input</div>
              <pre className="text-xs text-[var(--forge-text-secondary)] overflow-x-auto whitespace-pre-wrap font-mono">
                {tool.input}
              </pre>
            </div>
          )}
          {tool.result && (
            <div className={`px-3 py-2 ${tool.result.success ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
              <div className={`text-[10px] uppercase tracking-wider mb-1 font-medium ${tool.result.success ? 'text-green-400' : 'text-red-400'}`}>
                {tool.result.success ? 'Output' : 'Error'}
              </div>
              <pre className="text-xs text-[var(--forge-text-secondary)] overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">
                {tool.result.success ? tool.result.output : tool.result.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AgentPanel;
