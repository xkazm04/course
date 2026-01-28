/**
 * Command Tools
 *
 * Tools for executing commands in a sandboxed environment.
 * For now, these are simulated - in production, would use WebContainers or Docker.
 */

import { defineTool } from './registry';
import { getVirtualFS } from './virtual-fs';
import type { ToolResult, ToolContext } from '../types';

// ============================================================================
// Allowed Commands (Whitelist)
// ============================================================================

const ALLOWED_COMMANDS = [
  'ls',
  'cat',
  'echo',
  'pwd',
  'cd',
  'mkdir',
  'touch',
  'rm',
  'cp',
  'mv',
  'grep',
  'find',
  'head',
  'tail',
  'wc',
  'sort',
  'uniq',
  // Development tools (simulated)
  'npm',
  'npx',
  'node',
  'tsc',
  'git',
];

// ============================================================================
// Command Parser
// ============================================================================

interface ParsedCommand {
  command: string;
  args: string[];
}

function parseCommand(commandLine: string): ParsedCommand {
  const parts = commandLine.trim().split(/\s+/);
  return {
    command: parts[0] || '',
    args: parts.slice(1),
  };
}

// ============================================================================
// Command Simulators
// ============================================================================

async function simulateLs(
  args: string[],
  context: ToolContext,
  cwd: string
): Promise<string> {
  const fs = getVirtualFS(context.projectId || context.sessionId);
  const path = args[0] || cwd;
  const entries = await fs.readdir(path);
  return entries.map((e) => (e.isDirectory ? `${e.name}/` : e.name)).join('\n');
}

async function simulateCat(
  args: string[],
  context: ToolContext
): Promise<string> {
  if (args.length === 0) {
    throw new Error('cat: missing operand');
  }
  const fs = getVirtualFS(context.projectId || context.sessionId);
  const contents: string[] = [];
  for (const path of args) {
    contents.push(await fs.readFile(path));
  }
  return contents.join('\n');
}

async function simulateEcho(args: string[]): Promise<string> {
  return args.join(' ');
}

async function simulatePwd(cwd: string): Promise<string> {
  return cwd;
}

async function simulateMkdir(
  args: string[],
  context: ToolContext
): Promise<string> {
  if (args.length === 0) {
    throw new Error('mkdir: missing operand');
  }
  const fs = getVirtualFS(context.projectId || context.sessionId);
  for (const path of args) {
    await fs.mkdir(path);
  }
  return `Created directory: ${args.join(', ')}`;
}

async function simulateTouch(
  args: string[],
  context: ToolContext
): Promise<string> {
  if (args.length === 0) {
    throw new Error('touch: missing operand');
  }
  const fs = getVirtualFS(context.projectId || context.sessionId);
  for (const path of args) {
    const exists = await fs.exists(path);
    if (!exists) {
      await fs.writeFile(path, '');
    }
  }
  return `Touched: ${args.join(', ')}`;
}

async function simulateRm(
  args: string[],
  context: ToolContext
): Promise<string> {
  if (args.length === 0) {
    throw new Error('rm: missing operand');
  }
  const fs = getVirtualFS(context.projectId || context.sessionId);
  for (const path of args.filter((a) => !a.startsWith('-'))) {
    await fs.delete(path);
  }
  return `Removed: ${args.filter((a) => !a.startsWith('-')).join(', ')}`;
}

async function simulateGrep(
  args: string[],
  context: ToolContext
): Promise<string> {
  if (args.length < 2) {
    throw new Error('grep: missing pattern or file');
  }
  const pattern = args[0];
  const files = args.slice(1);
  const fs = getVirtualFS(context.projectId || context.sessionId);
  const results: string[] = [];

  for (const file of files) {
    const content = await fs.readFile(file);
    const lines = content.split('\n');
    const regex = new RegExp(pattern, 'gi');

    for (let i = 0; i < lines.length; i++) {
      if (regex.test(lines[i])) {
        results.push(`${file}:${i + 1}:${lines[i]}`);
      }
    }
  }

  return results.join('\n') || 'No matches found';
}

async function simulateHead(
  args: string[],
  context: ToolContext
): Promise<string> {
  let lines = 10;
  let files = args;

  if (args[0] === '-n' && args[1]) {
    lines = parseInt(args[1], 10);
    files = args.slice(2);
  }

  if (files.length === 0) {
    throw new Error('head: missing operand');
  }

  const fs = getVirtualFS(context.projectId || context.sessionId);
  const content = await fs.readFile(files[0]);
  return content.split('\n').slice(0, lines).join('\n');
}

async function simulateTail(
  args: string[],
  context: ToolContext
): Promise<string> {
  let lines = 10;
  let files = args;

  if (args[0] === '-n' && args[1]) {
    lines = parseInt(args[1], 10);
    files = args.slice(2);
  }

  if (files.length === 0) {
    throw new Error('tail: missing operand');
  }

  const fs = getVirtualFS(context.projectId || context.sessionId);
  const content = await fs.readFile(files[0]);
  const allLines = content.split('\n');
  return allLines.slice(-lines).join('\n');
}

async function simulateWc(
  args: string[],
  context: ToolContext
): Promise<string> {
  if (args.length === 0) {
    throw new Error('wc: missing operand');
  }

  const fs = getVirtualFS(context.projectId || context.sessionId);
  const results: string[] = [];

  for (const file of args.filter((a) => !a.startsWith('-'))) {
    const content = await fs.readFile(file);
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).filter(Boolean).length;
    const chars = content.length;
    results.push(`  ${lines}  ${words}  ${chars} ${file}`);
  }

  return results.join('\n');
}

// Simulated npm/node commands
async function simulateNpm(args: string[]): Promise<string> {
  const subcommand = args[0];
  switch (subcommand) {
    case 'install':
    case 'i':
      return `[simulated] Installing dependencies...\nadded ${Math.floor(Math.random() * 100) + 50} packages in ${(Math.random() * 5 + 1).toFixed(1)}s`;
    case 'run':
      return `[simulated] Running script: ${args[1] || 'default'}\n> Script completed successfully`;
    case 'test':
      return `[simulated] Running tests...\n\n  PASS  All tests passed\n  Tests: 5 passed, 5 total\n  Time:  ${(Math.random() * 3 + 0.5).toFixed(2)}s`;
    case 'build':
      return `[simulated] Building project...\n\n  Compiled successfully!\n  Output: dist/`;
    default:
      return `[simulated] npm ${args.join(' ')}`;
  }
}

async function simulateGit(args: string[]): Promise<string> {
  const subcommand = args[0];
  switch (subcommand) {
    case 'status':
      return `On branch main\nYour branch is up to date with 'origin/main'.\n\nnothing to commit, working tree clean`;
    case 'log':
      return `commit abc1234 (HEAD -> main)\nAuthor: Agent <agent@example.com>\nDate:   ${new Date().toISOString()}\n\n    Initial commit`;
    case 'diff':
      return `[simulated] No changes detected`;
    case 'add':
      return `[simulated] Staged: ${args.slice(1).join(', ') || 'all files'}`;
    case 'commit':
      return `[simulated] Created commit with message: ${args.slice(2).join(' ')}`;
    default:
      return `[simulated] git ${args.join(' ')}`;
  }
}

// ============================================================================
// Execute Command Tool
// ============================================================================

export const executeCommandTool = defineTool({
  name: 'execute_command',
  description: 'Execute a shell command in the project directory (sandboxed environment)',
  inputSchema: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The command to execute (e.g., "ls -la", "npm install")',
      },
    },
    required: ['command'],
  },
  execute: async (
    input: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> => {
    const commandLine = input.command as string | undefined;

    // Validate required input
    if (!commandLine || typeof commandLine !== 'string') {
      return {
        success: false,
        error: 'Missing or invalid "command" parameter. Please provide a command to execute.',
      };
    }

    const { command, args } = parseCommand(commandLine);
    const cwd = context.workingDirectory || '/';

    // Check if command is allowed
    if (!ALLOWED_COMMANDS.includes(command)) {
      return {
        success: false,
        error: `Command not allowed: ${command}. Allowed commands: ${ALLOWED_COMMANDS.join(', ')}`,
      };
    }

    try {
      let output: string;

      switch (command) {
        case 'ls':
          output = await simulateLs(args, context, cwd);
          break;
        case 'cat':
          output = await simulateCat(args, context);
          break;
        case 'echo':
          output = await simulateEcho(args);
          break;
        case 'pwd':
          output = await simulatePwd(cwd);
          break;
        case 'mkdir':
          output = await simulateMkdir(args, context);
          break;
        case 'touch':
          output = await simulateTouch(args, context);
          break;
        case 'rm':
          output = await simulateRm(args, context);
          break;
        case 'grep':
          output = await simulateGrep(args, context);
          break;
        case 'head':
          output = await simulateHead(args, context);
          break;
        case 'tail':
          output = await simulateTail(args, context);
          break;
        case 'wc':
          output = await simulateWc(args, context);
          break;
        case 'npm':
        case 'npx':
          output = await simulateNpm(args);
          break;
        case 'node':
          output = `[simulated] Node.js execution: ${args.join(' ')}`;
          break;
        case 'tsc':
          output = `[simulated] TypeScript compilation complete. No errors.`;
          break;
        case 'git':
          output = await simulateGit(args);
          break;
        default:
          output = `[simulated] ${commandLine}`;
      }

      return {
        success: true,
        output,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Command execution failed',
      };
    }
  },
});

// ============================================================================
// Export all command tools
// ============================================================================

export const commandTools = [executeCommandTool];
