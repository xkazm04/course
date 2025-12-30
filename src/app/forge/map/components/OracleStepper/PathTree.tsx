'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Sparkles,
  CircleDot,
  Folder,
  FolderOpen,
  ExternalLink,
  Clock,
  Zap
} from 'lucide-react';
import type { PathNode, OraclePath } from '../../lib/oracleApi';

interface PathTreeProps {
  path: OraclePath;
  onNavigateToNode?: (node: PathNode) => void;
  onAccept?: () => void;
  isAccepting?: boolean;
}

// Build tree structure from flat node array
function buildTree(nodes: PathNode[]): Map<string | null, PathNode[]> {
  const tree = new Map<string | null, PathNode[]>();

  nodes.forEach(node => {
    const parentId = node.parent_id;
    if (!tree.has(parentId)) {
      tree.set(parentId, []);
    }
    tree.get(parentId)!.push(node);
  });

  // Sort children by order
  tree.forEach(children => {
    children.sort((a, b) => a.order - b.order);
  });

  return tree;
}

interface TreeNodeProps {
  node: PathNode;
  tree: Map<string | null, PathNode[]>;
  depth: number;
  onNavigate?: (node: PathNode) => void;
  expandedNodes: Set<string>;
  toggleExpanded: (nodeId: string) => void;
}

function TreeNode({ node, tree, depth, onNavigate, expandedNodes, toggleExpanded }: TreeNodeProps) {
  const children = tree.get(node.id) || [];
  const hasChildren = children.length > 0;
  const isExpanded = expandedNodes.has(node.id);

  const levelColors = {
    0: { bg: 'bg-[var(--ember)]/10', text: 'text-[var(--ember)]', icon: 'text-[var(--ember)]' },
    1: { bg: 'bg-[var(--forge-info)]/10', text: 'text-[var(--forge-info)]', icon: 'text-[var(--forge-info)]' },
    2: { bg: 'bg-[var(--forge-success)]/10', text: 'text-[var(--forge-success)]', icon: 'text-[var(--forge-success)]' },
  };

  const colors = levelColors[node.level as keyof typeof levelColors] || levelColors[2];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: depth * 0.05 }}
        className="group"
      >
        <button
          onClick={() => hasChildren && toggleExpanded(node.id)}
          className={`
            w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left
            transition-colors duration-150
            hover:bg-[var(--forge-bg-elevated)]
          `}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {/* Expand/collapse icon */}
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown size={14} className="flex-shrink-0 text-[var(--forge-text-muted)]" />
            ) : (
              <ChevronRight size={14} className="flex-shrink-0 text-[var(--forge-text-muted)]" />
            )
          ) : (
            <span className="w-3.5" />
          )}

          {/* Folder icon */}
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen size={14} className={`flex-shrink-0 ${colors.icon}`} />
            ) : (
              <Folder size={14} className={`flex-shrink-0 ${colors.icon}`} />
            )
          ) : (
            <CircleDot size={14} className={`flex-shrink-0 ${colors.icon}`} />
          )}

          {/* Node name */}
          <span className="flex-1 truncate text-sm text-[var(--forge-text-primary)]">
            {node.name}
          </span>

          {/* New/Existing badge */}
          {node.is_existing ? (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--forge-success)]/20 text-[var(--forge-success)]">
              exists
            </span>
          ) : (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--ember)]/20 text-[var(--ember)] flex items-center gap-1">
              <Sparkles size={10} />
              new
            </span>
          )}

          {/* Navigate button (on hover) */}
          {onNavigate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(node);
              }}
              className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--forge-bg-workshop)] transition-all"
              title="Navigate to this level"
            >
              <ExternalLink size={12} className="text-[var(--forge-text-muted)]" />
            </button>
          )}
        </button>

        {/* Node details (shown when expanded) */}
        {isExpanded && node.description && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            style={{ paddingLeft: `${depth * 16 + 40}px` }}
          >
            <p className="text-xs text-[var(--forge-text-muted)] py-1 pr-4">
              {node.description}
            </p>
            {(node.estimated_hours || node.difficulty) && (
              <div className="flex items-center gap-3 text-xs text-[var(--forge-text-muted)] pb-2">
                {node.estimated_hours && (
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {node.estimated_hours}h
                  </span>
                )}
                {node.difficulty && (
                  <span className="flex items-center gap-1 capitalize">
                    <Zap size={10} />
                    {node.difficulty}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children.map(child => (
              <TreeNode
                key={child.id}
                node={child}
                tree={tree}
                depth={depth + 1}
                onNavigate={onNavigate}
                expandedNodes={expandedNodes}
                toggleExpanded={toggleExpanded}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function PathTree({ path, onNavigateToNode, onAccept, isAccepting }: PathTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    // Expand all level 0 and 1 nodes by default
    const expanded = new Set<string>();
    path.nodes?.forEach(node => {
      if (node.level <= 1) {
        expanded.add(node.id);
      }
    });
    return expanded;
  });

  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const tree = useMemo(() => buildTree(path.nodes || []), [path.nodes]);
  const rootNodes = tree.get(null) || [];

  // Count new vs existing nodes
  const stats = useMemo(() => {
    const nodes = path.nodes || [];
    const newCount = nodes.filter(n => !n.is_existing).length;
    const existingCount = nodes.filter(n => n.is_existing).length;
    return { newCount, existingCount, total: nodes.length };
  }, [path.nodes]);

  if (!path.nodes || path.nodes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[var(--forge-text-muted)]">No nodes in this path</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Path header */}
      <div className="px-2">
        <h4 className="text-sm font-semibold text-white mb-1">{path.name}</h4>
        {path.description && (
          <p className="text-xs text-[var(--forge-text-secondary)] mb-3">{path.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-[var(--forge-text-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--forge-success)]" />
            {stats.existingCount} existing
          </span>
          <span className="flex items-center gap-1.5 text-[var(--forge-text-muted)]">
            <span className="w-2 h-2 rounded-full bg-[var(--ember)]" />
            {stats.newCount} to create
          </span>
          {path.estimated_weeks && (
            <span className="flex items-center gap-1 text-[var(--forge-text-muted)]">
              <Clock size={12} />
              ~{path.estimated_weeks} weeks
            </span>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="border border-[var(--forge-border-subtle)] rounded-xl bg-[var(--forge-bg-void)]/50 overflow-hidden">
        <div className="max-h-[40vh] overflow-y-auto py-2">
          {rootNodes.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              tree={tree}
              depth={0}
              onNavigate={onNavigateToNode}
              expandedNodes={expandedNodes}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      </div>

      {/* Accept button */}
      {onAccept && (
        <motion.button
          onClick={onAccept}
          disabled={isAccepting}
          className={`
            w-full py-3 rounded-xl text-sm font-semibold
            transition-all duration-200
            ${isAccepting
              ? 'bg-[var(--forge-bg-elevated)] text-[var(--forge-text-muted)] cursor-wait'
              : 'bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white hover:opacity-90 shadow-lg shadow-[var(--ember)]/20'
            }
          `}
          whileTap={!isAccepting ? { scale: 0.98 } : undefined}
        >
          {isAccepting ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles size={16} />
              </motion.span>
              Forging your path...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles size={16} />
              Accept & Begin Learning
            </span>
          )}
        </motion.button>
      )}

      {/* Hint */}
      <p className="text-xs text-center text-[var(--forge-text-muted)]">
        New nodes will be created automatically as you progress
      </p>
    </div>
  );
}
