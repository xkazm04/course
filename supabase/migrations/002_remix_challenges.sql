-- ============================================================================
-- Remix Challenges - Codebase Scanner Integration
-- Supabase (PostgreSQL) Migration
--
-- This schema supports:
-- 1. Scanned project storage from Claude Code
-- 2. Detected challenges with code snippets
-- 3. Admin review workflow
-- 4. User assignments and progress tracking
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENUMS
-- ============================================================================

CREATE TYPE challenge_type AS ENUM (
    'bug',
    'smell',
    'missing_feature',
    'security',
    'performance'
);

CREATE TYPE challenge_severity AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

CREATE TYPE challenge_difficulty AS ENUM (
    'beginner',
    'intermediate',
    'advanced'
);

CREATE TYPE challenge_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'archived'
);

CREATE TYPE assignment_status AS ENUM (
    'not_started',
    'in_progress',
    'submitted',
    'completed',
    'abandoned'
);

-- ============================================================================
-- SECTION 2: SCANNED PROJECTS
-- Stores metadata about codebases scanned by Claude Code
-- ============================================================================

CREATE TABLE remix_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Project identification
    name VARCHAR(255) NOT NULL,
    source_url TEXT,                          -- GitHub URL or local path

    -- Tech stack detection
    language VARCHAR(50) NOT NULL,            -- Primary language
    framework VARCHAR(100),                   -- Detected framework
    tech_stack JSONB DEFAULT '[]'::jsonb,     -- Array of detected technologies

    -- Repository metadata
    readme_content TEXT,                      -- README.md content if available
    package_json JSONB,                       -- package.json or equivalent
    file_count INTEGER DEFAULT 0,
    total_lines INTEGER DEFAULT 0,

    -- Scan metadata
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    scanned_by UUID REFERENCES auth.users(id),
    scanner_version VARCHAR(20) DEFAULT '1.0.0',

    -- Stats (updated via triggers)
    challenge_count INTEGER DEFAULT 0,
    approved_count INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient filtering
CREATE INDEX idx_remix_projects_language ON remix_projects(language);
CREATE INDEX idx_remix_projects_scanned_by ON remix_projects(scanned_by);
CREATE INDEX idx_remix_projects_scanned_at ON remix_projects(scanned_at DESC);

-- ============================================================================
-- SECTION 3: DETECTED CHALLENGES
-- Individual issues detected during codebase scanning
-- ============================================================================

CREATE TABLE remix_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES remix_projects(id) ON DELETE CASCADE,

    -- Classification
    type challenge_type NOT NULL,
    severity challenge_severity NOT NULL,
    difficulty challenge_difficulty NOT NULL,

    -- Issue details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,

    -- Code location
    location JSONB NOT NULL,                  -- {file, startLine, endLine}
    code_snippet TEXT,                        -- The problematic code
    context_before TEXT,                      -- 5-10 lines before
    context_after TEXT,                       -- 5-10 lines after

    -- Learning content
    user_instructions TEXT NOT NULL,          -- Step-by-step fix guide
    expected_output TEXT NOT NULL,            -- What success looks like
    hints JSONB DEFAULT '[]'::jsonb,          -- Progressive hints array

    -- Topic/skill mapping
    related_topic_ids UUID[] DEFAULT '{}',
    related_skill_ids UUID[] DEFAULT '{}',
    tags VARCHAR(50)[] DEFAULT '{}',

    -- Estimation
    estimated_minutes INTEGER DEFAULT 30,

    -- Admin review workflow
    status challenge_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_remix_challenges_project ON remix_challenges(project_id);
CREATE INDEX idx_remix_challenges_status ON remix_challenges(status);
CREATE INDEX idx_remix_challenges_type ON remix_challenges(type);
CREATE INDEX idx_remix_challenges_difficulty ON remix_challenges(difficulty);
CREATE INDEX idx_remix_challenges_created ON remix_challenges(created_at DESC);

-- Full-text search on title and description
CREATE INDEX idx_remix_challenges_search ON remix_challenges
    USING gin(to_tsvector('english', title || ' ' || description));

-- ============================================================================
-- SECTION 4: USER ASSIGNMENTS
-- Tracks user progress on claimed challenges
-- ============================================================================

CREATE TABLE remix_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES remix_challenges(id) ON DELETE CASCADE,

    -- Progress tracking
    status assignment_status DEFAULT 'not_started',
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Time tracking
    time_spent_minutes INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ,

    -- Hints usage
    hints_used INTEGER DEFAULT 0,
    hints_revealed JSONB DEFAULT '[]'::jsonb,  -- Array of revealed hint indices

    -- Submission data
    submission_diff JSONB,                     -- User's code changes
    submission_notes TEXT,                     -- User's explanation

    -- Scoring
    score INTEGER,                             -- 0-100
    score_breakdown JSONB,                     -- {objectives, quality, scope, penalties}

    -- Feedback
    ai_feedback JSONB,                         -- Claude's analysis
    peer_feedback JSONB,                       -- Optional peer review

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate assignments
    UNIQUE(user_id, challenge_id)
);

-- Indexes
CREATE INDEX idx_remix_assignments_user ON remix_assignments(user_id);
CREATE INDEX idx_remix_assignments_challenge ON remix_assignments(challenge_id);
CREATE INDEX idx_remix_assignments_status ON remix_assignments(status);

-- ============================================================================
-- SECTION 5: SCAN SESSIONS
-- Tracks individual scanning sessions for analytics
-- ============================================================================

CREATE TABLE remix_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES remix_projects(id) ON DELETE SET NULL,

    -- Scanner info
    scanned_by UUID REFERENCES auth.users(id),
    scanner_version VARCHAR(20),

    -- Results summary
    files_scanned INTEGER DEFAULT 0,
    challenges_found INTEGER DEFAULT 0,
    challenges_submitted INTEGER DEFAULT 0,

    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER,

    -- Raw output (for debugging)
    scan_output JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_remix_scans_project ON remix_scans(project_id);
CREATE INDEX idx_remix_scans_user ON remix_scans(scanned_by);

-- ============================================================================
-- SECTION 6: API KEYS
-- For MCP server authentication
-- ============================================================================

CREATE TABLE remix_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    key_hash VARCHAR(64) NOT NULL,            -- SHA-256 hash of the key
    key_prefix VARCHAR(8) NOT NULL,           -- First 8 chars for identification
    name VARCHAR(100),                        -- User-friendly name

    -- Permissions
    can_submit_challenges BOOLEAN DEFAULT TRUE,
    can_read_topics BOOLEAN DEFAULT TRUE,

    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,

    -- Lifecycle
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_remix_api_keys_user ON remix_api_keys(user_id);
CREATE INDEX idx_remix_api_keys_prefix ON remix_api_keys(key_prefix);

-- ============================================================================
-- SECTION 7: TRIGGERS & FUNCTIONS
-- ============================================================================

-- Update project challenge counts
CREATE OR REPLACE FUNCTION update_project_challenge_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE remix_projects
        SET
            challenge_count = (
                SELECT COUNT(*) FROM remix_challenges
                WHERE project_id = NEW.project_id
            ),
            approved_count = (
                SELECT COUNT(*) FROM remix_challenges
                WHERE project_id = NEW.project_id AND status = 'approved'
            ),
            updated_at = NOW()
        WHERE id = NEW.project_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE remix_projects
        SET
            challenge_count = (
                SELECT COUNT(*) FROM remix_challenges
                WHERE project_id = OLD.project_id
            ),
            approved_count = (
                SELECT COUNT(*) FROM remix_challenges
                WHERE project_id = OLD.project_id AND status = 'approved'
            ),
            updated_at = NOW()
        WHERE id = OLD.project_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_challenge_counts
AFTER INSERT OR UPDATE OR DELETE ON remix_challenges
FOR EACH ROW EXECUTE FUNCTION update_project_challenge_counts();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_remix_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_remix_projects_updated
BEFORE UPDATE ON remix_projects
FOR EACH ROW EXECUTE FUNCTION update_remix_updated_at();

CREATE TRIGGER trigger_remix_challenges_updated
BEFORE UPDATE ON remix_challenges
FOR EACH ROW EXECUTE FUNCTION update_remix_updated_at();

CREATE TRIGGER trigger_remix_assignments_updated
BEFORE UPDATE ON remix_assignments
FOR EACH ROW EXECUTE FUNCTION update_remix_updated_at();

-- ============================================================================
-- SECTION 8: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE remix_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE remix_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE remix_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE remix_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE remix_api_keys ENABLE ROW LEVEL SECURITY;

-- Projects: Anyone can read, authenticated users can create
CREATE POLICY "Anyone can view projects" ON remix_projects
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create projects" ON remix_projects
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own projects" ON remix_projects
    FOR UPDATE USING (scanned_by = auth.uid());

-- Challenges: Anyone can view approved, admins can manage all
CREATE POLICY "Anyone can view approved challenges" ON remix_challenges
    FOR SELECT USING (status = 'approved' OR auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create challenges" ON remix_challenges
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Assignments: Users can only see their own
CREATE POLICY "Users can view their own assignments" ON remix_assignments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own assignments" ON remix_assignments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own assignments" ON remix_assignments
    FOR UPDATE USING (user_id = auth.uid());

-- API Keys: Users can only see their own
CREATE POLICY "Users can view their own API keys" ON remix_api_keys
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own API keys" ON remix_api_keys
    FOR ALL USING (user_id = auth.uid());

-- Scans: Users can see their own scans
CREATE POLICY "Users can view their own scans" ON remix_scans
    FOR SELECT USING (scanned_by = auth.uid());

CREATE POLICY "Authenticated users can create scans" ON remix_scans
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
