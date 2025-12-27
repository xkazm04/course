// Project Storage - LocalStorage for remix project state

import {
    createLocalStorage,
    createArrayStorage,
    generateId,
} from "@/app/shared/lib/storageFactory";
import {
    Assignment,
    AssignmentStatus,
    UserFork,
    ModifiedFile,
    Submission,
} from "./types";

// User's active assignments
export const assignmentsStorage = createArrayStorage<Assignment>({
    storageKey: "remix-assignments",
});

// User's forks (modified project files)
export const forksStorage = createArrayStorage<UserFork>({
    storageKey: "remix-forks",
});

// User's submissions
export const submissionsStorage = createArrayStorage<Submission>({
    storageKey: "remix-submissions",
});

// Assignment progress tracking
interface AssignmentProgress {
    assignmentId: string;
    startedAt: string;
    lastActivityAt: string;
    objectivesCompleted: string[];
    hintsRevealed: string[];
    timeSpentMinutes: number;
}

export const progressStorage = createArrayStorage<AssignmentProgress>({
    storageKey: "remix-progress",
});

// Claim an assignment
export function claimAssignment(assignment: Assignment): Assignment {
    const claimed: Assignment = {
        ...assignment,
        id: generateId(),
        status: "in_progress",
        startedAt: new Date().toISOString(),
    };

    assignmentsStorage.add(claimed);

    // Create initial progress
    progressStorage.add({
        assignmentId: claimed.id,
        startedAt: claimed.startedAt!,
        lastActivityAt: claimed.startedAt!,
        objectivesCompleted: [],
        hintsRevealed: [],
        timeSpentMinutes: 0,
    });

    return claimed;
}

// Create a fork for an assignment
export function createFork(assignmentId: string, files: ModifiedFile[]): UserFork {
    const fork: UserFork = {
        id: generateId(),
        assignmentId,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        files,
    };

    forksStorage.add(fork);

    // Update assignment with fork reference
    assignmentsStorage.updateEntity(assignmentId, { userFork: fork });

    return fork;
}

// Update fork files
export function updateForkFile(forkId: string, filePath: string, content: string): void {
    const fork = forksStorage.getById(forkId);
    if (!fork) return;

    const updatedFiles = fork.files.map((file) => {
        if (file.path === filePath) {
            return {
                ...file,
                currentContent: content,
                changeCount: file.changeCount + 1,
            };
        }
        return file;
    });

    forksStorage.updateEntity(forkId, {
        files: updatedFiles,
        lastModified: new Date().toISOString(),
    });

    // Update progress
    const progress = progressStorage.getAll().find((p) => {
        const assignment = assignmentsStorage.getById(p.assignmentId);
        return assignment?.userFork?.id === forkId;
    });

    if (progress) {
        progressStorage.updateEntity(progress.assignmentId, {
            lastActivityAt: new Date().toISOString(),
        });
    }
}

// Get fork for assignment
export function getForkForAssignment(assignmentId: string): UserFork | null {
    return forksStorage.getAll().find((f) => f.assignmentId === assignmentId) || null;
}

// Reveal a hint
export function revealHint(assignmentId: string, hintId: string): void {
    const assignment = assignmentsStorage.getById(assignmentId);
    if (!assignment) return;

    const updatedHints = assignment.hints.map((h) =>
        h.id === hintId ? { ...h, revealed: true } : h
    );

    assignmentsStorage.updateEntity(assignmentId, { hints: updatedHints });

    // Update progress
    const progress = progressStorage.getAll().find((p) => p.assignmentId === assignmentId);
    if (progress) {
        progressStorage.updateEntity(assignmentId, {
            hintsRevealed: [...progress.hintsRevealed, hintId],
        });
    }
}

// Mark objective as completed
export function markObjectiveCompleted(assignmentId: string, objectiveId: string): void {
    const assignment = assignmentsStorage.getById(assignmentId);
    if (!assignment) return;

    const updatedObjectives = assignment.objectives.map((o) =>
        o.id === objectiveId ? { ...o, completed: true } : o
    );

    assignmentsStorage.updateEntity(assignmentId, { objectives: updatedObjectives });

    // Update progress
    const progress = progressStorage.getAll().find((p) => p.assignmentId === assignmentId);
    if (progress && !progress.objectivesCompleted.includes(objectiveId)) {
        progressStorage.updateEntity(assignmentId, {
            objectivesCompleted: [...progress.objectivesCompleted, objectiveId],
        });
    }
}

// Submit assignment
export function submitAssignment(assignmentId: string, submission: Omit<Submission, "id">): Submission {
    const fullSubmission: Submission = {
        ...submission,
        id: generateId(),
    };

    submissionsStorage.add(fullSubmission);

    assignmentsStorage.updateEntity(assignmentId, {
        status: "submitted",
        submittedAt: new Date().toISOString(),
        submission: fullSubmission,
    });

    return fullSubmission;
}

// Get user's assignments
export function getUserAssignments(): Assignment[] {
    return assignmentsStorage.getAll();
}

// Get assignment by ID
export function getAssignment(id: string): Assignment | null {
    return assignmentsStorage.getById(id);
}

// Get user's submissions
export function getUserSubmissions(): Submission[] {
    return submissionsStorage.getAll();
}

// Get progress for assignment
export function getAssignmentProgress(assignmentId: string): AssignmentProgress | null {
    return progressStorage.getAll().find((p) => p.assignmentId === assignmentId) || null;
}

// Update time spent
export function updateTimeSpent(assignmentId: string, additionalMinutes: number): void {
    const progress = progressStorage.getAll().find((p) => p.assignmentId === assignmentId);
    if (progress) {
        progressStorage.updateEntity(assignmentId, {
            timeSpentMinutes: progress.timeSpentMinutes + additionalMinutes,
            lastActivityAt: new Date().toISOString(),
        });
    }
}
