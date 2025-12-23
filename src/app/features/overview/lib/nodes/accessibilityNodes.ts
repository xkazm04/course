/**
 * Accessibility Curriculum Nodes (6 nodes)
 * Building inclusive web experiences for all users
 */

import { CurriculumNode } from "../curriculumTypes";

export const accessibilityNodes: CurriculumNode[] = [
    {
        id: "a11y-fundamentals",
        title: "Accessibility Fundamentals",
        description: "WCAG guidelines and accessibility principles.",
        category: "accessibility",
        subcategory: "Concepts",
        status: "available",
        estimatedHours: 8,
        difficulty: "intermediate",
        skills: ["WCAG", "POUR Principles", "Assistive Tech"],
        resources: [
            { type: "course", title: "Web Accessibility Course", url: "#" },
        ],
        position: { x: 1150, y: 580 },
        tier: 2,
    },
    {
        id: "aria",
        title: "ARIA Attributes",
        description: "Accessible Rich Internet Applications for dynamic content.",
        category: "accessibility",
        subcategory: "Techniques",
        status: "locked",
        estimatedHours: 10,
        difficulty: "intermediate",
        skills: ["Roles", "States", "Properties"],
        resources: [
            { type: "article", title: "ARIA Authoring Practices", url: "#" },
        ],
        position: { x: 1150, y: 660 },
        tier: 2,
    },
    {
        id: "keyboard-navigation",
        title: "Keyboard Navigation",
        description: "Ensure full keyboard accessibility.",
        category: "accessibility",
        subcategory: "Techniques",
        status: "locked",
        estimatedHours: 6,
        difficulty: "intermediate",
        skills: ["Focus Management", "Tab Order", "Skip Links"],
        resources: [
            { type: "video", title: "Keyboard Accessibility", url: "#" },
        ],
        position: { x: 1300, y: 580 },
        tier: 2,
    },
    {
        id: "screen-readers",
        title: "Screen Reader Testing",
        description: "Test with VoiceOver, NVDA, and JAWS.",
        category: "accessibility",
        subcategory: "Testing",
        status: "locked",
        estimatedHours: 8,
        difficulty: "advanced",
        skills: ["VoiceOver", "NVDA", "Screen Reader UX"],
        resources: [
            { type: "practice", title: "Screen Reader Testing Guide" },
        ],
        position: { x: 1300, y: 660 },
        tier: 3,
    },
    {
        id: "a11y-testing",
        title: "Accessibility Testing",
        description: "Automated testing with axe and Lighthouse.",
        category: "accessibility",
        subcategory: "Testing",
        status: "locked",
        estimatedHours: 8,
        difficulty: "intermediate",
        skills: ["axe", "Lighthouse", "Manual Testing"],
        resources: [
            { type: "article", title: "A11y Testing Tools", url: "#" },
        ],
        position: { x: 1150, y: 740 },
        tier: 2,
    },
    {
        id: "a11y-patterns",
        title: "Accessible Components",
        description: "Build accessible modals, dropdowns, and forms.",
        category: "accessibility",
        subcategory: "Patterns",
        status: "locked",
        estimatedHours: 12,
        difficulty: "advanced",
        skills: ["Dialog", "Combobox", "Form Patterns"],
        resources: [
            { type: "course", title: "Accessible Component Patterns", url: "#" },
        ],
        position: { x: 1225, y: 820 },
        tier: 3,
    },
];
