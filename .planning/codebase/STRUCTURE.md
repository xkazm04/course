# Codebase Structure

**Analysis Date:** 2026-01-26

## Directory Layout

```
C:\Users\mkdol\dolla\course/
├── src/                           # Source code
│   ├── app/                        # Next.js App Router
│   │   ├── api/                    # API routes for backend logic
│   │   ├── features/               # Feature modules (self-contained)
│   │   ├── forge/                  # Main learning platform UI
│   │   ├── shared/                 # Cross-feature utilities
│   │   ├── layout.tsx              # Root layout with providers
│   │   ├── page.tsx                # Home page
│   │   └── globals.css             # Global styles
│   ├── lib/                        # Libraries and utilities
│   │   ├── supabase/               # Supabase client setup
│   │   ├── agent/                  # AI agent utilities
│   │   └── bandit/                 # Multi-armed bandit implementation
│   ├── styles/                     # Additional stylesheets
│   ├── test/                       # Test utilities and setup
│   └── mcp/                        # Model Context Protocol files
├── cloud/                          # External cloud services (Python)
│   ├── oracle/                     # Oracle learning path generation
│   ├── content-generator/          # Course content generation
│   ├── datadog/                    # Datadog monitoring setup
│   └── shared/                     # Shared Python utilities
├── supabase/                       # Database and Supabase
│   ├── migrations/                 # SQL migration files
│   └── config.toml                 # Supabase config
├── scripts/                        # Utility scripts (Node.js, TypeScript)
├── config/                         # Configuration files
├── prompts/                        # AI prompt templates
├── docs/                           # Documentation
├── public/                         # Static assets
├── .planning/                      # GSD planning directory
├── package.json                    # Node dependencies
├── tsconfig.json                   # TypeScript config
├── tailwind.config.ts              # Tailwind CSS config
├── vitest.config.ts                # Vitest config
└── .env*                           # Environment variables
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router directory - routes, pages, layouts, API handlers
- Contains: Page components, layout wrappers, API routes, feature modules
- Key files: `layout.tsx` (root layout), `page.tsx` (home), `globals.css`

**`src/app/api/`:**
- Purpose: Backend API endpoints consumed by frontend and external systems
- Contains: Route handlers organized by domain (chapters, progress, user, etc.)
- Structure: `/domain/route.ts` or `/domain/[id]/route.ts` for dynamic routes
- Key endpoints: `/api/map-nodes`, `/api/progress/*`, `/api/chapters/*`, `/api/user/*`

**`src/app/features/`:**
- Purpose: Feature modules - self-contained, reusable functionality
- Contains: 40+ feature modules including progress, chapter, knowledge-map, homework-v2, theme, etc.
- Pattern: Each module has `index.ts` (exports), `lib/` (implementation), `components/` (UI)
- Examples: `progress/`, `chapter/`, `knowledge-map/`, `knowledge-universe/`, `homework-v2/`

**`src/app/forge/`:**
- Purpose: Main learning platform UI and routes
- Contains: Pages (dashboard, map, progress, challenges), layouts, components, shared utilities
- Routes: `/forge` (dashboard), `/forge/map`, `/forge/progress`, `/forge/challenges`, `/forge/projects`
- Key file: `layout.tsx` wraps with ForgeProvider (auth context, user data)

**`src/app/shared/`:**
- Purpose: Utilities, hooks, and components used across features
- Contains: `components/` (shared UI), `hooks/` (shared React hooks), `lib/` (utility functions)
- Key files: `lib/utils.ts` (cn function), `lib/iconSizes.ts` (icon size constants)

**`src/lib/`:**
- Purpose: Core libraries and infrastructure
- Contains: Supabase client setup, AI agent utilities, multi-armed bandit algorithm
- Key files: `supabase/client.ts`, `supabase/server.ts`, `supabase/types.ts`, `supabase/index.ts`

**`src/lib/supabase/`:**
- Purpose: Supabase integration layer
- Key files:
  - `client.ts` - Browser Supabase client (singleton pattern)
  - `server.ts` - Server Supabase client with cookie handling, admin client
  - `types.ts` - Auto-generated TypeScript types from Supabase schema
  - `index.ts` - Re-exports public API
  - `useRealtimeChapter.ts` - Real-time subscription hook for chapter updates
  - `useRealtimeJobProgress.ts` - Real-time subscription hook for job progress

**`src/styles/`:**
- Purpose: CSS files separate from global styles
- Contains: Tailwind CSS, component styles

**`src/test/`:**
- Purpose: Test utilities, fixtures, setup
- Contains: Testing helpers, mock data, Vitest configuration

**`cloud/`:**
- Purpose: External Python services for CPU-intensive or specialized tasks
- Services:
  - `oracle/` - Learning path generation using Google Gemini
  - `content-generator/` - Course content generation
  - `datadog/` - Monitoring and metrics setup
  - `shared/` - Shared Python utilities (metrics, etc.)

**`supabase/`:**
- Purpose: Database schema and configuration
- Contains: SQL migration files (`*.sql`) for version control
- Key migrations: `015_ai_agent_platform.sql`, `016_lesson_content.sql`, `017_curated_learning_paths.sql`

**`scripts/`:**
- Purpose: One-off utility scripts for data management, seeding, analysis
- Examples: `seed-frontend-curriculum.ts`, `seed-lesson-content.ts`, `list-lessons.ts`, `analyze-curriculum.ts`

**`config/`:**
- Purpose: Application configuration files
- Contains: Feature flags, constants, environment-specific settings

**`prompts/`:**
- Purpose: AI prompt templates for content generation
- Examples: `lesson-generator.md`, `homework-breakdown.md`, `skill-homework-generation.md`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx` - Root layout, providers setup (Theme, Progress, Velocity, LearningGraph)
- `src/app/page.tsx` - Home page with hero, sections, lazy-loaded knowledge universe
- `src/app/forge/layout.tsx` - Forge platform layout with nav, ForgeProvider
- `src/app/forge/page.tsx` - Forge dashboard home
- `src/app/forge/map/page.tsx` - Interactive learning map visualization

**Configuration:**
- `package.json` - Dependencies, scripts (dev, build, lint, test)
- `tsconfig.json` - TypeScript compiler options, path aliases (`@/*` → `src/*`, `@config/*` → `config/*`)
- `tailwind.config.ts` - Tailwind CSS v4 configuration
- `vitest.config.ts` - Vitest test runner config
- `.env.local` - Local environment variables (Supabase URL, keys, API keys)

**Core Logic:**
- `src/app/api/progress/lib/xpCalculator.ts` - XP and level system, safe arithmetic overflow detection
- `src/app/api/map-nodes/route.ts` - Map node fetching with type transformation and user progress
- `src/app/api/user/learning-paths/route.ts` - User's learning paths, active paths
- `src/app/features/chapter/lib/chapterGraph.ts` - Chapter prerequisite graph and traversability
- `src/app/features/knowledge-map/lib/useSceneGraph.ts` - Knowledge map visualization data structure
- `src/app/features/progress/lib/ProgressContext.tsx` - Progress state management
- `src/app/features/progress/lib/progressStorage.ts` - localStorage persistence for progress

**Testing:**
- `src/test/` - Test utilities and setup files
- `vitest.config.ts` - Vitest configuration
- Test files: `*.test.ts`, `*.spec.ts` co-located with source files

**Styling:**
- `src/app/globals.css` - Global Tailwind CSS directives, CSS variables
- `tailwind.config.ts` - Theme colors, spacing, plugin configuration
- Component styles: Inline Tailwind classes in JSX, no separate CSS files typically

## Naming Conventions

**Files:**
- React components: PascalCase, e.g., `ProgressBar.tsx`, `ChapterView.tsx`, `HexGrid.tsx`
- Hooks: camelCase with `use` prefix, e.g., `useProgress.ts`, `useSceneGraph.ts`, `useForge.ts`
- Utilities: camelCase, e.g., `utils.ts`, `types.ts`, `xpCalculator.ts`, `progressStorage.ts`
- API routes: `route.ts` in directory matching endpoint path
- Tests: `*.test.ts` or `*.spec.ts` in same directory as source

**Directories:**
- Feature modules: kebab-case, e.g., `knowledge-map/`, `homework-v2/`, `user-learning-graph/`
- API domains: kebab-case, e.g., `/api/map-nodes`, `/api/user-learning-graph`
- Nested routes: `[paramName]` for dynamic segments

**Variables:**
- camelCase for variables, functions: `currentDomain`, `mapData`, `acceptedPath`
- UPPER_SNAKE_CASE for constants: `MAX_SAFE_XP`, `XP_CAUTION_THRESHOLD`
- PascalCase for types, interfaces: `MapNode`, `LearningPath`, `ProgressData`

**CSS/Styling:**
- Tailwind utility classes for styling
- CSS variables for theme (e.g., `--forge-text-primary`, `--ember`, `--forge-border-subtle`)
- kebab-case for custom CSS class names (rare, prefer Tailwind)

## Where to Add New Code

**New Feature:**
- Create `src/app/features/feature-name/` directory
- Structure:
  ```
  feature-name/
  ├── index.ts              # Export types, hooks, context, components
  ├── lib/
  │   ├── types.ts          # TypeScript interfaces
  │   ├── use*.ts           # React hooks
  │   ├── feature.ts        # Core logic
  │   └── *Storage.ts       # localStorage persistence
  └── components/
      ├── ComponentName.tsx  # React components
      └── index.ts          # Component exports
  ```
- Tests: `src/app/features/feature-name/*.test.ts` co-located with implementation
- Export through feature `index.ts`, import via `@/app/features/feature-name`

**New Component/Module:**
- If shared across features: `src/app/shared/components/`
- If feature-specific: `src/app/features/feature-name/components/`
- If forge-specific: `src/app/forge/components/`

**New API Endpoint:**
- Create directory at `src/app/api/domain/` (or `src/app/api/domain/[param]/` for dynamic)
- Create `route.ts` with handler functions: `async function GET()`, `async function POST()`, etc.
- Extract business logic to `src/app/api/domain/lib/` if complex
- Use Supabase server client: `const supabase = await createClient()`
- Return NextResponse with JSON

**Utilities/Helpers:**
- Shared across app: `src/app/shared/lib/`
- Feature-specific: `src/app/features/feature-name/lib/`
- API-specific: `src/app/api/domain/lib/`

**Tests:**
- Co-locate with implementation: `src/app/features/feature-name/component.test.ts`
- Use Vitest (configured in `vitest.config.ts`)
- Use React Testing Library for component tests
- Reference: `src/app/features/knowledge-universe/components/HierarchicalMap.test.tsx`

**Styles:**
- Use Tailwind utility classes in JSX (no separate CSS files typically)
- If global styles needed: add to `src/app/globals.css`
- Custom CSS variables in globals.css for theme tokens

## Special Directories

**`src/app/api/admin/`:**
- Purpose: Administrative endpoints (seeding, cache clearing, data cleanup)
- Generated: No (manually created)
- Committed: Yes
- Examples: `seed-frontend-curriculum/`, `seed-lesson-content/`, `reset/`, `clean-map-data/`
- Security: Should have authentication guard in production

**`.planning/codebase/`:**
- Purpose: GSD orchestration documents (generated)
- Generated: Yes (by GSD map-codebase command)
- Committed: Yes
- Contents: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, STACK.md, INTEGRATIONS.md, CONCERNS.md

**`.next/`:**
- Purpose: Next.js build output and development build cache
- Generated: Yes (during `npm run dev` or `npm run build`)
- Committed: No (.gitignore)

**`node_modules/`:**
- Purpose: npm package cache
- Generated: Yes (npm install)
- Committed: No (.gitignore)

---

*Structure analysis: 2026-01-26*
