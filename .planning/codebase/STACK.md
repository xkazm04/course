# Technology Stack

**Analysis Date:** 2026-01-26

## Languages

**Primary:**
- TypeScript 5.x - Entire frontend and API routes
- JavaScript/TSX - React components and configuration files

**Secondary:**
- Python 3.x - Cloud functions (`cloud/oracle/`, `cloud/content-generator/`)
- SQL - Supabase database migrations and triggers

## Runtime

**Environment:**
- Node.js (18.x or higher inferred from Next.js 16)
- Python 3.8+ for cloud services

**Package Manager:**
- npm (v10+)
- Lockfile: `package-lock.json` present

## Frameworks

**Core Frontend:**
- Next.js 16.0.10 - App Router, API routes, server/client components
- React 19.2.1 - UI components and state management
- Tailwind CSS 4 with @tailwindcss/postcss - Styling

**Testing:**
- Vitest 4.0.16 - Unit and integration tests
- @testing-library/react 16.3.1 - Component testing
- jsdom 27.4.0 - DOM simulation for tests

**Build/Dev:**
- PostCSS 4 - CSS processing via Tailwind
- ESLint 9 with eslint-config-next - Code linting
- TypeScript - Type checking

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.89.0 - Database and authentication client
- @supabase/ssr 0.8.0 - Server-side Supabase authentication
- @anthropic-ai/sdk 0.52.0 - Claude API integration for agent platform
- @modelcontextprotocol/sdk 1.25.1 - MCP protocol for tool integration

**UI & Visualization:**
- framer-motion 12.23.26 - Animation library
- lucide-react 0.561.0 - Icon library
- d3 7.9.0 - Data visualization
- three 0.182.0 - 3D graphics
- @react-three/fiber 9.5.0 - Three.js React renderer
- @react-three/drei 10.7.7 - Three.js helpers
- @react-three/xr 6.6.28 - XR/VR support
- react-markdown 10.1.0 - Markdown rendering
- highlight.js 11.11.1 - Code syntax highlighting
- @monaco-editor/react 4.7.0 - Code editor component

**Utilities:**
- zustand 5.0.9 - State management
- immer 11.1.3 - Immutable state updates
- clsx 2.1.1 - Conditional className composition
- tailwind-merge 3.4.0 - Tailwind class merging
- fuse.js 7.1.0 - Fuzzy search
- dompurify 3.3.1 - HTML sanitization
- remark-gfm 4.0.1 - GitHub-flavored markdown
- rehype-highlight 7.0.2 - Syntax highlighting for HTML
- @tanstack/react-virtual 3.13.13 - Virtual scrolling

**Development:**
- @vitejs/plugin-react 5.1.2 - Vite React support for Vitest
- dotenv 17.2.3 - Environment variable loading
- @testing-library/dom 10.4.1 - DOM testing utilities
- @testing-library/jest-dom 6.9.1 - Jest matchers
- supabase CLI 2.70.5 - Supabase migration and management

## Configuration

**Environment:**
- NEXT_PUBLIC_SUPABASE_URL - Supabase project endpoint
- NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anonymous key
- SUPABASE_SERVICE_ROLE_KEY - Admin key for server operations
- ANTHROPIC_API_KEY - Claude API key for content generation
- NEXT_PUBLIC_ORACLE_API_URL - Optional Google Cloud Run endpoint (learning path generation)
- NEXT_PUBLIC_CONTENT_GENERATOR_URL - Optional Google Cloud Run endpoint (content generation)
- GOOGLE_AI_API_KEY - Optional Google Gemini API key
- OPENAI_API_KEY - Optional OpenAI API key (for Studio)

**Build:**
- `tsconfig.json` - TypeScript configuration with path aliases (@/, @config/)
- `next.config.ts` - Next.js App Router configuration
- `vitest.config.ts` - Test runner configuration with jsdom
- `eslint.config.mjs` - ESLint with Next.js core web vitals
- `postcss.config.mjs` - Tailwind CSS processing

## Platform Requirements

**Development:**
- Node.js 18.x+
- npm 10+
- PostgreSQL 17 (via Supabase local dev)

**Production:**
- Next.js 16 hosting (Vercel or other Node.js compatible platform)
- Supabase cloud instance (PostgreSQL managed)
- Google Cloud Run for Python services (optional - features degrade gracefully)

## Deployment Configuration

**Frontend:**
- Vercel-ready (standard Next.js 16 App Router)
- Environment variables configurable per deployment

**Backend Services:**
- Supabase hosted PostgreSQL with migrations in `supabase/migrations/`
- Python Flask services deployable to Google Cloud Run:
  - `cloud/oracle/` - Learning path generation with Google Gemini
  - `cloud/content-generator/` - Course content generation with Gemini
  - Both services instrumented with Datadog observability

---

*Stack analysis: 2026-01-26*
