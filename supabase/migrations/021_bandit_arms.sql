-- Multi-Armed Bandit Tables
-- Stores arm statistics for intervention optimization

-- ============================================================================
-- Arm Statistics Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS bandit_arm_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Arm identification
    arm_id TEXT NOT NULL,
    intervention_type TEXT NOT NULL,

    -- Global statistics
    total_pulls INTEGER NOT NULL DEFAULT 0,
    total_reward DECIMAL(10, 6) NOT NULL DEFAULT 0,
    average_reward DECIMAL(10, 6) NOT NULL DEFAULT 0,

    -- Beta distribution parameters for Thompson Sampling
    beta_alpha DECIMAL(10, 6) NOT NULL DEFAULT 1,
    beta_beta DECIMAL(10, 6) NOT NULL DEFAULT 1,

    -- UCB1 value for fallback
    ucb1_value DECIMAL(10, 6) NOT NULL DEFAULT 0,

    -- Arm status
    is_active BOOLEAN NOT NULL DEFAULT true,
    retired_at TIMESTAMPTZ,
    retirement_reason TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_arm_id UNIQUE (arm_id),
    CONSTRAINT valid_intervention_type CHECK (
        intervention_type IN (
            'interactive_hint',
            'worked_example',
            'scaffolding_content',
            'simplified_example',
            'prerequisite_review',
            'visual_aid',
            'alternative_explanation',
            'concept_bridge',
            'pace_adjustment',
            'micro_practice'
        )
    ),
    CONSTRAINT valid_pulls CHECK (total_pulls >= 0),
    CONSTRAINT valid_reward CHECK (total_reward >= 0),
    CONSTRAINT valid_beta_params CHECK (beta_alpha > 0 AND beta_beta > 0)
);

-- Index for quick lookup by intervention type
CREATE INDEX idx_bandit_arm_intervention_type ON bandit_arm_stats(intervention_type);
CREATE INDEX idx_bandit_arm_active ON bandit_arm_stats(is_active) WHERE is_active = true;

-- ============================================================================
-- Contextual Arm Statistics Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS bandit_contextual_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Reference to arm
    arm_id TEXT NOT NULL REFERENCES bandit_arm_stats(arm_id) ON DELETE CASCADE,

    -- Context identification
    context_hash TEXT NOT NULL,
    context_features JSONB NOT NULL DEFAULT '{}',

    -- Context-specific statistics
    pulls INTEGER NOT NULL DEFAULT 0,
    rewards DECIMAL(10, 6) NOT NULL DEFAULT 0,

    -- Beta parameters for this context
    beta_alpha DECIMAL(10, 6) NOT NULL DEFAULT 1,
    beta_beta DECIMAL(10, 6) NOT NULL DEFAULT 1,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_arm_context UNIQUE (arm_id, context_hash),
    CONSTRAINT valid_context_pulls CHECK (pulls >= 0),
    CONSTRAINT valid_context_rewards CHECK (rewards >= 0)
);

-- Index for context lookups
CREATE INDEX idx_bandit_contextual_arm ON bandit_contextual_stats(arm_id);
CREATE INDEX idx_bandit_contextual_hash ON bandit_contextual_stats(context_hash);

-- ============================================================================
-- Intervention Outcomes Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS bandit_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User and section identification
    user_id UUID NOT NULL,
    section_id TEXT NOT NULL,

    -- Arm selection info
    arm_id TEXT NOT NULL REFERENCES bandit_arm_stats(arm_id) ON DELETE CASCADE,
    intervention_type TEXT NOT NULL,

    -- Context at selection time
    context_hash TEXT NOT NULL,
    context_features JSONB NOT NULL DEFAULT '{}',

    -- Selection metadata
    selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    selection_reason TEXT NOT NULL,
    sampled_value DECIMAL(10, 6),
    confidence DECIMAL(10, 6),
    is_exploration BOOLEAN NOT NULL DEFAULT false,

    -- Outcome data (populated later)
    raw_outcome TEXT CHECK (raw_outcome IN ('helped', 'ignored', 'dismissed')),
    reward DECIMAL(10, 6),
    reward_components JSONB,
    resolved_at TIMESTAMPTZ,
    attribution_confidence DECIMAL(10, 6),

    -- Status
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'expired')),

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for outcome lookups
CREATE INDEX idx_bandit_outcomes_user ON bandit_outcomes(user_id);
CREATE INDEX idx_bandit_outcomes_arm ON bandit_outcomes(arm_id);
CREATE INDEX idx_bandit_outcomes_pending ON bandit_outcomes(status) WHERE status = 'pending';
CREATE INDEX idx_bandit_outcomes_section ON bandit_outcomes(section_id);
CREATE INDEX idx_bandit_outcomes_selected ON bandit_outcomes(selected_at DESC);

-- ============================================================================
-- Bandit Health Metrics Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS bandit_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Aggregate statistics
    total_selections INTEGER NOT NULL DEFAULT 0,
    total_rewards DECIMAL(10, 6) NOT NULL DEFAULT 0,
    average_reward DECIMAL(10, 6) NOT NULL DEFAULT 0,

    -- Exploration tracking
    recent_exploration_rate DECIMAL(10, 6) NOT NULL DEFAULT 0,
    exploration_window_selections INTEGER NOT NULL DEFAULT 0,
    exploration_window_explorations INTEGER NOT NULL DEFAULT 0,

    -- Arm counts
    active_arms INTEGER NOT NULL DEFAULT 0,
    retired_arms INTEGER NOT NULL DEFAULT 0,

    -- Convergence tracking
    convergence_metric DECIMAL(10, 6) NOT NULL DEFAULT 0,

    -- Timestamps
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Only keep one active health record
    is_current BOOLEAN NOT NULL DEFAULT true
);

-- Index for current health
CREATE INDEX idx_bandit_health_current ON bandit_health_metrics(is_current) WHERE is_current = true;

-- ============================================================================
-- Trigger Functions
-- ============================================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_bandit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER trg_bandit_arm_stats_updated
    BEFORE UPDATE ON bandit_arm_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_bandit_updated_at();

CREATE TRIGGER trg_bandit_contextual_stats_updated
    BEFORE UPDATE ON bandit_contextual_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_bandit_updated_at();

CREATE TRIGGER trg_bandit_outcomes_updated
    BEFORE UPDATE ON bandit_outcomes
    FOR EACH ROW
    EXECUTE FUNCTION update_bandit_updated_at();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to update arm statistics after outcome resolution
CREATE OR REPLACE FUNCTION update_arm_statistics(
    p_arm_id TEXT,
    p_reward DECIMAL,
    p_context_hash TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_total_pulls INTEGER;
    v_total_reward DECIMAL;
    v_new_avg DECIMAL;
    v_is_success BOOLEAN;
BEGIN
    -- Determine if this is a success (reward > 0.5)
    v_is_success := p_reward > 0.5;

    -- Update global arm statistics
    UPDATE bandit_arm_stats
    SET
        total_pulls = total_pulls + 1,
        total_reward = total_reward + p_reward,
        average_reward = (total_reward + p_reward) / (total_pulls + 1),
        beta_alpha = CASE WHEN v_is_success THEN beta_alpha + 1 ELSE beta_alpha END,
        beta_beta = CASE WHEN NOT v_is_success THEN beta_beta + 1 ELSE beta_beta END
    WHERE arm_id = p_arm_id
    RETURNING total_pulls, total_reward INTO v_total_pulls, v_total_reward;

    -- Update contextual statistics if context provided
    IF p_context_hash IS NOT NULL THEN
        INSERT INTO bandit_contextual_stats (arm_id, context_hash, pulls, rewards, beta_alpha, beta_beta)
        VALUES (
            p_arm_id,
            p_context_hash,
            1,
            p_reward,
            CASE WHEN v_is_success THEN 2 ELSE 1 END,
            CASE WHEN NOT v_is_success THEN 2 ELSE 1 END
        )
        ON CONFLICT (arm_id, context_hash) DO UPDATE
        SET
            pulls = bandit_contextual_stats.pulls + 1,
            rewards = bandit_contextual_stats.rewards + p_reward,
            beta_alpha = CASE WHEN v_is_success THEN bandit_contextual_stats.beta_alpha + 1 ELSE bandit_contextual_stats.beta_alpha END,
            beta_beta = CASE WHEN NOT v_is_success THEN bandit_contextual_stats.beta_beta + 1 ELSE bandit_contextual_stats.beta_beta END;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate UCB1 value
CREATE OR REPLACE FUNCTION calculate_ucb1(
    p_arm_id TEXT,
    p_total_selections INTEGER,
    p_ucb_constant DECIMAL DEFAULT 2
)
RETURNS DECIMAL AS $$
DECLARE
    v_arm_pulls INTEGER;
    v_avg_reward DECIMAL;
    v_ucb1 DECIMAL;
BEGIN
    SELECT total_pulls, average_reward
    INTO v_arm_pulls, v_avg_reward
    FROM bandit_arm_stats
    WHERE arm_id = p_arm_id;

    IF v_arm_pulls = 0 THEN
        RETURN 999999; -- High value for unexplored arms
    END IF;

    v_ucb1 := v_avg_reward + p_ucb_constant * SQRT(LN(p_total_selections) / v_arm_pulls);

    -- Update the stored UCB1 value
    UPDATE bandit_arm_stats SET ucb1_value = v_ucb1 WHERE arm_id = p_arm_id;

    RETURN v_ucb1;
END;
$$ LANGUAGE plpgsql;

-- Function to check and retire underperforming arms
CREATE OR REPLACE FUNCTION check_arm_retirement(
    p_min_pulls INTEGER DEFAULT 50,
    p_threshold DECIMAL DEFAULT 0.1
)
RETURNS TABLE(arm_id TEXT, intervention_type TEXT, avg_reward DECIMAL) AS $$
BEGIN
    RETURN QUERY
    UPDATE bandit_arm_stats
    SET
        is_active = false,
        retired_at = NOW(),
        retirement_reason = 'Performance below threshold after sufficient trials'
    WHERE
        is_active = true
        AND total_pulls >= p_min_pulls
        AND average_reward < p_threshold
    RETURNING
        bandit_arm_stats.arm_id,
        bandit_arm_stats.intervention_type,
        bandit_arm_stats.average_reward;
END;
$$ LANGUAGE plpgsql;

-- Function to get arm selection probabilities (for Thompson Sampling)
CREATE OR REPLACE FUNCTION get_arm_selection_data()
RETURNS TABLE(
    arm_id TEXT,
    intervention_type TEXT,
    beta_alpha DECIMAL,
    beta_beta DECIMAL,
    total_pulls INTEGER,
    avg_reward DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bas.arm_id,
        bas.intervention_type,
        bas.beta_alpha,
        bas.beta_beta,
        bas.total_pulls,
        bas.average_reward
    FROM bandit_arm_stats bas
    WHERE bas.is_active = true
    ORDER BY bas.avg_reward DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Row Level Security
-- ============================================================================

ALTER TABLE bandit_arm_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bandit_contextual_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bandit_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bandit_health_metrics ENABLE ROW LEVEL SECURITY;

-- Arm stats are readable by all authenticated users (global statistics)
CREATE POLICY "arm_stats_read" ON bandit_arm_stats
    FOR SELECT TO authenticated USING (true);

-- Only service role can modify arm stats
CREATE POLICY "arm_stats_modify" ON bandit_arm_stats
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Contextual stats are readable by all
CREATE POLICY "contextual_stats_read" ON bandit_contextual_stats
    FOR SELECT TO authenticated USING (true);

-- Only service role can modify contextual stats
CREATE POLICY "contextual_stats_modify" ON bandit_contextual_stats
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Users can only see their own outcomes
CREATE POLICY "outcomes_user_read" ON bandit_outcomes
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Service role has full access to outcomes
CREATE POLICY "outcomes_service" ON bandit_outcomes
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Health metrics readable by all
CREATE POLICY "health_read" ON bandit_health_metrics
    FOR SELECT TO authenticated USING (true);

-- Only service role can modify health metrics
CREATE POLICY "health_modify" ON bandit_health_metrics
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- Initialize Default Arms
-- ============================================================================

INSERT INTO bandit_arm_stats (arm_id, intervention_type, beta_alpha, beta_beta)
VALUES
    ('arm_interactive_hint', 'interactive_hint', 1, 1),
    ('arm_worked_example', 'worked_example', 1, 1),
    ('arm_scaffolding_content', 'scaffolding_content', 1, 1),
    ('arm_simplified_example', 'simplified_example', 1, 1),
    ('arm_prerequisite_review', 'prerequisite_review', 1, 1),
    ('arm_visual_aid', 'visual_aid', 1, 1),
    ('arm_alternative_explanation', 'alternative_explanation', 1, 1),
    ('arm_concept_bridge', 'concept_bridge', 1, 1),
    ('arm_pace_adjustment', 'pace_adjustment', 1, 1),
    ('arm_micro_practice', 'micro_practice', 1, 1)
ON CONFLICT (arm_id) DO NOTHING;

-- Initialize health metrics
INSERT INTO bandit_health_metrics (active_arms, is_current)
VALUES (10, true)
ON CONFLICT DO NOTHING;
