/**
 * Tool Registry
 *
 * Central registry for all agent tools.
 * Tools are functions that the AI agent can call to interact with the system.
 */

import type { Tool, ToolResult, ToolContext } from '../types';

// ============================================================================
// Tool Definition Interface
// ============================================================================

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;
}

// ============================================================================
// Tool Registry Class
// ============================================================================

class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  /**
   * Register a new tool
   */
  register(tool: ToolDefinition): void {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool "${tool.name}" is already registered. Overwriting.`);
    }
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * List all registered tools
   */
  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by names (for agent configuration)
   */
  getTools(names: string[]): ToolDefinition[] {
    return names
      .map((name) => this.tools.get(name))
      .filter((tool): tool is ToolDefinition => tool !== undefined);
  }

  /**
   * Convert tools to LLM format (for API calls)
   */
  toToolSchemas(names?: string[]): Tool[] {
    const tools = names ? this.getTools(names) : this.list();
    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }));
  }

  /**
   * Execute a tool by name
   */
  async execute(
    name: string,
    input: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Unknown tool: ${name}`,
      };
    }

    try {
      return await tool.execute(input, context);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Tool execution failed',
      };
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const toolRegistry = new ToolRegistry();

// ============================================================================
// Tool Registration Helper
// ============================================================================

export function defineTool(tool: ToolDefinition): ToolDefinition {
  toolRegistry.register(tool);
  return tool;
}
