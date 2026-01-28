/**
 * AI Agent
 *
 * Orchestrates LLM interactions with tool execution.
 * Handles the agentic loop: LLM -> tool call -> tool result -> LLM...
 */

import { llmRouter } from './router';
import { toolRegistry } from './tools';
import { getVirtualFS } from './tools/virtual-fs';
import { defaultAgentConfig } from '@config/llm';
import type {
  Message,
  Tool,
  ToolCall,
  ToolResult,
  ToolContext,
  AgentConfig,
  AgentContext,
  AgentEvent,
  ChatChunk,
} from './types';

// ============================================================================
// Agent Configuration (from centralized config)
// ============================================================================

export { defaultAgentConfig };

// ============================================================================
// Agent Class
// ============================================================================

export class Agent {
  private config: AgentConfig;
  private userId: string;
  private sessionId: string;

  constructor(
    userId: string,
    sessionId: string,
    config: AgentConfig = defaultAgentConfig
  ) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.config = config;
  }

  /**
   * Run the agent with a user message
   * Yields events as the agent processes the request
   */
  async *chat(
    userMessage: string,
    context: AgentContext
  ): AsyncGenerator<AgentEvent> {
    // Build messages array with history
    const messages = this.buildMessages(userMessage, context);

    // Get available tools
    const tools = toolRegistry.toToolSchemas(this.config.tools);

    // Build tool context
    const toolContext: ToolContext = {
      userId: this.userId,
      sessionId: this.sessionId,
      projectId: context.projectId,
      workingDirectory: context.workingDirectory,
    };

    // Agentic loop - keep processing until no more tool calls
    let continueLoop = true;
    let loopCount = 0;
    const maxLoops = 10; // Prevent infinite loops

    while (continueLoop && loopCount < maxLoops) {
      loopCount++;
      continueLoop = false;

      // Start LLM stream
      const stream = llmRouter.chat(
        this.userId,
        this.config.model.provider,
        this.config.model.model,
        messages,
        {
          system: this.config.systemPrompt,
          tools,
          maxTokens: this.config.maxTokens,
        }
      );

      // Track current state
      const currentToolCalls: Map<string, ToolCall> = new Map();
      let assistantMessage = '';
      let lastToolId: string | null = null;

      // Process stream
      for await (const chunk of stream) {
        if (chunk.type === 'text') {
          assistantMessage += chunk.text;
          yield { type: 'text', text: chunk.text };
        } else if (chunk.type === 'tool_start') {
          lastToolId = chunk.toolId;
          currentToolCalls.set(chunk.toolId, {
            id: chunk.toolId,
            name: chunk.toolName,
            input: '',
          });
          yield {
            type: 'tool_start',
            tool: chunk.toolName,
            input: undefined,
          };
        } else if (chunk.type === 'tool_input') {
          const toolCall = currentToolCalls.get(chunk.toolId);
          if (toolCall) {
            toolCall.input += chunk.partialJson;
          }
        } else if (chunk.type === 'tool_end') {
          const toolCall = currentToolCalls.get(chunk.toolId);
          if (toolCall) {
            // Parse tool input
            let parsedInput: Record<string, unknown> = {};
            try {
              parsedInput = JSON.parse(toolCall.input);
              // Handle nested input structures (e.g., { input: { path: "..." } })
              if (parsedInput.input && typeof parsedInput.input === 'object') {
                parsedInput = parsedInput.input as Record<string, unknown>;
              }
            } catch {
              // Handle invalid JSON - try to extract key-value pairs
              console.warn(`Failed to parse tool input for ${toolCall.name}:`, toolCall.input);
              parsedInput = { raw: toolCall.input };
            }

            // Execute the tool
            const result = await this.executeTool(
              toolCall.name,
              parsedInput,
              toolContext
            );

            yield {
              type: 'tool_result',
              tool: toolCall.name,
              result,
            };

            // Add tool result to messages for next iteration
            // Build assistant message with tool use
            messages.push({
              role: 'assistant',
              content: assistantMessage || `Using tool: ${toolCall.name}`,
            });

            // Add tool result as user message (for next turn)
            messages.push({
              role: 'user',
              content: `Tool "${toolCall.name}" result:\n${result.success ? result.output : `Error: ${result.error}`}`,
            });

            // Continue the loop if there was a tool call
            continueLoop = true;
            assistantMessage = '';
          }
        } else if (chunk.type === 'error') {
          yield { type: 'error', message: chunk.error };
          continueLoop = false;
        }
      }

      // If we got text but no tool calls, we're done
      if (assistantMessage && currentToolCalls.size === 0) {
        continueLoop = false;
      }
    }

    // Done
    yield { type: 'done', sessionId: this.sessionId };
  }

  /**
   * Execute a single tool
   */
  private async executeTool(
    toolName: string,
    input: Record<string, unknown>,
    context: ToolContext
  ): Promise<ToolResult> {
    return toolRegistry.execute(toolName, input, context);
  }

  /**
   * Build messages array including history
   */
  private buildMessages(userMessage: string, context: AgentContext): Message[] {
    const messages: Message[] = [];

    // Add recent messages from context (conversation history)
    if (context.recentMessages) {
      messages.push(...context.recentMessages.slice(-20)); // Keep last 20 messages
    }

    // Add the new user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    return messages;
  }

  /**
   * Get the agent's configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }

  /**
   * Update agent configuration
   */
  updateConfig(updates: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createAgent(
  userId: string,
  sessionId: string,
  config?: Partial<AgentConfig>
): Agent {
  const fullConfig: AgentConfig = {
    ...defaultAgentConfig,
    ...config,
    model: {
      ...defaultAgentConfig.model,
      ...config?.model,
    },
  };
  return new Agent(userId, sessionId, fullConfig);
}
