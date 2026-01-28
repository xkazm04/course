#!/usr/bin/env npx tsx
/**
 * Seed Curated Learning Paths
 *
 * Creates 20 learning paths with lesson mappings based on the curriculum.
 * Run: npx tsx scripts/seed-learning-paths.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface LessonNode {
    id: string;
    slug: string;
    name: string;
    parent_id: string | null;
    depth: number;
    difficulty: string | null;
    estimated_hours: number | null;
}

interface AreaNode {
    id: string;
    slug: string;
    name: string;
    parent_id: string | null;
}

interface SkillNode {
    id: string;
    slug: string;
    name: string;
    parent_id: string | null;
}

interface TopicNode {
    id: string;
    slug: string;
    name: string;
}

interface PathDefinition {
    slug: string;
    title: string;
    subtitle: string;
    description: string;
    path_type: string;
    scope: string;
    difficulty: string;
    icon: string;
    color: string;
    target_audience: string[];
    prerequisites: string[];
    learning_outcomes: string[];
    estimated_weeks: number;
    is_official: boolean;
    is_featured: boolean;
    lessons: {
        slug: string;
        module: string;
        moduleOrder: number;
        isRequired: boolean;
        isCheckpoint: boolean;
        milestoneTitle?: string;
        contextNotes?: string;
    }[];
}

async function main() {
    console.log("\n🎯 Seeding Curated Learning Paths\n");

    // Fetch curriculum structure
    const { data: nodes, error } = await supabase
        .from("map_nodes")
        .select("id, slug, name, parent_id, depth, difficulty, estimated_hours, node_type")
        .eq("domain_id", "frontend")
        .order("depth")
        .order("sort_order");

    if (error || !nodes) {
        console.error("Failed to fetch nodes:", error?.message);
        process.exit(1);
    }

    const topics = nodes.filter(n => n.depth === 1) as TopicNode[];
    const skills = nodes.filter(n => n.depth === 2) as SkillNode[];
    const areas = nodes.filter(n => n.depth === 3) as AreaNode[];
    const lessons = nodes.filter(n => n.depth === 4) as LessonNode[];

    console.log(`Found: ${topics.length} topics, ${skills.length} skills, ${areas.length} areas, ${lessons.length} lessons\n`);

    // Create lookup maps
    const lessonBySlug = new Map(lessons.map(l => [l.slug, l]));
    const areaById = new Map(areas.map(a => [a.id, a]));
    const skillById = new Map(skills.map(s => [s.id, s]));
    const topicById = new Map(topics.map(t => [t.id, t]));

    // Helper to get lessons by area slug pattern
    const getLessonsByAreaSlug = (areaSlugPattern: string): LessonNode[] => {
        return lessons.filter(l => {
            const area = areaById.get(l.parent_id || "");
            return area && area.slug.includes(areaSlugPattern);
        });
    };

    // Helper to get lessons by skill slug
    const getLessonsBySkillSlug = (skillSlugPattern: string): LessonNode[] => {
        return lessons.filter(l => {
            const area = areaById.get(l.parent_id || "");
            if (!area) return false;
            const skill = skillById.get(area.parent_id || "");
            return skill && skill.slug.includes(skillSlugPattern);
        });
    };

    // Helper to get lessons by topic slug
    const getLessonsByTopicSlug = (topicSlugPattern: string): LessonNode[] => {
        return lessons.filter(l => {
            const area = areaById.get(l.parent_id || "");
            if (!area) return false;
            const skill = skillById.get(area.parent_id || "");
            if (!skill) return false;
            const topic = topicById.get(skill.parent_id || "");
            return topic && topic.slug.includes(topicSlugPattern);
        });
    };

    // Define the 20 learning paths
    const paths: PathDefinition[] = [
        // =========================================================================
        // 1. FULL CURRICULUM PATHS
        // =========================================================================
        {
            slug: "frontend-zero-to-hero",
            title: "Frontend Developer: Zero to Hero",
            subtitle: "Complete journey from HTML basics to production React apps",
            description: "The ultimate frontend development path. Start with HTML & CSS fundamentals, master JavaScript, learn TypeScript, build with React and Next.js, and finish with testing. This comprehensive curriculum takes you from complete beginner to job-ready frontend developer.",
            path_type: "full-curriculum",
            scope: "beginner-to-pro",
            difficulty: "mixed",
            icon: "rocket",
            color: "#8B5CF6",
            target_audience: ["Complete beginners", "Career changers", "Self-taught developers seeking structure"],
            prerequisites: ["No prior coding experience required", "Basic computer skills"],
            learning_outcomes: [
                "Build production-ready web applications",
                "Write type-safe code with TypeScript",
                "Create interactive UIs with React",
                "Deploy full-stack apps with Next.js",
                "Write comprehensive tests"
            ],
            estimated_weeks: 24,
            is_official: true,
            is_featured: true,
            lessons: [
                // Module 1: HTML Foundations (Week 1-2)
                ...getLessonsByTopicSlug("html-css").slice(0, 25).map((l, i) => ({
                    slug: l.slug,
                    module: "HTML & CSS Foundations",
                    moduleOrder: 1,
                    isRequired: true,
                    isCheckpoint: i === 24,
                    milestoneTitle: i === 24 ? "CSS Layout Master" : undefined,
                })),
                // Module 2: JavaScript (Week 3-6)
                ...getLessonsByTopicSlug("javascript").map((l, i) => ({
                    slug: l.slug,
                    module: "JavaScript Mastery",
                    moduleOrder: 2,
                    isRequired: true,
                    isCheckpoint: i === getLessonsByTopicSlug("javascript").length - 1,
                    milestoneTitle: i === getLessonsByTopicSlug("javascript").length - 1 ? "JavaScript Developer" : undefined,
                })),
                // Module 3: TypeScript (Week 7-9)
                ...getLessonsByTopicSlug("typescript").map((l, i) => ({
                    slug: l.slug,
                    module: "TypeScript Professional",
                    moduleOrder: 3,
                    isRequired: true,
                    isCheckpoint: i === getLessonsByTopicSlug("typescript").length - 1,
                    milestoneTitle: i === getLessonsByTopicSlug("typescript").length - 1 ? "Type-Safe Coder" : undefined,
                })),
                // Module 4: React (Week 10-13)
                ...getLessonsByTopicSlug("react").map((l, i) => ({
                    slug: l.slug,
                    module: "React Ecosystem",
                    moduleOrder: 4,
                    isRequired: true,
                    isCheckpoint: i === getLessonsByTopicSlug("react").length - 1,
                    milestoneTitle: i === getLessonsByTopicSlug("react").length - 1 ? "React Developer" : undefined,
                })),
                // Module 5: Next.js (Week 14-17)
                ...getLessonsByTopicSlug("nextjs").map((l, i) => ({
                    slug: l.slug,
                    module: "Next.js Fullstack",
                    moduleOrder: 5,
                    isRequired: true,
                    isCheckpoint: i === getLessonsByTopicSlug("nextjs").length - 1,
                    milestoneTitle: i === getLessonsByTopicSlug("nextjs").length - 1 ? "Fullstack Developer" : undefined,
                })),
                // Module 6: Testing (Week 18-20)
                ...getLessonsByTopicSlug("testing").map((l, i) => ({
                    slug: l.slug,
                    module: "Frontend Testing",
                    moduleOrder: 6,
                    isRequired: false,
                    isCheckpoint: i === getLessonsByTopicSlug("testing").length - 1,
                    milestoneTitle: i === getLessonsByTopicSlug("testing").length - 1 ? "Quality Engineer" : undefined,
                })),
            ],
        },

        {
            slug: "modern-react-developer",
            title: "Modern React Developer",
            subtitle: "Complete React + Next.js mastery path",
            description: "Deep dive into the React ecosystem. Master React fundamentals, hooks, state management, forms, and graduate to building production apps with Next.js. Includes TypeScript integration throughout.",
            path_type: "full-curriculum",
            scope: "intermediate-boost",
            difficulty: "intermediate",
            icon: "atom",
            color: "#61DAFB",
            target_audience: ["JavaScript developers", "Backend devs learning frontend", "jQuery-era developers modernizing"],
            prerequisites: ["Solid JavaScript fundamentals", "Basic HTML/CSS knowledge"],
            learning_outcomes: [
                "Build complex React applications",
                "Master React hooks and patterns",
                "Implement state management solutions",
                "Create full-stack apps with Next.js",
                "Handle forms and validation"
            ],
            estimated_weeks: 12,
            is_official: true,
            is_featured: true,
            lessons: [
                // Core React
                ...getLessonsByTopicSlug("react").map((l, i) => ({
                    slug: l.slug,
                    module: "React Fundamentals & Hooks",
                    moduleOrder: 1,
                    isRequired: true,
                    isCheckpoint: l.slug.includes("custom-hooks") || l.slug.includes("context"),
                })),
                // Next.js
                ...getLessonsByTopicSlug("nextjs").map((l, i) => ({
                    slug: l.slug,
                    module: "Next.js Production",
                    moduleOrder: 2,
                    isRequired: true,
                    isCheckpoint: l.slug.includes("server-action") || l.slug.includes("optimization"),
                })),
            ],
        },

        {
            slug: "javascript-complete",
            title: "JavaScript: Fundamentals to Advanced",
            subtitle: "Complete JavaScript journey for all levels",
            description: "Master JavaScript from variables to async patterns. This comprehensive path covers fundamentals, functions, objects, arrays, DOM manipulation, and asynchronous programming. Build a solid foundation for any JS framework.",
            path_type: "full-curriculum",
            scope: "beginner-to-pro",
            difficulty: "mixed",
            icon: "braces",
            color: "#F7DF1E",
            target_audience: ["Beginners to JavaScript", "Developers from other languages", "Those wanting JS depth"],
            prerequisites: ["Basic HTML knowledge helpful", "No JS experience required"],
            learning_outcomes: [
                "Write clean, modern JavaScript",
                "Understand closures and scope",
                "Master async/await patterns",
                "Manipulate the DOM effectively",
                "Work with arrays and objects fluently"
            ],
            estimated_weeks: 10,
            is_official: true,
            is_featured: false,
            lessons: getLessonsByTopicSlug("javascript").map((l, i, arr) => ({
                slug: l.slug,
                module: getJSModule(l.slug),
                moduleOrder: getJSModuleOrder(l.slug),
                isRequired: true,
                isCheckpoint: i === arr.length - 1 || l.slug.includes("promise-all") || l.slug.includes("event-delegation"),
            })),
        },

        // =========================================================================
        // 2. QUICK-START PATHS
        // =========================================================================
        {
            slug: "react-two-weeks",
            title: "React in 2 Weeks",
            subtitle: "Get productive with React fast",
            description: "A focused, practical introduction to React. Learn the essential concepts—components, props, state, hooks, and effects—through hands-on examples. Skip the theory overload and start building.",
            path_type: "quick-start",
            scope: "quick-wins",
            difficulty: "intermediate",
            icon: "zap",
            color: "#61DAFB",
            target_audience: ["Developers needing React quickly", "Those with JS background", "Bootcamp students"],
            prerequisites: ["JavaScript ES6+ knowledge", "HTML/CSS basics"],
            learning_outcomes: [
                "Create React components",
                "Manage state with useState",
                "Handle side effects with useEffect",
                "Build forms in React",
                "Structure a React application"
            ],
            estimated_weeks: 2,
            is_official: true,
            is_featured: true,
            lessons: [
                // Core JSX and components
                { slug: "jsx-syntax", module: "Week 1: Foundations", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "functional-components", module: "Week 1: Foundations", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "children-prop", module: "Week 1: Foundations", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "passing-props", module: "Week 1: Foundations", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "state-updates", module: "Week 1: Foundations", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "conditional-rendering", module: "Week 1: Foundations", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "rendering-lists", module: "Week 1: Foundations", moduleOrder: 1, isRequired: true, isCheckpoint: true, milestoneTitle: "Component Builder" },
                // Hooks
                { slug: "usestate-hook", module: "Week 2: Hooks & Patterns", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "useeffect-hook", module: "Week 2: Hooks & Patterns", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "useref-hook", module: "Week 2: Hooks & Patterns", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "usecontext-hook", module: "Week 2: Hooks & Patterns", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "lifting-state-up", module: "Week 2: Hooks & Patterns", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "controlled-inputs", module: "Week 2: Hooks & Patterns", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "form-submission", module: "Week 2: Hooks & Patterns", moduleOrder: 2, isRequired: true, isCheckpoint: true, milestoneTitle: "React Ready" },
            ],
        },

        {
            slug: "typescript-essentials",
            title: "TypeScript Essentials",
            subtitle: "Core TypeScript for JavaScript developers",
            description: "Learn TypeScript fundamentals quickly. Cover types, interfaces, generics, and practical patterns. Perfect for JS developers wanting type safety without the deep dive.",
            path_type: "quick-start",
            scope: "quick-wins",
            difficulty: "intermediate",
            icon: "shield-check",
            color: "#3178C6",
            target_audience: ["JavaScript developers", "Those joining TS codebases", "Developers wanting type safety"],
            prerequisites: ["JavaScript proficiency", "ES6+ features knowledge"],
            learning_outcomes: [
                "Add types to JavaScript code",
                "Create interfaces and type aliases",
                "Use generics effectively",
                "Handle union types and narrowing",
                "Configure TypeScript projects"
            ],
            estimated_weeks: 2,
            is_official: true,
            is_featured: false,
            lessons: [
                { slug: "why-typescript", module: "Core Types", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "type-annotations", module: "Core Types", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "primitive-types", module: "Core Types", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "arrays-tuples", module: "Core Types", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "any-unknown-never", module: "Core Types", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "object-type-literals", module: "Object Types", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "interface-basics", module: "Object Types", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "type-aliases", module: "Object Types", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "optional-properties", module: "Object Types", moduleOrder: 2, isRequired: true, isCheckpoint: true, milestoneTitle: "Type Foundations" },
                { slug: "union-types", module: "Advanced Patterns", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "type-narrowing", module: "Advanced Patterns", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "generic-basics", module: "Advanced Patterns", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "generic-constraints", module: "Advanced Patterns", moduleOrder: 3, isRequired: true, isCheckpoint: true, milestoneTitle: "TypeScript Ready" },
            ],
        },

        {
            slug: "tailwind-crash-course",
            title: "Tailwind CSS Crash Course",
            subtitle: "Utility-first styling in a weekend",
            description: "Learn Tailwind CSS fast. Master utility classes, responsive design, and common patterns. Build beautiful UIs without writing custom CSS.",
            path_type: "quick-start",
            scope: "quick-wins",
            difficulty: "beginner",
            icon: "wind",
            color: "#06B6D4",
            target_audience: ["Developers new to Tailwind", "CSS-fatigued developers", "React/Next.js developers"],
            prerequisites: ["Basic CSS knowledge", "HTML fundamentals"],
            learning_outcomes: [
                "Style with utility classes",
                "Build responsive layouts",
                "Use Tailwind's design system",
                "Create common UI patterns",
                "Customize Tailwind config"
            ],
            estimated_weeks: 1,
            is_official: true,
            is_featured: false,
            lessons: getLessonsByTopicSlug("css-styling").filter(l =>
                l.slug.includes("tailwind") || l.slug.includes("utility")
            ).map((l, i, arr) => ({
                slug: l.slug,
                module: "Tailwind Fundamentals",
                moduleOrder: 1,
                isRequired: true,
                isCheckpoint: i === arr.length - 1,
                milestoneTitle: i === arr.length - 1 ? "Tailwind Ready" : undefined,
            })),
        },

        {
            slug: "nextjs-app-router-bootcamp",
            title: "Next.js App Router Bootcamp",
            subtitle: "Modern Next.js 14+ development",
            description: "Master the Next.js App Router. Learn server components, data fetching, server actions, and deployment. Build production-ready full-stack applications.",
            path_type: "quick-start",
            scope: "intermediate-boost",
            difficulty: "intermediate",
            icon: "layout-template",
            color: "#000000",
            target_audience: ["React developers", "Those migrating from Pages Router", "Full-stack aspirants"],
            prerequisites: ["React fundamentals", "JavaScript/TypeScript knowledge"],
            learning_outcomes: [
                "Structure App Router projects",
                "Implement server components",
                "Fetch data on the server",
                "Create API routes and server actions",
                "Optimize for production"
            ],
            estimated_weeks: 3,
            is_official: true,
            is_featured: true,
            lessons: getLessonsByTopicSlug("nextjs").map((l, i, arr) => ({
                slug: l.slug,
                module: getNextJSModule(l.slug),
                moduleOrder: getNextJSModuleOrder(l.slug),
                isRequired: true,
                isCheckpoint: l.slug.includes("server-action") || l.slug.includes("optimization") || i === arr.length - 1,
            })),
        },

        // =========================================================================
        // 3. DEEP-DIVE PATHS
        // =========================================================================
        {
            slug: "advanced-typescript-patterns",
            title: "Advanced TypeScript Patterns",
            subtitle: "Master generics, utility types, and conditional types",
            description: "Go beyond TypeScript basics. Learn advanced generics, mapped types, conditional types, and patterns used in production libraries. Become the TypeScript expert on your team.",
            path_type: "deep-dive",
            scope: "advanced-mastery",
            difficulty: "advanced",
            icon: "puzzle",
            color: "#3178C6",
            target_audience: ["Intermediate TypeScript users", "Library authors", "Tech leads"],
            prerequisites: ["TypeScript fundamentals", "Generics basics"],
            learning_outcomes: [
                "Create complex generic types",
                "Build custom utility types",
                "Use conditional types effectively",
                "Type advanced patterns",
                "Understand type inference"
            ],
            estimated_weeks: 4,
            is_official: true,
            is_featured: false,
            lessons: [
                { slug: "generic-constraints", module: "Advanced Generics", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "generic-inference", module: "Advanced Generics", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "default-type-parameters", module: "Advanced Generics", moduleOrder: 1, isRequired: true, isCheckpoint: true, milestoneTitle: "Generics Master" },
                { slug: "mapped-types", module: "Type Manipulation", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "conditional-types", module: "Type Manipulation", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "template-literal-types", module: "Type Manipulation", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "utility-types-deep-dive", module: "Type Manipulation", moduleOrder: 2, isRequired: true, isCheckpoint: true, milestoneTitle: "Type Wizard" },
                { slug: "discriminated-unions", module: "Patterns", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "exhaustiveness-checking", module: "Patterns", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "intersection-types", module: "Patterns", moduleOrder: 3, isRequired: true, isCheckpoint: true, milestoneTitle: "TypeScript Expert" },
            ],
        },

        {
            slug: "react-performance-mastery",
            title: "React Performance Mastery",
            subtitle: "Optimize React apps for speed",
            description: "Deep dive into React performance. Learn memoization, code splitting, virtualization, and profiling. Make your React apps lightning fast.",
            path_type: "deep-dive",
            scope: "performance-package",
            difficulty: "advanced",
            icon: "gauge",
            color: "#FF4154",
            target_audience: ["React developers", "Performance engineers", "Senior frontend devs"],
            prerequisites: ["React hooks proficiency", "Component patterns knowledge"],
            learning_outcomes: [
                "Profile React applications",
                "Implement effective memoization",
                "Code-split strategically",
                "Virtualize long lists",
                "Optimize re-renders"
            ],
            estimated_weeks: 3,
            is_official: true,
            is_featured: false,
            lessons: [
                { slug: "react-memo", module: "Memoization", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "usememo-hook", module: "Memoization", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "usecallback-hook", module: "Memoization", moduleOrder: 1, isRequired: true, isCheckpoint: true, milestoneTitle: "Memo Master" },
                { slug: "code-splitting", module: "Loading Optimization", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "lazy-loading", module: "Loading Optimization", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "suspense-boundaries", module: "Loading Optimization", moduleOrder: 2, isRequired: true, isCheckpoint: true, milestoneTitle: "Load Optimizer" },
                { slug: "static-dynamic-rendering", module: "Next.js Performance", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "image-optimization", module: "Next.js Performance", moduleOrder: 3, isRequired: true, isCheckpoint: true, milestoneTitle: "Performance Expert" },
            ],
        },

        {
            slug: "css-layout-masterclass",
            title: "CSS Layout Masterclass",
            subtitle: "Master Flexbox and Grid completely",
            description: "Become a CSS layout expert. Deep dive into Flexbox and Grid, understand the mental models, and build any layout with confidence.",
            path_type: "deep-dive",
            scope: "advanced-mastery",
            difficulty: "intermediate",
            icon: "layout-grid",
            color: "#264DE4",
            target_audience: ["Frontend developers", "Those struggling with layouts", "CSS learners"],
            prerequisites: ["Basic CSS knowledge", "Box model understanding"],
            learning_outcomes: [
                "Build any layout with Flexbox",
                "Create complex Grid layouts",
                "Choose the right approach",
                "Handle responsive design",
                "Solve common layout problems"
            ],
            estimated_weeks: 3,
            is_official: true,
            is_featured: false,
            lessons: getLessonsBySkillSlug("css-layout").map((l, i, arr) => ({
                slug: l.slug,
                module: l.slug.includes("flex") ? "Flexbox Deep Dive" : l.slug.includes("grid") ? "Grid Deep Dive" : "Responsive Patterns",
                moduleOrder: l.slug.includes("flex") ? 1 : l.slug.includes("grid") ? 2 : 3,
                isRequired: true,
                isCheckpoint: l.slug.includes("alignment") || i === arr.length - 1,
            })),
        },

        {
            slug: "async-javascript-deep-dive",
            title: "Async JavaScript Deep Dive",
            subtitle: "Master promises, async/await, and patterns",
            description: "Understand asynchronous JavaScript completely. From callbacks to async/await, learn the patterns that power modern JavaScript applications.",
            path_type: "deep-dive",
            scope: "intermediate-boost",
            difficulty: "intermediate",
            icon: "clock",
            color: "#F7DF1E",
            target_audience: ["JavaScript developers", "Those confused by async", "Backend devs learning JS"],
            prerequisites: ["JavaScript basics", "Functions and callbacks"],
            learning_outcomes: [
                "Understand the event loop",
                "Work with Promises fluently",
                "Use async/await effectively",
                "Handle errors properly",
                "Implement common async patterns"
            ],
            estimated_weeks: 2,
            is_official: true,
            is_featured: false,
            lessons: getLessonsBySkillSlug("async").map((l, i, arr) => ({
                slug: l.slug,
                module: l.slug.includes("promise") ? "Promises" : l.slug.includes("async") ? "Async/Await" : "Patterns",
                moduleOrder: l.slug.includes("callback") ? 1 : l.slug.includes("promise") ? 2 : 3,
                isRequired: true,
                isCheckpoint: l.slug.includes("parallel") || l.slug.includes("race") || i === arr.length - 1,
            })),
        },

        // =========================================================================
        // 4. PROJECT-FOCUSED PATHS
        // =========================================================================
        {
            slug: "build-saas-dashboard",
            title: "Build a SaaS Dashboard",
            subtitle: "React + Next.js + Tailwind project path",
            description: "Learn by building a real SaaS dashboard. Cover authentication layouts, data tables, charts integration, and responsive design. Apply your React and Next.js knowledge to a production project.",
            path_type: "project-focused",
            scope: "intermediate-boost",
            difficulty: "intermediate",
            icon: "layout-dashboard",
            color: "#8B5CF6",
            target_audience: ["React developers", "Full-stack aspirants", "Product builders"],
            prerequisites: ["React basics", "JavaScript proficiency"],
            learning_outcomes: [
                "Structure a dashboard application",
                "Implement responsive layouts",
                "Create reusable UI components",
                "Handle data fetching patterns",
                "Style with Tailwind CSS"
            ],
            estimated_weeks: 4,
            is_official: true,
            is_featured: false,
            lessons: [
                // Layout foundations
                { slug: "flexbox-container", module: "Layout Foundation", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "grid-basics", module: "Layout Foundation", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "responsive-design-principles", module: "Layout Foundation", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "flexbox-grid-tailwind", module: "Layout Foundation", moduleOrder: 1, isRequired: true, isCheckpoint: true, milestoneTitle: "Layout Ready" },
                // Components
                { slug: "functional-components", module: "Component Building", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "passing-props", module: "Component Building", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "children-prop", module: "Component Building", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "conditional-rendering", module: "Component Building", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "rendering-lists", module: "Component Building", moduleOrder: 2, isRequired: true, isCheckpoint: true, milestoneTitle: "Component Builder" },
                // State & Data
                { slug: "usestate-hook", module: "State & Data", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "useeffect-hook", module: "State & Data", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "server-data-fetching", module: "State & Data", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "loading-states", module: "State & Data", moduleOrder: 3, isRequired: true, isCheckpoint: true, milestoneTitle: "Data Handler" },
                // Polish
                { slug: "tailwind-navigation", module: "UI Polish", moduleOrder: 4, isRequired: true, isCheckpoint: false },
                { slug: "spacing-sizing", module: "UI Polish", moduleOrder: 4, isRequired: true, isCheckpoint: false },
                { slug: "hover-focus-states", module: "UI Polish", moduleOrder: 4, isRequired: true, isCheckpoint: true, milestoneTitle: "Dashboard Builder" },
            ],
        },

        {
            slug: "ecommerce-frontend",
            title: "E-commerce Frontend",
            subtitle: "Build a complete shop frontend",
            description: "Build an e-commerce frontend from scratch. Product listings, cart functionality, checkout forms, and payment integration patterns. Learn real-world React patterns.",
            path_type: "project-focused",
            scope: "intermediate-boost",
            difficulty: "intermediate",
            icon: "shopping-cart",
            color: "#10B981",
            target_audience: ["React developers", "E-commerce builders", "Startup developers"],
            prerequisites: ["React fundamentals", "Basic state management"],
            learning_outcomes: [
                "Build product listing pages",
                "Implement shopping cart logic",
                "Create checkout flows",
                "Handle form validation",
                "Manage complex state"
            ],
            estimated_weeks: 4,
            is_official: true,
            is_featured: false,
            lessons: [
                // Product Display
                { slug: "rendering-lists", module: "Product Catalog", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "grid-basics", module: "Product Catalog", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "responsive-images", module: "Product Catalog", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "conditional-rendering", module: "Product Catalog", moduleOrder: 1, isRequired: true, isCheckpoint: true, milestoneTitle: "Product Display" },
                // Cart & State
                { slug: "usestate-hook", module: "Cart Functionality", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "usereducer-basics", module: "Cart Functionality", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "context-basics", module: "Cart Functionality", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "context-with-reducer", module: "Cart Functionality", moduleOrder: 2, isRequired: true, isCheckpoint: true, milestoneTitle: "Cart Logic" },
                // Checkout & Forms
                { slug: "controlled-inputs", module: "Checkout Flow", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "form-submission", module: "Checkout Flow", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "rhf-basics", module: "Checkout Flow", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "rhf-zod-integration", module: "Checkout Flow", moduleOrder: 3, isRequired: true, isCheckpoint: true, milestoneTitle: "Checkout Ready" },
                // API & Server
                { slug: "route-handlers-basics", module: "Backend Integration", moduleOrder: 4, isRequired: true, isCheckpoint: false },
                { slug: "server-actions-basics", module: "Backend Integration", moduleOrder: 4, isRequired: true, isCheckpoint: false },
                { slug: "server-action-validation", module: "Backend Integration", moduleOrder: 4, isRequired: true, isCheckpoint: true, milestoneTitle: "Full Stack E-commerce" },
            ],
        },

        {
            slug: "interactive-portfolio",
            title: "Interactive Portfolio Site",
            subtitle: "Animations + responsive design",
            description: "Build a stunning portfolio website. Learn CSS animations, Framer Motion, responsive design, and create an impressive online presence.",
            path_type: "project-focused",
            scope: "beginner-friendly",
            difficulty: "beginner",
            icon: "sparkles",
            color: "#EC4899",
            target_audience: ["Developers building portfolios", "Designers learning code", "Job seekers"],
            prerequisites: ["HTML/CSS basics", "Some JavaScript knowledge"],
            learning_outcomes: [
                "Create responsive layouts",
                "Implement CSS animations",
                "Add interactive elements",
                "Optimize for all devices",
                "Deploy a live site"
            ],
            estimated_weeks: 3,
            is_official: true,
            is_featured: false,
            lessons: [
                // Structure
                { slug: "semantic-structure", module: "Site Structure", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "navigation-elements", module: "Site Structure", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "aside-figure-figcaption", module: "Site Structure", moduleOrder: 1, isRequired: true, isCheckpoint: true, milestoneTitle: "Semantic HTML" },
                // Layout
                { slug: "flexbox-container", module: "Responsive Layout", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "grid-basics", module: "Responsive Layout", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "responsive-design-principles", module: "Responsive Layout", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "responsive-images", module: "Responsive Layout", moduleOrder: 2, isRequired: true, isCheckpoint: true, milestoneTitle: "Responsive Ready" },
                // Styling
                { slug: "color-values", module: "Visual Design", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "web-fonts-google-fonts", module: "Visual Design", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "spacing-sizing", module: "Visual Design", moduleOrder: 3, isRequired: true, isCheckpoint: true, milestoneTitle: "Styled" },
                // Animation
                { slug: "transition-basics", module: "Animations", moduleOrder: 4, isRequired: true, isCheckpoint: false },
                { slug: "keyframe-basics", module: "Animations", moduleOrder: 4, isRequired: true, isCheckpoint: false },
                { slug: "common-animation-patterns", module: "Animations", moduleOrder: 4, isRequired: true, isCheckpoint: false },
                { slug: "framer-motion-basics", module: "Animations", moduleOrder: 4, isRequired: true, isCheckpoint: true, milestoneTitle: "Animated Portfolio" },
            ],
        },

        // =========================================================================
        // 5. CAREER/ROLE PATHS
        // =========================================================================
        {
            slug: "junior-frontend-interview-prep",
            title: "Junior Frontend Interview Prep",
            subtitle: "Get ready for your first frontend job",
            description: "Prepare for junior frontend developer interviews. Cover the fundamentals interviewers expect: HTML semantics, CSS layouts, JavaScript core concepts, and React basics.",
            path_type: "career-prep",
            scope: "interview-prep",
            difficulty: "intermediate",
            icon: "briefcase",
            color: "#6366F1",
            target_audience: ["Job seekers", "Bootcamp graduates", "Career changers"],
            prerequisites: ["Basic web development knowledge", "Some project experience"],
            learning_outcomes: [
                "Explain HTML semantics",
                "Solve CSS layout challenges",
                "Answer JavaScript questions",
                "Demonstrate React knowledge",
                "Build sample projects"
            ],
            estimated_weeks: 4,
            is_official: true,
            is_featured: true,
            lessons: [
                // HTML Interview Topics
                { slug: "semantic-structure", module: "HTML Fundamentals", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "navigation-elements", module: "HTML Fundamentals", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "form-validation-html5", module: "HTML Fundamentals", moduleOrder: 1, isRequired: true, isCheckpoint: true, milestoneTitle: "HTML Ready" },
                // CSS Interview Topics
                { slug: "box-model", module: "CSS Concepts", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "specificity-calculation", module: "CSS Concepts", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "flexbox-container", module: "CSS Concepts", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "grid-basics", module: "CSS Concepts", moduleOrder: 2, isRequired: true, isCheckpoint: true, milestoneTitle: "CSS Ready" },
                // JavaScript Interview Topics
                { slug: "primitive-types-js", module: "JavaScript Core", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "scope-fundamentals", module: "JavaScript Core", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "closure-basics", module: "JavaScript Core", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "this-keyword", module: "JavaScript Core", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "promise-basics", module: "JavaScript Core", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "async-await-basics", module: "JavaScript Core", moduleOrder: 3, isRequired: true, isCheckpoint: true, milestoneTitle: "JS Ready" },
                // React Interview Topics
                { slug: "jsx-syntax", module: "React Essentials", moduleOrder: 4, isRequired: true, isCheckpoint: false },
                { slug: "usestate-hook", module: "React Essentials", moduleOrder: 4, isRequired: true, isCheckpoint: false },
                { slug: "useeffect-hook", module: "React Essentials", moduleOrder: 4, isRequired: true, isCheckpoint: false },
                { slug: "lifting-state-up", module: "React Essentials", moduleOrder: 4, isRequired: true, isCheckpoint: true, milestoneTitle: "Interview Ready" },
            ],
        },

        {
            slug: "backend-to-frontend",
            title: "Backend Dev → Frontend Transition",
            subtitle: "Leverage your backend skills in frontend",
            description: "For backend developers learning frontend. Skip the basics you know, focus on visual thinking, component architecture, and state management patterns familiar from backend.",
            path_type: "career-prep",
            scope: "career-transition",
            difficulty: "intermediate",
            icon: "arrow-right-left",
            color: "#F59E0B",
            target_audience: ["Backend developers", "Full-stack aspirants", "API developers"],
            prerequisites: ["Programming experience", "API knowledge", "Basic HTML"],
            learning_outcomes: [
                "Think in components",
                "Manage frontend state",
                "Handle async UI patterns",
                "Build type-safe frontends",
                "Connect to your APIs"
            ],
            estimated_weeks: 6,
            is_official: true,
            is_featured: false,
            lessons: [
                // Quick CSS (you know logic, need visual)
                { slug: "flexbox-container", module: "Visual Foundations", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "grid-basics", module: "Visual Foundations", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "responsive-design-principles", module: "Visual Foundations", moduleOrder: 1, isRequired: true, isCheckpoint: true, milestoneTitle: "Layout Ready" },
                // TypeScript (familiar territory)
                { slug: "type-annotations", module: "TypeScript Comfort", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "interface-basics", module: "TypeScript Comfort", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "generic-basics", module: "TypeScript Comfort", moduleOrder: 2, isRequired: true, isCheckpoint: true, milestoneTitle: "Type-Safe" },
                // React (component thinking)
                { slug: "functional-components", module: "Component Architecture", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "passing-props", module: "Component Architecture", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "usestate-hook", module: "Component Architecture", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "useeffect-hook", module: "Component Architecture", moduleOrder: 3, isRequired: true, isCheckpoint: false },
                { slug: "usereducer-basics", module: "Component Architecture", moduleOrder: 3, isRequired: true, isCheckpoint: true, milestoneTitle: "React Ready" },
                // Next.js (full-stack patterns)
                { slug: "app-router-basics", module: "Full-Stack Next.js", moduleOrder: 4, isRequired: true, isCheckpoint: false },
                { slug: "server-components", module: "Full-Stack Next.js", moduleOrder: 4, isRequired: true, isCheckpoint: false },
                { slug: "route-handlers-basics", module: "Full-Stack Next.js", moduleOrder: 4, isRequired: true, isCheckpoint: false },
                { slug: "server-actions-basics", module: "Full-Stack Next.js", moduleOrder: 4, isRequired: true, isCheckpoint: true, milestoneTitle: "Full-Stack Developer" },
            ],
        },

        {
            slug: "designer-to-developer",
            title: "Designer → Developer",
            subtitle: "Code your own designs",
            description: "For designers learning to code. Turn your designs into real websites. Focus on HTML structure, CSS for precise styling, and enough JavaScript for interactivity.",
            path_type: "career-prep",
            scope: "career-transition",
            difficulty: "beginner",
            icon: "palette",
            color: "#EC4899",
            target_audience: ["UI/UX designers", "Graphic designers", "Design tool users"],
            prerequisites: ["Design tool proficiency", "No coding required"],
            learning_outcomes: [
                "Structure content with HTML",
                "Implement designs in CSS",
                "Create responsive layouts",
                "Add basic interactivity",
                "Work with design systems"
            ],
            estimated_weeks: 8,
            is_official: true,
            is_featured: false,
            lessons: [
                // HTML (structure your designs)
                ...getLessonsBySkillSlug("html-fundamentals").map((l, i, arr) => ({
                    slug: l.slug,
                    module: "HTML Structure",
                    moduleOrder: 1,
                    isRequired: true,
                    isCheckpoint: i === arr.length - 1,
                    milestoneTitle: i === arr.length - 1 ? "HTML Ready" : undefined,
                })),
                // CSS (make it beautiful)
                ...getLessonsBySkillSlug("css-fundamentals").map((l, i, arr) => ({
                    slug: l.slug,
                    module: "CSS Styling",
                    moduleOrder: 2,
                    isRequired: true,
                    isCheckpoint: i === arr.length - 1,
                    milestoneTitle: i === arr.length - 1 ? "Style Master" : undefined,
                })),
                // Layout (precise positioning)
                ...getLessonsBySkillSlug("css-layout").slice(0, 10).map((l, i, arr) => ({
                    slug: l.slug,
                    module: "Layout Mastery",
                    moduleOrder: 3,
                    isRequired: true,
                    isCheckpoint: i === arr.length - 1,
                    milestoneTitle: i === arr.length - 1 ? "Layout Expert" : undefined,
                })),
            ],
        },

        // =========================================================================
        // 6. SPECIALTY PATHS
        // =========================================================================
        {
            slug: "frontend-testing-complete",
            title: "Frontend Testing Complete",
            subtitle: "Unit testing + E2E with Vitest & Playwright",
            description: "Master frontend testing. Learn unit testing with Vitest, component testing with Testing Library, and end-to-end testing with Playwright. Ship with confidence.",
            path_type: "specialty",
            scope: "intermediate-boost",
            difficulty: "intermediate",
            icon: "test-tube",
            color: "#84CC16",
            target_audience: ["Frontend developers", "QA engineers", "Team leads"],
            prerequisites: ["React knowledge", "JavaScript proficiency"],
            learning_outcomes: [
                "Write effective unit tests",
                "Test React components",
                "Create E2E test suites",
                "Implement CI testing",
                "Follow testing best practices"
            ],
            estimated_weeks: 3,
            is_official: true,
            is_featured: false,
            lessons: getLessonsByTopicSlug("testing").map((l, i, arr) => ({
                slug: l.slug,
                module: l.slug.includes("vitest") || l.slug.includes("unit") || l.slug.includes("react-component")
                    ? "Unit & Component Testing"
                    : "E2E Testing",
                moduleOrder: l.slug.includes("vitest") || l.slug.includes("unit") || l.slug.includes("react-component") ? 1 : 2,
                isRequired: true,
                isCheckpoint: l.slug.includes("ci-integration") || i === arr.length - 1,
            })),
        },

        {
            slug: "modern-css-animations",
            title: "Modern CSS Animations",
            subtitle: "Keyframes + Framer Motion mastery",
            description: "Create stunning animations. Master CSS transitions, keyframe animations, and Framer Motion for React. Make your interfaces come alive.",
            path_type: "specialty",
            scope: "intermediate-boost",
            difficulty: "intermediate",
            icon: "sparkles",
            color: "#F472B6",
            target_audience: ["Frontend developers", "UI enthusiasts", "Creative developers"],
            prerequisites: ["CSS fundamentals", "React basics for Framer Motion"],
            learning_outcomes: [
                "Create smooth transitions",
                "Build keyframe animations",
                "Use Framer Motion effectively",
                "Implement gesture animations",
                "Optimize animation performance"
            ],
            estimated_weeks: 2,
            is_official: true,
            is_featured: false,
            lessons: getLessonsBySkillSlug("animation").map((l, i, arr) => ({
                slug: l.slug,
                module: l.slug.includes("framer") ? "Framer Motion" : "CSS Animations",
                moduleOrder: l.slug.includes("framer") ? 2 : 1,
                isRequired: true,
                isCheckpoint: l.slug.includes("gesture") || l.slug.includes("common-animation") || i === arr.length - 1,
            })),
        },

        {
            slug: "forms-validation-mastery",
            title: "Forms & Validation Mastery",
            subtitle: "React Hook Form + Zod patterns",
            description: "Master form handling in React. Learn controlled components, React Hook Form, schema validation with Zod, and complex form patterns. Build bulletproof forms.",
            path_type: "specialty",
            scope: "intermediate-boost",
            difficulty: "intermediate",
            icon: "clipboard-check",
            color: "#8B5CF6",
            target_audience: ["React developers", "Full-stack developers", "Form builders"],
            prerequisites: ["React hooks knowledge", "TypeScript basics helpful"],
            learning_outcomes: [
                "Handle form state effectively",
                "Use React Hook Form",
                "Validate with Zod schemas",
                "Build complex form flows",
                "Handle form errors gracefully"
            ],
            estimated_weeks: 2,
            is_official: true,
            is_featured: false,
            lessons: [
                { slug: "controlled-inputs", module: "Form Fundamentals", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "form-submission", module: "Form Fundamentals", moduleOrder: 1, isRequired: true, isCheckpoint: false },
                { slug: "form-validation-html5", module: "Form Fundamentals", moduleOrder: 1, isRequired: true, isCheckpoint: true, milestoneTitle: "Form Basics" },
                { slug: "rhf-basics", module: "React Hook Form", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "rhf-validation", module: "React Hook Form", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "rhf-zod-integration", module: "React Hook Form", moduleOrder: 2, isRequired: true, isCheckpoint: false },
                { slug: "rhf-field-arrays", module: "React Hook Form", moduleOrder: 2, isRequired: true, isCheckpoint: true, milestoneTitle: "Form Master" },
            ],
        },
    ];

    // Insert paths and lessons
    let successCount = 0;
    let errorCount = 0;

    for (const pathDef of paths) {
        console.log(`\n📝 Creating: ${pathDef.title}`);

        // Filter lessons that exist
        const validLessons = pathDef.lessons.filter(l => lessonBySlug.has(l.slug));
        if (validLessons.length === 0) {
            console.log(`   ⚠️  No valid lessons found, skipping`);
            errorCount++;
            continue;
        }

        const missingCount = pathDef.lessons.length - validLessons.length;
        if (missingCount > 0) {
            console.log(`   ⚠️  ${missingCount} lessons not found in curriculum`);
        }

        // Calculate estimated hours
        const estimatedHours = validLessons.reduce((sum, l) => {
            const lesson = lessonBySlug.get(l.slug);
            return sum + (lesson?.estimated_hours || 0.5);
        }, 0);

        // Insert path
        const { data: path, error: pathError } = await supabase
            .from("curated_paths")
            .insert({
                slug: pathDef.slug,
                title: pathDef.title,
                subtitle: pathDef.subtitle,
                description: pathDef.description,
                path_type: pathDef.path_type,
                scope: pathDef.scope,
                difficulty: pathDef.difficulty,
                domain: "frontend",
                icon: pathDef.icon,
                color: pathDef.color,
                target_audience: pathDef.target_audience,
                prerequisites: pathDef.prerequisites,
                learning_outcomes: pathDef.learning_outcomes,
                estimated_weeks: pathDef.estimated_weeks,
                estimated_hours: Math.round(estimatedHours * 10) / 10,
                lesson_count: validLessons.length,
                required_lesson_count: validLessons.filter(l => l.isRequired).length,
                is_official: pathDef.is_official,
                is_featured: pathDef.is_featured,
                status: "published",
                published_at: new Date().toISOString(),
            })
            .select("id")
            .single();

        if (pathError || !path) {
            console.log(`   ❌ Error: ${pathError?.message}`);
            errorCount++;
            continue;
        }

        // Insert path lessons
        const lessonInserts = validLessons.map((l, index) => {
            const lesson = lessonBySlug.get(l.slug)!;
            return {
                path_id: path.id,
                lesson_node_id: lesson.id,
                sort_order: index + 1,
                is_required: l.isRequired,
                is_checkpoint: l.isCheckpoint,
                module_name: l.module,
                module_sort_order: l.moduleOrder,
                milestone_title: l.milestoneTitle || null,
                context_notes: l.contextNotes || null,
            };
        });

        const { error: lessonsError } = await supabase
            .from("path_lessons")
            .insert(lessonInserts);

        if (lessonsError) {
            console.log(`   ❌ Lessons error: ${lessonsError.message}`);
            errorCount++;
            continue;
        }

        console.log(`   ✅ Created with ${validLessons.length} lessons (${estimatedHours.toFixed(1)}h)`);
        successCount++;
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Success: ${successCount} paths`);
    console.log(`❌ Errors: ${errorCount} paths`);
}

// Helper functions for module assignment
function getJSModule(slug: string): string {
    if (slug.includes("variable") || slug.includes("type") || slug.includes("operator") || slug.includes("loop") || slug.includes("conditional")) {
        return "Fundamentals";
    }
    if (slug.includes("function") || slug.includes("scope") || slug.includes("closure") || slug.includes("higher-order")) {
        return "Functions";
    }
    if (slug.includes("object") || slug.includes("array") || slug.includes("destructur")) {
        return "Objects & Arrays";
    }
    if (slug.includes("async") || slug.includes("promise") || slug.includes("callback")) {
        return "Async JavaScript";
    }
    if (slug.includes("dom") || slug.includes("event")) {
        return "DOM Manipulation";
    }
    return "Advanced Concepts";
}

function getJSModuleOrder(slug: string): number {
    if (slug.includes("variable") || slug.includes("type") || slug.includes("operator") || slug.includes("loop") || slug.includes("conditional")) return 1;
    if (slug.includes("function") || slug.includes("scope") || slug.includes("closure") || slug.includes("higher-order")) return 2;
    if (slug.includes("object") || slug.includes("array") || slug.includes("destructur")) return 3;
    if (slug.includes("async") || slug.includes("promise") || slug.includes("callback")) return 4;
    if (slug.includes("dom") || slug.includes("event")) return 5;
    return 6;
}

function getNextJSModule(slug: string): string {
    if (slug.includes("router") || slug.includes("layout") || slug.includes("page") || slug.includes("link") || slug.includes("navigation")) {
        return "Routing & Navigation";
    }
    if (slug.includes("server-component") || slug.includes("client-component") || slug.includes("fetch") || slug.includes("loading") || slug.includes("error")) {
        return "Data & Components";
    }
    if (slug.includes("action") || slug.includes("route-handler") || slug.includes("api")) {
        return "Server Features";
    }
    if (slug.includes("optim") || slug.includes("image") || slug.includes("static") || slug.includes("dynamic")) {
        return "Optimization";
    }
    return "Core Concepts";
}

function getNextJSModuleOrder(slug: string): number {
    if (slug.includes("router") || slug.includes("layout") || slug.includes("page") || slug.includes("link") || slug.includes("navigation")) return 1;
    if (slug.includes("server-component") || slug.includes("client-component") || slug.includes("fetch") || slug.includes("loading") || slug.includes("error")) return 2;
    if (slug.includes("action") || slug.includes("route-handler") || slug.includes("api")) return 3;
    if (slug.includes("optim") || slug.includes("image") || slug.includes("static") || slug.includes("dynamic")) return 4;
    return 1;
}

main().catch(console.error);
