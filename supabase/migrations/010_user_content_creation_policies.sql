-- ============================================================================
-- User Content Creation RLS Policies
-- Allows authenticated users to create chapters and learning paths
-- ============================================================================

-- =============================================================================
-- Chapters INSERT Policy
-- =============================================================================

-- Allow authenticated users to create AI-generated chapters
-- This enables the Oracle to generate personalized content for any course
CREATE POLICY "Authenticated users can create chapters" ON chapters
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Allow if the chapter is AI-generated (Oracle content)
        is_ai_generated = true
        -- OR if user owns the course
        OR EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = chapters.course_id
            AND courses.created_by_user_id = auth.uid()
        )
    );

-- Allow users to update chapters they created (via the course ownership)
CREATE POLICY "Users can update chapters for own courses" ON chapters
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = chapters.course_id
            AND courses.created_by_user_id = auth.uid()
        )
    );

-- =============================================================================
-- Learning Paths INSERT/UPDATE Policies
-- =============================================================================

-- Allow authenticated users to create learning paths
CREATE POLICY "Authenticated users can create learning_paths" ON learning_paths
    FOR INSERT TO authenticated
    WITH CHECK (
        created_by_user_id = auth.uid()
    );

-- Allow users to update their own learning paths
CREATE POLICY "Users can update own learning_paths" ON learning_paths
    FOR UPDATE TO authenticated
    USING (created_by_user_id = auth.uid());

-- Allow users to delete their own learning paths
CREATE POLICY "Users can delete own learning_paths" ON learning_paths
    FOR DELETE TO authenticated
    USING (created_by_user_id = auth.uid());

-- =============================================================================
-- Courses - Ensure AI-generated courses can have chapters added
-- =============================================================================

-- Update the existing courses policy to allow viewing all user-created courses
-- (not just published ones) for the owner
DROP POLICY IF EXISTS "Public read access to courses" ON courses;

CREATE POLICY "Public read access to courses" ON courses
    FOR SELECT TO anon, authenticated
    USING (
        status = 'published'
        OR created_by_user_id = auth.uid()
    );
