/**
 * Learning Conductor Helper Functions
 *
 * Utility functions for behavior analysis, profile updates, and content generation.
 */

import type {
    ConductorConfig,
    LearnerProfile,
    SectionBehavior,
    OrchestrationDecision,
    OrchestrationAction,
    RemedialContent,
} from "../conductorTypes";

// ============================================================================
// Behavior Merging
// ============================================================================

/**
 * Merge behavior updates with existing behavior
 */
export function mergeBehavior(current: SectionBehavior, updates: Partial<SectionBehavior>): SectionBehavior {
    return {
        ...current,
        ...updates,
        video: updates.video ? { ...current.video, ...updates.video } : current.video,
        quiz: updates.quiz ? { ...current.quiz, ...updates.quiz } : current.quiz,
        code: updates.code ? { ...current.code, ...updates.code } : current.code,
    };
}

// ============================================================================
// Decision Priority
// ============================================================================

/**
 * Get priority score for an orchestration action
 */
export function getDecisionPriority(action: OrchestrationAction): number {
    const priorities: Record<OrchestrationAction, number> = {
        inject_remedial: 9,
        suggest_break: 8,
        suggest_peer_solution: 7,
        slow_down: 6,
        add_practice: 5,
        expand_content: 4,
        accelerate: 3,
        reduce_content: 3,
        skip_section: 2,
        reorder_sections: 2,
        celebrate_progress: 1,
    };
    return priorities[action] ?? 5;
}

// ============================================================================
// Behavior Analysis
// ============================================================================

/**
 * Analyze behavior patterns and trigger orchestration decisions
 */
export function analyzeBehaviorForDecisions(
    sectionId: string,
    behavior: SectionBehavior,
    profile: LearnerProfile,
    config: ConductorConfig,
    onDecision: (decision: OrchestrationDecision) => void
): void {
    // Detect struggling learner patterns
    if (behavior.video.pauseCount > 5 && behavior.video.replayCount > 2) {
        onDecision({
            id: `decision-${Date.now()}-struggling`,
            action: "inject_remedial",
            sectionId,
            priority: 9,
            reason: "High pause and replay frequency indicates difficulty understanding content",
            metadata: {
                pauseCount: behavior.video.pauseCount,
                replayCount: behavior.video.replayCount,
            },
            createdAt: Date.now(),
            executed: false,
        });
    }

    // Detect quiz struggles
    if (behavior.quiz.attempts > 3 && behavior.quiz.correctCount === 0) {
        onDecision({
            id: `decision-${Date.now()}-quiz-help`,
            action: "suggest_peer_solution",
            sectionId,
            priority: 8,
            reason: "Multiple incorrect quiz attempts suggest need for alternative explanations",
            metadata: {
                attempts: behavior.quiz.attempts,
                incorrectCount: behavior.quiz.incorrectCount,
            },
            createdAt: Date.now(),
            executed: false,
        });
    }

    // Detect code struggles
    if (behavior.code.errorCount > 5 && behavior.code.successCount === 0) {
        onDecision({
            id: `decision-${Date.now()}-code-help`,
            action: "suggest_peer_solution",
            sectionId,
            priority: 8,
            reason: "Multiple code errors without success suggests need for guidance",
            metadata: {
                errorCount: behavior.code.errorCount,
                errorTypes: behavior.code.errorTypes,
            },
            createdAt: Date.now(),
            executed: false,
        });
    }

    // Detect confident learner (fast progress)
    if (
        behavior.video.completionPercentage > 90 &&
        behavior.video.averageSpeed > 1.5 &&
        behavior.quiz.correctCount > 0 &&
        behavior.quiz.incorrectCount === 0
    ) {
        onDecision({
            id: `decision-${Date.now()}-accelerate`,
            action: "accelerate",
            sectionId,
            priority: 3,
            reason: "High speed completion with quiz success indicates readiness for advancement",
            metadata: {
                speed: behavior.video.averageSpeed,
                quizSuccess: behavior.quiz.correctCount,
            },
            createdAt: Date.now(),
            executed: false,
        });
    }

    // Detect need for break (long session without completion)
    if (behavior.timeSpent > 30 * 60 * 1000 && behavior.scrollDepth < 50) {
        onDecision({
            id: `decision-${Date.now()}-break`,
            action: "suggest_break",
            sectionId,
            priority: 7,
            reason: "Extended session time with low progress suggests fatigue",
            metadata: {
                timeSpentMinutes: Math.round(behavior.timeSpent / 60000),
                scrollDepth: behavior.scrollDepth,
            },
            createdAt: Date.now(),
            executed: false,
        });
    }
}

// ============================================================================
// Profile Analysis
// ============================================================================

/**
 * Linear interpolation utility
 */
export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

/**
 * Analyze behavior and extract profile updates
 */
export function analyzeProfileFromBehavior(
    behavior: SectionBehavior,
    currentProfile: LearnerProfile
): Partial<LearnerProfile> {
    const updates: Partial<LearnerProfile> = {};

    // Update pace based on video behavior
    if (behavior.video.averageSpeed > 1.5 && behavior.video.pauseCount < 2) {
        updates.pace = "fast";
    } else if (behavior.video.averageSpeed < 0.9 || behavior.video.pauseCount > 5) {
        updates.pace = "slow";
    }

    // Update confidence based on quiz performance
    const quizSuccessRate =
        behavior.quiz.attempts > 0
            ? behavior.quiz.correctCount / behavior.quiz.attempts
            : 0;

    if (quizSuccessRate > 0.8 && behavior.quiz.attempts >= 3) {
        updates.confidence = "high";
    } else if (quizSuccessRate < 0.4 && behavior.quiz.attempts >= 3) {
        updates.confidence = "low";
    }

    // Update learning style preferences
    const totalInteraction =
        behavior.video.watchDuration +
        (behavior.quiz.attempts * 30000) + // Assume 30s per quiz attempt
        (behavior.code.codeEdits * 10000); // Assume 10s per code edit

    if (totalInteraction > 0) {
        const videoPreference = behavior.video.watchDuration / totalInteraction;
        const codePreference = (behavior.code.codeEdits * 10000) / totalInteraction;

        updates.learningStyle = {
            ...currentProfile.learningStyle,
            prefersVideo: lerp(currentProfile.learningStyle.prefersVideo, videoPreference, 0.1),
            prefersCode: lerp(currentProfile.learningStyle.prefersCode, codePreference, 0.1),
        };
    }

    // Update engagement score
    const engagementSignals = [
        behavior.scrollDepth / 100,
        Math.min(behavior.quiz.attempts / 5, 1),
        Math.min(behavior.code.codeEdits / 10, 1),
        behavior.video.completionPercentage / 100,
    ];
    const engagementScore = engagementSignals.reduce((sum, s) => sum + s, 0) / engagementSignals.length * 100;
    updates.engagementScore = Math.round(
        lerp(currentProfile.engagementScore, engagementScore, 0.2)
    );

    return updates;
}

// ============================================================================
// Content Generation
// ============================================================================

/**
 * Generate remedial content based on topic and learner profile
 */
export function generateRemedialContent(topic: string, profile: LearnerProfile): RemedialContent[] {
    const baseContent: RemedialContent[] = [
        {
            id: `remedial-${topic}-1`,
            title: `Understanding ${topic} Fundamentals`,
            type: "video",
            topic,
            prerequisiteFor: [topic],
            content: {
                summary: `A beginner-friendly introduction to ${topic} concepts`,
                keyPoints: [
                    `What is ${topic}?`,
                    `Why is ${topic} important?`,
                    `Basic ${topic} patterns`,
                ],
            },
            estimatedTime: "5 min",
        },
        {
            id: `remedial-${topic}-2`,
            title: `${topic} Practice Examples`,
            type: "interactive",
            topic,
            prerequisiteFor: [topic],
            content: {
                summary: `Hands-on practice with ${topic}`,
                keyPoints: ["Step-by-step examples", "Common mistakes to avoid", "Best practices"],
                codeExample: `// Example ${topic} code\nconst example = "${topic}";`,
            },
            estimatedTime: "10 min",
        },
    ];

    // Filter based on profile preferences
    if (profile.learningStyle.prefersVideo > 0.6) {
        return baseContent.filter((c) => c.type === "video" || c.type === "interactive");
    }

    return baseContent;
}
