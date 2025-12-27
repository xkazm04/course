# Feature Requirement: Remix & Extend Model

## Overview

Implement "The Remix & Extend Model" - a system where users work with intentionally imperfect existing codebases, learning to read, understand, refactor, and extend real-world code rather than only building from scratch.

---

## Business Context

### Philosophy
Real-world development is rarely greenfield. Most developers spend their careers maintaining, extending, and improving existing codebases. Train users on this reality from day one.

### Target Users
- Developers joining existing teams
- Career changers learning to read unfamiliar code
- Those who find blank-page projects intimidating
- Anyone who wants practice with real-world maintenance tasks

### Implementation Priority
**High** - Underserved niche in coding education. Strong differentiator from platforms that only teach greenfield development.

---

## Technical Requirements

### 1. Seed Project Library

**New Feature Module:** `src/app/features/remix-projects/`

```
remix-projects/
├── index.ts
├── lib/
│   ├── types.ts                    # SeedProject, Assignment, Diff types
│   ├── useSeedProject.ts           # Hook for project data
│   ├── useAssignment.ts            # Hook for assignment management
│   ├── diffAnalyzer.ts             # Analyze user changes
│   ├── projectStorage.ts           # Store user's project state
│   ├── qualityGates.ts             # Submission quality checks
│   └── evolutionTracker.ts         # Track project generations
└── components/
    ├── ProjectBrowser.tsx          # Browse seed projects
    ├── ProjectCard.tsx             # Individual project preview
    ├── ProjectDetail.tsx           # Full project overview
    ├── AssignmentPanel.tsx         # Current assignment details
    ├── CodeExplorer.tsx            # Browse project codebase
    ├── DiffViewer.tsx              # Show before/after changes
    ├── PreviousDevContext.tsx      # "Previous developer" backstory
    ├── QualityReport.tsx           # Submission quality analysis
    └── EvolutionTimeline.tsx       # Project history view
```

**Core Data Types:**
```typescript
// src/app/features/remix-projects/lib/types.ts

interface SeedProject {
  id: string;
  name: string;
  description: string;
  version: number; // Generational version

  // Categorization
  domain: ProjectDomain;
  type: ProjectType;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;

  // The codebase
  repository: ProjectRepository;
  techStack: TechStack;

  // Intentional imperfections
  knownIssues: KnownIssue[];
  codeSmells: CodeSmell[];
  missingFeatures: MissingFeature[];

  // Context
  previousDeveloper: DeveloperPersona;
  projectHistory: string;

  // Metadata
  createdAt: Date;
  parentProjectId?: string; // If evolved from another project
  contributorCount: number;
  timesAssigned: number;
  avgCompletionRate: number;
}

type ProjectDomain =
  | 'web_app'
  | 'api'
  | 'cli_tool'
  | 'mobile_app'
  | 'data_pipeline'
  | 'library';

interface ProjectRepository {
  files: ProjectFile[];
  readme: string;
  structure: DirectoryStructure;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
}

interface ProjectFile {
  path: string;
  content: string;
  language: string;
  linesOfCode: number;
  complexity: number; // Cyclomatic complexity
  issues: FileIssue[];
}

interface FileIssue {
  line: number;
  type: 'bug' | 'smell' | 'performance' | 'security' | 'style';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  isIntentional: boolean; // For learning purposes
}

interface KnownIssue {
  id: string;
  type: 'bug' | 'performance' | 'security' | 'ux';
  title: string;
  description: string;
  location: CodeLocation;
  difficulty: 'easy' | 'medium' | 'hard';
  hints?: string[];
}

interface CodeSmell {
  id: string;
  type: SmellType;
  location: CodeLocation;
  description: string;
  suggestedRefactoring?: string;
}

type SmellType =
  | 'duplication'
  | 'long_method'
  | 'large_class'
  | 'god_object'
  | 'feature_envy'
  | 'data_clump'
  | 'primitive_obsession'
  | 'dead_code'
  | 'inappropriate_naming'
  | 'missing_abstraction';

interface MissingFeature {
  id: string;
  title: string;
  description: string;
  userStory: string;
  acceptanceCriteria: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  suggestedApproach?: string;
}

interface DeveloperPersona {
  name: string;
  experience: string;
  style: string;
  timeConstraints: string;
  knownWeaknesses: string[];
  backstory: string;
}

interface CodeLocation {
  file: string;
  startLine: number;
  endLine: number;
}
```

### 2. Assignment Engine

```typescript
interface Assignment {
  id: string;
  userId: string;
  seedProjectId: string;
  type: AssignmentType;

  // The task
  title: string;
  description: string;
  objectives: AssignmentObjective[];
  constraints: string[];

  // Context
  previousDevContext: string;
  hints: AssignmentHint[];

  // Progress
  status: 'not_started' | 'in_progress' | 'submitted' | 'reviewed';
  startedAt?: Date;
  submittedAt?: Date;

  // User's work
  userFork?: UserFork;
  submission?: Submission;
}

type AssignmentType =
  | 'refactor'      // Improve existing code quality
  | 'fix_bug'       // Find and fix specific bug
  | 'add_feature'   // Implement new functionality
  | 'improve_perf'  // Optimize performance
  | 'add_tests'     // Increase test coverage
  | 'security_fix'  // Address security vulnerabilities
  | 'documentation' // Improve docs/comments
  | 'upgrade'       // Update dependencies/patterns
  | 'mixed';        // Combination of above

interface AssignmentObjective {
  id: string;
  description: string;
  required: boolean;
  verificationMethod: 'automated' | 'llm_review' | 'peer_review';
  weight: number;
}

interface AssignmentHint {
  id: string;
  revealOrder: number; // Hints revealed progressively
  content: string;
  penaltyPercent: number; // Score reduction for using hint
  revealed: boolean;
}

interface UserFork {
  id: string;
  assignmentId: string;
  createdAt: Date;
  lastModified: Date;
  files: ModifiedFile[];
  testResults?: TestResults;
}

interface ModifiedFile {
  path: string;
  originalContent: string;
  currentContent: string;
  changeCount: number;
}
```

### 3. Diff Analysis & Evaluation

```typescript
interface Submission {
  id: string;
  assignmentId: string;
  forkId: string;
  submittedAt: Date;

  // The diff
  diff: ProjectDiff;

  // Analysis
  analysis: SubmissionAnalysis;
  scores: SubmissionScores;

  // Feedback
  llmReview?: LLMReview;
  peerReviews?: PeerReview[];
  expertReview?: ExpertReview;
}

interface ProjectDiff {
  filesModified: number;
  filesAdded: number;
  filesDeleted: number;
  linesAdded: number;
  linesRemoved: number;
  changes: FileChange[];
}

interface FileChange {
  path: string;
  type: 'modified' | 'added' | 'deleted' | 'renamed';
  hunks: DiffHunk[];
}

interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  content: string;
}

interface SubmissionAnalysis {
  // Did changes achieve the goal?
  objectivesMet: ObjectiveResult[];

  // Did changes break anything?
  regressions: Regression[];
  testsPassingBefore: number;
  testsPassingAfter: number;

  // Code quality impact
  qualityDelta: QualityDelta;

  // Change appropriateness
  scopeAssessment: ScopeAssessment;
}

interface ObjectiveResult {
  objectiveId: string;
  met: boolean;
  evidence: string;
  confidence: number;
}

interface Regression {
  type: 'functionality' | 'test' | 'performance' | 'security';
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  location?: CodeLocation;
}

interface QualityDelta {
  complexityChange: number;
  duplicationChange: number;
  testCoverageChange: number;
  lintErrorsChange: number;
  typeErrorsChange: number;
  overallTrend: 'improved' | 'stable' | 'degraded';
}

interface ScopeAssessment {
  appropriateScope: boolean;
  unnecessaryChanges: UnnecessaryChange[];
  missedOpportunities: string[];
}

interface UnnecessaryChange {
  file: string;
  description: string;
  recommendation: string;
}
```

### 4. Generational Evolution System

```typescript
interface ProjectEvolution {
  projectId: string;
  generation: number;
  evolvedFrom?: string;

  // Quality trajectory
  qualityHistory: QualitySnapshot[];

  // Contributors
  contributorSubmissions: EvolutionContribution[];
}

interface QualitySnapshot {
  generation: number;
  timestamp: Date;
  metrics: QualityMetrics;
}

interface QualityMetrics {
  complexity: number;
  testCoverage: number;
  duplication: number;
  lintErrors: number;
  documentationCoverage: number;
  securityIssues: number;
}

interface EvolutionContribution {
  submissionId: string;
  userId: string;
  generation: number;
  acceptedAt: Date;
  improvements: string[];
  qualityImpact: number;
}

// Function to promote submission to new seed project
async function evolveProject(
  submission: Submission,
  qualityThreshold: number
): Promise<SeedProject | null> {
  // Only high-quality submissions become new seed projects
  if (submission.scores.overall < qualityThreshold) {
    return null;
  }

  // Create new generation
  const newProject: SeedProject = {
    // ... copy and update from original
    version: original.version + 1,
    parentProjectId: original.id,
    // Apply user's changes to create new base
  };

  return newProject;
}
```

---

## API Endpoints

```
src/app/api/remix/
├── projects/
│   ├── route.ts                    # GET list seed projects
│   └── [projectId]/
│       ├── route.ts                # GET project details
│       ├── files/route.ts          # GET project files
│       └── assignments/route.ts    # GET available assignments
├── assignments/
│   ├── route.ts                    # GET user's assignments
│   ├── claim/route.ts              # POST claim an assignment
│   └── [assignmentId]/
│       ├── route.ts                # GET assignment details
│       ├── fork/route.ts           # POST create fork
│       ├── save/route.ts           # PUT save progress
│       ├── submit/route.ts         # POST submit for review
│       ├── hints/route.ts          # GET hints (with penalty)
│       └── analysis/route.ts       # GET submission analysis
├── review/
│   ├── route.ts                    # LLM review endpoint
│   └── peer/route.ts               # Peer review endpoint
└── evolution/
    └── route.ts                    # GET project evolution history
```

---

## UI/UX Requirements

### New Module Page
Create `src/app/module/remix/page.tsx`

**Variants:**
1. **Browse Projects** - Discover seed projects
2. **My Assignments** - Active and completed work
3. **Project Evolution** - See how projects have evolved

### Project Browser Layout
```
┌──────────────────────────────────────────────────────────────┐
│  SEED PROJECT LIBRARY                                        │
│  [All] [Web Apps] [APIs] [CLI] [Mobile]        Difficulty ▼  │
├──────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📦 TaskFlow API                                          │ │
│ │ A REST API for task management - built quickly, needs    │ │
│ │ polish                                                   │ │
│ │                                                          │ │
│ │ Tech: Node.js, Express, PostgreSQL                       │ │
│ │ Difficulty: Intermediate    Est. Time: 4-6 hours         │ │
│ │ Known Issues: 5    Code Smells: 8    Missing: 3          │ │
│ │                                                          │ │
│ │ Previous Dev: "Built this in a hackathon weekend..."     │ │
│ │                                                          │ │
│ │ [View Project] [Start Assignment]                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📦 BlogEngine                                            │ │
│ │ A markdown-based blog platform with potential            │ │
│ │ ...                                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Assignment Workspace Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ TaskFlow API > Add Input Validation                             │
├─────────────────┬───────────────────────────────────────────────┤
│                 │                                               │
│  📁 Project     │  📝 Your Assignment                           │
│  ───────────    │  ──────────────────                           │
│  ▼ src/         │  Add proper input validation across all       │
│    ▼ routes/    │  endpoints. Write tests for your validation   │
│      tasks.js   │  logic. Do not break existing functionality.  │
│      users.js   │                                               │
│    ▼ models/    │  ✓ Objective 1: Validate task creation input  │
│      task.js    │  ○ Objective 2: Validate user registration    │
│    app.js       │  ○ Objective 3: Add validation error messages │
│  ▼ tests/       │  ○ Stretch: Fix one N+1 query                 │
│    tasks.test   │                                               │
│  package.json   │  ─────────────────────────────────────────    │
│  README.md      │                                               │
│                 │  💡 Previous Developer Context:               │
│  ───────────    │  "This was built quickly for a hackathon.     │
│  Quality Issues │   Original developer admits corners were cut   │
│  • No validation│   on error handling and the DB queries are    │
│  • N+1 queries  │   inefficient."                               │
│  • No auth      │                                               │
│                 │  [Hint 1: -5%] [Hint 2: Locked]               │
├─────────────────┴───────────────────────────────────────────────┤
│  // src/routes/tasks.js (Modified)                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 1   const express = require('express');                     ││
│  │ 2   const router = express.Router();                        ││
│  │ 3 + const { validateTask } = require('../validators');      ││
│  │ 4                                                           ││
│  │ 5   router.post('/', (req, res) => {                        ││
│  │ 6 +   const errors = validateTask(req.body);                ││
│  │ 7 +   if (errors.length) return res.status(400).json(...    ││
│  └─────────────────────────────────────────────────────────────┘│
│  [Run Tests: 8/12 passing]  [Analyze Changes]  [Submit]         │
└─────────────────────────────────────────────────────────────────┘
```

### Diff Review Display
```
┌──────────────────────────────────────────────────────────────┐
│  SUBMISSION ANALYSIS                                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Summary: 4 files modified, 127 lines added, 23 removed      │
│                                                              │
│  ✅ Objectives Met                                           │
│  ├─ ✓ Input validation added (confidence: 94%)               │
│  ├─ ✓ Validation tests written (confidence: 88%)             │
│  └─ ✓ Error messages implemented (confidence: 91%)           │
│                                                              │
│  ⚠️ Concerns                                                 │
│  ├─ One test failing that passed before (regression)         │
│  └─ Unnecessary changes in README.md                         │
│                                                              │
│  📊 Quality Impact                                           │
│  ├─ Complexity: +2 (acceptable)                              │
│  ├─ Test Coverage: +12% (good)                               │
│  └─ Lint Errors: -3 (improved)                               │
│                                                              │
│  Overall Score: 87/100                                       │
│  [View Detailed Feedback] [Request Peer Review]              │
└──────────────────────────────────────────────────────────────┘
```

---

## Sample Seed Project Data

```typescript
const sampleSeedProject: SeedProject = {
  id: 'taskflow-api-v1',
  name: 'TaskFlow API',
  description: 'A REST API for task management - functional but rough around the edges',
  version: 1,

  domain: 'api',
  type: 'rest_api',
  difficulty: 'intermediate',
  estimatedHours: 5,

  techStack: {
    language: 'javascript',
    runtime: 'node',
    framework: 'express',
    database: 'postgresql',
    testing: 'jest'
  },

  knownIssues: [
    {
      id: 'issue-1',
      type: 'security',
      title: 'No input validation',
      description: 'All endpoints accept any input without validation',
      location: { file: 'src/routes/tasks.js', startLine: 12, endLine: 25 },
      difficulty: 'medium',
      hints: ['Look at express-validator or joi for validation']
    },
    {
      id: 'issue-2',
      type: 'performance',
      title: 'N+1 query problem',
      description: 'Fetching tasks with users makes N+1 database calls',
      location: { file: 'src/routes/tasks.js', startLine: 45, endLine: 52 },
      difficulty: 'hard'
    }
  ],

  codeSmells: [
    {
      id: 'smell-1',
      type: 'duplication',
      location: { file: 'src/routes/tasks.js', startLine: 15, endLine: 30 },
      description: 'Error handling logic duplicated across routes'
    },
    {
      id: 'smell-2',
      type: 'long_method',
      location: { file: 'src/routes/tasks.js', startLine: 60, endLine: 120 },
      description: 'Task update handler does too many things'
    }
  ],

  missingFeatures: [
    {
      id: 'feature-1',
      title: 'Pagination',
      description: 'GET /tasks returns all tasks - needs pagination',
      userStory: 'As a user, I want to paginate through my tasks',
      acceptanceCriteria: ['Accepts page and limit params', 'Returns total count'],
      difficulty: 'easy'
    }
  ],

  previousDeveloper: {
    name: 'Alex Thompson',
    experience: 'Junior developer, 6 months experience',
    style: 'Fast-paced, gets things working quickly',
    timeConstraints: 'Built this in a 48-hour hackathon',
    knownWeaknesses: ['Error handling', 'Performance optimization'],
    backstory: 'Alex was learning Node.js while building this. The API works but they knew corners were cut. They moved to a different project and this needs someone to clean it up.'
  },

  projectHistory: 'Originally created for a hackathon project. The team won third place but never had time to polish it. Now being considered for production use.',

  createdAt: new Date('2024-01-15'),
  contributorCount: 0,
  timesAssigned: 47,
  avgCompletionRate: 0.78
};
```

---

## Integration with Existing Features

### Code Playground Integration
Use `src/app/features/code-playground/` patterns for:
- File editing interface
- Syntax highlighting
- Multi-file tabs

### Progress Tracking
```typescript
interface RemixProgress {
  projectId: string;
  assignmentId: string;
  status: AssignmentStatus;
  objectivesCompleted: number;
  totalObjectives: number;
  qualityScore: number;
  timeSpent: number; // minutes
}
```

### Skill Development
Map project types to skills:
```typescript
const projectSkillMapping: Record<ProjectDomain, string[]> = {
  api: ['backend', 'database', 'testing'],
  web_app: ['frontend', 'backend', 'database'],
  cli_tool: ['backend', 'devops'],
  mobile_app: ['mobile', 'frontend'],
  data_pipeline: ['database', 'backend', 'devops'],
  library: ['backend', 'testing']
};
```

---

## Risk Mitigations

| Risk | Implementation |
|------|----------------|
| Quality degradation over generations | Implement quality gates; periodic expert review |
| Users want to build "their own thing" | Offer greenfield track option in UI |
| Attribution complexity | Clear licensing; focus on learning over ownership |
| Assignments feel like chores | Frame as detective work; celebrate elegant solutions |

---

## Implementation Order

1. **Phase 1:** Seed project data model + 5-10 curated projects
2. **Phase 2:** Assignment system with basic objectives
3. **Phase 3:** File editing interface (leverage code-playground)
4. **Phase 4:** Diff analysis and basic scoring
5. **Phase 5:** LLM-powered code review
6. **Phase 6:** Peer review system
7. **Phase 7:** Project evolution and quality gates

---

## Files to Reference

- Code editing: `src/app/features/code-playground/`
- File structure: Use similar patterns for file tree display
- Progress: `src/app/features/progress/`
- LLM review: `src/app/api/goal-path/` for API patterns
- Storage: `src/app/features/*/lib/*Storage.ts` patterns
