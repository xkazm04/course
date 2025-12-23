/**
 * Oracle Steps - Modular Step Components
 *
 * This module provides the individual step components used in the
 * AI Career Oracle wizard flow. Each step handles a specific phase
 * of the career analysis process.
 */

// Progress bar
export { OracleProgressBar, stepOrder } from "./OracleProgressBar";
export type { OracleProgressBarProps } from "./OracleProgressBar";

// Welcome step - Introduction and start
export { WelcomeStep } from "./WelcomeStep";
export type { WelcomeStepProps } from "./WelcomeStep";

// Skills step - Skill selection
export { SkillsStep } from "./SkillsStep";
export type { SkillsStepProps } from "./SkillsStep";

// Goal step - Career goal selection
export { GoalStep } from "./GoalStep";
export type { GoalStepProps } from "./GoalStep";

// Preferences step - Learning preferences
export { PreferencesStep } from "./PreferencesStep";
export type { PreferencesStepProps, OraclePreferences } from "./PreferencesStep";

// Analyzing step - Loading/analysis animation
export { AnalyzingStep } from "./AnalyzingStep";
export type { AnalyzingStepProps } from "./AnalyzingStep";

// Insights step - Career intelligence report
export { InsightsStep } from "./InsightsStep";
export type { InsightsStepProps, InsightsStepPredictions } from "./InsightsStep";

// Path step - Learning path timeline
export { PathStep } from "./PathStep";
export type { PathStepProps } from "./PathStep";

// Jobs step - Job opportunities listing
export { JobsStep } from "./JobsStep";
export type { JobsStepProps } from "./JobsStep";
