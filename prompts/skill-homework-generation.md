# Skill: Homework Generation for Real-World Projects

This skill guides Claude Code through the process of breaking down a real-world project feature into granular, lesson-aligned homework assignments.

## Overview

**When to use**: When you need to create homework assignments from a real-world SaaS clone project that map to the frontend curriculum.

**Inputs required**:
1. Target feature/module description (e.g., "HubSpot landing page")
2. Reference website or design to analyze
3. Project repository (e.g., `open-forge-courses/open-hub`)

**Outputs produced**:
1. Feature breakdown document (markdown)
2. Homework definitions seeded to database
3. Lesson mappings for each homework

---

## Step 1: Analyze the Target Feature

Use WebFetch to analyze the reference website and understand its structure.

```
WebFetch: https://example.com
Prompt: Analyze the landing page structure. List all major UI sections/components visible:
hero section, navigation, feature cards, testimonials, pricing, CTAs, footer, etc.
For each section describe: the layout pattern used, interactive elements, and visual hierarchy.
```

**What to capture**:
- Major UI sections (nav, hero, features, testimonials, footer, etc.)
- Layout patterns (flexbox, grid, centered, multi-column)
- Interactive elements (dropdowns, tabs, carousels, modals)
- Visual hierarchy (typography, color system, spacing)

---

## Step 2: Get the Curriculum Lessons

Query the database for available lessons to map against.

```typescript
// Get all lessons with their parent hierarchy
const { data: lessons } = await supabase
    .from("map_nodes")
    .select(`id, slug, name, difficulty, parent:parent_id (name, slug)`)
    .eq("depth", 4)
    .order("slug");
```

**Key lesson categories for UI work**:
- **CSS Layout**: `flexbox-container-basics`, `grid-container-setup`, `justify-content-align-items`
- **Responsive**: `mobile-first-design`, `media-queries-basics`, `responsive-design-tailwind`
- **Tailwind**: `tailwind-navigation`, `tailwind-buttons`, `tailwind-cards`
- **React**: `functional-components`, `passing-props`, `usestate-hook`
- **Animation**: `keyframes-rule`, `motion-component`, `animate-prop`

---

## Step 3: Apply the DECOMPOSE Framework

### D - Define the Target Feature
Document the complete feature:
- Feature name and description
- Core functionality list
- User interactions
- Data requirements

### E - Extract Visual Components
List all UI elements:
- Layout containers
- Interactive elements
- Content sections
- Responsive variations

### C - Categorize by Skill Domain
Map each component to curriculum skills:
| Component | Primary Skill | Secondary Skills |
|-----------|--------------|------------------|
| Navigation | Tailwind Patterns | Flexbox, Responsive |
| Hero | Flexbox Layout | Tailwind, Buttons |
| Grid | CSS Grid | Components, Responsive |

### O - Order by Dependencies
Sequence tasks:
1. Static structure (HTML/CSS)
2. Component extraction (React)
3. Interactivity (hooks, state)
4. Data integration (API)
5. Polish (animations)

### M - Map to Lessons
For each homework, identify:
- Primary lesson (is_primary: true, relevance: 0.9+)
- Secondary lessons (relevance: 0.6-0.85)
- Add context explaining how the lesson applies

### P - Prepare Acceptance Criteria
Each homework needs 4-6 criteria with weights totaling 100:
```typescript
acceptance_criteria: [
    { id: "layout", description: "...", weight: 25 },
    { id: "responsive", description: "...", weight: 25 },
    { id: "styling", description: "...", weight: 20 },
    { id: "semantic", description: "...", weight: 15 },
    { id: "accessibility", description: "...", weight: 15 }
]
```

### O - Optimize for Independence
Ensure each homework:
- Has clear file scope (no overlapping files)
- Provides mock data (no backend dependencies)
- Can be completed in isolation
- Has starter code path

### S - Size Appropriately
| Difficulty | Hours | XP | Concepts |
|-----------|-------|-----|----------|
| beginner | 1-1.5 | 50 | 1-2 |
| intermediate | 2-2.5 | 100 | 2-4 |
| advanced | 3-4 | 150 | 3+ |

### E - Estimate and Tag
Complete the definition with:
- difficulty, estimated_hours, xp_reward
- branch_prefix (e.g., "feat/landing-hero")
- file_scope array
- 3 progressive hints

---

## Step 4: Create the Seed Script

Structure the seeding script:

```typescript
// 1. Define project repository
const PROJECT_REPO = {
    name: "ProjectName",
    owner: "org-name",
    source_repo_url: "https://github.com/...",
    default_branch: "main",
    primary_language: "TypeScript",
    framework: "nextjs",
    difficulty_tier: "intermediate",
    readme_summary: "Description...",
    status: "ready"
};

// 2. Define feature
const FEATURE = {
    name: "Feature Name",
    slug: "feature-slug",
    description: "...",
    complexity_score: 5,  // 1-10
    difficulty: "intermediate",
    status: "approved",
    estimated_hours: 25
};

// 3. Define homeworks array
const HOMEWORKS: HomeworkDef[] = [
    {
        name: "Homework Name",
        slug: "homework-slug",
        homework_type: "implementation",
        difficulty: "beginner",
        estimated_hours: 1.5,
        xp_reward: 50,
        description: "...",
        instructions: "...",
        acceptance_criteria: [...],
        hints: [...],
        file_scope: [...],
        branch_prefix: "feat/...",
        lessons: [
            { slug: "lesson-slug", relevance: 0.95, is_primary: true, context: "..." }
        ]
    }
];
```

---

## Step 5: Execute and Verify

Run the seed script:
```bash
npx tsx scripts/seed-[feature]-homeworks.ts
```

Verify with:
```typescript
// Check homework count
const { count } = await supabase
    .from("project_homework_definitions")
    .select("*", { count: "exact", head: true })
    .eq("feature_id", featureId);

// Check lesson mappings
const { count: mappings } = await supabase
    .from("homework_lesson_mappings")
    .select("*", { count: "exact", head: true });
```

---

## Scope Isolation Rules

To prevent homework overlap:

1. **Component Boundaries**: Each homework owns specific components
   - ✅ "Build HeroSection"
   - ❌ "Build the landing page"

2. **File Ownership**: Each homework lists its files explicitly
   - ✅ Clear file_scope with required/optional flags
   - ❌ Modify shared files without explicit scope

3. **Style Isolation**: Use component-scoped styles
   - ✅ Tailwind classes or CSS modules
   - ❌ Modify global CSS for one homework

4. **State Boundaries**: Isolate state per homework
   - ✅ "Add form component" + "Connect to global store" (separate)
   - ❌ "Add form with global state"

5. **Mock Data First**: Don't require backend for UI homework
   - ✅ "Display product grid with mock data"
   - ❌ "Fetch and display products"

---

## Quality Checklist

Before finalizing:

- [ ] Each homework maps to 3-5 curriculum lessons
- [ ] Primary lesson has relevance ≥ 0.9
- [ ] Can be completed in 1-4 hours
- [ ] Has 4-6 testable acceptance criteria with weights = 100
- [ ] File scope is explicit and non-overlapping
- [ ] No blocking dependencies on other homeworks
- [ ] Branch naming convention defined
- [ ] 3 hints: simple tip, specific guidance, code example
- [ ] XP reward matches difficulty (50/100/150)

---

## Example Output

From the HubSpot Landing Page breakdown:

| # | Homework | Difficulty | Hours | XP | Lessons |
|---|----------|------------|-------|-----|---------|
| 1 | Navigation Bar - Static | beginner | 1.5 | 50 | 4 |
| 2 | Hero Section - Layout | beginner | 1.5 | 50 | 4 |
| 3 | Hero Section - Responsive | beginner | 1 | 50 | 4 |
| 4 | Footer - Grid Layout | intermediate | 2 | 100 | 5 |
| 5 | Product Card Component | beginner | 1.5 | 50 | 4 |
| 6 | Product Grid Section | intermediate | 2 | 100 | 5 |
| 7 | Logo Row - Static | beginner | 1 | 50 | 4 |
| 8 | Logo Carousel - Animated | intermediate | 2 | 100 | 4 |
| 9 | Testimonial Card | beginner | 1.5 | 50 | 4 |
| 10 | Testimonials Tabs | intermediate | 2.5 | 100 | 4 |
| 11 | Navigation Dropdown | intermediate | 2 | 100 | 5 |
| 12 | Mobile Navigation | intermediate | 2 | 100 | 5 |
| 13 | Hero Text Animation | intermediate | 2 | 100 | 5 |
| 14 | Awards Badge Grid | beginner | 1 | 50 | 4 |
| 15 | CTA Section | beginner | 1 | 50 | 5 |

**Totals**: 15 homeworks, 23 hours, 1100 XP, 66 lesson mappings

---

## Database Schema Reference

### Tables Used

1. **project_repositories** - The project being cloned
2. **project_features** - Feature/module within the project
3. **project_homework_definitions** - Individual homework assignments
4. **homework_lesson_mappings** - Junction table linking homework to lessons

### Key Columns

**project_homework_definitions**:
- `feature_id` - Parent feature
- `primary_lesson_id` - Main lesson this homework teaches
- `homework_type` - implementation, ui_design, responsive, etc.
- `acceptance_criteria` - JSONB array with id, description, weight
- `hints` - JSONB array with level (1-3), content, xp_cost
- `file_scope` - JSONB array with path, purpose, required

**homework_lesson_mappings**:
- `homework_definition_id` - The homework
- `lesson_node_id` - The lesson (from map_nodes)
- `relevance_score` - 0.0-1.0 how relevant
- `is_primary` - If this is the main lesson
- `lesson_context` - How the lesson applies

---

## Files Reference

| File | Purpose |
|------|---------|
| `prompts/homework-breakdown.md` | DECOMPOSE methodology documentation |
| `prompts/hubspot-landing-breakdown.md` | Example breakdown for HubSpot landing page |
| `scripts/seed-landing-homeworks.ts` | Seed script for landing page homeworks |
| `scripts/list-lessons.ts` | Query all curriculum lessons |
| `scripts/check-tables.ts` | Verify required tables exist |
| `supabase/migrations/018_homework_lesson_mapping.sql` | Lesson mapping schema |
