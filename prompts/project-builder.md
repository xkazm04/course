# Project Builder - Claude Code Command Template

Build a comprehensive real-world project specification from a concept description. This creates a buildable project with learnable features suitable for student homework assignments.

## Variables

- `$CONCEPT` - Project concept description (e.g., "Spotify clone", "E-commerce dashboard")
- `$TECHSTACK` - Technology stack (e.g., "Next.js 15, Tailwind, Supabase")
- `$DIFFICULTY` - Target difficulty tier: beginner | intermediate | advanced | expert

---

## Instructions

You are a senior software architect and curriculum designer. Your task is to design a comprehensive, buildable project that teaches real-world software engineering skills through hands-on implementation.

### Step 1: Project Vision

Based on the concept "$CONCEPT", envision a realistic application that:

1. **Is buildable** - Can be fully implemented with $TECHSTACK
2. **Is learnable** - Has clear learning progression from simple to complex features
3. **Is practical** - Teaches skills that transfer to real job scenarios
4. **Has clear scope** - Contains 8-15 distinct, self-contained features

Think about what makes this application useful and what core functionality it needs. Consider the user journey and key interactions.

### Step 2: Page Structure

Design the application pages/routes. For each page, define:
- **Name** - Human-readable page name
- **Route** - URL path (e.g., `/dashboard`, `/playlist/[id]`)
- **Purpose** - What the user accomplishes on this page
- **Components** - Key UI components needed
- **Data requirements** - What data the page needs to fetch

### Step 3: Feature Decomposition

Break the project into **8-15 self-contained features**. Each feature must be:
- **Isolated** - Can be implemented independently (with prerequisites if needed)
- **Testable** - Has clear, verifiable acceptance criteria
- **Educational** - Teaches specific, valuable skills

For EACH feature, specify ALL of the following:

#### 3.1 Identification
- `name`: Human-readable feature name (e.g., "User Authentication")
- `slug`: URL-safe identifier (e.g., "user-authentication")
- `description`: 2-3 sentences explaining what this feature does and why it matters

#### 3.2 Complexity Assessment
- `difficulty`: beginner | intermediate | advanced | expert
- `complexity_score`: 1-10 scale based on:
  - 1-3: Simple, single file changes
  - 4-6: Moderate, multiple files, some state management
  - 7-8: Complex, architectural decisions required
  - 9-10: Expert, deep system knowledge required
- `estimated_hours`: Realistic time to implement from scratch

#### 3.3 File Scope
List ALL files that need to be created or modified:
```json
{
  "path": "src/lib/auth/AuthProvider.tsx",
  "purpose": "Main authentication context provider",
  "lines_estimate": 120
}
```

#### 3.4 Acceptance Criteria
Define 3-6 specific, testable criteria. Each criterion must have:
```json
{
  "id": "ac-1",
  "description": "User can sign up with email and password",
  "validation_type": "functional | visual | performance | accessibility",
  "expected": "Account created, user redirected to dashboard"
}
```

#### 3.5 Completion Flag
How to verify the feature is implemented:
```json
{
  "file": "src/lib/auth/AuthProvider.tsx",
  "condition": "exports AuthProvider and useAuth"
}
```

#### 3.6 Prerequisites
- **skills**: Technical skills needed before attempting (e.g., "React Context API", "TypeScript generics")
- **features**: Other features that must be completed first (reference by slug)

#### 3.7 Learning Outcomes
List 3-5 specific skills or knowledge the learner gains from implementing this feature.

### Step 4: Homework Variants

For EACH feature, define 2-4 homework variants that can be assigned separately:

| Variant Type | Focus | Description |
|--------------|-------|-------------|
| `implementation` | Core functionality | Build the feature as specified |
| `ui_design` | Visual polish | Create beautiful, animated UI |
| `responsive` | Mobile-first | Ensure perfect mobile experience |
| `performance` | Optimization | Meet performance benchmarks |
| `testing` | Test coverage | Write comprehensive tests |
| `accessibility` | A11y compliance | Meet WCAG 2.1 AA standards |
| `edge_cases` | Robustness | Handle all error states gracefully |
| `documentation` | Code docs | Add JSDoc and README updates |

Each variant has:
- `variant_type`: One of the types above
- `name`: Specific homework name
- `description`: What this homework requires
- `additional_criteria`: Extra acceptance criteria beyond the base feature

### Step 5: Learning Order & Milestones

1. Define `recommended_learning_order` - Array of feature slugs in optimal learning sequence
2. Define `milestones` - Key checkpoints:
   - **MVP Complete**: Minimum viable features
   - **Feature Complete**: All features implemented
   - **Production Ready**: Polished with tests and docs

---

## Output Format

Generate a JSON file with the following structure:

```json
{
  "project": {
    "name": "Project Name",
    "slug": "project-slug",
    "concept": "$CONCEPT",
    "description": "Comprehensive project description (2-3 paragraphs)",
    "tech_stack": ["Next.js 15", "TypeScript", "Tailwind CSS", "Supabase"],
    "difficulty_tier": "$DIFFICULTY",
    "complexity_score": 7,
    "estimated_total_hours": 40,
    "repository_template_url": null,
    "architecture_overview": "Description of architectural patterns used"
  },
  "pages": [
    {
      "name": "Dashboard",
      "route": "/dashboard",
      "purpose": "Main user dashboard showing overview metrics",
      "components": ["MetricsGrid", "RecentActivity", "QuickActions"],
      "data_requirements": ["user_stats", "recent_items", "notifications"]
    }
  ],
  "features": [
    {
      "name": "User Authentication",
      "slug": "user-authentication",
      "description": "Complete authentication flow with OAuth, email/password, and session management. Handles login, logout, password reset, and protected routes.",
      "difficulty": "intermediate",
      "complexity_score": 6,
      "estimated_hours": 5,
      "file_scope": [
        {
          "path": "src/lib/auth/AuthProvider.tsx",
          "purpose": "React context for auth state management",
          "lines_estimate": 120
        },
        {
          "path": "src/lib/auth/useAuth.ts",
          "purpose": "Authentication hook for components",
          "lines_estimate": 80
        },
        {
          "path": "src/app/login/page.tsx",
          "purpose": "Login page with form",
          "lines_estimate": 150
        },
        {
          "path": "src/app/signup/page.tsx",
          "purpose": "Signup page with validation",
          "lines_estimate": 180
        },
        {
          "path": "src/middleware.ts",
          "purpose": "Route protection middleware",
          "lines_estimate": 40
        }
      ],
      "acceptance_criteria": [
        {
          "id": "ac-1",
          "description": "User can sign up with email and password",
          "validation_type": "functional",
          "expected": "Account created, user redirected to dashboard"
        },
        {
          "id": "ac-2",
          "description": "User can log in with valid credentials",
          "validation_type": "functional",
          "expected": "Session created, redirected to dashboard"
        },
        {
          "id": "ac-3",
          "description": "Invalid credentials show appropriate error",
          "validation_type": "functional",
          "expected": "Error message displayed, user remains on login page"
        },
        {
          "id": "ac-4",
          "description": "Session persists across page refresh",
          "validation_type": "functional",
          "expected": "User remains authenticated after refresh"
        },
        {
          "id": "ac-5",
          "description": "Logout clears all auth state",
          "validation_type": "functional",
          "expected": "User redirected to login, tokens cleared"
        }
      ],
      "completion_flag": {
        "file": "src/lib/auth/AuthProvider.tsx",
        "condition": "exports AuthProvider and useAuth, login/logout functions work"
      },
      "prerequisites": {
        "skills": ["React Context API", "React Hooks", "TypeScript", "HTTP/REST basics"],
        "features": []
      },
      "learning_outcomes": [
        "Implement OAuth 2.0 flow in a React application",
        "Manage authentication state with Context API",
        "Handle token refresh and session persistence",
        "Secure routes based on authentication status",
        "Build accessible login/signup forms"
      ],
      "homework_variants": [
        {
          "variant_type": "implementation",
          "name": "Core Authentication Implementation",
          "description": "Build the complete authentication system with login, signup, and session management.",
          "additional_criteria": []
        },
        {
          "variant_type": "ui_design",
          "name": "Auth UI Enhancement",
          "description": "Create a polished, animated login/signup experience with micro-interactions.",
          "additional_criteria": [
            "Smooth form field animations",
            "Loading states with skeleton or spinner",
            "Success/error animations",
            "OAuth buttons with provider branding"
          ]
        },
        {
          "variant_type": "accessibility",
          "name": "Accessible Auth Forms",
          "description": "Ensure authentication forms are fully accessible to all users.",
          "additional_criteria": [
            "Full keyboard navigation",
            "Screen reader announces all form states",
            "Focus management on errors and success",
            "High contrast mode support"
          ]
        },
        {
          "variant_type": "testing",
          "name": "Auth Test Suite",
          "description": "Write comprehensive tests for the authentication system.",
          "additional_criteria": [
            "Unit tests for useAuth hook",
            "Integration tests for login/signup flow",
            "E2E tests for full auth journey",
            "80%+ code coverage"
          ]
        }
      ]
    }
  ],
  "recommended_learning_order": [
    "project-setup",
    "user-authentication",
    "dashboard-layout",
    "core-feature-1",
    "core-feature-2",
    "advanced-feature-1"
  ],
  "milestones": [
    {
      "name": "MVP Complete",
      "features_required": ["user-authentication", "dashboard-layout", "core-feature-1"],
      "description": "Basic working application with core functionality"
    },
    {
      "name": "Feature Complete",
      "features_required": ["all"],
      "description": "All planned features implemented"
    },
    {
      "name": "Production Ready",
      "features_required": ["all"],
      "additional_requirements": [
        "All performance variants completed",
        "Accessibility audit passed",
        "Test coverage > 80%"
      ],
      "description": "Application ready for deployment"
    }
  ]
}
```

---

## Execution

To build a project specification:

```bash
claude --command prompts/project-builder.md \
  --var CONCEPT="Spotify clone with playlist management and music discovery" \
  --var TECHSTACK="Next.js 15, Tailwind CSS, Supabase, Spotify API" \
  --var DIFFICULTY="intermediate"
```

---

## Begin Design

**Concept:** $CONCEPT
**Tech Stack:** $TECHSTACK
**Difficulty Tier:** $DIFFICULTY

Please design this project following all steps above. Create a comprehensive, buildable specification that will teach real software engineering skills.

### Design Process:

1. First, envision the complete application and its core purpose
2. Define the page structure with routes and components
3. Decompose into 8-15 features with complete specifications
4. Define 2-4 homework variants for each feature
5. Establish learning order and milestones
6. Generate the complete JSON output

**Important:** Make this project realistic and practical. Every feature should teach something valuable. Every homework variant should be meaningful and achievable.

Begin your design now.
