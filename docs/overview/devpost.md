# OpenForge - Learn by Building the Open Source Alternative

## Inspiration

Traditional online learning platforms are fundamentally broken. They charge hundreds of dollars for content that becomes outdated within months, teach through isolated tutorials that students forget immediately, and produce certificates that mean nothing in the real world. Meanwhile, small businesses pay $50-500/month for SaaS tools while developers practice on throwaway todo apps that get deleted.

We asked ourselves: **What if learning to code meant building software that matters?**

OpenForge reimagines developer education as a virtuous cycle where students learn by contributing to real open-source projects, AI provides personalized guidance at scale, and the output is free software that benefits everyone.

## What it does

OpenForge is an AI-powered learning platform with three core innovations:

### 1. The Learning Oracle
An intelligent onboarding system that creates personalized learning paths through conversational assessment. Using Google Gemini 2.0 Flash with Google Search grounding, the Oracle:
- Asks adaptive questions about goals, experience, and interests
- Searches current job market trends to ground recommendations in 2024-2025 reality
- Generates multi-path options with confidence scores and reasoning
- Creates a hierarchical node structure (Domain > Topics > Subtopics) tailored to each learner

### 2. Dynamic Content Generation
When a user accepts a learning path, OpenForge dynamically generates course content on demand:
- Courses are created in real-time by Gemini, not pre-recorded
- Content adapts to current industry practices and technologies
- Each node on the knowledge map becomes a rich learning module with chapters, exercises, and assessments
- Progress is tracked with XP, streaks, and achievements (gamification)

### 3. Hex Map Knowledge Universe
A visual, explorable knowledge graph where learners navigate through domains:
- Interactive hex-grid canvas with zoom, pan, and drill-down navigation
- Real-time status indicators showing content generation progress
- Tree-based breadcrumb navigation for context
- Multiple learning domains: Frontend, Backend, Fullstack, Mobile, Games, Databases

## How we built it

### Frontend Architecture
- **Next.js 15** with App Router for server-side rendering and API routes
- **React 19** with client components and hooks for interactive features
- **TypeScript** throughout for type safety
- **Framer Motion** for fluid animations and transitions
- **Tailwind CSS 4** for styling with custom design tokens

### Feature Module Pattern
Self-contained feature modules in `src/app/features/` each with:
- Public API via `index.ts`
- Business logic in `lib/` (types, hooks, storage)
- UI components in `components/`

Key features include:
- `knowledge-map` - Interactive curriculum visualization
- `adaptive-content` - Behavior-based content adaptation
- `progress` - Learning progress tracking with video resume
- `streaks` - Duolingo-style gamification
- `code-playground` - Interactive code execution

### AI Backend Services (Python Flask)
Three microservices deployed on Google Cloud Run:

**Oracle Service** (`cloud/oracle/`)
- Conversational path generation with Gemini 2.0 Flash
- Google Search grounding for market trend awareness
- Session management via Supabase
- Comprehensive Datadog instrumentation

**Content Generator** (`cloud/content-generator/`)
- On-demand course and chapter generation
- Job queue system with progress tracking
- Path acceptance workflow for batch node creation

**Shared Metrics Module** (`cloud/shared/`)
- Standardized Datadog metrics emission
- Token counting and cost estimation
- LLM request/response tracking

### Database
- **Supabase** (PostgreSQL) with 9 migration files covering:
  - Core curriculum schema (categories, courses, chapters, sections)
  - User progress and gamification (XP, achievements, streaks)
  - AI-generated content tracking (map_nodes, content_generation_jobs)
  - Learning path management and enrollments

### Observability (Datadog Integration)
Comprehensive LLM observability meeting hackathon requirements:
- **Custom Metrics**: `llm.gemini.request.latency`, `llm.gemini.tokens.total`, `llm.gemini.cost.usd`
- **Business Metrics**: `oracle.path.generated`, `content.course.created`
- **7 Detection Rules**: Latency alerts, error rate monitors, cost anomaly detection
- **3 SLOs**: Path generation 99%, Content generation 95%, Latency P95 < 10s
- **Dashboard**: 24-widget health overview with KPIs, token usage, cost analysis

## Challenges we ran into

### 1. LLM Response Reliability
Gemini occasionally returns malformed JSON, especially for complex nested structures. We built a robust `extract_json_from_llm_response()` function that handles:
- Markdown code block removal
- Trailing comma cleanup
- Truncated response recovery
- Bracket/brace counting for partial JSON salvage

### 2. Real-time Content Generation UX
Users expect instant results, but AI course generation takes 30-60 seconds. We solved this with:
- Immediate feedback via job creation
- Progress polling with percentage updates
- Path acceptance sidebar showing real-time generation status
- Node status indicators on the hex map

### 3. Hierarchical Knowledge Graph Navigation
Building an intuitive UI for a 3-level deep knowledge graph required:
- Custom viewport state management (zoom, pan, offsets)
- Animated layer transitions between depth levels
- Tree navigation sidebar for context awareness
- Domain-locked navigation to prevent disorientation

### 4. Gamification Without Gimmicks
Making learning engaging without being annoying meant carefully designing:
- XP that reflects actual learning progress
- Streaks with freeze tokens to prevent punishment for life events
- Milestone celebrations that feel earned, not manufactured
- Achievement rarity tiers that create genuine accomplishment

## Accomplishments that we're proud of

1. **Zero pre-made content** - Every course is generated dynamically based on what learners need
2. **Market-aware recommendations** - Google Search grounding means paths reflect current 2024-2025 job market
3. **Production-grade observability** - Full Datadog integration with traces, metrics, SLOs, and incident management
4. **Beautiful hex-grid visualization** - A genuinely innovative UX for navigating learning content
5. **Modular architecture** - 15+ self-contained feature modules that can be independently developed and tested
6. **Type-safe end-to-end** - TypeScript on frontend, Pydantic on backend, generated Supabase types

## What we learned

1. **LLM prompt engineering is critical** - The difference between a 50% and 95% success rate is entirely in prompt design
2. **Observability isn't optional** - Without Datadog metrics, we had no idea why paths were failing
3. **Gamification psychology matters** - Streak freezes dramatically improved user retention in testing
4. **Google Search grounding is powerful** - Real-time market data makes recommendations feel current and trustworthy
5. **Feature modules scale** - The pattern of isolated features with clear APIs made parallel development possible

## What's next for OpenForge

### Phase 1: Real Project Integration
- Connect to GitHub repositories for "Remix Projects" - real open-source codebases as learning material
- AI-powered PR review as tutoring (students submit, AI reviews with educational feedback)
- Project Scanner service to decompose repos into learnable units

### Phase 2: Community Features
- Community paths shared by other learners
- Social proof (completion counts, ratings)
- Collaborative challenges and competitions

### Phase 3: The Virtuous Cycle
- Students learn by contributing to actual open-source SaaS alternatives
- Contributions build real software used by small businesses
- User feedback creates new learning challenges
- The platform improves itself through student work
