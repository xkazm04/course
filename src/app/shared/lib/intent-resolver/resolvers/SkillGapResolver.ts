/**
 * Skill Gap Resolver
 *
 * Analyzes the gap between current skills and target role requirements,
 * then generates a plan to bridge that gap.
 */

import { IntentResolver, ResolverConfig } from "../IntentResolver";
import {
    SkillGapIntent,
    Constraints,
    ResolutionContext,
    ResolvedPlan,
    PlanModule,
    Milestone,
    MissingInput,
    PlanRecommendation,
    SkillAssessment,
    SkillLevel,
} from "../types";

// ============================================================================
// ROLE SKILL REQUIREMENTS
// ============================================================================

interface RoleRequirement {
    name: string;
    requiredSkills: Array<{ skill: string; minLevel: SkillLevel }>;
    niceToHaveSkills: string[];
    averageSalary: string;
}

const ROLE_REQUIREMENTS: Record<string, RoleRequirement> = {
    "frontend-developer": {
        name: "Frontend Developer",
        requiredSkills: [
            { skill: "HTML/CSS", minLevel: "intermediate" },
            { skill: "JavaScript", minLevel: "intermediate" },
            { skill: "React", minLevel: "intermediate" },
            { skill: "TypeScript", minLevel: "beginner" },
            { skill: "Git", minLevel: "intermediate" },
            { skill: "Testing", minLevel: "beginner" },
        ],
        niceToHaveSkills: ["Next.js", "State Management", "CSS-in-JS", "Performance Optimization"],
        averageSalary: "$80,000 - $120,000",
    },
    "backend-developer": {
        name: "Backend Developer",
        requiredSkills: [
            { skill: "Programming Language", minLevel: "intermediate" },
            { skill: "Databases", minLevel: "intermediate" },
            { skill: "APIs", minLevel: "intermediate" },
            { skill: "Git", minLevel: "intermediate" },
            { skill: "Authentication", minLevel: "intermediate" },
            { skill: "Testing", minLevel: "intermediate" },
        ],
        niceToHaveSkills: ["Cloud Services", "Containers", "Message Queues", "Caching"],
        averageSalary: "$90,000 - $140,000",
    },
    "fullstack-developer": {
        name: "Full Stack Developer",
        requiredSkills: [
            { skill: "HTML/CSS", minLevel: "intermediate" },
            { skill: "JavaScript", minLevel: "intermediate" },
            { skill: "React", minLevel: "intermediate" },
            { skill: "Node.js", minLevel: "intermediate" },
            { skill: "Databases", minLevel: "intermediate" },
            { skill: "Git", minLevel: "intermediate" },
            { skill: "APIs", minLevel: "intermediate" },
        ],
        niceToHaveSkills: ["TypeScript", "Cloud Services", "DevOps", "Testing"],
        averageSalary: "$95,000 - $150,000",
    },
    "data-scientist": {
        name: "Data Scientist",
        requiredSkills: [
            { skill: "Python", minLevel: "intermediate" },
            { skill: "Statistics", minLevel: "intermediate" },
            { skill: "Machine Learning", minLevel: "intermediate" },
            { skill: "SQL", minLevel: "intermediate" },
            { skill: "Data Visualization", minLevel: "intermediate" },
        ],
        niceToHaveSkills: ["Deep Learning", "Big Data", "A/B Testing", "Communication"],
        averageSalary: "$100,000 - $160,000",
    },
    "devops-engineer": {
        name: "DevOps Engineer",
        requiredSkills: [
            { skill: "Linux", minLevel: "intermediate" },
            { skill: "Scripting", minLevel: "intermediate" },
            { skill: "CI/CD", minLevel: "intermediate" },
            { skill: "Containers", minLevel: "intermediate" },
            { skill: "Cloud Services", minLevel: "intermediate" },
            { skill: "Monitoring", minLevel: "beginner" },
        ],
        niceToHaveSkills: ["Kubernetes", "Infrastructure as Code", "Security", "Networking"],
        averageSalary: "$100,000 - $155,000",
    },
    "mobile-developer": {
        name: "Mobile Developer",
        requiredSkills: [
            { skill: "Mobile Framework", minLevel: "intermediate" },
            { skill: "JavaScript/Dart/Swift", minLevel: "intermediate" },
            { skill: "Mobile UI", minLevel: "intermediate" },
            { skill: "APIs", minLevel: "intermediate" },
            { skill: "App Store Deployment", minLevel: "beginner" },
        ],
        niceToHaveSkills: ["Native Development", "Push Notifications", "Offline Storage", "Performance"],
        averageSalary: "$85,000 - $140,000",
    },
};

const SKILL_LEVEL_ORDER: SkillLevel[] = ["beginner", "intermediate", "advanced", "expert"];

// Hours needed to advance one level
const HOURS_PER_LEVEL: Record<SkillLevel, number> = {
    beginner: 40,      // 0 -> beginner
    intermediate: 80,  // beginner -> intermediate
    advanced: 120,     // intermediate -> advanced
    expert: 200,       // advanced -> expert
};

// ============================================================================
// SKILL GAP RESOLVER
// ============================================================================

export class SkillGapResolver extends IntentResolver<SkillGapIntent> {
    readonly resolverType = "skill-gap" as const;

    constructor(config: ResolverConfig = {}) {
        super(config);
    }

    protected validateIntent(intent: SkillGapIntent): MissingInput[] {
        const missing: MissingInput[] = [];

        if (!intent.targetRole || intent.targetRole.trim().length === 0) {
            missing.push({
                field: "targetRole",
                question: "What role are you targeting?",
                inputType: "select",
                options: Object.keys(ROLE_REQUIREMENTS).map(key => ({
                    value: key,
                    label: ROLE_REQUIREMENTS[key].name,
                    description: ROLE_REQUIREMENTS[key].averageSalary,
                })),
                required: true,
            });
        }

        if (!intent.currentSkills || intent.currentSkills.length === 0) {
            missing.push({
                field: "currentSkills",
                question: "What skills do you currently have? (List at least one)",
                inputType: "text",
                required: true,
            });
        }

        return missing;
    }

    protected generatePlan(
        intent: SkillGapIntent,
        constraints: Constraints,
        context: ResolutionContext
    ): ResolvedPlan {
        this.log("Analyzing skill gaps", { intent, constraints });

        const { hoursPerWeek } = constraints.time;
        const roleKey = this.normalizeRoleKey(intent.targetRole);
        const roleReqs = ROLE_REQUIREMENTS[roleKey] || this.generateGenericRequirements(intent.targetRole);

        // Analyze skill gaps
        const gaps = this.analyzeGaps(intent.currentSkills, roleReqs);

        // Generate modules for each skill gap
        const modules: PlanModule[] = gaps.map((gap, index) => {
            const steps = this.generateStepsForGap(gap);

            return this.createModule(
                `${gap.skill} Training`,
                `Advance ${gap.skill} from ${gap.currentLevel ?? "none"} to ${gap.targetLevel}`,
                index + 1,
                [gap.skill, ...this.getRelatedTopics(gap.skill)],
                steps,
                { prerequisites: index > 0 ? [modules[index - 1]?.id].filter(Boolean) : [] }
            );
        });

        // Fix prerequisites
        modules.forEach((module, index) => {
            if (index > 0) {
                module.prerequisites = [modules[index - 1].id];
            }
        });

        // Add nice-to-have module if there's time
        const coreHours = modules.reduce((sum, m) => sum + m.estimatedHours, 0);
        const availableHours = (constraints.time.deadlineMonths ?? 12) * 4 * hoursPerWeek;

        if (availableHours - coreHours > 40 && roleReqs.niceToHaveSkills.length > 0) {
            const bonusSteps = roleReqs.niceToHaveSkills.slice(0, 3).map(skill =>
                this.createStep(
                    `Learn ${skill}`,
                    `Introduction to ${skill} for career advancement`,
                    15,
                    { priority: "low", skillsGained: [skill] }
                )
            );

            modules.push(this.createModule(
                "Bonus Skills",
                "Additional skills to make you stand out",
                modules.length + 1,
                roleReqs.niceToHaveSkills.slice(0, 3),
                bonusSteps,
                { prerequisites: modules.length > 0 ? [modules[modules.length - 1].id] : [] }
            ));
        }

        // Generate milestones
        const milestones = this.generateMilestones(modules, hoursPerWeek, gaps);

        // Calculate metrics
        const metrics = this.calculateMetrics(modules, hoursPerWeek, this.calculateConfidence(intent, gaps));

        // Generate recommendations
        const recommendations = this.generateRecommendations(intent, gaps, roleReqs, metrics);

        const plan: ResolvedPlan = {
            id: this.generateId("skillgap"),
            title: `Path to ${roleReqs.name}`,
            summary: this.generatePlanSummary(intent, roleReqs, gaps, metrics),
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

    private normalizeRoleKey(role: string): string {
        const normalized = role.toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/senior\s*/i, "")
            .replace(/junior\s*/i, "")
            .replace(/lead\s*/i, "")
            .trim();

        // Try to match known roles
        for (const key of Object.keys(ROLE_REQUIREMENTS)) {
            if (normalized.includes(key) || key.includes(normalized)) {
                return key;
            }
        }

        return normalized;
    }

    private generateGenericRequirements(role: string): RoleRequirement {
        return {
            name: role,
            requiredSkills: [
                { skill: "Programming", minLevel: "intermediate" },
                { skill: "Problem Solving", minLevel: "intermediate" },
                { skill: "Communication", minLevel: "beginner" },
            ],
            niceToHaveSkills: ["Version Control", "Documentation", "Team Collaboration"],
            averageSalary: "Varies",
        };
    }

    private analyzeGaps(
        currentSkills: SkillAssessment[],
        roleReqs: RoleRequirement
    ): Array<{
        skill: string;
        currentLevel: SkillLevel | null;
        targetLevel: SkillLevel;
        hoursNeeded: number;
        priority: "critical" | "high" | "medium";
    }> {
        const gaps: Array<{
            skill: string;
            currentLevel: SkillLevel | null;
            targetLevel: SkillLevel;
            hoursNeeded: number;
            priority: "critical" | "high" | "medium";
        }> = [];

        // Create skill lookup
        const skillMap = new Map<string, SkillAssessment>();
        for (const skill of currentSkills) {
            skillMap.set(skill.name.toLowerCase(), skill);
        }

        // Check required skills
        for (const req of roleReqs.requiredSkills) {
            const current = this.findMatchingSkill(req.skill, skillMap);
            const hoursNeeded = this.calculateHoursNeeded(current?.level ?? null, req.minLevel);

            if (hoursNeeded > 0) {
                gaps.push({
                    skill: req.skill,
                    currentLevel: current?.level ?? null,
                    targetLevel: req.minLevel,
                    hoursNeeded,
                    priority: this.getGapPriority(req.minLevel, hoursNeeded),
                });
            }
        }

        // Sort by priority and hours needed
        gaps.sort((a, b) => {
            const priorityOrder = { critical: 0, high: 1, medium: 2 };
            const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return b.hoursNeeded - a.hoursNeeded;
        });

        return gaps;
    }

    private findMatchingSkill(
        skillName: string,
        skillMap: Map<string, SkillAssessment>
    ): SkillAssessment | undefined {
        const normalized = skillName.toLowerCase();

        // Direct match
        if (skillMap.has(normalized)) {
            return skillMap.get(normalized);
        }

        // Fuzzy match
        for (const [key, skill] of skillMap) {
            if (key.includes(normalized) || normalized.includes(key)) {
                return skill;
            }
        }

        return undefined;
    }

    private calculateHoursNeeded(currentLevel: SkillLevel | null, targetLevel: SkillLevel): number {
        const currentIndex = currentLevel ? SKILL_LEVEL_ORDER.indexOf(currentLevel) : -1;
        const targetIndex = SKILL_LEVEL_ORDER.indexOf(targetLevel);

        if (currentIndex >= targetIndex) return 0;

        let hours = 0;
        for (let i = currentIndex + 1; i <= targetIndex; i++) {
            hours += HOURS_PER_LEVEL[SKILL_LEVEL_ORDER[i]];
        }

        return hours;
    }

    private getGapPriority(targetLevel: SkillLevel, hoursNeeded: number): "critical" | "high" | "medium" {
        if (targetLevel === "intermediate" || targetLevel === "advanced") {
            if (hoursNeeded >= 120) return "critical";
            if (hoursNeeded >= 80) return "high";
        }
        return "medium";
    }

    private generateStepsForGap(gap: {
        skill: string;
        currentLevel: SkillLevel | null;
        targetLevel: SkillLevel;
        hoursNeeded: number;
        priority: "critical" | "high" | "medium";
    }) {
        const steps = [];
        const levelsToLearn: SkillLevel[] = [];

        const currentIndex = gap.currentLevel ? SKILL_LEVEL_ORDER.indexOf(gap.currentLevel) : -1;
        const targetIndex = SKILL_LEVEL_ORDER.indexOf(gap.targetLevel);

        for (let i = currentIndex + 1; i <= targetIndex; i++) {
            levelsToLearn.push(SKILL_LEVEL_ORDER[i]);
        }

        for (const level of levelsToLearn) {
            const levelHours = HOURS_PER_LEVEL[level];

            // Theory step
            steps.push(this.createStep(
                `${gap.skill} ${level} - Theory`,
                `Learn ${level} level concepts for ${gap.skill}`,
                Math.round(levelHours * 0.4),
                {
                    priority: gap.priority,
                    skillsGained: [`${gap.skill.toLowerCase()}-${level}-theory`],
                }
            ));

            // Practice step
            steps.push(this.createStep(
                `${gap.skill} ${level} - Practice`,
                `Hands-on practice with ${gap.skill} at ${level} level`,
                Math.round(levelHours * 0.4),
                {
                    priority: gap.priority,
                    skillsGained: [`${gap.skill.toLowerCase()}-${level}-practice`],
                    dependencies: [steps[steps.length - 1].id],
                }
            ));

            // Project step
            steps.push(this.createStep(
                `${gap.skill} ${level} - Project`,
                `Build a project demonstrating ${level} ${gap.skill} skills`,
                Math.round(levelHours * 0.2),
                {
                    priority: gap.priority,
                    skillsGained: [`${gap.skill.toLowerCase()}-${level}-applied`],
                    dependencies: [steps[steps.length - 1].id],
                }
            ));
        }

        return steps;
    }

    private getRelatedTopics(skill: string): string[] {
        const relatedTopics: Record<string, string[]> = {
            "HTML/CSS": ["Responsive Design", "Accessibility", "CSS Frameworks"],
            "JavaScript": ["ES6+", "DOM Manipulation", "Async Programming"],
            "React": ["Hooks", "State Management", "Component Patterns"],
            "Node.js": ["Express", "Middleware", "NPM Ecosystem"],
            "Databases": ["Query Optimization", "Data Modeling", "Migrations"],
            "APIs": ["REST", "GraphQL", "API Design"],
            "Testing": ["Unit Tests", "Integration Tests", "TDD"],
            "Git": ["Branching", "Code Review", "CI Integration"],
        };

        return relatedTopics[skill] ?? [];
    }

    private generateMilestones(
        modules: PlanModule[],
        hoursPerWeek: number,
        gaps: Array<{ skill: string; priority: string }>
    ): Milestone[] {
        const milestones: Milestone[] = [];
        let cumulativeHours = 0;

        // First critical skill milestone
        const criticalModule = modules.find((_, i) => gaps[i]?.priority === "critical");
        if (criticalModule) {
            cumulativeHours += criticalModule.estimatedHours;
            milestones.push(this.createMilestone(
                "Critical Gap Closed",
                `Achieved required level in ${criticalModule.name.replace(" Training", "")}`,
                Math.ceil(cumulativeHours / hoursPerWeek),
                ["Passed skill assessment", "Completed hands-on project"],
                criticalModule.steps.map(s => s.id)
            ));
        }

        // Midpoint
        const midIndex = Math.floor(modules.length / 2);
        if (midIndex > 0) {
            for (let i = 0; i < midIndex; i++) {
                cumulativeHours += modules[i].estimatedHours;
            }
            milestones.push(this.createMilestone(
                "Halfway There",
                "Closed half of identified skill gaps",
                Math.ceil(cumulativeHours / hoursPerWeek),
                ["Multiple skills improved", "Portfolio building"],
                modules.slice(0, midIndex).flatMap(m => m.steps.map(s => s.id))
            ));
        }

        // Role ready
        for (let i = midIndex; i < modules.length; i++) {
            cumulativeHours += modules[i].estimatedHours;
        }
        milestones.push(this.createMilestone(
            "Role Ready",
            "All required skills at target level",
            Math.ceil(cumulativeHours / hoursPerWeek),
            ["All gaps closed", "Portfolio complete", "Ready to apply"],
            modules.flatMap(m => m.steps.map(s => s.id))
        ));

        return milestones;
    }

    private generatePlanSummary(
        intent: SkillGapIntent,
        roleReqs: RoleRequirement,
        gaps: Array<{ skill: string; hoursNeeded: number }>,
        metrics: ReturnType<SkillGapResolver["calculateMetrics"]>
    ): string {
        const gapCount = gaps.length;
        const skillsCovered = gaps.map(g => g.skill).slice(0, 3).join(", ");

        return `Analysis identified ${gapCount} skill gaps to reach ${roleReqs.name} level. ` +
            `Priority areas: ${skillsCovered}. ` +
            `This ${metrics.estimatedWeeks}-week plan will bring you to job-ready status ` +
            `with ${metrics.totalHours} total hours of focused learning.`;
    }

    private generateRecommendations(
        intent: SkillGapIntent,
        gaps: Array<{ skill: string; priority: string; hoursNeeded: number }>,
        roleReqs: RoleRequirement,
        metrics: ReturnType<SkillGapResolver["calculateMetrics"]>
    ): PlanRecommendation[] {
        const recommendations: PlanRecommendation[] = [];

        // Critical gaps warning
        const criticalGaps = gaps.filter(g => g.priority === "critical");
        if (criticalGaps.length > 2) {
            recommendations.push({
                type: "warning",
                title: "Multiple Critical Gaps",
                message: `${criticalGaps.length} critical skill gaps identified. Focus on these first for fastest progress toward employability.`,
            });
        }

        // Salary information
        if (roleReqs.averageSalary && roleReqs.averageSalary !== "Varies") {
            recommendations.push({
                type: "enhancement",
                title: "Expected Salary Range",
                message: `${roleReqs.name} positions typically offer ${roleReqs.averageSalary}.`,
            });
        }

        // Transferable skills
        const matchingSkills = intent.currentSkills.filter(s =>
            roleReqs.requiredSkills.some(r =>
                s.name.toLowerCase().includes(r.skill.toLowerCase()) ||
                r.skill.toLowerCase().includes(s.name.toLowerCase())
            )
        );

        if (matchingSkills.length > 0) {
            recommendations.push({
                type: "optimization",
                title: "Leverage Existing Skills",
                message: `Your ${matchingSkills.map(s => s.name).join(", ")} skills provide a strong foundation. Build on these strengths.`,
            });
        }

        // Nice-to-have suggestions
        if (roleReqs.niceToHaveSkills.length > 0 && gaps.length <= 3) {
            recommendations.push({
                type: "alternative",
                title: "Stand Out Skills",
                message: `Once core gaps are closed, consider learning ${roleReqs.niceToHaveSkills.slice(0, 2).join(" or ")} to differentiate yourself.`,
            });
        }

        return recommendations;
    }

    private calculateConfidence(
        intent: SkillGapIntent,
        gaps: Array<{ skill: string; hoursNeeded: number }>
    ): number {
        let confidence = 60; // Base confidence

        // Known role
        if (ROLE_REQUIREMENTS[this.normalizeRoleKey(intent.targetRole)]) {
            confidence += 15;
        }

        // Detailed current skills
        if (intent.currentSkills.length >= 3) confidence += 10;

        // Industry specified
        if (intent.industry) confidence += 5;

        // Reasonable gap count
        if (gaps.length <= 5) confidence += 5;

        return Math.min(90, confidence);
    }
}
