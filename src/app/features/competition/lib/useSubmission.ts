"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Submission,
    CodeSnapshot,
    DeploymentStatus,
    EvaluationStatus,
    SubmissionScores,
    PerformanceMetrics,
} from "./types";
import {
    submissionsStorage,
    competitionStateStorage,
    saveDraft,
    getDraft,
    getUserSubmission,
    updateUserPoints,
} from "./challengeStorage";
import { getChallengeById } from "./challengeTemplates";
import { calculatePointsFromChallenge } from "./tierSystem";
import { generateId } from "@/app/shared/lib/storageFactory";

interface UseSubmissionOptions {
    challengeId: string;
}

interface UseSubmissionReturn {
    submission: Submission | null;
    draft: string | null;
    isSubmitting: boolean;
    deploymentStatus: DeploymentStatus;
    evaluationStatus: EvaluationStatus;
    scores: SubmissionScores | null;
    saveDraft: (code: string) => void;
    submit: (codeSnapshot: CodeSnapshot) => Promise<Submission>;
    resubmit: (codeSnapshot: CodeSnapshot) => Promise<Submission>;
    getSubmissionHistory: () => Submission[];
}

// Default empty scores
const defaultScores: SubmissionScores = {
    overall: 0,
    breakdown: [],
    metrics: {
        responseTimeP50: 0,
        responseTimeP95: 0,
        responseTimeP99: 0,
        errorRate: 0,
        uptime: 0,
        throughput: 0,
        memoryUsage: 0,
        cpuUsage: 0,
    },
};

export function useSubmission(options: UseSubmissionOptions): UseSubmissionReturn {
    const { challengeId } = options;

    const [submission, setSubmission] = useState<Submission | null>(null);
    const [draft, setDraft] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Load existing submission and draft
    useEffect(() => {
        const existingSubmission = getUserSubmission(challengeId);
        setSubmission(existingSubmission);

        const existingDraft = getDraft(challengeId);
        setDraft(existingDraft);
    }, [challengeId]);

    // Save draft
    const handleSaveDraft = useCallback(
        (code: string) => {
            saveDraft(challengeId, code);
            setDraft(code);
        },
        [challengeId]
    );

    // Create a new submission
    const createSubmission = useCallback(
        async (codeSnapshot: CodeSnapshot, version: number): Promise<Submission> => {
            const state = competitionStateStorage.get();
            const challenge = getChallengeById(challengeId);

            const newSubmission: Submission = {
                id: generateId(),
                challengeId,
                userId: state.userId,
                userName: state.displayName,
                userTier: state.tier,
                codeSnapshot,
                submittedAt: new Date().toISOString(),
                version,
                deploymentStatus: "pending",
                evaluationStatus: "pending",
                scores: defaultScores,
            };

            // Add to storage
            submissionsStorage.add(newSubmission);
            setSubmission(newSubmission);

            // Simulate deployment and evaluation (in production, this would be async)
            await simulateDeploymentAndEvaluation(newSubmission, challenge);

            return newSubmission;
        },
        [challengeId]
    );

    // Submit new code
    const submit = useCallback(
        async (codeSnapshot: CodeSnapshot): Promise<Submission> => {
            setIsSubmitting(true);
            try {
                const newSubmission = await createSubmission(codeSnapshot, 1);
                return newSubmission;
            } finally {
                setIsSubmitting(false);
            }
        },
        [createSubmission]
    );

    // Resubmit (new version)
    const resubmit = useCallback(
        async (codeSnapshot: CodeSnapshot): Promise<Submission> => {
            setIsSubmitting(true);
            try {
                const currentVersion = submission?.version || 0;
                const newSubmission = await createSubmission(codeSnapshot, currentVersion + 1);
                return newSubmission;
            } finally {
                setIsSubmitting(false);
            }
        },
        [createSubmission, submission]
    );

    // Get submission history
    const getSubmissionHistory = useCallback((): Submission[] => {
        const state = competitionStateStorage.get();
        return submissionsStorage
            .getAll()
            .filter((s) => s.challengeId === challengeId && s.userId === state.userId)
            .sort((a, b) => b.version - a.version);
    }, [challengeId]);

    return {
        submission,
        draft,
        isSubmitting,
        deploymentStatus: submission?.deploymentStatus || "pending",
        evaluationStatus: submission?.evaluationStatus || "pending",
        scores: submission?.scores || null,
        saveDraft: handleSaveDraft,
        submit,
        resubmit,
        getSubmissionHistory,
    };
}

// Simulate deployment and evaluation process
async function simulateDeploymentAndEvaluation(
    submission: Submission,
    challenge: ReturnType<typeof getChallengeById>
): Promise<void> {
    // Simulate building
    await updateSubmissionStatus(submission.id, "building", "pending");
    await delay(1000);

    // Simulate deploying
    await updateSubmissionStatus(submission.id, "deploying", "pending");
    await delay(1500);

    // Simulate running
    await updateSubmissionStatus(submission.id, "running", "running");
    await delay(2000);

    // Generate mock scores
    const mockMetrics: PerformanceMetrics = {
        responseTimeP50: 20 + Math.random() * 30,
        responseTimeP95: 40 + Math.random() * 50,
        responseTimeP99: 80 + Math.random() * 100,
        errorRate: Math.random() * 2,
        uptime: 95 + Math.random() * 5,
        throughput: 800 + Math.random() * 700,
        memoryUsage: 30 + Math.random() * 40,
        cpuUsage: 20 + Math.random() * 50,
    };

    const overallScore = 70 + Math.random() * 28;
    const rank = Math.floor(Math.random() * 50) + 1;

    const scores: SubmissionScores = {
        overall: Math.round(overallScore * 10) / 10,
        breakdown: challenge?.evaluationCriteria.map((c) => ({
            criterionId: c.id,
            criterionName: c.name,
            score: Math.round((60 + Math.random() * 40) * 10) / 10,
            maxScore: 100,
            weight: c.weight,
        })) || [],
        metrics: mockMetrics,
    };

    // Update submission with final scores
    submissionsStorage.updateEntity(submission.id, {
        deploymentStatus: "running",
        evaluationStatus: "completed",
        scores,
        rank,
    });

    // Award points if challenge exists
    if (challenge) {
        const updatedSubmission = submissionsStorage.getById(submission.id);
        if (updatedSubmission) {
            const points = calculatePointsFromChallenge(updatedSubmission, challenge);
            updateUserPoints(points);
        }
    }
}

function updateSubmissionStatus(
    id: string,
    deploymentStatus: DeploymentStatus,
    evaluationStatus: EvaluationStatus
): Promise<void> {
    submissionsStorage.updateEntity(id, { deploymentStatus, evaluationStatus });
    return Promise.resolve();
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
