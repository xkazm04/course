/**
 * Mock Claude Session Data
 *
 * Simulated Claude Code CLI output for the homework system demo.
 * Includes realistic streaming messages, thinking blocks, and tool calls.
 */

import type {
  ClaudeSession,
  ClaudeMessage,
  ClaudeThinkingBlock,
  ClaudeToolCall,
} from './types';

// ============================================================================
// Mock Claude Messages
// ============================================================================

export const MOCK_CLAUDE_MESSAGES: ClaudeMessage[] = [
  {
    id: 'msg-1',
    type: 'system',
    content: 'Claude Code initialized. Working directory: /saas-starter',
    timestamp: new Date('2026-01-04T10:00:00'),
  },
  {
    id: 'msg-2',
    type: 'user',
    content: 'Help me implement dark mode toggle for the application. The issue is #42.',
    timestamp: new Date('2026-01-04T10:00:05'),
  },
  {
    id: 'msg-3',
    type: 'thinking',
    content: `I need to implement a dark mode toggle. Let me analyze what this involves:

1. First, I should understand the current codebase structure
2. Check if there's any existing theme handling
3. Decide on the best approach for global theme state
4. Implement the toggle component
5. Add persistence to localStorage

Let me start by exploring the codebase...`,
    timestamp: new Date('2026-01-04T10:00:10'),
  },
  {
    id: 'msg-4',
    type: 'tool_use',
    content: 'Searching for existing theme-related code...',
    toolName: 'Glob',
    toolInput: { pattern: '**/*theme*' },
    timestamp: new Date('2026-01-04T10:00:15'),
  },
  {
    id: 'msg-5',
    type: 'tool_result',
    content: `Found 2 files:
- src/styles/theme.css
- src/lib/themeConstants.ts`,
    timestamp: new Date('2026-01-04T10:00:18'),
  },
  {
    id: 'msg-6',
    type: 'assistant',
    content: `I found some existing theme infrastructure. Let me analyze the current setup before implementing the dark mode toggle.`,
    timestamp: new Date('2026-01-04T10:00:20'),
  },
  {
    id: 'msg-7',
    type: 'tool_use',
    content: 'Reading theme constants...',
    toolName: 'Read',
    toolInput: { file_path: 'src/lib/themeConstants.ts' },
    timestamp: new Date('2026-01-04T10:00:22'),
  },
  {
    id: 'msg-8',
    type: 'tool_result',
    content: `export const colors = {
  primary: '#3B82F6',
  secondary: '#6366F1',
  background: '#FFFFFF',
  text: '#1F2937',
};`,
    timestamp: new Date('2026-01-04T10:00:25'),
  },
  {
    id: 'msg-9',
    type: 'thinking',
    content: `Good, I can see the current theme setup. It's basic - just static color exports.

For a proper dark mode implementation, I should:
1. Create a ThemeContext using React Context API - this is the standard pattern for global state like themes
2. Consider alternatives:
   - Redux: Overkill for just theme state
   - Zustand: Good option but adds dependency
   - Context API: Built-in, widely understood, sufficient for this use case

I'll go with Context API. I need to:
1. Create ThemeContext with provider
2. Create a useTheme hook for easy access
3. Build the toggle component
4. Update the app root to wrap with provider
5. Add CSS variables for theme colors`,
    timestamp: new Date('2026-01-04T10:00:30'),
  },
  {
    id: 'msg-10',
    type: 'assistant',
    content: `I'll implement dark mode using React Context API. This is the standard approach because:
- Built into React (no extra dependencies)
- Widely understood pattern
- Perfect for global state like themes

Let me create the theme infrastructure:`,
    timestamp: new Date('2026-01-04T10:00:35'),
  },
  {
    id: 'msg-11',
    type: 'tool_use',
    content: 'Creating ThemeContext.tsx...',
    toolName: 'Write',
    toolInput: {
      file_path: 'src/contexts/ThemeContext.tsx',
      content: '// ThemeContext implementation...',
    },
    timestamp: new Date('2026-01-04T10:00:40'),
  },
  {
    id: 'msg-12',
    type: 'tool_result',
    content: 'File created successfully: src/contexts/ThemeContext.tsx',
    timestamp: new Date('2026-01-04T10:00:45'),
  },
  {
    id: 'msg-13',
    type: 'assistant',
    content: `Created ThemeContext with:
- \`ThemeProvider\` component to wrap your app
- \`useTheme\` hook to access theme state
- Automatic localStorage persistence
- System preference detection

Now let me create the toggle component:`,
    timestamp: new Date('2026-01-04T10:00:50'),
  },
  {
    id: 'msg-14',
    type: 'tool_use',
    content: 'Creating DarkModeToggle.tsx...',
    toolName: 'Write',
    toolInput: {
      file_path: 'src/components/DarkModeToggle.tsx',
      content: '// Toggle component implementation...',
    },
    timestamp: new Date('2026-01-04T10:00:55'),
  },
  {
    id: 'msg-15',
    type: 'tool_result',
    content: 'File created successfully: src/components/DarkModeToggle.tsx',
    timestamp: new Date('2026-01-04T10:01:00'),
  },
];

// ============================================================================
// Mock Thinking Blocks
// ============================================================================

export const MOCK_THINKING_BLOCKS: ClaudeThinkingBlock[] = [
  {
    id: 'think-1',
    content: `I need to implement a dark mode toggle. Let me analyze what this involves:

1. First, I should understand the current codebase structure
2. Check if there's any existing theme handling
3. Decide on the best approach for global theme state
4. Implement the toggle component
5. Add persistence to localStorage

Let me start by exploring the codebase...`,
    timestamp: new Date('2026-01-04T10:00:10'),
    isExpanded: false,
  },
  {
    id: 'think-2',
    content: `Good, I can see the current theme setup. It's basic - just static color exports.

For a proper dark mode implementation, I should:
1. Create a ThemeContext using React Context API - this is the standard pattern for global state like themes
2. Consider alternatives:
   - Redux: Overkill for just theme state
   - Zustand: Good option but adds dependency
   - Context API: Built-in, widely understood, sufficient for this use case

I'll go with Context API. I need to:
1. Create ThemeContext with provider
2. Create a useTheme hook for easy access
3. Build the toggle component
4. Update the app root to wrap with provider
5. Add CSS variables for theme colors`,
    timestamp: new Date('2026-01-04T10:00:30'),
    isExpanded: true,
  },
];

// ============================================================================
// Mock Tool Calls
// ============================================================================

export const MOCK_TOOL_CALLS: ClaudeToolCall[] = [
  {
    id: 'tool-1',
    name: 'Glob',
    input: { pattern: '**/*theme*' },
    output: `Found 2 files:
- src/styles/theme.css
- src/lib/themeConstants.ts`,
    status: 'completed',
    timestamp: new Date('2026-01-04T10:00:15'),
  },
  {
    id: 'tool-2',
    name: 'Read',
    input: { file_path: 'src/lib/themeConstants.ts' },
    output: `export const colors = {
  primary: '#3B82F6',
  secondary: '#6366F1',
  background: '#FFFFFF',
  text: '#1F2937',
};`,
    status: 'completed',
    timestamp: new Date('2026-01-04T10:00:22'),
  },
  {
    id: 'tool-3',
    name: 'Write',
    input: {
      file_path: 'src/contexts/ThemeContext.tsx',
      content: '// ThemeContext implementation...',
    },
    output: 'File created successfully',
    status: 'completed',
    timestamp: new Date('2026-01-04T10:00:40'),
  },
  {
    id: 'tool-4',
    name: 'Write',
    input: {
      file_path: 'src/components/DarkModeToggle.tsx',
      content: '// Toggle component implementation...',
    },
    output: 'File created successfully',
    status: 'completed',
    timestamp: new Date('2026-01-04T10:00:55'),
  },
  {
    id: 'tool-5',
    name: 'Edit',
    input: {
      file_path: 'src/app/layout.tsx',
      old_string: '<body>',
      new_string: '<body><ThemeProvider>',
    },
    status: 'running',
    timestamp: new Date('2026-01-04T10:01:05'),
  },
];

// ============================================================================
// Mock Session
// ============================================================================

export const MOCK_CLAUDE_SESSION: ClaudeSession = {
  id: 'session-dark-mode-001',
  status: 'running',
  messages: MOCK_CLAUDE_MESSAGES,
  thinkingBlocks: MOCK_THINKING_BLOCKS,
  toolCalls: MOCK_TOOL_CALLS,
  currentPrompt: 'Help me implement dark mode toggle for the application. The issue is #42.',
  startedAt: new Date('2026-01-04T10:00:00'),
};

// ============================================================================
// Streaming Simulation
// ============================================================================

/**
 * Simulates streaming Claude messages with realistic delays
 */
export function createStreamingSimulator(
  onMessage: (message: ClaudeMessage) => void,
  onComplete?: () => void
) {
  let currentIndex = 0;
  const messages = [...MOCK_CLAUDE_MESSAGES];

  const streamNext = () => {
    if (currentIndex >= messages.length) {
      onComplete?.();
      return;
    }

    const message = messages[currentIndex];
    onMessage(message);
    currentIndex++;

    // Variable delays based on message type
    const delays: Record<string, number> = {
      system: 500,
      user: 100,
      thinking: 2000,
      tool_use: 800,
      tool_result: 1200,
      assistant: 1500,
      error: 500,
    };

    const delay = delays[message.type] || 1000;
    setTimeout(streamNext, delay);
  };

  return {
    start: () => setTimeout(streamNext, 500),
    reset: () => { currentIndex = 0; },
  };
}

/**
 * Simulates typewriter effect for a single message
 */
export function createTypewriterSimulator(
  content: string,
  onCharacter: (partial: string) => void,
  onComplete?: () => void,
  charDelay = 20
) {
  let currentIndex = 0;

  const typeNext = () => {
    if (currentIndex >= content.length) {
      onComplete?.();
      return;
    }

    currentIndex++;
    onCharacter(content.slice(0, currentIndex));
    setTimeout(typeNext, charDelay);
  };

  return {
    start: () => setTimeout(typeNext, charDelay),
    reset: () => { currentIndex = 0; },
  };
}
