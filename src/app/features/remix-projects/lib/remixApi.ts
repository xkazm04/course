/**
 * Remix API Client
 * Fetches scanned challenges from the Course platform database
 */

// Database types matching the Supabase schema
export interface ScannedProject {
    id: string;
    name: string;
    source_url?: string;
    language: string;
    framework?: string;
    tech_stack: string[];
    file_count?: number;
    total_lines?: number;
    scanned_at: string;
    challenge_count: number;
}

export interface ScannedChallenge {
    id: string;
    project_id: string;
    type: "bug" | "smell" | "missing_feature" | "security" | "performance";
    severity: "low" | "medium" | "high" | "critical";
    difficulty: "beginner" | "intermediate" | "advanced";
    title: string;
    description: string;
    location: {
        file: string;
        startLine: number;
        endLine: number;
    };
    code_snippet?: string;
    context_before?: string;
    context_after?: string;
    user_instructions: string;
    expected_output: string;
    hints: string[];
    tags: string[];
    estimated_minutes?: number;
    status: "pending" | "approved" | "rejected" | "archived";
    created_at: string;
    project?: ScannedProject;
}

export interface ChallengeAssignment {
    id: string;
    user_id: string;
    challenge_id: string;
    status: "not_started" | "in_progress" | "submitted" | "completed" | "abandoned";
    started_at?: string;
    submitted_at?: string;
    completed_at?: string;
    score?: number;
    hints_used: number;
    time_spent_seconds: number;
    feedback?: {
        strengths: string[];
        improvements: string[];
        overall: string;
    };
    challenge?: ScannedChallenge;
}

export interface ScanSession {
    id: string;
    project_id: string;
    started_at: string;
    completed_at?: string;
    challenges_found: number;
    challenges_submitted: number;
    duration_seconds?: number;
    scan_output?: string;
    project?: ScannedProject;
}

// API response types
interface ApiResponse<T> {
    data?: T;
    error?: string;
}

// Fetch helpers
async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { error: errorData.error || `HTTP ${response.status}` };
        }
        const data = await response.json();
        return { data };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Network error" };
    }
}

async function apiPost<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return { error: errorData.error || `HTTP ${response.status}` };
        }
        const data = await response.json();
        return { data };
    } catch (err) {
        return { error: err instanceof Error ? err.message : "Network error" };
    }
}

// ============================================================================
// Projects API
// ============================================================================

export interface GetProjectsOptions {
    language?: string;
    framework?: string;
}

export async function getScannedProjects(options: GetProjectsOptions = {}): Promise<ApiResponse<{ projects: ScannedProject[] }>> {
    const params = new URLSearchParams();
    if (options.language) params.set("language", options.language);
    if (options.framework) params.set("framework", options.framework);

    const query = params.toString();
    return apiGet(`/api/remix/projects${query ? `?${query}` : ""}`);
}

export async function getScannedProject(id: string): Promise<ApiResponse<{ project: ScannedProject }>> {
    return apiGet(`/api/remix/projects/${id}`);
}

// ============================================================================
// Challenges API
// ============================================================================

export interface GetChallengesOptions {
    project_id?: string;
    status?: "pending" | "approved" | "rejected" | "archived";
    type?: ScannedChallenge["type"];
    difficulty?: ScannedChallenge["difficulty"];
    limit?: number;
    offset?: number;
}

export async function getApprovedChallenges(options: GetChallengesOptions = {}): Promise<ApiResponse<{ challenges: ScannedChallenge[]; total: number }>> {
    const params = new URLSearchParams();
    params.set("status", "approved"); // Only approved challenges for learners

    if (options.project_id) params.set("project_id", options.project_id);
    if (options.type) params.set("type", options.type);
    if (options.difficulty) params.set("difficulty", options.difficulty);
    if (options.limit) params.set("limit", String(options.limit));
    if (options.offset) params.set("offset", String(options.offset));

    return apiGet(`/api/remix/challenges?${params.toString()}`);
}

export async function getChallengeById(id: string): Promise<ApiResponse<{ challenge: ScannedChallenge }>> {
    return apiGet(`/api/remix/challenges/${id}`);
}

// ============================================================================
// Assignments API (for learners)
// ============================================================================

export async function claimChallenge(challengeId: string): Promise<ApiResponse<{ assignment: ChallengeAssignment }>> {
    return apiPost(`/api/remix/assignments`, { challenge_id: challengeId });
}

export async function getUserAssignments(): Promise<ApiResponse<{ assignments: ChallengeAssignment[] }>> {
    return apiGet(`/api/remix/assignments/me`);
}

export async function getAssignmentById(id: string): Promise<ApiResponse<{ assignment: ChallengeAssignment }>> {
    return apiGet(`/api/remix/assignments/${id}`);
}

export async function updateAssignmentStatus(
    id: string,
    status: ChallengeAssignment["status"],
    data?: { hints_used?: number; time_spent_seconds?: number }
): Promise<ApiResponse<{ assignment: ChallengeAssignment }>> {
    return apiPost(`/api/remix/assignments/${id}/status`, { status, ...data });
}

export async function submitAssignment(
    id: string,
    submission: { code?: string; notes?: string }
): Promise<ApiResponse<{ assignment: ChallengeAssignment; score: number; feedback: ChallengeAssignment["feedback"] }>> {
    return apiPost(`/api/remix/assignments/${id}/submit`, submission);
}

// ============================================================================
// Scans API (for viewing scan history)
// ============================================================================

export async function getScans(): Promise<ApiResponse<{ scans: ScanSession[] }>> {
    return apiGet(`/api/remix/scans`);
}

export async function getScanById(id: string): Promise<ApiResponse<{ scan: ScanSession; challenges: ScannedChallenge[] }>> {
    return apiGet(`/api/remix/scans/${id}`);
}

// ============================================================================
// Topics API (for filtering)
// ============================================================================

export interface Topic {
    id: string;
    name: string;
    slug: string;
    tech_stack: string[];
}

export interface Skill {
    id: string;
    name: string;
    topic_id: string;
}

export async function getTopicsForStack(
    stack: string[],
    language?: string,
    framework?: string
): Promise<ApiResponse<{ topics: Topic[]; skills: Skill[] }>> {
    const params = new URLSearchParams();
    params.set("stack", stack.join(","));
    if (language) params.set("language", language);
    if (framework) params.set("framework", framework);

    return apiGet(`/api/remix/topics?${params.toString()}`);
}

// ============================================================================
// Utility functions for mapping to existing types
// ============================================================================

import type {
    SeedProject,
    Assignment,
    KnownIssue,
    CodeSmell,
    MissingFeature,
    DeveloperPersona
} from "./types";

/**
 * Maps a ScannedChallenge to a KnownIssue for use with existing components
 */
export function challengeToKnownIssue(challenge: ScannedChallenge): KnownIssue {
    return {
        id: challenge.id,
        type: mapChallengeTypeToIssueType(challenge.type),
        title: challenge.title,
        description: challenge.description,
        location: challenge.location,
        difficulty: mapDifficultyToIssueDifficulty(challenge.difficulty),
        hints: challenge.hints,
    };
}

function mapChallengeTypeToIssueType(type: ScannedChallenge["type"]): KnownIssue["type"] {
    switch (type) {
        case "bug": return "bug";
        case "performance": return "performance";
        case "security": return "security";
        default: return "ux"; // missing_feature and smell map to ux
    }
}

function mapDifficultyToIssueDifficulty(difficulty: ScannedChallenge["difficulty"]): KnownIssue["difficulty"] {
    switch (difficulty) {
        case "beginner": return "easy";
        case "intermediate": return "medium";
        case "advanced": return "hard";
    }
}

/**
 * Maps a ScannedChallenge to a CodeSmell for use with existing components
 */
export function challengeToCodeSmell(challenge: ScannedChallenge): CodeSmell | null {
    if (challenge.type !== "smell") return null;

    return {
        id: challenge.id,
        type: "inappropriate_naming", // Default, could be parsed from tags
        location: challenge.location,
        description: challenge.description,
        suggestedRefactoring: challenge.expected_output,
    };
}

/**
 * Maps a ScannedChallenge to a MissingFeature for use with existing components
 */
export function challengeToMissingFeature(challenge: ScannedChallenge): MissingFeature | null {
    if (challenge.type !== "missing_feature") return null;

    return {
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        userStory: challenge.user_instructions,
        acceptanceCriteria: [challenge.expected_output],
        difficulty: mapDifficultyToIssueDifficulty(challenge.difficulty),
        suggestedApproach: challenge.hints?.[0],
    };
}

/**
 * Creates a mock SeedProject from scanned project data for use with existing UI
 */
export function scannedProjectToSeedProject(
    project: ScannedProject,
    challenges: ScannedChallenge[]
): SeedProject {
    const knownIssues = challenges
        .filter(c => ["bug", "security", "performance"].includes(c.type))
        .map(challengeToKnownIssue);

    const codeSmells = challenges
        .filter(c => c.type === "smell")
        .map(challengeToCodeSmell)
        .filter((s): s is CodeSmell => s !== null);

    const missingFeatures = challenges
        .filter(c => c.type === "missing_feature")
        .map(challengeToMissingFeature)
        .filter((f): f is MissingFeature => f !== null);

    // Generate a simple developer persona for scanned projects
    const previousDeveloper: DeveloperPersona = {
        name: "Previous Developer",
        avatar: "/avatars/default.png",
        experience: "Unknown",
        style: "Varied",
        timeConstraints: "Project was inherited from another team",
        knownWeaknesses: [],
        backstory: `This project was discovered through automated scanning. ${challenges.length} potential improvements were identified.`,
    };

    return {
        id: project.id,
        name: project.name,
        description: `Scanned project with ${challenges.length} identified challenges`,
        version: 1,
        domain: "web_app", // Default, could be inferred
        difficulty: inferDifficulty(challenges),
        estimatedHours: Math.ceil(challenges.reduce((sum, c) => sum + (c.estimated_minutes || 30), 0) / 60),
        repository: {
            files: [],
            readme: "",
            structure: { name: project.name, type: "directory", path: "/" },
            dependencies: {},
            devDependencies: {},
            scripts: {},
        },
        techStack: {
            language: project.language,
            framework: project.framework,
        },
        knownIssues,
        codeSmells,
        missingFeatures,
        previousDeveloper,
        projectHistory: `Scanned at ${new Date(project.scanned_at).toLocaleDateString()}`,
        createdAt: project.scanned_at,
        contributorCount: 0,
        timesAssigned: 0,
        avgCompletionRate: 0,
    };
}

function inferDifficulty(challenges: ScannedChallenge[]): SeedProject["difficulty"] {
    const avgDifficulty = challenges.reduce((sum, c) => {
        const score = c.difficulty === "advanced" ? 3 : c.difficulty === "intermediate" ? 2 : 1;
        return sum + score;
    }, 0) / (challenges.length || 1);

    if (avgDifficulty >= 2.5) return "advanced";
    if (avgDifficulty >= 1.5) return "intermediate";
    return "beginner";
}
