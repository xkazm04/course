/**
 * Signal Pipeline Feature
 *
 * A unified framework for signal processing pipelines with the pattern:
 * collect → aggregate → transform → decide
 *
 * Features:
 * - Generic SignalPipeline<TInput, TAggregate, TDecision> abstraction
 * - Declarative pipeline configuration
 * - Built-in localStorage persistence
 * - Event replay for state reconstruction
 * - React hooks for reactive usage
 * - Pre-configured presets for common use cases
 *
 * @example
 * ```tsx
 * import { pipeline, useSignalPipeline } from "@/app/features/signal-pipeline";
 *
 * // Define a pipeline with fluent API
 * const config = pipeline("my-pipeline")
 *   .collect((input: MyInput) => ({ type: "event", ...input }))
 *   .aggregate((signals) => computeAggregate(signals))
 *   .decide((aggregate) => makeDecision(aggregate))
 *   .persist({ enabled: true })
 *   .buildConfig();
 *
 * // Use in React component
 * function MyComponent() {
 *   const { push, aggregate, latestDecision } = useSignalPipeline(config);
 *
 *   return (
 *     <button onClick={() => push({ value: 1 })}>
 *       Add Signal
 *     </button>
 *   );
 * }
 * ```
 *
 * @example Using presets
 * ```tsx
 * import {
 *   createLearningPipeline,
 *   useSignalPipeline,
 * } from "@/app/features/signal-pipeline";
 *
 * const learningConfig = createLearningPipeline("course-123", "user-456");
 *
 * function LearningTracker() {
 *   const { push, latestDecision } = useSignalPipeline(learningConfig);
 *
 *   // Push learning signals
 *   push({ type: "quiz", score: 85, sectionId: "section-1" });
 *
 *   // Get comprehension decision
 *   const level = latestDecision?.decision.level; // "beginner" | "intermediate" | "advanced"
 * }
 * ```
 */

// Re-export everything from lib
export * from "./lib";
