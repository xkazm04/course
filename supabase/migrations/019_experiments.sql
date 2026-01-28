-- ============================================================================
-- Experimentation Framework Migration
-- A/B Testing infrastructure for orchestration decisions and slot variants
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Experiments Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('ab_test', 'multivariate', 'holdout', 'rollout')),
    target_area TEXT NOT NULL CHECK (target_area IN ('orchestration', 'slot_variant', 'content', 'timing', 'layout')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'concluded', 'rolled_out')),
    variants JSONB NOT NULL DEFAULT '[]'::jsonb,
    traffic_allocation INTEGER NOT NULL DEFAULT 100 CHECK (traffic_allocation >= 0 AND traffic_allocation <= 100),
    targeting JSONB,
    primary_metric TEXT NOT NULL,
    secondary_metrics TEXT[] DEFAULT ARRAY[]::TEXT[],
    min_sample_size INTEGER NOT NULL DEFAULT 100,
    significance_threshold NUMERIC(5,4) NOT NULL DEFAULT 0.05,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    winning_variant_id TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id),

    CONSTRAINT valid_variants CHECK (jsonb_typeof(variants) = 'array'),
    CONSTRAINT valid_dates CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
);

-- Indexes for experiments
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_target_area ON experiments(target_area);
CREATE INDEX IF NOT EXISTS idx_experiments_type ON experiments(type);
CREATE INDEX IF NOT EXISTS idx_experiments_created_at ON experiments(created_at DESC);

-- ============================================================================
-- Experiment Assignments Table
-- Tracks which variant each user was assigned to
-- ============================================================================

CREATE TABLE IF NOT EXISTS experiment_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hash_value BIGINT NOT NULL, -- For debugging deterministic assignment
    experiment_version INTEGER NOT NULL,

    CONSTRAINT unique_user_experiment UNIQUE (experiment_id, user_id)
);

-- Indexes for assignments
CREATE INDEX IF NOT EXISTS idx_assignments_experiment ON experiment_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON experiment_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_variant ON experiment_assignments(variant_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_at ON experiment_assignments(assigned_at DESC);

-- ============================================================================
-- Experiment Metrics Table
-- Tracks metric events for experiments
-- ============================================================================

CREATE TABLE IF NOT EXISTS experiment_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    variant_id TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    context JSONB DEFAULT '{}'::jsonb,
    session_id TEXT,

    CONSTRAINT valid_metric_context CHECK (jsonb_typeof(context) = 'object')
);

-- Indexes for metrics
CREATE INDEX IF NOT EXISTS idx_metrics_experiment ON experiment_metrics(experiment_id);
CREATE INDEX IF NOT EXISTS idx_metrics_experiment_variant ON experiment_metrics(experiment_id, variant_id);
CREATE INDEX IF NOT EXISTS idx_metrics_experiment_metric ON experiment_metrics(experiment_id, metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON experiment_metrics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_user ON experiment_metrics(user_id);

-- Partitioning hint for metrics (comment for future implementation)
-- Consider partitioning by month for large-scale deployments

-- ============================================================================
-- Experiment Rollouts Table
-- Tracks gradual rollout status
-- ============================================================================

CREATE TABLE IF NOT EXISTS experiment_rollouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE UNIQUE,
    target_percentage INTEGER NOT NULL CHECK (target_percentage >= 0 AND target_percentage <= 100),
    current_percentage INTEGER NOT NULL DEFAULT 0 CHECK (current_percentage >= 0 AND current_percentage <= 100),
    stage TEXT NOT NULL DEFAULT 'canary' CHECK (stage IN ('canary', 'early_adopters', 'general', 'full')),
    increments INTEGER[] DEFAULT ARRAY[1, 5, 10, 25, 50, 100]::INTEGER[],
    increment_interval_hours INTEGER NOT NULL DEFAULT 24,
    auto_rollback BOOLEAN NOT NULL DEFAULT true,
    rollback_threshold NUMERIC(5,2) NOT NULL DEFAULT 10.00,
    monitor_metrics TEXT[] DEFAULT ARRAY[]::TEXT[],
    health TEXT NOT NULL DEFAULT 'healthy' CHECK (health IN ('healthy', 'degraded', 'critical')),
    last_increment_at TIMESTAMPTZ,
    next_increment_at TIMESTAMPTZ,
    rollbacks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for rollouts
CREATE INDEX IF NOT EXISTS idx_rollouts_experiment ON experiment_rollouts(experiment_id);
CREATE INDEX IF NOT EXISTS idx_rollouts_next_increment ON experiment_rollouts(next_increment_at) WHERE next_increment_at IS NOT NULL;

-- ============================================================================
-- Aggregated Metrics View
-- Pre-computed statistics for dashboard performance
-- ============================================================================

CREATE OR REPLACE VIEW experiment_variant_stats AS
SELECT
    experiment_id,
    variant_id,
    metric_name,
    COUNT(*) as sample_size,
    SUM(value) as sum_value,
    AVG(value) as mean_value,
    STDDEV_SAMP(value) as std_dev,
    MIN(value) as min_value,
    MAX(value) as max_value,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value) as median_value,
    COUNT(CASE WHEN value > 0 THEN 1 END) as conversions,
    COUNT(CASE WHEN value > 0 THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0) as conversion_rate
FROM experiment_metrics
GROUP BY experiment_id, variant_id, metric_name;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get active experiments for a target area
CREATE OR REPLACE FUNCTION get_active_experiments(target TEXT)
RETURNS SETOF experiments AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM experiments
    WHERE status = 'running'
    AND target_area = target
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get user's experiment assignments
CREATE OR REPLACE FUNCTION get_user_assignments(p_user_id UUID)
RETURNS TABLE (
    experiment_id UUID,
    experiment_name TEXT,
    variant_id TEXT,
    assigned_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.name,
        ea.variant_id,
        ea.assigned_at
    FROM experiment_assignments ea
    JOIN experiments e ON e.id = ea.experiment_id
    WHERE ea.user_id = p_user_id
    AND e.status = 'running';
END;
$$ LANGUAGE plpgsql STABLE;

-- Record metric event
CREATE OR REPLACE FUNCTION record_experiment_metric(
    p_experiment_id UUID,
    p_user_id UUID,
    p_variant_id TEXT,
    p_metric_name TEXT,
    p_value NUMERIC,
    p_context JSONB DEFAULT '{}'::jsonb,
    p_session_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_metric_id UUID;
BEGIN
    INSERT INTO experiment_metrics (
        experiment_id, user_id, variant_id, metric_name, value, context, session_id
    ) VALUES (
        p_experiment_id, p_user_id, p_variant_id, p_metric_name, p_value, p_context, p_session_id
    ) RETURNING id INTO v_metric_id;

    RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_rollouts ENABLE ROW LEVEL SECURITY;

-- Experiments: Anyone can read, only admins can write
CREATE POLICY experiments_read_policy ON experiments
    FOR SELECT USING (true);

CREATE POLICY experiments_write_policy ON experiments
    FOR ALL USING (
        auth.jwt() ->> 'role' = 'admin'
        OR created_by = auth.uid()
    );

-- Assignments: Users can see their own assignments
CREATE POLICY assignments_read_policy ON experiment_assignments
    FOR SELECT USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY assignments_write_policy ON experiment_assignments
    FOR INSERT WITH CHECK (true); -- Service role will handle inserts

-- Metrics: Users can record their own metrics
CREATE POLICY metrics_read_policy ON experiment_metrics
    FOR SELECT USING (user_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

CREATE POLICY metrics_write_policy ON experiment_metrics
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Rollouts: Admin only
CREATE POLICY rollouts_policy ON experiment_rollouts
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_experiment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER experiments_updated
    BEFORE UPDATE ON experiments
    FOR EACH ROW
    EXECUTE FUNCTION update_experiment_timestamp();

CREATE OR REPLACE FUNCTION update_rollout_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rollouts_updated
    BEFORE UPDATE ON experiment_rollouts
    FOR EACH ROW
    EXECUTE FUNCTION update_rollout_timestamp();

-- ============================================================================
-- Enable Realtime
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE experiments;
ALTER PUBLICATION supabase_realtime ADD TABLE experiment_assignments;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE experiments IS 'A/B test experiment definitions';
COMMENT ON TABLE experiment_assignments IS 'User-to-variant assignments for experiments';
COMMENT ON TABLE experiment_metrics IS 'Metric events tracked for experiments';
COMMENT ON TABLE experiment_rollouts IS 'Gradual rollout configuration and status';
COMMENT ON VIEW experiment_variant_stats IS 'Aggregated variant statistics for dashboard';
