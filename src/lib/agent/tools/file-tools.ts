/**
 * File Tools
 *
 * Tools for reading, writing, and managing files in the virtual filesystem.
 */

import { defineTool } from './registry';
import { getVirtualFS } from './virtual-fs';
import type { ToolResult, ToolContext } from '../types';

// ============================================================================
// Read File Tool
// ============================================================================

export const readFileTool = defineTool({
  name: 'read_file',
  description: 'Read the contents of a file at the specified path',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The file path to read (e.g., "/src/index.ts")',
      },
    },
    required: ['path'],
  },
  execute: async (
    input: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> => {
    const path = input.path as string | undefined;

    // Validate required input
    if (!path || typeof path !== 'string') {
      return {
        success: false,
        error: 'Missing or invalid "path" parameter. Please provide a file path.',
      };
    }

    const projectId = context.projectId || context.sessionId;
    const fs = getVirtualFS(projectId);

    try {
      const content = await fs.readFile(path);
      return {
        success: true,
        output: content,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
      };
    }
  },
});

// ============================================================================
// Write File Tool
// ============================================================================

export const writeFileTool = defineTool({
  name: 'write_file',
  description: 'Write content to a file at the specified path. Creates the file if it does not exist.',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The file path to write (e.g., "/src/utils.ts")',
      },
      content: {
        type: 'string',
        description: 'The content to write to the file',
      },
    },
    required: ['path', 'content'],
  },
  execute: async (
    input: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> => {
    const path = input.path as string | undefined;
    const content = input.content as string | undefined;

    // Validate required inputs
    if (!path || typeof path !== 'string') {
      return {
        success: false,
        error: 'Missing or invalid "path" parameter. Please provide a file path.',
      };
    }
    if (content === undefined || content === null || typeof content !== 'string') {
      return {
        success: false,
        error: 'Missing or invalid "content" parameter. Please provide file content.',
      };
    }

    const projectId = context.projectId || context.sessionId;
    const fs = getVirtualFS(projectId);

    try {
      await fs.writeFile(path, content);
      return {
        success: true,
        output: `Successfully wrote ${content.length} bytes to ${path}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to write file',
      };
    }
  },
});

// ============================================================================
// List Files Tool
// ============================================================================

export const listFilesTool = defineTool({
  name: 'list_files',
  description: 'List files and directories at the specified path',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The directory path to list (default: "/")',
        default: '/',
      },
    },
  },
  execute: async (
    input: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> => {
    const path = (input.path as string) || '/';
    const projectId = context.projectId || context.sessionId;
    const fs = getVirtualFS(projectId);

    try {
      const entries = await fs.readdir(path);
      const formatted = entries
        .map((e) => (e.isDirectory ? `${e.name}/` : e.name))
        .join('\n');

      return {
        success: true,
        output: formatted || '(empty directory)',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list directory',
      };
    }
  },
});

// ============================================================================
// Search Files Tool
// ============================================================================

export const searchFilesTool = defineTool({
  name: 'search_files',
  description: 'Search for a text pattern in files',
  inputSchema: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'The text pattern to search for (supports regex)',
      },
      path: {
        type: 'string',
        description: 'The directory to search in (default: "/")',
        default: '/',
      },
      file_pattern: {
        type: 'string',
        description: 'File glob pattern to filter (e.g., "*.ts", default: "*")',
        default: '*',
      },
    },
    required: ['pattern'],
  },
  execute: async (
    input: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> => {
    const pattern = input.pattern as string;
    const path = (input.path as string) || '/';
    const filePattern = (input.file_pattern as string) || '*';
    const projectId = context.projectId || context.sessionId;
    const fs = getVirtualFS(projectId);

    try {
      const results = await fs.search(pattern, path, filePattern);

      if (results.length === 0) {
        return {
          success: true,
          output: `No matches found for "${pattern}"`,
        };
      }

      const formatted = results
        .slice(0, 50) // Limit results
        .map((r) => `${r.path}:${r.line}: ${r.content}`)
        .join('\n');

      const suffix = results.length > 50 ? `\n... and ${results.length - 50} more matches` : '';

      return {
        success: true,
        output: formatted + suffix,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      };
    }
  },
});

// ============================================================================
// Delete File Tool
// ============================================================================

export const deleteFileTool = defineTool({
  name: 'delete_file',
  description: 'Delete a file or directory at the specified path',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The path to delete',
      },
    },
    required: ['path'],
  },
  execute: async (
    input: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> => {
    const path = input.path as string;
    const projectId = context.projectId || context.sessionId;
    const fs = getVirtualFS(projectId);

    try {
      await fs.delete(path);
      return {
        success: true,
        output: `Successfully deleted ${path}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete',
      };
    }
  },
});

// ============================================================================
// Create Directory Tool
// ============================================================================

export const mkdirTool = defineTool({
  name: 'create_directory',
  description: 'Create a new directory at the specified path',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The directory path to create',
      },
    },
    required: ['path'],
  },
  execute: async (
    input: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> => {
    const path = input.path as string;
    const projectId = context.projectId || context.sessionId;
    const fs = getVirtualFS(projectId);

    try {
      await fs.mkdir(path);
      return {
        success: true,
        output: `Successfully created directory ${path}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create directory',
      };
    }
  },
});

// ============================================================================
// Export all file tools
// ============================================================================

export const fileTools = [
  readFileTool,
  writeFileTool,
  listFilesTool,
  searchFilesTool,
  deleteFileTool,
  mkdirTool,
];
