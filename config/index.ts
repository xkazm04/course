/**
 * Configuration Module
 *
 * Central export for all configuration.
 */

// LLM Configuration
export {
  // Types
  type ModelConfig,
  type ProviderConfig,
  type RateLimitTier,
  type AgentConfig,
  // Model definitions
  anthropicModels,
  openaiModels,
  googleModels,
  // Provider registry
  providers,
  // Defaults
  defaultProvider,
  defaultModel,
  defaultAgentConfig,
  // Rate limits
  rateLimitTiers,
  // Helpers
  getProviderConfig,
  getModelConfig,
  getDefaultProviderConfig,
  getDefaultModelConfig,
  getRateLimitTier,
  listAllModels,
} from './llm';
