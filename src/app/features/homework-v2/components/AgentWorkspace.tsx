/**
 * Agent Workspace
 *
 * Unified workspace with:
 * - Left sidebar: File Explorer
 * - Top right: Code Editor (Monaco)
 * - Bottom right: Agent Chat Panel
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  PanelLeftClose,
  PanelLeftOpen,
  GripVertical,
  GripHorizontal,
  Cpu,
} from 'lucide-react';
import { AgentPanel } from './AgentPanel';
import { FileExplorer, FileNode } from './FileExplorer';
import { MonacoEditor } from './MonacoEditor';

export interface AgentWorkspaceProps {
  projectId?: string;
  className?: string;
}

const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 400;
const DEFAULT_SIDEBAR_WIDTH = 240;
const MIN_PANEL_HEIGHT = 150;
const DEFAULT_EDITOR_PERCENT = 50; // 50% for editor, 50% for chat

export function AgentWorkspace({
  projectId = 'default',
  className = '',
}: AgentWorkspaceProps) {
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [editorHeightPercent, setEditorHeightPercent] = useState(DEFAULT_EDITOR_PERCENT);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const isDraggingLeft = useRef(false);
  const isDraggingVertical = useRef(false);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: FileNode) => {
      setSelectedFile(file);

      if (file.content !== undefined) {
        setFileContent(file.content);
      } else {
        try {
          const response = await fetch('/api/agent/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, path: file.path }),
          });
          if (response.ok) {
            const data = await response.json();
            setFileContent(data.content);
          }
        } catch (error) {
          console.error('Failed to fetch file content:', error);
        }
      }
    },
    [projectId]
  );

  // Refresh file explorer when agent creates files
  const handleFilesChanged = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Resizable panel handling
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    if (isDraggingLeft.current) {
      const newWidth = e.clientX - containerRect.left;
      setLeftPanelWidth(Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, newWidth)));
    }

    if (isDraggingVertical.current && mainContentRef.current) {
      const mainRect = mainContentRef.current.getBoundingClientRect();
      const relativeY = e.clientY - mainRect.top;
      const percent = (relativeY / mainRect.height) * 100;
      const minPercent = (MIN_PANEL_HEIGHT / mainRect.height) * 100;
      const maxPercent = 100 - minPercent;
      setEditorHeightPercent(Math.max(minPercent, Math.min(maxPercent, percent)));
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingLeft.current = false;
    isDraggingVertical.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const startDraggingLeft = () => {
    isDraggingLeft.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const startDraggingVertical = () => {
    isDraggingVertical.current = true;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div ref={containerRef} className={`flex flex-col h-full bg-[var(--forge-bg-base)] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--ember)]/10 text-[var(--ember)] border border-[var(--ember)]/30">
            <Cpu className="w-4 h-4" />
            <span className="text-sm font-medium">AI Agent</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--forge-text-muted)]">
          <span>Project: {projectId}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar - File Explorer */}
        {showLeftPanel && (
          <>
            <motion.div
              initial={{ width: leftPanelWidth }}
              animate={{ width: leftPanelWidth }}
              transition={{ duration: 0.1 }}
              className="flex-shrink-0 border-r border-[var(--forge-border-subtle)]"
              style={{ width: leftPanelWidth }}
            >
              <FileExplorer
                projectId={projectId}
                onFileSelect={handleFileSelect}
                selectedPath={selectedFile?.path}
                refreshTrigger={refreshTrigger}
                className="h-full"
              />
            </motion.div>

            {/* Left resize handle */}
            <div
              onMouseDown={startDraggingLeft}
              className="w-1 flex-shrink-0 bg-transparent hover:bg-[var(--ember)]/50 cursor-col-resize transition-colors group flex items-center justify-center"
            >
              <GripVertical className="w-3 h-3 text-[var(--forge-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </>
        )}

        {/* Right side - Editor and Chat */}
        <div ref={mainContentRef} className="flex-1 flex flex-col min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-2 py-1 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]">
            <button
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              className="p-1.5 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-bench)] rounded transition-colors"
              title={showLeftPanel ? 'Hide files' : 'Show files'}
            >
              {showLeftPanel ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeftOpen className="w-4 h-4" />
              )}
            </button>

            <div className="text-xs text-[var(--forge-text-muted)]">
              {selectedFile ? selectedFile.path : 'No file selected'}
            </div>

            <div className="w-8" /> {/* Spacer for alignment */}
          </div>

          {/* Top - Code Editor */}
          <div
            className="border-b border-[var(--forge-border-subtle)] overflow-hidden"
            style={{ height: `${editorHeightPercent}%` }}
          >
            {selectedFile && fileContent !== null ? (
              <MonacoEditor
                content={fileContent}
                filename={selectedFile.name}
                readOnly={true}
                className="h-full"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[var(--forge-text-muted)] bg-[var(--forge-bg-bench)]">
                <div className="text-sm mb-2">No file selected</div>
                <div className="text-xs">Select a file from the explorer or ask the agent to create one</div>
              </div>
            )}
          </div>

          {/* Vertical resize handle */}
          <div
            onMouseDown={startDraggingVertical}
            className="h-1.5 flex-shrink-0 bg-[var(--forge-bg-elevated)] hover:bg-[var(--ember)]/50 cursor-row-resize transition-colors group flex items-center justify-center border-b border-[var(--forge-border-subtle)]"
          >
            <GripHorizontal className="w-4 h-4 text-[var(--forge-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Bottom - Agent Chat */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <AgentPanel
              projectId={projectId}
              onFilesChanged={handleFilesChanged}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentWorkspace;
