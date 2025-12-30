import {
    Compass, Briefcase, BookOpen, FileText, Award
} from "lucide-react";

export type AtmosphereVariant = "default" | "cool" | "warm";

export interface ModuleVariant {
    id: string;
    name: string;
}

export interface ModuleDefinition {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: typeof Compass;
    color: string;
    gradient: string;
    features: string[];
    atmosphereVariant: AtmosphereVariant;
    variants: ModuleVariant[];
}

export const modules: ModuleDefinition[] = [
    {
        id: "overview",
        title: "Courses Overview",
        subtitle: "Learning Paths",
        description: "Pick a learning path from the world of software development",
        icon: Compass,
        color: "indigo",
        gradient: "from-indigo-500 to-indigo-600",
        features: ["Frontend", "Fullstack", "Knowledge Map", "Skill Progress"],
        atmosphereVariant: "default",
        variants: [
            { id: "knowledge-map", name: "Knowledge Map" },
        ],
    },
    {
        id: "career-mapping",
        title: "Career Mapping",
        subtitle: "Career Outcomes",
        description: "Connect learning to real jobs, salaries, and communities",
        icon: Briefcase,
        color: "emerald",
        gradient: "from-emerald-500 to-emerald-600",
        features: ["Job Postings", "Salary Data", "Gamified", "Communities"],
        atmosphereVariant: "warm",
        variants: [
            { id: "gamified", name: "Gamified" },
        ],
    },
    {
        id: "chapter",
        title: "Course Chapter",
        subtitle: "Interactive Learning",
        description: "Interactive syllabus with dynamic snippets and examples",
        icon: BookOpen,
        color: "cyan",
        gradient: "from-cyan-500 to-cyan-600",
        features: ["Video Lessons", "Code IDE", "Expandable", "Progress"],
        atmosphereVariant: "cool",
        variants: [
            { id: "classic", name: "Classic" },
            { id: "expandable", name: "Expandable" },
            { id: "ide", name: "IDE" },
        ],
    },
    {
        id: "my-notes",
        title: "My Notes",
        subtitle: "Personal Library",
        description: "All your bookmarks and notes in one place with search and export",
        icon: FileText,
        color: "purple",
        gradient: "from-purple-500 to-indigo-600",
        features: ["Bookmarks", "Tags", "Search", "Export MD"],
        atmosphereVariant: "cool",
        variants: [
            { id: "library", name: "Library" },
        ],
    },
    {
        id: "certificates",
        title: "My Certificates",
        subtitle: "Achievements Gallery",
        description: "Shareable completion certificates with verification links for LinkedIn",
        icon: Award,
        color: "emerald",
        gradient: "from-emerald-500 to-teal-600",
        features: ["PDF Export", "LinkedIn Share", "Verification", "Skills Badge"],
        atmosphereVariant: "warm",
        variants: [
            { id: "gallery", name: "Gallery" },
        ],
    },
];

export function getModuleById(moduleId: string): ModuleDefinition | undefined {
    return modules.find(m => m.id === moduleId);
}

export function getVariantIndex(module: ModuleDefinition, variantId: string): number {
    const index = module.variants.findIndex(v => v.id === variantId);
    return index >= 0 ? index : 0;
}

export function getVariantByIndex(module: ModuleDefinition, index: number): ModuleVariant {
    return module.variants[index] || module.variants[0];
}

// ============================================================================
// Navigation Modules - Simplified view for landing page navigation
// ============================================================================

/**
 * Navigation module definition - the semantic core of landing page destinations.
 * Landing page variants are just different visual presentations of this single
 * navigation intent. The modules are the invariant; the visuals are the variant.
 */
export interface NavigationModule {
    id: string;
    title: string;
    icon: typeof Compass;
    href: string;
}

/**
 * Core navigation modules for the landing page.
 * These represent the primary destinations users can navigate to.
 * Derived from the full module definitions but optimized for navigation UI.
 */
export const navigationModules: NavigationModule[] = [
    { id: "overview", title: "Explore Paths", icon: Compass, href: "/overview" },
    { id: "career-mapping", title: "Career Map", icon: Briefcase, href: "/career-mapping" },
    { id: "chapter", title: "Learn", icon: BookOpen, href: "/chapter" },
];
