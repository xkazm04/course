/**
 * Knowledge Map Data Generator
 *
 * Generates hierarchical mock data for the knowledge map with
 * 5 levels: Domain -> Course -> Chapter -> Section -> Concept
 */

import {
    LEARNING_DOMAINS,
    type LearningDomainId,
    type DomainColorKey,
} from "@/app/shared/lib/learningDomains";
import type {
    MapNode,
    DomainNode,
    CourseNode,
    ChapterNode,
    SectionNode,
    ConceptNode,
    MapConnection,
    KnowledgeMapData,
    NodeStatus,
    DifficultyLevel,
    SectionType,
    ConceptType,
} from "./types";

// ============================================================================
// COURSE DATA DEFINITIONS
// ============================================================================

interface CourseDefinition {
    id: string;
    name: string;
    description: string;
    difficulty: DifficultyLevel;
    estimatedHours: number;
    skills: string[];
    chapters: ChapterDefinition[];
}

interface ChapterDefinition {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    xpReward: number;
    sections: SectionDefinition[];
}

interface SectionDefinition {
    id: string;
    name: string;
    description: string;
    type: SectionType;
    duration: string;
    concepts: ConceptDefinition[];
}

interface ConceptDefinition {
    id: string;
    name: string;
    type: ConceptType;
    content: string;
}

// ============================================================================
// MOCK COURSE DATA
// ============================================================================

const FRONTEND_COURSES: CourseDefinition[] = [
    {
        id: "html-css-fundamentals",
        name: "HTML & CSS Fundamentals",
        description: "Build the foundation of web development with HTML and CSS",
        difficulty: "beginner",
        estimatedHours: 20,
        skills: ["HTML5", "CSS3", "Responsive Design"],
        chapters: [
            {
                id: "html-basics",
                name: "HTML Basics",
                description: "Learn the building blocks of web pages",
                durationMinutes: 120,
                xpReward: 100,
                sections: [
                    { id: "what-is-html", name: "What is HTML?", description: "Introduction to HTML", type: "video", duration: "10 min", concepts: [
                        { id: "html-definition", name: "HTML Definition", type: "definition", content: "HTML stands for HyperText Markup Language" },
                        { id: "html-structure", name: "Document Structure", type: "example", content: "Basic HTML document structure" },
                    ]},
                    { id: "html-elements", name: "HTML Elements", description: "Understanding elements and tags", type: "lesson", duration: "15 min", concepts: [
                        { id: "element-anatomy", name: "Element Anatomy", type: "definition", content: "Opening tag, content, closing tag" },
                    ]},
                    { id: "html-practice", name: "Practice: First Page", description: "Create your first HTML page", type: "exercise", duration: "20 min", concepts: [] },
                ],
            },
            {
                id: "css-styling",
                name: "CSS Styling",
                description: "Style your web pages with CSS",
                durationMinutes: 150,
                xpReward: 150,
                sections: [
                    { id: "css-intro", name: "Introduction to CSS", description: "What is CSS?", type: "video", duration: "12 min", concepts: [] },
                    { id: "selectors", name: "CSS Selectors", description: "Targeting HTML elements", type: "lesson", duration: "20 min", concepts: [] },
                    { id: "box-model", name: "The Box Model", description: "Understanding layout", type: "interactive", duration: "15 min", concepts: [] },
                ],
            },
        ],
    },
    {
        id: "javascript-essentials",
        name: "JavaScript Essentials",
        description: "Master the language of the web",
        difficulty: "beginner",
        estimatedHours: 40,
        skills: ["JavaScript", "ES6+", "DOM Manipulation"],
        chapters: [
            {
                id: "js-fundamentals",
                name: "JavaScript Fundamentals",
                description: "Core JavaScript concepts",
                durationMinutes: 180,
                xpReward: 200,
                sections: [
                    { id: "variables", name: "Variables & Data Types", description: "Storing and manipulating data", type: "lesson", duration: "25 min", concepts: [] },
                    { id: "functions", name: "Functions", description: "Reusable code blocks", type: "lesson", duration: "30 min", concepts: [] },
                    { id: "control-flow", name: "Control Flow", description: "Conditions and loops", type: "interactive", duration: "25 min", concepts: [] },
                ],
            },
            {
                id: "dom-manipulation",
                name: "DOM Manipulation",
                description: "Interact with web pages",
                durationMinutes: 120,
                xpReward: 150,
                sections: [
                    { id: "dom-basics", name: "DOM Basics", description: "Understanding the DOM", type: "video", duration: "15 min", concepts: [] },
                    { id: "selecting-elements", name: "Selecting Elements", description: "querySelector and more", type: "lesson", duration: "20 min", concepts: [] },
                ],
            },
        ],
    },
    {
        id: "react-fundamentals",
        name: "React Fundamentals",
        description: "Build modern UIs with React",
        difficulty: "intermediate",
        estimatedHours: 35,
        skills: ["React", "JSX", "Hooks", "Components"],
        chapters: [
            {
                id: "react-intro",
                name: "Introduction to React",
                description: "Getting started with React",
                durationMinutes: 90,
                xpReward: 100,
                sections: [
                    { id: "what-is-react", name: "What is React?", description: "React overview", type: "video", duration: "12 min", concepts: [] },
                    { id: "jsx-basics", name: "JSX Basics", description: "Writing JSX", type: "lesson", duration: "20 min", concepts: [] },
                ],
            },
            {
                id: "components",
                name: "Components & Props",
                description: "Building reusable components",
                durationMinutes: 150,
                xpReward: 200,
                sections: [
                    { id: "creating-components", name: "Creating Components", description: "Functional components", type: "lesson", duration: "25 min", concepts: [] },
                    { id: "props", name: "Props", description: "Passing data", type: "interactive", duration: "20 min", concepts: [] },
                ],
            },
            {
                id: "hooks",
                name: "React Hooks",
                description: "State and effects",
                durationMinutes: 180,
                xpReward: 250,
                sections: [
                    { id: "usestate", name: "useState Hook", description: "Managing state", type: "lesson", duration: "25 min", concepts: [] },
                    { id: "useeffect", name: "useEffect Hook", description: "Side effects", type: "lesson", duration: "30 min", concepts: [] },
                    { id: "custom-hooks", name: "Custom Hooks", description: "Creating your own hooks", type: "exercise", duration: "40 min", concepts: [] },
                ],
            },
        ],
    },
];

const BACKEND_COURSES: CourseDefinition[] = [
    {
        id: "node-fundamentals",
        name: "Node.js Fundamentals",
        description: "Server-side JavaScript with Node.js",
        difficulty: "intermediate",
        estimatedHours: 30,
        skills: ["Node.js", "npm", "Express"],
        chapters: [
            {
                id: "node-intro",
                name: "Introduction to Node.js",
                description: "What is Node.js?",
                durationMinutes: 90,
                xpReward: 100,
                sections: [
                    { id: "node-overview", name: "Node.js Overview", description: "Server-side JavaScript", type: "video", duration: "15 min", concepts: [] },
                    { id: "npm-basics", name: "npm Basics", description: "Package management", type: "lesson", duration: "20 min", concepts: [] },
                ],
            },
            {
                id: "express-basics",
                name: "Express.js Basics",
                description: "Building web servers",
                durationMinutes: 150,
                xpReward: 150,
                sections: [
                    { id: "express-setup", name: "Express Setup", description: "Creating a server", type: "lesson", duration: "20 min", concepts: [] },
                    { id: "routing", name: "Routing", description: "Handling requests", type: "interactive", duration: "25 min", concepts: [] },
                    { id: "middleware", name: "Middleware", description: "Request processing", type: "lesson", duration: "30 min", concepts: [] },
                ],
            },
        ],
    },
    {
        id: "api-design",
        name: "REST API Design",
        description: "Design and build RESTful APIs",
        difficulty: "intermediate",
        estimatedHours: 25,
        skills: ["REST", "API Design", "Authentication"],
        chapters: [
            {
                id: "rest-principles",
                name: "REST Principles",
                description: "Understanding REST",
                durationMinutes: 90,
                xpReward: 100,
                sections: [
                    { id: "rest-intro", name: "What is REST?", description: "REST architecture", type: "video", duration: "15 min", concepts: [] },
                    { id: "http-methods", name: "HTTP Methods", description: "GET, POST, PUT, DELETE", type: "lesson", duration: "20 min", concepts: [] },
                ],
            },
        ],
    },
];

const FULLSTACK_COURSES: CourseDefinition[] = [
    {
        id: "nextjs-course",
        name: "Next.js Full Stack",
        description: "Build full-stack apps with Next.js",
        difficulty: "advanced",
        estimatedHours: 45,
        skills: ["Next.js", "Server Components", "App Router"],
        chapters: [
            {
                id: "nextjs-intro",
                name: "Next.js Introduction",
                description: "Getting started",
                durationMinutes: 120,
                xpReward: 150,
                sections: [
                    { id: "nextjs-overview", name: "Next.js Overview", description: "What is Next.js?", type: "video", duration: "20 min", concepts: [] },
                    { id: "app-router", name: "App Router", description: "File-based routing", type: "lesson", duration: "30 min", concepts: [] },
                ],
            },
            {
                id: "server-components",
                name: "Server Components",
                description: "RSC fundamentals",
                durationMinutes: 180,
                xpReward: 200,
                sections: [
                    { id: "rsc-intro", name: "RSC Introduction", description: "Server vs Client", type: "lesson", duration: "25 min", concepts: [] },
                    { id: "data-fetching", name: "Data Fetching", description: "Server-side data", type: "interactive", duration: "30 min", concepts: [] },
                ],
            },
        ],
    },
];

const DATABASE_COURSES: CourseDefinition[] = [
    {
        id: "sql-fundamentals",
        name: "SQL Fundamentals",
        description: "Master SQL queries",
        difficulty: "beginner",
        estimatedHours: 20,
        skills: ["SQL", "PostgreSQL", "Queries"],
        chapters: [
            {
                id: "sql-basics",
                name: "SQL Basics",
                description: "Introduction to SQL",
                durationMinutes: 120,
                xpReward: 100,
                sections: [
                    { id: "what-is-sql", name: "What is SQL?", description: "Database queries", type: "video", duration: "12 min", concepts: [] },
                    { id: "select-queries", name: "SELECT Queries", description: "Retrieving data", type: "lesson", duration: "25 min", concepts: [] },
                ],
            },
        ],
    },
];

const MOBILE_COURSES: CourseDefinition[] = [
    {
        id: "react-native",
        name: "React Native",
        description: "Build mobile apps with React Native",
        difficulty: "intermediate",
        estimatedHours: 40,
        skills: ["React Native", "Expo", "Mobile UI"],
        chapters: [
            {
                id: "rn-intro",
                name: "React Native Introduction",
                description: "Getting started",
                durationMinutes: 90,
                xpReward: 100,
                sections: [
                    { id: "rn-overview", name: "React Native Overview", description: "Cross-platform mobile", type: "video", duration: "15 min", concepts: [] },
                    { id: "expo-setup", name: "Expo Setup", description: "Development environment", type: "lesson", duration: "20 min", concepts: [] },
                ],
            },
        ],
    },
];

const GAMES_COURSES: CourseDefinition[] = [
    {
        id: "game-dev-basics",
        name: "Game Development Basics",
        description: "Introduction to game development",
        difficulty: "beginner",
        estimatedHours: 30,
        skills: ["Game Design", "Physics", "Graphics"],
        chapters: [
            {
                id: "game-intro",
                name: "Game Dev Introduction",
                description: "Getting started with games",
                durationMinutes: 90,
                xpReward: 100,
                sections: [
                    { id: "game-overview", name: "Game Development Overview", description: "What is game dev?", type: "video", duration: "15 min", concepts: [] },
                    { id: "game-loop", name: "The Game Loop", description: "Core game architecture", type: "lesson", duration: "25 min", concepts: [] },
                ],
            },
        ],
    },
];

const DOMAIN_COURSES: Record<LearningDomainId, CourseDefinition[]> = {
    frontend: FRONTEND_COURSES,
    backend: BACKEND_COURSES,
    fullstack: FULLSTACK_COURSES,
    databases: DATABASE_COURSES,
    mobile: MOBILE_COURSES,
    games: GAMES_COURSES,
};

// ============================================================================
// STATUS GENERATION
// ============================================================================

/**
 * Generate a realistic status for a node based on progress
 */
function generateStatus(progress: number, parentStatus?: NodeStatus): NodeStatus {
    if (parentStatus === "locked") return "locked";
    if (progress === 100) return "completed";
    if (progress > 0) return "in_progress";
    // Random chance to be locked if no progress
    if (Math.random() < 0.2) return "locked";
    return "available";
}

/**
 * Generate progress based on status
 */
function generateProgress(status: NodeStatus): number {
    switch (status) {
        case "completed": return 100;
        case "in_progress": return Math.floor(Math.random() * 80) + 10; // 10-90%
        case "available": return 0;
        case "locked": return 0;
    }
}

// ============================================================================
// DATA GENERATION
// ============================================================================

/**
 * Generate complete knowledge map data
 */
export function generateKnowledgeMapData(): KnowledgeMapData {
    const nodes = new Map<string, MapNode>();
    const connections: MapConnection[] = [];
    const rootNodeIds: string[] = [];

    // Generate domain nodes
    Object.entries(LEARNING_DOMAINS).forEach(([domainId, domain]) => {
        const courses = DOMAIN_COURSES[domainId as LearningDomainId] || [];
        const totalHours = courses.reduce((sum, c) => sum + c.estimatedHours, 0);

        // Calculate domain progress based on courses
        const courseProgresses = courses.map(() => {
            const status = generateStatus(Math.random() * 100);
            return generateProgress(status);
        });
        const avgProgress = courseProgresses.length > 0
            ? Math.round(courseProgresses.reduce((a, b) => a + b, 0) / courseProgresses.length)
            : 0;

        const domainNode: DomainNode = {
            id: `domain-${domainId}`,
            level: "domain",
            name: domain.name,
            description: domain.description,
            status: generateStatus(avgProgress),
            progress: avgProgress,
            parentId: null,
            childIds: courses.map(c => `course-${domainId}-${c.id}`),
            color: domain.color,
            domainId: domainId as LearningDomainId,
            estimatedHours: totalHours,
            courseCount: courses.length,
            totalHours,
            icon: domain.icon,
        };

        nodes.set(domainNode.id, domainNode);
        rootNodeIds.push(domainNode.id);

        // Generate course nodes
        courses.forEach((course, courseIndex) => {
            const courseId = `course-${domainId}-${course.id}`;
            const chapterIds = course.chapters.map(ch => `chapter-${domainId}-${course.id}-${ch.id}`);

            // Calculate course progress
            const chapterProgresses = course.chapters.map(() => {
                const status = generateStatus(Math.random() * 100);
                return generateProgress(status);
            });
            const courseProgress = chapterProgresses.length > 0
                ? Math.round(chapterProgresses.reduce((a, b) => a + b, 0) / chapterProgresses.length)
                : 0;

            const courseNode: CourseNode = {
                id: courseId,
                level: "course",
                name: course.name,
                description: course.description,
                status: generateStatus(courseProgress),
                progress: courseProgress,
                parentId: domainNode.id,
                childIds: chapterIds,
                color: domain.color,
                domainId: domainId as LearningDomainId,
                estimatedHours: course.estimatedHours,
                difficulty: course.difficulty,
                chapterCount: course.chapters.length,
                skills: course.skills,
            };

            nodes.set(courseId, courseNode);

            // Add connection from domain to course
            connections.push({
                id: `conn-${domainNode.id}-${courseId}`,
                fromId: domainNode.id,
                toId: courseId,
                type: "contains",
            });

            // Add prerequisite connections between courses
            if (courseIndex > 0) {
                const prevCourseId = `course-${domainId}-${courses[courseIndex - 1].id}`;
                connections.push({
                    id: `conn-${prevCourseId}-${courseId}`,
                    fromId: prevCourseId,
                    toId: courseId,
                    type: "prerequisite",
                });
            }

            // Generate chapter nodes
            course.chapters.forEach((chapter, chapterIndex) => {
                const chapterId = `chapter-${domainId}-${course.id}-${chapter.id}`;
                const sectionIds = chapter.sections.map(s => `section-${domainId}-${course.id}-${chapter.id}-${s.id}`);

                // Calculate chapter progress
                const sectionStatuses = chapter.sections.map(() => {
                    return Math.random() > 0.5 ? "completed" : "available";
                });
                const completedSections = sectionStatuses.filter(s => s === "completed").length;
                const chapterProgress = Math.round((completedSections / chapter.sections.length) * 100);

                const chapterNode: ChapterNode = {
                    id: chapterId,
                    level: "chapter",
                    name: chapter.name,
                    description: chapter.description,
                    status: generateStatus(chapterProgress),
                    progress: chapterProgress,
                    parentId: courseId,
                    childIds: sectionIds,
                    color: domain.color,
                    domainId: domainId as LearningDomainId,
                    courseId: course.id,
                    sectionCount: chapter.sections.length,
                    xpReward: chapter.xpReward,
                    durationMinutes: chapter.durationMinutes,
                };

                nodes.set(chapterId, chapterNode);

                // Add connection from course to chapter
                connections.push({
                    id: `conn-${courseId}-${chapterId}`,
                    fromId: courseId,
                    toId: chapterId,
                    type: "contains",
                });

                // Add next connections between chapters
                if (chapterIndex > 0) {
                    const prevChapterId = `chapter-${domainId}-${course.id}-${course.chapters[chapterIndex - 1].id}`;
                    connections.push({
                        id: `conn-${prevChapterId}-${chapterId}`,
                        fromId: prevChapterId,
                        toId: chapterId,
                        type: "next",
                    });
                }

                // Generate section nodes
                chapter.sections.forEach((section, sectionIndex) => {
                    const sectionId = `section-${domainId}-${course.id}-${chapter.id}-${section.id}`;
                    const conceptIds = section.concepts.map(c => `concept-${domainId}-${course.id}-${chapter.id}-${section.id}-${c.id}`);

                    const sectionStatus = sectionStatuses[sectionIndex] as NodeStatus;

                    const sectionNode: SectionNode = {
                        id: sectionId,
                        level: "section",
                        name: section.name,
                        description: section.description,
                        status: sectionStatus,
                        progress: sectionStatus === "completed" ? 100 : 0,
                        parentId: chapterId,
                        childIds: conceptIds,
                        color: domain.color,
                        domainId: domainId as LearningDomainId,
                        courseId: course.id,
                        chapterId: chapter.id,
                        sectionType: section.type,
                        duration: section.duration,
                    };

                    nodes.set(sectionId, sectionNode);

                    // Add connection from chapter to section
                    connections.push({
                        id: `conn-${chapterId}-${sectionId}`,
                        fromId: chapterId,
                        toId: sectionId,
                        type: "contains",
                    });

                    // Generate concept nodes
                    section.concepts.forEach((concept) => {
                        const conceptId = `concept-${domainId}-${course.id}-${chapter.id}-${section.id}-${concept.id}`;

                        const conceptNode: ConceptNode = {
                            id: conceptId,
                            level: "concept",
                            name: concept.name,
                            description: concept.content,
                            status: sectionStatus,
                            progress: sectionStatus === "completed" ? 100 : 0,
                            parentId: sectionId,
                            childIds: [],
                            color: domain.color,
                            domainId: domainId as LearningDomainId,
                            sectionId: section.id,
                            conceptType: concept.type,
                            content: concept.content,
                        };

                        nodes.set(conceptId, conceptNode);

                        // Add connection from section to concept
                        connections.push({
                            id: `conn-${sectionId}-${conceptId}`,
                            fromId: sectionId,
                            toId: conceptId,
                            type: "contains",
                        });
                    });
                });
            });
        });
    });

    // Add cross-domain related connections
    connections.push({
        id: "conn-frontend-fullstack-related",
        fromId: "domain-frontend",
        toId: "domain-fullstack",
        type: "related",
    });
    connections.push({
        id: "conn-backend-fullstack-related",
        fromId: "domain-backend",
        toId: "domain-fullstack",
        type: "related",
    });
    connections.push({
        id: "conn-databases-backend-related",
        fromId: "domain-databases",
        toId: "domain-backend",
        type: "related",
    });

    return {
        nodes,
        connections,
        rootNodeIds,
    };
}

/**
 * Get children of a node
 */
export function getNodeChildren(data: KnowledgeMapData, nodeId: string | null): MapNode[] {
    if (nodeId === null) {
        // Return root nodes (domains)
        return data.rootNodeIds.map(id => data.nodes.get(id)!).filter(Boolean);
    }

    const node = data.nodes.get(nodeId);
    if (!node) return [];

    return node.childIds.map(id => data.nodes.get(id)!).filter(Boolean);
}

/**
 * Get connections relevant to a set of visible nodes
 */
export function getVisibleConnections(
    data: KnowledgeMapData,
    visibleNodeIds: Set<string>
): MapConnection[] {
    return data.connections.filter(
        conn => visibleNodeIds.has(conn.fromId) && visibleNodeIds.has(conn.toId)
    );
}

/**
 * Get node by ID
 */
export function getNodeById(data: KnowledgeMapData, nodeId: string): MapNode | undefined {
    return data.nodes.get(nodeId);
}

/**
 * Get ancestor path to a node (for breadcrumb)
 */
export function getNodeAncestors(data: KnowledgeMapData, nodeId: string): MapNode[] {
    const ancestors: MapNode[] = [];
    let currentNode = data.nodes.get(nodeId);

    while (currentNode?.parentId) {
        const parent = data.nodes.get(currentNode.parentId);
        if (parent) {
            ancestors.unshift(parent);
            currentNode = parent;
        } else {
            break;
        }
    }

    return ancestors;
}
