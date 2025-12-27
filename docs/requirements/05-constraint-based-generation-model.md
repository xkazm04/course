# Feature Requirement: Constraint-Based Generation Model

## Overview

Implement "The Constraint-Based Generation Model" - a system that generates combinations of constraints forcing users to make real engineering trade-offs. The same project template with different constraints creates entirely different learning experiences.

---

## Business Context

### Philosophy
Creativity flourishes within constraints. Instead of generating entire projects, generate combinations of constraints that force users to make real engineering trade-offs. The project emerges from the constraint set.

### Target Users
- Developers who already know basics but need depth
- Those preparing for system design interviews
- Engineers who want to understand trade-offs
- Experienced developers exploring new constraint domains

### Implementation Priority
**Medium-High** - Excellent differentiator for intermediate-to-advanced users. Pairs well with other models (especially Simulation and Remix).

---

## Technical Requirements

### 1. Constraint Taxonomy System

**New Feature Module:** `src/app/features/constraint-challenges/`

```
constraint-challenges/
├── index.ts
├── lib/
│   ├── types.ts                    # Constraint, Challenge, Template types
│   ├── useConstraintChallenge.ts   # Hook for challenge management
│   ├── constraintGenerator.ts      # LLM-powered constraint generation
│   ├── compatibilityChecker.ts     # Ensure constraint sets are achievable
│   ├── evaluationEngine.ts         # Test against constraints
│   ├── challengeStorage.ts         # Store user progress
│   └── tradeoffAnalyzer.ts         # Analyze how user handled trade-offs
└── components/
    ├── ChallengeDashboard.tsx      # Browse challenges
    ├── ConstraintCard.tsx          # Individual constraint display
    ├── ConstraintSetBuilder.tsx    # Custom constraint selection
    ├── TemplateSelector.tsx        # Choose base project type
    ├── DifficultyMeter.tsx         # Visualize challenge difficulty
    ├── TradeoffExplainer.tsx       # Explain constraint implications
    ├── EvaluationReport.tsx        # Constraint fulfillment report
    └── ConstraintHeatmap.tsx       # Visualize constraint domains covered
```

**Core Data Types:**
```typescript
// src/app/features/constraint-challenges/lib/types.ts

// ═══════════════════════════════════════════════════════════
// CONSTRAINT TAXONOMY
// ═══════════════════════════════════════════════════════════

interface Constraint {
  id: string;
  category: ConstraintCategory;
  name: string;
  description: string;
  shortDescription: string;

  // Testability
  verifiable: boolean;
  verificationMethod: VerificationMethod;
  testSpec?: ConstraintTestSpec;

  // Difficulty contribution
  difficultyWeight: number; // 1-10
  skillsRequired: string[];
  learningOutcomes: string[];

  // Compatibility
  incompatibleWith: string[]; // Constraint IDs that conflict
  synergiesWith: string[];    // Constraints that work well together
  prerequisites?: string[];   // Constraints that must also be present

  // Real-world context
  realWorldExample: string;
  commonScenarios: string[];
}

type ConstraintCategory =
  | 'technical'
  | 'resource'
  | 'user'
  | 'business'
  | 'quality';

interface TechnicalConstraint extends Constraint {
  category: 'technical';
  subcategory:
    | 'language'
    | 'framework'
    | 'architecture'
    | 'dependencies'
    | 'patterns';
  specification: TechnicalSpec;
}

interface ResourceConstraint extends Constraint {
  category: 'resource';
  subcategory:
    | 'memory'
    | 'cpu'
    | 'storage'
    | 'bandwidth'
    | 'cost';
  limit: ResourceLimit;
}

interface UserConstraint extends Constraint {
  category: 'user';
  subcategory:
    | 'accessibility'
    | 'internationalization'
    | 'offline'
    | 'performance_perception'
    | 'device_support';
  requirement: UserRequirement;
}

interface BusinessConstraint extends Constraint {
  category: 'business';
  subcategory:
    | 'time'
    | 'team_size'
    | 'maintenance'
    | 'scalability'
    | 'compliance';
  scenario: BusinessScenario;
}

interface QualityConstraint extends Constraint {
  category: 'quality';
  subcategory:
    | 'testing'
    | 'documentation'
    | 'performance'
    | 'security'
    | 'reliability';
  threshold: QualityThreshold;
}

// ═══════════════════════════════════════════════════════════
// VERIFICATION SYSTEM
// ═══════════════════════════════════════════════════════════

type VerificationMethod =
  | 'automated_test'      // Run specific test suite
  | 'performance_bench'   // Run performance benchmarks
  | 'static_analysis'     // Analyze code without running
  | 'accessibility_audit' // Run a11y tools
  | 'llm_assessment'      // LLM evaluates implementation
  | 'manual_checklist';   // User self-reports (honor system)

interface ConstraintTestSpec {
  type: VerificationMethod;

  // For automated tests
  testSuiteId?: string;
  testEndpoints?: TestEndpoint[];

  // For performance benchmarks
  benchmarkConfig?: BenchmarkConfig;

  // For static analysis
  analysisRules?: AnalysisRule[];

  // For LLM assessment
  assessmentPrompt?: string;
  assessmentCriteria?: string[];

  // Pass/fail criteria
  passingCondition: PassingCondition;
}

interface TestEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  payload?: unknown;
  expectedStatus: number;
  maxResponseTimeMs?: number;
}

interface BenchmarkConfig {
  duration: number; // seconds
  concurrency: number;
  requestsPerSecond: number;
  scenarios: BenchmarkScenario[];
}

interface PassingCondition {
  type: 'threshold' | 'comparison' | 'boolean';
  metric?: string;
  operator?: '<' | '<=' | '=' | '>=' | '>';
  value?: number | string | boolean;
}
```

### 2. Constraint Library

```typescript
// ═══════════════════════════════════════════════════════════
// CONSTRAINT LIBRARY (Curated Set)
// ═══════════════════════════════════════════════════════════

const CONSTRAINT_LIBRARY: Constraint[] = [
  // ─────────────────────────────────────────────────────────
  // TECHNICAL CONSTRAINTS
  // ─────────────────────────────────────────────────────────
  {
    id: 'no-deps',
    category: 'technical',
    subcategory: 'dependencies',
    name: 'Zero External Dependencies',
    shortDescription: 'No npm packages',
    description: 'Build using only Node.js built-in modules. No external npm packages allowed.',
    verifiable: true,
    verificationMethod: 'static_analysis',
    difficultyWeight: 7,
    skillsRequired: ['backend', 'algorithms'],
    learningOutcomes: ['Understand what libraries abstract away', 'Build from primitives'],
    incompatibleWith: [],
    synergiesWith: ['resource-memory-128'],
    realWorldExample: 'Embedded systems, security-critical applications',
    commonScenarios: ['Minimizing attack surface', 'Reducing bundle size']
  },
  {
    id: 'single-file',
    category: 'technical',
    subcategory: 'architecture',
    name: 'Single File Challenge',
    shortDescription: 'One file only',
    description: 'Entire application must be contained in a single file (excluding config).',
    verifiable: true,
    verificationMethod: 'static_analysis',
    difficultyWeight: 5,
    skillsRequired: ['code-organization'],
    learningOutcomes: ['Understand trade-offs of file organization'],
    incompatibleWith: ['microservices'],
    synergiesWith: [],
    realWorldExample: 'Serverless functions, simple scripts'
  },
  {
    id: 'no-if-statements',
    category: 'technical',
    subcategory: 'patterns',
    name: 'No Conditionals',
    shortDescription: 'No if/switch/ternary',
    description: 'Solve the problem without using if statements, switch, or ternary operators. Use polymorphism, lookup tables, or functional patterns.',
    verifiable: true,
    verificationMethod: 'static_analysis',
    difficultyWeight: 8,
    skillsRequired: ['design-patterns', 'functional-programming'],
    learningOutcomes: ['Alternative control flow patterns', 'Polymorphism'],
    incompatibleWith: [],
    synergiesWith: []
  },

  // ─────────────────────────────────────────────────────────
  // RESOURCE CONSTRAINTS
  // ─────────────────────────────────────────────────────────
  {
    id: 'memory-128mb',
    category: 'resource',
    subcategory: 'memory',
    name: 'Memory: 128MB Limit',
    shortDescription: '128MB RAM max',
    description: 'Application must run within 128MB of memory at peak load.',
    verifiable: true,
    verificationMethod: 'performance_bench',
    limit: { type: 'memory', value: 128, unit: 'MB' },
    difficultyWeight: 6,
    skillsRequired: ['performance', 'memory-management'],
    learningOutcomes: ['Memory-efficient data structures', 'Streaming patterns'],
    incompatibleWith: [],
    synergiesWith: ['no-deps']
  },
  {
    id: 'zero-cost',
    category: 'resource',
    subcategory: 'cost',
    name: '$0 Monthly Hosting',
    shortDescription: 'Free hosting only',
    description: 'Must be deployable and sustainable on free-tier hosting (Vercel, Cloudflare, Railway free tier, etc.).',
    verifiable: true,
    verificationMethod: 'llm_assessment',
    difficultyWeight: 5,
    skillsRequired: ['devops', 'architecture'],
    learningOutcomes: ['Understanding hosting limitations', 'Cost optimization'],
    incompatibleWith: [],
    synergiesWith: ['edge-computing']
  },
  {
    id: 'response-50ms',
    category: 'resource',
    subcategory: 'cpu',
    name: 'P99 Response < 50ms',
    shortDescription: '50ms latency ceiling',
    description: '99th percentile response time must be under 50 milliseconds.',
    verifiable: true,
    verificationMethod: 'performance_bench',
    limit: { type: 'latency', value: 50, unit: 'ms', percentile: 99 },
    difficultyWeight: 8,
    skillsRequired: ['performance', 'caching', 'database'],
    learningOutcomes: ['Performance optimization', 'Caching strategies'],
    incompatibleWith: [],
    synergiesWith: ['memory-128mb']
  },

  // ─────────────────────────────────────────────────────────
  // USER CONSTRAINTS
  // ─────────────────────────────────────────────────────────
  {
    id: 'wcag-aa',
    category: 'user',
    subcategory: 'accessibility',
    name: 'WCAG 2.1 AA Compliance',
    shortDescription: 'Full accessibility',
    description: 'Application must pass WCAG 2.1 Level AA accessibility audit.',
    verifiable: true,
    verificationMethod: 'accessibility_audit',
    difficultyWeight: 6,
    skillsRequired: ['accessibility', 'frontend'],
    learningOutcomes: ['Accessible design patterns', 'ARIA usage'],
    incompatibleWith: [],
    synergiesWith: ['no-js']
  },
  {
    id: 'no-js',
    category: 'user',
    subcategory: 'accessibility',
    name: 'Works Without JavaScript',
    shortDescription: 'No JS required',
    description: 'Core functionality must work with JavaScript disabled.',
    verifiable: true,
    verificationMethod: 'automated_test',
    difficultyWeight: 7,
    skillsRequired: ['progressive-enhancement', 'backend'],
    learningOutcomes: ['Progressive enhancement', 'Server-side rendering'],
    incompatibleWith: ['spa-only'],
    synergiesWith: ['wcag-aa']
  },
  {
    id: 'offline-first',
    category: 'user',
    subcategory: 'offline',
    name: 'Offline-First Design',
    shortDescription: 'Works offline',
    description: 'Application must be fully functional without network connectivity.',
    verifiable: true,
    verificationMethod: 'automated_test',
    difficultyWeight: 8,
    skillsRequired: ['service-workers', 'indexeddb', 'sync'],
    learningOutcomes: ['Service workers', 'Offline storage', 'Sync patterns'],
    incompatibleWith: [],
    synergiesWith: ['3g-network']
  },
  {
    id: '3g-network',
    category: 'user',
    subcategory: 'performance_perception',
    name: 'Usable on 3G',
    shortDescription: '3G network support',
    description: 'Application must be usable on a 3G connection (download: 750kbps, upload: 250kbps, latency: 100ms).',
    verifiable: true,
    verificationMethod: 'performance_bench',
    difficultyWeight: 6,
    skillsRequired: ['performance', 'optimization'],
    learningOutcomes: ['Asset optimization', 'Lazy loading', 'Critical path'],
    incompatibleWith: [],
    synergiesWith: ['offline-first']
  },
  {
    id: 'i18n-5-languages',
    category: 'user',
    subcategory: 'internationalization',
    name: 'Support 5 Languages',
    shortDescription: '5 language support',
    description: 'Application must support English plus 4 additional languages with proper RTL support.',
    verifiable: true,
    verificationMethod: 'manual_checklist',
    difficultyWeight: 5,
    skillsRequired: ['i18n', 'frontend'],
    learningOutcomes: ['Internationalization patterns', 'RTL layouts'],
    incompatibleWith: [],
    synergiesWith: []
  },

  // ─────────────────────────────────────────────────────────
  // BUSINESS CONSTRAINTS
  // ─────────────────────────────────────────────────────────
  {
    id: 'uptime-999',
    category: 'business',
    subcategory: 'scalability',
    name: '99.9% Uptime',
    shortDescription: '3 nines uptime',
    description: 'Architecture must support 99.9% uptime (8.76 hours downtime/year max).',
    verifiable: true,
    verificationMethod: 'llm_assessment',
    difficultyWeight: 7,
    skillsRequired: ['architecture', 'devops', 'monitoring'],
    learningOutcomes: ['High availability patterns', 'Failover strategies'],
    incompatibleWith: [],
    synergiesWith: []
  },
  {
    id: 'no-vendor-lock',
    category: 'business',
    subcategory: 'maintenance',
    name: 'No Vendor Lock-in',
    shortDescription: 'Vendor portable',
    description: 'Application must be deployable to any major cloud provider without code changes.',
    verifiable: true,
    verificationMethod: 'llm_assessment',
    difficultyWeight: 5,
    skillsRequired: ['architecture', 'devops'],
    learningOutcomes: ['Abstraction layers', 'Portable infrastructure'],
    incompatibleWith: [],
    synergiesWith: ['zero-cost']
  },
  {
    id: 'gdpr-compliant',
    category: 'business',
    subcategory: 'compliance',
    name: 'GDPR Compliance',
    shortDescription: 'GDPR ready',
    description: 'Application must handle user data in GDPR-compliant manner (consent, deletion, export).',
    verifiable: true,
    verificationMethod: 'manual_checklist',
    difficultyWeight: 6,
    skillsRequired: ['security', 'backend', 'database'],
    learningOutcomes: ['Privacy by design', 'Data handling best practices'],
    incompatibleWith: [],
    synergiesWith: []
  },

  // ─────────────────────────────────────────────────────────
  // QUALITY CONSTRAINTS
  // ─────────────────────────────────────────────────────────
  {
    id: 'test-coverage-90',
    category: 'quality',
    subcategory: 'testing',
    name: '90% Test Coverage',
    shortDescription: '90%+ coverage',
    description: 'Code must have at least 90% test coverage with meaningful tests.',
    verifiable: true,
    verificationMethod: 'automated_test',
    difficultyWeight: 5,
    skillsRequired: ['testing'],
    learningOutcomes: ['Test-driven development', 'Coverage strategies'],
    incompatibleWith: [],
    synergiesWith: []
  },
  {
    id: 'type-safe',
    category: 'quality',
    subcategory: 'testing',
    name: 'Strict TypeScript',
    shortDescription: 'Strict TS mode',
    description: 'Must use TypeScript with strict mode and no `any` types.',
    verifiable: true,
    verificationMethod: 'static_analysis',
    difficultyWeight: 4,
    skillsRequired: ['typescript'],
    learningOutcomes: ['Type safety', 'TypeScript advanced patterns'],
    incompatibleWith: ['vanilla-js'],
    synergiesWith: []
  },
  {
    id: 'zero-security-issues',
    category: 'quality',
    subcategory: 'security',
    name: 'Zero Security Issues',
    shortDescription: 'Security audit clean',
    description: 'Must pass security audit with no high or critical vulnerabilities.',
    verifiable: true,
    verificationMethod: 'static_analysis',
    difficultyWeight: 6,
    skillsRequired: ['security'],
    learningOutcomes: ['Secure coding practices', 'Vulnerability prevention'],
    incompatibleWith: [],
    synergiesWith: []
  }
];
```

### 3. Challenge Generation System

```typescript
// ═══════════════════════════════════════════════════════════
// CHALLENGE TEMPLATES
// ═══════════════════════════════════════════════════════════

interface ChallengeTemplate {
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;

  // Base requirements (always present)
  baseRequirements: BaseRequirement[];

  // Starter code
  starterFiles?: StarterFile[];

  // Constraint compatibility
  applicableConstraints: string[]; // Constraint IDs that make sense
  defaultConstraints: string[];    // Suggested starting constraints

  // Difficulty baseline
  baseDifficulty: number; // 1-10 before constraints

  // Estimated time range
  baseTimeHours: { min: number; max: number };
}

type ProjectCategory =
  | 'url_shortener'
  | 'todo_app'
  | 'blog_api'
  | 'auth_system'
  | 'file_uploader'
  | 'real_time_chat'
  | 'rate_limiter'
  | 'cache_layer'
  | 'task_queue'
  | 'search_engine';

interface BaseRequirement {
  id: string;
  description: string;
  acceptance: string[];
}

const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'url-shortener',
    name: 'URL Shortener',
    description: 'Build a URL shortening service',
    category: 'url_shortener',
    baseRequirements: [
      {
        id: 'shorten',
        description: 'Accept a URL and return a shortened version',
        acceptance: ['POST /shorten returns short URL', 'Short URLs redirect to original']
      },
      {
        id: 'redirect',
        description: 'Short URLs redirect to original',
        acceptance: ['GET /:code redirects with 301/302']
      },
      {
        id: 'persist',
        description: 'Shortened URLs persist across restarts',
        acceptance: ['URLs work after server restart']
      }
    ],
    applicableConstraints: [
      'no-deps', 'memory-128mb', 'zero-cost', 'response-50ms',
      'uptime-999', 'test-coverage-90', 'type-safe', 'no-vendor-lock'
    ],
    defaultConstraints: [],
    baseDifficulty: 3,
    baseTimeHours: { min: 2, max: 4 }
  },
  {
    id: 'real-time-chat',
    name: 'Real-Time Chat',
    description: 'Build a real-time messaging application',
    category: 'real_time_chat',
    baseRequirements: [
      {
        id: 'auth',
        description: 'User authentication',
        acceptance: ['Users can sign up', 'Users can log in', 'Sessions persist']
      },
      {
        id: 'realtime',
        description: 'Real-time message delivery',
        acceptance: ['Messages appear without refresh', 'Multiple users see updates']
      },
      {
        id: 'history',
        description: 'Message persistence',
        acceptance: ['Messages survive page refresh', 'Chat history loads on join']
      }
    ],
    applicableConstraints: [
      'memory-128mb', 'response-50ms', 'wcag-aa', 'offline-first',
      '3g-network', 'uptime-999', 'test-coverage-90', 'zero-security-issues'
    ],
    defaultConstraints: [],
    baseDifficulty: 5,
    baseTimeHours: { min: 6, max: 12 }
  }
  // ... more templates
];

// ═══════════════════════════════════════════════════════════
// CHALLENGE GENERATION
// ═══════════════════════════════════════════════════════════

interface GeneratedChallenge {
  id: string;
  templateId: string;
  template: ChallengeTemplate;

  // Selected constraints
  constraints: Constraint[];
  constraintIds: string[];

  // Computed properties
  difficulty: ChallengeDifficulty;
  estimatedHours: number;
  skillsRequired: string[];

  // Context and framing
  scenarioContext?: string; // Optional narrative (pairs with Model 2)
  realWorldRelevance: string;

  // Evaluation
  evaluationPlan: EvaluationPlan;
}

interface ChallengeDifficulty {
  overall: number; // 1-10
  breakdown: {
    technical: number;
    resource: number;
    quality: number;
  };
  label: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface EvaluationPlan {
  constraints: ConstraintEvaluation[];
  baseRequirements: RequirementEvaluation[];
  bonusPoints: BonusEvaluation[];
}

interface ConstraintEvaluation {
  constraintId: string;
  weight: number;
  testSpec: ConstraintTestSpec;
}

// Challenge generator function
async function generateChallenge(
  templateId: string,
  constraintIds: string[],
  userSkillProfile?: UserSkillProfile
): Promise<GeneratedChallenge> {
  const template = CHALLENGE_TEMPLATES.find(t => t.id === templateId);
  const constraints = constraintIds.map(id =>
    CONSTRAINT_LIBRARY.find(c => c.id === id)
  ).filter(Boolean);

  // Check compatibility
  const compatibility = checkConstraintCompatibility(constraints);
  if (!compatibility.valid) {
    throw new Error(`Incompatible constraints: ${compatibility.conflicts.join(', ')}`);
  }

  // Calculate difficulty
  const difficulty = calculateDifficulty(template, constraints, userSkillProfile);

  // Generate evaluation plan
  const evaluationPlan = generateEvaluationPlan(template, constraints);

  return {
    id: generateChallengeId(),
    templateId,
    template,
    constraints,
    constraintIds,
    difficulty,
    estimatedHours: calculateEstimatedHours(template, constraints),
    skillsRequired: aggregateSkills(template, constraints),
    realWorldRelevance: generateRelevanceStatement(constraints),
    evaluationPlan
  };
}

function checkConstraintCompatibility(constraints: Constraint[]): CompatibilityResult {
  const conflicts: string[] = [];

  for (const constraint of constraints) {
    for (const otherId of constraint.incompatibleWith) {
      if (constraints.some(c => c.id === otherId)) {
        conflicts.push(`${constraint.id} conflicts with ${otherId}`);
      }
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
    synergies: findSynergies(constraints)
  };
}
```

### 4. Constraint-Aware Evaluation

```typescript
// ═══════════════════════════════════════════════════════════
// EVALUATION ENGINE
// ═══════════════════════════════════════════════════════════

interface ChallengeSubmission {
  id: string;
  challengeId: string;
  userId: string;
  submittedAt: Date;

  // Code
  code: CodeSnapshot;
  deploymentUrl?: string;

  // Self-reported
  hoursSpent: number;
  approachNotes: string;
  tradeoffDecisions: TradeoffDecision[];
}

interface TradeoffDecision {
  constraintId: string;
  decision: string;
  reasoning: string;
  alternatives: string[];
}

interface EvaluationResult {
  submissionId: string;
  challengeId: string;

  // Overall
  passed: boolean;
  score: number; // 0-100

  // Base requirements
  requirementResults: RequirementResult[];

  // Constraint results
  constraintResults: ConstraintResult[];

  // Trade-off analysis
  tradeoffAnalysis: TradeoffAnalysis;

  // Feedback
  feedback: EvaluationFeedback;
}

interface ConstraintResult {
  constraintId: string;
  constraintName: string;
  passed: boolean;
  score: number; // 0-100
  evidence: string;
  metrics?: Record<string, number>;
  suggestions?: string[];
}

interface TradeoffAnalysis {
  identified: IdentifiedTradeoff[];
  eleganceScore: number; // How well did they handle trade-offs
  insights: string[];
}

interface IdentifiedTradeoff {
  description: string;
  constraintsInvolved: string[];
  userApproach: string;
  alternativeApproaches: string[];
  assessedQuality: 'poor' | 'acceptable' | 'good' | 'excellent';
}

interface EvaluationFeedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  learningResources: LearningResource[];
  nextChallengeRecommendations: string[];
}

// Evaluation function
async function evaluateSubmission(
  submission: ChallengeSubmission,
  challenge: GeneratedChallenge
): Promise<EvaluationResult> {
  const results: ConstraintResult[] = [];

  // Evaluate each constraint
  for (const constraint of challenge.constraints) {
    const result = await evaluateConstraint(
      submission,
      constraint,
      challenge.evaluationPlan.constraints.find(e => e.constraintId === constraint.id)
    );
    results.push(result);
  }

  // Analyze trade-offs using LLM
  const tradeoffAnalysis = await analyzeTradeoffs(
    submission,
    challenge,
    results
  );

  // Generate feedback
  const feedback = await generateFeedback(
    submission,
    challenge,
    results,
    tradeoffAnalysis
  );

  return {
    submissionId: submission.id,
    challengeId: challenge.id,
    passed: results.every(r => r.passed),
    score: calculateOverallScore(results, tradeoffAnalysis),
    requirementResults: [],
    constraintResults: results,
    tradeoffAnalysis,
    feedback
  };
}

async function evaluateConstraint(
  submission: ChallengeSubmission,
  constraint: Constraint,
  evalSpec: ConstraintEvaluation
): Promise<ConstraintResult> {
  switch (constraint.verificationMethod) {
    case 'automated_test':
      return runAutomatedTests(submission, constraint, evalSpec);
    case 'performance_bench':
      return runPerformanceBenchmark(submission, constraint, evalSpec);
    case 'static_analysis':
      return runStaticAnalysis(submission, constraint, evalSpec);
    case 'accessibility_audit':
      return runAccessibilityAudit(submission, constraint, evalSpec);
    case 'llm_assessment':
      return runLLMAssessment(submission, constraint, evalSpec);
    case 'manual_checklist':
      return evaluateManualChecklist(submission, constraint, evalSpec);
  }
}
```

---

## API Endpoints

```
src/app/api/constraints/
├── library/
│   └── route.ts                    # GET all constraints
├── templates/
│   ├── route.ts                    # GET all templates
│   └── [templateId]/route.ts       # GET template details
├── challenges/
│   ├── route.ts                    # POST generate challenge
│   ├── [challengeId]/
│   │   ├── route.ts                # GET challenge details
│   │   └── submit/route.ts         # POST submit solution
│   └── custom/route.ts             # POST create custom constraint set
├── evaluate/
│   ├── route.ts                    # POST evaluate submission
│   └── stream/route.ts             # Streaming evaluation results
└── compatibility/
    └── route.ts                    # POST check constraint compatibility
```

---

## UI/UX Requirements

### New Module Page
Create `src/app/module/constraints/page.tsx`

**Variants:**
1. **Challenge Browser** - Pre-built challenges with constraint sets
2. **Challenge Builder** - Create custom constraint combinations
3. **My Challenges** - Track progress on challenges

### Challenge Builder Interface
```
┌──────────────────────────────────────────────────────────────┐
│  BUILD YOUR CHALLENGE                                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: Choose Template                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │   URL    │ │   Chat   │ │   Blog   │ │   Auth   │        │
│  │Shortener │ │   App    │ │   API    │ │  System  │        │
│  │    ✓     │ │          │ │          │ │          │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  Step 2: Add Constraints                                     │
│                                                              │
│  TECHNICAL              RESOURCE               USER          │
│  ┌─────────────────┐   ┌─────────────────┐   ┌────────────┐ │
│  │ ☐ No Dependencies│   │ ☐ 128MB Memory  │   │ ☐ WCAG AA  │ │
│  │ ☐ Single File    │   │ ☑ $0 Hosting    │   │ ☑ No JS    │ │
│  │ ☐ No Conditionals│   │ ☑ <50ms P99     │   │ ☐ Offline  │ │
│  └─────────────────┘   └─────────────────┘   └────────────┘ │
│                                                              │
│  BUSINESS              QUALITY                               │
│  ┌─────────────────┐   ┌─────────────────┐                  │
│  │ ☐ 99.9% Uptime  │   │ ☑ 90% Coverage  │                  │
│  │ ☐ No Lock-in    │   │ ☐ Strict TS     │                  │
│  │ ☐ GDPR Ready    │   │ ☐ Zero Security │                  │
│  └─────────────────┘   └─────────────────┘                  │
│                                                              │
│  ─────────────────────────────────────────────────────────── │
│                                                              │
│  DIFFICULTY PREVIEW                                          │
│  ████████████████░░░░░░░░░░  65/100 (Advanced)              │
│                                                              │
│  ⚠️ Trade-off Alert: "$0 Hosting" + "<50ms P99" requires    │
│     careful caching strategy                                 │
│                                                              │
│  Estimated Time: 6-10 hours                                  │
│  Skills Required: backend, caching, performance              │
│                                                              │
│  [Start Challenge]                                           │
└──────────────────────────────────────────────────────────────┘
```

### Challenge Progress Display
```
┌──────────────────────────────────────────────────────────────┐
│  URL Shortener: The Hostile Environment                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  CONSTRAINTS                                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ✅ Zero Dependencies      Verified: No node_modules     │ │
│  │ ✅ 128MB Memory           Peak: 87MB                    │ │
│  │ ⚠️ <50ms P99             Current: 62ms (needs work)    │ │
│  │ ⏳ Database Unavailable   Not tested yet                │ │
│  │ ⏳ 1000 req/sec          Not tested yet                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  TRADE-OFFS YOU'VE MADE                                      │
│  • Using LRU cache to avoid database reads (memory ↔ speed) │
│  • Sync file writes with graceful degradation                │
│                                                              │
│  [Run Full Evaluation] [Document Trade-off] [Submit]         │
└──────────────────────────────────────────────────────────────┘
```

---

## Sample Challenge Sets

```typescript
const CURATED_CHALLENGE_SETS = [
  {
    id: 'hostile-environment',
    name: 'The Hostile Environment',
    description: 'Build under severe resource constraints',
    template: 'url-shortener',
    constraints: ['no-deps', 'memory-128mb', 'response-50ms', 'offline-first'],
    difficulty: 'expert',
    learningFocus: 'Performance optimization, resource management'
  },
  {
    id: 'inclusive-design',
    name: 'The Inclusive Design',
    description: 'Accessible to everyone, everywhere',
    template: 'url-shortener',
    constraints: ['wcag-aa', 'no-js', '3g-network', 'i18n-5-languages'],
    difficulty: 'advanced',
    learningFocus: 'Accessibility, progressive enhancement'
  },
  {
    id: 'shoestring-budget',
    name: 'The Shoestring Budget',
    description: 'Scale without spending',
    template: 'url-shortener',
    constraints: ['zero-cost', 'uptime-999', 'no-vendor-lock'],
    difficulty: 'intermediate',
    learningFocus: 'Cost optimization, architecture'
  },
  {
    id: 'enterprise-ready',
    name: 'Enterprise Ready',
    description: 'Production-grade quality',
    template: 'real-time-chat',
    constraints: ['test-coverage-90', 'type-safe', 'zero-security-issues', 'gdpr-compliant'],
    difficulty: 'advanced',
    learningFocus: 'Quality, security, compliance'
  }
];
```

---

## Integration with Other Models

### With Model 2 (Simulation)
Add narrative context to constraints:
```typescript
interface ConstrainedSimulation {
  simulation: Scenario;         // From Model 2
  constraints: Constraint[];    // From Model 5

  // e.g., "Marcus wants the project management tool, but his
  // budget is $0/month and it needs to work for his team
  // member who uses a screen reader"
}
```

### With Model 4 (Remix)
Apply constraints to existing codebases:
```typescript
interface ConstrainedRemix {
  seedProject: SeedProject;     // From Model 4
  constraints: Constraint[];    // New constraints to meet

  // e.g., "Take this existing API and make it work within
  // 128MB of memory"
}
```

---

## Risk Mitigations

| Risk | Implementation |
|------|----------------|
| Impossible combinations | Compatibility checker prevents invalid sets |
| Lacks narrative motivation | Pair with Model 2 scenario context |
| Overwhelming for beginners | Start with single constraints; layer gradually |
| Gaming via workarounds | Clear definitions; LLM assesses "spirit of the law" |

---

## Implementation Order

1. **Phase 1:** Constraint library data model + 15-20 initial constraints
2. **Phase 2:** Template system with 5 base templates
3. **Phase 3:** Compatibility checker and difficulty calculator
4. **Phase 4:** Basic evaluation (static analysis, automated tests)
5. **Phase 5:** Performance benchmarking integration
6. **Phase 6:** LLM-based trade-off analysis
7. **Phase 7:** Custom challenge builder UI

---

## Files to Reference

- API patterns: `src/app/api/goal-path/`
- Storage: `src/app/features/*/lib/*Storage.ts`
- Progress tracking: `src/app/features/progress/`
- Skill system: `src/app/features/skill-progress/`
- Code playground: `src/app/features/code-playground/`
- Module layout: `src/app/shared/components/ModuleLayout.tsx`
