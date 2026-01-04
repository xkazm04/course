-- ============================================================================
-- Fix Enrollment Status Constraint
-- Adds "active" as a valid status value for learning_path_enrollments
-- ============================================================================

-- Option 1: Add 'active' to the check constraint
-- This is the most flexible approach

ALTER TABLE learning_path_enrollments
DROP CONSTRAINT IF EXISTS learning_path_enrollments_status_check;

ALTER TABLE learning_path_enrollments
ADD CONSTRAINT learning_path_enrollments_status_check
CHECK (status IN ('enrolled', 'active', 'in_progress', 'completed', 'dropped', 'paused'));

-- Also ensure the default is 'enrolled' which is the initial state
ALTER TABLE learning_path_enrollments
ALTER COLUMN status SET DEFAULT 'enrolled';
