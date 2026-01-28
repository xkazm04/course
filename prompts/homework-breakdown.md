# Homework Breakdown Methodology

This document defines the process for decomposing a real-world project into granular, lesson-aligned homework assignments.

## Overview

**Goal:** Transform a target application (e.g., HubSpot clone) into discrete homework tasks that:
1. Map directly to curriculum lessons
2. Have clear, non-overlapping scope
3. Build incrementally toward the complete feature
4. Are achievable independently (no blocking dependencies)

## The DECOMPOSE Framework

### D - Define the Target Feature
Identify the complete feature/module to break down:
- Screenshot or wireframe
- Core functionality list
- User interactions
- Data requirements

### E - Extract Visual Components
List all visible UI elements:
- Layout containers
- Interactive elements (buttons, forms, inputs)
- Content sections
- Navigation elements
- Responsive variations

### C - Categorize by Skill Domain
Map components to curriculum topics:
- **HTML**: Semantic structure, accessibility
- **CSS**: Layout, styling, responsive
- **JavaScript**: Logic, DOM manipulation
- **TypeScript**: Type definitions, interfaces
- **React**: Components, state, hooks
- **Next.js**: Routing, data fetching, server actions

### O - Order by Dependencies
Sequence tasks so earlier ones provide foundation:
1. Static structure (HTML/CSS)
2. Component extraction (React)
3. Interactivity (hooks, state)
4. Data integration (API, server)
5. Polish (animations, edge cases)

### M - Map to Lessons
For each task, identify:
- Primary lesson (main concept being practiced)
- Secondary lessons (supporting concepts)
- Prerequisite lessons (what student should know)

### P - Prepare Acceptance Criteria
Define clear, testable criteria:
- Visual matching (responsive breakpoints)
- Functional requirements (interactions work)
- Code quality (TypeScript, no errors)
- Accessibility (semantic HTML, ARIA)

### O - Optimize for Independence
Ensure tasks can be done in any order:
- Provide starter code for dependencies
- Use mocks for data not yet implemented
- Clear file scope boundaries

### S - Size Appropriately
Target 1-4 hours per homework:
- **Beginner**: 1-2 hours, single concept
- **Intermediate**: 2-3 hours, multiple concepts
- **Advanced**: 3-4 hours, complex integration

### E - Estimate and Tag
For each homework:
- Difficulty tier
- Estimated hours
- XP reward (base: 50/beginner, 100/intermediate, 150/advanced)
- Skills reinforced (lesson slugs)

---

## Homework Definition Template

```yaml
name: "Implement Hero Section Layout"
slug: "hero-section-layout"
homework_type: "implementation"
difficulty: "beginner"
estimated_hours: 2
xp_reward: 50

feature_id: "landing-page-hero"  # Parent feature

description: |
  Create the responsive hero section for the landing page.
  The hero includes a headline, subheadline, CTA button, and illustration.

lessons:
  - slug: flexbox-container
    relevance: 0.9
    is_primary: true
    context: "Use flexbox to center content and handle responsive layout"
  - slug: responsive-design-principles
    relevance: 0.8
    context: "Stack elements on mobile, side-by-side on desktop"
  - slug: tailwind-navigation
    relevance: 0.6
    context: "Apply Tailwind utility classes for styling"

instructions: |
  ## Task
  Implement the hero section matching the provided design.

  ## Requirements
  1. Create responsive layout (mobile-first)
  2. Center content vertically on large screens
  3. Stack headline + CTA on left, image on right (desktop)
  4. Full-width stacked layout on mobile

  ## Getting Started
  ```bash
  git checkout -b feat/landing-hero
  ```

  ## Files to Modify
  - `src/app/(marketing)/page.tsx`
  - `src/components/marketing/HeroSection.tsx` (create)

acceptance_criteria:
  - id: "layout-desktop"
    description: "Content and image side-by-side on lg+ screens"
    weight: 25
  - id: "layout-mobile"
    description: "Content stacks vertically on mobile"
    weight: 25
  - id: "cta-button"
    description: "CTA button is clickable and styled correctly"
    weight: 15
  - id: "responsive"
    description: "No horizontal scroll at any breakpoint"
    weight: 20
  - id: "accessibility"
    description: "Semantic HTML (h1, proper alt text)"
    weight: 15

hints:
  - level: 1
    content: "Use `flex flex-col lg:flex-row` for responsive direction"
    xp_cost: 5
  - level: 2
    content: "For vertical centering, add `items-center` to the flex container"
    xp_cost: 10
  - level: 3
    content: |
      Example structure:
      ```tsx
      <section className="flex flex-col lg:flex-row items-center gap-8">
        <div className="flex-1">{/* Content */}</div>
        <div className="flex-1">{/* Image */}</div>
      </section>
      ```
    xp_cost: 20

file_scope:
  - path: "src/components/marketing/HeroSection.tsx"
    purpose: "Main hero component"
    required: true
  - path: "src/app/(marketing)/page.tsx"
    purpose: "Import and use HeroSection"
    required: true

branch_prefix: "feat/landing-hero"
```

---

## Scope Isolation Rules

To prevent homework overlap:

### 1. Component Boundaries
Each homework owns specific components:
- ❌ Don't: "Build the landing page"
- ✅ Do: "Build HeroSection", "Build FeaturesGrid", "Build Testimonials"

### 2. File Ownership
Each homework lists its files:
- ❌ Don't: Modify shared files without explicit scope
- ✅ Do: Clear file_scope with required/optional flags

### 3. Style Isolation
Prefer component-scoped styles:
- ❌ Don't: Modify global CSS for one homework
- ✅ Do: Use Tailwind classes or CSS modules

### 4. State Boundaries
Isolate state per homework:
- ❌ Don't: "Add form with global state"
- ✅ Do: "Add form component" + "Connect form to global store" (separate)

### 5. Mock Data First
Don't require backend for UI homework:
- ❌ Don't: "Fetch and display products" (combines UI + data)
- ✅ Do: "Display product grid with mock data" + "Connect to API" (separate)

---

## Quality Checklist

Before finalizing homework:

- [ ] Maps to at least one curriculum lesson
- [ ] Can be completed in 1-4 hours
- [ ] Has 3-5 testable acceptance criteria
- [ ] File scope is explicit
- [ ] No blocking dependencies on other homeworks
- [ ] Starter code or clear starting point provided
- [ ] Branch naming convention defined
- [ ] Hints provide progressive help without giving solution
- [ ] XP reward matches difficulty
