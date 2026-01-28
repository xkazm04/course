-- ============================================================================
-- Lesson Content Storage
-- Content for depth 4 nodes (lessons) in map_nodes
--
-- Design Philosophy:
-- - Markdown-first: Use custom markdown rules for rich content instead of
--   many table columns. This allows dynamic UI generation.
-- - Metadata JSONB: Structured data for videos, difficulty, etc.
-- - Link to map_nodes: Content is tied to lesson nodes (depth 4)
-- ============================================================================

-- ============================================================================
-- SECTION 1: LESSON CONTENT TABLE
-- ============================================================================

CREATE TABLE lesson_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Link to map_nodes (must be depth 4 lesson node)
    node_id UUID NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,

    -- Version for content updates (allows drafts vs published)
    version INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),

    -- Introduction/summary shown before main content
    introduction TEXT,

    -- Main markdown content with custom parsing rules
    -- Supports: :::video, :::code, :::callout, :::exercise, :::quiz, etc.
    content_markdown TEXT NOT NULL,

    -- Structured metadata (videos, key takeaways, etc.)
    metadata JSONB DEFAULT '{}'::jsonb,
    -- metadata schema:
    -- {
    --   "estimated_minutes": 15,
    --   "difficulty": "beginner|intermediate|advanced",
    --   "key_takeaways": ["point 1", "point 2"],
    --   "video_variants": [
    --     {
    --       "id": "fireship-hooks",
    --       "title": "React Hooks in 100 Seconds",
    --       "youtube_id": "TNhaISOUy6Q",
    --       "search_query": "react hooks tutorial",
    --       "instructor": "Fireship",
    --       "style": "animated|lecture|tutorial|walkthrough",
    --       "duration": "2:15"
    --     }
    --   ],
    --   "prerequisites": ["node-id-1", "node-id-2"],
    --   "related_lessons": ["node-id-3"],
    --   "tags": ["react", "hooks", "state-management"]
    -- }

    -- AI generation tracking
    is_ai_generated BOOLEAN DEFAULT FALSE,
    ai_model VARCHAR(50),
    ai_confidence DECIMAL(3, 2),
    generation_prompt TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ,

    -- Ensure one published version per node
    UNIQUE(node_id, version)
);

-- Index for fast node lookups
CREATE INDEX idx_lesson_content_node ON lesson_content(node_id);
CREATE INDEX idx_lesson_content_status ON lesson_content(status) WHERE status = 'published';

-- ============================================================================
-- SECTION 2: LESSON SECTIONS (Optional structured sections within a lesson)
-- For lessons that need multiple sections (like the ElegantVariant chapters)
-- ============================================================================

CREATE TABLE lesson_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    lesson_content_id UUID NOT NULL REFERENCES lesson_content(id) ON DELETE CASCADE,

    -- Section ordering
    sort_order INTEGER NOT NULL,

    -- Section metadata
    title VARCHAR(500) NOT NULL,
    section_type VARCHAR(50) DEFAULT 'lesson' CHECK (section_type IN ('video', 'lesson', 'interactive', 'exercise', 'quiz')),
    duration_minutes INTEGER,

    -- Section content (markdown)
    content_markdown TEXT NOT NULL,

    -- Optional code snippet
    code_snippet TEXT,
    code_language VARCHAR(20),

    -- Key points for this section
    key_points TEXT[],

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(lesson_content_id, sort_order)
);

CREATE INDEX idx_lesson_sections_content ON lesson_sections(lesson_content_id);

-- ============================================================================
-- SECTION 3: VIEWS
-- ============================================================================

-- View to get lesson content with node info
CREATE OR REPLACE VIEW lesson_content_with_node AS
SELECT
    lc.id AS content_id,
    lc.node_id,
    lc.version,
    lc.status,
    lc.introduction,
    lc.content_markdown,
    lc.metadata,
    lc.is_ai_generated,
    lc.published_at,
    mn.slug AS lesson_slug,
    mn.name AS lesson_name,
    mn.description AS lesson_description,
    mn.depth,
    mn.parent_id AS area_id,
    mn.domain_id,
    (SELECT name FROM map_nodes WHERE id = mn.parent_id) AS area_name,
    (SELECT name FROM map_nodes WHERE id = (SELECT parent_id FROM map_nodes WHERE id = mn.parent_id)) AS skill_name
FROM lesson_content lc
JOIN map_nodes mn ON lc.node_id = mn.id;

-- ============================================================================
-- SECTION 4: TRIGGERS
-- ============================================================================

-- Auto-update updated_at
CREATE TRIGGER trigger_lesson_content_updated
BEFORE UPDATE ON lesson_content
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_lesson_sections_updated
BEFORE UPDATE ON lesson_sections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 5: RLS POLICIES
-- ============================================================================

ALTER TABLE lesson_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_sections ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Anyone can view published lesson content" ON lesson_content
    FOR SELECT TO anon, authenticated USING (status = 'published');

CREATE POLICY "Anyone can view lesson sections" ON lesson_sections
    FOR SELECT TO anon, authenticated USING (
        lesson_content_id IN (SELECT id FROM lesson_content WHERE status = 'published')
    );

-- Authenticated users can create/edit (for user-generated content)
CREATE POLICY "Authenticated users can create lesson content" ON lesson_content
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update lesson content" ON lesson_content
    FOR UPDATE TO authenticated USING (true);

-- ============================================================================
-- SECTION 6: HELPER FUNCTION
-- Get full lesson data including sections
-- ============================================================================

CREATE OR REPLACE FUNCTION get_lesson_full_content(lesson_node_id UUID)
RETURNS TABLE (
    content_id UUID,
    node_id UUID,
    lesson_name VARCHAR,
    lesson_slug VARCHAR,
    introduction TEXT,
    content_markdown TEXT,
    metadata JSONB,
    sections JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        lc.id AS content_id,
        lc.node_id,
        mn.name AS lesson_name,
        mn.slug AS lesson_slug,
        lc.introduction,
        lc.content_markdown,
        lc.metadata,
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', ls.id,
                    'title', ls.title,
                    'section_type', ls.section_type,
                    'duration_minutes', ls.duration_minutes,
                    'content_markdown', ls.content_markdown,
                    'code_snippet', ls.code_snippet,
                    'code_language', ls.code_language,
                    'key_points', ls.key_points,
                    'sort_order', ls.sort_order
                ) ORDER BY ls.sort_order
            )
            FROM lesson_sections ls
            WHERE ls.lesson_content_id = lc.id),
            '[]'::jsonb
        ) AS sections
    FROM lesson_content lc
    JOIN map_nodes mn ON lc.node_id = mn.id
    WHERE lc.node_id = lesson_node_id
      AND lc.status = 'published'
    ORDER BY lc.version DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- DONE
-- ============================================================================
