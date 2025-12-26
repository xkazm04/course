/**
 * useLiveProjectCurriculum Hook
 *
 * Integration hook that bridges Live Projects with the curriculum generator system.
 * Converts live project contributions into curriculum-compatible learning experiences.
 */

"use client";

import { useCallback, useMemo } from "react";
import type {
    AnalyzedIssue,
    Contribution,
    LearningPhase,
    PhaseProgress,
    SkillLevel,
} from "./types";
import type {
    GeneratedCurriculum,
    LessonOutline,
    CodeExercise,
    Quiz,
    ProjectSpecification,
    DifficultyLevel,
    GenerationMetadata,
} from "@/app/features/curriculum-generator/lib/types";

// ============================================================================
// TYPES
// ============================================================================

export interface LiveProjectCurriculum {
    /** The converted curriculum */
    curriculum: GeneratedCurriculum;
    /** Progress through the curriculum */
    progress: {
        overallProgress: number;
        lessonsCompleted: number;
        lessonsTotal: number;
        exercisesCompleted: number;
        exercisesTotal: number;
        quizzesCompleted: number;
        quizzesTotal: number;
        projectsCompleted: number;
        projectsTotal: number;
        currentLessonIndex: number;
        timeSpentMinutes: number;
        averageScore: number;
    };
    /** Completed item IDs */
    completedItems: Set<string>;
}

// ============================================================================
// CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert a live project contribution to curriculum format
 */
export function convertToGeneratedCurriculum(
    contribution: Contribution
): GeneratedCurriculum {
    const { analyzedIssue, phaseProgress } = contribution;
    const { issue, learningPath, requiredSkills, difficulty } = analyzedIssue;

    // Convert phases to lessons
    const lessons = learningPath.phases.map((phase, index) =>
        convertPhaseToLesson(phase, index, difficulty.overall)
    );

    // Create exercises from implementation tasks
    const exercises = extractExercises(learningPath.phases, difficulty.overall);

    // Create quiz from checkpoints
    const quizzes = [createQuizFromCheckpoints(learningPath.checkpoints, issue.title)];

    // Create project specification
    const projects = [createProjectSpec(analyzedIssue)];

    // Calculate skills covered
    const skillsCovered = requiredSkills.map((s) => s.name);

    // Calculate total hours
    const totalHours = learningPath.phases.reduce((sum, p) => sum + p.estimatedHours, 0);

    const metadata: GenerationMetadata = {
        generatedAt: contribution.startedAt,
        model: "live-project-analysis",
        version: "1.0.0",
        userProfileSnapshot: {
            currentSkills: skillsCovered,
            targetRole: "Open Source Contributor",
            learningStyle: "hands-on",
            weeklyHours: 10,
        },
        tokenUsage: { input: 0, output: 0, total: 0 },
        useCount: 1,
        lastUpdated: contribution.lastActivityAt,
    };

    return {
        id: `live-project-${contribution.id}`,
        moduleId: issue.id,
        moduleTitle: issue.title,
        targetSkill: issue.repository.language || "Programming",
        userGoal: `Contribute to ${issue.repository.fullName}`,
        currentLevel: mapDifficultyLevel(difficulty.overall),
        lessons,
        exercises,
        quizzes,
        projects,
        metadata,
        totalHours,
        skillsCovered,
    };
}

/**
 * Convert a learning phase to a lesson outline
 */
function convertPhaseToLesson(
    phase: LearningPhase,
    index: number,
    difficulty: string
): LessonOutline {
    return {
        id: phase.id,
        title: phase.title,
        summary: phase.description,
        learningObjectives: phase.tasks.map((t) => t.title),
        sections: [
            {
                id: `${phase.id}-overview`,
                title: "Overview",
                type: "theory",
                content: phase.description,
                tips: phase.mentorshipPrompts,
            },
            {
                id: `${phase.id}-tasks`,
                title: "Tasks",
                type: "practice",
                content: phase.tasks.map((t) => `- ${t.title}: ${t.description}`).join("\n"),
            },
        ],
        keyConcepts: phase.tasks.map((t) => ({
            name: t.title,
            definition: t.description,
        })),
        estimatedMinutes: Math.round(phase.estimatedHours * 60),
        difficulty: mapDifficultyLevel(difficulty),
        prerequisites: index > 0 ? [`phase-${index - 1}`] : [],
        nextLessons: [`phase-${index + 1}`],
    };
}

/**
 * Extract exercises from implementation phases
 */
function extractExercises(phases: LearningPhase[], difficulty: string): CodeExercise[] {
    const implementationPhases = phases.filter((p) =>
        ["implementation", "testing"].includes(p.type)
    );

    return implementationPhases.flatMap((phase, phaseIndex) =>
        phase.tasks.map((task, taskIndex) => ({
            id: `exercise-${phase.id}-${taskIndex}`,
            title: task.title,
            description: task.description,
            language: "typescript", // Would be determined from repo language
            difficulty: mapDifficultyLevel(difficulty),
            type: "from_scratch" as const,
            starterCode: "// Complete this task as part of your contribution",
            solutionCode: "// Your implementation will be the solution",
            testCases: [
                {
                    id: `test-${phase.id}-${taskIndex}`,
                    description: "Your implementation should pass PR review",
                    input: null,
                    expectedOutput: "Approved PR",
                },
            ],
            hints: phase.mentorshipPrompts,
            concepts: [phase.title],
            estimatedMinutes: Math.round((phase.estimatedHours * 60) / phase.tasks.length),
        }))
    );
}

/**
 * Create a quiz from learning checkpoints
 */
function createQuizFromCheckpoints(
    checkpoints: { id: string; title: string; verificationCriteria: string[]; selfAssessment: string[] }[],
    issueTitle: string
): Quiz {
    return {
        id: "checkpoint-quiz",
        title: `${issueTitle} - Checkpoint Assessment`,
        description: "Verify your understanding before submitting your contribution",
        questions: checkpoints.flatMap((checkpoint, cpIndex) =>
            checkpoint.selfAssessment.map((question, qIndex) => ({
                id: `q-${cpIndex}-${qIndex}`,
                type: "true_false" as const,
                question,
                correctAnswer: true,
                explanation: "Verify this with your implementation",
                points: 10,
                concept: checkpoint.title,
            }))
        ),
        passingScore: 80,
        timeLimit: 0,
        topics: checkpoints.map((c) => c.title),
        difficulty: "intermediate" as const,
        shuffleQuestions: false,
        showExplanationsImmediately: true,
    };
}

/**
 * Create a project specification from analyzed issue
 */
function createProjectSpec(analyzed: AnalyzedIssue): ProjectSpecification {
    const { issue, learningPath, requiredSkills, estimatedHours, difficulty } = analyzed;

    return {
        id: `project-${issue.id}`,
        title: issue.title,
        overview: analyzed.analysis.summary,
        description: issue.body || analyzed.analysis.summary,
        goals: analyzed.analysis.requirements,
        technologies: requiredSkills.map((s) => s.name),
        difficulty: mapDifficultyLevel(difficulty.overall),
        estimatedHours,
        milestones: learningPath.phases.map((phase) => ({
            id: phase.id,
            title: phase.title,
            description: phase.description,
            tasks: phase.tasks.map((t) => t.title),
            skillsPracticed: phase.tasks.flatMap((t) => t.aiAssistanceType ? [t.aiAssistanceType] : []),
            estimatedHours: phase.estimatedHours,
            order: phase.order,
        })),
        deliverables: [
            {
                id: "pr-deliverable",
                name: "Pull Request",
                description: "A merged pull request to the repository",
                type: "code",
                requirements: learningPath.successCriteria,
            },
        ],
        starterResources: issue.repository.contributingUrl
            ? [
                  {
                      name: "Contributing Guidelines",
                      type: "documentation",
                      url: issue.repository.contributingUrl,
                      description: "Read the project's contribution guidelines",
                  },
              ]
            : [],
        evaluationCriteria: [
            {
                name: "Code Quality",
                description: "Code follows project conventions and best practices",
                weight: 8,
                rubric: {
                    excellent: "Code is clean, well-documented, and follows all conventions",
                    good: "Code is mostly clean with minor style issues",
                    satisfactory: "Code works but has some quality issues",
                    needsImprovement: "Code has significant quality or style issues",
                },
            },
            {
                name: "PR Review",
                description: "Pull request is approved by maintainers",
                weight: 10,
                rubric: {
                    excellent: "PR approved on first review",
                    good: "PR approved with minor revisions",
                    satisfactory: "PR approved after significant revisions",
                    needsImprovement: "PR not yet approved",
                },
            },
        ],
        stretchGoals: [
            "Add comprehensive tests",
            "Update documentation",
            "Help review other PRs",
        ],
        industryRelevance: `This is a real contribution to ${issue.repository.fullName}, used by developers worldwide.`,
        portfolioDescription: `Contributed to ${issue.repository.fullName}: ${issue.title}`,
    };
}

/**
 * Map difficulty string to DifficultyLevel
 */
function mapDifficultyLevel(difficulty: string): DifficultyLevel {
    const map: Record<string, DifficultyLevel> = {
        beginner: "beginner",
        intermediate: "intermediate",
        advanced: "advanced",
        expert: "expert",
    };
    return map[difficulty] || "intermediate";
}

// ============================================================================
// PROGRESS CALCULATION
// ============================================================================

/**
 * Calculate curriculum progress from contribution progress
 */
export function calculateCurriculumProgress(
    contribution: Contribution,
    curriculum: GeneratedCurriculum
): LiveProjectCurriculum["progress"] {
    const { phaseProgress, mentorSessions, aiAssistanceLog } = contribution;

    // Calculate lesson progress (phases = lessons)
    const lessonsTotal = curriculum.lessons.length;
    const lessonsCompleted = phaseProgress.filter((p) => p.status === "completed").length;

    // Calculate exercise progress
    const exercisesTotal = curriculum.exercises.length;
    const implementationPhases = phaseProgress.filter((p, i) =>
        ["implementation", "testing"].includes(contribution.analyzedIssue.learningPath.phases[i]?.type || "")
    );
    const exercisesCompleted = implementationPhases.filter((p) => p.status === "completed").length;

    // Calculate quiz progress (checkpoints)
    const quizzesTotal = curriculum.quizzes.length;
    const passedCheckpoints = contribution.analyzedIssue.learningPath.checkpoints.filter((c) => c.passed).length;
    const quizzesCompleted = passedCheckpoints > 0 ? 1 : 0;

    // Project progress
    const projectsTotal = 1;
    const projectsCompleted = contribution.status === "merged" ? 1 : 0;

    // Overall progress
    const totalItems = lessonsTotal + exercisesTotal + quizzesTotal + projectsTotal;
    const completedItems = lessonsCompleted + exercisesCompleted + quizzesCompleted + projectsCompleted;
    const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Current lesson index
    const currentPhaseIndex = phaseProgress.findIndex((p) => p.status === "in_progress");
    const currentLessonIndex = currentPhaseIndex >= 0 ? currentPhaseIndex : 0;

    // Time spent
    const timeSpentMinutes = phaseProgress.reduce((sum, p) => sum + p.timeSpentMinutes, 0);

    // Average score (based on AI assistance helpfulness)
    const helpfulCount = aiAssistanceLog.filter((l) => l.wasHelpful === true).length;
    const totalRated = aiAssistanceLog.filter((l) => l.wasHelpful !== undefined).length;
    const averageScore = totalRated > 0 ? Math.round((helpfulCount / totalRated) * 100) : 0;

    return {
        overallProgress,
        lessonsCompleted,
        lessonsTotal,
        exercisesCompleted,
        exercisesTotal,
        quizzesCompleted,
        quizzesTotal,
        projectsCompleted,
        projectsTotal,
        currentLessonIndex,
        timeSpentMinutes,
        averageScore,
    };
}

/**
 * Get completed item IDs from contribution
 */
export function getCompletedItems(contribution: Contribution): Set<string> {
    const completed = new Set<string>();

    // Add completed phases/lessons
    contribution.phaseProgress.forEach((p, index) => {
        if (p.status === "completed") {
            completed.add(p.phaseId);
        }
    });

    // Add completed tasks as exercises
    contribution.analyzedIssue.learningPath.phases.forEach((phase) => {
        phase.tasks.forEach((task, taskIndex) => {
            if (task.completed) {
                completed.add(`exercise-${phase.id}-${taskIndex}`);
            }
        });
    });

    // Add passed checkpoints
    contribution.analyzedIssue.learningPath.checkpoints.forEach((checkpoint) => {
        if (checkpoint.passed) {
            completed.add(checkpoint.id);
        }
    });

    // Add project if merged
    if (contribution.status === "merged") {
        completed.add(`project-${contribution.analyzedIssue.issue.id}`);
    }

    return completed;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to get live project data in curriculum format
 */
export function useLiveProjectCurriculum(
    contribution: Contribution | null
): LiveProjectCurriculum | null {
    return useMemo(() => {
        if (!contribution) return null;

        const curriculum = convertToGeneratedCurriculum(contribution);
        const progress = calculateCurriculumProgress(contribution, curriculum);
        const completedItems = getCompletedItems(contribution);

        return {
            curriculum,
            progress,
            completedItems,
        };
    }, [contribution]);
}

export default useLiveProjectCurriculum;
