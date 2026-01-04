# Project Scanner - Claude Code Command Template

Scan and decompose a GitHub repository into learnable features for the Real-World Task Learning Platform.

## Variables

- `$PROJECT_PATH` - Local path to the cloned repository (e.g., `/path/to/repo`)
- `$PROJECT_URL` - GitHub URL of the repository (e.g., `https://github.com/owner/repo`)

---

## Instructions

You are a senior software engineer and curriculum designer. Your task is to analyze a codebase and decompose it into **learnable features** that can be assigned as homework to students learning software development.

### Step 1: Repository Analysis

First, explore the repository to understand its structure and purpose:

1. **Read the README** to understand what the project does
2. **Identify the tech stack** by examining:
   - `package.json`, `requirements.txt`, `Cargo.toml`, `go.mod`, etc.
   - Framework-specific files (e.g., `next.config.js`, `vite.config.ts`, `django/settings.py`)
   - Configuration files (`.eslintrc`, `tsconfig.json`, `Dockerfile`)
3. **Map the directory structure** to understand the architecture
4. **Identify key entry points** (main files, routes, components)

### Step 2: Feature Decomposition

Identify **5-10 self-contained features** that a learner could study or implement. For each feature:

**Selection Criteria:**
- Feature should be **isolated enough** to understand independently
- Feature should teach **valuable, transferable skills**
- Feature should have **clear boundaries** (specific files/directories)
- Features should range from **beginner to advanced** difficulty

**For each feature, determine:**
1. **Name** - Clear, descriptive name
2. **Slug** - URL-friendly identifier
3. **Description** - What this feature does and why it matters (2-3 sentences)
4. **Difficulty** - `beginner` | `intermediate` | `advanced` | `expert`
5. **Complexity Score** - 1-10 scale
6. **Estimated Hours** - Time to understand and implement
7. **File Scope** - List of files involved with their purpose
8. **Entry Points** - Where to start reading the code
9. **Prerequisites** - Skills/knowledge needed
10. **Learning Outcomes** - What the learner will gain
11. **Acceptance Criteria** - How to validate understanding/implementation

### Step 3: Output Format

Generate a JSON file with the following structure:

```json
{
  "repository": {
    "name": "repo-name",
    "owner": "owner",
    "url": "$PROJECT_URL",
    "primary_language": "TypeScript",
    "framework": "Next.js",
    "tech_stack": ["React", "TypeScript", "Tailwind CSS", "Prisma"],
    "difficulty_tier": "intermediate",
    "complexity_score": 6,
    "estimated_onboarding_hours": 8,
    "readme_summary": "Brief 2-3 sentence summary of what this project does",
    "architecture_overview": "Description of the architecture pattern used"
  },
  "features": [
    {
      "name": "User Authentication Flow",
      "slug": "user-authentication-flow",
      "description": "Complete OAuth 2.0 authentication with session management, including login, logout, and token refresh functionality.",
      "difficulty": "intermediate",
      "complexity_score": 6,
      "estimated_hours": 4,
      "file_scope": [
        {
          "path": "src/auth/AuthProvider.tsx",
          "purpose": "Main authentication context provider",
          "lines_estimate": 120
        },
        {
          "path": "src/auth/useAuth.ts",
          "purpose": "Authentication hook for components",
          "lines_estimate": 80
        },
        {
          "path": "src/api/authApi.ts",
          "purpose": "API client for auth endpoints",
          "lines_estimate": 60
        }
      ],
      "entry_points": [
        "src/auth/AuthProvider.tsx",
        "src/auth/useAuth.ts"
      ],
      "prerequisites": [
        "React Context API",
        "React Hooks",
        "HTTP/REST basics",
        "JWT tokens concept"
      ],
      "learning_outcomes": [
        "Implement OAuth 2.0 flow in a React application",
        "Manage authentication state with Context API",
        "Handle token refresh and session persistence",
        "Secure routes based on authentication status"
      ],
      "acceptance_tests": [
        {
          "description": "User can log in with valid credentials",
          "validation_type": "functional",
          "expected": "User is redirected to dashboard, auth state is updated"
        },
        {
          "description": "Invalid credentials show appropriate error",
          "validation_type": "functional",
          "expected": "Error message displayed, user remains on login page"
        },
        {
          "description": "Session persists across page refreshes",
          "validation_type": "functional",
          "expected": "User remains authenticated after refresh"
        },
        {
          "description": "Logout clears all auth state",
          "validation_type": "functional",
          "expected": "User is redirected to login, tokens are cleared"
        }
      ],
      "hints": [
        {
          "level": 1,
          "content": "Start by examining how AuthProvider wraps the application in _app.tsx",
          "xp_cost_percent": 5
        },
        {
          "level": 2,
          "content": "The useAuth hook exposes login(), logout(), and user state - trace how these connect to the API",
          "xp_cost_percent": 15
        },
        {
          "level": 3,
          "content": "Token refresh is handled by an axios interceptor in src/api/client.ts - look for the 401 response handler",
          "xp_cost_percent": 30
        }
      ]
    }
  ],
  "recommended_learning_order": [
    "feature-slug-1",
    "feature-slug-2",
    "feature-slug-3"
  ],
  "chapter_mapping_suggestions": [
    {
      "feature_slug": "user-authentication-flow",
      "suggested_chapters": [
        "React State Management",
        "API Integration",
        "Security Fundamentals"
      ],
      "rationale": "This feature combines state management patterns with API integration and security concepts"
    }
  ]
}
```

---

## Execution

To scan a project, clone it locally and run this command file with Claude Code:

```bash
# Clone the repository
git clone $PROJECT_URL /tmp/scan-target

# Run Claude Code with this prompt
claude --command prompts/scan-project.md --var PROJECT_PATH=/tmp/scan-target --var PROJECT_URL=$PROJECT_URL
```

---

## Begin Analysis

**Repository Path:** `$PROJECT_PATH`
**Repository URL:** `$PROJECT_URL`

Please analyze this repository following the steps above. Start by exploring the codebase structure, then identify features, and finally output the structured JSON.

### Analysis Steps:

1. First, list the top-level directory structure
2. Read the README.md file
3. Identify the tech stack from config files
4. Explore the main source directories
5. Identify 5-10 distinct, learnable features
6. Generate the complete JSON output

Begin your analysis now.
