-- ============================================================================
-- Chapter Content Generation Updates
-- Adds batch tracking for path acceptance flow and node generation status
-- ============================================================================

-- ============================================================================
-- SECTION 1: ADD GENERATION STATUS TO MAP_NODES
-- ============================================================================

-- Add generation status column to track content generation state
ALTER TABLE map_nodes ADD COLUMN IF NOT EXISTS
    generation_status VARCHAR(20) DEFAULT NULL;

-- Add reference to the generation job for this node
ALTER TABLE map_nodes ADD COLUMN IF NOT EXISTS
    generation_job_id UUID REFERENCES content_generation_jobs(id) ON DELETE SET NULL;

-- Index for finding nodes by generation status
CREATE INDEX IF NOT EXISTS idx_map_nodes_generation_status
ON map_nodes(generation_status) WHERE generation_status IS NOT NULL;

COMMENT ON COLUMN map_nodes.generation_status IS 'Content generation status: pending, generating, ready, failed';
COMMENT ON COLUMN map_nodes.generation_job_id IS 'Reference to the active/last content generation job';

-- ============================================================================
-- SECTION 2: ADD BATCH TRACKING TO CONTENT_GENERATION_JOBS
-- ============================================================================

-- Add batch_id for grouping jobs from path acceptance
ALTER TABLE content_generation_jobs ADD COLUMN IF NOT EXISTS
    batch_id UUID;

-- Add path_node_id to track the original Oracle PathNode.id
ALTER TABLE content_generation_jobs ADD COLUMN IF NOT EXISTS
    path_node_id TEXT;

-- Add path_id to track which Oracle path this job belongs to
ALTER TABLE content_generation_jobs ADD COLUMN IF NOT EXISTS
    path_id TEXT;

-- Add domain context for the generation (references map_nodes since domains are stored there)
ALTER TABLE content_generation_jobs ADD COLUMN IF NOT EXISTS
    domain_id UUID REFERENCES map_nodes(id);

-- Index for batch queries
CREATE INDEX IF NOT EXISTS idx_generation_jobs_batch
ON content_generation_jobs(batch_id) WHERE batch_id IS NOT NULL;

-- Index for path-based queries
CREATE INDEX IF NOT EXISTS idx_generation_jobs_path
ON content_generation_jobs(path_id) WHERE path_id IS NOT NULL;

COMMENT ON COLUMN content_generation_jobs.batch_id IS 'Groups jobs created together from a single path acceptance';
COMMENT ON COLUMN content_generation_jobs.path_node_id IS 'Original PathNode.id from Oracle path';
COMMENT ON COLUMN content_generation_jobs.path_id IS 'Oracle path identifier';

-- ============================================================================
-- SECTION 3: ADD CHAPTER CONTENT TYPE
-- ============================================================================

-- Add chapter_content to the enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'chapter_content'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'content_generation_type')
    ) THEN
        ALTER TYPE content_generation_type ADD VALUE 'chapter_content';
    END IF;
END
$$;

-- ============================================================================
-- SECTION 4: UPDATE DEPTH VALIDATION TRIGGER
-- Now allows depth 0, 1, AND 2 (chapters)
-- ============================================================================

-- Drop the old trigger first
DROP TRIGGER IF EXISTS trigger_check_node_depth ON content_generation_jobs;

-- Update the function to allow depth 0, 1, 2
CREATE OR REPLACE FUNCTION check_node_depth_for_generation()
RETURNS TRIGGER AS $$
DECLARE
    node_depth INTEGER;
BEGIN
    SELECT depth INTO node_depth FROM map_nodes WHERE id = NEW.node_id;

    IF node_depth IS NULL THEN
        RAISE EXCEPTION 'Node not found: %', NEW.node_id;
    END IF;

    -- Allow depth 0 (domains), 1 (topics), and 2 (chapters)
    IF node_depth > 2 THEN
        RAISE EXCEPTION 'Content generation is only available for depth 0-2 nodes. Node depth: %', node_depth;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_check_node_depth
BEFORE INSERT ON content_generation_jobs
FOR EACH ROW EXECUTE FUNCTION check_node_depth_for_generation();

-- ============================================================================
-- SECTION 5: BATCH STATUS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW batch_generation_status AS
SELECT
    batch_id,
    path_id,
    COUNT(*) AS total_jobs,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_jobs,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed_jobs,
    COUNT(*) FILTER (WHERE status IN ('pending', 'processing')) AS active_jobs,
    ROUND(
        (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0)) * 100,
        2
    ) AS completion_percent,
    MIN(created_at) AS batch_started_at,
    MAX(completed_at) FILTER (WHERE status IN ('completed', 'failed')) AS last_job_finished_at
FROM content_generation_jobs
WHERE batch_id IS NOT NULL
GROUP BY batch_id, path_id;

COMMENT ON VIEW batch_generation_status IS 'Aggregated status for batch content generation jobs';

-- ============================================================================
-- SECTION 6: NODE STATUS FUNCTION
-- ============================================================================

-- Function to get generation status for multiple nodes efficiently
CREATE OR REPLACE FUNCTION get_nodes_generation_status(node_ids UUID[])
RETURNS TABLE (
    node_id UUID,
    status VARCHAR(20),
    progress_percent INTEGER,
    course_id UUID,
    error_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mn.id AS node_id,
        mn.generation_status AS status,
        COALESCE(cgj.progress_percent, 0) AS progress_percent,
        mn.course_id,
        cgj.error_message
    FROM map_nodes mn
    LEFT JOIN content_generation_jobs cgj ON mn.generation_job_id = cgj.id
    WHERE mn.id = ANY(node_ids);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- SECTION 7: UPDATE MAP_NODE ON JOB STATUS CHANGE
-- ============================================================================

-- Trigger function to sync generation status to map_nodes
CREATE OR REPLACE FUNCTION sync_node_generation_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the map_node's generation_status based on job status
    UPDATE map_nodes
    SET
        generation_status = CASE
            WHEN NEW.status = 'pending' THEN 'pending'
            WHEN NEW.status = 'processing' THEN 'generating'
            WHEN NEW.status = 'completed' THEN 'ready'
            WHEN NEW.status = 'failed' THEN 'failed'
            ELSE generation_status
        END,
        generation_job_id = NEW.id
    WHERE id = NEW.node_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_sync_node_generation_status ON content_generation_jobs;
CREATE TRIGGER trigger_sync_node_generation_status
AFTER INSERT OR UPDATE OF status ON content_generation_jobs
FOR EACH ROW EXECUTE FUNCTION sync_node_generation_status();

-- ============================================================================
-- DONE
-- ============================================================================
