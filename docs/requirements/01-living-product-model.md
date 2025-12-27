# Feature Requirement: Living Product Model

## Overview

Implement "The Living Product Model" - a system that connects learners with real open-source projects, transforming learning into meaningful contribution to the developer ecosystem.

---

## Business Context

### Philosophy
Instead of manufacturing artificial projects, tap into the endless stream of real problems the world generates. Partner with open-source projects and startups that genuinely need work done, transforming learning into contribution.

### Target Users
- Intermediate to advanced developers
- Self-directed learners comfortable with ambiguity
- Those seeking portfolio-building opportunities
- Career changers needing credible experience

### Implementation Priority
**Medium-High** - Best suited as an "advanced track" after users have built foundational skills.

---

## Technical Requirements

### 1. Discovery Layer Feature

**Purpose:** Monitor partner repositories for learning opportunities

**New Feature Module:** `src/app/features/open-source-discovery/`

```
open-source-discovery/
├── index.ts
├── lib/
│   ├── types.ts                    # Issue, Repository, TaskAnalysis types
│   ├── useDiscovery.ts             # Hook for fetching/filtering issues
│   ├── useRepositorySync.ts        # Hook for GitHub API integration
│   ├── issueAnalyzer.ts            # LLM-based complexity analysis
│   ├── discoveryStorage.ts         # Cache discovered issues locally
│   └── partnerRegistry.ts          # Curated partner project list
└── components/
    ├── DiscoveryDashboard.tsx      # Main discovery interface
    ├── IssueCard.tsx               # Individual issue display
    ├── RepositoryBrowser.tsx       # Browse partner repos
    ├── SkillMatcher.tsx            # Match issues to user skills
    └── TaskComplexityBadge.tsx     # Visual complexity indicator
```

**Integration Points:**
- Use existing `@anthropic-ai/sdk` for issue analysis (similar to `src/app/api/goal-path/`)
- Leverage existing skill system from `src/app/features/skill-progress/lib/types.ts`
- Connect to progress tracking via `src/app/features/progress/`

**API Endpoint Required:**
```
src/app/api/discovery/
├── route.ts                        # GET issues, POST analyze
├── repositories/route.ts           # Manage partner repositories
└── sync/route.ts                   # Sync with GitHub APIs
```

**Data Types to Create:**
```typescript
// src/app/features/open-source-discovery/lib/types.ts

interface PartnerRepository {
  id: string;
  name: string;
  owner: string;
  url: string;
  description: string;
  languages: string[];
  learnerFriendliness: 'beginner' | 'intermediate' | 'advanced';
  contributingGuidelinesUrl?: string;
  mentorshipAvailable: boolean;
  avgResponseTime: number; // hours
  activeContributors: number;
}

interface DiscoverableIssue {
  id: string;
  repositoryId: string;
  githubId: number;
  title: string;
  body: string;
  url: string;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;

  // LLM-analyzed properties
  analysis: TaskAnalysis;
}

interface TaskAnalysis {
  complexity: 'trivial' | 'simple' | 'moderate' | 'complex' | 'expert';
  estimatedHours: number;
  requiredSkills: SkillRequirement[];
  learningOpportunities: string[];
  prerequisiteKnowledge: string[];
  suggestedApproach: string;
  potentialBlockers: string[];
  confidence: number; // 0-1
}

interface SkillRequirement {
  skillId: string;
  level: 'basic' | 'intermediate' | 'advanced';
  isStretch: boolean; // Opportunity to learn this skill
}
```

### 2. Matching Engine Feature

**Purpose:** Map user skill profiles to appropriate tasks

**Enhance existing:** `src/app/features/skill-progress/`

**New Components:**
```
skill-progress/components/
├── SkillMatcher.tsx               # Match skills to issues (NEW)
├── StretchOpportunityCard.tsx     # Highlight growth opportunities (NEW)
└── SkillGapAnalysis.tsx           # Show skills to develop (NEW)
```

**Logic to Implement:**
```typescript
// src/app/features/open-source-discovery/lib/matchingEngine.ts

interface MatchResult {
  issue: DiscoverableIssue;
  matchScore: number; // 0-100
  matchReasons: string[];
  skillGaps: SkillGap[];
  stretchOpportunities: string[];
  estimatedDifficulty: 'comfortable' | 'challenging' | 'stretch';
}

function matchUserToIssues(
  userSkills: UserSkillProfile,
  issues: DiscoverableIssue[],
  preferences: MatchingPreferences
): MatchResult[];
```

### 3. Scaffolding System Feature

**Purpose:** Generate learning materials specific to each task

**New Feature Module:** `src/app/features/contribution-scaffold/`

```
contribution-scaffold/
├── index.ts
├── lib/
│   ├── types.ts
│   ├── useScaffold.ts              # Hook for generating scaffolds
│   ├── codebaseAnalyzer.ts         # Analyze repo structure
│   └── hintGenerator.ts            # Progressive hints system
└── components/
    ├── ScaffoldPanel.tsx           # Main scaffold display
    ├── CodebaseOrientation.tsx     # Repo structure explanation
    ├── ConceptPrimer.tsx           # Prerequisites explanation
    ├── HintSystem.tsx              # Progressive hints (don't give away solution)
    ├── RelevantDocs.tsx            # Curated documentation links
    └── SetupGuide.tsx              # Environment setup instructions
```

**API Endpoint:**
```
src/app/api/scaffold/
├── route.ts                        # POST generate scaffold for issue
└── hints/route.ts                  # GET progressive hints
```

**Integration with Claude:**
- Use existing Claude API pattern from `src/app/api/goal-path/generate/route.ts`
- System prompt should emphasize guidance without solutions
- Track hint usage for adaptive difficulty

### 4. Contribution Pipeline Feature

**Purpose:** Track contributions through standard git workflows

**New Feature Module:** `src/app/features/contribution-tracker/`

```
contribution-tracker/
├── index.ts
├── lib/
│   ├── types.ts
│   ├── useContribution.ts          # Track active contributions
│   ├── contributionStorage.ts      # Local storage for contributions
│   ├── prAnalyzer.ts               # Analyze PR status/feedback
│   └── outcomeTracker.ts           # Track merge/rejection rates
└── components/
    ├── ContributionDashboard.tsx   # Overview of all contributions
    ├── ActiveContributionCard.tsx  # Single contribution status
    ├── PRStatusTimeline.tsx        # PR lifecycle visualization
    ├── CodeReviewFeedback.tsx      # Display maintainer feedback
    ├── PreSubmitReview.tsx         # LLM review before PR submission
    └── ContributionHistory.tsx     # Past contributions list
```

**Integration Points:**
- Connect to GitHub OAuth for PR status tracking
- Use `src/app/features/certificates/` pattern for contribution certificates
- Update `src/app/features/progress/` with contribution milestones

---

## UI/UX Requirements

### New Module Page
Create `src/app/module/open-source/page.tsx` following existing module pattern.

**Layout:** Use `ModuleLayout` from `src/app/shared/components/`

**Variants to Implement:**
1. **Discovery View** - Browse available issues
2. **Active Contributions** - Track current work
3. **History View** - Past contributions and outcomes

### Design Patterns to Follow
- Use `PrismaticCard` for issue cards (from `src/app/shared/components/`)
- Follow `VariantTabs` pattern for switching views
- Use existing color system for skill domains from `src/app/shared/lib/learningDomains.ts`
- Implement animations using `framer-motion` patterns from other features

### Navigation Integration
Add to home page module grid in `src/app/page.tsx`:
```typescript
{
  id: 'open-source',
  title: 'Open Source',
  description: 'Contribute to real projects',
  icon: GitBranch,
  href: '/module/open-source',
  status: 'advanced',
  requiredLevel: 'intermediate'
}
```

---

## Data Storage

### Local Storage Schema
Follow pattern from `src/app/features/progress/lib/progressStorage.ts`:

```typescript
// Key: 'oss-contributions'
interface ContributionsStorage {
  activeContributions: ActiveContribution[];
  completedContributions: CompletedContribution[];
  watchedRepositories: string[];
  preferences: ContributionPreferences;
}
```

### GitHub Integration
Consider using GitHub App or OAuth for:
- Reading public issue data
- Tracking PR status for user contributions
- Fetching repository metadata

---

## Risk Mitigations to Implement

| Risk | Implementation |
|------|----------------|
| High barrier for beginners | Create "training ground" section with simplified issues tagged `good-first-issue` |
| Partner project quality varies | Implement repository rating system; show maintainer responsiveness metrics |
| Maintainer responsiveness | Display avg response time; set user expectations in UI |
| Scope creep on tasks | LLM decomposes large issues; show complexity before claiming |

---

## Success Metrics to Track

Store in localStorage and display in dashboard:
- Issues viewed vs. claimed
- Contributions started vs. completed
- PR acceptance rate
- Skills developed through contributions
- Time from claim to submission

---

## Implementation Order

1. **Phase 1:** Partner repository registry + manual issue curation
2. **Phase 2:** GitHub API integration for automatic issue discovery
3. **Phase 3:** LLM-powered issue analysis and matching
4. **Phase 4:** Scaffolding system with progressive hints
5. **Phase 5:** Contribution tracking and outcome analytics

---

## Files to Reference

- Pattern for feature structure: `src/app/features/goal-path/`
- API endpoint pattern: `src/app/api/goal-path/generate/route.ts`
- Storage pattern: `src/app/features/progress/lib/progressStorage.ts`
- UI components: `src/app/shared/components/`
- Type definitions: `src/app/shared/lib/types.ts`
- Module page pattern: `src/app/module/[moduleId]/page.tsx`
