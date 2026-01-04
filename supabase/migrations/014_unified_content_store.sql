-- ============================================================================
-- Unified Content Store Migration
-- Consolidates content storage: sections table becomes single source of truth
-- Adds Realtime support for event-driven architecture
-- ============================================================================

-- ============================================================================
-- SECTION 1: ADD NEW COLUMNS TO CHAPTERS
-- ============================================================================

-- Add content_metadata (replaces generated_content for non-section data)
-- This stores: key_takeaways, video_variants, estimated_time_minutes, difficulty, introduction
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chapters' AND column_name = 'content_metadata'
    ) THEN
        ALTER TABLE chapters ADD COLUMN content_metadata JSONB;
        COMMENT ON COLUMN chapters.content_metadata IS 'Non-section metadata: key_takeaways, video_variants, difficulty, introduction';
    END IF;
END $$;

-- Add generated_at timestamp
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chapters' AND column_name = 'generated_at'
    ) THEN
        ALTER TABLE chapters ADD COLUMN generated_at TIMESTAMPTZ;
        COMMENT ON COLUMN chapters.generated_at IS 'Timestamp when content was last generated';
    END IF;
END $$;

-- ============================================================================
-- SECTION 2: RENAME SECTIONS.DESCRIPTION TO CONTENT_MARKDOWN
-- ============================================================================

-- Rename for clarity: this field contains the full markdown content
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sections' AND column_name = 'description'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sections' AND column_name = 'content_markdown'
    ) THEN
        ALTER TABLE sections RENAME COLUMN description TO content_markdown;
        COMMENT ON COLUMN sections.content_markdown IS 'Full markdown content for this section (authoritative source)';
    END IF;
END $$;

-- ============================================================================
-- SECTION 3: DEPRECATE GENERATED_CONTENT IN CHAPTER_CONTENT_JOBS
-- ============================================================================

-- Mark generated_content as deprecated (content now in sections table only)
COMMENT ON COLUMN chapter_content_jobs.generated_content IS
    'DEPRECATED: Content now stored in sections table. This column retained for migration/rollback only.';

-- Mark chapters.generated_content as deprecated
COMMENT ON COLUMN chapters.generated_content IS
    'DEPRECATED: Section content now in sections.content_markdown. Metadata in content_metadata.';

-- ============================================================================
-- SECTION 4: ENABLE REALTIME FOR EVENT-DRIVEN ARCHITECTURE
-- ============================================================================

-- Enable Realtime publication for chapters table
-- This allows clients to subscribe to chapter status changes
DO $$
BEGIN
    -- Check if chapters is already in the publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'chapters'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chapters;
    END IF;
END $$;

-- Enable Realtime for chapter_content_jobs (for progress tracking)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'chapter_content_jobs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chapter_content_jobs;
    END IF;
END $$;

-- ============================================================================
-- SECTION 5: ADD INDEX FOR CONTENT_STATUS QUERIES
-- ============================================================================

-- Index for efficient content_status filtering
CREATE INDEX IF NOT EXISTS idx_chapters_content_status
    ON chapters(content_status)
    WHERE content_status IN ('generating', 'ready', 'failed');

-- Index for chapters with recent generation
CREATE INDEX IF NOT EXISTS idx_chapters_generated_at
    ON chapters(generated_at DESC NULLS LAST)
    WHERE generated_at IS NOT NULL;

-- ============================================================================
-- SECTION 6: FUNCTION TO GET CHAPTER CONTENT STATUS
-- ============================================================================

-- Helper function to get chapter status with section count
CREATE OR REPLACE FUNCTION get_chapter_content_status(chapter_uuid UUID)
RETURNS TABLE (
    chapter_id UUID,
    content_status VARCHAR,
    section_count BIGINT,
    generated_at TIMESTAMPTZ,
    has_content BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id as chapter_id,
        c.content_status,
        COUNT(s.id) as section_count,
        c.generated_at,
        (COUNT(s.id) > 0) as has_content
    FROM chapters c
    LEFT JOIN sections s ON s.chapter_id = c.id
    WHERE c.id = chapter_uuid
    GROUP BY c.id, c.content_status, c.generated_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 7: MIGRATION HELPER - MIGRATE EXISTING DATA
-- ============================================================================

-- Migrate existing generated_content to content_metadata (one-time operation)
-- This extracts non-section data from generated_content to content_metadata
UPDATE chapters
SET content_metadata = jsonb_build_object(
    'key_takeaways', COALESCE(generated_content->'key_takeaways', '[]'::jsonb),
    'video_variants', COALESCE(generated_content->'video_variants', '[]'::jsonb),
    'estimated_time_minutes', COALESCE(generated_content->'estimated_time_minutes', '30'::jsonb),
    'difficulty', COALESCE(generated_content->'difficulty', '"intermediate"'::jsonb),
    'introduction', COALESCE(generated_content->'introduction', '""'::jsonb)
),
generated_at = COALESCE(updated_at, NOW())
WHERE generated_content IS NOT NULL
  AND content_metadata IS NULL;
