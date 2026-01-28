/**
 * File Explorer Component
 *
 * Displays files in the virtual filesystem with a tree view.
 * Allows viewing and selecting files created by the agent.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  File,
  ChevronRight,
  RefreshCw,
  Plus,
  Trash2,
} from 'lucide-react';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  size?: number;
}

export interface FileExplorerProps {
  projectId: string;
  onFileSelect?: (file: FileNode) => void;
  selectedPath?: string;
  className?: string;
  refreshTrigger?: number; // Increment to trigger refresh
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'py':
    case 'go':
    case 'rs':
    case 'java':
    case 'c':
    case 'cpp':
    case 'h':
      return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'md':
    case 'txt':
    case 'json':
    case 'yaml':
    case 'yml':
      return <FileText className="w-4 h-4 text-green-400" />;
    default:
      return <File className="w-4 h-4 text-[var(--forge-text-muted)]" />;
  }
};

interface TreeItemProps {
  node: FileNode;
  depth: number;
  onSelect: (node: FileNode) => void;
  selectedPath?: string;
  expandedPaths: Set<string>;
  toggleExpanded: (path: string) => void;
}

function TreeItem({
  node,
  depth,
  onSelect,
  selectedPath,
  expandedPaths,
  toggleExpanded,
}: TreeItemProps) {
  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;
  const isDirectory = node.type === 'directory';

  const handleClick = () => {
    if (isDirectory) {
      toggleExpanded(node.path);
    } else {
      onSelect(node);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
          isSelected
            ? 'bg-[var(--ember)]/10 text-[var(--ember)]'
            : 'text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-bench)]'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isDirectory && (
          <ChevronRight
            className={`w-3 h-3 text-[var(--forge-text-muted)] transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        )}
        {!isDirectory && <span className="w-3" />}
        {isDirectory ? (
          isExpanded ? (
            <FolderOpen className="w-4 h-4 text-yellow-400" />
          ) : (
            <Folder className="w-4 h-4 text-yellow-400" />
          )
        ) : (
          getFileIcon(node.name)
        )}
        <span className="truncate">{node.name}</span>
        {!isDirectory && node.size !== undefined && (
          <span className="ml-auto text-xs text-[var(--forge-text-muted)]">
            {formatFileSize(node.size)}
          </span>
        )}
      </button>
      <AnimatePresence>
        {isDirectory && isExpanded && node.children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {node.children.map((child) => (
              <TreeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                onSelect={onSelect}
                selectedPath={selectedPath}
                expandedPaths={expandedPaths}
                toggleExpanded={toggleExpanded}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function FileExplorer({
  projectId,
  onFileSelect,
  selectedPath,
  className = '',
  refreshTrigger = 0,
}: FileExplorerProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/']));

  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch files from virtual filesystem via API
      const response = await fetch(`/api/agent/files?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Fetch on mount and when projectId changes
  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchFiles();
    }
  }, [refreshTrigger, fetchFiles]);

  const toggleExpanded = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (node: FileNode) => {
      onFileSelect?.(node);
    },
    [onFileSelect]
  );

  return (
    <div className={`flex flex-col h-full bg-[var(--forge-bg-base)] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--forge-border-subtle)] bg-[var(--forge-bg-elevated)]">
        <span className="text-xs font-medium text-[var(--forge-text-muted)] uppercase tracking-wide">
          Files
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={fetchFiles}
            disabled={isLoading}
            className="p-1 text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] rounded transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {files.length === 0 && !isLoading ? (
          <div className="px-3 py-4 text-center">
            <Folder className="w-8 h-8 text-[var(--forge-text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--forge-text-muted)]">No files yet</p>
            <p className="text-xs text-[var(--forge-text-muted)] mt-1">
              Files created by the agent will appear here
            </p>
          </div>
        ) : (
          files.map((node) => (
            <TreeItem
              key={node.path}
              node={node}
              depth={0}
              onSelect={handleSelect}
              selectedPath={selectedPath}
              expandedPaths={expandedPaths}
              toggleExpanded={toggleExpanded}
            />
          ))
        )}
      </div>

      {/* Footer with stats */}
      {files.length > 0 && (
        <div className="px-3 py-2 border-t border-[var(--forge-border-subtle)] text-xs text-[var(--forge-text-muted)]">
          {countFiles(files)} files
        </div>
      )}
    </div>
  );
}

function countFiles(nodes: FileNode[]): number {
  let count = 0;
  for (const node of nodes) {
    if (node.type === 'file') {
      count++;
    } else if (node.children) {
      count += countFiles(node.children);
    }
  }
  return count;
}

export default FileExplorer;
