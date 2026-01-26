# External Integrations

**Analysis Date:** 2026-01-26

## APIs & External Services

**LLM Providers:**
- Anthropic Claude API - Primary agent/assistant via `@anthropic-ai/sdk` (0.52.0)
  - SDK: `@anthropic-ai/sdk`
  - Auth: `ANTHROPIC_API_KEY` env var
  - Used for: Homework generation, coding assistance, agent platform
  - Client location: `src/lib/agent/providers.ts`

- Google Gemini API - Learning path generation and content generation
  - SDK: `google.genai` (Python)
  - Auth: `GOOGLE_API_KEY` env var
  - Used by: Cloud functions in `cloud/oracle/` and `cloud/content-generator/`
  - Features: Google Search grounding for web-current knowledge

- OpenAI GPT-4o - Optional provider available
  - Not actively used but configured
  - Auth: `OPENAI_API_KEY` env var
  - Available in agent platform via `config/llm.ts`

**Model Context Protocol:**
- @modelcontextprotocol/sdk 1.25.1 - Tool integration framework
  - Location: `src/lib/agent/`
  - Used for: File access, terminal execution, search capabilities

**Observability:**
- Datadog - Comprehensive LLM observability
  - SDK: `ddtrace` (Python)
  - Metrics: Token usage, latency, cost, business metrics
  - APM traces for all cloud endpoints
  - Structured logging for debugging
  - Setup: `cloud/datadog/setup_datadog.py`

## Data Storage

**Primary Database:**
- Supabase PostgreSQL (managed)
  - Version: PostgreSQL 17
  - Connection: `NEXT_PUBLIC_SUPABASE_URL`
  - Credentials: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public), `SUPABASE_SERVICE_ROLE_KEY` (admin)
  - Client: `@supabase/supabase-js` 2.89.0
  - Server auth: `@supabase/ssr` 0.8.0

**File Storage:**
- Supabase Storage (S3-compatible buckets)
  - Configured via Supabase client
  - Max file size: 50MiB (configured in `supabase/config.toml`)

**Schema:**
- Migrations in `supabase/migrations/`
- Key tables:
  - `users` - User authentication and profiles
  - `chapters` - Course chapters and content
  - `map_nodes` - Knowledge graph nodes
  - `homework_definitions` - Exercise specifications
  - `learning_paths` - Personalized learning paths
  - `agent_sessions` - AI agent conversation sessions
  - `agent_messages` - Message history
  - `agent_user_settings` - API key storage (encrypted)
  - `experiments` - A/B testing experiments
  - `bandit_arms` - Multi-armed bandit implementation

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (custom, not external OAuth)
  - Implementation: Email/password, magic links
  - Session management: JWT tokens (3600s default, max 1 week)
  - Refresh token rotation: Enabled
  - RLS policies: Row-level security enforced at database level
  - Configuration: `supabase/config.toml` [auth] section

**User API Keys (Encrypted):**
- Claude API keys stored in `agent_user_settings.claude_api_key_encrypted`
- OpenAI keys stored in `agent_user_settings.openai_api_key_encrypted`
- Encryption: Via `src/lib/agent/crypto` module using `ENCRYPTION_KEY`

## Monitoring & Observability

**Error Tracking:**
- None detected (native Next.js error handling)

**Logging:**
- Server-side: Next.js built-in logging
- Client-side: Browser console
- Cloud functions: Python logging with Datadog instrumentation
- Datadog captures: APM traces, metrics, structured logs

**Datadog Integration Details:**
```python
# Instrumentation in cloud functions:
from ddtrace import tracer
metrics = OracleMetrics()  # or ContentGeneratorMetrics()
# Tracks: llm.gemini.request.count, llm.gemini.request.latency, etc.
```

## CI/CD & Deployment

**Hosting:**
- Next.js 16 frontend: Vercel (inferred) or Node.js-compatible platform
- Supabase: Cloud-hosted PostgreSQL
- Python services: Google Cloud Run
  - `oracle-731858830008.us-central1.run.app` - Learning path generation
  - `content-generator-731858830008.us-central1.run.app` - Content generation

**Local Development:**
- Supabase CLI for local dev environment
- `supabase start` brings up local PostgreSQL, API, Auth, Realtime
- Local ports configured in `supabase/config.toml`:
  - API: 54321
  - Database: 54322
  - Studio UI: 54323
  - Email testing: 54324

**CI Pipeline:**
- Not detected in codebase (no GitHub Actions, CircleCI config)

## Environment Configuration

**Required env vars:**

*Frontend (.env.local):*
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `ANTHROPIC_API_KEY` - For agent/course generation
- `NEXT_PUBLIC_ORACLE_API_URL` - Learning path service (optional, mock mode if missing)
- `NEXT_PUBLIC_CONTENT_GENERATOR_URL` - Content generation service (optional)

*Backend (.env or secrets):*
- `SUPABASE_SERVICE_ROLE_KEY` - Admin operations
- `GOOGLE_API_KEY` - Gemini API access
- `OPENAI_API_KEY` - Optional Studio feature
- `ENCRYPTION_KEY` - Encrypting user API keys
- `DD_API_KEY` - Datadog agent instrumentation (optional)

**Secrets location:**
- Development: `.env` file (local, not committed)
- Production: Deployment platform env vars (Vercel, Cloud Run, etc.)
- Encrypted at rest: Supabase service role operations

## Webhooks & Callbacks

**Incoming:**
- Supabase Realtime subscriptions (event-driven, not webhooks):
  - Chapter status updates via `useRealtimeChapterStatus()` in `src/lib/supabase/useRealtimeChapterStatus.ts`
  - Job progress updates via `useRealtimeJobProgress()` in `src/lib/supabase/useRealtimeJobProgress.ts`

**Outgoing:**
- Custom webhook URL support for slot providers:
  - API endpoint: `src/app/api/slot-providers/[providerId]/generate/route.ts`
  - Allows external providers to define `webhookUrl` for callbacks (not fully implemented)

## Streaming & Real-time

**Server-Sent Events (SSE):**
- Agent chat streaming via `src/app/api/agent/chat/route.ts`
- TextEncoder-based event streaming for LLM responses
- Rate limiting enforced per user/tier

**Supabase Realtime:**
- WebSocket subscriptions for database changes
- Configured in `supabase/config.toml` [realtime] section
- Used for live chapter content status, job progress tracking

---

*Integration audit: 2026-01-26*
