/**
 * Homework V2 Feature Module
 *
 * AI-powered homework system with Claude Code CLI integration,
 * GitHub issue tracking, and AI decision transparency.
 */

// Components
export {
  HomeworkWorkspace,
  ModeSelector,
  ClaudeCliPanel,
  GitHubIssueCard,
  AgentPanel,
  AgentWorkspace,
  FileExplorer,
  CodeViewer,
  MonacoEditor,
} from './components';

export type {
  HomeworkWorkspaceProps,
  ModeSelectorProps,
  ClaudeCliPanelProps,
  GitHubIssueCardProps,
  AgentWorkspaceProps,
  FileExplorerProps,
  FileNode,
  CodeViewerProps,
  MonacoEditorProps,
} from './components';

// Hooks
export { useAgentChat } from './lib/useAgentChat';
export type {
  ChatMessage,
  ToolCallDisplay,
  UseAgentChatOptions,
  UseAgentChatReturn,
} from './lib/useAgentChat';

// Types
export type {
  // Mode types
  HomeworkMode,
  ModeConfig,
  // GitHub types
  GitHubRepo,
  GitHubIssue,
  GitHubLabel,
  GitHubPR,
  GitHubBranch,
  // Homework types
  LearningObjective,
  AcceptanceCriterion,
  StarterHint,
  FileScope,
  HomeworkDifficulty,
  HomeworkDefinition,
  // Code file types
  SupportedLanguage,
  CodeFile,
  FileDiff,
  DiffHunk,
  // Claude CLI types
  ClaudeMessageType,
  ClaudeMessage,
  ClaudeThinkingBlock,
  ClaudeToolCall,
  ClaudeSession,
  // AI Decision types
  DecisionStatus,
  AIDecisionStep,
  AIDecisionLog as AIDecisionLogType,
  // Session types
  SessionStatus,
  HomeworkSession,
  // Settings types
  TransparencyLevel,
  WorkspaceSettings,
} from './lib/types';

// Mock data (for development/testing)
export {
  MODE_CONFIGS,
  DEFAULT_WORKSPACE_SETTINGS,
  MOCK_HOMEWORK_DEFINITIONS,
  MOCK_HOMEWORK_SESSION,
  MOCK_AI_DECISION_LOG,
  getHomeworkById,
  getHomeworkByChapter,
  calculateXP,
  getObjectivesProgress,
  getCriteriaProgress,
} from './lib/mockHomeworkData';

export {
  MOCK_REPOS,
  MOCK_LABELS,
  MOCK_ISSUES,
  MOCK_BRANCHES,
  MOCK_PRS,
  getIssueByNumber,
  getIssuesByDifficulty,
  generateBranchName,
  createMockBranch,
} from './lib/mockGitHubData';

export {
  MOCK_CLAUDE_SESSION,
  MOCK_CLAUDE_MESSAGES,
  MOCK_THINKING_BLOCKS,
  MOCK_TOOL_CALLS,
  createStreamingSimulator,
  createTypewriterSimulator,
} from './lib/mockClaudeSession';
