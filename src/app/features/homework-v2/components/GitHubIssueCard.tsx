'use client';

/**
 * GitHubIssueCard - GitHub Issue Display Component
 *
 * Displays the linked GitHub issue for the homework assignment
 * with labels, status, and branch/PR information.
 */

import {
  GitBranch,
  GitPullRequest,
  ExternalLink,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import type { GitHubIssue, GitHubBranch, GitHubPR, GitHubLabel } from '../lib/types';

export interface GitHubIssueCardProps {
  issue: GitHubIssue;
  branch?: GitHubBranch;
  pr?: GitHubPR;
  onCreateBranch?: () => void;
  onCreatePR?: () => void;
  className?: string;
}

export function GitHubIssueCard({
  issue,
  branch,
  pr,
  onCreateBranch,
  onCreatePR,
  className = '',
}: GitHubIssueCardProps) {
  return (
    <div
      className={`bg-[var(--forge-bg-elevated)]/60 backdrop-blur-sm rounded-xl border border-[var(--forge-border-subtle)] overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--forge-border-subtle)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IssueIcon state={issue.state} />
          <span className="text-sm font-mono text-[var(--forge-text-muted)]">
            #{issue.number}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--forge-text-muted)]">
            {issue.repo.fullName}
          </span>
          <a
            href={issue.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded hover:bg-[var(--forge-bg-bench)]/60 text-[var(--forge-text-secondary)] hover:text-[var(--ember)] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-sm font-semibold text-[var(--forge-text-primary)] leading-snug">
          {issue.title}
        </h3>

        {/* Labels */}
        {issue.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {issue.labels.map((label) => (
              <LabelBadge key={label.name} label={label} />
            ))}
          </div>
        )}

        {/* Description preview */}
        <p className="text-xs text-[var(--forge-text-muted)] line-clamp-2 leading-relaxed">
          {extractDescription(issue.body)}
        </p>

        {/* Branch/PR status */}
        <div className="space-y-2 pt-3 border-t border-[var(--forge-border-subtle)]">
          {/* Branch */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm min-w-0">
              <GitBranch className="w-4 h-4 text-[var(--forge-text-muted)] flex-shrink-0" />
              {branch ? (
                <span className="font-mono text-xs text-[var(--forge-text-secondary)] truncate">
                  {branch.name}
                </span>
              ) : (
                <span className="text-xs text-[var(--forge-text-muted)]">No branch</span>
              )}
            </div>
            {!branch && onCreateBranch && (
              <button
                onClick={onCreateBranch}
                className="flex items-center gap-1 text-xs text-[var(--ember)] hover:underline flex-shrink-0"
              >
                <Plus className="w-3 h-3" />
                Create
              </button>
            )}
          </div>

          {/* PR */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <GitPullRequest className="w-4 h-4 text-[var(--forge-text-muted)] flex-shrink-0" />
              {pr ? (
                <PRStatus pr={pr} />
              ) : (
                <span className="text-xs text-[var(--forge-text-muted)]">No PR</span>
              )}
            </div>
            {branch && !pr && onCreatePR && (
              <button
                onClick={onCreatePR}
                className="flex items-center gap-1 text-xs text-[var(--ember)] hover:underline flex-shrink-0"
              >
                <Plus className="w-3 h-3" />
                Create
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function IssueIcon({ state }: { state: GitHubIssue['state'] }) {
  if (state === 'open') {
    return (
      <svg
        className="w-4 h-4 text-emerald-500"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        <path
          fillRule="evenodd"
          d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"
        />
      </svg>
    );
  }
  return (
    <svg
      className="w-4 h-4 text-purple-500"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm3.28 5.78a.75.75 0 00-1.06-1.06L7 7.94 5.78 6.72a.75.75 0 00-1.06 1.06l1.75 1.75a.75.75 0 001.06 0l3.75-3.75z" />
    </svg>
  );
}

function LabelBadge({ label }: { label: GitHubLabel }) {
  // Convert hex color to rgba with low opacity for background
  const bgColor = `#${label.color}15`;
  const borderColor = `#${label.color}30`;
  const textColor = `#${label.color}`;

  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
      }}
    >
      {label.name}
    </span>
  );
}

function PRStatus({ pr }: { pr: GitHubPR }) {
  const statusConfig = {
    open: {
      icon: <GitPullRequest className="w-3 h-3" />,
      color: 'text-emerald-400',
    },
    closed: {
      icon: <GitPullRequest className="w-3 h-3" />,
      color: 'text-red-400',
    },
    merged: {
      icon: <CheckCircle2 className="w-3 h-3" />,
      color: 'text-purple-400',
    },
  };

  const config = statusConfig[pr.state];

  return (
    <a
      href={pr.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 hover:underline group"
    >
      <span className={`flex items-center gap-1 ${config.color}`}>
        {config.icon}
        <span className="font-mono text-xs">#{pr.number}</span>
      </span>
      <span className="text-[10px] text-[var(--forge-text-muted)]">
        +{pr.additions} -{pr.deletions}
      </span>
    </a>
  );
}

// Helper to extract first paragraph from markdown body
function extractDescription(body: string): string {
  // Remove markdown headers
  const withoutHeaders = body.replace(/^#+\s+.+$/gm, '');
  // Remove checkboxes
  const withoutCheckboxes = withoutHeaders.replace(/- \[[ x]\]\s+/g, '');
  // Get first non-empty line
  const lines = withoutCheckboxes.trim().split('\n');
  const firstLine = lines.find((line) => line.trim().length > 0);
  return firstLine?.trim() || '';
}

export default GitHubIssueCard;
