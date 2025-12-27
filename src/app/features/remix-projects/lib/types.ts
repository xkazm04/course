// Remix Projects Feature Types

// Project Domain and Type
export type ProjectDomain =
    | "web_app"
    | "api"
    | "cli_tool"
    | "mobile_app"
    | "data_pipeline"
    | "library";

export type ProjectDifficulty = "beginner" | "intermediate" | "advanced";

// Tech Stack
export interface TechStack {
    language: string;
    runtime?: string;
    framework?: string;
    database?: string;
    testing?: string;
    styling?: string;
}

// Code Location
export interface CodeLocation {
    file: string;
    startLine: number;
    endLine: number;
}

// File Issues
export type IssueType = "bug" | "smell" | "performance" | "security" | "style";
export type IssueSeverity = "low" | "medium" | "high" | "critical";

export interface FileIssue {
    line: number;
    type: IssueType;
    severity: IssueSeverity;
    description: string;
    isIntentional: boolean;
}

// Project File
export interface ProjectFile {
    path: string;
    content: string;
    language: string;
    linesOfCode: number;
    complexity: number;
    issues: FileIssue[];
}

// Directory Structure
export interface DirectoryNode {
    name: string;
    type: "file" | "directory";
    path: string;
    children?: DirectoryNode[];
    language?: string;
}

// Project Repository
export interface ProjectRepository {
    files: ProjectFile[];
    readme: string;
    structure: DirectoryNode;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    scripts: Record<string, string>;
}

// Known Issues
export type KnownIssueType = "bug" | "performance" | "security" | "ux";

export interface KnownIssue {
    id: string;
    type: KnownIssueType;
    title: string;
    description: string;
    location: CodeLocation;
    difficulty: "easy" | "medium" | "hard";
    hints?: string[];
}

// Code Smells
export type SmellType =
    | "duplication"
    | "long_method"
    | "large_class"
    | "god_object"
    | "feature_envy"
    | "data_clump"
    | "primitive_obsession"
    | "dead_code"
    | "inappropriate_naming"
    | "missing_abstraction";

export interface CodeSmell {
    id: string;
    type: SmellType;
    location: CodeLocation;
    description: string;
    suggestedRefactoring?: string;
}

// Missing Features
export interface MissingFeature {
    id: string;
    title: string;
    description: string;
    userStory: string;
    acceptanceCriteria: string[];
    difficulty: "easy" | "medium" | "hard";
    suggestedApproach?: string;
}

// Previous Developer Persona
export interface DeveloperPersona {
    name: string;
    avatar: string;
    experience: string;
    style: string;
    timeConstraints: string;
    knownWeaknesses: string[];
    backstory: string;
}

// Seed Project
export interface SeedProject {
    id: string;
    name: string;
    description: string;
    version: number;
    domain: ProjectDomain;
    difficulty: ProjectDifficulty;
    estimatedHours: number;
    repository: ProjectRepository;
    techStack: TechStack;
    knownIssues: KnownIssue[];
    codeSmells: CodeSmell[];
    missingFeatures: MissingFeature[];
    previousDeveloper: DeveloperPersona;
    projectHistory: string;
    createdAt: string;
    parentProjectId?: string;
    contributorCount: number;
    timesAssigned: number;
    avgCompletionRate: number;
}

// Assignment Types
export type AssignmentType =
    | "refactor"
    | "fix_bug"
    | "add_feature"
    | "improve_perf"
    | "add_tests"
    | "security_fix"
    | "documentation"
    | "upgrade"
    | "mixed";

export type AssignmentStatus = "not_started" | "in_progress" | "submitted" | "reviewed";

export type VerificationMethod = "automated" | "llm_review" | "peer_review";

// Assignment Objective
export interface AssignmentObjective {
    id: string;
    description: string;
    required: boolean;
    verificationMethod: VerificationMethod;
    weight: number;
    completed?: boolean;
}

// Assignment Hint
export interface AssignmentHint {
    id: string;
    revealOrder: number;
    content: string;
    penaltyPercent: number;
    revealed: boolean;
}

// Modified File
export interface ModifiedFile {
    path: string;
    originalContent: string;
    currentContent: string;
    changeCount: number;
}

// User Fork
export interface UserFork {
    id: string;
    assignmentId: string;
    createdAt: string;
    lastModified: string;
    files: ModifiedFile[];
}

// Assignment
export interface Assignment {
    id: string;
    userId: string;
    seedProjectId: string;
    type: AssignmentType;
    title: string;
    description: string;
    objectives: AssignmentObjective[];
    constraints: string[];
    previousDevContext: string;
    hints: AssignmentHint[];
    status: AssignmentStatus;
    startedAt?: string;
    submittedAt?: string;
    userFork?: UserFork;
    submission?: Submission;
}

// Diff Types
export interface DiffHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    content: string;
}

export interface FileChange {
    path: string;
    type: "modified" | "added" | "deleted" | "renamed";
    hunks: DiffHunk[];
    linesAdded: number;
    linesRemoved: number;
}

export interface ProjectDiff {
    filesModified: number;
    filesAdded: number;
    filesDeleted: number;
    linesAdded: number;
    linesRemoved: number;
    changes: FileChange[];
}

// Submission Analysis
export interface ObjectiveResult {
    objectiveId: string;
    met: boolean;
    evidence: string;
    confidence: number;
}

export interface Regression {
    type: "functionality" | "test" | "performance" | "security";
    description: string;
    severity: "minor" | "moderate" | "major" | "critical";
    location?: CodeLocation;
}

export interface QualityDelta {
    complexityChange: number;
    duplicationChange: number;
    testCoverageChange: number;
    lintErrorsChange: number;
    typeErrorsChange: number;
    overallTrend: "improved" | "stable" | "degraded";
}

export interface UnnecessaryChange {
    file: string;
    description: string;
    recommendation: string;
}

export interface ScopeAssessment {
    appropriateScope: boolean;
    unnecessaryChanges: UnnecessaryChange[];
    missedOpportunities: string[];
}

export interface SubmissionAnalysis {
    objectivesMet: ObjectiveResult[];
    regressions: Regression[];
    testsPassingBefore: number;
    testsPassingAfter: number;
    qualityDelta: QualityDelta;
    scopeAssessment: ScopeAssessment;
}

// Submission Scores
export interface SubmissionScores {
    overall: number;
    objectivesScore: number;
    qualityScore: number;
    scopeScore: number;
    bonusPoints: number;
    penalties: number;
}

// Submission
export interface Submission {
    id: string;
    assignmentId: string;
    forkId: string;
    submittedAt: string;
    diff: ProjectDiff;
    analysis: SubmissionAnalysis;
    scores: SubmissionScores;
    feedback?: string;
}

// Quality Metrics
export interface QualityMetrics {
    complexity: number;
    testCoverage: number;
    duplication: number;
    lintErrors: number;
    documentationCoverage: number;
    securityIssues: number;
}

// Evolution
export interface QualitySnapshot {
    generation: number;
    timestamp: string;
    metrics: QualityMetrics;
}

export interface EvolutionContribution {
    submissionId: string;
    userId: string;
    userName: string;
    generation: number;
    acceptedAt: string;
    improvements: string[];
    qualityImpact: number;
}

export interface ProjectEvolution {
    projectId: string;
    generation: number;
    evolvedFrom?: string;
    qualityHistory: QualitySnapshot[];
    contributorSubmissions: EvolutionContribution[];
}
