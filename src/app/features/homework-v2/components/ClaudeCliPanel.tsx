'use client';

/**
 * ClaudeCliPanel - Claude Code CLI Terminal Interface
 *
 * A terminal-style component that displays Claude Code CLI output with
 * streaming simulation, thinking blocks, and tool call visualization.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  Play,
  Pause,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Wrench,
  MessageSquare,
  AlertCircle,
  User,
  Bot,
  Send,
} from 'lucide-react';
import type {
  ClaudeSession,
  ClaudeMessage,
} from '../lib/types';

export interface ClaudeCliPanelProps {
  session: ClaudeSession;
  onPromptSubmit?: (prompt: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  showThinkingBlocks?: boolean;
  showToolCalls?: boolean;
  className?: string;
}

// Message type icons
const MESSAGE_ICONS: Record<string, React.ReactNode> = {
  system: <Terminal className="w-3.5 h-3.5" />,
  user: <User className="w-3.5 h-3.5" />,
  assistant: <Bot className="w-3.5 h-3.5" />,
  thinking: <Sparkles className="w-3.5 h-3.5" />,
  tool_use: <Wrench className="w-3.5 h-3.5" />,
  tool_result: <MessageSquare className="w-3.5 h-3.5" />,
  error: <AlertCircle className="w-3.5 h-3.5" />,
};

// Message type colors
const MESSAGE_COLORS: Record<string, string> = {
  system: 'text-[var(--forge-text-muted)]',
  user: 'text-blue-400',
  assistant: 'text-emerald-400',
  thinking: 'text-purple-400',
  tool_use: 'text-amber-400',
  tool_result: 'text-cyan-400',
  error: 'text-red-400',
};

export function ClaudeCliPanel({
  session,
  onPromptSubmit,
  onPause,
  onResume,
  showThinkingBlocks = true,
  showToolCalls = true,
  className = '',
}: ClaudeCliPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter messages based on settings
  const visibleMessages = session.messages.filter((msg) => {
    if (msg.type === 'thinking' && !showThinkingBlocks) return false;
    if ((msg.type === 'tool_use' || msg.type === 'tool_result') && !showToolCalls)
      return false;
    return true;
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages, streamingText]);

  // Typewriter effect simulation
  useEffect(() => {
    if (session.status !== 'running') return;

    const lastMessage = visibleMessages[visibleMessages.length - 1];
    if (!lastMessage || lastMessage.type === 'user') return;

    setIsStreaming(true);
    let charIndex = 0;
    const content = lastMessage.content;

    const interval = setInterval(() => {
      if (charIndex < content.length) {
        setStreamingText(content.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setIsStreaming(false);
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [session.status, visibleMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && onPromptSubmit) {
      onPromptSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  const isPaused = session.status === 'paused';
  const isRunning = session.status === 'running';

  return (
    <div
      className={`flex flex-col h-full bg-[var(--forge-bg-elevated)]/80 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--forge-border-subtle)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[var(--ember)]" />
            <span className="text-sm font-medium text-[var(--forge-text-primary)]">
              Claude Code
            </span>
          </div>
          <StatusBadge status={session.status} />
        </div>

        <div className="flex items-center gap-2">
          {isRunning && onPause && (
            <button
              onClick={onPause}
              className="p-1.5 rounded-lg hover:bg-[var(--forge-bg-bench)]/60 text-[var(--forge-text-secondary)] transition-colors"
              title="Pause execution"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          {isPaused && onResume && (
            <button
              onClick={onResume}
              className="p-1.5 rounded-lg hover:bg-[var(--forge-bg-bench)]/60 text-[var(--ember)] transition-colors"
              title="Resume execution"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm">
        <AnimatePresence mode="popLayout">
          {visibleMessages.map((message, index) => (
            <MessageBlock
              key={message.id}
              message={message}
              isLast={index === visibleMessages.length - 1}
              streamingText={
                index === visibleMessages.length - 1 && isStreaming
                  ? streamingText
                  : undefined
              }
            />
          ))}
        </AnimatePresence>

        {/* Cursor */}
        {isRunning && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            className="inline-block w-2 h-4 bg-[var(--ember)]"
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-bench)]/30"
      >
        <div className="flex items-center px-4 py-3 gap-3">
          <span className="text-[var(--ember)] font-mono text-sm">$</span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Claude a question..."
            disabled={isRunning}
            className="flex-1 bg-transparent text-[var(--forge-text-primary)] placeholder:text-[var(--forge-text-muted)] font-mono text-sm outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isRunning}
            className="p-2 rounded-lg bg-[var(--ember)] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--ember)]/90 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface StatusBadgeProps {
  status: ClaudeSession['status'];
}

function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<
    ClaudeSession['status'],
    { color: string; bgColor: string; label: string }
  > = {
    idle: { color: 'text-[var(--forge-text-muted)]', bgColor: 'bg-[var(--forge-bg-bench)]', label: 'Idle' },
    running: { color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', label: 'Running' },
    paused: { color: 'text-amber-400', bgColor: 'bg-amber-500/10', label: 'Paused' },
    completed: { color: 'text-blue-400', bgColor: 'bg-blue-500/10', label: 'Completed' },
    error: { color: 'text-red-400', bgColor: 'bg-red-500/10', label: 'Error' },
  };

  const config = statusConfig[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'running' ? 'bg-emerald-400 animate-pulse' :
          status === 'paused' ? 'bg-amber-400' :
          status === 'error' ? 'bg-red-400' :
          'bg-current'
        }`}
      />
      {config.label}
    </span>
  );
}

interface MessageBlockProps {
  message: ClaudeMessage;
  isLast?: boolean;
  streamingText?: string;
}

function MessageBlock({ message, isLast, streamingText }: MessageBlockProps) {
  const [isExpanded, setIsExpanded] = useState(message.type !== 'thinking');

  const icon = MESSAGE_ICONS[message.type];
  const color = MESSAGE_COLORS[message.type];
  const content = streamingText || message.content;

  // Tool use special rendering
  if (message.type === 'tool_use') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 text-amber-400"
      >
        <span className="mt-0.5">{icon}</span>
        <div className="flex-1">
          <span className="text-amber-300 font-medium">{message.toolName}</span>
          <span className="text-[var(--forge-text-muted)] mx-2">→</span>
          <span className="text-[var(--forge-text-secondary)]">{content}</span>
        </div>
      </motion.div>
    );
  }

  // Thinking block - collapsible
  if (message.type === 'thinking') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-purple-500/20 rounded-lg bg-purple-500/5 overflow-hidden"
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-purple-400 hover:bg-purple-500/10 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
          <Sparkles className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Claude is thinking...</span>
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 pb-3"
            >
              <pre className="text-xs text-purple-200/80 whitespace-pre-wrap leading-relaxed">
                {content}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // Standard message
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 ${color}`}
    >
      <span className="mt-0.5">{icon}</span>
      <div className="flex-1">
        <pre className="whitespace-pre-wrap text-[var(--forge-text-primary)] leading-relaxed">
          {content}
        </pre>
      </div>
    </motion.div>
  );
}

export default ClaudeCliPanel;
