-- ============================================================================
-- Project Scanner - Real-World Task Learning Platform
-- Supabase (PostgreSQL) Migration
--
-- This schema supports:
-- 1. GitHub repository catalog with tech stack analysis
-- 2. AI-decomposed learnable features from repositories
-- 3. Homework assignments mapped to chapters
-- 4. Async scanning job tracking with Datadog observability
-- ============================================================================

-- ============================================================================
-- SECTION 0: EXTENSIONS AND HELPER FUNCTIONS
-- ============================================================================

-- Ensure uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 1: ENUMS
-- ============================================================================

CREATE TYPE project_difficulty_tier AS ENUM (
    'beginner',
    'intermediate',
    'advanced',
    'expert'
);

CREATE TYPE project_feature_status AS ENUM (
    'draft',
    'approved',
    'assigned',
    'archived'
);

CREATE TYPE project_assignment_status AS ENUM (
    'assigned',
    'in_progress',
    'submitted',
    'completed',
    'abandoned'
);

CREATE TYPE project_scan_type AS ENUM (
    'repository_analysis',      -- Initial repo scan
    'feature_decomposition',    -- Extract features from repo
    'feature_enrichment',       -- Add learning context to features
    'chapter_mapping'           -- Map features to chapters
);

CREATE TYPE project_scan_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);

-- ============================================================================
-- SECTION 2: PROJECT REPOSITORIES
-- GitHub repository catalog for feature-based learning
-- ============================================================================

CREATE TABLE project_repositories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Repository identification
    name VARCHAR(255) NOT NULL,
    owner VARCHAR(100) NOT NULL,                    -- GitHub org/user
    source_repo_url TEXT NOT NULL,                  -- Full GitHub URL

    -- GitHub metadata
    github_stars INTEGER DEFAULT 0,
    github_forks INTEGER DEFAULT 0,
    default_branch VARCHAR(100) DEFAULT 'main',

    -- Tech stack detection (from AI scan)
    primary_language VARCHAR(50),
    framework VARCHAR(100),
    tech_stack JSONB DEFAULT '[]'::jsonb,           -- ["React", "TypeScript", "Tailwind"]

    -- Difficulty and complexity
    difficulty_tier project_difficulty_tier DEFAULT 'intermediate',
    complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
    estimated_onboarding_hours INTEGER,

    -- Content metadata (AI-generated summaries)
    readme_summary TEXT,
    contribution_guide_summary TEXT,
    architecture_overview TEXT,

    -- Feature manifest (cached from scans)
    feature_manifest JSONB DEFAULT '[]'::jsonb,     -- Array of feature IDs for quick access
    feature_count INTEGER DEFAULT 0,

    -- Mapping to learning content
    mapped_chapter_ids UUID[] DEFAULT '{}',         -- Chapters that teach skills for this repo
    mapped_skill_ids UUID[] DEFAULT '{}',           -- Skills practiced in this repo
    domain_id UUID,                                 -- Primary domain (no FK - domains may not exist)

    -- Scan metadata
    last_scanned_at TIMESTAMPTZ,
    scan_version VARCHAR(20) DEFAULT '1.0.0',

    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'ready', 'archived')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(owner, name)
);

-- Indexes for efficient querying
CREATE INDEX idx_project_repos_status ON project_repositories(status);
CREATE INDEX idx_project_repos_language ON project_repositories(primary_language);
CREATE INDEX idx_project_repos_difficulty ON project_repositories(difficulty_tier);
CREATE INDEX idx_project_repos_scanned ON project_repositories(last_scanned_at DESC);
CREATE INDEX idx_project_repos_domain ON project_repositories(domain_id);
CREATE INDEX idx_project_repos_search ON project_repositories
    USING gin(to_tsvector('english', name || ' ' || COALESCE(readme_summary, '')));

-- ============================================================================
-- SECTION 3: PROJECT FEATURES
-- Decomposed learnable features from repositories
-- ============================================================================

CREATE TABLE project_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    repo_id UUID NOT NULL REFERENCES project_repositories(id) ON DELETE CASCADE,

    -- Feature identification
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,

    -- Complexity and estimation
    complexity_score INTEGER CHECK (complexity_score >= 1 AND complexity_score <= 10),
    estimated_hours DECIMAL(5, 1),
    difficulty project_difficulty_tier DEFAULT 'intermediate',

    -- File scope (from AI analysis)
    file_scope JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{path, purpose, lines_estimate}]
    entry_points JSONB DEFAULT '[]'::jsonb,         -- Key files to start reading

    -- Learning content
    context_summary TEXT,                           -- What this feature does
    prerequisites TEXT[] DEFAULT '{}',              -- Skills needed
    learning_outcomes TEXT[] DEFAULT '{}',          -- What you'll learn

    -- Acceptance criteria (for validation)
    acceptance_tests JSONB DEFAULT '[]'::jsonb,     -- [{description, validation_type, expected}]

    -- Chapter mappings
    chapter_mappings JSONB DEFAULT '[]'::jsonb,     -- [{chapter_id, relevance_score, rationale}]
    primary_chapter_id UUID,                        -- Primary chapter (no FK - chapters may not exist)

    -- AI metadata
    ai_confidence DECIMAL(3, 2),
    grounding_sources JSONB,                        -- Google Search sources used
    model_used VARCHAR(50),

    -- Status
    status project_feature_status DEFAULT 'draft',

    -- Stats
    assignment_count INTEGER DEFAULT 0,
    completion_count INTEGER DEFAULT 0,
    avg_score DECIMAL(5, 2),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(repo_id, slug)
);

-- Indexes
CREATE INDEX idx_project_features_repo ON project_features(repo_id);
CREATE INDEX idx_project_features_status ON project_features(status);
CREATE INDEX idx_project_features_difficulty ON project_features(difficulty);
CREATE INDEX idx_project_features_chapter ON project_features(primary_chapter_id);
CREATE INDEX idx_project_features_search ON project_features
    USING gin(to_tsvector('english', name || ' ' || description));

-- ============================================================================
-- SECTION 4: HOMEWORK ASSIGNMENTS
-- Student assignments for features
-- ============================================================================

CREATE TABLE project_homework_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    user_id UUID NOT NULL,                          -- User ID (no FK - user_profiles may not exist)
    feature_id UUID NOT NULL REFERENCES project_features(id) ON DELETE CASCADE,
    chapter_id UUID,                                -- Chapter ID (no FK - chapters may not exist)

    -- Assignment details
    status project_assignment_status DEFAULT 'assigned',

    -- Instructions (can be customized per assignment)
    instructions TEXT,                              -- Step-by-step guide
    custom_context TEXT,                            -- Teacher-provided context

    -- Progress tracking
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    time_spent_minutes INTEGER DEFAULT 0,

    -- Hints system
    hints_available JSONB DEFAULT '[]'::jsonb,      -- Progressive hints
    hints_used INTEGER DEFAULT 0,
    hints_revealed JSONB DEFAULT '[]'::jsonb,       -- Indices of revealed hints

    -- Submission
    submission_url TEXT,                            -- PR or branch URL
    submission_notes TEXT,
    submission_diff JSONB,                          -- Code changes

    -- Scoring
    score INTEGER CHECK (score >= 0 AND score <= 100),
    score_breakdown JSONB,                          -- {criteria: score} breakdown
    ai_feedback JSONB,                              -- Claude Code analysis

    -- XP
    xp_earned INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, feature_id)
);

-- Indexes
CREATE INDEX idx_project_assignments_user ON project_homework_assignments(user_id);
CREATE INDEX idx_project_assignments_feature ON project_homework_assignments(feature_id);
CREATE INDEX idx_project_assignments_status ON project_homework_assignments(status);
CREATE INDEX idx_project_assignments_chapter ON project_homework_assignments(chapter_id);
CREATE INDEX idx_project_assignments_created ON project_homework_assignments(created_at DESC);

-- ============================================================================
-- SECTION 5: SCAN JOBS
-- Async AI scanning operations (follows content_generation_jobs pattern)
-- ============================================================================

CREATE TABLE project_scan_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Target
    repo_id UUID NOT NULL REFERENCES project_repositories(id) ON DELETE CASCADE,
    feature_id UUID REFERENCES project_features(id) ON DELETE CASCADE,

    -- Job configuration
    scan_type project_scan_type NOT NULL,
    status project_scan_status DEFAULT 'pending',

    -- Input context (for debugging/replay)
    prompt_context JSONB,

    -- Output
    generated_content JSONB,
    error_message TEXT,

    -- Progress tracking
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    progress_message TEXT,

    -- LLM metadata (matches content_generation_jobs pattern for Datadog)
    model_used VARCHAR(50) DEFAULT 'gemini-2.0-flash-exp',
    tokens_used INTEGER,
    latency_ms INTEGER,
    grounding_sources JSONB,

    -- Cost tracking (for Datadog monitoring)
    estimated_cost_usd DECIMAL(10, 6),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_project_scans_repo ON project_scan_jobs(repo_id);
CREATE INDEX idx_project_scans_status ON project_scan_jobs(status)
    WHERE status IN ('pending', 'processing');
CREATE INDEX idx_project_scans_created ON project_scan_jobs(created_at DESC);
CREATE INDEX idx_project_scans_type ON project_scan_jobs(scan_type);

-- ============================================================================
-- SECTION 6: TRIGGERS
-- ============================================================================

-- Update repository feature count when features change
CREATE OR REPLACE FUNCTION update_repo_feature_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE project_repositories
        SET feature_count = (
            SELECT COUNT(*) FROM project_features
            WHERE repo_id = NEW.repo_id AND status IN ('approved', 'assigned')
        ),
        feature_manifest = (
            SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) FROM project_features
            WHERE repo_id = NEW.repo_id AND status IN ('approved', 'assigned')
        )
        WHERE id = NEW.repo_id;
    END IF;

    IF TG_OP = 'DELETE' THEN
        UPDATE project_repositories
        SET feature_count = (
            SELECT COUNT(*) FROM project_features
            WHERE repo_id = OLD.repo_id AND status IN ('approved', 'assigned')
        ),
        feature_manifest = (
            SELECT COALESCE(jsonb_agg(id), '[]'::jsonb) FROM project_features
            WHERE repo_id = OLD.repo_id AND status IN ('approved', 'assigned')
        )
        WHERE id = OLD.repo_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_repo_feature_count
AFTER INSERT OR UPDATE OR DELETE ON project_features
FOR EACH ROW EXECUTE FUNCTION update_repo_feature_count();

-- Update feature stats when assignments complete
CREATE OR REPLACE FUNCTION update_feature_assignment_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE project_features
        SET
            completion_count = completion_count + 1,
            assignment_count = (
                SELECT COUNT(*) FROM project_homework_assignments WHERE feature_id = NEW.feature_id
            ),
            avg_score = (
                SELECT AVG(score) FROM project_homework_assignments
                WHERE feature_id = NEW.feature_id AND score IS NOT NULL
            )
        WHERE id = NEW.feature_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feature_stats
AFTER INSERT OR UPDATE ON project_homework_assignments
FOR EACH ROW EXECUTE FUNCTION update_feature_assignment_stats();

-- Auto-update timestamps
CREATE TRIGGER update_project_repositories_timestamp
BEFORE UPDATE ON project_repositories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_features_timestamp
BEFORE UPDATE ON project_features
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_assignments_timestamp
BEFORE UPDATE ON project_homework_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 7: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE project_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_scan_jobs ENABLE ROW LEVEL SECURITY;

-- Repositories: Public read for ready repos
CREATE POLICY "Anyone can view ready repositories" ON project_repositories
    FOR SELECT TO anon, authenticated
    USING (status = 'ready');

-- Features: Public read for approved features
CREATE POLICY "Anyone can view approved features" ON project_features
    FOR SELECT TO anon, authenticated
    USING (status IN ('approved', 'assigned'));

-- Assignments: Users can only see/modify their own
CREATE POLICY "Users can view own assignments" ON project_homework_assignments
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assignments" ON project_homework_assignments
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assignments" ON project_homework_assignments
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Scan jobs: Read-only for authenticated users (status checking)
CREATE POLICY "Authenticated users can view scan jobs" ON project_scan_jobs
    FOR SELECT TO authenticated
    USING (true);

-- ============================================================================
-- SECTION 8: VIEWS
-- ============================================================================

-- Feature overview with repository context
CREATE OR REPLACE VIEW project_feature_overview AS
SELECT
    f.id,
    f.name,
    f.slug,
    f.description,
    f.complexity_score,
    f.estimated_hours,
    f.difficulty,
    f.status,
    f.file_scope,
    f.acceptance_tests,
    f.learning_outcomes,
    f.assignment_count,
    f.completion_count,
    f.avg_score,
    r.id AS repo_id,
    r.name AS repo_name,
    r.owner AS repo_owner,
    r.source_repo_url,
    r.primary_language,
    r.framework,
    r.difficulty_tier AS repo_difficulty
FROM project_features f
JOIN project_repositories r ON f.repo_id = r.id
WHERE f.status IN ('approved', 'assigned')
  AND r.status = 'ready';

-- User assignment progress
CREATE OR REPLACE VIEW project_user_progress AS
SELECT
    a.user_id,
    a.id AS assignment_id,
    a.status,
    a.score,
    a.time_spent_minutes,
    a.xp_earned,
    a.created_at AS assigned_at,
    a.completed_at,
    f.id AS feature_id,
    f.name AS feature_name,
    f.difficulty,
    f.estimated_hours,
    r.name AS repo_name,
    r.owner AS repo_owner,
    a.chapter_id                                    -- Chapter ID stored directly (no FK join)
FROM project_homework_assignments a
JOIN project_features f ON a.feature_id = f.id
JOIN project_repositories r ON f.repo_id = r.id;

-- Scan job status for monitoring (named differently to avoid conflict with project_scan_status enum)
CREATE OR REPLACE VIEW project_scan_jobs_overview AS
SELECT
    j.id AS job_id,
    j.scan_type,
    j.status,
    j.progress_percent,
    j.progress_message,
    j.tokens_used,
    j.latency_ms,
    j.estimated_cost_usd,
    j.error_message,
    j.created_at,
    j.started_at,
    j.completed_at,
    EXTRACT(EPOCH FROM (COALESCE(j.completed_at, NOW()) - j.started_at)) * 1000 AS duration_ms,
    r.name AS repo_name,
    r.owner AS repo_owner
FROM project_scan_jobs j
JOIN project_repositories r ON j.repo_id = r.id
ORDER BY j.created_at DESC;

-- ============================================================================
-- SECTION 9: FUNCTIONS
-- ============================================================================

-- Get features available for a chapter
CREATE OR REPLACE FUNCTION get_chapter_features(p_chapter_id UUID)
RETURNS TABLE (
    feature_id UUID,
    feature_name VARCHAR(255),
    repo_name VARCHAR(255),
    repo_owner VARCHAR(100),
    difficulty project_difficulty_tier,
    estimated_hours DECIMAL(5, 1),
    complexity_score INTEGER,
    relevance_score DECIMAL(3, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.name,
        r.name,
        r.owner,
        f.difficulty,
        f.estimated_hours,
        f.complexity_score,
        (cm->>'relevance_score')::DECIMAL(3, 2) AS relevance_score
    FROM project_features f
    JOIN project_repositories r ON f.repo_id = r.id,
    LATERAL jsonb_array_elements(f.chapter_mappings) AS cm
    WHERE f.status IN ('approved', 'assigned')
      AND r.status = 'ready'
      AND (cm->>'chapter_id')::UUID = p_chapter_id
    ORDER BY relevance_score DESC, f.complexity_score ASC;
END;
$$ LANGUAGE plpgsql;

-- Get user's assignment for a feature (if exists)
CREATE OR REPLACE FUNCTION get_user_feature_assignment(p_user_id UUID, p_feature_id UUID)
RETURNS TABLE (
    assignment_id UUID,
    status project_assignment_status,
    progress_percent INTEGER,
    hints_used INTEGER,
    score INTEGER,
    time_spent_minutes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.status,
        CASE
            WHEN a.status = 'completed' THEN 100
            WHEN a.status = 'submitted' THEN 90
            WHEN a.status = 'in_progress' THEN 50
            ELSE 0
        END AS progress_percent,
        a.hints_used,
        a.score,
        a.time_spent_minutes
    FROM project_homework_assignments a
    WHERE a.user_id = p_user_id AND a.feature_id = p_feature_id;
END;
$$ LANGUAGE plpgsql;
