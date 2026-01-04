-- ============================================================================
-- Homework System Enhancement
-- Adds tables for homework definitions, PR tracking, and evaluations
-- Extends project_scanner schema (migration 007)
-- ============================================================================

-- ============================================================================
-- SECTION 1: NEW ENUMS
-- ============================================================================

CREATE TYPE homework_type AS ENUM (
    'implementation',
    'ui_design',
    'responsive',
    'performance',
    'testing',
    'accessibility',
    'edge_cases',
    'documentation'
);

CREATE TYPE homework_status AS ENUM (
    'draft',
    'open',
    'active',
    'reviewing',
    'completed',
    'archived'
);

CREATE TYPE pr_status AS ENUM (
    'pending',
    'submitted',
    'reviewing',
    'approved',
    'changes_requested',
    'winner',
    'closed'
);

CREATE TYPE evaluation_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'failed'
);

-- ============================================================================
-- SECTION 2: PROJECT HOMEWORK DEFINITIONS
-- Defines WHAT homework can be assigned (1 feature -> N homeworks)
-- Decoupled from assignments - defines the homework template
-- ============================================================================

CREATE TABLE project_homework_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    feature_id UUID NOT NULL REFERENCES project_features(id) ON DELETE CASCADE,
    chapter_id UUID,  -- Which chapter this homework reinforces (no FK)

    -- Homework identity
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(200) NOT NULL,
    homework_type homework_type NOT NULL DEFAULT 'implementation',
    description TEXT NOT NULL,

    -- Difficulty and estimation
    difficulty project_difficulty_tier DEFAULT 'intermediate',
    estimated_hours DECIMAL(5, 1),
    xp_reward INTEGER DEFAULT 100,

    -- Branch naming (generated pattern)
    branch_prefix VARCHAR(255) NOT NULL,  -- e.g., "feat/user-auth:core-impl"

    -- Instructions for students
    instructions TEXT NOT NULL,

    -- Acceptance criteria (JSON array)
    -- [{id, description, validation_type, expected, testable, weight}]
    acceptance_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Progressive hints (JSON array)
    -- [{level, content, xp_cost_percent}]
    hints JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- File scope (JSON array)
    -- [{path, purpose, required}]
    file_scope JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Skills reinforced (array of skill slugs)
    skills_reinforced TEXT[] DEFAULT '{}',

    -- Mapping metadata
    relevance_score DECIMAL(3, 2) DEFAULT 0.5 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    mapping_rationale TEXT,

    -- Status
    status homework_status DEFAULT 'draft',

    -- Stats (updated by triggers)
    total_submissions INTEGER DEFAULT 0,
    completion_rate DECIMAL(5, 2) DEFAULT 0,
    avg_score DECIMAL(5, 2),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(feature_id, slug)
);

-- Indexes
CREATE INDEX idx_homework_defs_feature ON project_homework_definitions(feature_id);
CREATE INDEX idx_homework_defs_chapter ON project_homework_definitions(chapter_id);
CREATE INDEX idx_homework_defs_status ON project_homework_definitions(status);
CREATE INDEX idx_homework_defs_type ON project_homework_definitions(homework_type);
CREATE INDEX idx_homework_defs_difficulty ON project_homework_definitions(difficulty);

-- ============================================================================
-- SECTION 3: ALTER EXISTING ASSIGNMENTS TABLE
-- Add columns for homework definitions and PR tracking
-- ============================================================================

ALTER TABLE project_homework_assignments
    ADD COLUMN homework_definition_id UUID REFERENCES project_homework_definitions(id),
    ADD COLUMN branch_name VARCHAR(255),
    ADD COLUMN pr_url TEXT,
    ADD COLUMN pr_number INTEGER,
    ADD COLUMN pr_status pr_status DEFAULT 'pending',
    ADD COLUMN pr_created_at TIMESTAMPTZ,
    ADD COLUMN pr_updated_at TIMESTAMPTZ,
    ADD COLUMN is_winner BOOLEAN DEFAULT false;

-- Create indexes for PR lookups
CREATE INDEX idx_assignments_pr_status ON project_homework_assignments(pr_status);
CREATE INDEX idx_assignments_homework_def ON project_homework_assignments(homework_definition_id);
CREATE INDEX idx_assignments_branch ON project_homework_assignments(branch_name);
CREATE INDEX idx_assignments_winner ON project_homework_assignments(is_winner) WHERE is_winner = true;

-- ============================================================================
-- SECTION 4: PR SUBMISSIONS TABLE
-- Tracks individual PR submissions (user might have multiple attempts)
-- ============================================================================

CREATE TABLE project_pr_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    assignment_id UUID NOT NULL REFERENCES project_homework_assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,

    -- GitHub data
    pr_number INTEGER NOT NULL,
    pr_url TEXT NOT NULL,
    branch_name VARCHAR(255) NOT NULL,

    -- PR metadata (from GitHub API)
    title VARCHAR(500),
    body TEXT,
    additions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    commits_count INTEGER DEFAULT 0,
    files_changed INTEGER DEFAULT 0,

    -- Status
    status pr_status DEFAULT 'submitted',

    -- GitHub sync
    github_id BIGINT,  -- GitHub's PR ID
    github_state VARCHAR(20),  -- open, closed, merged
    is_draft BOOLEAN DEFAULT false,
    is_merged BOOLEAN DEFAULT false,
    mergeable BOOLEAN,

    -- Timestamps
    submitted_at TIMESTAMPTZ NOT NULL,
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(assignment_id, pr_number)
);

-- Indexes
CREATE INDEX idx_pr_subs_assignment ON project_pr_submissions(assignment_id);
CREATE INDEX idx_pr_subs_user ON project_pr_submissions(user_id);
CREATE INDEX idx_pr_subs_status ON project_pr_submissions(status);
CREATE INDEX idx_pr_subs_github ON project_pr_submissions(github_id);

-- ============================================================================
-- SECTION 5: PR EVALUATIONS TABLE
-- Stores AI evaluation results for each PR
-- ============================================================================

CREATE TABLE project_pr_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    submission_id UUID NOT NULL REFERENCES project_pr_submissions(id) ON DELETE CASCADE,
    homework_definition_id UUID NOT NULL REFERENCES project_homework_definitions(id),

    -- Evaluation status
    status evaluation_status DEFAULT 'pending',

    -- Scores breakdown (JSONB for flexibility)
    -- code_quality: {correctness, clean_code, type_safety, error_handling, no_antipatterns, total}
    code_quality_scores JSONB DEFAULT '{}'::jsonb,
    -- acceptance_criteria: {criterion_id: {score, max, notes}}
    acceptance_criteria_scores JSONB DEFAULT '{}'::jsonb,
    -- excellence: {beyond_requirements, code_organization, documentation, test_coverage, total}
    excellence_scores JSONB DEFAULT '{}'::jsonb,

    -- Score totals (out of 100)
    code_quality_total INTEGER DEFAULT 0 CHECK (code_quality_total >= 0 AND code_quality_total <= 40),
    acceptance_criteria_total INTEGER DEFAULT 0 CHECK (acceptance_criteria_total >= 0 AND acceptance_criteria_total <= 40),
    excellence_total INTEGER DEFAULT 0 CHECK (excellence_total >= 0 AND excellence_total <= 20),
    final_score INTEGER DEFAULT 0 CHECK (final_score >= 0 AND final_score <= 100),

    -- Feedback content
    strengths TEXT[] DEFAULT '{}',
    improvements TEXT[] DEFAULT '{}',
    feedback_comment TEXT,  -- Full markdown comment for GitHub

    -- GitHub comment tracking
    github_comment_id VARCHAR(100),
    github_comment_url TEXT,
    comment_posted_at TIMESTAMPTZ,

    -- Evaluation metadata
    evaluator_model VARCHAR(50) DEFAULT 'claude-opus-4-5',
    tokens_used INTEGER,
    evaluation_duration_ms INTEGER,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(submission_id)
);

-- Indexes
CREATE INDEX idx_evaluations_submission ON project_pr_evaluations(submission_id);
CREATE INDEX idx_evaluations_homework ON project_pr_evaluations(homework_definition_id);
CREATE INDEX idx_evaluations_status ON project_pr_evaluations(status);
CREATE INDEX idx_evaluations_score ON project_pr_evaluations(final_score DESC);

-- ============================================================================
-- SECTION 6: HOMEWORK WINNERS TABLE
-- Tracks winners for each homework evaluation cycle
-- ============================================================================

CREATE TABLE project_homework_winners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    homework_definition_id UUID NOT NULL REFERENCES project_homework_definitions(id),
    submission_id UUID NOT NULL REFERENCES project_pr_submissions(id),
    evaluation_id UUID REFERENCES project_pr_evaluations(id),
    user_id UUID NOT NULL,

    -- Winning details
    final_score INTEGER NOT NULL,
    selection_reason TEXT,

    -- Evaluation cycle (for recurring homeworks)
    evaluation_cycle_start TIMESTAMPTZ,
    evaluation_cycle_end TIMESTAMPTZ,

    -- Notification tracking
    user_notified BOOLEAN DEFAULT false,
    notified_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(homework_definition_id, evaluation_cycle_end)
);

-- Indexes
CREATE INDEX idx_winners_homework ON project_homework_winners(homework_definition_id);
CREATE INDEX idx_winners_user ON project_homework_winners(user_id);
CREATE INDEX idx_winners_created ON project_homework_winners(created_at DESC);

-- ============================================================================
-- SECTION 7: TRIGGERS
-- ============================================================================

-- Update homework definition stats when assignments complete
CREATE OR REPLACE FUNCTION update_homework_def_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE project_homework_definitions
        SET
            total_submissions = total_submissions + 1,
            avg_score = (
                SELECT AVG(a.score)
                FROM project_homework_assignments a
                WHERE a.homework_definition_id = NEW.homework_definition_id
                AND a.score IS NOT NULL
            ),
            completion_rate = (
                SELECT (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL /
                        NULLIF(COUNT(*), 0) * 100)
                FROM project_homework_assignments
                WHERE homework_definition_id = NEW.homework_definition_id
            ),
            updated_at = NOW()
        WHERE id = NEW.homework_definition_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_homework_def_stats
AFTER UPDATE ON project_homework_assignments
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION update_homework_def_stats();

-- Auto-update timestamps for new tables
CREATE TRIGGER update_homework_definitions_timestamp
BEFORE UPDATE ON project_homework_definitions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pr_submissions_timestamp
BEFORE UPDATE ON project_pr_submissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pr_evaluations_timestamp
BEFORE UPDATE ON project_pr_evaluations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 8: VIEWS
-- ============================================================================

-- Chapter homework overview (for chapter page queries)
CREATE OR REPLACE VIEW chapter_homework_overview AS
SELECT
    hd.id AS homework_id,
    hd.name AS homework_name,
    hd.slug AS homework_slug,
    hd.homework_type,
    hd.difficulty,
    hd.estimated_hours,
    hd.xp_reward,
    hd.status,
    hd.chapter_id,
    hd.relevance_score,
    hd.description,
    hd.branch_prefix,
    f.id AS feature_id,
    f.name AS feature_name,
    f.slug AS feature_slug,
    r.id AS project_id,
    r.name AS project_name,
    r.owner AS project_owner,
    r.source_repo_url,
    r.default_branch,
    hd.total_submissions,
    hd.avg_score
FROM project_homework_definitions hd
JOIN project_features f ON hd.feature_id = f.id
JOIN project_repositories r ON f.repo_id = r.id
WHERE hd.status IN ('open', 'active')
  AND f.status IN ('approved', 'assigned')
  AND r.status = 'ready';

-- User homework progress view
CREATE OR REPLACE VIEW user_homework_progress AS
SELECT
    a.user_id,
    a.id AS assignment_id,
    a.status AS assignment_status,
    a.pr_status,
    a.pr_url,
    a.pr_number,
    a.branch_name,
    a.score,
    a.xp_earned,
    a.time_spent_minutes,
    a.hints_used,
    a.is_winner,
    a.created_at AS assigned_at,
    a.completed_at,
    hd.id AS homework_id,
    hd.name AS homework_name,
    hd.homework_type,
    hd.difficulty,
    hd.estimated_hours,
    hd.xp_reward,
    hd.chapter_id,
    f.name AS feature_name,
    r.name AS project_name,
    r.owner AS project_owner,
    r.source_repo_url
FROM project_homework_assignments a
JOIN project_homework_definitions hd ON a.homework_definition_id = hd.id
JOIN project_features f ON hd.feature_id = f.id
JOIN project_repositories r ON f.repo_id = r.id;

-- ============================================================================
-- SECTION 9: FUNCTIONS
-- ============================================================================

-- Get open homeworks for a specific chapter with user progress
CREATE OR REPLACE FUNCTION get_chapter_homeworks(
    p_chapter_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    homework_id UUID,
    homework_name VARCHAR(255),
    homework_slug VARCHAR(200),
    homework_type homework_type,
    difficulty project_difficulty_tier,
    estimated_hours DECIMAL(5, 1),
    xp_reward INTEGER,
    description TEXT,
    branch_prefix VARCHAR(255),
    project_id UUID,
    project_name VARCHAR(255),
    project_owner VARCHAR(100),
    source_repo_url TEXT,
    default_branch VARCHAR(100),
    feature_id UUID,
    feature_name VARCHAR(255),
    relevance_score DECIMAL(3, 2),
    user_assignment_id UUID,
    user_assignment_status project_assignment_status,
    user_pr_status pr_status,
    user_branch_name VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        hd.id,
        hd.name,
        hd.slug,
        hd.homework_type,
        hd.difficulty,
        hd.estimated_hours,
        hd.xp_reward,
        hd.description,
        hd.branch_prefix,
        r.id,
        r.name,
        r.owner,
        r.source_repo_url,
        r.default_branch,
        f.id,
        f.name,
        hd.relevance_score,
        a.id AS user_assignment_id,
        a.status AS user_assignment_status,
        a.pr_status AS user_pr_status,
        a.branch_name AS user_branch_name
    FROM project_homework_definitions hd
    JOIN project_features f ON hd.feature_id = f.id
    JOIN project_repositories r ON f.repo_id = r.id
    LEFT JOIN project_homework_assignments a
        ON a.homework_definition_id = hd.id
        AND a.user_id = p_user_id
    WHERE hd.chapter_id = p_chapter_id
      AND hd.status IN ('open', 'active')
      AND f.status IN ('approved', 'assigned')
      AND r.status = 'ready'
    ORDER BY hd.relevance_score DESC, hd.difficulty;
END;
$$ LANGUAGE plpgsql;

-- Get homework with full details for a specific assignment
CREATE OR REPLACE FUNCTION get_homework_details(
    p_assignment_id UUID,
    p_user_id UUID
)
RETURNS TABLE (
    assignment_id UUID,
    assignment_status project_assignment_status,
    pr_status pr_status,
    pr_url TEXT,
    pr_number INTEGER,
    branch_name VARCHAR(255),
    hints_revealed JSONB,
    hints_used INTEGER,
    score INTEGER,
    time_spent_minutes INTEGER,
    homework_id UUID,
    homework_name VARCHAR(255),
    homework_type homework_type,
    difficulty project_difficulty_tier,
    estimated_hours DECIMAL(5, 1),
    xp_reward INTEGER,
    instructions TEXT,
    acceptance_criteria JSONB,
    hints JSONB,
    file_scope JSONB,
    project_name VARCHAR(255),
    project_owner VARCHAR(100),
    source_repo_url TEXT,
    default_branch VARCHAR(100),
    feature_name VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.status,
        a.pr_status,
        a.pr_url,
        a.pr_number,
        a.branch_name,
        a.hints_revealed,
        a.hints_used,
        a.score,
        a.time_spent_minutes,
        hd.id,
        hd.name,
        hd.homework_type,
        hd.difficulty,
        hd.estimated_hours,
        hd.xp_reward,
        hd.instructions,
        hd.acceptance_criteria,
        hd.hints,
        hd.file_scope,
        r.name,
        r.owner,
        r.source_repo_url,
        r.default_branch,
        f.name
    FROM project_homework_assignments a
    JOIN project_homework_definitions hd ON a.homework_definition_id = hd.id
    JOIN project_features f ON hd.feature_id = f.id
    JOIN project_repositories r ON f.repo_id = r.id
    WHERE a.id = p_assignment_id
      AND a.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 10: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE project_homework_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_pr_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_pr_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_homework_winners ENABLE ROW LEVEL SECURITY;

-- Homework definitions: Public read for open/active homeworks
CREATE POLICY "Anyone can view open homeworks" ON project_homework_definitions
    FOR SELECT TO anon, authenticated
    USING (status IN ('open', 'active'));

CREATE POLICY "Service role full access to homework definitions" ON project_homework_definitions
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- PR Submissions: Users can view all (for leaderboards), modify own
CREATE POLICY "Authenticated users can view all submissions" ON project_pr_submissions
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Users can create own submissions" ON project_pr_submissions
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions" ON project_pr_submissions
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to submissions" ON project_pr_submissions
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Evaluations: Public read (for transparency)
CREATE POLICY "Authenticated users can view evaluations" ON project_pr_evaluations
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Service role full access to evaluations" ON project_pr_evaluations
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- Winners: Public read
CREATE POLICY "Anyone can view winners" ON project_homework_winners
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Service role full access to winners" ON project_homework_winners
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
