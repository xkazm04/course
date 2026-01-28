/**
 * Code Viewer Component
 *
 * Simple code viewer with syntax highlighting styling.
 * Displays file content with line numbers.
 */

'use client';

import React from 'react';
import { FileCode, Copy, Check, X } from 'lucide-react';
import { useState, useCallback } from 'react';

export interface CodeViewerProps {
  content: string;
  filename: string;
  language?: string;
  onClose?: () => void;
  className?: string;
}

const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    py: 'python',
    go: 'go',
    rs: 'rust',
    java: 'java',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    md: 'markdown',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
  };
  return langMap[ext || ''] || 'text';
};

export function CodeViewer({
  content,
  filename,
  language,
  onClose,
  className = '',
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const lang = language || getLanguageFromFilename(filename);
  const lines = content.split('\n');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  }, [content]);

  return (
    <div className={`flex flex-col h-full bg-[var(--forge-bg-base)] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-[var(--forge-text-primary)] truncate">
            {filename}
          </span>
          <span className="text-xs text-[var(--forge-text-muted)] px-1.5 py-0.5 bg-[var(--forge-bg-bench)] rounded">
            {lang}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] rounded transition-colors"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Code content */}
      <div className="flex-1 overflow-auto">
        <div className="flex text-sm font-mono">
          {/* Line numbers */}
          <div className="flex-shrink-0 py-4 px-2 text-right select-none border-r border-[var(--forge-border-subtle)] bg-[var(--forge-bg-bench)]">
            {lines.map((_, index) => (
              <div
                key={index}
                className="text-[var(--forge-text-muted)] text-xs leading-6"
              >
                {index + 1}
              </div>
            ))}
          </div>

          {/* Code */}
          <pre className="flex-1 p-4 overflow-x-auto">
            <code className="text-[var(--forge-text-secondary)] leading-6">
              {lines.map((line, index) => (
                <div key={index} className="whitespace-pre">
                  {line || ' '}
                </div>
              ))}
            </code>
          </pre>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[var(--forge-border-subtle)] text-xs text-[var(--forge-text-muted)] bg-[var(--forge-bg-elevated)]">
        {lines.length} lines · {content.length} characters
      </div>
    </div>
  );
}

export default CodeViewer;
