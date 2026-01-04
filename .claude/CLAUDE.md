# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenForge is a learning platform where students learn by contributing to real open-source SaaS alternatives. Built with Next.js 15 (App Router), React 19, Supabase, and AI-powered content generation (Anthropic Claude, Google Gemini).

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
npm run test     # Run Vitest in watch mode
npm run test:run # Run tests once
```

## Architecture

### Directory Structure

```
src/
├── app/
│   ├── api/           # Next.js API routes
│   ├── features/      # Feature modules (self-contained)
│   ├── forge/         # Main learning platform pages
│   └── shared/        # Shared utilities and components
├── lib/
│   └── supabase/      # Supabase client setup (client.ts, server.ts, types.ts)
cloud/
├── oracle/            # Python Flask - AI learning path generation (Gemini)
├── content-generator/ # Python Flask - AI course content generation
├── project-scanner/   # Python Flask - GitHub repo analysis for homework
└── shared/            # Shared Python utilities (metrics, etc.)
supabase/
└── migrations/        # Database migrations
```

### Feature Module Pattern

Each feature in `src/app/features/` follows this structure:
```
feature-name/
├── index.ts           # Public exports only
├── lib/
│   ├── types.ts       # TypeScript interfaces
│   ├── use*.ts        # React hooks
│   └── *Storage.ts    # localStorage persistence
└── components/
    └── index.ts       # Component exports
```

Import features via namespace: `import { Progress, Chapter } from "@/app/features"`

### Supabase Integration

- **Client components**: `import { createClient } from "@/lib/supabase/client"`
- **Server components/API routes**: `import { createClient } from "@/lib/supabase/server"` (async)
- **Admin operations**: `createAdminClient()` - bypasses RLS, use sparingly
- Types are in `src/lib/supabase/types.ts` - regenerate with `supabase gen types typescript`

### Path Alias

Use `@/` for imports from `src/`: `import { Component } from "@/app/features/chapter"`

## Key Patterns

### API Routes
API routes are in `src/app/api/` using Next.js 15 App Router conventions. Routes export async functions like `GET`, `POST`, etc.

### State Management
- Client-side persistence uses localStorage via `*Storage.ts` utilities
- Server state uses Supabase with typed queries
- React Context for cross-component state (e.g., `ProgressContext`, `AdaptiveContentContext`)

### AI Integration
- Anthropic Claude SDK (`@anthropic-ai/sdk`) for course generation
- Python services in `cloud/` use Google Gemini with Datadog metrics
- AI content includes confidence scores and reasoning

### Component Styling
- Tailwind CSS 4 with `clsx` and `tailwind-merge` for class composition
- Framer Motion for animations
- Lucide React for icons

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations
- `ANTHROPIC_API_KEY` - For AI course generation
