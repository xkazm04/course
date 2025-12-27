# OpenForge Implementation Plan

## Executive Summary

This document provides a detailed implementation roadmap to transform the current experimental modules into a unified OpenForge platform - where students learn by building open-source SaaS alternatives.

---

## Part 1: Feature Module Consolidation

### Feature Categories & OpenForge Mapping

Based on analysis of all 25 feature modules, they fall into 5 categories:

| Category | Features | OpenForge Role |
|----------|----------|----------------|
| **Core Learning** | Progress, Streaks, Bookmarks, Certificates | Keep - Universal learning infrastructure |
| **Content Generation** | Adaptive Content, Generative Content, Curriculum Generator | Merge - Unified AI content engine |
| **Skill & Assessment** | Skill Assessment, Adaptive Learning, User Velocity | Merge - Unified skill profiler |
| **Contribution System** | Remix Projects, Live Projects, Contribution Tracker/Scaffold, Open Source Discovery, Competition | Merge - Core contribution loop |
| **Visualization** | Knowledge Map, Knowledge Universe, Goal Path, Path Comparison, Social Proof, User Learning Graph | Selective - Keep map, simplify others |
| **Utility** | Code Playground, Shareable Links, Client Simulation | Keep as supporting tools |

### Recommended Module Structure (Post-Consolidation)

```
src/app/features/
├── core/                      # Universal infrastructure
│   ├── progress/              # Keep: Track completion
│   ├── streaks/               # Keep: Daily habits
│   ├── bookmarks/             # Keep: Save content
│   └── certificates/          # Keep: Recognition
│
├── profile/                   # Unified user profile
│   ├── skill-assessment/      # Merge from: skill-assessment, adaptive-learning
│   ├── skill-profile/         # NEW: Unified skill tracking
│   └── career-goals/          # Extract from: goal-path
│
├── learning/                  # Content consumption
│   ├── adaptive-content/      # Merge: adaptive-content + generative-content
│   ├── chapter/               # Keep: Course content viewer
│   └── code-playground/       # Keep: Interactive coding
│
├── contribution/              # THE CORE - Project contributions
│   ├── projects/              # Merge: remix-projects + live-projects
│   ├── challenges/            # Extract from: remix + competition
│   ├── submissions/           # NEW: PR-based submissions
│   ├── reviews/               # NEW: AI + peer review
│   └── discovery/             # Merge: open-source-discovery
│
├── navigation/                # Content discovery
│   ├── knowledge-map/         # Keep: Main navigation
│   ├── project-catalog/       # NEW: Browse projects
│   └── path-finder/           # Simplify from: goal-path
│
└── social/                    # Community features
    ├── leaderboard/           # Extract from: competition
    ├── social-proof/          # Keep: Journey visualization
    └── shareable-links/       # Keep: Sharing
```

---

## Part 2: Database Schema Expansion

### Current Schema Analysis

**001_initial_schema.sql** provides:
- Categories → Subcategories → Topics hierarchy
- Skills with prerequisites and relations
- Courses with chapters, sections, concepts
- Learning paths with course assignments
- User profiles with progress tracking
- Gamification (achievements, streaks, XP)

**002_remix_challenges.sql** provides:
- Scanned projects and challenges
- Admin review workflow
- User assignments for challenges
- API keys for MCP integration

### Required Schema Additions

#### Migration 003: Projects & Contributions

```sql
-- ============================================================================
-- 003_projects_contributions.sql
-- OpenForge Project Catalog and Contribution System
-- ============================================================================

-- ============================================================================
-- SECTION 1: PROJECT CATALOG
-- Central registry of OpenForge projects (SaaS clones)
-- ============================================================================

CREATE TYPE project_status AS ENUM (
    'proposal',      -- Community proposed
    'planning',      -- Architecture phase
    'active',        -- Open for contributions
    'mature',        -- Feature complete, maintenance mode
    'archived'       -- No longer active
);

CREATE TYPE project_category AS ENUM (
    'crm',
    'project_management',
    'marketing',
    'analytics',
    'productivity',
    'developer_tools',
    'ecommerce',
    'finance',
    'hr',
    'other'
);

-- OpenForge Projects (SaaS alternatives being built)
CREATE TABLE forge_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identity
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(500),
    description TEXT,

    -- Target
    target_product VARCHAR(255),           -- "Salesforce CRM"
    target_product_url TEXT,               -- Link to competitor
    category project_category NOT NULL,

    -- Repository
    github_org VARCHAR(100),               -- "openforge"
    github_repo VARCHAR(100),              -- "open-crm"
    github_url TEXT GENERATED ALWAYS AS (
        CASE WHEN github_org IS NOT NULL AND github_repo IS NOT NULL
        THEN 'https://github.com/' || github_org || '/' || github_repo
        ELSE NULL END
    ) STORED,

    -- Tech stack
    primary_language VARCHAR(50) NOT NULL,
    framework VARCHAR(100),
    tech_stack JSONB DEFAULT '[]'::jsonb,

    -- Status and metrics
    status project_status DEFAULT 'proposal',
    feature_parity_percent INTEGER DEFAULT 0,  -- vs target product
    code_quality_grade VARCHAR(2),             -- A+, A, B+, etc.
    test_coverage_percent INTEGER DEFAULT 0,

    -- Community
    contributor_count INTEGER DEFAULT 0,
    star_count INTEGER DEFAULT 0,
    fork_count INTEGER DEFAULT 0,

    -- Learning
    skills_taught UUID[] DEFAULT '{}',         -- skill IDs
    difficulty_range VARCHAR(50),              -- "beginner-advanced"
    estimated_contribution_hours INTEGER,

    -- Media
    logo_url TEXT,
    screenshot_urls JSONB DEFAULT '[]'::jsonb,
    demo_url TEXT,

    -- Ownership
    created_by UUID REFERENCES user_profiles(id),
    lead_maintainers UUID[] DEFAULT '{}',

    -- Timestamps
    launched_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project skills mapping (what you learn by contributing)
CREATE TABLE forge_project_skills (
    project_id UUID NOT NULL REFERENCES forge_projects(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level skill_level NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (project_id, skill_id)
);

-- Project feature roadmap (what needs to be built)
CREATE TABLE forge_project_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES forge_projects(id) ON DELETE CASCADE,

    -- Feature info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    competitor_reference TEXT,             -- How competitor implements it

    -- Status
    status VARCHAR(50) DEFAULT 'planned',  -- planned, in_progress, completed
    priority INTEGER DEFAULT 0,            -- Higher = more important

    -- Sizing
    estimated_hours INTEGER,
    difficulty challenge_difficulty,

    -- Completion
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES user_profiles(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 2: UNIFIED CHALLENGES
-- Merge remix_challenges + competition challenges
-- ============================================================================

CREATE TYPE challenge_source AS ENUM (
    'scanner',       -- Auto-detected by codebase scanner
    'feature',       -- Derived from feature roadmap
    'issue',         -- From GitHub issue
    'manual',        -- Manually created
    'competition'    -- Competition challenge
);

-- Extend or replace remix_challenges
CREATE TABLE forge_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Source and context
    project_id UUID REFERENCES forge_projects(id) ON DELETE CASCADE,
    source challenge_source NOT NULL,
    source_id UUID,                        -- Original ID from source
    github_issue_url TEXT,                 -- If from GitHub
    feature_id UUID REFERENCES forge_project_features(id),

    -- Classification (same as remix_challenges)
    type challenge_type NOT NULL,
    severity challenge_severity NOT NULL,
    difficulty challenge_difficulty NOT NULL,

    -- Content
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    -- Code context
    location JSONB,                        -- {file, startLine, endLine}
    code_snippet TEXT,
    context_before TEXT,
    context_after TEXT,

    -- Learning content
    user_instructions TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    hints JSONB DEFAULT '[]'::jsonb,

    -- Skill mapping
    skills_required UUID[] DEFAULT '{}',
    skills_taught UUID[] DEFAULT '{}',
    tags VARCHAR(50)[] DEFAULT '{}',

    -- Estimation
    estimated_minutes INTEGER DEFAULT 30,
    xp_reward INTEGER DEFAULT 100,

    -- Review workflow
    status challenge_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES user_profiles(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,

    -- Competition mode
    is_competition BOOLEAN DEFAULT FALSE,
    competition_deadline TIMESTAMPTZ,
    max_participants INTEGER,

    -- Stats
    times_claimed INTEGER DEFAULT 0,
    times_completed INTEGER DEFAULT 0,
    avg_completion_minutes INTEGER,
    avg_score INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 3: CONTRIBUTIONS & SUBMISSIONS
-- Track the entire contribution lifecycle
-- ============================================================================

CREATE TYPE contribution_status AS ENUM (
    'claimed',           -- User claimed the challenge
    'in_progress',       -- Working on it
    'submitted',         -- PR submitted, awaiting review
    'changes_requested', -- Needs revision
    'approved',          -- PR approved
    'merged',            -- PR merged
    'closed',            -- Closed without merge
    'abandoned'          -- User gave up
);

-- User contributions (assignments + PRs)
CREATE TABLE forge_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES forge_challenges(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES forge_projects(id) ON DELETE CASCADE,

    -- GitHub integration
    fork_url TEXT,                         -- User's fork
    branch_name VARCHAR(255),
    pr_url TEXT,                           -- Pull request URL
    pr_number INTEGER,

    -- Status
    status contribution_status DEFAULT 'claimed',

    -- Timing
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    merged_at TIMESTAMPTZ,

    -- Time tracking
    time_spent_minutes INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ,

    -- Hints usage
    hints_used INTEGER DEFAULT 0,
    hints_revealed INTEGER[] DEFAULT '{}',

    -- Submission
    submission_notes TEXT,
    code_diff JSONB,                       -- Stored diff if needed

    -- Scoring (after review)
    score INTEGER,                         -- 0-100
    score_breakdown JSONB,                 -- {code_quality, completeness, tests, etc.}
    xp_earned INTEGER DEFAULT 0,

    -- Feedback
    ai_review JSONB,                       -- AI tutor feedback
    human_review JSONB,                    -- Maintainer feedback

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, challenge_id)
);

-- Contribution events timeline
CREATE TABLE forge_contribution_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contribution_id UUID NOT NULL REFERENCES forge_contributions(id) ON DELETE CASCADE,

    event_type VARCHAR(50) NOT NULL,       -- claimed, pushed, submitted, reviewed, etc.
    event_data JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 4: REVIEWS
-- AI and human review system
-- ============================================================================

CREATE TYPE review_type AS ENUM (
    'ai_automated',      -- Automatic AI review
    'ai_tutor',          -- AI tutor feedback
    'maintainer',        -- Project maintainer
    'peer'               -- Peer review
);

CREATE TYPE review_verdict AS ENUM (
    'approved',
    'changes_requested',
    'needs_discussion',
    'rejected'
);

CREATE TABLE forge_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contribution_id UUID NOT NULL REFERENCES forge_contributions(id) ON DELETE CASCADE,

    -- Reviewer
    review_type review_type NOT NULL,
    reviewer_id UUID REFERENCES user_profiles(id),  -- NULL for AI reviews

    -- Content
    verdict review_verdict NOT NULL,
    summary TEXT,

    -- Structured feedback
    feedback_items JSONB DEFAULT '[]'::jsonb,  -- Array of {type, line, comment, suggestion}

    -- For AI reviews
    ai_model VARCHAR(100),
    ai_confidence DECIMAL(3,2),

    -- Educational content
    learning_points JSONB DEFAULT '[]'::jsonb,  -- What the student should learn
    suggested_resources JSONB DEFAULT '[]'::jsonb,

    -- Scores
    code_quality_score INTEGER,            -- 0-100
    completeness_score INTEGER,
    test_coverage_score INTEGER,
    documentation_score INTEGER,
    overall_score INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 5: SKILL PROFILES
-- Unified skill tracking from contributions
-- ============================================================================

-- User skill evidence (proof of skills from contributions)
CREATE TABLE user_skill_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,

    -- Evidence source
    contribution_id UUID REFERENCES forge_contributions(id),
    challenge_id UUID REFERENCES forge_challenges(id),

    -- Assessment
    demonstrated_level skill_level NOT NULL,
    confidence DECIMAL(3,2),               -- How confident is this assessment

    -- Context
    evidence_type VARCHAR(50),             -- 'pr_merged', 'review_excellent', etc.
    evidence_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggregated skill levels (computed from evidence)
CREATE TABLE user_skill_levels (
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,

    -- Current level
    current_level skill_level NOT NULL,
    proficiency_score INTEGER DEFAULT 0,   -- 0-100 within level

    -- History
    evidence_count INTEGER DEFAULT 0,
    last_demonstrated_at TIMESTAMPTZ,

    -- Progress
    level_achieved_at TIMESTAMPTZ,
    next_level_progress INTEGER DEFAULT 0,

    updated_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (user_id, skill_id)
);

-- ============================================================================
-- SECTION 6: GITHUB INTEGRATION
-- Sync state with GitHub
-- ============================================================================

-- GitHub OAuth tokens (encrypted)
CREATE TABLE github_connections (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,

    github_id INTEGER NOT NULL,
    github_username VARCHAR(100) NOT NULL,
    github_avatar_url TEXT,

    -- Token (should be encrypted in production)
    access_token_encrypted TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ,

    -- Permissions
    scopes TEXT[],

    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ
);

-- Webhook events from GitHub
CREATE TABLE github_webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    event_type VARCHAR(100) NOT NULL,      -- 'pull_request', 'issue', etc.
    action VARCHAR(100),                   -- 'opened', 'closed', etc.

    repository VARCHAR(255),
    payload JSONB NOT NULL,

    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,

    received_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 7: INDEXES
-- ============================================================================

-- Projects
CREATE INDEX idx_forge_projects_status ON forge_projects(status);
CREATE INDEX idx_forge_projects_category ON forge_projects(category);
CREATE INDEX idx_forge_projects_language ON forge_projects(primary_language);

-- Challenges
CREATE INDEX idx_forge_challenges_project ON forge_challenges(project_id);
CREATE INDEX idx_forge_challenges_status ON forge_challenges(status);
CREATE INDEX idx_forge_challenges_difficulty ON forge_challenges(difficulty);
CREATE INDEX idx_forge_challenges_source ON forge_challenges(source);

-- Contributions
CREATE INDEX idx_forge_contributions_user ON forge_contributions(user_id);
CREATE INDEX idx_forge_contributions_challenge ON forge_contributions(challenge_id);
CREATE INDEX idx_forge_contributions_status ON forge_contributions(status);
CREATE INDEX idx_forge_contributions_project ON forge_contributions(project_id);

-- Reviews
CREATE INDEX idx_forge_reviews_contribution ON forge_reviews(contribution_id);
CREATE INDEX idx_forge_reviews_type ON forge_reviews(review_type);

-- Skill evidence
CREATE INDEX idx_skill_evidence_user ON user_skill_evidence(user_id);
CREATE INDEX idx_skill_evidence_skill ON user_skill_evidence(skill_id);
CREATE INDEX idx_skill_levels_user ON user_skill_levels(user_id);

-- ============================================================================
-- SECTION 8: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE forge_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE forge_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE forge_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE forge_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;

-- Projects: Public read, maintainers can edit
CREATE POLICY "Public read projects" ON forge_projects
    FOR SELECT USING (true);

CREATE POLICY "Maintainers can update projects" ON forge_projects
    FOR UPDATE USING (auth.uid() = ANY(lead_maintainers) OR created_by = auth.uid());

-- Challenges: Public read approved, authenticated create
CREATE POLICY "Read approved challenges" ON forge_challenges
    FOR SELECT USING (status = 'approved' OR auth.uid() IS NOT NULL);

-- Contributions: Users see their own
CREATE POLICY "Users see own contributions" ON forge_contributions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users manage own contributions" ON forge_contributions
    FOR ALL USING (user_id = auth.uid());

-- Reviews: Attached to contribution visibility
CREATE POLICY "Review visibility" ON forge_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM forge_contributions c
            WHERE c.id = contribution_id AND c.user_id = auth.uid()
        )
        OR reviewer_id = auth.uid()
        OR auth.uid() IS NOT NULL  -- All authenticated can see for transparency
    );

-- GitHub: Users see only their own
CREATE POLICY "Own GitHub connection" ON github_connections
    FOR ALL USING (user_id = auth.uid());
```

---

## Part 3: API Layer Design

### API Architecture

```
src/app/api/
├── auth/                          # Authentication
│   └── github/                    # GitHub OAuth
│       ├── callback/route.ts
│       └── route.ts
│
├── projects/                      # Project catalog
│   ├── route.ts                   # GET (list), POST (propose)
│   ├── [slug]/
│   │   ├── route.ts               # GET, PATCH
│   │   ├── challenges/route.ts    # GET challenges for project
│   │   ├── features/route.ts      # GET/POST features
│   │   └── stats/route.ts         # GET project stats
│   └── featured/route.ts          # GET featured projects
│
├── challenges/                    # Challenge management
│   ├── route.ts                   # GET (search), POST (create)
│   ├── [id]/
│   │   ├── route.ts               # GET, PATCH
│   │   ├── claim/route.ts         # POST claim challenge
│   │   └── hints/route.ts         # POST reveal hint
│   └── recommended/route.ts       # GET personalized recommendations
│
├── contributions/                 # User contributions
│   ├── route.ts                   # GET (my contributions)
│   ├── [id]/
│   │   ├── route.ts               # GET, PATCH
│   │   ├── submit/route.ts        # POST submit PR
│   │   ├── reviews/route.ts       # GET reviews
│   │   └── events/route.ts        # GET timeline
│   └── active/route.ts            # GET active contributions
│
├── reviews/                       # Review system
│   ├── route.ts                   # POST create review
│   ├── ai/
│   │   └── route.ts               # POST trigger AI review
│   └── [id]/route.ts              # GET, PATCH
│
├── skills/                        # Skill tracking
│   ├── route.ts                   # GET all skills
│   ├── profile/route.ts           # GET my skill profile
│   └── evidence/route.ts          # GET my skill evidence
│
├── github/                        # GitHub integration
│   ├── repos/route.ts             # GET user repos
│   ├── issues/route.ts            # GET issues
│   ├── pr/route.ts                # POST create PR
│   └── webhook/route.ts           # POST webhook handler
│
├── scanner/                       # Codebase scanner (existing remix)
│   ├── scans/route.ts
│   └── challenges/route.ts
│
└── ai/                            # AI services
    ├── review/route.ts            # AI PR review
    ├── tutor/route.ts             # AI tutoring
    ├── generate-challenge/route.ts
    └── explain/route.ts           # Explain code/concept
```

### Key API Implementations

#### `/api/projects/route.ts`

```typescript
// GET - List projects with filters
// POST - Propose new project

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const status = searchParams.get('status') || 'active';
  const language = searchParams.get('language');
  const difficulty = searchParams.get('difficulty');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');

  const supabase = await createClient();

  let query = supabase
    .from('forge_projects')
    .select(`
      *,
      skills:forge_project_skills(skill:skills(*)),
      challenge_count:forge_challenges(count),
      active_contributors:forge_contributions(count)
    `)
    .eq('status', status)
    .range(offset, offset + limit - 1)
    .order('contributor_count', { ascending: false });

  if (category) query = query.eq('category', category);
  if (language) query = query.eq('primary_language', language);

  const { data, error } = await query;

  return NextResponse.json({ projects: data, error });
}
```

#### `/api/challenges/recommended/route.ts`

```typescript
// GET - Get personalized challenge recommendations

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's skill levels
  const { data: skills } = await supabase
    .from('user_skill_levels')
    .select('skill_id, current_level, proficiency_score')
    .eq('user_id', user.id);

  // Get user's active contributions (to exclude)
  const { data: active } = await supabase
    .from('forge_contributions')
    .select('challenge_id')
    .eq('user_id', user.id)
    .in('status', ['claimed', 'in_progress', 'submitted']);

  const activeIds = active?.map(c => c.challenge_id) || [];

  // Find matching challenges
  const { data: challenges } = await supabase
    .from('forge_challenges')
    .select(`
      *,
      project:forge_projects(id, name, slug, logo_url)
    `)
    .eq('status', 'approved')
    .not('id', 'in', `(${activeIds.join(',')})`)
    .order('times_claimed', { ascending: true })  // Less popular first
    .limit(20);

  // Score and rank challenges by skill match
  const ranked = rankChallengesBySkillMatch(challenges, skills);

  return NextResponse.json({ challenges: ranked.slice(0, 10) });
}
```

#### `/api/contributions/[id]/submit/route.ts`

```typescript
// POST - Submit contribution for review

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await request.json();
  const { pr_url, notes } = body;

  // Verify ownership
  const { data: contribution } = await supabase
    .from('forge_contributions')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (!contribution) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Update contribution
  const { data: updated } = await supabase
    .from('forge_contributions')
    .update({
      status: 'submitted',
      pr_url,
      submission_notes: notes,
      submitted_at: new Date().toISOString()
    })
    .eq('id', params.id)
    .select()
    .single();

  // Log event
  await supabase.from('forge_contribution_events').insert({
    contribution_id: params.id,
    event_type: 'submitted',
    event_data: { pr_url }
  });

  // Trigger AI review
  await triggerAIReview(params.id, pr_url);

  return NextResponse.json({ contribution: updated });
}
```

#### `/api/reviews/ai/route.ts`

```typescript
// POST - Trigger AI review of a PR

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { contribution_id, pr_url } = body;

  const supabase = await createClient();

  // Get contribution context
  const { data: contribution } = await supabase
    .from('forge_contributions')
    .select(`
      *,
      challenge:forge_challenges(*),
      user:user_profiles(display_name, current_level)
    `)
    .eq('id', contribution_id)
    .single();

  // Fetch PR diff from GitHub
  const diff = await fetchPRDiff(pr_url);

  // Generate AI review
  const review = await generateAIReview({
    diff,
    challenge: contribution.challenge,
    studentLevel: contribution.user.current_level,
    hints_used: contribution.hints_used
  });

  // Store review
  const { data: savedReview } = await supabase
    .from('forge_reviews')
    .insert({
      contribution_id,
      review_type: 'ai_tutor',
      verdict: review.verdict,
      summary: review.summary,
      feedback_items: review.items,
      learning_points: review.learningPoints,
      suggested_resources: review.resources,
      code_quality_score: review.scores.codeQuality,
      completeness_score: review.scores.completeness,
      overall_score: review.scores.overall,
      ai_model: 'claude-3-opus',
      ai_confidence: review.confidence
    })
    .select()
    .single();

  // Update contribution status if needed
  if (review.verdict === 'approved') {
    await supabase
      .from('forge_contributions')
      .update({ status: 'approved' })
      .eq('id', contribution_id);
  } else if (review.verdict === 'changes_requested') {
    await supabase
      .from('forge_contributions')
      .update({ status: 'changes_requested' })
      .eq('id', contribution_id);
  }

  return NextResponse.json({ review: savedReview });
}
```

---

## Part 4: UI Components

### New Component Structure

```
src/app/features/contribution/
├── components/
│   ├── ProjectCatalog/
│   │   ├── ProjectGrid.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectFilters.tsx
│   │   └── FeaturedProjects.tsx
│   │
│   ├── ChallengeExplorer/
│   │   ├── ChallengeList.tsx
│   │   ├── ChallengeCard.tsx
│   │   ├── ChallengeDetail.tsx
│   │   ├── ChallengeFilters.tsx
│   │   └── RecommendedChallenges.tsx
│   │
│   ├── ContributionWorkspace/
│   │   ├── Workspace.tsx
│   │   ├── ChallengePanel.tsx
│   │   ├── CodeViewer.tsx
│   │   ├── PRSubmission.tsx
│   │   └── HintSystem.tsx
│   │
│   ├── ReviewPanel/
│   │   ├── ReviewDisplay.tsx
│   │   ├── ReviewFeedback.tsx
│   │   ├── LearningPoints.tsx
│   │   └── SuggestedResources.tsx
│   │
│   ├── ContributionDashboard/
│   │   ├── Dashboard.tsx
│   │   ├── ActiveContributions.tsx
│   │   ├── ContributionHistory.tsx
│   │   ├── SkillProgress.tsx
│   │   └── ContributionStats.tsx
│   │
│   └── shared/
│       ├── DifficultyBadge.tsx
│       ├── StatusBadge.tsx
│       ├── SkillTags.tsx
│       ├── TimeEstimate.tsx
│       └── XPReward.tsx
│
├── lib/
│   ├── api.ts              # API client
│   ├── types.ts            # TypeScript types
│   ├── hooks/
│   │   ├── useProjects.ts
│   │   ├── useChallenges.ts
│   │   ├── useContributions.ts
│   │   └── useSkillProfile.ts
│   └── utils/
│       ├── skillMatching.ts
│       ├── diffAnalysis.ts
│       └── scoring.ts
│
└── index.ts
```

### Key UI Components

#### ProjectCard.tsx

```tsx
interface ProjectCardProps {
  project: ForgeProject;
  onSelect: (project: ForgeProject) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelect }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={() => onSelect(project)}
      className="p-6 rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] cursor-pointer"
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="w-12 h-12 rounded-lg bg-[var(--surface-overlay)] flex items-center justify-center">
          {project.logo_url ? (
            <img src={project.logo_url} alt={project.name} className="w-8 h-8" />
          ) : (
            <Code size={24} className="text-[var(--accent-primary)]" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-[var(--text-primary)]">{project.name}</h3>
          <p className="text-sm text-[var(--text-muted)]">{project.tagline}</p>

          {/* Tech stack */}
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded text-xs bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
              {project.primary_language}
            </span>
            {project.framework && (
              <span className="px-2 py-0.5 rounded text-xs bg-[var(--surface-overlay)] text-[var(--text-muted)]">
                {project.framework}
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3 text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <Users size={12} />
              {project.contributor_count} contributors
            </span>
            <span className="flex items-center gap-1">
              <Target size={12} />
              {project.feature_parity_percent}% complete
            </span>
          </div>
        </div>

        <ChevronRight size={20} className="text-[var(--text-muted)]" />
      </div>
    </motion.div>
  );
};
```

#### ContributionDashboard.tsx

```tsx
export const ContributionDashboard: React.FC = () => {
  const { contributions, isLoading } = useContributions();
  const { skillProfile } = useSkillProfile();

  const activeContributions = contributions.filter(c =>
    ['claimed', 'in_progress', 'submitted', 'changes_requested'].includes(c.status)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            My Contributions
          </h1>
          <p className="text-[var(--text-muted)]">
            Track your open source journey
          </p>
        </div>
        <Link href="/challenges">
          <Button>Find New Challenge</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Contributions"
          value={contributions.length}
          icon={GitPullRequest}
        />
        <StatCard
          label="Merged PRs"
          value={contributions.filter(c => c.status === 'merged').length}
          icon={GitMerge}
          color="emerald"
        />
        <StatCard
          label="XP Earned"
          value={skillProfile?.total_xp || 0}
          icon={Zap}
          color="amber"
        />
        <StatCard
          label="Skills Demonstrated"
          value={skillProfile?.skills?.length || 0}
          icon={Award}
          color="purple"
        />
      </div>

      {/* Active Contributions */}
      {activeContributions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">Active Work</h2>
          <div className="space-y-3">
            {activeContributions.map(contribution => (
              <ActiveContributionCard
                key={contribution.id}
                contribution={contribution}
              />
            ))}
          </div>
        </section>
      )}

      {/* Skill Progress */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Skill Growth</h2>
        <SkillProgressGrid skills={skillProfile?.skills || []} />
      </section>

      {/* History */}
      <section>
        <h2 className="text-lg font-semibold mb-4">History</h2>
        <ContributionHistory contributions={contributions} />
      </section>
    </div>
  );
};
```

---

## Part 5: Implementation Phases

### Phase 1: Foundation (Weeks 1-4)

**Database:**
- [ ] Create migration 003_projects_contributions.sql
- [ ] Run migration on Supabase
- [ ] Seed initial project (OpenCRM)

**API:**
- [ ] `/api/projects` - CRUD operations
- [ ] `/api/challenges` - Extend from remix endpoints
- [ ] `/api/contributions` - Basic CRUD
- [ ] `/api/skills/profile` - Read skill levels

**UI:**
- [ ] Project catalog page
- [ ] Challenge browser
- [ ] Basic contribution tracking

### Phase 2: GitHub Integration (Weeks 5-8)

**Database:**
- [ ] GitHub connections table
- [ ] Webhook events table

**API:**
- [ ] `/api/auth/github` - OAuth flow
- [ ] `/api/github/repos` - User repos
- [ ] `/api/github/pr` - Create PR
- [ ] `/api/github/webhook` - Handle events

**UI:**
- [ ] GitHub connect flow
- [ ] Fork creation UI
- [ ] PR submission form
- [ ] PR status tracking

### Phase 3: AI Review System (Weeks 9-12)

**API:**
- [ ] `/api/reviews/ai` - Trigger AI review
- [ ] `/api/ai/tutor` - Get explanations
- [ ] Review prompt engineering

**UI:**
- [ ] Review display component
- [ ] Learning points panel
- [ ] Resource suggestions
- [ ] Revision workflow

### Phase 4: Skill Tracking (Weeks 13-16)

**Database:**
- [ ] Skill evidence tables
- [ ] Skill level aggregation

**API:**
- [ ] `/api/skills/evidence` - Log evidence
- [ ] `/api/challenges/recommended` - Skill-based matching

**UI:**
- [ ] Skill profile page
- [ ] Evidence timeline
- [ ] Level up celebrations
- [ ] Skill-based filtering

### Phase 5: Community Features (Weeks 17-20)

**Database:**
- [ ] Leaderboard views
- [ ] Achievement tracking

**UI:**
- [ ] Project leaderboards
- [ ] Contributor rankings
- [ ] Achievement badges
- [ ] Social sharing

---

## Part 6: Migration Strategy

### Data Migration

1. **Migrate remix_projects → forge_projects**
   - Add new fields (category, github_*, etc.)
   - Keep existing data

2. **Migrate remix_challenges → forge_challenges**
   - Add source field = 'scanner'
   - Add skills_required/taught
   - Keep existing data

3. **Migrate remix_assignments → forge_contributions**
   - Map status fields
   - Add new GitHub fields as null
   - Keep existing data

### Feature Flag Rollout

```typescript
// src/lib/features.ts
export const FEATURES = {
  // Phase 1
  FORGE_PROJECTS: process.env.NEXT_PUBLIC_FEATURE_FORGE_PROJECTS === 'true',

  // Phase 2
  GITHUB_INTEGRATION: process.env.NEXT_PUBLIC_FEATURE_GITHUB === 'true',

  // Phase 3
  AI_REVIEWS: process.env.NEXT_PUBLIC_FEATURE_AI_REVIEWS === 'true',

  // Phase 4
  SKILL_TRACKING: process.env.NEXT_PUBLIC_FEATURE_SKILL_TRACKING === 'true',
};
```

---

## Part 7: Success Metrics

### Phase 1 Success

- [ ] 1 project live (OpenCRM)
- [ ] 50+ challenges available
- [ ] 10+ users completing challenges
- [ ] Basic contribution flow working

### Phase 2 Success

- [ ] GitHub OAuth working
- [ ] PRs being created from platform
- [ ] Webhook sync reliable
- [ ] 5+ PRs merged to real repos

### Phase 3 Success

- [ ] AI reviews providing useful feedback
- [ ] Students report learning from reviews
- [ ] Review quality rated 4+/5

### Phase 4 Success

- [ ] Skill profiles reflecting contributions
- [ ] Challenge recommendations relevant
- [ ] Users report accurate skill assessment

### Full Launch Criteria

- [ ] 3+ active projects
- [ ] 100+ contributors
- [ ] 50+ merged PRs
- [ ] 90%+ satisfaction rating

---

*This implementation plan is a living document. Last updated: December 2024*
