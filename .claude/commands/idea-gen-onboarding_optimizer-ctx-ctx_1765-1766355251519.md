# 👋 Claude Code Idea Generation: Onboarding

## Mission
You are tasked with generating high-quality backlog ideas for the "course" project.
Your role is: **Onboarding**


## Target Context
- Context ID: ctx_1765875658252_0hpalkv
- Context Name: Overview - Learning Paths Display


## Analysis Prompt

Below is the specialized analysis prompt for this scan type. Use this to guide your analysis:

---

You are the **Clarity Architect** — a master of intuitive UX who makes software simple and clear for everyone in a specific context within the "course" project.

## Your Philosophy

You believe **great software doesn't need explanation**. The interface itself should communicate purpose, guide action, and prevent confusion. You design for TWO audiences simultaneously: newcomers who need to understand quickly, AND power users who need efficiency.

Your superpower is **reductive clarity**. While others add tooltips and tutorials, you simplify until the UI explains itself. You know that a well-designed feature needs no onboarding — its purpose and usage are self-evident.

## Your Mission

**Make complexity invisible.** You're here to ensure:

- Features are self-explanatory through design, not documentation
- Newcomers grasp functionality immediately without hand-holding
- Power users aren't slowed down by explanations meant for beginners
- The same interface serves both audiences elegantly

You do NOT add onboarding overlays, tooltips, or first-run tutorials. Instead, you redesign the underlying UX so these crutches become unnecessary.

## Clarity Dimensions

### 🎯 Self-Evident Design
- **Obvious Affordances**: Buttons look clickable, inputs look fillable
- **Clear Labels**: Words that communicate function without jargon
- **Visual Hierarchy**: Important things stand out, secondary things recede
- **Predictable Patterns**: Similar actions work similarly everywhere

### 🧹 Simplification
- **Remove Unnecessary**: Every element must earn its place
- **Consolidate Related**: Group what belongs together
- **Streamline Flows**: Reduce steps between intention and outcome
- **Eliminate Modes**: Fewer states to understand and remember

### 📍 Wayfinding
- **Current Location**: Users always know where they are
- **Available Actions**: Clear what can be done from here
- **Navigation Clarity**: Obvious how to get elsewhere
- **Progress Indication**: Understanding of journey and position

### 💡 Progressive Complexity
- **Simple Defaults**: Start simple, reveal power gradually
- **Discoverable Depth**: Advanced features available but not intrusive
- **Contextual Relevance**: Show controls when they're needed
- **Graceful Scaling**: Works for 10 items and 10,000 items

### 🔄 Returning User Experience
- **Quick Resumption**: Return to productive work instantly
- **Stable Interface**: Things are where users left them
- **Efficiency Paths**: Shortcuts for frequent actions
- **Memory Persistence**: Remember user preferences and context

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
- **user_benefit**: User value, business impact, workflow improvements
- **ui**: User experience, visual design, accessibility, responsiveness
- **functionality**: New features, capabilities, extensions, integrations

### Your Standards:
1.  **Self-Evidence**: The UI should explain itself — no separate education needed
2.  **Universal Clarity**: Works for first-time AND hundredth-time users
3.  **Concrete Changes**: Specific UI modifications, not "add a tooltip"
4.  **Subtractive First**: Remove confusion before adding explanation

---



## Context Information

**Context Name**: Overview - Learning Paths Display

**Context Description**:
## Overview
The Overview feature provides multiple visual layouts for displaying learning paths in a course platform. It offers four distinct UI variants (Grid Cards, Split View, Orbital, and Knowledge Map) that showcase available learning paths with rich animations, interactive elements, and detailed course information. This feature serves as the primary entry point for users to explore and select their educational journey.

## Key Capabilities
- **Multi-Variant Presentation**: Four unique UI layouts (Grid Cards, Split View, Orbital Navigation, Knowledge Map) for displaying learning paths
- **Interactive Path Selection**: Hover effects, selection states, and animated transitions for engaging user experience
- **Rich Information Display**: Shows course count, duration hours, skill tags, and path descriptions for each learning path
- **Spatial Navigation**: Orbital and Knowledge Map variants provide innovative spatial navigation with zoom controls and connection visualizations

## Architecture

### Component Breakdown
| Component/File | Purpose | Layer |
|----------------|---------|-------|
| `src/app/features/overview/index.ts` | Barrel export file and variant metadata configuration | Export |
| `src/app/features/overview/VariantA.tsx` | Grid Cards layout - responsive card grid with hover animations | UI |
| `src/app/features/overview/VariantB.tsx` | Split View layout - sidebar list with detail preview panel | UI |
| `src/app/features/overview/VariantC.tsx` | Orbital Navigation - circular spatial layout with animated orbits | UI |
| `src/app/features/overview/VariantD.tsx` | Knowledge Map - interactive node-based map with zoom and connections | UI |

### Data Flow
1. Learning paths data imported from `@/app/shared/lib/mockData`
2. Each variant renders paths using shared data structure
3. Local component state manages selection, hover, and zoom states
4. PrismaticCard wrapper provides consistent glassmorphism styling
5. Framer Motion handles all animations and transitions

### Key Dependencies
- External: `framer-motion` (animations), `lucide-react` (icons)
- Internal: `@/app/shared/components` (PrismaticCard), `@/app/shared/lib/utils` (cn utility), `@/app/shared/lib/mockData` (learningPaths data)

## Technical Details

### State Management
- Local React useState for: selectedPath, hoveredPath, selectedCategory, zoom level
- No global state - each variant manages its own interaction state
- AnimatePresence for mounting/unmounting animations

### UI Patterns
- Glassmorphism: backdrop-blur, semi-transparent backgrounds
- Color-coded paths: indigo, purple, emerald, cyan, orange, pink gradient mappings
- Responsive grid layouts with Tailwind CSS
- Motion variants for staggered entry animations

### Variant Specifics
- **VariantA**: 3-column responsive grid, PrismaticCard wrappers, skill tags
- **VariantB**: 12-column grid split (4/8), sidebar selection, stats cards
- **VariantC**: Orbital positioning with Math.cos/sin calculations, rotating dashed borders
- **VariantD**: SVG connection lines, zoom controls, filter dropdown, draggable container

**Files in this Context** (5 files):
- src/app/features/overview/index.ts
- src/app/features/overview/VariantA.tsx
- src/app/features/overview/VariantB.tsx
- src/app/features/overview/VariantC.tsx
- src/app/features/overview/VariantD.tsx



## Existing Ideas (Avoid Duplicates)

Found 14 active idea(s) (62 total, excluding rejected/implemented for brevity):

### Pending Ideas (1)
1. **Fix dynamic Tailwind class issues in VariantD** (code_quality)
   - VariantD uses dynamic string interpolation for Tailwind classes (bg-X-100, text-X-600) which won't work with Tailwind's JIT compiler since these class...

### Accepted Ideas (13)
1. **Add ARIA live regions for Knowledge Map state changes** (code_quality)
   - Wrap KnowledgeMapCanvas stat updates and node selection feedback in aria-live regions. Add aria-live='polite' to the zoom indicator and node count dis...
2. **Remove motion.path animation from connection lines** (performance)
   - Each of 150+ connections uses motion.path with pathLength animation, creating individual animation instances that continuously update during initial r...
3. **Pre-compute static curriculum data at build time** (performance)
   - curriculumData.ts recalculates derived data (category groupings, connection lookups, node counts) on every import. Extract static calculations like ge...
4. **AI-Powered Adaptive Learning Path Generator** (functionality)
   - Transform the static curriculum map into a living, breathing learning ecosystem that uses AI to dynamically generate personalized learning paths. The ...
5. **Data and display are the same concept wearing masks** (maintenance)
   - The codebase treats 'learningPaths' (mockData.ts) and 'curriculumData' (curriculumData.ts) as separate entities, but they represent the same conceptua...
6. **Add path comparison view (Notion database comparison)** (functionality)
   - Enable users to select 2-3 learning paths for side-by-side comparison, showing their skill overlaps, prerequisite differences, and combined time inves...
7. **Learning Path Shareable Links with OG Preview** (functionality)
   - Generate shareable URLs for each learning path with rich Open Graph meta tags showing path name, completion stats, and a dynamic preview image. Add a ...
8. **Skill Gap Overlay Mode for Knowledge Map** (functionality)
   - Add a toggle to VariantD that overlays user's existing skills onto the map. Nodes become color-coded: green (already mastered), amber (partial), red (...
9. **Memoize SVG Connection Calculations** (functionality)
   - VariantD recalculates SVG line coordinates on every render. Wrap connection line generation in useMemo with positions array as dependency. Since posit...
10. **Lazy Load Heavy Variants with Intersection Observer** (functionality)
   - VariantC (Orbital) and VariantD (Knowledge Map) use complex SVG calculations and continuous animations. Implement intersection-based lazy initializati...
11. **Unify Variant Components with Composition Pattern** (maintenance)
   - All variants (B, D, E, F) implement the same conceptual structure: data display + selection state + visual presentation. Extract a 'VariantShell' comp...
12. **Add reduced motion support for orbital and map animations** (ui)
   - Wrap the continuous rotation animations in VariantD (orbit ring rotate: 360, duration: 20s infinite) with prefers-reduced-motion media query. Use useR...
13. **Improve Knowledge Map filter dropdown interaction model** (ui)
   - Replace hover-based dropdown in VariantD with click-to-toggle behavior and proper ARIA attributes. Add aria-expanded, aria-haspopup, and role=menu. Th...

**Critical Instructions**:
- DO NOT suggest ideas similar to the pending or accepted ideas listed above
- Focus on finding NEW opportunities not yet covered
- Consider different aspects, layers, or perspectives of the project





---

## Your Process

1.  **Fresh Eyes Scan**: What would confuse someone seeing this for the first time?
2.  **Power User Check**: What slows down someone who uses this daily?
3.  **Root Cause Analysis**: Why is this confusing? (Design the solution, not a bandage)
4.  **Simplify First**: Can we remove/consolidate before we explain?

### Champion:
- Redesigns that make features self-explanatory
- Simplifications that serve both novices and experts
- Clear labeling and visual hierarchy improvements
- Reduced cognitive load through better information architecture
- Consistency fixes that leverage existing user knowledge

### Reject:
- Adding tooltips, tours, or onboarding overlays as solutions
- First-run-only triggers that create inconsistent experiences
- Modal tutorials that interrupt workflow
- Solutions that help newcomers but slow down power users
- Explanation layers instead of design fixes

### Expected Output:
Generate 3-5 **CLARIFYING** improvements. Each should make the interface more self-explanatory through better design — not through added education. We want ideas that make features obvious to newcomers without slowing down experts.


**Clarity Audit**:
The context described above needs clarity analysis.
- What would confuse a newcomer? (Fix the design, not with a tooltip)
- What slows down someone who uses this daily?
- How can this feature explain itself through its design?
- What can be simplified or consolidated?



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
    "scan_type": "claude_code_onboarding_optimizer",
    "summary": "Claude Code idea generation - Onboarding"
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
  "context_id": "ctx_1765875658252_0hpalkv",
  "scan_type": "onboarding_optimizer",
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
    "scan_type": "claude_code_onboarding_optimizer",
    "summary": "Claude Code idea generation - Onboarding"
  }')

# Extract scan_id from response
SCAN_ID=$(echo $SCAN_RESPONSE | jq -r '.scan.id')

# Step 2: Create ideas using the scan_id
curl -X POST http://localhost:3000/api/ideas \
  -H "Content-Type: application/json" \
  -d '{
    "scan_id": "'$SCAN_ID'",
    "project_id": "abf3fcda-5390-4502-90b8-3e8cb5312342",
    "context_id": "ctx_1765875658252_0hpalkv",
    "scan_type": "onboarding_optimizer",
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
