-- ============================================================================
-- Migration: Curated Learning Paths System
--
-- Enables creation of curated learning paths from individual lessons (map_nodes)
-- with path-specific practice exercises. Each lesson can belong to multiple paths.
--
-- Tables:
--   - curated_paths: Main path definitions
--   - path_lessons: Junction table (path <-> lesson mapping)
--   - path_lesson_exercises: Custom exercises per path+lesson combo
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENUMS
-- ============================================================================

-- Path type determines the overall structure/goal
CREATE TYPE curated_path_type AS ENUM (
    'full-curriculum',    -- Complete learning journey (e.g., "Zero to Hero")
    'quick-start',        -- Get productive fast (e.g., "React in 2 Weeks")
    'deep-dive',          -- Mastery focus on specific topic
    'project-focused',    -- Build something specific
    'career-prep',        -- Role/interview preparation
    'specialty'           -- Niche focus (testing, animations, etc.)
);

-- Scope defines the target audience/level range
CREATE TYPE curated_path_scope AS ENUM (
    'beginner-to-pro',       -- Full journey from scratch
    'beginner-friendly',     -- Starts from basics
    'intermediate-boost',    -- For those with fundamentals
    'advanced-mastery',      -- Deep expertise
    'career-transition',     -- Switching roles/stacks
    'interview-prep',        -- Job interview focus
    'performance-package',   -- Optimization focus
    'quick-wins'             -- Fast productivity gains
);

-- Exercise types for practice content
CREATE TYPE path_exercise_type AS ENUM (
    'code-challenge',     -- Write code to solve problem
    'mini-project',       -- Small buildable project
    'refactor',           -- Improve existing code
    'debug',              -- Find and fix bugs
    'quiz',               -- Knowledge check questions
    'code-review',        -- Review and critique code
    'fill-blanks'         -- Complete partial code
);

-- ============================================================================
-- SECTION 2: CURATED PATHS TABLE
-- Main learning path definitions
-- ============================================================================

CREATE TABLE curated_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identification
    slug VARCHAR(200) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    description TEXT,

    -- Classification
    path_type curated_path_type NOT NULL,
    scope curated_path_scope NOT NULL,
    domain path_domain DEFAULT 'frontend',  -- Uses existing enum from migration 009
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'mixed')),

    -- Target audience
    target_audience TEXT[],          -- ["Career changers", "Self-taught developers"]
    prerequisites TEXT[],            -- ["Basic HTML knowledge", "Some JS experience"]
    learning_outcomes TEXT[],        -- ["Build production React apps", "Write type-safe code"]

    -- Metrics (computed/updated)
    lesson_count INTEGER DEFAULT 0,
    required_lesson_count INTEGER DEFAULT 0,
    estimated_hours DECIMAL(5, 1) DEFAULT 0,
    estimated_weeks INTEGER,

    -- Visual/Display
    icon VARCHAR(50),                -- Lucide icon name
    color VARCHAR(7),                -- Hex color
    thumbnail_url TEXT,

    -- Popularity (updated by triggers/cron)
    enrollment_count INTEGER DEFAULT 0,
    completion_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(2, 1) CHECK (avg_rating >= 0 AND avg_rating <= 5),
    rating_count INTEGER DEFAULT 0,

    -- Publishing
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,

    -- Authorship
    created_by_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    is_official BOOLEAN DEFAULT FALSE,  -- Platform-curated vs community

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 3: PATH LESSONS JUNCTION TABLE
-- Links paths to lessons with ordering and context
-- ============================================================================

CREATE TABLE path_lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationships
    path_id UUID NOT NULL REFERENCES curated_paths(id) ON DELETE CASCADE,
    lesson_node_id UUID NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,

    -- Ordering within path
    sort_order INTEGER NOT NULL,

    -- Lesson role in path
    is_required BOOLEAN DEFAULT TRUE,    -- Required vs optional/bonus
    is_checkpoint BOOLEAN DEFAULT FALSE, -- Key milestone lesson

    -- Path-specific context for this lesson
    context_notes TEXT,                  -- "In this path, focus on X aspect..."

    -- Milestone info (for checkpoint lessons)
    milestone_title VARCHAR(255),        -- "You can now build X"
    milestone_description TEXT,

    -- Module/section grouping within path
    module_name VARCHAR(255),            -- "Week 1: Foundations"
    module_sort_order INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(path_id, lesson_node_id),     -- Lesson appears once per path
    UNIQUE(path_id, sort_order)          -- Unique ordering
);

-- ============================================================================
-- SECTION 4: PATH LESSON EXERCISES TABLE
-- Custom practice exercises per path+lesson combination
-- ============================================================================

CREATE TABLE path_lesson_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relationship
    path_lesson_id UUID NOT NULL REFERENCES path_lessons(id) ON DELETE CASCADE,

    -- Exercise metadata
    sort_order INTEGER NOT NULL DEFAULT 0,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    exercise_type path_exercise_type NOT NULL,

    -- Difficulty and timing
    difficulty VARCHAR(20) DEFAULT 'intermediate'
        CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    estimated_minutes INTEGER DEFAULT 15,

    -- Content (markdown supported)
    instructions_markdown TEXT NOT NULL,  -- What to do

    -- Code content
    starter_code TEXT,                    -- Initial code template
    starter_code_language VARCHAR(30),    -- javascript, typescript, html, css
    solution_code TEXT,                   -- Reference solution
    solution_explanation TEXT,            -- Why this solution works

    -- Hints system
    hints JSONB DEFAULT '[]'::jsonb,      -- [{"order": 1, "text": "Try using..."}]

    -- Testing/validation
    test_cases JSONB DEFAULT '[]'::jsonb, -- For auto-grading if applicable

    -- XP reward
    xp_reward INTEGER DEFAULT 10,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(path_lesson_id, sort_order)
);

-- ============================================================================
-- SECTION 5: USER PATH PROGRESS
-- Track user enrollment and progress on curated paths
-- ============================================================================

CREATE TABLE curated_path_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    path_id UUID NOT NULL REFERENCES curated_paths(id) ON DELETE CASCADE,

    -- Progress
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    lessons_completed INTEGER DEFAULT 0,
    exercises_completed INTEGER DEFAULT 0,

    -- Status
    status VARCHAR(20) DEFAULT 'enrolled'
        CHECK (status IN ('enrolled', 'in_progress', 'completed', 'paused', 'dropped')),

    -- Current position
    current_lesson_id UUID REFERENCES path_lessons(id) ON DELETE SET NULL,

    -- Time tracking
    total_time_minutes INTEGER DEFAULT 0,

    -- Timestamps
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),

    -- Rating (after completion)
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,

    UNIQUE(user_id, path_id)
);

-- ============================================================================
-- SECTION 6: INDEXES
-- ============================================================================

-- Curated paths
CREATE INDEX idx_curated_paths_slug ON curated_paths(slug);
CREATE INDEX idx_curated_paths_type ON curated_paths(path_type);
CREATE INDEX idx_curated_paths_scope ON curated_paths(scope);
CREATE INDEX idx_curated_paths_domain ON curated_paths(domain);
CREATE INDEX idx_curated_paths_status ON curated_paths(status) WHERE status = 'published';
CREATE INDEX idx_curated_paths_featured ON curated_paths(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_curated_paths_official ON curated_paths(is_official) WHERE is_official = TRUE;

-- Path lessons
CREATE INDEX idx_path_lessons_path ON path_lessons(path_id);
CREATE INDEX idx_path_lessons_lesson ON path_lessons(lesson_node_id);
CREATE INDEX idx_path_lessons_module ON path_lessons(path_id, module_sort_order, sort_order);
CREATE INDEX idx_path_lessons_checkpoint ON path_lessons(path_id) WHERE is_checkpoint = TRUE;

-- Path lesson exercises
CREATE INDEX idx_path_exercises_lesson ON path_lesson_exercises(path_lesson_id);
CREATE INDEX idx_path_exercises_type ON path_lesson_exercises(exercise_type);

-- User enrollments
CREATE INDEX idx_curated_enrollments_user ON curated_path_enrollments(user_id);
CREATE INDEX idx_curated_enrollments_path ON curated_path_enrollments(path_id);
CREATE INDEX idx_curated_enrollments_status ON curated_path_enrollments(status);

-- ============================================================================
-- SECTION 7: VIEWS
-- ============================================================================

-- View: Lesson usage across paths (for analytics)
CREATE VIEW lesson_path_usage AS
SELECT
    mn.id AS lesson_id,
    mn.slug AS lesson_slug,
    mn.name AS lesson_name,
    COUNT(pl.id) AS path_count,
    COUNT(ple.id) AS total_exercises,
    ARRAY_AGG(DISTINCT cp.slug) AS path_slugs,
    ARRAY_AGG(DISTINCT cp.path_type) AS path_types
FROM map_nodes mn
LEFT JOIN path_lessons pl ON mn.id = pl.lesson_node_id
LEFT JOIN curated_paths cp ON pl.path_id = cp.id AND cp.status = 'published'
LEFT JOIN path_lesson_exercises ple ON pl.id = ple.path_lesson_id
WHERE mn.depth = 4 AND mn.node_type = 'lesson'
GROUP BY mn.id, mn.slug, mn.name;

-- View: Path overview with computed stats
CREATE VIEW curated_path_overview AS
SELECT
    cp.id,
    cp.slug,
    cp.title,
    cp.subtitle,
    cp.description,
    cp.path_type,
    cp.scope,
    cp.domain,
    cp.difficulty,
    cp.icon,
    cp.color,
    cp.status,
    cp.is_featured,
    cp.is_official,
    cp.enrollment_count,
    cp.avg_rating,
    cp.estimated_hours,
    cp.estimated_weeks,
    (SELECT COUNT(*) FROM path_lessons pl WHERE pl.path_id = cp.id) AS lesson_count,
    (SELECT COUNT(*) FROM path_lessons pl WHERE pl.path_id = cp.id AND pl.is_required = TRUE) AS required_count,
    (SELECT COUNT(*) FROM path_lessons pl
     JOIN path_lesson_exercises ple ON pl.id = ple.path_lesson_id
     WHERE pl.path_id = cp.id) AS exercise_count,
    (SELECT ARRAY_AGG(DISTINCT module_name ORDER BY module_name)
     FROM path_lessons pl WHERE pl.path_id = cp.id AND module_name IS NOT NULL) AS modules
FROM curated_paths cp;

-- View: Path with lessons expanded
CREATE VIEW curated_path_full AS
SELECT
    cp.id AS path_id,
    cp.slug AS path_slug,
    cp.title AS path_title,
    pl.id AS path_lesson_id,
    pl.sort_order,
    pl.module_name,
    pl.module_sort_order,
    pl.is_required,
    pl.is_checkpoint,
    pl.milestone_title,
    pl.context_notes,
    mn.id AS lesson_id,
    mn.slug AS lesson_slug,
    mn.name AS lesson_name,
    mn.difficulty AS lesson_difficulty,
    mn.estimated_hours AS lesson_hours,
    (SELECT name FROM map_nodes WHERE id = mn.parent_id) AS area_name,
    (SELECT COUNT(*) FROM path_lesson_exercises ple WHERE ple.path_lesson_id = pl.id) AS exercise_count
FROM curated_paths cp
JOIN path_lessons pl ON cp.id = pl.path_id
JOIN map_nodes mn ON pl.lesson_node_id = mn.id
ORDER BY cp.id, pl.module_sort_order, pl.sort_order;

-- ============================================================================
-- SECTION 8: FUNCTIONS
-- ============================================================================

-- Function: Update path stats when lessons change
CREATE OR REPLACE FUNCTION update_path_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update lesson counts and estimated hours
    UPDATE curated_paths cp SET
        lesson_count = (
            SELECT COUNT(*) FROM path_lessons pl WHERE pl.path_id = cp.id
        ),
        required_lesson_count = (
            SELECT COUNT(*) FROM path_lessons pl
            WHERE pl.path_id = cp.id AND pl.is_required = TRUE
        ),
        estimated_hours = (
            SELECT COALESCE(SUM(mn.estimated_hours), 0)
            FROM path_lessons pl
            JOIN map_nodes mn ON pl.lesson_node_id = mn.id
            WHERE pl.path_id = cp.id
        ),
        updated_at = NOW()
    WHERE cp.id = COALESCE(NEW.path_id, OLD.path_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function: Get path progress for a user
CREATE OR REPLACE FUNCTION get_user_path_progress(p_user_id UUID, p_path_id UUID)
RETURNS TABLE (
    total_lessons INTEGER,
    completed_lessons INTEGER,
    total_exercises INTEGER,
    completed_exercises INTEGER,
    progress_percent INTEGER,
    current_lesson_slug VARCHAR,
    next_lesson_slug VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH lesson_progress AS (
        SELECT
            pl.id AS path_lesson_id,
            pl.sort_order,
            mn.slug AS lesson_slug,
            COALESCE(ump.status, 'locked') AS status
        FROM path_lessons pl
        JOIN map_nodes mn ON pl.lesson_node_id = mn.id
        LEFT JOIN user_map_progress ump ON mn.id = ump.node_id AND ump.user_id = p_user_id
        WHERE pl.path_id = p_path_id
        ORDER BY pl.sort_order
    )
    SELECT
        (SELECT COUNT(*)::INTEGER FROM path_lessons WHERE path_id = p_path_id),
        (SELECT COUNT(*)::INTEGER FROM lesson_progress WHERE status = 'completed'),
        (SELECT COUNT(*)::INTEGER FROM path_lesson_exercises ple
         JOIN path_lessons pl ON ple.path_lesson_id = pl.id
         WHERE pl.path_id = p_path_id),
        0::INTEGER, -- TODO: Track exercise completion
        CASE
            WHEN (SELECT COUNT(*) FROM path_lessons WHERE path_id = p_path_id) = 0 THEN 0
            ELSE ((SELECT COUNT(*) FROM lesson_progress WHERE status = 'completed')::NUMERIC /
                  (SELECT COUNT(*) FROM path_lessons WHERE path_id = p_path_id) * 100)::INTEGER
        END,
        (SELECT lesson_slug FROM lesson_progress WHERE status = 'in_progress' LIMIT 1),
        (SELECT lesson_slug FROM lesson_progress WHERE status != 'completed' ORDER BY sort_order LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- SECTION 9: TRIGGERS
-- ============================================================================

-- Update path stats when lessons are added/removed
CREATE TRIGGER trigger_path_lessons_stats
AFTER INSERT OR UPDATE OR DELETE ON path_lessons
FOR EACH ROW EXECUTE FUNCTION update_path_stats();

-- Auto-update updated_at
CREATE TRIGGER trigger_curated_paths_updated
BEFORE UPDATE ON curated_paths
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_path_lessons_updated
BEFORE UPDATE ON path_lessons
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_path_exercises_updated
BEFORE UPDATE ON path_lesson_exercises
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_curated_enrollments_updated
BEFORE UPDATE ON curated_path_enrollments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 10: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE curated_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE path_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE path_lesson_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE curated_path_enrollments ENABLE ROW LEVEL SECURITY;

-- Public read access for published paths
CREATE POLICY "Anyone can view published paths" ON curated_paths
    FOR SELECT TO anon, authenticated
    USING (status = 'published');

CREATE POLICY "Anyone can view lessons of published paths" ON path_lessons
    FOR SELECT TO anon, authenticated
    USING (path_id IN (SELECT id FROM curated_paths WHERE status = 'published'));

CREATE POLICY "Anyone can view exercises of published paths" ON path_lesson_exercises
    FOR SELECT TO anon, authenticated
    USING (path_lesson_id IN (
        SELECT pl.id FROM path_lessons pl
        JOIN curated_paths cp ON pl.path_id = cp.id
        WHERE cp.status = 'published'
    ));

-- Users can manage their own enrollments
CREATE POLICY "Users can view own path enrollments" ON curated_path_enrollments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own path enrollments" ON curated_path_enrollments
    FOR ALL USING (auth.uid() = user_id);

-- Content creation policies (for admins/creators)
CREATE POLICY "Authenticated can create paths" ON curated_paths
    FOR INSERT TO authenticated
    WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Creators can update own paths" ON curated_paths
    FOR UPDATE TO authenticated
    USING (created_by_user_id = auth.uid());

CREATE POLICY "Creators can manage path lessons" ON path_lessons
    FOR ALL TO authenticated
    USING (path_id IN (SELECT id FROM curated_paths WHERE created_by_user_id = auth.uid()));

CREATE POLICY "Creators can manage path exercises" ON path_lesson_exercises
    FOR ALL TO authenticated
    USING (path_lesson_id IN (
        SELECT pl.id FROM path_lessons pl
        JOIN curated_paths cp ON pl.path_id = cp.id
        WHERE cp.created_by_user_id = auth.uid()
    ));

-- ============================================================================
-- SECTION 11: COMMENTS
-- ============================================================================

COMMENT ON TABLE curated_paths IS 'Human-curated learning paths combining lessons from map_nodes';
COMMENT ON TABLE path_lessons IS 'Junction table linking paths to lessons with ordering and context';
COMMENT ON TABLE path_lesson_exercises IS 'Custom practice exercises specific to each path+lesson combination';
COMMENT ON TABLE curated_path_enrollments IS 'User enrollment and progress tracking for curated paths';

COMMENT ON COLUMN path_lessons.context_notes IS 'Path-specific context for this lesson (e.g., "Focus on X aspect in this path")';
COMMENT ON COLUMN path_lessons.is_checkpoint IS 'Marks key milestone lessons within the path';
COMMENT ON COLUMN path_lessons.module_name IS 'Groups lessons into modules/weeks within the path';

COMMENT ON VIEW lesson_path_usage IS 'Analytics view showing how lessons are used across paths';
COMMENT ON VIEW curated_path_overview IS 'Path summary with computed statistics';
COMMENT ON VIEW curated_path_full IS 'Expanded view of paths with all lesson details';

-- ============================================================================
-- DONE
-- ============================================================================
