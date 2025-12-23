/**
 * Learning Path Resolver
 *
 * Transforms learning path intents into structured curriculum plans.
 * This resolver generates personalized learning paths based on:
 * - User's goal and target role
 * - Time constraints and availability
 * - Learning style preferences
 * - Focus areas and current skill level
 */

import { IntentResolver, ResolverConfig } from "../IntentResolver";
import {
    LearningPathIntent,
    Constraints,
    ResolutionContext,
    ResolvedPlan,
    PlanModule,
    Milestone,
    MissingInput,
    PlanRecommendation,
    LearningStyle,
    SkillLevel,
} from "../types";

// ============================================================================
// CURRICULUM TEMPLATES
// ============================================================================

interface CurriculumTemplate {
    name: string;
    description: string;
    baseHours: number;
    topics: string[];
    prerequisites?: string[];
}

const FOCUS_AREA_CURRICULUM: Record<string, CurriculumTemplate> = {
    frontend: {
        name: "Frontend Development",
        description: "Build modern, responsive user interfaces",
        baseHours: 60,
        topics: ["HTML/CSS", "JavaScript", "React", "State Management", "Testing", "Performance"],
    },
    backend: {
        name: "Backend Development",
        description: "Design and build server-side applications",
        baseHours: 70,
        topics: ["APIs", "Databases", "Authentication", "Server Architecture", "Caching", "Security"],
        prerequisites: ["frontend"],
    },
    devops: {
        name: "DevOps & Deployment",
        description: "Automate and streamline development operations",
        baseHours: 40,
        topics: ["CI/CD", "Containers", "Cloud Services", "Monitoring", "Infrastructure as Code"],
        prerequisites: ["backend"],
    },
    mobile: {
        name: "Mobile Development",
        description: "Create native and cross-platform mobile apps",
        baseHours: 50,
        topics: ["React Native/Flutter", "Mobile UI", "Device APIs", "App Store Deployment"],
    },
    data: {
        name: "Data Engineering",
        description: "Process and analyze large-scale data",
        baseHours: 65,
        topics: ["SQL", "Data Modeling", "ETL Pipelines", "Analytics", "Visualization"],
    },
    ai: {
        name: "AI/ML Fundamentals",
        description: "Learn machine learning and AI concepts",
        baseHours: 80,
        topics: ["Python", "Statistics", "ML Algorithms", "Deep Learning", "Model Deployment"],
    },
    security: {
        name: "Security Fundamentals",
        description: "Understand application and infrastructure security",
        baseHours: 45,
        topics: ["OWASP Top 10", "Encryption", "Auth Patterns", "Penetration Testing"],
    },
    testing: {
        name: "Testing & QA",
        description: "Master software testing methodologies",
        baseHours: 35,
        topics: ["Unit Testing", "Integration Testing", "E2E Testing", "TDD", "Test Automation"],
    },
};

const LEARNING_STYLE_ADJUSTMENTS: Record<LearningStyle, { hourMultiplier: number; emphasis: string }> = {
    "video-based": { hourMultiplier: 1.0, emphasis: "video tutorials and walkthroughs" },
    "text-based": { hourMultiplier: 0.9, emphasis: "documentation and articles" },
    "project-based": { hourMultiplier: 1.3, emphasis: "hands-on projects" },
    "interactive": { hourMultiplier: 1.1, emphasis: "interactive exercises and coding challenges" },
    "mixed": { hourMultiplier: 1.0, emphasis: "variety of learning formats" },
};

const SKILL_LEVEL_ADJUSTMENTS: Record<SkillLevel, { hourMultiplier: number; skipFoundations: boolean }> = {
    beginner: { hourMultiplier: 1.3, skipFoundations: false },
    intermediate: { hourMultiplier: 1.0, skipFoundations: true },
    advanced: { hourMultiplier: 0.7, skipFoundations: true },
    expert: { hourMultiplier: 0.5, skipFoundations: true },
};

// ============================================================================
// LEARNING PATH RESOLVER
// ============================================================================

export class LearningPathResolver extends IntentResolver<LearningPathIntent> {
    readonly resolverType = "learning-path" as const;

    constructor(config: ResolverConfig = {}) {
        super(config);
    }

    protected validateIntent(intent: LearningPathIntent): MissingInput[] {
        const missing: MissingInput[] = [];

        if (!intent.goal || intent.goal.trim().length === 0) {
            missing.push({
                field: "goal",
                question: "What is your learning goal?",
                inputType: "text",
                required: true,
            });
        }

        if (!intent.focusAreas || intent.focusAreas.length === 0) {
            missing.push({
                field: "focusAreas",
                question: "Which areas do you want to focus on?",
                inputType: "multiselect",
                options: Object.keys(FOCUS_AREA_CURRICULUM).map(key => ({
                    value: key,
                    label: FOCUS_AREA_CURRICULUM[key].name,
                    description: FOCUS_AREA_CURRICULUM[key].description,
                })),
                required: true,
            });
        }

        if (!intent.currentLevel) {
            missing.push({
                field: "currentLevel",
                question: "What is your current skill level?",
                inputType: "select",
                options: [
                    { value: "beginner", label: "Beginner", description: "Just starting out" },
                    { value: "intermediate", label: "Intermediate", description: "Some experience" },
                    { value: "advanced", label: "Advanced", description: "Significant experience" },
                    { value: "expert", label: "Expert", description: "Professional level" },
                ],
                required: true,
            });
        }

        return missing;
    }

    protected generatePlan(
        intent: LearningPathIntent,
        constraints: Constraints,
        context: ResolutionContext
    ): ResolvedPlan {
        this.log("Generating learning path plan", { intent, constraints });

        const { hoursPerWeek, deadlineMonths } = constraints.time;
        const learningStyle = intent.learningStyle ?? "mixed";
        const skillLevel = intent.currentLevel;

        // Calculate adjustments
        const styleAdjustment = LEARNING_STYLE_ADJUSTMENTS[learningStyle];
        const levelAdjustment = SKILL_LEVEL_ADJUSTMENTS[skillLevel];

        // Generate modules from focus areas
        const modules: PlanModule[] = [];
        let moduleOrder = 0;

        for (const focusArea of intent.focusAreas) {
            const template = FOCUS_AREA_CURRICULUM[focusArea];
            if (!template) continue;

            moduleOrder++;
            const adjustedHours = Math.round(
                template.baseHours * styleAdjustment.hourMultiplier * levelAdjustment.hourMultiplier
            );

            // Create steps for this module
            const steps = template.topics.map((topic, index) => {
                const topicHours = Math.round(adjustedHours / template.topics.length);
                return this.createStep(
                    `Learn ${topic}`,
                    `Master ${topic} concepts and apply them in practice with ${styleAdjustment.emphasis}`,
                    topicHours,
                    {
                        priority: index === 0 ? "high" : "medium",
                        skillsGained: [topic],
                        resources: this.generateResources(topic, learningStyle),
                    }
                );
            });

            // Add project step
            steps.push(this.createStep(
                `${template.name} Project`,
                `Build a real-world project applying ${template.name} skills`,
                Math.round(adjustedHours * 0.3),
                {
                    priority: "critical",
                    dependencies: steps.map(s => s.id),
                    skillsGained: [`${focusArea}-project`],
                }
            ));

            // Determine prerequisites
            const prereqModuleIds: string[] = [];
            if (template.prerequisites) {
                for (const prereq of template.prerequisites) {
                    const prereqModule = modules.find(m => m.name.toLowerCase().includes(prereq));
                    if (prereqModule) {
                        prereqModuleIds.push(prereqModule.id);
                    }
                }
            }

            modules.push(this.createModule(
                template.name,
                template.description,
                moduleOrder,
                template.topics,
                steps,
                { prerequisites: prereqModuleIds }
            ));
        }

        // Generate milestones
        const milestones = this.generateMilestones(modules, hoursPerWeek);

        // Calculate metrics
        const metrics = this.calculateMetrics(modules, hoursPerWeek, this.calculateConfidence(intent));

        // Generate recommendations
        const recommendations = this.generateRecommendations(intent, constraints, metrics);

        // Build final plan
        const plan: ResolvedPlan = {
            id: this.generateId("plan"),
            title: this.generatePlanTitle(intent),
            summary: this.generatePlanSummary(intent, metrics, styleAdjustment.emphasis),
            intent,
            constraints,
            modules,
            milestones,
            metrics,
            recommendations,
            generatedAt: Date.now(),
            version: "1.0.0",
        };

        return plan;
    }

    private generatePlanTitle(intent: LearningPathIntent): string {
        if (intent.targetRole) {
            return `Path to ${intent.targetRole}`;
        }
        if (intent.focusAreas.length === 1) {
            const template = FOCUS_AREA_CURRICULUM[intent.focusAreas[0]];
            return template ? `${template.name} Mastery Path` : `${intent.goal} Learning Path`;
        }
        return `${intent.goal} Learning Path`;
    }

    private generatePlanSummary(
        intent: LearningPathIntent,
        metrics: ReturnType<LearningPathResolver["calculateMetrics"]>,
        emphasis: string
    ): string {
        const areas = intent.focusAreas
            .map(a => FOCUS_AREA_CURRICULUM[a]?.name ?? a)
            .join(", ");

        return `A personalized ${metrics.estimatedWeeks}-week learning path covering ${areas}. ` +
            `This curriculum includes ${metrics.moduleCount} modules with ${metrics.topicCount} topics, ` +
            `emphasizing ${emphasis}. Total estimated time: ${metrics.totalHours} hours.`;
    }

    private generateMilestones(modules: PlanModule[], hoursPerWeek: number): Milestone[] {
        const milestones: Milestone[] = [];
        let cumulativeHours = 0;

        // Foundation milestone after first module
        if (modules.length > 0) {
            cumulativeHours += modules[0].estimatedHours;
            milestones.push(this.createMilestone(
                "Foundation Complete",
                `Completed ${modules[0].name} fundamentals`,
                Math.ceil(cumulativeHours / hoursPerWeek),
                [`Understand ${modules[0].name} core concepts`, "Complete foundational exercises"],
                modules[0].steps.map(s => s.id)
            ));
        }

        // Midpoint milestone
        const midIndex = Math.floor(modules.length / 2);
        if (midIndex > 0) {
            for (let i = 1; i <= midIndex; i++) {
                cumulativeHours += modules[i].estimatedHours;
            }
            milestones.push(this.createMilestone(
                "Midpoint Achievement",
                "Reached halfway through the curriculum",
                Math.ceil(cumulativeHours / hoursPerWeek),
                ["Complete first project", "Demonstrate core competencies"],
                modules.slice(0, midIndex + 1).flatMap(m => m.steps.map(s => s.id))
            ));
        }

        // Final milestone
        for (let i = midIndex + 1; i < modules.length; i++) {
            cumulativeHours += modules[i].estimatedHours;
        }
        milestones.push(this.createMilestone(
            "Curriculum Complete",
            "Successfully completed the entire learning path",
            Math.ceil(cumulativeHours / hoursPerWeek),
            ["Complete all modules", "Build portfolio project", "Ready for next steps"],
            modules.flatMap(m => m.steps.map(s => s.id))
        ));

        return milestones;
    }

    private generateRecommendations(
        intent: LearningPathIntent,
        constraints: Constraints,
        metrics: ReturnType<LearningPathResolver["calculateMetrics"]>
    ): PlanRecommendation[] {
        const recommendations: PlanRecommendation[] = [];

        // Time commitment recommendations
        if (constraints.time.hoursPerWeek < 10 && metrics.estimatedWeeks > 20) {
            recommendations.push({
                type: "optimization",
                title: "Increase Weekly Commitment",
                message: "With your current time commitment, this path will take over 5 months. Consider increasing weekly hours for faster progress.",
                action: "Increase to 15+ hours/week",
            });
        }

        // Learning style recommendations
        if (intent.currentLevel === "beginner" && intent.learningStyle === "project-based") {
            recommendations.push({
                type: "enhancement",
                title: "Build Foundation First",
                message: "Project-based learning works best with some foundational knowledge. We've included foundational content before projects.",
            });
        }

        // Focus area recommendations
        if (intent.focusAreas.includes("backend") && !intent.focusAreas.includes("frontend")) {
            recommendations.push({
                type: "alternative",
                title: "Consider Full-Stack",
                message: "Backend developers often benefit from understanding frontend basics. Consider adding frontend to your focus areas.",
            });
        }

        // Resource recommendations
        if (constraints.resources?.budget === 0) {
            recommendations.push({
                type: "alternative",
                title: "Free Resources Prioritized",
                message: "Your plan uses free resources like documentation, open-source tutorials, and community content.",
            });
        }

        return recommendations;
    }

    private generateResources(topic: string, style: LearningStyle) {
        const resources = [];

        // Always include documentation
        resources.push({
            title: `${topic} Documentation`,
            type: "article" as const,
            estimatedMinutes: 30,
        });

        // Add style-specific resources
        if (style === "video-based" || style === "mixed") {
            resources.push({
                title: `${topic} Video Tutorial`,
                type: "video" as const,
                estimatedMinutes: 45,
            });
        }

        if (style === "interactive" || style === "mixed") {
            resources.push({
                title: `${topic} Interactive Exercises`,
                type: "tool" as const,
                estimatedMinutes: 60,
            });
        }

        if (style === "project-based" || style === "mixed") {
            resources.push({
                title: `${topic} Mini-Project`,
                type: "course" as const,
                estimatedMinutes: 120,
            });
        }

        return resources;
    }

    private calculateConfidence(intent: LearningPathIntent): number {
        let confidence = 70; // Base confidence

        // More focus areas = more tailored plan
        if (intent.focusAreas.length >= 2) confidence += 10;

        // Learning style specified
        if (intent.learningStyle) confidence += 5;

        // Target role specified
        if (intent.targetRole) confidence += 5;

        // Description provided
        if (intent.description && intent.description.length > 20) confidence += 5;

        return Math.min(95, confidence);
    }
}
