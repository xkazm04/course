# Homework Scanner - Claude Code Command Template

Analyze a project and its features, then generate homework assignments mapped to course chapters. One feature can produce multiple homework types.

## Variables

- `$PROJECT_ID` - UUID of the project in project_repositories table
- `$API_BASE_URL` - Base URL for API calls (default: http://localhost:3000)

---

## Instructions

You are an expert curriculum designer and learning architect. Your task is to analyze a project's features and create targeted homework assignments that reinforce specific chapter learning outcomes.

### Step 1: Fetch Project Data

First, gather all necessary data from the API:

```bash
# Fetch project with all features
curl "$API_BASE_URL/api/projects/$PROJECT_ID/features"

# Fetch all course chapters with learning outcomes and skills
curl "$API_BASE_URL/api/chapters/all?include=learning_outcomes,skills"
```

Parse the responses and understand:
- What features exist in the project
- What chapters are available
- What skills each chapter teaches
- What learning outcomes each chapter has

### Step 2: Analyze Chapter-Feature Alignment

For each **feature** in the project, determine which **chapters** teach relevant skills.

**Matching Criteria:**

| Match Type | Description | Relevance Score |
|------------|-------------|-----------------|
| Direct Skill Match | Chapter teaches the primary skill needed | 0.9 - 1.0 |
| Supporting Skills | Chapter teaches complementary skills | 0.7 - 0.8 |
| Background Knowledge | Chapter provides foundational understanding | 0.5 - 0.6 |
| Tangential Connection | Loosely related concepts | 0.3 - 0.4 |

**Matching Process:**
1. List the primary skills required by the feature
2. Check each chapter's `skills` and `learning_outcomes`
3. Calculate relevance score based on overlap
4. A feature can map to multiple chapters
5. A chapter can have homeworks from multiple features

### Step 3: Generate Multiple Homeworks per Feature

For each feature, generate **2-4 homework assignments** of different types:

| Homework Type | Focus Area | When to Include |
|---------------|------------|-----------------|
| `implementation` | Build core feature | Always include |
| `ui_design` | Visual polish & UX | If feature has UI |
| `responsive` | Mobile-first design | If feature has UI |
| `performance` | Optimization | If feature has performance impact |
| `testing` | Test coverage | Always include |
| `accessibility` | A11y compliance | If feature has UI |
| `edge_cases` | Error handling | If feature has complex state |
| `documentation` | Code docs & README | For complex features |

**Each homework should:**
- Target a SPECIFIC chapter (based on relevance score)
- Have unique acceptance criteria beyond the base feature
- Include progressive hints (3 levels)
- Specify XP value based on difficulty and type

### Step 4: Design Progressive Hints

For each homework, create exactly 3 hints with increasing specificity:

| Hint Level | XP Cost | Content Type | Example |
|------------|---------|--------------|---------|
| Level 1 | 5% | Direction pointer | "Start by examining the AuthProvider component" |
| Level 2 | 15% | Approach guidance | "You'll need to use React Context and useReducer for state" |
| Level 3 | 30% | Implementation hint | "Create an interceptor in your API client to handle 401 responses" |

### Step 5: Generate Branch Naming

For each homework, generate the branch prefix following the convention:

```
feat/<feature-slug>:<homework-slug>
```

Example: `feat/user-authentication:core-implementation`

Students will append their username when creating their branch:
`feat/user-authentication:core-implementation:johndoe`

### Step 6: Calculate XP Rewards

Base XP by difficulty:
- Beginner: 50-80 XP
- Intermediate: 100-150 XP
- Advanced: 175-250 XP
- Expert: 275-400 XP

Modifiers:
- `implementation` type: +20% XP
- `testing` type: +10% XP
- `performance` type: +15% XP
- Higher relevance score: +10% if score > 0.8

---

## Output Format

Generate a JSON file with this structure:

```json
{
  "project_id": "$PROJECT_ID",
  "scan_timestamp": "2025-01-15T10:30:00Z",
  "chapters_analyzed": 25,
  "features_scanned": 12,

  "homeworks": [
    {
      "feature_id": "uuid-of-feature",
      "feature_name": "User Authentication",
      "feature_slug": "user-authentication",

      "chapter_id": "uuid-of-chapter",
      "chapter_title": "React State Management",
      "relevance_score": 0.85,
      "mapping_rationale": "This chapter teaches Context API which is essential for the AuthProvider implementation",

      "homework": {
        "name": "Implement Auth Provider",
        "slug": "auth-provider-implementation",
        "homework_type": "implementation",
        "description": "Build the core authentication context provider that manages user session state across the application.",

        "difficulty": "intermediate",
        "estimated_hours": 4,
        "xp_reward": 150,

        "branch_prefix": "feat/user-authentication:auth-provider-implementation",

        "instructions": "Implement a React Context-based AuthProvider that:\n\n1. **Create the Context**\n   - Define AuthContext with user state, loading state, and error state\n   - Create AuthProvider component that wraps children\n\n2. **Implement State Management**\n   - Use useReducer for predictable state updates\n   - Handle: login, logout, signup, refreshToken actions\n\n3. **Add Persistence**\n   - Store auth token in localStorage\n   - Check for existing token on mount\n   - Validate token with API on app load\n\n4. **Create useAuth Hook**\n   - Export convenient hook for consuming auth context\n   - Include login(), logout(), signup() functions\n   - Include user, isLoading, error state\n\n5. **Protect Routes**\n   - Create middleware to check authentication\n   - Redirect unauthenticated users to login",

        "acceptance_criteria": [
          {
            "id": "ac-1",
            "description": "AuthProvider wraps the app and provides context",
            "validation_type": "functional",
            "expected": "useAuth hook returns auth state in any component",
            "weight": 20
          },
          {
            "id": "ac-2",
            "description": "Login function authenticates user and updates state",
            "validation_type": "functional",
            "expected": "User state updates, token stored after successful login",
            "weight": 25
          },
          {
            "id": "ac-3",
            "description": "Session persists on page refresh",
            "validation_type": "functional",
            "expected": "User remains logged in after page reload",
            "weight": 25
          },
          {
            "id": "ac-4",
            "description": "Logout clears all auth state and tokens",
            "validation_type": "functional",
            "expected": "User state null, localStorage cleared, redirected to login",
            "weight": 20
          },
          {
            "id": "ac-5",
            "description": "Loading state shown during auth operations",
            "validation_type": "visual",
            "expected": "isLoading true during async operations",
            "weight": 10
          }
        ],

        "hints": [
          {
            "level": 1,
            "content": "Start by creating the AuthContext with createContext(). Define what shape your auth state should have: user object, loading boolean, error state.",
            "xp_cost_percent": 5
          },
          {
            "level": 2,
            "content": "Use useReducer instead of useState for complex state. Define actions like LOGIN_START, LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT. Your reducer should handle each action type.",
            "xp_cost_percent": 15
          },
          {
            "level": 3,
            "content": "For persistence, in useEffect on mount: (1) check localStorage for token, (2) if token exists, call /api/auth/me to validate, (3) dispatch LOGIN_SUCCESS with user data or LOGOUT if invalid. For session storage, save token in LOGIN_SUCCESS handler.",
            "xp_cost_percent": 30
          }
        ],

        "file_scope": [
          {
            "path": "src/lib/auth/AuthProvider.tsx",
            "purpose": "Main context provider and reducer logic",
            "required": true
          },
          {
            "path": "src/lib/auth/useAuth.ts",
            "purpose": "Consumer hook with typed interface",
            "required": true
          },
          {
            "path": "src/lib/auth/types.ts",
            "purpose": "TypeScript interfaces for auth",
            "required": false
          },
          {
            "path": "src/middleware.ts",
            "purpose": "Route protection",
            "required": true
          }
        ],

        "skills_reinforced": [
          "react-context",
          "react-hooks",
          "state-management",
          "typescript",
          "localStorage"
        ]
      }
    },
    {
      "feature_id": "uuid-of-feature",
      "feature_name": "User Authentication",
      "feature_slug": "user-authentication",

      "chapter_id": "uuid-of-different-chapter",
      "chapter_title": "CSS Layout & Responsive Design",
      "relevance_score": 0.72,
      "mapping_rationale": "The login/signup forms require responsive layout skills taught in this chapter",

      "homework": {
        "name": "Responsive Login Form",
        "slug": "responsive-login-form",
        "homework_type": "responsive",
        "description": "Create a beautiful, responsive login form that works perfectly on all device sizes from mobile to desktop.",

        "difficulty": "beginner",
        "estimated_hours": 2,
        "xp_reward": 80,

        "branch_prefix": "feat/user-authentication:responsive-login-form",

        "instructions": "Design and implement a responsive login form...",

        "acceptance_criteria": [
          {
            "id": "ac-1",
            "description": "Form is fully functional on mobile (320px+)",
            "validation_type": "visual",
            "expected": "No horizontal scroll, readable text, tappable inputs",
            "weight": 35
          },
          {
            "id": "ac-2",
            "description": "Form adapts to tablet (768px+)",
            "validation_type": "visual",
            "expected": "Optimal use of space, centered layout",
            "weight": 30
          },
          {
            "id": "ac-3",
            "description": "Form is polished on desktop (1024px+)",
            "validation_type": "visual",
            "expected": "Professional appearance, max-width constraint",
            "weight": 35
          }
        ],

        "hints": [
          {
            "level": 1,
            "content": "Start mobile-first. Design for 320px width first, then add breakpoints.",
            "xp_cost_percent": 5
          },
          {
            "level": 2,
            "content": "Use Tailwind's responsive prefixes: sm:, md:, lg:. The form should be full-width on mobile.",
            "xp_cost_percent": 15
          },
          {
            "level": 3,
            "content": "For the card: bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full sm:max-w-md mx-auto",
            "xp_cost_percent": 30
          }
        ],

        "file_scope": [
          {
            "path": "src/app/login/page.tsx",
            "purpose": "Login page with responsive form",
            "required": true
          }
        ],

        "skills_reinforced": [
          "responsive-design",
          "tailwind-css",
          "mobile-first"
        ]
      }
    }
  ],

  "summary": {
    "total_features_scanned": 12,
    "total_homeworks_generated": 34,
    "chapters_with_homeworks": 8,
    "homeworks_by_type": {
      "implementation": 12,
      "ui_design": 6,
      "responsive": 5,
      "testing": 8,
      "accessibility": 3
    },
    "difficulty_distribution": {
      "beginner": 8,
      "intermediate": 18,
      "advanced": 6,
      "expert": 2
    },
    "estimated_total_hours": 120,
    "total_xp_available": 4250
  },

  "unmapped_features": [
    {
      "feature_id": "uuid",
      "feature_name": "Feature Name",
      "reason": "No matching chapters found for required skills"
    }
  ]
}
```

---

## Execution

```bash
# Set the project ID from your database
export PROJECT_ID="550e8400-e29b-41d4-a716-446655440000"

claude --command prompts/homework-scanner.md \
  --var PROJECT_ID="$PROJECT_ID" \
  --var API_BASE_URL="http://localhost:3000"
```

---

## Begin Scanning

**Project ID:** $PROJECT_ID
**API Base URL:** $API_BASE_URL

Please scan this project following all steps above:

1. Fetch project features from the API
2. Fetch all chapters with their learning outcomes
3. Map each feature to relevant chapters (calculate relevance scores)
4. Generate 2-4 homework assignments per feature
5. Create progressive hints for each homework
6. Calculate appropriate XP rewards
7. Output the complete JSON result

**Important:**
- Every feature should have at least an `implementation` homework
- UI features should also have `responsive` and/or `ui_design` homeworks
- Include `testing` homework for critical features
- Homeworks from the same feature can map to different chapters
- Higher relevance scores should go to more specific chapter matches

Begin your scan now.
