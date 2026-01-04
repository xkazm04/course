-- ============================================================================
-- AI Content Creation RLS Policies
-- Allows authenticated users to create AI-generated content
-- ============================================================================

-- ============================================================================
-- SECTION 1: MAP_NODES POLICIES
-- ============================================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert AI-generated map_nodes" ON map_nodes;
DROP POLICY IF EXISTS "Users can view all map_nodes" ON map_nodes;
DROP POLICY IF EXISTS "Users can update own AI-generated map_nodes" ON map_nodes;

-- Allow authenticated users to INSERT map_nodes with is_ai_generated = true
CREATE POLICY "Users can insert AI-generated map_nodes" ON map_nodes
    FOR INSERT TO authenticated
    WITH CHECK (is_ai_generated = true);

-- Allow all authenticated users to view map_nodes (they're public content)
CREATE POLICY "Users can view all map_nodes" ON map_nodes
    FOR SELECT TO authenticated
    USING (true);

-- Allow users to update their own AI-generated nodes (if we track creator)
-- For now, allow updates to AI-generated nodes
CREATE POLICY "Users can update AI-generated map_nodes" ON map_nodes
    FOR UPDATE TO authenticated
    USING (is_ai_generated = true)
    WITH CHECK (is_ai_generated = true);

-- ============================================================================
-- SECTION 2: LEARNING_PATH_ENROLLMENTS POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own enrollments" ON learning_path_enrollments;
DROP POLICY IF EXISTS "Users can create own enrollments" ON learning_path_enrollments;
DROP POLICY IF EXISTS "Users can update own enrollments" ON learning_path_enrollments;
DROP POLICY IF EXISTS "Users can delete own enrollments" ON learning_path_enrollments;

-- Allow users to view their own enrollments
CREATE POLICY "Users can view own enrollments" ON learning_path_enrollments
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Allow users to create their own enrollments
CREATE POLICY "Users can create own enrollments" ON learning_path_enrollments
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Allow users to update their own enrollments
CREATE POLICY "Users can update own enrollments" ON learning_path_enrollments
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own enrollments
CREATE POLICY "Users can delete own enrollments" ON learning_path_enrollments
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- ============================================================================
-- SECTION 3: LEARNING_PATHS POLICIES (ensure users can create)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view published paths" ON learning_paths;
DROP POLICY IF EXISTS "Users can view own paths" ON learning_paths;
DROP POLICY IF EXISTS "Users can create paths" ON learning_paths;
DROP POLICY IF EXISTS "Users can update own paths" ON learning_paths;

-- Allow all users to view published learning paths
CREATE POLICY "Users can view published paths" ON learning_paths
    FOR SELECT TO authenticated
    USING (status = 'published');

-- Allow users to view their own paths regardless of status
CREATE POLICY "Users can view own paths" ON learning_paths
    FOR SELECT TO authenticated
    USING (created_by_user_id = auth.uid());

-- Allow users to create learning paths
CREATE POLICY "Users can create paths" ON learning_paths
    FOR INSERT TO authenticated
    WITH CHECK (created_by_user_id = auth.uid());

-- Allow users to update their own paths
CREATE POLICY "Users can update own paths" ON learning_paths
    FOR UPDATE TO authenticated
    USING (created_by_user_id = auth.uid())
    WITH CHECK (created_by_user_id = auth.uid());

-- ============================================================================
-- SECTION 4: LEARNING_PATH_COURSES POLICIES
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view path courses" ON learning_path_courses;
DROP POLICY IF EXISTS "Users can manage own path courses" ON learning_path_courses;

-- Allow viewing path courses for paths user can access
CREATE POLICY "Users can view path courses" ON learning_path_courses
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM learning_paths lp
            WHERE lp.id = learning_path_id
            AND (lp.status = 'published' OR lp.created_by_user_id = auth.uid())
        )
    );

-- Allow users to insert/update/delete courses in their own paths
CREATE POLICY "Users can manage own path courses" ON learning_path_courses
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM learning_paths lp
            WHERE lp.id = learning_path_id
            AND lp.created_by_user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM learning_paths lp
            WHERE lp.id = learning_path_id
            AND lp.created_by_user_id = auth.uid()
        )
    );

-- ============================================================================
-- SECTION 5: COURSES POLICIES (for AI-generated courses)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert AI-generated courses" ON courses;
DROP POLICY IF EXISTS "Users can view courses" ON courses;
DROP POLICY IF EXISTS "Users can update own courses" ON courses;

-- Allow authenticated users to INSERT courses with is_ai_generated = true
CREATE POLICY "Users can insert AI-generated courses" ON courses
    FOR INSERT TO authenticated
    WITH CHECK (is_ai_generated = true AND created_by_user_id = auth.uid());

-- Allow all authenticated users to view courses
CREATE POLICY "Users can view courses" ON courses
    FOR SELECT TO authenticated
    USING (true);

-- Allow users to update their own courses
CREATE POLICY "Users can update own courses" ON courses
    FOR UPDATE TO authenticated
    USING (created_by_user_id = auth.uid())
    WITH CHECK (created_by_user_id = auth.uid());

-- ============================================================================
-- SECTION 6: CHAPTERS POLICIES (ensure AI-generated works)
-- ============================================================================

-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Users can insert AI-generated chapters" ON chapters;
DROP POLICY IF EXISTS "Users can view chapters" ON chapters;

-- Allow authenticated users to INSERT chapters with is_ai_generated = true
CREATE POLICY "Users can insert AI-generated chapters" ON chapters
    FOR INSERT TO authenticated
    WITH CHECK (is_ai_generated = true);

-- Allow all authenticated users to view chapters
CREATE POLICY "Users can view chapters" ON chapters
    FOR SELECT TO authenticated
    USING (true);

-- ============================================================================
-- SECTION 7: CHAPTER_CONTENT_JOBS POLICIES
-- ============================================================================

-- Drop existing if needed
DROP POLICY IF EXISTS "Users can view own chapter jobs" ON chapter_content_jobs;
DROP POLICY IF EXISTS "Users can create chapter jobs" ON chapter_content_jobs;

-- Users can view their own jobs
CREATE POLICY "Users can view own chapter jobs" ON chapter_content_jobs
    FOR SELECT TO authenticated
    USING (requested_by_user_id = auth.uid());

-- Users can create jobs
CREATE POLICY "Users can create chapter jobs" ON chapter_content_jobs
    FOR INSERT TO authenticated
    WITH CHECK (requested_by_user_id = auth.uid());

-- ============================================================================
-- SECTION 8: Ensure RLS is enabled on all tables
-- ============================================================================

ALTER TABLE map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_content_jobs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 9: Grant necessary permissions
-- ============================================================================

-- Ensure authenticated role has necessary permissions
GRANT SELECT, INSERT, UPDATE ON map_nodes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON learning_paths TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON learning_path_courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON learning_path_enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON courses TO authenticated;
GRANT SELECT, INSERT, UPDATE ON chapters TO authenticated;
GRANT SELECT, INSERT ON chapter_content_jobs TO authenticated;
