/**
 * Project Plan Resolver
 *
 * Transforms project planning intents into structured project plans.
 * This resolver generates project roadmaps based on:
 * - Project type and scope
 * - Required features
 * - Team size and availability
 * - Technology preferences
 */

import { IntentResolver, ResolverConfig } from "../IntentResolver";
import {
    ProjectPlanIntent,
    Constraints,
    ResolutionContext,
    ResolvedPlan,
    PlanModule,
    Milestone,
    MissingInput,
    PlanRecommendation,
    ProjectType,
} from "../types";

// ============================================================================
// PROJECT TEMPLATES
// ============================================================================

interface ProjectPhaseTemplate {
    name: string;
    description: string;
    baseHours: number;
    tasks: string[];
}

const PROJECT_PHASES: Record<string, ProjectPhaseTemplate[]> = {
    "web-app": [
        {
            name: "Planning & Design",
            description: "Define requirements, create wireframes, and plan architecture",
            baseHours: 20,
            tasks: ["Requirements gathering", "User stories", "Wireframes", "Tech stack decision", "Architecture design"],
        },
        {
            name: "Setup & Foundation",
            description: "Set up development environment and project structure",
            baseHours: 15,
            tasks: ["Repository setup", "CI/CD pipeline", "Development environment", "Linting/formatting", "Base component library"],
        },
        {
            name: "Core Features",
            description: "Implement primary application features",
            baseHours: 60,
            tasks: ["Authentication", "Database models", "API endpoints", "Core UI components", "State management"],
        },
        {
            name: "Testing & QA",
            description: "Write tests and ensure quality",
            baseHours: 25,
            tasks: ["Unit tests", "Integration tests", "E2E tests", "Performance testing", "Security audit"],
        },
        {
            name: "Deployment & Launch",
            description: "Deploy to production and monitor",
            baseHours: 15,
            tasks: ["Staging deployment", "Production setup", "Monitoring", "Documentation", "Launch checklist"],
        },
    ],
    "mobile-app": [
        {
            name: "Planning & Design",
            description: "Plan app features and create UI/UX designs",
            baseHours: 25,
            tasks: ["App requirements", "UI/UX mockups", "Navigation flow", "Platform decisions", "API design"],
        },
        {
            name: "Environment Setup",
            description: "Configure development environment and dependencies",
            baseHours: 20,
            tasks: ["Dev environment", "Emulator setup", "Package configuration", "Code signing", "CI/CD for mobile"],
        },
        {
            name: "Core Development",
            description: "Build main application features",
            baseHours: 80,
            tasks: ["Navigation", "Authentication", "Core screens", "Data persistence", "API integration"],
        },
        {
            name: "Platform Features",
            description: "Implement platform-specific functionality",
            baseHours: 30,
            tasks: ["Push notifications", "Device APIs", "Offline support", "Deep linking", "Platform optimization"],
        },
        {
            name: "Testing & Release",
            description: "Test thoroughly and submit to app stores",
            baseHours: 25,
            tasks: ["Device testing", "Beta testing", "Store assets", "App store submission", "Release monitoring"],
        },
    ],
    "api": [
        {
            name: "API Design",
            description: "Design API contracts and architecture",
            baseHours: 15,
            tasks: ["OpenAPI spec", "Authentication strategy", "Rate limiting design", "Versioning strategy", "Error handling"],
        },
        {
            name: "Infrastructure Setup",
            description: "Set up server infrastructure and database",
            baseHours: 20,
            tasks: ["Server setup", "Database setup", "Caching layer", "API gateway", "Monitoring"],
        },
        {
            name: "Endpoint Implementation",
            description: "Implement API endpoints",
            baseHours: 45,
            tasks: ["CRUD endpoints", "Authentication endpoints", "Business logic", "Validation", "Middleware"],
        },
        {
            name: "Documentation & Testing",
            description: "Document and test the API",
            baseHours: 20,
            tasks: ["API documentation", "Swagger UI", "Unit tests", "Integration tests", "Load testing"],
        },
        {
            name: "Deployment",
            description: "Deploy and monitor the API",
            baseHours: 10,
            tasks: ["Staging deployment", "Production deployment", "Health checks", "Alerting", "Logging"],
        },
    ],
    "library": [
        {
            name: "Design",
            description: "Design the library API and architecture",
            baseHours: 15,
            tasks: ["API design", "Use case analysis", "Dependencies audit", "Compatibility matrix"],
        },
        {
            name: "Core Implementation",
            description: "Implement core library functionality",
            baseHours: 40,
            tasks: ["Core functions", "Type definitions", "Error handling", "Configuration options"],
        },
        {
            name: "Testing",
            description: "Comprehensive test coverage",
            baseHours: 25,
            tasks: ["Unit tests", "Integration tests", "Edge cases", "Performance benchmarks"],
        },
        {
            name: "Documentation & Release",
            description: "Document and publish the library",
            baseHours: 15,
            tasks: ["API documentation", "Usage examples", "Changelog", "NPM/Package publishing"],
        },
    ],
    "cli-tool": [
        {
            name: "Design",
            description: "Design command structure and UX",
            baseHours: 10,
            tasks: ["Command design", "Argument parsing", "Help system", "Configuration"],
        },
        {
            name: "Implementation",
            description: "Build CLI functionality",
            baseHours: 30,
            tasks: ["Core commands", "Input validation", "Output formatting", "Error handling"],
        },
        {
            name: "Testing & Distribution",
            description: "Test and distribute the tool",
            baseHours: 15,
            tasks: ["Testing", "Documentation", "Binary packaging", "Distribution"],
        },
    ],
    "data-pipeline": [
        {
            name: "Design & Planning",
            description: "Design data flow and architecture",
            baseHours: 20,
            tasks: ["Data modeling", "Pipeline architecture", "Source mapping", "Transformation logic"],
        },
        {
            name: "Infrastructure",
            description: "Set up data infrastructure",
            baseHours: 25,
            tasks: ["Data storage", "Processing infrastructure", "Orchestration", "Monitoring"],
        },
        {
            name: "Pipeline Development",
            description: "Build ETL/ELT pipelines",
            baseHours: 50,
            tasks: ["Extraction", "Transformation", "Loading", "Validation", "Scheduling"],
        },
        {
            name: "Quality & Operations",
            description: "Ensure data quality and operationalize",
            baseHours: 20,
            tasks: ["Data quality checks", "Alerting", "Documentation", "Runbooks"],
        },
    ],
    "ml-model": [
        {
            name: "Problem Definition",
            description: "Define ML problem and success metrics",
            baseHours: 15,
            tasks: ["Problem framing", "Success metrics", "Data requirements", "Feasibility analysis"],
        },
        {
            name: "Data Preparation",
            description: "Collect and prepare training data",
            baseHours: 30,
            tasks: ["Data collection", "Data cleaning", "Feature engineering", "Train/test split"],
        },
        {
            name: "Model Development",
            description: "Develop and train models",
            baseHours: 45,
            tasks: ["Baseline model", "Model selection", "Hyperparameter tuning", "Cross-validation"],
        },
        {
            name: "Evaluation & Deployment",
            description: "Evaluate and deploy the model",
            baseHours: 25,
            tasks: ["Model evaluation", "Error analysis", "Model serving", "Monitoring", "A/B testing"],
        },
    ],
    "game": [
        {
            name: "Game Design",
            description: "Design game mechanics and assets",
            baseHours: 30,
            tasks: ["Game concept", "Mechanics design", "Level design", "Art direction", "Sound design"],
        },
        {
            name: "Engine Setup",
            description: "Set up game engine and tools",
            baseHours: 20,
            tasks: ["Engine configuration", "Asset pipeline", "Input handling", "Physics setup"],
        },
        {
            name: "Core Development",
            description: "Implement core game systems",
            baseHours: 80,
            tasks: ["Player mechanics", "Game logic", "UI/menus", "Level implementation", "Audio integration"],
        },
        {
            name: "Polish & Testing",
            description: "Polish and playtest",
            baseHours: 35,
            tasks: ["Bug fixing", "Playtesting", "Performance optimization", "Accessibility"],
        },
        {
            name: "Release",
            description: "Prepare for release",
            baseHours: 20,
            tasks: ["Platform builds", "Store listings", "Marketing assets", "Launch"],
        },
    ],
    "other": [
        {
            name: "Planning",
            description: "Plan the project scope and approach",
            baseHours: 15,
            tasks: ["Requirements", "Architecture", "Timeline", "Resources"],
        },
        {
            name: "Development",
            description: "Core development work",
            baseHours: 50,
            tasks: ["Implementation", "Integration", "Testing"],
        },
        {
            name: "Delivery",
            description: "Finalize and deliver",
            baseHours: 15,
            tasks: ["Documentation", "Deployment", "Handover"],
        },
    ],
};

const TEAM_SIZE_MULTIPLIERS: Record<string, number> = {
    "1": 1.0,      // Solo developer
    "2-3": 0.6,   // Small team - some parallelization
    "4-6": 0.4,   // Medium team - more parallelization
    "7+": 0.35,   // Large team - significant parallelization but more coordination
};

// ============================================================================
// PROJECT PLAN RESOLVER
// ============================================================================

export class ProjectPlanResolver extends IntentResolver<ProjectPlanIntent> {
    readonly resolverType = "project-plan" as const;

    constructor(config: ResolverConfig = {}) {
        super(config);
    }

    protected validateIntent(intent: ProjectPlanIntent): MissingInput[] {
        const missing: MissingInput[] = [];

        if (!intent.projectName || intent.projectName.trim().length === 0) {
            missing.push({
                field: "projectName",
                question: "What is your project called?",
                inputType: "text",
                required: true,
            });
        }

        if (!intent.projectType) {
            missing.push({
                field: "projectType",
                question: "What type of project is this?",
                inputType: "select",
                options: [
                    { value: "web-app", label: "Web Application", description: "Full-stack web app with frontend and backend" },
                    { value: "mobile-app", label: "Mobile App", description: "iOS/Android application" },
                    { value: "api", label: "API/Backend", description: "REST or GraphQL API service" },
                    { value: "library", label: "Library/Package", description: "Reusable code library" },
                    { value: "cli-tool", label: "CLI Tool", description: "Command-line application" },
                    { value: "data-pipeline", label: "Data Pipeline", description: "ETL/data processing system" },
                    { value: "ml-model", label: "ML Model", description: "Machine learning project" },
                    { value: "game", label: "Game", description: "Video game development" },
                    { value: "other", label: "Other", description: "Other type of project" },
                ],
                required: true,
            });
        }

        if (!intent.features || intent.features.length === 0) {
            missing.push({
                field: "features",
                question: "What are the main features you want to build?",
                inputType: "text",
                required: true,
            });
        }

        return missing;
    }

    protected generatePlan(
        intent: ProjectPlanIntent,
        constraints: Constraints,
        context: ResolutionContext
    ): ResolvedPlan {
        this.log("Generating project plan", { intent, constraints });

        const { hoursPerWeek } = constraints.time;
        const phases = PROJECT_PHASES[intent.projectType] || PROJECT_PHASES.other;

        // Calculate team multiplier
        const teamKey = this.getTeamSizeKey(intent.teamSize);
        const teamMultiplier = TEAM_SIZE_MULTIPLIERS[teamKey];

        // Feature complexity adjustment
        const featureMultiplier = this.calculateFeatureMultiplier(intent.features);

        // Generate modules from phases
        const modules: PlanModule[] = phases.map((phase, index) => {
            const adjustedHours = Math.round(phase.baseHours * teamMultiplier * featureMultiplier);

            const steps = phase.tasks.map((task, taskIndex) => {
                const taskHours = Math.round(adjustedHours / phase.tasks.length);
                return this.createStep(
                    task,
                    `Complete ${task.toLowerCase()} for ${intent.projectName}`,
                    taskHours,
                    {
                        priority: taskIndex === 0 ? "high" : "medium",
                        skillsGained: [task.toLowerCase().replace(/\s+/g, "-")],
                    }
                );
            });

            return this.createModule(
                phase.name,
                phase.description,
                index + 1,
                phase.tasks,
                steps,
                { prerequisites: index > 0 ? [modules[index - 1]?.id].filter(Boolean) : [] }
            );
        });

        // Fix prerequisites after all modules are created
        modules.forEach((module, index) => {
            if (index > 0) {
                module.prerequisites = [modules[index - 1].id];
            }
        });

        // Generate milestones
        const milestones = this.generateMilestones(modules, hoursPerWeek, intent.projectName);

        // Calculate metrics
        const metrics = this.calculateMetrics(modules, hoursPerWeek, this.calculateConfidence(intent));

        // Generate recommendations
        const recommendations = this.generateRecommendations(intent, constraints, metrics);

        const plan: ResolvedPlan = {
            id: this.generateId("project"),
            title: `${intent.projectName} Development Plan`,
            summary: this.generatePlanSummary(intent, metrics, phases.length),
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

    private getTeamSizeKey(teamSize: number): string {
        if (teamSize === 1) return "1";
        if (teamSize <= 3) return "2-3";
        if (teamSize <= 6) return "4-6";
        return "7+";
    }

    private calculateFeatureMultiplier(features: string[]): number {
        // More features = more complexity
        const baseMultiplier = 1.0;
        const featureCount = features.length;

        if (featureCount <= 3) return baseMultiplier;
        if (featureCount <= 6) return baseMultiplier * 1.3;
        if (featureCount <= 10) return baseMultiplier * 1.6;
        return baseMultiplier * 2.0;
    }

    private generatePlanSummary(
        intent: ProjectPlanIntent,
        metrics: ReturnType<ProjectPlanResolver["calculateMetrics"]>,
        phaseCount: number
    ): string {
        const teamDesc = intent.teamSize === 1 ? "solo developer" : `team of ${intent.teamSize}`;
        const techDesc = intent.techStack?.length
            ? ` using ${intent.techStack.slice(0, 3).join(", ")}`
            : "";

        return `Development plan for ${intent.projectName}, a ${intent.projectType.replace("-", " ")}` +
            ` project for a ${teamDesc}${techDesc}. ` +
            `The plan spans ${phaseCount} phases over approximately ${metrics.estimatedWeeks} weeks, ` +
            `totaling ${metrics.totalHours} hours of work.`;
    }

    private generateMilestones(
        modules: PlanModule[],
        hoursPerWeek: number,
        projectName: string
    ): Milestone[] {
        const milestones: Milestone[] = [];
        let cumulativeHours = 0;

        // Planning complete milestone
        if (modules.length > 0) {
            cumulativeHours += modules[0].estimatedHours;
            milestones.push(this.createMilestone(
                "Planning Complete",
                `${projectName} planning and design phase finished`,
                Math.ceil(cumulativeHours / hoursPerWeek),
                ["Requirements documented", "Architecture defined", "Ready to build"],
                modules[0].steps.map(s => s.id)
            ));
        }

        // MVP milestone (after ~60% of modules)
        const mvpIndex = Math.floor(modules.length * 0.6);
        if (mvpIndex > 0) {
            for (let i = 1; i <= mvpIndex; i++) {
                cumulativeHours += modules[i].estimatedHours;
            }
            milestones.push(this.createMilestone(
                "MVP Ready",
                `Minimum viable product of ${projectName} complete`,
                Math.ceil(cumulativeHours / hoursPerWeek),
                ["Core features working", "Basic testing done", "Demo ready"],
                modules.slice(0, mvpIndex + 1).flatMap(m => m.steps.map(s => s.id))
            ));
        }

        // Launch milestone
        for (let i = mvpIndex + 1; i < modules.length; i++) {
            cumulativeHours += modules[i].estimatedHours;
        }
        milestones.push(this.createMilestone(
            "Launch Ready",
            `${projectName} ready for production deployment`,
            Math.ceil(cumulativeHours / hoursPerWeek),
            ["All features complete", "Testing passed", "Documentation ready", "Deployed to production"],
            modules.flatMap(m => m.steps.map(s => s.id))
        ));

        return milestones;
    }

    private generateRecommendations(
        intent: ProjectPlanIntent,
        constraints: Constraints,
        metrics: ReturnType<ProjectPlanResolver["calculateMetrics"]>
    ): PlanRecommendation[] {
        const recommendations: PlanRecommendation[] = [];

        // Team size recommendations
        if (intent.teamSize === 1 && metrics.totalHours > 200) {
            recommendations.push({
                type: "warning",
                title: "Consider Team Help",
                message: "This project is substantial for a solo developer. Consider bringing in help for faster delivery.",
            });
        }

        // Scope recommendations
        if (intent.features.length > 8) {
            recommendations.push({
                type: "optimization",
                title: "Consider MVP Approach",
                message: "Many features planned. Consider launching with core features first and iterating.",
                action: "Prioritize top 3-5 features for initial release",
            });
        }

        // Tech stack recommendations
        if (!intent.techStack || intent.techStack.length === 0) {
            recommendations.push({
                type: "enhancement",
                title: "Define Tech Stack",
                message: "Specifying your technology stack helps with more accurate planning and resource recommendations.",
            });
        }

        // Timeline recommendations
        if (constraints.time.deadlineMonths && metrics.estimatedWeeks > constraints.time.deadlineMonths * 4) {
            recommendations.push({
                type: "warning",
                title: "Timeline Risk",
                message: `Current plan exceeds your ${constraints.time.deadlineMonths}-month deadline. Consider reducing scope or increasing time commitment.`,
                action: "Reduce features or increase hours per week",
            });
        }

        return recommendations;
    }

    private calculateConfidence(intent: ProjectPlanIntent): number {
        let confidence = 65; // Base confidence

        // Known project type
        if (PROJECT_PHASES[intent.projectType]) confidence += 10;

        // Features defined
        if (intent.features.length >= 3) confidence += 10;

        // Tech stack specified
        if (intent.techStack && intent.techStack.length > 0) confidence += 5;

        // Description provided
        if (intent.description && intent.description.length > 20) confidence += 5;

        return Math.min(90, confidence);
    }
}
