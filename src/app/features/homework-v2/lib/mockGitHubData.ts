/**
 * Mock GitHub Data
 *
 * Sample GitHub repositories, issues, and PRs for the homework system demo.
 */

import type {
  GitHubRepo,
  GitHubIssue,
  GitHubLabel,
  GitHubPR,
  GitHubBranch,
} from './types';

// ============================================================================
// Mock Repositories
// ============================================================================

export const MOCK_REPOS: GitHubRepo[] = [
  {
    owner: 'openforge',
    name: 'saas-starter',
    fullName: 'openforge/saas-starter',
    description: 'A modern SaaS starter kit with Next.js, authentication, and payments',
    url: 'https://github.com/openforge/saas-starter',
    defaultBranch: 'main',
  },
  {
    owner: 'openforge',
    name: 'react-components',
    fullName: 'openforge/react-components',
    description: 'Accessible React component library with Tailwind CSS',
    url: 'https://github.com/openforge/react-components',
    defaultBranch: 'main',
  },
  {
    owner: 'openforge',
    name: 'api-toolkit',
    fullName: 'openforge/api-toolkit',
    description: 'REST API helpers and utilities for Node.js applications',
    url: 'https://github.com/openforge/api-toolkit',
    defaultBranch: 'main',
  },
];

// ============================================================================
// Mock Labels
// ============================================================================

export const MOCK_LABELS: Record<string, GitHubLabel> = {
  beginner: {
    name: 'good first issue',
    color: '7057ff',
    description: 'Good for newcomers',
  },
  intermediate: {
    name: 'intermediate',
    color: 'fbca04',
    description: 'Requires some experience',
  },
  advanced: {
    name: 'advanced',
    color: 'b60205',
    description: 'Complex implementation required',
  },
  feature: {
    name: 'enhancement',
    color: 'a2eeef',
    description: 'New feature or request',
  },
  bug: {
    name: 'bug',
    color: 'd73a4a',
    description: 'Something isn\'t working',
  },
  learning: {
    name: 'learning',
    color: '0e8a16',
    description: 'Educational homework issue',
  },
  react: {
    name: 'react',
    color: '61dafb',
    description: 'Related to React',
  },
  typescript: {
    name: 'typescript',
    color: '3178c6',
    description: 'Related to TypeScript',
  },
};

// ============================================================================
// Mock Issues
// ============================================================================

export const MOCK_ISSUES: GitHubIssue[] = [
  {
    id: 'issue-42',
    number: 42,
    title: 'Add dark mode toggle to the application',
    body: `## Description
Add a dark mode toggle that allows users to switch between light and dark themes.

## Requirements
- Create a theme context for global state management
- Implement a toggle component with smooth transition
- Persist user preference in localStorage
- Respect system preference as default

## Acceptance Criteria
- [ ] Theme toggle is accessible via keyboard
- [ ] Theme persists across page refreshes
- [ ] Smooth transition between themes
- [ ] All components respect the current theme

## Design Reference
See Figma link in the wiki for design specs.

## Learning Objectives
This issue will help you learn:
- React Context API for global state
- CSS custom properties for theming
- localStorage for preference persistence
- Accessibility best practices`,
    state: 'open',
    labels: [
      MOCK_LABELS.beginner,
      MOCK_LABELS.feature,
      MOCK_LABELS.learning,
      MOCK_LABELS.react,
    ],
    createdAt: '2026-01-01T10:00:00Z',
    url: 'https://github.com/openforge/saas-starter/issues/42',
    repo: MOCK_REPOS[0],
  },
  {
    id: 'issue-58',
    number: 58,
    title: 'Implement form validation with Zod',
    body: `## Description
Add comprehensive form validation using Zod schemas for the signup and login forms.

## Requirements
- Create Zod schemas for user input validation
- Integrate with React Hook Form
- Display inline error messages
- Prevent submission with invalid data

## Acceptance Criteria
- [ ] Email format validation
- [ ] Password strength requirements
- [ ] Matching password confirmation
- [ ] Clear error messages for each field

## Learning Objectives
- Schema-based validation with Zod
- React Hook Form integration
- TypeScript type inference from schemas`,
    state: 'open',
    labels: [
      MOCK_LABELS.intermediate,
      MOCK_LABELS.feature,
      MOCK_LABELS.learning,
      MOCK_LABELS.typescript,
    ],
    createdAt: '2026-01-02T14:30:00Z',
    url: 'https://github.com/openforge/saas-starter/issues/58',
    repo: MOCK_REPOS[0],
  },
  {
    id: 'issue-73',
    number: 73,
    title: 'Build accessible dropdown menu component',
    body: `## Description
Create a fully accessible dropdown menu component following WAI-ARIA guidelines.

## Requirements
- Keyboard navigation (arrow keys, escape, enter)
- Screen reader announcements
- Focus management
- Click outside to close

## Acceptance Criteria
- [ ] Passes WCAG 2.1 AA compliance
- [ ] Works with keyboard only
- [ ] Proper ARIA attributes
- [ ] Animated open/close

## Learning Objectives
- ARIA patterns for menus
- Focus trap implementation
- Keyboard event handling`,
    state: 'open',
    labels: [
      MOCK_LABELS.advanced,
      MOCK_LABELS.feature,
      MOCK_LABELS.learning,
      MOCK_LABELS.react,
    ],
    createdAt: '2026-01-03T09:15:00Z',
    url: 'https://github.com/openforge/react-components/issues/73',
    repo: MOCK_REPOS[1],
  },
];

// ============================================================================
// Mock Branches
// ============================================================================

export const MOCK_BRANCHES: GitHubBranch[] = [
  {
    name: 'learn/student123/dark-mode-toggle',
    prefix: 'learn',
    username: 'student123',
    createdAt: '2026-01-04T10:00:00Z',
  },
  {
    name: 'learn/student456/form-validation',
    prefix: 'learn',
    username: 'student456',
    createdAt: '2026-01-04T11:30:00Z',
  },
];

// ============================================================================
// Mock Pull Requests
// ============================================================================

export const MOCK_PRS: GitHubPR[] = [
  {
    id: 'pr-101',
    number: 101,
    title: 'feat: Add dark mode toggle (#42)',
    state: 'open',
    url: 'https://github.com/openforge/saas-starter/pull/101',
    branch: 'learn/student123/dark-mode-toggle',
    additions: 245,
    deletions: 12,
    commits: 5,
    createdAt: '2026-01-04T11:00:00Z',
  },
  {
    id: 'pr-98',
    number: 98,
    title: 'feat: Implement Zod form validation (#58)',
    state: 'merged',
    url: 'https://github.com/openforge/saas-starter/pull/98',
    branch: 'learn/student789/form-validation',
    additions: 312,
    deletions: 45,
    commits: 8,
    createdAt: '2026-01-03T14:00:00Z',
    mergedAt: '2026-01-04T09:00:00Z',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get an issue by number
 */
export function getIssueByNumber(number: number): GitHubIssue | undefined {
  return MOCK_ISSUES.find((issue) => issue.number === number);
}

/**
 * Get issues by difficulty label
 */
export function getIssuesByDifficulty(
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): GitHubIssue[] {
  const labelName =
    difficulty === 'beginner' ? 'good first issue' : difficulty;
  return MOCK_ISSUES.filter((issue) =>
    issue.labels.some((label) => label.name === labelName)
  );
}

/**
 * Generate a branch name for a student
 */
export function generateBranchName(
  username: string,
  issueTitle: string
): string {
  const slug = issueTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
  return `learn/${username}/${slug}`;
}

/**
 * Create a mock branch for a user
 */
export function createMockBranch(
  username: string,
  issueTitle: string
): GitHubBranch {
  return {
    name: generateBranchName(username, issueTitle),
    prefix: 'learn',
    username,
    createdAt: new Date().toISOString(),
  };
}
