/**
 * Homework V2 - Type Definitions
 *
 * Core types for the AI-powered homework system with Claude Code CLI integration.
 */

// ============================================================================
// Learning Mode Types
// ============================================================================

export type HomeworkMode = 'manual' | 'browser' | 'ai_assisted';

export interface ModeConfig {
  id: HomeworkMode;
  label: string;
  description: string;
  icon: string;
  features: string[];
}

// ============================================================================
// GitHub Integration Types
// ============================================================================

export interface GitHubRepo {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  defaultBranch: string;
}

export interface GitHubIssue {
  id: string;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: GitHubLabel[];
  assignee?: string;
  createdAt: string;
  url: string;
  repo: GitHubRepo;
}

export interface GitHubLabel {
  name: string;
  color: string;
  description?: string;
}

export interface GitHubPR {
  id: string;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  url: string;
  branch: string;
  additions: number;
  deletions: number;
  commits: number;
  createdAt: string;
  mergedAt?: string;
}

export interface GitHubBranch {
  name: string;
  prefix: string;
  username: string;
  createdAt: string;
}

// ============================================================================
// Homework Definition Types
// ============================================================================

export interface LearningObjective {
  id: string;
  description: string;
  concept?: string;
  chapterLink?: string;
  completed: boolean;
}

export interface AcceptanceCriterion {
  id: string;
  description: string;
  validationType: 'functional' | 'visual' | 'code_quality' | 'test_coverage';
  completed: boolean;
}

export interface StarterHint {
  level: number;
  hint: string;
  costPercent: number; // XP reduction for using hint
  revealed: boolean;
}

export interface FileScope {
  path: string;
  purpose: string;
  linesEstimate: number;
}

export type HomeworkDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface HomeworkDefinition {
  id: string;
  chapterId: string;
  title: string;
  description: string;
  difficulty: HomeworkDifficulty;
  estimatedMinutes: number;
  xpReward: number;
  githubIssue: GitHubIssue;
  learningObjectives: LearningObjective[];
  acceptanceCriteria: AcceptanceCriterion[];
  starterHints: StarterHint[];
  fileScope: FileScope[];
  starterFiles?: CodeFile[];
}

// ============================================================================
// Code File Types (for CodePlayground integration)
// ============================================================================

export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'jsx'
  | 'tsx'
  | 'css'
  | 'html'
  | 'json'
  | 'markdown';

export interface CodeFile {
  id: string;
  name: string;
  path: string;
  language: SupportedLanguage;
  content: string;
  isEntry?: boolean;
  isModified?: boolean;
}

export interface FileDiff {
  path: string;
  additions: number;
  deletions: number;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  startLine: number;
  endLine: number;
  content: string;
  type: 'add' | 'remove' | 'context';
}

// ============================================================================
// Claude CLI Session Types
// ============================================================================

export type ClaudeMessageType =
  | 'system'
  | 'user'
  | 'assistant'
  | 'thinking'
  | 'tool_use'
  | 'tool_result'
  | 'error';

export interface ClaudeMessage {
  id: string;
  type: ClaudeMessageType;
  content: string;
  timestamp: Date;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  isStreaming?: boolean;
}

export interface ClaudeThinkingBlock {
  id: string;
  content: string;
  timestamp: Date;
  isExpanded: boolean;
}

export interface ClaudeToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp: Date;
}

export interface ClaudeSession {
  id: string;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  messages: ClaudeMessage[];
  thinkingBlocks: ClaudeThinkingBlock[];
  toolCalls: ClaudeToolCall[];
  currentPrompt?: string;
  startedAt: Date;
  endedAt?: Date;
}

// ============================================================================
// AI Decision Log Types
// ============================================================================

export type DecisionStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'reverted';

export interface AIDecisionStep {
  id: string;
  stepNumber: number;
  action: string;
  reasoning: string;
  alternativesConsidered?: string[];
  filesAffected: string[];
  status: DecisionStatus;
  timestamp: Date;
  completedAt?: Date;
  linkedObjectiveIds?: string[];
}

export interface AIDecisionLog {
  sessionId: string;
  steps: AIDecisionStep[];
  currentStepIndex: number;
  isVisible: boolean;
}

// ============================================================================
// Homework Session State
// ============================================================================

export type SessionStatus = 'not_started' | 'in_progress' | 'submitted' | 'completed' | 'abandoned';

export interface HomeworkSession {
  id: string;
  homeworkId: string;
  userId: string;
  mode: HomeworkMode;
  status: SessionStatus;
  branch?: GitHubBranch;
  pr?: GitHubPR;
  claudeSession?: ClaudeSession;
  decisionLog: AIDecisionLog;
  files: CodeFile[];
  startedAt: Date;
  submittedAt?: Date;
  completedAt?: Date;
  timeSpentMinutes: number;
  hintsRevealed: number;
  xpEarned: number;
}

// ============================================================================
// Workspace Settings
// ============================================================================

export type TransparencyLevel = 'minimal' | 'standard' | 'verbose';

export interface WorkspaceSettings {
  mode: HomeworkMode;
  transparencyLevel: TransparencyLevel;
  showThinkingBlocks: boolean;
  showDecisionLog: boolean;
  showToolCalls: boolean;
  autoExpandThinking: boolean;
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface HomeworkWorkspaceProps {
  homework: HomeworkDefinition;
  session?: HomeworkSession;
  onModeChange?: (mode: HomeworkMode) => void;
  onSubmit?: () => void;
  className?: string;
}

export interface ModeSelectorProps {
  currentMode: HomeworkMode;
  onModeChange: (mode: HomeworkMode) => void;
  disabled?: boolean;
}

export interface ClaudeCliPanelProps {
  session: ClaudeSession;
  onPromptSubmit?: (prompt: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  showThinkingBlocks?: boolean;
  className?: string;
}

export interface AIDecisionLogProps {
  log: AIDecisionLog;
  onStepClick?: (step: AIDecisionStep) => void;
  onToggleVisibility?: () => void;
  className?: string;
}

export interface GitHubIssueCardProps {
  issue: GitHubIssue;
  branch?: GitHubBranch;
  pr?: GitHubPR;
  onCreateBranch?: () => void;
  onCreatePR?: () => void;
  className?: string;
}

export interface LearningObjectivesProps {
  objectives: LearningObjective[];
  onToggle?: (id: string) => void;
  className?: string;
}
