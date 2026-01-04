/**
 * Mock Homework Data
 *
 * Sample homework definitions with learning objectives, acceptance criteria,
 * and AI decision logs for the homework system demo.
 */

import type {
  HomeworkDefinition,
  HomeworkSession,
  LearningObjective,
  AcceptanceCriterion,
  StarterHint,
  FileScope,
  AIDecisionLog,
  AIDecisionStep,
  ModeConfig,
  CodeFile,
  WorkspaceSettings,
} from './types';
import { MOCK_ISSUES, MOCK_BRANCHES, MOCK_PRS } from './mockGitHubData';
import { MOCK_CLAUDE_SESSION } from './mockClaudeSession';

// ============================================================================
// Mode Configurations
// ============================================================================

export const MODE_CONFIGS: ModeConfig[] = [
  {
    id: 'manual',
    label: 'Manual Mode',
    description: 'Work in your local IDE and push to GitHub',
    icon: 'terminal',
    features: [
      'Use your favorite IDE',
      'Full git workflow',
      'Local testing environment',
      'Maximum flexibility',
    ],
  },
  {
    id: 'browser',
    label: 'Browser IDE',
    description: 'Code directly in the browser with live preview',
    icon: 'code',
    features: [
      'No setup required',
      'Live code preview',
      'Integrated console',
      'Auto-save to cloud',
    ],
  },
  {
    id: 'ai_assisted',
    label: 'AI-Assisted',
    description: 'Learn by watching Claude Code solve the problem',
    icon: 'sparkles',
    features: [
      'See AI reasoning in real-time',
      'Learn professional patterns',
      'Understand decision-making',
      'Pause and explore anytime',
    ],
  },
];

// ============================================================================
// Default Workspace Settings
// ============================================================================

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  mode: 'ai_assisted',
  transparencyLevel: 'standard',
  showThinkingBlocks: true,
  showDecisionLog: true,
  showToolCalls: true,
  autoExpandThinking: false,
  soundEnabled: false,
  theme: 'system',
};

// ============================================================================
// Mock Learning Objectives
// ============================================================================

const DARK_MODE_OBJECTIVES: LearningObjective[] = [
  {
    id: 'obj-1',
    description: 'Understand React Context API for global state management',
    concept: 'React Context',
    chapterLink: '/forge/chapter/react-context',
    completed: true,
  },
  {
    id: 'obj-2',
    description: 'Implement theme switching with CSS custom properties',
    concept: 'CSS Variables',
    chapterLink: '/forge/chapter/css-variables',
    completed: true,
  },
  {
    id: 'obj-3',
    description: 'Persist user preferences using localStorage',
    concept: 'Web Storage API',
    chapterLink: '/forge/chapter/web-storage',
    completed: false,
  },
  {
    id: 'obj-4',
    description: 'Create accessible toggle components',
    concept: 'Accessibility',
    chapterLink: '/forge/chapter/a11y-basics',
    completed: false,
  },
];

// ============================================================================
// Mock Acceptance Criteria
// ============================================================================

const DARK_MODE_CRITERIA: AcceptanceCriterion[] = [
  {
    id: 'ac-1',
    description: 'Theme toggle is accessible via keyboard',
    validationType: 'functional',
    completed: true,
  },
  {
    id: 'ac-2',
    description: 'Theme persists across page refreshes',
    validationType: 'functional',
    completed: false,
  },
  {
    id: 'ac-3',
    description: 'Smooth transition animation between themes',
    validationType: 'visual',
    completed: true,
  },
  {
    id: 'ac-4',
    description: 'All components respect the current theme',
    validationType: 'visual',
    completed: false,
  },
  {
    id: 'ac-5',
    description: 'Code follows project style guidelines',
    validationType: 'code_quality',
    completed: true,
  },
];

// ============================================================================
// Mock Starter Hints
// ============================================================================

const DARK_MODE_HINTS: StarterHint[] = [
  {
    level: 1,
    hint: 'Start by creating a new file called ThemeContext.tsx in the contexts folder.',
    costPercent: 5,
    revealed: true,
  },
  {
    level: 2,
    hint: 'Use createContext() and useContext() from React. Your context should provide theme state and a toggle function.',
    costPercent: 10,
    revealed: false,
  },
  {
    level: 3,
    hint: 'For CSS theming, use CSS custom properties (--var-name) and toggle a data-theme attribute on the html element.',
    costPercent: 15,
    revealed: false,
  },
  {
    level: 4,
    hint: 'Check window.matchMedia("(prefers-color-scheme: dark)") to detect system preference on initial load.',
    costPercent: 20,
    revealed: false,
  },
];

// ============================================================================
// Mock File Scope
// ============================================================================

const DARK_MODE_FILES: FileScope[] = [
  {
    path: 'src/contexts/ThemeContext.tsx',
    purpose: 'Theme context provider and hook',
    linesEstimate: 45,
  },
  {
    path: 'src/components/DarkModeToggle.tsx',
    purpose: 'Toggle button component',
    linesEstimate: 35,
  },
  {
    path: 'src/app/layout.tsx',
    purpose: 'Wrap app with ThemeProvider',
    linesEstimate: 5,
  },
  {
    path: 'src/styles/theme.css',
    purpose: 'CSS variables for themes',
    linesEstimate: 30,
  },
];

// ============================================================================
// Mock Starter Files
// ============================================================================

const STARTER_FILES: CodeFile[] = [
  {
    id: 'file-1',
    name: 'ThemeContext.tsx',
    path: 'src/contexts/ThemeContext.tsx',
    language: 'tsx',
    content: `'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  // TODO: Load theme from localStorage on mount

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    // TODO: Save to localStorage
  };

  // TODO: Apply theme to document

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
`,
    isEntry: true,
    isModified: false,
  },
  {
    id: 'file-2',
    name: 'DarkModeToggle.tsx',
    path: 'src/components/DarkModeToggle.tsx',
    language: 'tsx',
    content: `'use client';

import { useTheme } from '@/contexts/ThemeContext';

export function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label={\`Switch to \${theme === 'light' ? 'dark' : 'light'} mode\`}
    >
      {/* TODO: Add sun/moon icons */}
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
`,
    isModified: false,
  },
];

// ============================================================================
// Mock AI Decision Steps
// ============================================================================

const DARK_MODE_DECISION_STEPS: AIDecisionStep[] = [
  {
    id: 'step-1',
    stepNumber: 1,
    action: 'Analyzed existing codebase structure',
    reasoning:
      'Before implementing new features, I need to understand the current project structure, existing theme handling, and coding patterns used.',
    filesAffected: [],
    status: 'completed',
    timestamp: new Date('2026-01-04T10:00:15'),
    completedAt: new Date('2026-01-04T10:00:20'),
    linkedObjectiveIds: [],
  },
  {
    id: 'step-2',
    stepNumber: 2,
    action: 'Created ThemeContext.tsx with provider and hook',
    reasoning:
      'React Context API is the standard pattern for global state like themes. I chose this over Redux (overkill) or Zustand (extra dependency) because it\'s built-in, widely understood, and sufficient for theme state.',
    alternativesConsidered: [
      'Redux - Too much boilerplate for simple theme state',
      'Zustand - Good option but adds external dependency',
      'Props drilling - Not scalable for app-wide theme',
    ],
    filesAffected: ['src/contexts/ThemeContext.tsx'],
    status: 'completed',
    timestamp: new Date('2026-01-04T10:00:40'),
    completedAt: new Date('2026-01-04T10:00:50'),
    linkedObjectiveIds: ['obj-1'],
  },
  {
    id: 'step-3',
    stepNumber: 3,
    action: 'Created DarkModeToggle component',
    reasoning:
      'A dedicated toggle component keeps the UI logic separate from the context logic. This follows the single responsibility principle and makes the component reusable.',
    filesAffected: ['src/components/DarkModeToggle.tsx'],
    status: 'completed',
    timestamp: new Date('2026-01-04T10:00:55'),
    completedAt: new Date('2026-01-04T10:01:05'),
    linkedObjectiveIds: ['obj-4'],
  },
  {
    id: 'step-4',
    stepNumber: 4,
    action: 'Update App layout to wrap with ThemeProvider',
    reasoning:
      'The ThemeProvider needs to wrap the entire application at the root level so all components can access the theme context.',
    filesAffected: ['src/app/layout.tsx'],
    status: 'in_progress',
    timestamp: new Date('2026-01-04T10:01:10'),
    linkedObjectiveIds: ['obj-1'],
  },
  {
    id: 'step-5',
    stepNumber: 5,
    action: 'Add CSS custom properties for light and dark themes',
    reasoning:
      'CSS custom properties (variables) allow theme colors to be changed dynamically without JavaScript manipulation of each element.',
    filesAffected: ['src/styles/theme.css'],
    status: 'pending',
    timestamp: new Date('2026-01-04T10:01:15'),
    linkedObjectiveIds: ['obj-2'],
  },
  {
    id: 'step-6',
    stepNumber: 6,
    action: 'Implement localStorage persistence',
    reasoning:
      'User theme preference should persist across sessions. localStorage is the simplest solution for client-side preference storage.',
    filesAffected: ['src/contexts/ThemeContext.tsx'],
    status: 'pending',
    timestamp: new Date('2026-01-04T10:01:20'),
    linkedObjectiveIds: ['obj-3'],
  },
  {
    id: 'step-7',
    stepNumber: 7,
    action: 'Add system preference detection',
    reasoning:
      'Respecting the user\'s system preference provides a better default experience. We use window.matchMedia to detect prefers-color-scheme.',
    filesAffected: ['src/contexts/ThemeContext.tsx'],
    status: 'pending',
    timestamp: new Date('2026-01-04T10:01:25'),
    linkedObjectiveIds: ['obj-3'],
  },
];

// ============================================================================
// Mock AI Decision Log
// ============================================================================

export const MOCK_AI_DECISION_LOG: AIDecisionLog = {
  sessionId: 'session-dark-mode-001',
  steps: DARK_MODE_DECISION_STEPS,
  currentStepIndex: 3,
  isVisible: true,
};

// ============================================================================
// Mock Homework Definitions
// ============================================================================

export const MOCK_HOMEWORK_DEFINITIONS: HomeworkDefinition[] = [
  {
    id: 'hw-dark-mode',
    chapterId: 'chapter-react-context',
    title: 'Implement Dark Mode Toggle',
    description:
      'Add a dark mode toggle to the application using React Context API, CSS custom properties, and localStorage persistence.',
    difficulty: 'beginner',
    estimatedMinutes: 45,
    xpReward: 150,
    githubIssue: MOCK_ISSUES[0],
    learningObjectives: DARK_MODE_OBJECTIVES,
    acceptanceCriteria: DARK_MODE_CRITERIA,
    starterHints: DARK_MODE_HINTS,
    fileScope: DARK_MODE_FILES,
    starterFiles: STARTER_FILES,
  },
  {
    id: 'hw-form-validation',
    chapterId: 'chapter-typescript-zod',
    title: 'Form Validation with Zod',
    description:
      'Implement comprehensive form validation using Zod schemas integrated with React Hook Form.',
    difficulty: 'intermediate',
    estimatedMinutes: 60,
    xpReward: 200,
    githubIssue: MOCK_ISSUES[1],
    learningObjectives: [
      {
        id: 'obj-fv-1',
        description: 'Create type-safe schemas with Zod',
        concept: 'Zod Schemas',
        completed: false,
      },
      {
        id: 'obj-fv-2',
        description: 'Integrate Zod with React Hook Form',
        concept: 'Form Libraries',
        completed: false,
      },
    ],
    acceptanceCriteria: [
      {
        id: 'ac-fv-1',
        description: 'Email validates against proper format',
        validationType: 'functional',
        completed: false,
      },
      {
        id: 'ac-fv-2',
        description: 'Password meets strength requirements',
        validationType: 'functional',
        completed: false,
      },
    ],
    starterHints: [
      {
        level: 1,
        hint: 'Start by defining your Zod schema with z.object()',
        costPercent: 5,
        revealed: false,
      },
    ],
    fileScope: [
      {
        path: 'src/lib/validationSchemas.ts',
        purpose: 'Zod schema definitions',
        linesEstimate: 25,
      },
    ],
  },
];

// ============================================================================
// Mock Homework Session
// ============================================================================

export const MOCK_HOMEWORK_SESSION: HomeworkSession = {
  id: 'session-001',
  homeworkId: 'hw-dark-mode',
  userId: 'user-student123',
  mode: 'ai_assisted',
  status: 'in_progress',
  branch: MOCK_BRANCHES[0],
  pr: MOCK_PRS[0],
  claudeSession: MOCK_CLAUDE_SESSION,
  decisionLog: MOCK_AI_DECISION_LOG,
  files: STARTER_FILES,
  startedAt: new Date('2026-01-04T10:00:00'),
  timeSpentMinutes: 12,
  hintsRevealed: 1,
  xpEarned: 0,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get homework by ID
 */
export function getHomeworkById(id: string): HomeworkDefinition | undefined {
  return MOCK_HOMEWORK_DEFINITIONS.find((hw) => hw.id === id);
}

/**
 * Get homework by chapter ID
 */
export function getHomeworkByChapter(
  chapterId: string
): HomeworkDefinition | undefined {
  return MOCK_HOMEWORK_DEFINITIONS.find((hw) => hw.chapterId === chapterId);
}

/**
 * Calculate XP earned based on hints revealed
 */
export function calculateXP(
  baseXP: number,
  hints: StarterHint[],
  hintsRevealed: number
): number {
  const totalPenalty = hints
    .slice(0, hintsRevealed)
    .reduce((sum, hint) => sum + hint.costPercent, 0);
  return Math.round(baseXP * (1 - totalPenalty / 100));
}

/**
 * Get completion percentage for objectives
 */
export function getObjectivesProgress(
  objectives: LearningObjective[]
): number {
  const completed = objectives.filter((obj) => obj.completed).length;
  return Math.round((completed / objectives.length) * 100);
}

/**
 * Get completion percentage for acceptance criteria
 */
export function getCriteriaProgress(criteria: AcceptanceCriterion[]): number {
  const completed = criteria.filter((c) => c.completed).length;
  return Math.round((completed / criteria.length) * 100);
}
