'use client';

/**
 * ClaudeCliPanel - Claude Code CLI Terminal Interface
 *
 * A modern terminal interface inspired by OpenCode's layout:
 * - Two-column layout: Main conversation + Right sidebar
 * - Main area: Messages with code outputs and diffs
 * - Sidebar: Session info, context, tool progress, modified files
 * - High readability with proper spacing and visual hierarchy
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  ChevronDown,
  ChevronRight,
  Sparkles,
  FileText,
  FolderOpen,
  Search,
  Globe,
  Check,
  X,
  Loader2,
  Send,
  Zap,
  Edit3,
  Clock,
  Cpu,
  FileCode,
  ChevronUp,
  Minus,
  Plus,
} from 'lucide-react';
import type { ClaudeSession, ClaudeMessage } from '../lib/types';

export interface ClaudeCliPanelProps {
  session: ClaudeSession;
  onPromptSubmit?: (prompt: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  showThinkingBlocks?: boolean;
  showToolCalls?: boolean;
  className?: string;
}

// ============================================================================
// Tool Configuration
// ============================================================================

const TOOL_CONFIG: Record<
  string,
  { icon: React.ReactNode; prefix: string; color: string }
> = {
  Read: { icon: <FileText className="w-3.5 h-3.5" />, prefix: '→', color: 'text-blue-400' },
  Write: { icon: <Edit3 className="w-3.5 h-3.5" />, prefix: '←', color: 'text-emerald-400' },
  Edit: { icon: <Edit3 className="w-3.5 h-3.5" />, prefix: '←', color: 'text-amber-400' },
  Bash: { icon: <Terminal className="w-3.5 h-3.5" />, prefix: '$', color: 'text-purple-400' },
  Glob: { icon: <FolderOpen className="w-3.5 h-3.5" />, prefix: '✱', color: 'text-cyan-400' },
  Grep: { icon: <Search className="w-3.5 h-3.5" />, prefix: '✱', color: 'text-orange-400' },
  WebFetch: { icon: <Globe className="w-3.5 h-3.5" />, prefix: '%', color: 'text-pink-400' },
  WebSearch: { icon: <Globe className="w-3.5 h-3.5" />, prefix: '◈', color: 'text-indigo-400' },
  Task: { icon: <Zap className="w-3.5 h-3.5" />, prefix: '◉', color: 'text-yellow-400' },
  default: { icon: <Cpu className="w-3.5 h-3.5" />, prefix: '⚙', color: 'text-[var(--forge-text-muted)]' },
};

// ============================================================================
// Main Component
// ============================================================================

export function ClaudeCliPanel({
  session,
  onPromptSubmit,
  showThinkingBlocks = true,
  showToolCalls = true,
  className = '',
}: ClaudeCliPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Filter messages based on settings
  const visibleMessages = useMemo(() => {
    return session.messages.filter((msg) => {
      if (msg.type === 'thinking' && !showThinkingBlocks) return false;
      if ((msg.type === 'tool_use' || msg.type === 'tool_result') && !showToolCalls) return false;
      return true;
    });
  }, [session.messages, showThinkingBlocks, showToolCalls]);

  // Extract metadata for sidebar
  const metadata = useMemo(() => {
    const tools = session.messages.filter(m => m.type === 'tool_use' || m.type === 'tool_result');
    const completedTools = tools.filter(m => m.type === 'tool_result').length;
    const pendingTools = tools.filter(m => m.type === 'tool_use').length - completedTools;

    // Extract modified files from tool results
    const modifiedFiles: { path: string; additions: number; deletions: number }[] = [];
    session.messages.forEach(msg => {
      if (msg.type === 'tool_result' && msg.toolName && ['Write', 'Edit'].includes(msg.toolName)) {
        const pathMatch = msg.content.match(/(?:wrote to|edited|created)\s+([^\s]+)/i);
        if (pathMatch) {
          modifiedFiles.push({ path: pathMatch[1], additions: 5, deletions: 2 });
        }
      }
    });

    return {
      tokensUsed: 12500,
      tokensLimit: 200000,
      costSpent: 0.024,
      completedTools,
      pendingTools,
      modifiedFiles,
    };
  }, [session.messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && onPromptSubmit) {
      onPromptSubmit(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isRunning = session.status === 'running';

  return (
    <div className={`flex flex-col h-full bg-[var(--forge-bg-elevated)]/90 backdrop-blur-md rounded-xl border border-[var(--forge-border-subtle)] overflow-hidden ${className}`}>
      {/* Two-column layout */}
      <div className="flex-1 flex min-h-0">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header - shown when sidebar is collapsed */}
          {sidebarCollapsed && (
            <header className="flex items-center justify-between px-4 py-2 border-b border-[var(--forge-border-subtle)]">
              <SessionTitle />
              <ContextBadge tokens={metadata.tokensUsed} limit={metadata.tokensLimit} cost={metadata.costSpent} />
            </header>
          )}

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="py-4">
              {visibleMessages.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-1">
                  {visibleMessages.map((message, index) => (
                    <MessageRow
                      key={message.id}
                      message={message}
                      isLast={index === visibleMessages.length - 1}
                      isRunning={isRunning}
                    />
                  ))}

                  {/* Active indicator */}
                  {isRunning && (
                    <div className="flex items-center gap-2 px-4 py-2">
                      <div className="w-0.5 h-4 bg-[var(--ember)] animate-pulse" />
                      <Loader2 className="w-3.5 h-3.5 text-[var(--ember)] animate-spin" />
                      <span className="text-xs text-[var(--forge-text-muted)]">Claude is working...</span>
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <PromptInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            onKeyDown={handleKeyDown}
            inputRef={inputRef}
            disabled={isRunning}
            status={session.status}
          />

          {/* Footer */}
          <footer className="flex items-center justify-between px-4 py-2 border-t border-[var(--forge-border-subtle)] text-[10px] text-[var(--forge-text-muted)]">
            <span>/homework/dark-mode-toggle</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Claude Sonnet
              </span>
              <span>• OpenForge v1.0</span>
            </div>
          </footer>
        </div>

        {/* Right Sidebar */}
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-[var(--forge-border-subtle)] bg-[var(--forge-bg-bench)]/30 overflow-hidden"
            >
              <StatusSidebar
                session={session}
                metadata={metadata}
                onCollapse={() => setSidebarCollapsed(true)}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Sidebar toggle when collapsed */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="absolute right-4 top-4 p-1.5 rounded-lg bg-[var(--forge-bg-bench)] border border-[var(--forge-border-subtle)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] transition-colors"
          >
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Session Title
// ============================================================================

function SessionTitle() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--ember)] to-orange-600 flex items-center justify-center">
        <Terminal className="w-3 h-3 text-white" />
      </div>
      <span className="text-sm font-medium text-[var(--forge-text-primary)]">Dark Mode Toggle</span>
    </div>
  );
}

// ============================================================================
// Context Badge
// ============================================================================

function ContextBadge({ tokens, limit, cost }: { tokens: number; limit: number; cost: number }) {
  const percentage = Math.round((tokens / limit) * 100);
  return (
    <div className="flex items-center gap-3 text-xs text-[var(--forge-text-muted)]">
      <span>{(tokens / 1000).toFixed(1)}k tokens ({percentage}%)</span>
      <span>${cost.toFixed(3)}</span>
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-xl bg-[var(--forge-bg-bench)] flex items-center justify-center mb-4">
        <Sparkles className="w-6 h-6 text-[var(--ember)]/60" />
      </div>
      <h3 className="text-sm font-medium text-[var(--forge-text-primary)] mb-1">Ready to assist</h3>
      <p className="text-xs text-[var(--forge-text-muted)] max-w-[280px]">
        Ask Claude to help with your coding task. It can read files, write code, run commands, and more.
      </p>
    </div>
  );
}

// ============================================================================
// Message Row
// ============================================================================

interface MessageRowProps {
  message: ClaudeMessage;
  isLast: boolean;
  isRunning: boolean;
}

function MessageRow({ message, isLast, isRunning }: MessageRowProps) {
  const isStreaming = isLast && isRunning && message.type === 'assistant';

  switch (message.type) {
    case 'user':
      return <UserMessage content={message.content} timestamp={message.timestamp} />;
    case 'assistant':
      return <AssistantMessage content={message.content} isStreaming={isStreaming} />;
    case 'thinking':
      return <ThinkingBlock content={message.content} />;
    case 'tool_use':
      return <ToolUseMessage toolName={message.toolName || 'Tool'} content={message.content} />;
    case 'tool_result':
      return <ToolResultMessage toolName={message.toolName || 'Tool'} content={message.content} />;
    case 'error':
      return <ErrorMessage content={message.content} />;
    case 'system':
      return <SystemMessage content={message.content} />;
    default:
      return null;
  }
}

// ============================================================================
// User Message
// ============================================================================

function UserMessage({ content, timestamp }: { content: string; timestamp?: Date }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        {/* Left border accent */}
        <div className="w-0.5 self-stretch bg-blue-400/50 rounded-full" />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-blue-400">You</span>
            {timestamp && (
              <span className="text-[10px] text-[var(--forge-text-muted)]">
                {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {/* Content */}
          <p className="text-sm text-[var(--forge-text-primary)] leading-relaxed whitespace-pre-wrap">
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Assistant Message
// ============================================================================

function AssistantMessage({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        {/* Left border accent */}
        <div className="w-0.5 self-stretch bg-[var(--ember)]/50 rounded-full" />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-[var(--ember)]">Claude</span>
          </div>

          {/* Content */}
          <div className="text-sm text-[var(--forge-text-primary)] leading-relaxed whitespace-pre-wrap">
            {content}
            {isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-2 h-4 ml-0.5 bg-[var(--ember)] align-middle"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Thinking Block
// ============================================================================

function ThinkingBlock({ content }: { content: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="px-4 py-2">
      <div className="flex items-start gap-3">
        {/* Left border */}
        <div className="w-0.5 self-stretch bg-purple-400/30 rounded-full" />

        <div className="flex-1 min-w-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-purple-400/80 hover:text-purple-400 transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            <Sparkles className="w-3 h-3" />
            <span className="text-xs italic">Thinking...</span>
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="mt-2 text-xs text-purple-300/50 leading-relaxed whitespace-pre-wrap pl-5 border-l border-purple-500/20">
                  {content}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Tool Use Message (Inline - Running)
// ============================================================================

function ToolUseMessage({ toolName, content }: { toolName: string; content: string }) {
  const config = TOOL_CONFIG[toolName] || TOOL_CONFIG.default;

  return (
    <div className="px-4 py-1.5">
      <div className="flex items-center gap-3">
        <div className="w-0.5 h-4 bg-[var(--forge-border-subtle)]" />
        <div className={`flex items-center gap-2 ${config.color}`}>
          <span className="text-xs opacity-60">~</span>
          <span className="text-xs font-mono">{config.prefix} {toolName}</span>
          <span className="text-xs text-[var(--forge-text-muted)] truncate max-w-[300px]">{content}</span>
          <Loader2 className="w-3 h-3 animate-spin opacity-60" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Tool Result Message (Block - Completed)
// ============================================================================

function ToolResultMessage({ toolName, content }: { toolName: string; content: string }) {
  const config = TOOL_CONFIG[toolName] || TOOL_CONFIG.default;
  const [isExpanded, setIsExpanded] = useState(true);
  const isSuccess = !content.toLowerCase().includes('error');
  const isCodeOutput = toolName === 'Read' || toolName === 'Write' || toolName === 'Edit';

  return (
    <div className="px-4 py-2">
      <div className="flex items-start gap-3">
        {/* Left border with status color */}
        <div className={`w-0.5 self-stretch rounded-full ${isSuccess ? 'bg-emerald-400/50' : 'bg-red-400/50'}`} />

        <div className="flex-1 min-w-0">
          {/* Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 w-full text-left group"
          >
            <span className={`text-xs ${config.color}`}>{config.prefix}</span>
            <span className={`text-xs font-medium ${config.color}`}>{toolName}</span>
            {toolName === 'Glob' || toolName === 'Grep' ? (
              <span className="text-[10px] text-[var(--forge-text-muted)]">
                ({content.split('\n').length} matches)
              </span>
            ) : null}
            <span className="ml-auto text-[var(--forge-text-muted)]">
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </span>
          </button>

          {/* Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                {isCodeOutput ? (
                  <CodeBlock content={content} />
                ) : (
                  <pre className="mt-2 text-xs text-[var(--forge-text-secondary)] font-mono whitespace-pre-wrap leading-relaxed bg-[var(--forge-bg-bench)]/30 rounded-lg p-3 border border-[var(--forge-border-subtle)]">
                    {content}
                  </pre>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Code Block with Line Numbers
// ============================================================================

function CodeBlock({ content }: { content: string }) {
  const lines = content.split('\n');

  return (
    <div className="mt-2 rounded-lg overflow-hidden border border-[var(--forge-border-subtle)] bg-[var(--forge-bg-bench)]/50">
      <div className="flex text-xs font-mono">
        {/* Line numbers */}
        <div className="flex-shrink-0 py-2 px-2 bg-[var(--forge-bg-bench)]/50 text-right select-none border-r border-[var(--forge-border-subtle)]">
          {lines.map((_, i) => (
            <div key={i} className="text-[var(--forge-text-muted)] leading-5">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code content */}
        <div className="flex-1 py-2 px-3 overflow-x-auto">
          <pre className="text-[var(--forge-text-primary)] leading-5 whitespace-pre">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Error Message
// ============================================================================

function ErrorMessage({ content }: { content: string }) {
  return (
    <div className="px-4 py-2">
      <div className="flex items-start gap-3">
        <div className="w-0.5 self-stretch bg-red-400/50 rounded-full" />
        <div className="flex-1 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400 leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// System Message
// ============================================================================

function SystemMessage({ content }: { content: string }) {
  return (
    <div className="px-4 py-2 text-center">
      <span className="text-[10px] text-[var(--forge-text-muted)] italic">{content}</span>
    </div>
  );
}

// ============================================================================
// Prompt Input
// ============================================================================

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  disabled?: boolean;
  status: ClaudeSession['status'];
}

function PromptInput({ value, onChange, onSubmit, onKeyDown, inputRef, disabled, status }: PromptInputProps) {
  return (
    <form onSubmit={onSubmit} className="border-t border-[var(--forge-border-subtle)]">
      <div className="p-3">
        <div className="flex items-start gap-3">
          {/* Left border matching message style */}
          <div className="w-0.5 self-stretch bg-[var(--forge-border-subtle)] rounded-full" />

          <div className="flex-1 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={disabled ? 'Claude is working...' : 'Enter your message...'}
              disabled={disabled}
              rows={1}
              className="flex-1 bg-transparent text-sm text-[var(--forge-text-primary)] placeholder:text-[var(--forge-text-muted)] outline-none resize-none disabled:opacity-50 min-h-[24px] max-h-[120px] leading-relaxed"
              style={{ height: 'auto', overflow: 'hidden' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />

            <button
              type="submit"
              disabled={!value.trim() || disabled}
              className="p-2 rounded-lg bg-[var(--ember)] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--ember)]/90 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

// ============================================================================
// Status Sidebar
// ============================================================================

interface StatusSidebarProps {
  session: ClaudeSession;
  metadata: {
    tokensUsed: number;
    tokensLimit: number;
    costSpent: number;
    completedTools: number;
    pendingTools: number;
    modifiedFiles: { path: string; additions: number; deletions: number }[];
  };
  onCollapse: () => void;
}

function StatusSidebar({ session, metadata, onCollapse }: StatusSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--forge-border-subtle)]">
        <div className="flex items-center justify-between">
          <SessionTitle />
          <button
            onClick={onCollapse}
            className="p-1 rounded hover:bg-[var(--forge-bg-bench)] text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Context Section */}
        <SidebarSection title="Context" defaultOpen>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--forge-text-muted)]">Tokens</span>
              <span className="text-[var(--forge-text-primary)]">
                {(metadata.tokensUsed / 1000).toFixed(1)}k / {(metadata.tokensLimit / 1000).toFixed(0)}k
              </span>
            </div>
            <div className="h-1.5 bg-[var(--forge-bg-bench)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--ember)] rounded-full"
                style={{ width: `${(metadata.tokensUsed / metadata.tokensLimit) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--forge-text-muted)]">Cost</span>
              <span className="text-emerald-400">${metadata.costSpent.toFixed(3)}</span>
            </div>
          </div>
        </SidebarSection>

        {/* Tools Progress */}
        <SidebarSection title="Tools" badge={metadata.completedTools + metadata.pendingTools} defaultOpen>
          <div className="space-y-1.5">
            {metadata.completedTools > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-[var(--forge-text-muted)]">{metadata.completedTools} completed</span>
              </div>
            )}
            {metadata.pendingTools > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                <span className="text-[var(--forge-text-muted)]">{metadata.pendingTools} running</span>
              </div>
            )}
          </div>
        </SidebarSection>

        {/* Modified Files */}
        {metadata.modifiedFiles.length > 0 && (
          <SidebarSection title="Modified Files" badge={metadata.modifiedFiles.length}>
            <div className="space-y-1">
              {metadata.modifiedFiles.map((file, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-[var(--forge-text-secondary)] truncate font-mono">
                    {file.path.split('/').pop()}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-emerald-400">+{file.additions}</span>
                    <span className="text-red-400">-{file.deletions}</span>
                  </div>
                </div>
              ))}
            </div>
          </SidebarSection>
        )}

        {/* Status */}
        <SidebarSection title="Status">
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${
              session.status === 'running' ? 'bg-emerald-400 animate-pulse' :
              session.status === 'completed' ? 'bg-blue-400' :
              session.status === 'error' ? 'bg-red-400' :
              'bg-[var(--forge-text-muted)]'
            }`} />
            <span className="text-[var(--forge-text-secondary)] capitalize">{session.status}</span>
          </div>
        </SidebarSection>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[var(--forge-border-subtle)]">
        <div className="flex items-center justify-between text-[10px] text-[var(--forge-text-muted)]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Started {session.startedAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sidebar Section
// ============================================================================

interface SidebarSectionProps {
  title: string;
  badge?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function SidebarSection({ title, badge, defaultOpen = false, children }: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="px-4 py-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left mb-2"
      >
        <span className="text-xs font-medium text-[var(--forge-text-primary)]">{title}</span>
        <div className="flex items-center gap-2">
          {badge !== undefined && (
            <span className="text-[10px] text-[var(--forge-text-muted)]">{badge}</span>
          )}
          <span className="text-[var(--forge-text-muted)]">
            {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ClaudeCliPanel;
