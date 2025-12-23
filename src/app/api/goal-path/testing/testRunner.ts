/**
 * Test Runner for Goal Path API
 *
 * Executes test configurations against the Claude API
 * and validates responses against expected outcomes.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
    buildLiveFormPrompt,
    buildChatPrompt,
    buildEnhancedPrompt,
    buildOraclePrompt,
    buildSystemMessage,
} from "../lib/promptBuilders";
import {
    validateLiveFormResponse,
    validateChatResponse,
    validateEnhancedResponse,
    validateOracleResponse,
    createAPIError,
    ErrorCodes,
} from "../lib/parsers";
import type {
    TestConfiguration,
    TestResult,
    LiveFormRequest,
    ChatRequest,
    EnhancedRequest,
    OracleRequest,
    LiveFormResponse,
    EnhancedResponse,
} from "../lib/types";
import { getAllTestConfigs, getTestConfigsByVariant } from "./testConfigurations";

// Model configuration
const MODEL_ID = "claude-3-5-haiku-20241022";
const MAX_TOKENS = 4096;
const REQUEST_DELAY_MS = 1000; // 1 second delay between requests for rate limiting

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run a single test configuration
 */
export async function runTest(
    config: TestConfiguration,
    apiKey: string
): Promise<TestResult> {
    const startTime = Date.now();

    try {
        const anthropic = new Anthropic({ apiKey });

        // Build prompt based on variant
        let prompt: string;
        let systemMessage: string;

        switch (config.variant) {
            case "live-form":
                prompt = buildLiveFormPrompt(config.persona.params as LiveFormRequest);
                systemMessage = buildSystemMessage("live-form");
                break;
            case "ai-chat":
                prompt = buildChatPrompt(config.persona.params as ChatRequest);
                systemMessage = buildSystemMessage("ai-chat");
                break;
            case "enhanced":
                prompt = buildEnhancedPrompt(config.persona.params as EnhancedRequest);
                systemMessage = buildSystemMessage("enhanced");
                break;
            case "oracle":
                prompt = buildOraclePrompt(config.persona.params as OracleRequest);
                systemMessage = buildSystemMessage("oracle");
                break;
            default:
                throw new Error(`Unknown variant: ${config.variant}`);
        }

        // Call Claude API
        const message = await anthropic.messages.create({
            model: MODEL_ID,
            max_tokens: MAX_TOKENS,
            system: systemMessage,
            messages: [{ role: "user", content: prompt }],
        });

        const duration = Date.now() - startTime;

        // Extract response content
        const content = message.content[0];
        if (content.type !== "text") {
            return {
                configId: config.id,
                success: false,
                duration,
                tokenUsage: {
                    input: message.usage.input_tokens,
                    output: message.usage.output_tokens,
                    total: message.usage.input_tokens + message.usage.output_tokens,
                },
                error: createAPIError(ErrorCodes.API_ERROR, "Unexpected response format"),
                timestamp: new Date().toISOString(),
            };
        }

        // Validate response based on variant
        let validatedResponse;
        let validationFailures: string[] = [];

        switch (config.variant) {
            case "live-form": {
                const result = validateLiveFormResponse(content.text);
                if (!result.valid) {
                    return {
                        configId: config.id,
                        success: false,
                        duration,
                        tokenUsage: {
                            input: message.usage.input_tokens,
                            output: message.usage.output_tokens,
                            total: message.usage.input_tokens + message.usage.output_tokens,
                        },
                        error: result.error,
                        timestamp: new Date().toISOString(),
                    };
                }
                validatedResponse = result.data;
                validationFailures = validateLiveFormOutcomes(result.data, config.expectedOutcomes);
                break;
            }
            case "ai-chat": {
                const result = validateChatResponse(content.text);
                if (!result.valid) {
                    return {
                        configId: config.id,
                        success: false,
                        duration,
                        tokenUsage: {
                            input: message.usage.input_tokens,
                            output: message.usage.output_tokens,
                            total: message.usage.input_tokens + message.usage.output_tokens,
                        },
                        error: result.error,
                        timestamp: new Date().toISOString(),
                    };
                }
                validatedResponse = result.data;
                break;
            }
            case "enhanced": {
                const result = validateEnhancedResponse(content.text);
                if (!result.valid) {
                    return {
                        configId: config.id,
                        success: false,
                        duration,
                        tokenUsage: {
                            input: message.usage.input_tokens,
                            output: message.usage.output_tokens,
                            total: message.usage.input_tokens + message.usage.output_tokens,
                        },
                        error: result.error,
                        timestamp: new Date().toISOString(),
                    };
                }
                validatedResponse = result.data;
                validationFailures = validateEnhancedOutcomes(result.data, config.expectedOutcomes);
                break;
            }
            case "oracle": {
                const result = validateOracleResponse(content.text);
                if (!result.valid) {
                    return {
                        configId: config.id,
                        success: false,
                        duration,
                        tokenUsage: {
                            input: message.usage.input_tokens,
                            output: message.usage.output_tokens,
                            total: message.usage.input_tokens + message.usage.output_tokens,
                        },
                        error: result.error,
                        timestamp: new Date().toISOString(),
                    };
                }
                validatedResponse = result.data;
                break;
            }
        }

        return {
            configId: config.id,
            success: validationFailures.length === 0,
            duration,
            tokenUsage: {
                input: message.usage.input_tokens,
                output: message.usage.output_tokens,
                total: message.usage.input_tokens + message.usage.output_tokens,
            },
            response: validatedResponse,
            validation: {
                passed: validationFailures.length === 0,
                failures: validationFailures,
            },
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        const duration = Date.now() - startTime;

        return {
            configId: config.id,
            success: false,
            duration,
            tokenUsage: { input: 0, output: 0, total: 0 },
            error: createAPIError(
                ErrorCodes.API_ERROR,
                error instanceof Error ? error.message : "Unknown error"
            ),
            timestamp: new Date().toISOString(),
        };
    }
}

/**
 * Validate Live Form response against expected outcomes
 */
function validateLiveFormOutcomes(
    response: LiveFormResponse,
    expectedOutcomes?: TestConfiguration["expectedOutcomes"]
): string[] {
    const failures: string[] = [];

    if (!expectedOutcomes) return failures;

    if (expectedOutcomes.minModules && response.modules.length < expectedOutcomes.minModules) {
        failures.push(
            `Expected at least ${expectedOutcomes.minModules} modules, got ${response.modules.length}`
        );
    }

    if (expectedOutcomes.maxWeeks && response.estimatedWeeks > expectedOutcomes.maxWeeks) {
        failures.push(
            `Expected at most ${expectedOutcomes.maxWeeks} weeks, got ${response.estimatedWeeks}`
        );
    }

    if (expectedOutcomes.requiredSkills) {
        const allSkills = response.modules.flatMap(m => m.skills.map(s => s.toLowerCase()));
        for (const required of expectedOutcomes.requiredSkills) {
            const found = allSkills.some(s => s.includes(required.toLowerCase()));
            if (!found) {
                failures.push(`Required skill "${required}" not found in path`);
            }
        }
    }

    return failures;
}

/**
 * Validate Enhanced response against expected outcomes
 */
function validateEnhancedOutcomes(
    response: EnhancedResponse,
    expectedOutcomes?: TestConfiguration["expectedOutcomes"]
): string[] {
    const failures: string[] = [];

    if (!expectedOutcomes) return failures;

    if (expectedOutcomes.minModules && response.modules.length < expectedOutcomes.minModules) {
        failures.push(
            `Expected at least ${expectedOutcomes.minModules} modules, got ${response.modules.length}`
        );
    }

    if (expectedOutcomes.maxWeeks && response.estimatedWeeks > expectedOutcomes.maxWeeks) {
        failures.push(
            `Expected at most ${expectedOutcomes.maxWeeks} weeks, got ${response.estimatedWeeks}`
        );
    }

    if (expectedOutcomes.requiredSkills) {
        const allSkills = response.modules.flatMap(m => m.skills.map(s => s.toLowerCase()));
        for (const required of expectedOutcomes.requiredSkills) {
            const found = allSkills.some(s => s.includes(required.toLowerCase()));
            if (!found) {
                failures.push(`Required skill "${required}" not found in path`);
            }
        }
    }

    return failures;
}

/**
 * Run all test configurations
 */
export async function runAllTests(apiKey: string): Promise<{
    results: TestResult[];
    summary: TestRunSummary;
}> {
    const configs = getAllTestConfigs();
    const results: TestResult[] = [];

    for (let i = 0; i < configs.length; i++) {
        const config = configs[i];

        // Run test
        const result = await runTest(config, apiKey);
        results.push(result);

        // Rate limiting delay (except for last test)
        if (i < configs.length - 1) {
            await sleep(REQUEST_DELAY_MS);
        }
    }

    return {
        results,
        summary: calculateSummary(results),
    };
}

/**
 * Run tests for a specific variant
 */
export async function runVariantTests(
    variant: "live-form" | "ai-chat" | "enhanced" | "oracle",
    apiKey: string
): Promise<{
    results: TestResult[];
    summary: TestRunSummary;
}> {
    const configs = getTestConfigsByVariant(variant);
    const results: TestResult[] = [];

    for (let i = 0; i < configs.length; i++) {
        const config = configs[i];

        const result = await runTest(config, apiKey);
        results.push(result);

        if (i < configs.length - 1) {
            await sleep(REQUEST_DELAY_MS);
        }
    }

    return {
        results,
        summary: calculateSummary(results),
    };
}

/**
 * Test run summary
 */
export interface TestRunSummary {
    totalTests: number;
    passed: number;
    failed: number;
    passRate: number;
    avgDuration: number;
    totalTokens: number;
    avgTokensPerTest: number;
    byVariant: Record<string, { passed: number; failed: number }>;
}

/**
 * Calculate summary statistics
 */
function calculateSummary(results: TestResult[]): TestRunSummary {
    const passed = results.filter(r => r.success).length;
    const failed = results.length - passed;

    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const totalTokens = results.reduce((sum, r) => sum + r.tokenUsage.total, 0);

    const byVariant: Record<string, { passed: number; failed: number }> = {};

    for (const result of results) {
        const config = getAllTestConfigs().find(c => c.id === result.configId);
        if (config) {
            if (!byVariant[config.variant]) {
                byVariant[config.variant] = { passed: 0, failed: 0 };
            }
            if (result.success) {
                byVariant[config.variant].passed++;
            } else {
                byVariant[config.variant].failed++;
            }
        }
    }

    return {
        totalTests: results.length,
        passed,
        failed,
        passRate: results.length > 0 ? Math.round((passed / results.length) * 100) : 0,
        avgDuration: results.length > 0 ? Math.round(totalDuration / results.length) : 0,
        totalTokens,
        avgTokensPerTest: results.length > 0 ? Math.round(totalTokens / results.length) : 0,
        byVariant,
    };
}
