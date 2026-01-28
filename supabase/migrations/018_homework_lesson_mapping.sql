-- ============================================================================
-- Migration: Homework-Lesson Mapping
--
-- Adds many-to-many relationship between homework and lessons (map_nodes).
-- One homework can reinforce multiple lessons.
-- One lesson can have multiple homework options from different projects.
--
-- Also adds support for homework difficulty tiers within lessons and
-- better integration with the learning path system.
-- ============================================================================

-- ============================================================================
-- SECTION 1: HOMEWORK-LESSON JUNCTION TABLE
-- ============================================================================

CREATE TABLE homework_lesson_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    homework_definition_id UUID NOT NULL REFERENCES project_homework_definitions(id) ON DELETE CASCADE,
    lesson_node_id UUID NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,

    -- Mapping quality
    relevance_score DECIMAL(3, 2) DEFAULT 0.8 CHECK (relevance_score >= 0 AND relevance_score <= 1),
    is_primary BOOLEAN DEFAULT FALSE,  -- Primary lesson this homework teaches

    -- Context for this lesson
    lesson_context TEXT,  -- "This homework practices X concept from this lesson"
    skills_applied TEXT[],  -- Specific skills from lesson being applied

    -- Ordering (if multiple homeworks per lesson)
    sort_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(homework_definition_id, lesson_node_id)
);

-- Indexes
CREATE INDEX idx_hw_lesson_map_homework ON homework_lesson_mappings(homework_definition_id);
CREATE INDEX idx_hw_lesson_map_lesson ON homework_lesson_mappings(lesson_node_id);
CREATE INDEX idx_hw_lesson_map_primary ON homework_lesson_mappings(is_primary) WHERE is_primary = TRUE;

-- ============================================================================
-- SECTION 2: ADD LESSON SUPPORT TO HOMEWORK DEFINITIONS
-- ============================================================================

-- Add primary lesson reference (most relevant lesson)
ALTER TABLE project_homework_definitions
    ADD COLUMN primary_lesson_id UUID REFERENCES map_nodes(id) ON DELETE SET NULL;

-- Add learning path context (if homework is part of a curated path)
ALTER TABLE project_homework_definitions
    ADD COLUMN path_context JSONB DEFAULT NULL;
    -- {path_id: UUID, module_name: string, context_notes: string}

-- Create index for lesson lookup
CREATE INDEX idx_homework_defs_lesson ON project_homework_definitions(primary_lesson_id)
    WHERE primary_lesson_id IS NOT NULL;

-- ============================================================================
-- SECTION 3: VIEWS FOR LESSON-HOMEWORK INTEGRATION
-- ============================================================================

-- View: Homework available for a specific lesson
CREATE OR REPLACE VIEW lesson_homework_overview AS
SELECT
    hlm.lesson_node_id,
    mn.slug AS lesson_slug,
    mn.name AS lesson_name,
    hlm.relevance_score,
    hlm.is_primary,
    hlm.lesson_context,
    hlm.skills_applied,
    hd.id AS homework_id,
    hd.name AS homework_name,
    hd.slug AS homework_slug,
    hd.homework_type,
    hd.difficulty,
    hd.estimated_hours,
    hd.xp_reward,
    hd.description,
    hd.branch_prefix,
    hd.status AS homework_status,
    hd.total_submissions,
    hd.avg_score,
    f.id AS feature_id,
    f.name AS feature_name,
    r.id AS project_id,
    r.name AS project_name,
    r.owner AS project_owner,
    r.source_repo_url,
    r.primary_language,
    r.framework
FROM homework_lesson_mappings hlm
JOIN map_nodes mn ON hlm.lesson_node_id = mn.id
JOIN project_homework_definitions hd ON hlm.homework_definition_id = hd.id
JOIN project_features f ON hd.feature_id = f.id
JOIN project_repositories r ON f.repo_id = r.id
WHERE hd.status IN ('open', 'active')
  AND f.status IN ('approved', 'assigned')
  AND r.status = 'ready';

-- View: Lessons with homework count (for curriculum overview)
CREATE OR REPLACE VIEW lesson_homework_stats AS
SELECT
    mn.id AS lesson_id,
    mn.slug AS lesson_slug,
    mn.name AS lesson_name,
    mn.difficulty AS lesson_difficulty,
    COUNT(DISTINCT hlm.homework_definition_id) AS homework_count,
    COUNT(DISTINCT CASE WHEN hd.difficulty = 'beginner' THEN hd.id END) AS beginner_count,
    COUNT(DISTINCT CASE WHEN hd.difficulty = 'intermediate' THEN hd.id END) AS intermediate_count,
    COUNT(DISTINCT CASE WHEN hd.difficulty = 'advanced' THEN hd.id END) AS advanced_count,
    COUNT(DISTINCT r.id) AS project_count,
    ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL) AS project_names
FROM map_nodes mn
LEFT JOIN homework_lesson_mappings hlm ON mn.id = hlm.lesson_node_id
LEFT JOIN project_homework_definitions hd ON hlm.homework_definition_id = hd.id
    AND hd.status IN ('open', 'active')
LEFT JOIN project_features f ON hd.feature_id = f.id
    AND f.status IN ('approved', 'assigned')
LEFT JOIN project_repositories r ON f.repo_id = r.id
    AND r.status = 'ready'
WHERE mn.depth = 4 AND mn.node_type = 'lesson'
GROUP BY mn.id, mn.slug, mn.name, mn.difficulty;

-- ============================================================================
-- SECTION 4: FUNCTIONS FOR LESSON-HOMEWORK QUERIES
-- ============================================================================

-- Get homeworks for a lesson with optional user progress
CREATE OR REPLACE FUNCTION get_lesson_homeworks(
    p_lesson_id UUID,
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
    instructions TEXT,
    branch_prefix VARCHAR(255),
    acceptance_criteria JSONB,
    relevance_score DECIMAL(3, 2),
    lesson_context TEXT,
    project_id UUID,
    project_name VARCHAR(255),
    project_owner VARCHAR(100),
    source_repo_url TEXT,
    default_branch VARCHAR(100),
    feature_name VARCHAR(255),
    -- User progress (NULL if not started)
    user_assignment_id UUID,
    user_status project_assignment_status,
    user_pr_status pr_status,
    user_pr_url TEXT,
    user_score INTEGER
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
        hd.instructions,
        hd.branch_prefix,
        hd.acceptance_criteria,
        hlm.relevance_score,
        hlm.lesson_context,
        r.id,
        r.name,
        r.owner,
        r.source_repo_url,
        r.default_branch,
        f.name,
        a.id AS user_assignment_id,
        a.status AS user_status,
        a.pr_status AS user_pr_status,
        a.pr_url AS user_pr_url,
        a.score AS user_score
    FROM homework_lesson_mappings hlm
    JOIN project_homework_definitions hd ON hlm.homework_definition_id = hd.id
    JOIN project_features f ON hd.feature_id = f.id
    JOIN project_repositories r ON f.repo_id = r.id
    LEFT JOIN project_homework_assignments a
        ON a.homework_definition_id = hd.id
        AND a.user_id = p_user_id
    WHERE hlm.lesson_node_id = p_lesson_id
      AND hd.status IN ('open', 'active')
      AND f.status IN ('approved', 'assigned')
      AND r.status = 'ready'
    ORDER BY hlm.relevance_score DESC, hd.difficulty;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get all lessons that have homework (for filtering in UI)
CREATE OR REPLACE FUNCTION get_lessons_with_homework(
    p_topic_slug VARCHAR DEFAULT NULL,
    p_difficulty VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    lesson_id UUID,
    lesson_slug VARCHAR(200),
    lesson_name VARCHAR(255),
    area_name VARCHAR(255),
    skill_name VARCHAR(255),
    topic_name VARCHAR(255),
    homework_count BIGINT,
    project_names TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mn.id,
        mn.slug,
        mn.name,
        (SELECT name FROM map_nodes WHERE id = mn.parent_id) AS area_name,
        (SELECT name FROM map_nodes WHERE id = (SELECT parent_id FROM map_nodes WHERE id = mn.parent_id)) AS skill_name,
        (SELECT name FROM map_nodes WHERE id = (SELECT parent_id FROM map_nodes WHERE id = (SELECT parent_id FROM map_nodes WHERE id = mn.parent_id))) AS topic_name,
        COUNT(DISTINCT hlm.homework_definition_id),
        ARRAY_AGG(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL)
    FROM map_nodes mn
    JOIN homework_lesson_mappings hlm ON mn.id = hlm.lesson_node_id
    JOIN project_homework_definitions hd ON hlm.homework_definition_id = hd.id
        AND hd.status IN ('open', 'active')
    JOIN project_features f ON hd.feature_id = f.id
    JOIN project_repositories r ON f.repo_id = r.id
    WHERE mn.depth = 4
      AND (p_difficulty IS NULL OR mn.difficulty = p_difficulty)
    GROUP BY mn.id, mn.slug, mn.name, mn.parent_id
    HAVING COUNT(DISTINCT hlm.homework_definition_id) > 0
    ORDER BY topic_name, skill_name, area_name, mn.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- SECTION 5: TRIGGERS
-- ============================================================================

-- Sync primary_lesson_id when mappings change
CREATE OR REPLACE FUNCTION sync_homework_primary_lesson()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- If this is marked as primary, update the homework definition
        IF NEW.is_primary = TRUE THEN
            UPDATE project_homework_definitions
            SET primary_lesson_id = NEW.lesson_node_id
            WHERE id = NEW.homework_definition_id;

            -- Ensure only one primary per homework
            UPDATE homework_lesson_mappings
            SET is_primary = FALSE
            WHERE homework_definition_id = NEW.homework_definition_id
              AND id != NEW.id
              AND is_primary = TRUE;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_homework_primary_lesson
AFTER INSERT OR UPDATE ON homework_lesson_mappings
FOR EACH ROW EXECUTE FUNCTION sync_homework_primary_lesson();

-- ============================================================================
-- SECTION 6: RLS POLICIES
-- ============================================================================

ALTER TABLE homework_lesson_mappings ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view homework-lesson mappings" ON homework_lesson_mappings
    FOR SELECT TO anon, authenticated
    USING (TRUE);

-- Service role full access
CREATE POLICY "Service role manages homework-lesson mappings" ON homework_lesson_mappings
    FOR ALL TO service_role
    USING (TRUE)
    WITH CHECK (TRUE);

-- ============================================================================
-- SECTION 7: COMMENTS
-- ============================================================================

COMMENT ON TABLE homework_lesson_mappings IS
    'Junction table linking homework to lessons. Enables many-to-many: one homework can reinforce multiple lessons, one lesson can have multiple homework options.';

COMMENT ON COLUMN homework_lesson_mappings.relevance_score IS
    'How relevant this homework is to the lesson (0.0-1.0). Higher = better match.';

COMMENT ON COLUMN homework_lesson_mappings.is_primary IS
    'If TRUE, this lesson is the primary learning objective for this homework.';

COMMENT ON COLUMN homework_lesson_mappings.lesson_context IS
    'Explanation of how this homework applies concepts from this specific lesson.';

COMMENT ON VIEW lesson_homework_overview IS
    'Homework available for lessons with project details. Use for lesson pages.';

COMMENT ON VIEW lesson_homework_stats IS
    'Aggregated homework counts per lesson. Use for curriculum overview.';

-- ============================================================================
-- DONE
-- ============================================================================
