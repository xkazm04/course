-- ============================================================================
-- Content Generation Jobs
-- Tracks async content generation requests for map nodes
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENUMS
-- ============================================================================

CREATE TYPE content_job_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed'
);

CREATE TYPE content_generation_type AS ENUM (
    'full_course',      -- Generate complete course with chapters
    'chapters_only',    -- Generate only chapter structure
    'description',      -- Generate detailed description
    'learning_outcomes' -- Generate what_you_will_learn array
);

-- ============================================================================
-- SECTION 2: CONTENT GENERATION JOBS TABLE
-- ============================================================================

CREATE TABLE content_generation_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Target node (must be depth 0 or 1)
    node_id UUID NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,

    -- Job configuration
    generation_type content_generation_type DEFAULT 'full_course',
    status content_job_status DEFAULT 'pending',

    -- Input context (stored for debugging/replay)
    prompt_context JSONB,           -- Node data + existing content used in prompt

    -- Output
    generated_content JSONB,        -- The generated course/chapters JSON
    generated_course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    error_message TEXT,             -- Error details if failed

    -- Progress tracking
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    progress_message TEXT,          -- Current step description

    -- LLM metadata
    model_used VARCHAR(50) DEFAULT 'gemini-2.0-flash-exp',
    tokens_used INTEGER,
    latency_ms INTEGER,
    grounding_sources JSONB,        -- Google Search sources used

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- ============================================================================
-- SECTION 3: INDEXES
-- ============================================================================

-- Fast lookup by node
CREATE INDEX idx_content_jobs_node ON content_generation_jobs(node_id);

-- Find pending/processing jobs
CREATE INDEX idx_content_jobs_status ON content_generation_jobs(status)
    WHERE status IN ('pending', 'processing');

-- Recent jobs first
CREATE INDEX idx_content_jobs_created ON content_generation_jobs(created_at DESC);

-- Find jobs for a specific node that are not failed
CREATE INDEX idx_content_jobs_node_active ON content_generation_jobs(node_id, status)
    WHERE status != 'failed';

-- ============================================================================
-- SECTION 4: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE content_generation_jobs ENABLE ROW LEVEL SECURITY;

-- Anyone can view completed jobs
CREATE POLICY "Anyone can view completed content jobs" ON content_generation_jobs
    FOR SELECT TO anon, authenticated
    USING (status = 'completed');

-- Authenticated users can create jobs
CREATE POLICY "Authenticated users can create content jobs" ON content_generation_jobs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Users can view their own pending/processing jobs (if we add user_id later)
CREATE POLICY "Service role full access to content jobs" ON content_generation_jobs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- SECTION 5: FUNCTIONS
-- ============================================================================

-- Function to validate node depth (must be 0 or 1)
CREATE OR REPLACE FUNCTION check_node_depth_for_generation()
RETURNS TRIGGER AS $$
DECLARE
    node_depth INTEGER;
BEGIN
    SELECT depth INTO node_depth FROM map_nodes WHERE id = NEW.node_id;

    IF node_depth IS NULL THEN
        RAISE EXCEPTION 'Node not found: %', NEW.node_id;
    END IF;

    IF node_depth > 1 THEN
        RAISE EXCEPTION 'Content generation is only available for depth 0-1 nodes (domains and topics). Node depth: %', node_depth;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_node_depth
BEFORE INSERT ON content_generation_jobs
FOR EACH ROW EXECUTE FUNCTION check_node_depth_for_generation();

-- Function to check if a node already has content being generated
CREATE OR REPLACE FUNCTION check_no_active_generation()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM content_generation_jobs
        WHERE node_id = NEW.node_id
        AND status IN ('pending', 'processing')
        AND id != NEW.id
    ) THEN
        RAISE EXCEPTION 'A content generation job is already active for this node';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_active_generation
BEFORE INSERT ON content_generation_jobs
FOR EACH ROW EXECUTE FUNCTION check_no_active_generation();

-- Function to update progress
CREATE OR REPLACE FUNCTION update_job_progress(
    job_id UUID,
    new_progress INTEGER,
    new_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE content_generation_jobs
    SET
        progress_percent = new_progress,
        progress_message = COALESCE(new_message, progress_message),
        status = CASE
            WHEN new_progress >= 100 THEN 'completed'::content_job_status
            WHEN new_progress > 0 THEN 'processing'::content_job_status
            ELSE status
        END
    WHERE id = job_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 6: HELPER VIEW
-- ============================================================================

CREATE VIEW content_job_details AS
SELECT
    cj.id,
    cj.node_id,
    mn.name AS node_name,
    mn.domain_id,
    mn.depth AS node_depth,
    cj.generation_type,
    cj.status,
    cj.progress_percent,
    cj.progress_message,
    cj.generated_course_id,
    c.title AS course_title,
    cj.tokens_used,
    cj.latency_ms,
    cj.created_at,
    cj.completed_at,
    EXTRACT(EPOCH FROM (cj.completed_at - cj.started_at)) AS duration_seconds
FROM content_generation_jobs cj
JOIN map_nodes mn ON cj.node_id = mn.id
LEFT JOIN courses c ON cj.generated_course_id = c.id;

-- ============================================================================
-- DONE
-- ============================================================================
