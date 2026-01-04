-- ============================================================================
-- Chapter Content Generation Jobs
-- Tracks async content generation for individual chapters
-- ============================================================================

-- ============================================================================
-- SECTION 1: CHAPTER CONTENT GENERATION JOBS TABLE
-- ============================================================================

CREATE TABLE chapter_content_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Target chapter
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,

    -- Associated with learning path acceptance batch
    batch_id UUID,

    -- Job tracking
    status content_job_status DEFAULT 'pending',

    -- Input context
    chapter_context JSONB,          -- Chapter title, description, course context
    user_context JSONB,             -- User learning preferences from Oracle

    -- Output
    generated_content JSONB,        -- The generated chapter content
    error_message TEXT,

    -- Progress tracking
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    progress_message TEXT,

    -- Requesting user
    requested_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- LLM metadata
    model_used VARCHAR(50),
    tokens_used INTEGER,
    latency_ms INTEGER,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- ============================================================================
-- SECTION 2: INDEXES
-- ============================================================================

CREATE INDEX idx_chapter_jobs_chapter ON chapter_content_jobs(chapter_id);
CREATE INDEX idx_chapter_jobs_batch ON chapter_content_jobs(batch_id);
CREATE INDEX idx_chapter_jobs_status ON chapter_content_jobs(status)
    WHERE status IN ('pending', 'processing');
CREATE INDEX idx_chapter_jobs_user ON chapter_content_jobs(requested_by_user_id);

-- ============================================================================
-- SECTION 3: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE chapter_content_jobs ENABLE ROW LEVEL SECURITY;

-- Users can view their own jobs
CREATE POLICY "Users can view own chapter jobs" ON chapter_content_jobs
    FOR SELECT TO authenticated
    USING (requested_by_user_id = auth.uid());

-- Users can create jobs
CREATE POLICY "Users can create chapter jobs" ON chapter_content_jobs
    FOR INSERT TO authenticated
    WITH CHECK (requested_by_user_id = auth.uid());

-- Service role full access
CREATE POLICY "Service role full access to chapter jobs" ON chapter_content_jobs
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- SECTION 4: ADD CONTENT FIELD TO CHAPTERS
-- ============================================================================

-- Add generated_content field to chapters if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chapters' AND column_name = 'generated_content'
    ) THEN
        ALTER TABLE chapters ADD COLUMN generated_content JSONB;
    END IF;
END $$;

-- Add content_status field to track generation state
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chapters' AND column_name = 'content_status'
    ) THEN
        ALTER TABLE chapters ADD COLUMN content_status VARCHAR(20) DEFAULT 'pending';
    END IF;
END $$;

-- ============================================================================
-- SECTION 5: HELPER FUNCTION TO GET PENDING JOBS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pending_chapter_jobs(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    job_id UUID,
    chapter_id UUID,
    chapter_title TEXT,
    course_title TEXT,
    batch_id UUID,
    chapter_context JSONB,
    user_context JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ccj.id as job_id,
        ccj.chapter_id,
        ch.title as chapter_title,
        c.title as course_title,
        ccj.batch_id,
        ccj.chapter_context,
        ccj.user_context
    FROM chapter_content_jobs ccj
    JOIN chapters ch ON ccj.chapter_id = ch.id
    JOIN courses c ON ch.course_id = c.id
    WHERE ccj.status = 'pending'
    ORDER BY ccj.created_at ASC
    LIMIT limit_count
    FOR UPDATE OF ccj SKIP LOCKED;
END;
$$ LANGUAGE plpgsql;
