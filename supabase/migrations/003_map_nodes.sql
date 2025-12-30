-- ============================================================================
-- Map Nodes - Unified Hierarchical Learning Map
-- Supabase (PostgreSQL) Migration
--
-- This schema supports:
-- 1. Hierarchical map structure (domains -> topics -> skills -> courses -> lessons)
-- 2. Visual node display with metadata
-- 3. Group nodes for categorization
-- 4. Oracle-generated learning paths
-- 5. User progress on map nodes
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENUMS
-- ============================================================================

CREATE TYPE map_node_type AS ENUM (
    'domain',       -- Top-level: Frontend, Backend, Mobile, etc.
    'topic',        -- Second-level: React, Node.js, PostgreSQL, etc.
    'skill',        -- Specific skill: Hooks, REST APIs, Migrations, etc.
    'course',       -- Learning course
    'lesson',       -- Individual lesson/section
    'group'         -- Non-clickable grouping node (Performance, Security, etc.)
);

CREATE TYPE map_node_status AS ENUM (
    'locked',       -- Prerequisites not met
    'available',    -- Can be started
    'in_progress',  -- Currently learning
    'completed'     -- Finished
);

-- ============================================================================
-- SECTION 2: MAP NODES
-- Core table for all map entities
-- ============================================================================

CREATE TABLE map_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Identification
    slug VARCHAR(200) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,

    -- Hierarchy
    parent_id UUID REFERENCES map_nodes(id) ON DELETE SET NULL,
    domain_id VARCHAR(50),  -- Root domain identifier (frontend, backend, mobile, etc.)
    depth INTEGER DEFAULT 0,  -- Nesting level (0 = root domain)
    sort_order INTEGER DEFAULT 0,

    -- Type and classification
    node_type map_node_type NOT NULL,
    is_group_node BOOLEAN DEFAULT FALSE,  -- Group nodes are non-clickable magnets

    -- Visual styling
    icon VARCHAR(50),  -- Lucide icon name
    color VARCHAR(7),  -- Hex color code
    gradient VARCHAR(100),  -- Tailwind gradient class

    -- Content metadata
    description TEXT,
    long_description TEXT,  -- Detailed explanation for node detail view
    what_you_will_learn TEXT[],  -- Learning outcomes
    prerequisites TEXT[],  -- Text prerequisites
    estimated_hours DECIMAL(5, 1),
    difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'expert')),

    -- Linking to existing course system
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,

    -- Metrics
    total_children INTEGER DEFAULT 0,  -- Cached count of children
    completed_children INTEGER DEFAULT 0,  -- For progress calculation

    -- Tags for filtering and search
    tags VARCHAR(50)[] DEFAULT '{}',

    -- AI metadata
    is_ai_generated BOOLEAN DEFAULT FALSE,
    ai_confidence DECIMAL(3, 2),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 3: MAP NODE CONNECTIONS
-- Relationships between nodes (prerequisites, related, etc.)
-- ============================================================================

CREATE TYPE map_connection_type AS ENUM (
    'parent_child',     -- Hierarchical relationship
    'prerequisite',     -- Must complete A before B
    'recommended',      -- Suggested order
    'related',          -- Similar or complementary
    'group_member'      -- Node belongs to a group node
);

CREATE TABLE map_node_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    from_node_id UUID NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,

    connection_type map_connection_type NOT NULL,

    -- Weighting for visualization
    weight INTEGER DEFAULT 1 CHECK (weight >= 1 AND weight <= 10),

    -- Optional label for the connection
    label VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate connections of the same type
    UNIQUE(from_node_id, to_node_id, connection_type),
    CHECK (from_node_id != to_node_id)
);

-- ============================================================================
-- SECTION 4: USER MAP PROGRESS
-- Track user progress on individual map nodes
-- ============================================================================

CREATE TABLE user_map_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,

    -- Progress tracking
    status map_node_status DEFAULT 'locked',
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),

    -- Time tracking
    time_spent_minutes INTEGER DEFAULT 0,

    -- XP earned from this node
    xp_earned INTEGER DEFAULT 0,

    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id, node_id)
);

-- ============================================================================
-- SECTION 5: ORACLE SESSIONS
-- Track Oracle conversation sessions for learning path generation
-- ============================================================================

CREATE TYPE oracle_session_status AS ENUM (
    'in_progress',
    'completed',
    'abandoned'
);

CREATE TABLE oracle_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

    -- Session status
    status oracle_session_status DEFAULT 'in_progress',

    -- Conversation history (for context in subsequent LLM calls)
    conversation_history JSONB DEFAULT '[]'::jsonb,

    -- Static answers (first 3 questions before LLM kicks in)
    domain_answer VARCHAR(100),
    experience_answer VARCHAR(50),
    goal_answer VARCHAR(255),

    -- LLM-generated questions and answers
    llm_questions JSONB DEFAULT '[]'::jsonb,
    llm_answers JSONB DEFAULT '[]'::jsonb,

    -- User context for personalization
    user_skills_snapshot JSONB,
    user_preferences JSONB,

    -- Generated output
    generated_paths JSONB DEFAULT '[]'::jsonb,  -- Array of suggested paths
    selected_path_id UUID,  -- Which path the user selected

    -- Grounding context (from Google Search)
    market_context JSONB,  -- Job market info, trends
    grounding_sources JSONB,  -- URLs and snippets used

    -- LLM metadata
    model_used VARCHAR(50) DEFAULT 'gemini-2.0-flash-exp',
    total_tokens_used INTEGER DEFAULT 0,
    total_latency_ms INTEGER DEFAULT 0,

    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 6: ORACLE GENERATED PATHS
-- Paths suggested by the Oracle
-- ============================================================================

CREATE TABLE oracle_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    session_id UUID NOT NULL REFERENCES oracle_sessions(id) ON DELETE CASCADE,

    -- Path metadata
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Nodes in this path (ordered)
    node_ids UUID[] NOT NULL,  -- Array of map_node IDs in order

    -- Suggested nodes to be "forged" (created by user/AI)
    forge_suggestions JSONB DEFAULT '[]'::jsonb,  -- [{name, description, parent_id, rationale}]

    -- Metrics
    estimated_weeks INTEGER,
    estimated_hours INTEGER,

    -- Visual styling
    color VARCHAR(7),

    -- AI reasoning
    reasoning TEXT,
    confidence_score DECIMAL(3, 2),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 7: INDEXES
-- ============================================================================

-- Map nodes indexes
CREATE INDEX idx_map_nodes_parent ON map_nodes(parent_id);
CREATE INDEX idx_map_nodes_domain ON map_nodes(domain_id);
CREATE INDEX idx_map_nodes_type ON map_nodes(node_type);
CREATE INDEX idx_map_nodes_depth ON map_nodes(depth);
CREATE INDEX idx_map_nodes_course ON map_nodes(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_map_nodes_skill ON map_nodes(skill_id) WHERE skill_id IS NOT NULL;
CREATE INDEX idx_map_nodes_slug ON map_nodes(slug);

-- Full-text search on node name and description
CREATE INDEX idx_map_nodes_search ON map_nodes
    USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Connections indexes
CREATE INDEX idx_map_connections_from ON map_node_connections(from_node_id);
CREATE INDEX idx_map_connections_to ON map_node_connections(to_node_id);
CREATE INDEX idx_map_connections_type ON map_node_connections(connection_type);

-- User progress indexes
CREATE INDEX idx_user_map_progress_user ON user_map_progress(user_id);
CREATE INDEX idx_user_map_progress_node ON user_map_progress(node_id);
CREATE INDEX idx_user_map_progress_status ON user_map_progress(status);

-- Oracle session indexes
CREATE INDEX idx_oracle_sessions_user ON oracle_sessions(user_id);
CREATE INDEX idx_oracle_sessions_status ON oracle_sessions(status);
CREATE INDEX idx_oracle_sessions_created ON oracle_sessions(created_at DESC);

-- ============================================================================
-- SECTION 8: FUNCTIONS & TRIGGERS
-- ============================================================================

-- Update total_children count when children are added/removed
CREATE OR REPLACE FUNCTION update_parent_children_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
        UPDATE map_nodes
        SET total_children = total_children + 1,
            updated_at = NOW()
        WHERE id = NEW.parent_id;
    ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
        UPDATE map_nodes
        SET total_children = GREATEST(0, total_children - 1),
            updated_at = NOW()
        WHERE id = OLD.parent_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
            IF OLD.parent_id IS NOT NULL THEN
                UPDATE map_nodes
                SET total_children = GREATEST(0, total_children - 1),
                    updated_at = NOW()
                WHERE id = OLD.parent_id;
            END IF;
            IF NEW.parent_id IS NOT NULL THEN
                UPDATE map_nodes
                SET total_children = total_children + 1,
                    updated_at = NOW()
                WHERE id = NEW.parent_id;
            END IF;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_parent_children_count
AFTER INSERT OR UPDATE OR DELETE ON map_nodes
FOR EACH ROW EXECUTE FUNCTION update_parent_children_count();

-- Auto-update updated_at
CREATE TRIGGER trigger_map_nodes_updated
BEFORE UPDATE ON map_nodes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_map_progress_updated
BEFORE UPDATE ON user_map_progress
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_oracle_sessions_updated
BEFORE UPDATE ON oracle_sessions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SECTION 9: ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_node_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_map_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE oracle_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE oracle_paths ENABLE ROW LEVEL SECURITY;

-- Map nodes: Public read access
CREATE POLICY "Anyone can view map nodes" ON map_nodes
    FOR SELECT TO anon, authenticated USING (true);

-- Map connections: Public read access
CREATE POLICY "Anyone can view map connections" ON map_node_connections
    FOR SELECT TO anon, authenticated USING (true);

-- User map progress: Users can only see/modify their own
CREATE POLICY "Users can view own map progress" ON user_map_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own map progress" ON user_map_progress
    FOR ALL USING (auth.uid() = user_id);

-- Oracle sessions: Users can only see/modify their own
CREATE POLICY "Users can view own oracle sessions" ON oracle_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own oracle sessions" ON oracle_sessions
    FOR ALL USING (auth.uid() = user_id);

-- Oracle paths: Users can see paths from their sessions
CREATE POLICY "Users can view own oracle paths" ON oracle_paths
    FOR SELECT USING (
        session_id IN (SELECT id FROM oracle_sessions WHERE user_id = auth.uid())
    );

-- ============================================================================
-- SECTION 10: VIEWS
-- Convenient views for common queries
-- ============================================================================

-- Map node with children info
CREATE VIEW map_node_tree AS
SELECT
    n.id,
    n.slug,
    n.name,
    n.parent_id,
    n.domain_id,
    n.depth,
    n.node_type,
    n.is_group_node,
    n.icon,
    n.color,
    n.description,
    n.estimated_hours,
    n.difficulty,
    n.total_children,
    n.tags,
    p.name AS parent_name,
    (SELECT array_agg(c.id ORDER BY c.sort_order) FROM map_nodes c WHERE c.parent_id = n.id) AS child_ids
FROM map_nodes n
LEFT JOIN map_nodes p ON n.parent_id = p.id;

-- User map progress summary
CREATE VIEW user_map_summary AS
SELECT
    ump.user_id,
    mn.domain_id,
    COUNT(*) AS total_nodes,
    COUNT(*) FILTER (WHERE ump.status = 'completed') AS completed_nodes,
    COUNT(*) FILTER (WHERE ump.status = 'in_progress') AS in_progress_nodes,
    SUM(ump.time_spent_minutes) AS total_time_minutes,
    SUM(ump.xp_earned) AS total_xp
FROM user_map_progress ump
JOIN map_nodes mn ON ump.node_id = mn.id
GROUP BY ump.user_id, mn.domain_id;

-- ============================================================================
-- DONE
-- ============================================================================
