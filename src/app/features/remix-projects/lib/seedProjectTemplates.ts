// Seed Project Templates - Mock project data for remix exercises

import {
    SeedProject,
    Assignment,
    DirectoryNode,
    ProjectFile,
} from "./types";

// Helper to create directory structure
function createDirectoryNode(
    name: string,
    type: "file" | "directory",
    path: string,
    children?: DirectoryNode[],
    language?: string
): DirectoryNode {
    return { name, type, path, children, language };
}

// Sample project files for TaskFlow API
const taskflowFiles: ProjectFile[] = [
    {
        path: "src/app.js",
        content: `const express = require('express');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');

const app = express();
app.use(express.json());

app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// TODO: Add error handling middleware
// TODO: Add request logging

module.exports = app;`,
        language: "javascript",
        linesOfCode: 14,
        complexity: 2,
        issues: [
            { line: 10, type: "smell", severity: "low", description: "Missing error handling middleware", isIntentional: true },
        ],
    },
    {
        path: "src/routes/tasks.js",
        content: `const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all tasks - NO PAGINATION!
router.get('/', async (req, res) => {
    try {
        const tasks = await db.query('SELECT * FROM tasks');
        // N+1 query problem - fetching user for each task
        for (let task of tasks.rows) {
            const user = await db.query('SELECT name FROM users WHERE id = $1', [task.user_id]);
            task.userName = user.rows[0]?.name;
        }
        res.json(tasks.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create task - NO INPUT VALIDATION!
router.post('/', async (req, res) => {
    try {
        const { title, description, user_id } = req.body;
        const result = await db.query(
            'INSERT INTO tasks (title, description, user_id) VALUES ($1, $2, $3) RETURNING *',
            [title, description, user_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;`,
        language: "javascript",
        linesOfCode: 32,
        complexity: 8,
        issues: [
            { line: 6, type: "performance", severity: "medium", description: "No pagination on list endpoint", isIntentional: true },
            { line: 10, type: "performance", severity: "high", description: "N+1 query problem", isIntentional: true },
            { line: 21, type: "security", severity: "high", description: "No input validation", isIntentional: true },
            { line: 16, type: "smell", severity: "low", description: "Generic error message", isIntentional: true },
        ],
    },
    {
        path: "src/routes/users.js",
        content: `const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
    try {
        const users = await db.query('SELECT id, name, email FROM users');
        res.json(users.rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// NO PASSWORD HASHING!
router.post('/', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const result = await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, password]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;`,
        language: "javascript",
        linesOfCode: 26,
        complexity: 6,
        issues: [
            { line: 18, type: "security", severity: "critical", description: "Storing plaintext password", isIntentional: true },
            { line: 15, type: "security", severity: "high", description: "No input validation", isIntentional: true },
        ],
    },
    {
        path: "package.json",
        content: `{
  "name": "taskflow-api",
  "version": "1.0.0",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0"
  },
  "devDependencies": {
    "jest": "^29.5.0"
  }
}`,
        language: "json",
        linesOfCode: 16,
        complexity: 1,
        issues: [],
    },
];

// Seed Projects
export const SEED_PROJECTS: SeedProject[] = [
    {
        id: "taskflow-api-v1",
        name: "TaskFlow API",
        description: "A REST API for task management - functional but rough around the edges. Built quickly for a hackathon, it works but needs polish before production.",
        version: 1,
        domain: "api",
        difficulty: "intermediate",
        estimatedHours: 5,
        repository: {
            files: taskflowFiles,
            readme: "# TaskFlow API\n\nA simple task management API built with Express and PostgreSQL.\n\n## Setup\n1. Install dependencies: `npm install`\n2. Start server: `npm start`\n\n## Endpoints\n- GET /api/tasks - List all tasks\n- POST /api/tasks - Create a task\n- GET /api/users - List all users\n- POST /api/users - Create a user",
            structure: createDirectoryNode("taskflow-api", "directory", "/", [
                createDirectoryNode("src", "directory", "/src", [
                    createDirectoryNode("routes", "directory", "/src/routes", [
                        createDirectoryNode("tasks.js", "file", "/src/routes/tasks.js", undefined, "javascript"),
                        createDirectoryNode("users.js", "file", "/src/routes/users.js", undefined, "javascript"),
                    ]),
                    createDirectoryNode("app.js", "file", "/src/app.js", undefined, "javascript"),
                    createDirectoryNode("db.js", "file", "/src/db.js", undefined, "javascript"),
                ]),
                createDirectoryNode("tests", "directory", "/tests", [
                    createDirectoryNode("tasks.test.js", "file", "/tests/tasks.test.js", undefined, "javascript"),
                ]),
                createDirectoryNode("package.json", "file", "/package.json", undefined, "json"),
                createDirectoryNode("README.md", "file", "/README.md", undefined, "markdown"),
            ]),
            dependencies: { express: "^4.18.2", pg: "^8.11.0" },
            devDependencies: { jest: "^29.5.0" },
            scripts: { start: "node src/app.js", test: "jest" },
        },
        techStack: {
            language: "javascript",
            runtime: "node",
            framework: "express",
            database: "postgresql",
            testing: "jest",
        },
        knownIssues: [
            {
                id: "issue-1",
                type: "security",
                title: "No input validation",
                description: "All endpoints accept any input without validation, making the API vulnerable to injection attacks and invalid data.",
                location: { file: "src/routes/tasks.js", startLine: 21, endLine: 30 },
                difficulty: "medium",
                hints: ["Consider using express-validator or joi for validation"],
            },
            {
                id: "issue-2",
                type: "performance",
                title: "N+1 query problem",
                description: "Fetching tasks with users makes N+1 database calls, causing significant performance issues at scale.",
                location: { file: "src/routes/tasks.js", startLine: 8, endLine: 13 },
                difficulty: "hard",
                hints: ["Use a JOIN query instead of fetching in a loop"],
            },
            {
                id: "issue-3",
                type: "security",
                title: "Plaintext passwords",
                description: "User passwords are stored in plaintext without any hashing.",
                location: { file: "src/routes/users.js", startLine: 15, endLine: 22 },
                difficulty: "medium",
                hints: ["Use bcrypt to hash passwords before storing"],
            },
        ],
        codeSmells: [
            {
                id: "smell-1",
                type: "duplication",
                location: { file: "src/routes/tasks.js", startLine: 15, endLine: 17 },
                description: "Error handling logic duplicated across all route handlers",
                suggestedRefactoring: "Create an error handling middleware",
            },
            {
                id: "smell-2",
                type: "missing_abstraction",
                location: { file: "src/routes/tasks.js", startLine: 1, endLine: 32 },
                description: "Database queries mixed directly with route handlers",
                suggestedRefactoring: "Create a service layer or repository pattern",
            },
        ],
        missingFeatures: [
            {
                id: "feature-1",
                title: "Pagination",
                description: "GET /tasks returns all tasks at once - needs pagination for scalability",
                userStory: "As a user, I want to paginate through my tasks so the app stays responsive",
                acceptanceCriteria: ["Accepts page and limit query params", "Returns total count in response", "Defaults to 20 items per page"],
                difficulty: "easy",
                suggestedApproach: "Add LIMIT and OFFSET to SQL query",
            },
            {
                id: "feature-2",
                title: "Task filtering",
                description: "No way to filter tasks by status, date, or assignee",
                userStory: "As a user, I want to filter my tasks to find what I need quickly",
                acceptanceCriteria: ["Filter by status (todo, in_progress, done)", "Filter by date range", "Combine multiple filters"],
                difficulty: "medium",
            },
        ],
        previousDeveloper: {
            name: "Alex Thompson",
            avatar: "👨‍💻",
            experience: "Junior developer, 6 months experience",
            style: "Fast-paced, gets things working quickly but cuts corners",
            timeConstraints: "Built this in a 48-hour hackathon",
            knownWeaknesses: ["Error handling", "Performance optimization", "Security best practices"],
            backstory: "Alex was learning Node.js while building this. The API works but they knew corners were cut. They moved to a different project and this needs someone to clean it up before it can go to production.",
        },
        projectHistory: "Originally created for a hackathon project. The team won third place but never had time to polish it. Now being considered for production use at a startup.",
        createdAt: new Date().toISOString(),
        contributorCount: 0,
        timesAssigned: 47,
        avgCompletionRate: 0.78,
    },
    {
        id: "blog-engine-v1",
        name: "BlogEngine",
        description: "A markdown-based blog platform with a React frontend. Has potential but the component structure is messy and there are several UI bugs.",
        version: 1,
        domain: "web_app",
        difficulty: "intermediate",
        estimatedHours: 6,
        repository: {
            files: [],
            readme: "# BlogEngine\n\nA simple markdown blog built with React.\n\n## Features\n- Write posts in markdown\n- Tag-based organization\n- Dark mode support",
            structure: createDirectoryNode("blog-engine", "directory", "/", [
                createDirectoryNode("src", "directory", "/src", [
                    createDirectoryNode("components", "directory", "/src/components", []),
                    createDirectoryNode("pages", "directory", "/src/pages", []),
                    createDirectoryNode("App.tsx", "file", "/src/App.tsx", undefined, "typescript"),
                ]),
                createDirectoryNode("package.json", "file", "/package.json", undefined, "json"),
            ]),
            dependencies: { react: "^18.2.0", "react-markdown": "^8.0.7" },
            devDependencies: { typescript: "^5.0.0", vite: "^4.4.0" },
            scripts: { dev: "vite", build: "vite build" },
        },
        techStack: {
            language: "typescript",
            runtime: "node",
            framework: "react",
            styling: "tailwindcss",
            testing: "vitest",
        },
        knownIssues: [
            {
                id: "issue-1",
                type: "ux",
                title: "Mobile layout broken",
                description: "The blog post view doesn't work properly on mobile devices",
                location: { file: "src/components/PostView.tsx", startLine: 1, endLine: 50 },
                difficulty: "medium",
            },
            {
                id: "issue-2",
                type: "bug",
                title: "Dark mode flicker",
                description: "Page flashes white before applying dark mode on page load",
                location: { file: "src/App.tsx", startLine: 10, endLine: 25 },
                difficulty: "medium",
            },
        ],
        codeSmells: [
            {
                id: "smell-1",
                type: "god_object",
                location: { file: "src/components/PostEditor.tsx", startLine: 1, endLine: 300 },
                description: "PostEditor component handles too many responsibilities",
            },
            {
                id: "smell-2",
                type: "duplication",
                location: { file: "src/components", startLine: 1, endLine: 1 },
                description: "Similar styling logic repeated across multiple components",
            },
        ],
        missingFeatures: [
            {
                id: "feature-1",
                title: "Search functionality",
                description: "No way to search through blog posts",
                userStory: "As a reader, I want to search posts by keyword",
                acceptanceCriteria: ["Search input in header", "Results update as you type", "Highlight matched text"],
                difficulty: "medium",
            },
        ],
        previousDeveloper: {
            name: "Jordan Lee",
            avatar: "👩‍💻",
            experience: "Self-taught developer, 1 year experience",
            style: "Enthusiastic but still learning best practices",
            timeConstraints: "Side project worked on during evenings",
            knownWeaknesses: ["Component architecture", "Responsive design"],
            backstory: "Jordan built this as their first real React project. It works but the code organization grew organically without much planning. They're proud of it but know it needs refactoring.",
        },
        projectHistory: "Started as a personal blog, gained some traction on social media. Jordan wants to open-source it but wants the code cleaned up first.",
        createdAt: new Date().toISOString(),
        contributorCount: 0,
        timesAssigned: 32,
        avgCompletionRate: 0.65,
    },
    {
        id: "cli-file-organizer-v1",
        name: "FileSort CLI",
        description: "A command-line tool for organizing files by type, date, or custom rules. Works but has no tests and error handling is minimal.",
        version: 1,
        domain: "cli_tool",
        difficulty: "beginner",
        estimatedHours: 3,
        repository: {
            files: [],
            readme: "# FileSort CLI\n\nOrganize your files from the command line.\n\n## Usage\n```\nfilesort --by type ./Downloads\nfilesort --by date ./Photos\n```",
            structure: createDirectoryNode("filesort-cli", "directory", "/", [
                createDirectoryNode("src", "directory", "/src", [
                    createDirectoryNode("index.ts", "file", "/src/index.ts", undefined, "typescript"),
                    createDirectoryNode("organizer.ts", "file", "/src/organizer.ts", undefined, "typescript"),
                ]),
                createDirectoryNode("package.json", "file", "/package.json", undefined, "json"),
            ]),
            dependencies: { commander: "^11.0.0", chalk: "^5.3.0" },
            devDependencies: { typescript: "^5.0.0" },
            scripts: { build: "tsc", start: "node dist/index.js" },
        },
        techStack: {
            language: "typescript",
            runtime: "node",
            testing: "jest",
        },
        knownIssues: [
            {
                id: "issue-1",
                type: "bug",
                title: "Crashes on special characters",
                description: "Files with special characters in names cause the tool to crash",
                location: { file: "src/organizer.ts", startLine: 25, endLine: 30 },
                difficulty: "easy",
            },
        ],
        codeSmells: [
            {
                id: "smell-1",
                type: "long_method",
                location: { file: "src/organizer.ts", startLine: 1, endLine: 150 },
                description: "Main organize function is too long and does too much",
            },
        ],
        missingFeatures: [
            {
                id: "feature-1",
                title: "Dry-run mode",
                description: "No way to preview what changes would be made",
                userStory: "As a user, I want to see what will happen before files are moved",
                acceptanceCriteria: ["--dry-run flag shows planned changes", "No files actually moved in dry-run"],
                difficulty: "easy",
            },
            {
                id: "feature-2",
                title: "Undo functionality",
                description: "No way to reverse the organization",
                userStory: "As a user, I want to undo if I made a mistake",
                acceptanceCriteria: ["Store operation log", "filesort --undo reverses last operation"],
                difficulty: "medium",
            },
        ],
        previousDeveloper: {
            name: "Sam Chen",
            avatar: "🧑‍💻",
            experience: "Experienced developer but new to CLI tools",
            style: "Practical, focuses on getting things done",
            timeConstraints: "Built in a weekend to solve personal problem",
            knownWeaknesses: ["Testing", "Edge cases"],
            backstory: "Sam needed to organize their massive Downloads folder and built this tool. It works for the happy path but hasn't been tested with edge cases.",
        },
        projectHistory: "Personal utility that Sam shared on GitHub. Got 50 stars but also bug reports.",
        createdAt: new Date().toISOString(),
        contributorCount: 0,
        timesAssigned: 28,
        avgCompletionRate: 0.85,
    },
];

// Get all seed projects
export function getAllSeedProjects(): SeedProject[] {
    return SEED_PROJECTS;
}

// Get project by ID
export function getSeedProjectById(id: string): SeedProject | null {
    return SEED_PROJECTS.find((p) => p.id === id) || null;
}

// Get projects by domain
export function getSeedProjectsByDomain(domain: SeedProject["domain"]): SeedProject[] {
    return SEED_PROJECTS.filter((p) => p.domain === domain);
}

// Get projects by difficulty
export function getSeedProjectsByDifficulty(difficulty: SeedProject["difficulty"]): SeedProject[] {
    return SEED_PROJECTS.filter((p) => p.difficulty === difficulty);
}

// Sample assignments for TaskFlow API
export const SAMPLE_ASSIGNMENTS: Assignment[] = [
    {
        id: "assign-1",
        userId: "current-user",
        seedProjectId: "taskflow-api-v1",
        type: "security_fix",
        title: "Add Input Validation",
        description: "The API currently accepts any input without validation. Add proper input validation to the task and user endpoints to prevent invalid data and potential security issues.",
        objectives: [
            { id: "obj-1", description: "Validate task creation input (title required, max 100 chars)", required: true, verificationMethod: "automated", weight: 30 },
            { id: "obj-2", description: "Validate user registration (email format, password min length)", required: true, verificationMethod: "automated", weight: 30 },
            { id: "obj-3", description: "Return meaningful validation error messages", required: true, verificationMethod: "llm_review", weight: 20 },
            { id: "obj-4", description: "Add validation tests", required: false, verificationMethod: "automated", weight: 20 },
        ],
        constraints: [
            "Do not break existing functionality",
            "Use a validation library (express-validator, joi, or zod)",
            "Keep changes focused on validation only",
        ],
        previousDevContext: "Alex built this quickly for a hackathon. They knew validation was missing but ran out of time. The API works but accepts literally anything, which is a security risk.",
        hints: [
            { id: "hint-1", revealOrder: 1, content: "Start with express-validator - it integrates nicely with Express", penaltyPercent: 5, revealed: false },
            { id: "hint-2", revealOrder: 2, content: "Check the express-validator docs for the validationResult function", penaltyPercent: 10, revealed: false },
        ],
        status: "not_started",
    },
    {
        id: "assign-2",
        userId: "current-user",
        seedProjectId: "taskflow-api-v1",
        type: "improve_perf",
        title: "Fix the N+1 Query Problem",
        description: "The GET /tasks endpoint makes a separate database query for each task to get the user name. Fix this performance issue using proper SQL joins.",
        objectives: [
            { id: "obj-1", description: "Eliminate N+1 queries in task listing", required: true, verificationMethod: "automated", weight: 50 },
            { id: "obj-2", description: "Maintain same API response format", required: true, verificationMethod: "automated", weight: 30 },
            { id: "obj-3", description: "Add performance test", required: false, verificationMethod: "automated", weight: 20 },
        ],
        constraints: [
            "Use a single SQL query with JOIN",
            "Keep the same response structure",
            "Don't introduce new dependencies",
        ],
        previousDevContext: "Alex didn't realize this was a problem during hackathon development with only 10 test tasks. With real data, this endpoint becomes unusably slow.",
        hints: [
            { id: "hint-1", revealOrder: 1, content: "Look up SQL LEFT JOIN syntax for PostgreSQL", penaltyPercent: 5, revealed: false },
        ],
        status: "not_started",
    },
];

// Get assignments for a project
export function getAssignmentsForProject(projectId: string): Assignment[] {
    return SAMPLE_ASSIGNMENTS.filter((a) => a.seedProjectId === projectId);
}

// Get assignment by ID
export function getAssignmentById(id: string): Assignment | null {
    return SAMPLE_ASSIGNMENTS.find((a) => a.id === id) || null;
}
