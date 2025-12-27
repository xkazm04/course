# Feature Requirement: Competitive Ecosystem Model

## Overview

Implement "The Competitive Ecosystem Model" - a system where users build solutions to identical challenges, deploy them to sandboxed environments, and compete on objective performance metrics.

---

## Business Context

### Philosophy
Harness competitive drive as a learning accelerator. Users build solutions to the same challenges, and their work is objectively measured against each other. Learning becomes sport.

### Target Users
- Competitive personalities
- Developers preparing for job interviews
- Those who thrive under deadline pressure
- Users who want measurable benchmarks of progress

### Implementation Priority
**Medium** - Excellent for engagement and retention, but requires significant infrastructure investment. Consider introducing after platform has stable user base.

---

## Technical Requirements

### 1. Challenge System

**New Feature Module:** `src/app/features/competition/`

```
competition/
├── index.ts
├── lib/
│   ├── types.ts                    # Challenge, Submission, Ranking types
│   ├── useChallenge.ts             # Hook for challenge data
│   ├── useLeaderboard.ts           # Hook for rankings
│   ├── useSubmission.ts            # Hook for submission management
│   ├── challengeStorage.ts         # Local storage for drafts
│   ├── metricsCollector.ts         # Performance metrics
│   └── tierSystem.ts               # Skill tier calculations
└── components/
    ├── ChallengeDashboard.tsx      # All challenges overview
    ├── ChallengeCard.tsx           # Individual challenge preview
    ├── ChallengeDetail.tsx         # Full challenge specification
    ├── SubmissionEditor.tsx        # Code submission interface
    ├── Leaderboard.tsx             # Rankings display
    ├── LeaderboardEntry.tsx        # Individual rank row
    ├── MetricsDisplay.tsx          # Performance metrics viz
    ├── TierBadge.tsx               # Skill tier indicator
    ├── CountdownTimer.tsx          # Challenge deadline
    └── PeerReviewPanel.tsx         # UX review interface
```

**Core Data Types:**
```typescript
// src/app/features/competition/lib/types.ts

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  // Timing
  cycle: ChallengeCycle;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'judging' | 'completed';

  // Requirements
  specification: ChallengeSpec;
  requiredFeatures: RequiredFeature[];
  bonusObjectives: BonusObjective[];

  // Evaluation
  evaluationCriteria: EvaluationCriterion[];
  testSuiteId: string;

  // Participation
  participantCount: number;
  skillTierRestriction?: SkillTier;

  // Technical
  starterTemplate?: StarterTemplate;
  allowedTechnologies?: string[];
  prohibitedApproaches?: string[];
}

interface ChallengeCycle {
  type: 'sprint' | 'marathon' | 'flash';
  duration: number; // hours
  recurringSchedule?: string; // cron-like
}

interface ChallengeSpec {
  overview: string;
  technicalRequirements: string[];
  constraints: string[];
  exampleInputOutput?: { input: string; output: string }[];
  resourceLimits?: ResourceLimits;
}

interface ResourceLimits {
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxStorageMB: number;
  maxBandwidthMbps: number;
  maxColdStartMs: number;
}

interface RequiredFeature {
  id: string;
  name: string;
  description: string;
  testable: boolean;
  weight: number; // Percentage of score
}

interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // Percentage of total score
  type: 'automated' | 'peer_review' | 'code_quality';
  metric?: string;
  thresholds?: MetricThreshold[];
}

interface MetricThreshold {
  label: string;
  min: number;
  max: number;
  points: number;
}
```

### 2. Submission & Deployment System

```typescript
interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  userTier: SkillTier;

  // Code
  repositoryUrl?: string;
  codeSnapshot: CodeSnapshot;
  submittedAt: Date;
  version: number;

  // Deployment
  deploymentStatus: DeploymentStatus;
  deploymentUrl?: string;
  deploymentLogs?: string[];

  // Evaluation
  evaluationStatus: 'pending' | 'running' | 'completed' | 'failed';
  scores: SubmissionScores;
  rank?: number;
}

interface CodeSnapshot {
  files: { path: string; content: string }[];
  dependencies: Record<string, string>;
  buildCommand?: string;
  startCommand?: string;
}

type DeploymentStatus =
  | 'pending'
  | 'building'
  | 'deploying'
  | 'running'
  | 'failed'
  | 'terminated';

interface SubmissionScores {
  overall: number;
  breakdown: ScoreBreakdown[];
  metrics: PerformanceMetrics;
  peerReviews?: PeerReview[];
  codeQuality?: CodeQualityScore;
}

interface PerformanceMetrics {
  responseTimeP50: number;
  responseTimeP95: number;
  responseTimeP99: number;
  errorRate: number;
  uptime: number;
  throughput: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface PeerReview {
  reviewerId: string;
  uxScore: number;
  accessibilityScore?: number;
  designScore?: number;
  comments: string;
  submittedAt: Date;
}

interface CodeQualityScore {
  lintingScore: number;
  typeScore?: number;
  testCoverage?: number;
  complexity: number;
  duplication: number;
  securityIssues: SecurityIssue[];
}
```

### 3. Leaderboard & Ranking System

```typescript
interface Leaderboard {
  challengeId: string;
  tier?: SkillTier;
  type: 'overall' | 'performance' | 'code_quality' | 'ux';
  entries: LeaderboardEntry[];
  lastUpdated: Date;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  tier: SkillTier;
  score: number;
  submissionId: string;
  metrics: PerformanceMetrics;
  trend: 'up' | 'down' | 'stable' | 'new';
  previousRank?: number;
}

type SkillTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'master';

interface TierProgression {
  currentTier: SkillTier;
  currentPoints: number;
  pointsToNextTier: number;
  seasonalRank: number;
  allTimeRank: number;
  challengesCompleted: number;
  winRate: number;
}
```

### 4. Tier & Matchmaking System

```typescript
// src/app/features/competition/lib/tierSystem.ts

interface TierConfig {
  tier: SkillTier;
  minPoints: number;
  maxPoints: number;
  color: string;
  icon: string;
  perks: string[];
}

const TIER_CONFIGS: TierConfig[] = [
  {
    tier: 'bronze',
    minPoints: 0,
    maxPoints: 999,
    color: '#CD7F32',
    icon: 'Shield',
    perks: ['Access to beginner challenges']
  },
  {
    tier: 'silver',
    minPoints: 1000,
    maxPoints: 2499,
    color: '#C0C0C0',
    icon: 'Shield',
    perks: ['Access to intermediate challenges', 'Peer review eligibility']
  },
  {
    tier: 'gold',
    minPoints: 2500,
    maxPoints: 4999,
    color: '#FFD700',
    icon: 'Shield',
    perks: ['Access to advanced challenges', 'Create team competitions']
  },
  {
    tier: 'platinum',
    minPoints: 5000,
    maxPoints: 9999,
    color: '#E5E4E2',
    icon: 'Crown',
    perks: ['Access to expert challenges', 'Featured submissions']
  },
  {
    tier: 'diamond',
    minPoints: 10000,
    maxPoints: 24999,
    color: '#B9F2FF',
    icon: 'Diamond',
    perks: ['Challenge creation beta', 'Mentor badge']
  },
  {
    tier: 'master',
    minPoints: 25000,
    maxPoints: Infinity,
    color: '#FF4500',
    icon: 'Flame',
    perks: ['Challenge creation access', 'Featured profile']
  }
];

function calculatePointsFromChallenge(
  submission: Submission,
  challenge: Challenge
): number {
  const basePoints = {
    beginner: 50,
    intermediate: 100,
    advanced: 200,
    expert: 400
  }[challenge.difficulty];

  const rankMultiplier = getRankMultiplier(submission.rank);
  const completionBonus = submission.scores.overall > 80 ? 1.2 : 1;

  return Math.floor(basePoints * rankMultiplier * completionBonus);
}
```

---

## API Endpoints

```
src/app/api/competition/
├── challenges/
│   ├── route.ts                    # GET list, POST create (admin)
│   └── [challengeId]/
│       ├── route.ts                # GET detail, PATCH update
│       ├── submit/route.ts         # POST submission
│       └── leaderboard/route.ts    # GET rankings
├── submissions/
│   ├── route.ts                    # GET user submissions
│   └── [submissionId]/
│       ├── route.ts                # GET detail
│       ├── deploy/route.ts         # POST trigger deployment
│       └── metrics/route.ts        # GET performance data
├── reviews/
│   ├── route.ts                    # GET pending reviews
│   └── submit/route.ts             # POST peer review
└── tiers/
    └── route.ts                    # GET tier standings
```

---

## Deployment Infrastructure

### Sandboxed Execution Environment

This is the most complex technical requirement. Options:

1. **Serverless Functions (Recommended for MVP)**
   - Deploy to Vercel/Cloudflare Workers
   - Standardized runtime, automatic scaling
   - Built-in monitoring

2. **Container-based (For Advanced)**
   - Docker containers with resource limits
   - More flexibility but higher complexity
   - Better for diverse technology stacks

```typescript
interface DeploymentConfig {
  provider: 'vercel' | 'cloudflare' | 'docker';
  runtime: string;
  memoryLimit: number;
  timeout: number;
  environment: Record<string, string>;
}

// Deployment service interface
interface DeploymentService {
  deploy(submission: CodeSnapshot, config: DeploymentConfig): Promise<Deployment>;
  getStatus(deploymentId: string): Promise<DeploymentStatus>;
  runTests(deploymentUrl: string, testSuiteId: string): Promise<TestResults>;
  collectMetrics(deploymentUrl: string, duration: number): Promise<PerformanceMetrics>;
  terminate(deploymentId: string): Promise<void>;
}
```

### Load Testing System

```typescript
interface LoadTestConfig {
  pattern: 'constant' | 'ramp' | 'spike' | 'realistic';
  duration: number; // seconds
  requestsPerSecond: number;
  scenarios: LoadTestScenario[];
}

interface LoadTestScenario {
  name: string;
  weight: number; // Percentage of traffic
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  payload?: unknown;
  expectedStatus: number;
}
```

---

## UI/UX Requirements

### New Module Page
Create `src/app/module/compete/page.tsx`

**Variants:**
1. **Active Challenges** - Currently running challenges
2. **Leaderboards** - Global and challenge-specific rankings
3. **My Submissions** - User's submission history
4. **Practice Mode** - Unranked challenge attempts

### Challenge Dashboard Layout
```
┌──────────────────────────────────────────────────────────────┐
│  ACTIVE CHALLENGES                            Filter: All ▼  │
├──────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🏆 Real-Time Chat Application                           │ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━               │ │
│ │ Difficulty: Advanced        Ends in: 5d 12h 34m         │ │
│ │ Participants: 234           Your Rank: #45              │ │
│ │ [View Challenge] [My Submission]                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚡ URL Shortener Under Load                              │ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                        │ │
│ │ Difficulty: Intermediate    Ends in: 2d 8h 15m          │ │
│ │ Participants: 456           Not Submitted               │ │
│ │ [Start Challenge]                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  UPCOMING                                                    │
│  • API Rate Limiter (Advanced) - Starts in 3 days           │
│  • Portfolio Generator (Beginner) - Starts in 5 days        │
└──────────────────────────────────────────────────────────────┘
```

### Leaderboard Design
```
┌──────────────────────────────────────────────────────────────┐
│  LEADERBOARD: Real-Time Chat          [Overall] [Speed] [UX]│
├──────────────────────────────────────────────────────────────┤
│ Rank  User              Tier     Score   Latency   Uptime   │
├──────────────────────────────────────────────────────────────┤
│  🥇   @speedcoder       ◆ Plat   98.5    12ms      100%     │
│  🥈   @byteMaster       ◇ Gold   97.2    15ms      99.9%    │
│  🥉   @devNinja         ◇ Gold   96.8    18ms      99.8%    │
│  4    @codesmith        ○ Silver 95.1    22ms      99.5%    │
│  5    @freshDev         ○ Bronze 94.3    25ms      99.2%    │
│  ...                                                         │
│  45   @you (★)          ○ Silver 87.2    45ms      98.1%    │
└──────────────────────────────────────────────────────────────┘
```

### Submission Metrics Display
```
┌──────────────────────────────────────────────────────────────┐
│  YOUR SUBMISSION METRICS                                     │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Response Time                    Error Rate                 │
│  ┌─────────────────────┐          ┌───────────────────┐     │
│  │      ___            │          │ 0.2%              │     │
│  │   __/   \___        │          │ ████░░░░░░░░░░░░  │     │
│  │  /          \__     │          │ Target: <1%  ✓    │     │
│  └─────────────────────┘          └───────────────────┘     │
│  P50: 23ms  P95: 45ms  P99: 89ms                            │
│                                                              │
│  Concurrent Users Handled: 847 / 1000 target                 │
│  ████████████████████████████████░░░░░░░  84.7%             │
│                                                              │
│  Code Quality Score: 85/100                                  │
│  • Linting: 92 • Types: 88 • Tests: 75 • Security: 85       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Sample Challenge Data

```typescript
const sampleChallenge: Challenge = {
  id: 'chat-app-2024-01',
  title: 'Build a Real-Time Chat Application',
  description: 'Create a scalable real-time chat application with modern features',
  difficulty: 'advanced',

  cycle: { type: 'sprint', duration: 336 }, // 2 weeks
  startDate: new Date('2024-02-01'),
  endDate: new Date('2024-02-15'),
  status: 'active',

  specification: {
    overview: 'Build a chat application that can handle real-time messaging between users.',
    technicalRequirements: [
      'Must use WebSockets or Server-Sent Events',
      'Messages must persist in a database',
      'Must handle concurrent connections gracefully'
    ],
    constraints: [
      'No third-party chat SDKs (build from scratch)',
      'Must be deployable as a single service'
    ],
    resourceLimits: {
      maxMemoryMB: 512,
      maxCpuPercent: 50,
      maxStorageMB: 100,
      maxBandwidthMbps: 10,
      maxColdStartMs: 3000
    }
  },

  requiredFeatures: [
    { id: 'auth', name: 'User Authentication', description: 'Users can sign up and log in', testable: true, weight: 15 },
    { id: 'realtime', name: 'Real-time Delivery', description: 'Messages appear instantly', testable: true, weight: 25 },
    { id: 'typing', name: 'Typing Indicators', description: 'Show when others are typing', testable: true, weight: 10 },
    { id: 'persist', name: 'Message Persistence', description: 'Messages survive refresh', testable: true, weight: 20 }
  ],

  bonusObjectives: [
    { id: 'e2e', name: 'End-to-End Encryption', description: 'Encrypt messages client-side', points: 100 },
    { id: 'files', name: 'File Sharing', description: 'Allow image/file uploads', points: 75 },
    { id: 'reactions', name: 'Message Reactions', description: 'Add emoji reactions', points: 50 }
  ],

  evaluationCriteria: [
    { id: 'latency', name: 'Message Delivery Latency', weight: 30, type: 'automated', metric: 'responseTimeP95' },
    { id: 'capacity', name: 'Concurrent User Capacity', weight: 25, type: 'automated', metric: 'throughput' },
    { id: 'quality', name: 'Code Quality Score', weight: 20, type: 'code_quality' },
    { id: 'uptime', name: 'Uptime During Test', weight: 15, type: 'automated', metric: 'uptime' },
    { id: 'ux', name: 'Peer UX Rating', weight: 10, type: 'peer_review' }
  ],

  testSuiteId: 'chat-app-tests-v1',
  participantCount: 234,

  starterTemplate: {
    id: 'chat-starter',
    framework: 'nextjs',
    files: [] // Minimal starter
  }
};
```

---

## Integration with Existing Features

### Progress & XP Integration
```typescript
// Extend existing skill progress system
interface CompetitionXP {
  source: 'competition';
  challengeId: string;
  baseXP: number;
  rankBonus: number;
  streakBonus: number; // If completed during streak
  totalXP: number;
}

// Award XP based on participation and ranking
function awardCompetitionXP(submission: Submission, challenge: Challenge): CompetitionXP;
```

### Streaks Integration
Completing a challenge counts toward daily streak goal.

### Certificates
Special competition certificates for:
- Top 3 finishes
- Tier promotions
- Season rankings

---

## Risk Mitigations

| Risk | Implementation |
|------|----------------|
| Beginners get discouraged | Strict tier separation; beginner-only leagues |
| "Meta" solutions dominate | Vary challenge parameters; prohibition lists |
| Cheating/code sharing | Plagiarism detection; unique implementation scoring |
| Burnout from competition | Optional participation; unranked practice mode |

---

## Implementation Order

1. **Phase 1:** Challenge data model + static challenge list
2. **Phase 2:** Submission system (local only, no deployment)
3. **Phase 3:** Basic leaderboard with manual scoring
4. **Phase 4:** Serverless deployment integration
5. **Phase 5:** Automated testing and metrics collection
6. **Phase 6:** Peer review system
7. **Phase 7:** Tier system and matchmaking

---

## Files to Reference

- Progress tracking: `src/app/features/progress/`
- Skill system: `src/app/features/skill-progress/`
- Certificate generation: `src/app/features/certificates/`
- Code playground: `src/app/features/code-playground/`
- UI components: `src/app/shared/components/`
