-- ============================================================================
-- AI Agent Platform Schema
-- Browser-based AI coding agent with LLM integration
-- ============================================================================

-- Agent Projects table
CREATE TABLE IF NOT EXISTS agent_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb,

  CONSTRAINT unique_user_project_name UNIQUE (user_id, name)
);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_agent_projects_user_id ON agent_projects(user_id);

-- Agent Sessions table (chat sessions)
CREATE TABLE IF NOT EXISTS agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES agent_projects(id) ON DELETE SET NULL,
  title VARCHAR(255),
  model_provider VARCHAR(50) NOT NULL DEFAULT 'anthropic',
  model_id VARCHAR(100) NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_project_id ON agent_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_created_at ON agent_sessions(created_at DESC);

-- Agent Messages table
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES agent_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT,
  tool_calls JSONB,
  tool_results JSONB,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- For ordering within a session
  sequence_number SERIAL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_messages_session_id ON agent_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_session_sequence ON agent_messages(session_id, sequence_number);

-- Agent User Settings table
CREATE TABLE IF NOT EXISTS agent_user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Claude connection (encrypted API key)
  claude_api_key_encrypted TEXT,
  claude_connected_at TIMESTAMP WITH TIME ZONE,

  -- OpenAI connection (encrypted API key)
  openai_api_key_encrypted TEXT,
  openai_connected_at TIMESTAMP WITH TIME ZONE,

  -- Preferences
  preferred_provider VARCHAR(50) DEFAULT 'anthropic',
  preferred_model VARCHAR(100) DEFAULT 'claude-sonnet-4-20250514',

  -- Settings blob
  settings JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent Rate Limiting Log table
CREATE TABLE IF NOT EXISTS agent_rate_limit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100),
  tokens_used INTEGER NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Composite key for upsert
  CONSTRAINT unique_agent_user_provider_window UNIQUE (user_id, provider, window_start)
);

-- Create index for rate limit lookups
CREATE INDEX IF NOT EXISTS idx_agent_rate_limit_user_window ON agent_rate_limit_log(user_id, window_start DESC);

-- Agent Usage Analytics table
CREATE TABLE IF NOT EXISTS agent_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES agent_sessions(id) ON DELETE SET NULL,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  credential_type VARCHAR(20) NOT NULL CHECK (credential_type IN ('platform', 'user')),
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  latency_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for analytics
CREATE INDEX IF NOT EXISTS idx_agent_usage_user_id ON agent_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_usage_created_at ON agent_usage_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_usage_provider ON agent_usage_analytics(provider);

-- Agent Project Files table (virtual filesystem)
CREATE TABLE IF NOT EXISTS agent_project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES agent_projects(id) ON DELETE CASCADE,
  path VARCHAR(1000) NOT NULL,
  is_directory BOOLEAN NOT NULL DEFAULT FALSE,
  content TEXT,  -- For small files, stored directly
  storage_path VARCHAR(500),  -- For large files, reference to Supabase Storage
  size_bytes INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_agent_project_path UNIQUE (project_id, path)
);

-- Create index for file lookups
CREATE INDEX IF NOT EXISTS idx_agent_project_files_project_path ON agent_project_files(project_id, path);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

ALTER TABLE agent_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_rate_limit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_project_files ENABLE ROW LEVEL SECURITY;

-- Projects: users can only access their own projects
CREATE POLICY agent_projects_user_policy ON agent_projects
  FOR ALL USING (auth.uid() = user_id);

-- Sessions: users can only access their own sessions
CREATE POLICY agent_sessions_user_policy ON agent_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Messages: users can access messages from their sessions
CREATE POLICY agent_messages_user_policy ON agent_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agent_sessions
      WHERE agent_sessions.id = agent_messages.session_id
      AND agent_sessions.user_id = auth.uid()
    )
  );

-- User settings: users can only access their own settings
CREATE POLICY agent_user_settings_user_policy ON agent_user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Rate limit log: users can only see their own rate limits
CREATE POLICY agent_rate_limit_user_policy ON agent_rate_limit_log
  FOR ALL USING (auth.uid() = user_id);

-- Usage analytics: users can only see their own usage
CREATE POLICY agent_usage_analytics_user_policy ON agent_usage_analytics
  FOR ALL USING (auth.uid() = user_id);

-- Project files: users can access files from their projects
CREATE POLICY agent_project_files_user_policy ON agent_project_files
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agent_projects
      WHERE agent_projects.id = agent_project_files.project_id
      AND agent_projects.user_id = auth.uid()
    )
  );

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================

-- Use existing update_updated_at function or create if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER agent_projects_updated_at
  BEFORE UPDATE ON agent_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER agent_sessions_updated_at
  BEFORE UPDATE ON agent_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER agent_user_settings_updated_at
  BEFORE UPDATE ON agent_user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER agent_project_files_updated_at
  BEFORE UPDATE ON agent_project_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
