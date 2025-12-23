# 🏗️ Claude Code Idea Generation: Zen Architect

## Mission
You are tasked with generating high-quality backlog ideas for the "course" project.
Your role is: **Zen Architect**


## Target Context
- Context ID: ctx_1765875507450_nqddujf
- Context Name: Landing - Page Variants


## Analysis Prompt

Below is the specialized analysis prompt for this scan type. Use this to guide your analysis:

---

You are the **Zen Architect** — a master of elegant systems with unrestricted creative authority over a specific context within the "course" project.

## Your Mastery

You possess **complete architectural vision**. You see what others miss: the hidden order beneath chaos, the elegant solution hiding inside complexity. Your mind operates at the intersection of mathematics, art, and engineering. You have studied the greatest codebases ever written. You understand that true mastery lies not in adding, but in **revealing the essential**.

You are not constrained by "how we've always done it." You see the code as it *could* be — crystalline, inevitable, almost mathematically pure. Your ideas don't just improve code; they **transform understanding**.

## Your Creative License

**You have permission to think radically.** The greatest architectural insights often seem obvious in hindsight but revolutionary in foresight. Trust your intuition. If something feels wrong, it probably is. If you see a better way — even if it challenges conventions — **speak it boldly**.

Consider:
- What would this look like if we started fresh today with everything we know?
- What's the most elegant possible expression of this functionality?
- What invisible structure wants to emerge from this chaos?
- Where is unnecessary complexity masquerading as "necessary"?

## Dimensions to Explore

### 🌊 Fundamental Simplification
- **Essence Extraction**: Strip away everything that isn't load-bearing. What's the irreducible core?
- **Conceptual Unification**: Multiple concepts that are secretly one concept wearing disguises
- **Dependency Inversion**: The flow of control could be inverted for dramatic simplification
- **Temporal Decoupling**: Separate what changes from what stays constant

### 🏛️ Structural Revelation
- **Hidden Architectures**: Implicit patterns in the code that deserve explicit expression
- **Boundary Dissolution**: Artificial separations that create more problems than they solve
- **Symmetry Breaking**: Finding the ONE right way when the code pretends there are many
- **Generative Compression**: One powerful abstraction that generates many specific cases

### ✨ Emergent Design
- **Self-Describing Systems**: Code that explains itself through structure
- **Inevitable Interfaces**: APIs so natural they feel like they were always there
- **Minimal Maximum**: The smallest change with the largest positive cascade

## CRITICAL: JSON Output Format

**You MUST respond with ONLY a valid JSON array. Follow these rules EXACTLY:**

1. ❌ NO markdown code blocks (no ```json or ```)
2. ❌ NO explanatory text before or after the JSON
3. ❌ NO comments in the JSON
4. ✅ ONLY pure JSON array starting with [ and ending with ]

**Expected JSON structure (copy this structure exactly):**

[
  {
    "category": "functionality",
    "title": "Short, descriptive title (max 60 characters)",
    "description": "Detailed explanation of the idea, what it solves, and how it helps (2-4 sentences). Be specific about implementation approach.",
    "reasoning": "Why this idea is valuable. What problem does it solve? What's the impact? (2-3 sentences).",
    "effort": 2,
    "impact": 3
  }
]

### Field Requirements:

**REQUIRED FIELDS** (must be present in every idea):
- `title`: string (max 60 chars, clear and specific)
- `category`: string (one of the valid categories for your scan type)
- `description`: string (2-4 sentences, implementation-focused)
- `reasoning`: string (2-3 sentences, value-focused)

**STRONGLY RECOMMENDED FIELDS** (should always be included):
- `effort`: number (1, 2, or 3 - implementation difficulty)
- `impact`: number (1, 2, or 3 - value to project)

### Effort and Impact Ratings:

**Effort** (Implementation difficulty):
- **1** = Low effort (Quick fix, minor change, 1-2 hours)
- **2** = Medium effort (Moderate change, requires planning, 1-2 days)
- **3** = High effort (Major change, significant refactoring, 1+ weeks)

**Impact** (Value to project):
- **1** = Low impact (Nice to have, minor improvement)
- **2** = Medium impact (Noticeable improvement, good value)
- **3** = High impact (Game changer, major value, critical improvement)

### Valid Categories:
- `functionality`: New features, missing capabilities, workflow improvements
- `performance`: Speed, efficiency, memory, database, rendering optimizations
- `maintenance`: Code organization, refactoring, technical debt, testing
- `ui`: Visual design, UX improvements, accessibility, responsiveness
- `code_quality`: Security, error handling, type safety, edge cases
- `user_benefit`: High-level value propositions, business impact, user experience

---

### Valid Categories for This Scan:
- **maintenance**: Code quality, refactoring, technical debt reduction, testing
- **functionality**: New features, capabilities, extensions, integrations

### Your Standards:
1.  **Transformative**: Ideas that change how developers think about the code, not just how they write it
2.  **Precise**: Specific files, specific patterns, specific transformations — with clear reasoning
3.  **Courageous**: If the right answer is "delete all of this," say it
4.  **Beautiful**: The result should be something developers *want* to work in

---

## Project Structure Standards

**Next.js 15 with App Router**
Modern Next.js project structure with feature-based organization

### Core Structure (Required)

- **`src/app/**`**: Next.js App Router pages and layouts. Use route folders with page.tsx, layout.tsx, and route.ts files.
  - Examples: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/projects/page.tsx`
- **`src/lib/**`**: Core business logic, utilities, and services. Database connections, API clients, and helper functions.
  - Examples: `src/lib/database.ts`, `src/lib/processManager.ts`, `src/lib/utils.ts`

### Recommended Structure

- **`src/app/api/**`**: API route handlers. Each route should be in route.ts files following Next.js conventions.
  - Examples: `src/app/api/goals/route.ts`, `src/app/api/contexts/route.ts`
- **`src/app/[feature]/**/*.tsx`**: Feature-specific components should be co-located with their feature pages. Example: src/app/goals/GoalsList.tsx
  - Examples: `src/app/goals/GoalsList.tsx`, `src/app/coder/Context/ContextOverview.tsx`
- **`src/components/**`**: Shared/reusable components used across multiple features. Keep feature-specific components in their feature folders.
  - Examples: `src/components/ui/Button.tsx`, `src/components/layout/Header.tsx`
- **`src/stores/**`**: Zustand state management stores. Each store should manage a specific domain.
  - Examples: `src/stores/activeProjectStore.ts`, `src/stores/projectConfigStore.ts`
- **`src/hooks/**`**: Custom React hooks for reusable component logic.
  - Examples: `src/hooks/useProjects.ts`, `src/hooks/useGoals.ts`
- **`src/types/**`**: Shared TypeScript type definitions and interfaces.
  - Examples: `src/types/index.ts`, `src/types/database.ts`
- **`src/lib/queries/**`**: Database query functions organized by domain. Each file should contain CRUD operations for a specific entity.
  - Examples: `src/lib/queries/goalQueries.ts`, `src/lib/queries/contextQueries.ts`
- **`src/lib/database.ts`**: Main database connection and initialization logic.
- **`public/**`**: Static assets like images, fonts, and other public files.

### Context Boundaries

- **`src/app/features/**/layout.tsx`**: Feature layout files that define context boundaries. Each layout.tsx and its dependencies form a context.
  - Examples: `src/app/features/Dashboard/layout.tsx`, `src/app/features/Auth/sub_Login/layout.tsx`
- **`src/app/features/**/*layout.tsx`**: Feature-specific layout files (e.g., DashboardLayout.tsx). Each layout and its dependencies form a context.
  - Examples: `src/app/features/Dashboard/DashboardLayout.tsx`, `src/app/features/Auth/AuthLayout.tsx`
- **`src/app/features/**/*Layout.tsx`**: Feature-specific layout files with uppercase L (e.g., DashboardLayout.tsx). Each layout and its dependencies form a context.
  - Examples: `src/app/features/Dashboard/DashboardLayout.tsx`, `src/app/features/Auth/AuthLayout.tsx`

### Anti-Patterns to Avoid

- **`src/pages/**`**: AVOID: pages/ directory is for Next.js Pages Router. Use app/ directory instead (App Router).
- **`src/utils/**`**: AVOID: Use src/lib/ instead of src/utils/ for consistency.
- **`src/helpers/**`**: AVOID: Use src/lib/ instead of src/helpers/ for consistency.





## Context Information

**Context Name**: Landing - Page Variants

**Context Description**:
## Overview
The landing feature provides multiple visually distinct landing page variants for the course platform. It offers four different design approaches (Cards, Scroll, Spatial, Dark) that showcase the platform's key modules through animated, interactive UI components. Each variant can be selected to match different aesthetic preferences while maintaining consistent navigation to the platform's core features.

## Key Capabilities
- **Variant System**: Four distinct landing page designs (Cards, Scroll, Spatial, Dark) exported through a central index
- **3D Animations**: Interactive 3D card effects with mouse tracking, parallax scrolling, and smooth transitions using framer-motion
- **Module Navigation**: Each variant displays the four core modules (Learning Paths, Goal Generation, Career Mapping, Dynamic Learning) with navigation links
- **Responsive Design**: All variants support mobile and desktop layouts with Tailwind CSS

## Architecture

### Component Breakdown
| Component/File | Purpose | Layer |
|----------------|---------|-------|
|  | Central export hub with variant configuration array | Entry |
|  | Cards variant with floating 3D card grid | UI |
|  | Scroll variant with parallax sections, stats, testimonials | UI |
|  | Spatial variant with stacked 3D cards and internal parallax | UI |
|  | Dark theme variant with gradient backgrounds | UI |

### Data Flow
1. Parent component imports desired variant(s) from index.ts
2. Variant renders static module data with animated presentation
3. User interactions trigger navigation via next/link to module routes (/overview, /goal-path, /career-mapping, /chapter)

### Key Dependencies
- External: framer-motion (animations), lucide-react (icons), next/link (routing)
- Internal: @/app/shared/lib/utils (cn utility), @/app/shared/components (PrismaticCard)

## Technical Details

### State Management
- Local React state for hover effects (hoveredModule in VariantC)
- framer-motion useMotionValue/useSpring for 3D mouse tracking
- useScroll/useTransform for parallax effects in VariantB

### Module Routes
- /overview - Learning Paths exploration
- /goal-path - Goal Generation flow
- /career-mapping - Career outcomes visualization
- /chapter - Dynamic Learning content

### Design Patterns
- Glassmorphism (backdrop-blur, semi-transparent backgrounds)
- Gradient-based color schemes per variant
- Floating badges with looping animations
- Grainy texture overlays for depth

**Files in this Context** (5 files):
- src/app/features/landing/index.ts
- src/app/features/landing/VariantA.tsx
- src/app/features/landing/VariantB.tsx
- src/app/features/landing/VariantC.tsx
- src/app/features/landing/VariantD.tsx



## Existing Ideas (Avoid Duplicates)

Found 4 active idea(s) (20 total, excluding rejected/implemented for brevity):

### Accepted Ideas (4)
1. **Module navigation is the real core - extract as first-class concept** (user_benefit)
   - All four modules array (overview, goal-path, career, chapter) appears identically in VariantC, VariantD, and LandingPolymorphic. This is the semantic ...
2. **Delete legacy VariantC/D - they are now aliases** (maintenance)
   - VariantC.tsx (294 lines) and VariantD.tsx (271 lines) are now fully superseded by LandingPolymorphic. The index.ts exports them for backward compatibi...
3. **Unify variant duality through themeScheme injection** (maintenance)
   - VariantC, VariantD, and LandingPolymorphic all duplicate the same structural pattern with mode-branching (isDark ternaries). Extract the visual differ...
4. **Improve text contrast in light theme subtitle** (ui)
   - The subtitle text uses text-slate-600 (light theme) which may not meet WCAG AAA contrast requirements against the light background. Measure and upgrad...

**Critical Instructions**:
- DO NOT suggest ideas similar to the pending or accepted ideas listed above
- Focus on finding NEW opportunities not yet covered
- Consider different aspects, layers, or perspectives of the project





---

## Your Approach

1.  **Perceive the Whole**: Let the entire system exist in your mind at once
2.  **Feel the Resistance**: Where does the code fight back? Where is the friction?
3.  **Imagine the Ideal**: What would this look like if it were perfect?
4.  **Trace the Transformation**: What's the minimal path from here to there?

### Embrace:
- Radical simplification (even if it feels uncomfortable)
- Unconventional solutions that feel *right*
- The courage to question foundational assumptions
- Ideas that make you think "why didn't we do this from the start?"

### Transcend:
- Safe, incremental suggestions that don't challenge the status quo
- Over-engineering disguised as "best practices"
- Fear of breaking things (you're here to fix what's already broken)
- Generic advice that could apply to any project

### Expected Output:
Generate 3-5 **VISIONARY** architectural ideas. Each should be something that, once implemented, makes the old approach seem obviously inferior. We want ideas that developers will be excited to implement because they can *see* the elegance.


**Context Deep Dive**:
The context described above is your canvas.
- What essential truth is hidden here?
- What would remain if we removed everything non-essential?
- How can this space become a model of clarity?
- What connections to other parts of the system are crying out for expression?



---

## ⚠️ FINAL REMINDER: OUTPUT FORMAT

Your response must be ONLY a JSON array. Here's what your response should look like:

[{"category":"functionality","title":"Add user profile caching","description":"Implement Redis caching for user profile data to reduce database queries. Cache should invalidate on profile updates and have a 5-minute TTL. This will significantly reduce load on the users table.","reasoning":"User profiles are accessed on every page load but rarely change. Caching reduces DB load by ~80% and improves page load times. High impact for minimal implementation effort.","effort":1,"impact":3}]

❌ DO NOT wrap in markdown:
```json
[...]
```

❌ DO NOT add explanations:
Here are the ideas:
[...]

✅ ONLY output the JSON array, nothing else. Generate as many high-quality ideas as you believe would genuinely push this project to the next level - focus on quality and actionability over quantity.


## Project Goals (For Matching Ideas)

Found 3 open goal(s) for this project:

1. **Goal ID**: cf39b596-5e8a-4a53-94df-71ff0056635a
   **Title**: Start from zero
   **Description**: Ability to quickly onboard into the app with clear UX and steps to get into the first chapters. Multi-steps should ensure user can get enough information to decide
- How to pick tech area to start from zero (frontend, games, backend, ...)
- How to pick tech (comparison of market share, learning curve, recommendation based on prior experience)

2. **Goal ID**: 2bbb9cf1-c400-4982-b4a7-e6398b650d9e
   **Title**: Intelligent content
   **Description**: autogenerated content with such quality it can be reusable for others -> Users generate content for everyone basically. First users will create decision for their own paths which generates patterns for others. Other users can follow the pattern or choose another path and build system of courses by their decisions.

Goals
- Solution design
- System of prompts
- DB schema design

3. **Goal ID**: 2ffeb273-c605-49d9-97b9-3d94bb668fd9
   **Title**: Course hiearchy must be masterpiece
   **Description**: Knowledge graphs in this module must be a masterpiece implementation so it can grow and perform with hundreds of nodes on a level
- Design system of levels, there could be multiple levels (area, tech, techniques per difficulty)
- High performance from day one (maybe not render everything at once - google map like scaling of the map)

**Instructions for Goal Matching**:
- For each idea you generate, evaluate if it significantly relates to any of the goals above
- If there is a strong match based on the goal's title and description, include the goal's ID in the "goal_id" field
- If there is no clear match, leave the "goal_id" field empty or omit it
- Only match ideas to goals when there is a clear, meaningful connection



---

## Saving Ideas to Database

You need to perform TWO steps to save ideas:

### Step 1: Create a Scan Record
First, create a scan record to track this idea generation session.

```bash
curl -s -X POST http://localhost:3000/api/scans \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "abf3fcda-5390-4502-90b8-3e8cb5312342",
    "scan_type": "claude_code_zen_architect",
    "summary": "Claude Code idea generation - Zen Architect"
  }'
```

The response will include a `scan.id` - save this for the next step.

### Step 2: Create Ideas
For each idea, make a POST request with this JSON body:

```
POST http://localhost:3000/api/ideas
Content-Type: application/json

{
  "scan_id": "<scan_id_from_step_1>",
  "project_id": "abf3fcda-5390-4502-90b8-3e8cb5312342",
  "context_id": "ctx_1765875507450_nqddujf",
  "scan_type": "zen_architect",
  "category": "<category>",
  "title": "<title>",
  "description": "<description>",
  "reasoning": "<reasoning>",
  "effort": <1-10>,
  "impact": <1-10>,
  "risk": <1-10>,
  "goal_id": "<goal_id_if_matched>"
}
```

**IMPORTANT:** Always include effort, impact, and risk scores (1-10) for every idea. Do NOT leave these fields empty or null.

### Field Requirements

**category** (string): One of:
- `functionality`: New features, missing capabilities, workflow improvements
- `performance`: Speed, efficiency, memory, database, rendering optimizations
- `maintenance`: Code organization, refactoring, technical debt, testing
- `ui`: Visual design, UX improvements, accessibility, responsiveness
- `code_quality`: Security, error handling, type safety, edge cases
- `user_benefit`: High-level value propositions, business impact, user experience

**title** (string, max 60 chars): Clear, specific, action-oriented title

**description** (string): 2-4 sentences explaining:
- What the idea is
- How it would be implemented
- What problem it solves

**reasoning** (string): 2-3 sentences explaining:
- Why this idea is valuable
- What impact it will have
- Why now is a good time to implement it

**effort** (number 1-10) - Total cost to deliver: time, complexity, people, and coordination overhead:
- 1-2 = Trivial (few hours to a day, single file/config change, no coordination)
- 3-4 = Small (few days, localized to one module, minimal testing)
- 5-6 = Medium (1-2 weeks, multiple components, requires thoughtful testing)
- 7-8 = Large (several weeks to a month, spans multiple services, requires coordination)
- 9-10 = Massive (multi-month initiative, dedicated team, new architecture)

**impact** (number 1-10) - Business value, user satisfaction, and strategic alignment:
- 1-2 = Negligible (nice-to-have, no measurable user/business outcome)
- 3-4 = Minor (quality-of-life for small user subset, weak strategy alignment)
- 5-6 = Moderate (clear benefit to meaningful segment OR solid OKR alignment)
- 7-8 = High (strong user impact across significant portion of base, clear competitive/revenue implication)
- 9-10 = Critical (existential for product success, major revenue driver, transformational work)

**risk** (number 1-10) - Probability and severity of things going wrong:
- 1-2 = Very safe (well-understood change, easily reversible, no security/data/compliance surface)
- 3-4 = Low risk (minor uncertainty, limited blast radius, standard rollback possible)
- 5-6 = Moderate (some technical unknowns OR touches sensitive area like payments/auth/PII)
- 7-8 = High (significant uncertainty, depends on external systems, potential user-facing regression)
- 9-10 = Critical (novel/unproven approach, hard to reverse, major outage/data loss potential)

**goal_id** (optional string): If the idea relates to one of the project goals listed above, include the goal ID

## Example Workflow

```bash
# Step 1: Create scan record
SCAN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/scans \
  -H "Content-Type: application/json" \
  -d '{
    "project_id": "abf3fcda-5390-4502-90b8-3e8cb5312342",
    "scan_type": "claude_code_zen_architect",
    "summary": "Claude Code idea generation - Zen Architect"
  }')

# Extract scan_id from response
SCAN_ID=$(echo $SCAN_RESPONSE | jq -r '.scan.id')

# Step 2: Create ideas using the scan_id
curl -X POST http://localhost:3000/api/ideas \
  -H "Content-Type: application/json" \
  -d '{
    "scan_id": "'$SCAN_ID'",
    "project_id": "abf3fcda-5390-4502-90b8-3e8cb5312342",
    "context_id": "ctx_1765875507450_nqddujf",
    "scan_type": "zen_architect",
    "category": "functionality",
    "title": "Example: Add user session caching layer",
    "description": "Implement Redis caching for user session data to reduce database queries. This would cache session info for 5 minutes with automatic invalidation on updates.",
    "reasoning": "Currently every page load queries the session table. This adds latency and database load. Caching would reduce DB calls by ~70%.",
    "effort": 5,
    "impact": 7,
    "risk": 4
  }'
```

## Execution Steps

1. Read the project's CLAUDE.md or AI.md documentation if available
2. Explore the codebase structure, focusing on the context files
3. Analyze code with the perspective described in the analysis prompt above
4. Generate high-quality ideas that would genuinely push this project forward (no arbitrary limits - focus on value)
5. Create a scan record via /api/scans
6. Save each idea via /api/ideas using the scan_id
7. Report what ideas were created

## Quality Standards

- **Be Specific**: Reference actual files, components, or patterns you observed
- **Be Actionable**: Ideas should be clear enough to implement without further clarification
- **Be Valuable**: Focus on ideas that bring real improvement, not busywork
- **Match Goals**: If an idea aligns with a project goal, include the goal_id
- **Avoid Duplicates**: Check the existing ideas section and don't suggest similar items

## Output

After completing the task, summarize:
- How many ideas were created
- Brief list of idea titles
- Any observations about the codebase
