# OpenForge Methodology

## The Learning-Building Loop

This document defines the systematic methodology for how learning and building intertwine in OpenForge.

---

## 1. Challenge Generation Pipeline

### Source → Challenge → Learning

Every challenge originates from one of four sources:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Challenge Sources                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────┐ │
│  │  Competitor  │   │   Internal   │   │    User      │   │  Manual  │ │
│  │   Analysis   │   │   Scanner    │   │   Feedback   │   │  Curation│ │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └────┬─────┘ │
│         │                  │                  │                 │       │
│         ▼                  ▼                  ▼                 ▼       │
│  "They have X,     "Code smell at    "Can't export    "Students need   │
│   we don't"         line 234"         to PDF"          to learn X"     │
│         │                  │                  │                 │       │
│         └──────────────────┴──────────────────┴─────────────────┘       │
│                                    │                                     │
│                                    ▼                                     │
│                     ┌────────────────────────────┐                       │
│                     │   Challenge Specification   │                      │
│                     │   Engine (AI-Assisted)      │                      │
│                     └─────────────┬──────────────┘                       │
│                                   │                                      │
│                                   ▼                                      │
│                     ┌────────────────────────────┐                       │
│                     │   Structured Challenge     │                       │
│                     │   Ready for Assignment     │                       │
│                     └────────────────────────────┘                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Challenge Specification Schema

Every challenge must include:

```typescript
interface Challenge {
  // Identity
  id: string;
  title: string;  // Action-oriented: "Implement contact search"

  // Classification
  type: 'feature' | 'bug' | 'refactor' | 'test' | 'docs' | 'performance' | 'security';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedHours: number;

  // Context
  project: Project;
  relatedFeature?: string;  // Which product feature this supports
  competitorReference?: {   // If inspired by competitor
    product: string;
    feature: string;
    screenshot?: string;
  };

  // Learning
  prerequisiteSkills: Skill[];    // What you should know
  teachesSkills: Skill[];         // What you'll learn
  prerequisiteChallenges?: Challenge[];  // Prior challenges required

  // Specification
  description: string;            // What's the problem?
  context: string;                // Why does this matter?
  acceptanceCriteria: string[];   // How do we know it's done?

  // Guidance
  hints: {
    level: 1 | 2 | 3;  // Progressive revelation
    content: string;
    penaltyPercent: number;  // Score reduction for using
  }[];

  suggestedApproach?: string;     // High-level guidance
  relevantFiles: string[];        // Where to look
  relevantDocs: string[];         // Learning resources

  // Boundaries
  constraints?: string[];         // "Don't modify X", "Must use Y"
  outOfScope?: string[];          // "Don't worry about Z"

  // Validation
  testCriteria: {
    automated: string[];          // Test files that should pass
    manual: string[];             // Things to check manually
    aiReview: string[];           // What AI should verify
  };
}
```

### Difficulty Calibration

| Level | Characteristics | Typical Scope |
|-------|----------------|---------------|
| **Beginner** | Single file, clear guidance, well-defined tests | 1-4 hours |
| **Intermediate** | Multiple files, requires research, some ambiguity | 4-12 hours |
| **Advanced** | Architectural impact, design decisions, edge cases | 12-40 hours |
| **Expert** | Cross-cutting concerns, system design, mentorship of others | 40+ hours |

---

## 2. The AI Tutor System

### Review Philosophy

The AI tutor is not a gatekeeper but an educator. Every review should:
1. **Acknowledge** what was done well
2. **Explain** what could be improved and WHY
3. **Teach** the underlying principle
4. **Guide** toward the solution without giving it

### Review Prompt Template

```markdown
You are an experienced developer mentoring a student on their pull request.

## Context
- Project: {project_name}
- Challenge: {challenge_title}
- Student Level: {difficulty_level}
- Skills Being Learned: {teaches_skills}

## The PR
{pr_diff}

## Acceptance Criteria
{acceptance_criteria}

## Your Task
Review this PR with the following goals:
1. Help the student learn, not just get code merged
2. Be encouraging while maintaining standards
3. Explain the "why" behind any suggestions
4. Reference relevant concepts they're learning

## Review Structure
1. **Summary**: One sentence on the overall approach
2. **Strengths**: What they did well (be specific)
3. **Learning Opportunities**: Issues framed as growth areas
4. **Suggestions**: Specific, actionable improvements
5. **Resources**: Links to relevant documentation/concepts
6. **Next Steps**: What to do next

## Tone Guidelines
- Use "we" language: "we typically do X" not "you should do X"
- Ask questions: "What do you think would happen if...?"
- Celebrate progress: "Great improvement from your last PR!"
- Be specific: "Line 45 could be clearer" not "code is unclear"

## Difficulty Calibration
For {difficulty_level} level:
- Beginner: Be very detailed, explain everything, provide examples
- Intermediate: Explain concepts, expect some research
- Advanced: Point in direction, expect them to figure it out
- Expert: Peer review, focus on trade-offs and alternatives
```

### Multi-Stage Review Process

```
PR Submitted
     │
     ▼
┌─────────────────────────┐
│ Stage 1: Automated      │
│ - Tests pass?           │
│ - Lint clean?           │
│ - Type check?           │
│ - Security scan?        │
└───────────┬─────────────┘
            │ All pass?
            ▼
┌─────────────────────────┐
│ Stage 2: AI Review      │
│ - Code quality          │
│ - Pattern adherence     │
│ - Educational feedback  │
│ - Learning assessment   │
└───────────┬─────────────┘
            │
            ▼
     ┌──────────────┐
     │ Needs Work?  │
     └──────┬───────┘
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
   Yes            No
     │             │
     ▼             ▼
┌─────────┐   ┌─────────────────────────┐
│ Return  │   │ Stage 3: Human Review   │
│ to      │   │ - Final approval        │
│ Student │   │ - Mentorship notes      │
└─────────┘   │ - Merge decision        │
              └───────────┬─────────────┘
                          │
                          ▼
                    ┌──────────┐
                    │  Merged  │
                    └────┬─────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Learning Recorded   │
              │ - Skills updated    │
              │ - Progress tracked  │
              │ - Next challenge    │
              └─────────────────────┘
```

### AI Assessment Dimensions

For each PR, the AI evaluates:

```typescript
interface AIAssessment {
  // Technical Quality
  codeQuality: {
    score: 1-5;
    strengths: string[];
    improvements: string[];
  };

  // Learning Progress
  skillDemonstration: {
    skill: Skill;
    level: 'emerging' | 'developing' | 'proficient' | 'advanced';
    evidence: string;
  }[];

  // Growth Areas
  learningOpportunities: {
    area: string;
    suggestion: string;
    resource: string;
  }[];

  // Acceptance Criteria
  criteriaStatus: {
    criterion: string;
    met: boolean;
    notes: string;
  }[];

  // Overall
  readyToMerge: boolean;
  blockers: string[];
  recommendations: string[];
}
```

---

## 3. The Scanner System

### Scanner Types

#### 3.1 Competitor Scanner

**Purpose**: Identify features to implement

```typescript
interface CompetitorScan {
  target: {
    name: string;      // "Salesforce"
    product: string;   // "Sales Cloud"
    tier: string;      // "Professional" (which pricing tier)
  };

  features: {
    name: string;
    category: string;
    description: string;
    screenshots: string[];
    complexity: 'simple' | 'moderate' | 'complex';
    valueToUsers: 'must-have' | 'nice-to-have' | 'differentiator';
    ourStatus: 'implemented' | 'partial' | 'missing';
  }[];

  uxPatterns: {
    pattern: string;
    example: string;
    shouldWeAdopt: boolean;
    rationale: string;
  }[];

  generatedChallenges: Challenge[];
}
```

**Scanning Process**:
1. Review competitor's public documentation
2. Analyze screenshots/videos of UI
3. Test free trial if available
4. Inventory features by category
5. Compare to our implementation
6. Generate challenges for gaps

#### 3.2 Codebase Scanner

**Purpose**: Find improvement opportunities in our code

```typescript
interface CodebaseScan {
  project: Project;
  scanDate: string;

  issues: {
    type: 'bug' | 'smell' | 'performance' | 'security' | 'accessibility';
    severity: 'low' | 'medium' | 'high' | 'critical';
    location: {
      file: string;
      startLine: number;
      endLine: number;
    };
    description: string;
    suggestedFix: string;
    learningOpportunity: string;  // Why is this a good challenge?
    generatedChallenge: Challenge;
  }[];

  metrics: {
    testCoverage: number;
    codeQualityScore: number;
    documentationCoverage: number;
    accessibilityScore: number;
  };

  techDebt: {
    item: string;
    impact: string;
    effort: 'small' | 'medium' | 'large';
    priority: number;
  }[];
}
```

**Scanning Process**:
1. Run static analysis tools
2. AI review of code patterns
3. Check against project conventions
4. Compare to best practices
5. Generate improvement challenges

#### 3.3 Learning Gap Scanner

**Purpose**: Identify what skills are missing in the contributor community

```typescript
interface LearningGapScan {
  project: Project;
  period: { start: string; end: string };

  gaps: {
    skill: Skill;
    evidence: {
      type: 'low_completion' | 'high_rejection' | 'long_time' | 'few_takers';
      metric: number;
      details: string;
    }[];
    suggestedContent: {
      type: 'course' | 'tutorial' | 'exercise';
      topic: string;
      description: string;
    }[];
  }[];

  bottlenecks: {
    challenge: Challenge;
    issue: string;  // "Average 3 iterations to merge"
    suggestion: string;  // "Add more detailed hints"
  }[];

  contentRecommendations: {
    priority: number;
    content: LearningModule;
    rationale: string;
  }[];
}
```

---

## 4. Dynamic Content Generation

### When to Generate Content

Content is generated dynamically when:
1. A student struggles with a concept (detected by AI review patterns)
2. A new challenge type is added without prerequisite content
3. Learning gap scanner identifies missing material
4. Student explicitly requests help

### Content Generation Prompt

```markdown
You are creating educational content for OpenForge, a platform where
students learn by contributing to open-source projects.

## Context
- Topic: {topic}
- Target Audience: {skill_level} developers
- Related Project: {project_name}
- Prerequisite Knowledge: {prerequisites}
- Learning Objective: {objective}

## Content Requirements
1. **Practical Focus**: Every concept should connect to real code in the project
2. **Active Learning**: Include exercises that build toward actual contributions
3. **Progressive Disclosure**: Start simple, add complexity gradually
4. **Code Examples**: Use actual code from the project, not synthetic examples

## Structure
1. **Hook** (2-3 sentences): Why should they care?
2. **Concept** (1-2 paragraphs): What is it?
3. **In Practice** (with code): How does it appear in our project?
4. **Exercise**: Small task to verify understanding
5. **Connection**: How this enables real contribution

## Tone
- Conversational but professional
- "You" language, direct address
- Acknowledge difficulty without condescension
- Celebrate small wins
```

### Content Types

| Type | Purpose | Length | Generation Trigger |
|------|---------|--------|-------------------|
| **Concept Explainer** | Teach a principle | 500-1000 words | Skill gap detected |
| **Code Walkthrough** | Explain existing code | Variable | Challenge context |
| **Pattern Guide** | Show project conventions | 300-500 words | Consistency issues |
| **Debugging Guide** | Help with common errors | 200-400 words | Repeated failures |
| **Architecture Overview** | System understanding | 1000+ words | Complex challenge |

---

## 5. Progress & Skill Tracking

### Skill Model

```typescript
interface SkillProfile {
  userId: string;

  skills: {
    skill: Skill;
    level: number;  // 0-100
    confidence: number;  // How sure are we? Based on sample size
    lastDemonstrated: string;
    trajectory: 'improving' | 'stable' | 'declining';

    evidence: {
      challengeId: string;
      date: string;
      performance: 'struggled' | 'completed' | 'excelled';
      notes: string;
    }[];
  }[];

  // Computed
  strengths: Skill[];
  growthAreas: Skill[];
  suggestedNext: Challenge[];
}
```

### Skill Assessment Rules

| Signal | Skill Impact |
|--------|--------------|
| PR merged first try | +10 points |
| PR merged after revision | +5 points |
| Used hint level 1 | -2 points |
| Used hint level 2 | -5 points |
| Used hint level 3 | -10 points |
| Helped another student | +3 points |
| PR rejected | -5 points (with recovery path) |
| Excellent AI review | +5 bonus |
| Completed advanced challenge | +15 points |

### Challenge Matching Algorithm

```typescript
function matchChallengesToStudent(
  student: SkillProfile,
  availableChallenges: Challenge[]
): RankedChallenge[] {

  return availableChallenges
    .map(challenge => ({
      challenge,
      score: calculateFitScore(student, challenge)
    }))
    .sort((a, b) => b.score - a.score);
}

function calculateFitScore(student: SkillProfile, challenge: Challenge): number {
  let score = 0;

  // Has prerequisites?
  const hasPrereqs = challenge.prerequisiteSkills.every(
    skill => getSkillLevel(student, skill) >= 60
  );
  if (!hasPrereqs) return 0;  // Disqualified

  // Teaches something new?
  const learningPotential = challenge.teachesSkills.reduce((sum, skill) => {
    const currentLevel = getSkillLevel(student, skill);
    return sum + (100 - currentLevel);  // More room to grow = higher score
  }, 0);
  score += learningPotential * 0.4;

  // Right difficulty?
  const difficultyMatch = calculateDifficultyMatch(student, challenge);
  score += difficultyMatch * 0.3;  // 100 = perfect match

  // Project interest?
  const projectAffinity = student.projectPreferences[challenge.project.id] || 50;
  score += projectAffinity * 0.2;

  // Recency - avoid repeating same skills
  const diversityBonus = calculateDiversityBonus(student, challenge);
  score += diversityBonus * 0.1;

  return score;
}
```

---

## 6. Quality Gates

### For Code (Technical Quality)

| Gate | Requirement | Enforced By |
|------|-------------|-------------|
| Tests | All tests pass | CI |
| Coverage | No reduction in coverage | CI |
| Lint | Zero violations | CI |
| Types | Zero TypeScript errors | CI |
| Security | No high/critical vulnerabilities | CI + AI |
| Performance | No regression on benchmarks | CI |
| Accessibility | Zero new a11y violations | CI + AI |

### For Learning (Educational Quality)

| Gate | Requirement | Enforced By |
|------|-------------|-------------|
| Understanding | Can explain their approach | AI Review |
| Independence | Didn't copy solution verbatim | AI Review |
| Growth | Shows improvement from past work | AI Review |
| Engagement | Responded to feedback thoughtfully | Human Review |

### For Challenges (Content Quality)

| Gate | Requirement | Enforced By |
|------|-------------|-------------|
| Completeness | All schema fields filled | Automated |
| Clarity | Acceptance criteria are testable | AI Review |
| Calibration | Difficulty matches actual effort | Historical data |
| Learning Value | Teaches stated skills | AI Review |
| Scoping | Can be completed independently | Human Review |

---

## 7. The Human Element

### Role of Human Maintainers

Humans are essential for:
1. **Final Merge Authority**: AI recommends, humans decide
2. **Architecture Decisions**: AI assists, humans choose
3. **Community Culture**: Setting tone and expectations
4. **Edge Cases**: When AI is uncertain
5. **Mentorship**: Deep teaching moments

### Escalation Triggers

AI escalates to humans when:
- Confidence score < 70%
- Security-sensitive changes
- Architecture-impacting decisions
- Student expresses frustration
- Third revision without progress
- First contribution from new student

### Human Review Guidelines

```markdown
## For Maintainers: Reviewing Student PRs

Remember: You're not just reviewing code, you're developing a developer.

### Before Reviewing
- [ ] Check student's level and history
- [ ] Read AI's assessment
- [ ] Note learning objectives for this challenge

### During Review
- [ ] Start with something positive
- [ ] Explain the "why" for any changes
- [ ] Ask questions instead of dictating
- [ ] Offer to pair if stuck

### After Merging
- [ ] Acknowledge the contribution
- [ ] Suggest next challenge if appropriate
- [ ] Update any challenge descriptions if unclear

### Red Flags to Address
- Student seems frustrated → Reach out personally
- Same mistake repeated → Create learning content
- Taking too long → Check if challenge needs better scoping
```

---

## 8. Continuous Improvement

### Feedback Loops

```
┌─────────────────────────────────────────────────────────────────┐
│                    Continuous Improvement                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Challenge Completion Data                                       │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Analysis Questions:                                     │    │
│  │  - Are challenges taking expected time?                  │    │
│  │  - What's the revision rate?                            │    │
│  │  - Where do students get stuck?                         │    │
│  │  - Which hints are most used?                           │    │
│  │  - What skills show slowest progress?                   │    │
│  └────────────────────────┬────────────────────────────────┘    │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Actions:                                                │    │
│  │  - Adjust difficulty ratings                            │    │
│  │  - Improve hints                                        │    │
│  │  - Create prerequisite content                          │    │
│  │  - Split complex challenges                             │    │
│  │  - Add more guidance                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Metrics Dashboard

Track weekly:
- New challenges created
- Challenges completed
- Average time to completion
- Revision rate (PRs requiring changes)
- Student satisfaction (survey)
- Skill progression rates
- Content gaps identified
- AI accuracy (human overrides)

---

## Summary: The Method

1. **Source** challenges from competitors, code quality, users, or curation
2. **Specify** challenges with learning objectives and clear criteria
3. **Match** students to challenges based on skill profile
4. **Support** with AI tutoring and dynamic content
5. **Review** with automated → AI → human pipeline
6. **Track** skill development and learning outcomes
7. **Improve** challenges and content based on data

This creates a system where every contribution is a learning opportunity, every student is a contributor, and every project grows while teaching.
