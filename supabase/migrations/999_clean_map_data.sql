-- ============================================================================
-- Clean Map Data Migration
-- Deletes all map-related data to start fresh
--
-- WARNING: This is a destructive migration!
-- Run with: supabase db push
-- ============================================================================

-- Delete in order to respect foreign key constraints

-- 1. Content generation jobs
DELETE FROM chapter_content_jobs;

-- 2. User progress
DELETE FROM user_map_progress;

-- 3. Learning path enrollments
DELETE FROM learning_path_enrollments;

-- 4. Learning path courses (junction table)
DELETE FROM learning_path_courses;

-- 5. Learning paths
DELETE FROM learning_paths;

-- 6. Chapters
DELETE FROM chapters;

-- 7. Courses
DELETE FROM courses;

-- 8. Map node connections
DELETE FROM map_node_connections;

-- 9. Map nodes
DELETE FROM map_nodes;

-- Confirmation
DO $$
BEGIN
    RAISE NOTICE 'Map data cleanup complete!';
END $$;
