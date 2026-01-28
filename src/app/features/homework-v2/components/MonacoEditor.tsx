/**
 * Monaco Editor Component
 *
 * Full-featured code editor using Monaco Editor (VS Code's editor).
 * Supports syntax highlighting, IntelliSense, and editing.
 */

'use client';

import React, { useCallback, useState } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { FileCode, Save, RotateCcw, Copy, Check, X, Loader2 } from 'lucide-react';

export interface MonacoEditorProps {
  content: string;
  filename: string;
  language?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
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
    sh: 'shell',
    bash: 'shell',
    dockerfile: 'dockerfile',
    xml: 'xml',
    toml: 'ini',
  };
  return langMap[ext || ''] || 'plaintext';
};

export function MonacoEditor({
  content,
  filename,
  language,
  readOnly = false,
  onChange,
  onSave,
  onClose,
  className = '',
}: MonacoEditorProps) {
  const [currentContent, setCurrentContent] = useState(content);
  const [isDirty, setIsDirty] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const lang = language || getLanguageFromFilename(filename);
  const lineCount = currentContent.split('\n').length;

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    // Configure editor keybindings
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });

    // Configure TypeScript/JavaScript defaults
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
    });
  }, []);

  const handleChange: OnChange = useCallback(
    (value) => {
      const newValue = value || '';
      setCurrentContent(newValue);
      setIsDirty(newValue !== content);
      onChange?.(newValue);
    },
    [content, onChange]
  );

  const handleSave = useCallback(async () => {
    if (!onSave || !isDirty) return;
    setIsSaving(true);
    try {
      await onSave(currentContent);
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  }, [currentContent, isDirty, onSave]);

  const handleReset = useCallback(() => {
    setCurrentContent(content);
    setIsDirty(false);
    onChange?.(content);
  }, [content, onChange]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.error('Failed to copy');
    }
  }, [currentContent]);

  return (
    <div className={`flex flex-col h-full bg-[var(--forge-bg-base)] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-[var(--forge-text-primary)] truncate">
            {filename}
          </span>
          {isDirty && (
            <span className="w-2 h-2 rounded-full bg-[var(--ember)]" title="Unsaved changes" />
          )}
          <span className="text-xs text-[var(--forge-text-muted)] px-1.5 py-0.5 bg-[var(--forge-bg-bench)] rounded">
            {lang}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!readOnly && isDirty && (
            <>
              <button
                onClick={handleReset}
                className="p-1.5 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-bench)] rounded transition-colors"
                title="Reset changes"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-[var(--ember)] hover:bg-[var(--ember)]/10 rounded transition-colors disabled:opacity-50"
                title="Save (Ctrl+S)"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save
              </button>
            </>
          )}
          <button
            onClick={handleCopy}
            className="p-1.5 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-bench)] rounded transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-bench)] rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={lang}
          value={currentContent}
          onChange={handleChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            readOnly,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderLineHighlight: 'line',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
            folding: true,
            wordWrap: 'off',
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
          }}
          loading={
            <div className="flex items-center justify-center h-full text-[var(--forge-text-muted)]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading editor...
            </div>
          }
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-[var(--forge-border-subtle)] text-xs text-[var(--forge-text-muted)] bg-[var(--forge-bg-elevated)]">
        <div className="flex items-center gap-3">
          <span>Ln {lineCount}</span>
          <span>{currentContent.length} chars</span>
        </div>
        <div className="flex items-center gap-2">
          {readOnly && (
            <span className="px-1.5 py-0.5 bg-[var(--forge-bg-bench)] rounded text-[10px] uppercase">
              Read Only
            </span>
          )}
          <span>{lang}</span>
        </div>
      </div>
    </div>
  );
}

export default MonacoEditor;
