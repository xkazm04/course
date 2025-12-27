// Client Simulation Types

// Industry types
export interface Industry {
    id: string;
    name: string;
    domain: string;
    commonNeeds: string[];
    terminology: Record<string, string>;
    icon: string;
}

// Message style configuration
export interface MessageStyle {
    greetingStyle: string[];
    signoffStyle: string[];
    emojiUsage: "none" | "minimal" | "frequent";
    formalityLevel: "casual" | "professional" | "formal";
    typicalLength: "short" | "medium" | "long";
}

// Client persona
export interface ClientPersona {
    id: string;
    name: string;
    avatar: string;

    // Demographics
    age: number;
    industry: Industry;
    role: string;
    companySize: "solo" | "small" | "medium" | "enterprise";
    location: string;

    // Personality traits
    technicalLiteracy: 1 | 2 | 3 | 4 | 5;
    decisionMaking: "quick" | "deliberate" | "indecisive";
    communication: "terse" | "normal" | "verbose";
    patience: "low" | "medium" | "high";
    budgetSensitivity: "flexible" | "moderate" | "strict";

    // Backstory
    businessContext: string;
    painPoints: string[];
    previousExperience: string;

    // Communication patterns
    messageStyle: MessageStyle;
    typicalResponseDelay: number;
    preferredContactMethod: "chat" | "email" | "call";

    // Archetype for categorization
    archetype: PersonaArchetype;
}

export type PersonaArchetype =
    | "enthusiastic_founder"
    | "busy_executive"
    | "detail_oriented"
    | "budget_conscious"
    | "indecisive"
    | "technical_client"
    | "delegator"
    | "perfectionist";

// Project types
export type ProjectType =
    | "crud_app"
    | "landing_page"
    | "api_service"
    | "dashboard"
    | "e_commerce"
    | "portfolio"
    | "blog"
    | "mobile_app"
    | "cli_tool"
    | "data_pipeline";

// Requirements
export type RequirementPriority = "must" | "should" | "could" | "wont";
export type RequirementStatus = "pending" | "in_progress" | "completed" | "blocked";

export interface Requirement {
    id: string;
    description: string;
    priority: RequirementPriority;
    status: RequirementStatus;
    addedInPhase: number;
    estimatedHours?: number;
    notes?: string;
}

// Bonus objectives
export interface BonusObjective {
    id: string;
    description: string;
    points: number;
    completed: boolean;
}

// Trigger conditions
export type TriggerType =
    | "time_elapsed"
    | "phase_complete"
    | "user_question"
    | "submission_made"
    | "random"
    | "requirement_met";

export interface TriggerCondition {
    type: TriggerType;
    parameters: Record<string, unknown>;
}

// Scheduled messages
export interface ScheduledMessage {
    delay: number; // hours
    content: string;
    triggered: boolean;
}

// Scenario phases
export interface ScenarioPhase {
    id: string;
    name: string;
    description: string;
    triggerCondition: TriggerCondition;
    newRequirements: Requirement[];
    clientMessages: ScheduledMessage[];
    completed: boolean;
}

// Complications
export type ComplicationType =
    | "scope_addition"
    | "scope_reduction"
    | "deadline_change"
    | "budget_change"
    | "requirement_clarification"
    | "stakeholder_input";

export interface ComplicationImpact {
    timeImpact: number; // hours added/removed
    budgetImpact: number; // dollars added/removed
    stressLevel: "low" | "medium" | "high";
}

export interface Complication {
    id: string;
    type: ComplicationType;
    triggerCondition: TriggerCondition;
    clientMessage: string;
    impact: ComplicationImpact;
    probability: number;
}

export interface TriggeredComplication extends Complication {
    triggeredAt: string;
    resolved: boolean;
}

// Budget constraints
export interface BudgetConstraint {
    initial: number;
    remaining: number;
    currency: string;
    billingType: "fixed" | "hourly" | "monthly";
}

// Complete scenario
export interface Scenario {
    id: string;
    clientId: string;
    projectType: ProjectType;
    initialBrief: string;
    phases: ScenarioPhase[];
    currentPhase: number;
    plannedComplications: Complication[];
    triggeredComplications: TriggeredComplication[];
    startDate: string;
    deadline?: string;
    budget?: BudgetConstraint;
    requirements: Requirement[];
    bonusObjectives: BonusObjective[];
}

// Chat messages
export type MessageSender = "client" | "user" | "system";

export interface ChatMessage {
    id: string;
    sender: MessageSender;
    content: string;
    timestamp: string;
    isTyping?: boolean;
    metadata?: {
        complicationId?: string;
        phaseChange?: number;
        requirementAdded?: string;
    };
}

// Simulation state
export type SimulationStatus =
    | "not_started"
    | "in_progress"
    | "awaiting_submission"
    | "under_review"
    | "completed"
    | "abandoned";

export interface Simulation {
    id: string;
    clientId: string;
    scenarioId: string;
    status: SimulationStatus;
    startedAt: string;
    completedAt?: string;
    messages: ChatMessage[];
    currentPhase: number;
    hoursSpent: number;
    clientSatisfaction: number; // 0-100
    evaluation?: SimulationEvaluation;
}

// Evaluation types
export interface SimulationEvaluation {
    overallScore: number; // 0-100
    requirementsFulfilled: number;
    totalRequirements: number;
    bonusPointsEarned: number;
    clientSatisfaction: number;
    userFeedback: UserFeedback[];
    clientTestimonial: string;
    skillsApplied: string[];
    areasForImprovement: string[];
}

export interface EndUserPersona {
    id: string;
    name: string;
    technicalLevel: "novice" | "intermediate" | "expert";
    ageGroup: string;
    device: "desktop" | "mobile" | "tablet";
    patience: "low" | "medium" | "high";
}

export interface UserTask {
    description: string;
    expectedSteps: number;
    actualSteps: number;
    completed: boolean;
    abandonmentPoint?: string;
    frustrationMarkers: string[];
}

export interface UserFeedback {
    category: "positive" | "negative" | "suggestion";
    area: "usability" | "design" | "performance" | "functionality";
    quote: string;
    severity?: "minor" | "moderate" | "critical";
}

// Storage
export interface SimulationStorage {
    version: string;
    lastUpdated: string;
    activeSimulations: Simulation[];
    completedSimulations: Simulation[];
    preferences: SimulationPreferences;
}

export interface SimulationPreferences {
    defaultDifficulty: "easy" | "medium" | "hard";
    showTutorialTips: boolean;
    autoSaveInterval: number; // minutes
}

// Config constants
export const PROJECT_TYPE_CONFIG: Record<ProjectType, {
    label: string;
    icon: string;
    description: string;
    estimatedHours: number;
    skills: string[];
}> = {
    crud_app: { label: "CRUD Application", icon: "Database", description: "Data management app", estimatedHours: 20, skills: ["React", "API", "Database"] },
    landing_page: { label: "Landing Page", icon: "Layout", description: "Marketing website", estimatedHours: 8, skills: ["HTML", "CSS", "Responsive"] },
    api_service: { label: "API Service", icon: "Server", description: "Backend API", estimatedHours: 16, skills: ["Node.js", "REST", "Database"] },
    dashboard: { label: "Dashboard", icon: "BarChart3", description: "Analytics dashboard", estimatedHours: 24, skills: ["React", "Charts", "Data"] },
    e_commerce: { label: "E-Commerce", icon: "ShoppingCart", description: "Online store", estimatedHours: 40, skills: ["React", "Payment", "Database"] },
    portfolio: { label: "Portfolio", icon: "User", description: "Personal website", estimatedHours: 12, skills: ["HTML", "CSS", "Animation"] },
    blog: { label: "Blog", icon: "FileText", description: "Content platform", estimatedHours: 16, skills: ["CMS", "Markdown", "SEO"] },
    mobile_app: { label: "Mobile App", icon: "Smartphone", description: "Mobile application", estimatedHours: 30, skills: ["React Native", "Mobile UX"] },
    cli_tool: { label: "CLI Tool", icon: "Terminal", description: "Command line tool", estimatedHours: 12, skills: ["Node.js", "CLI", "Scripting"] },
    data_pipeline: { label: "Data Pipeline", icon: "GitBranch", description: "Data processing", estimatedHours: 20, skills: ["ETL", "Python", "Database"] },
};

export const ARCHETYPE_CONFIG: Record<PersonaArchetype, {
    label: string;
    description: string;
    color: string;
    traits: string[];
}> = {
    enthusiastic_founder: { label: "Enthusiastic Founder", description: "Excited but unclear on details", color: "amber", traits: ["Energetic", "Optimistic", "Vague"] },
    busy_executive: { label: "Busy Executive", description: "Wants results fast, no time for details", color: "red", traits: ["Terse", "Impatient", "Results-driven"] },
    detail_oriented: { label: "Detail Oriented", description: "Many questions, very specific needs", color: "blue", traits: ["Thorough", "Questioning", "Precise"] },
    budget_conscious: { label: "Budget Conscious", description: "Always asking about cost implications", color: "emerald", traits: ["Frugal", "Negotiating", "Value-focused"] },
    indecisive: { label: "Indecisive", description: "Changes mind frequently", color: "purple", traits: ["Uncertain", "Flexible", "Overthinking"] },
    technical_client: { label: "Technical Client", description: "Knows exactly what they want technically", color: "cyan", traits: ["Knowledgeable", "Specific", "Direct"] },
    delegator: { label: "The Delegator", description: "Often refers to colleagues for decisions", color: "orange", traits: ["Hands-off", "Collaborative", "Dependent"] },
    perfectionist: { label: "Perfectionist", description: "Nothing is ever quite right", color: "pink", traits: ["Critical", "High standards", "Demanding"] },
};

export const COMPLICATION_CONFIG: Record<ComplicationType, {
    label: string;
    icon: string;
    color: string;
}> = {
    scope_addition: { label: "Scope Addition", icon: "Plus", color: "amber" },
    scope_reduction: { label: "Scope Reduction", icon: "Minus", color: "emerald" },
    deadline_change: { label: "Deadline Change", icon: "Clock", color: "red" },
    budget_change: { label: "Budget Change", icon: "DollarSign", color: "purple" },
    requirement_clarification: { label: "Clarification Needed", icon: "HelpCircle", color: "blue" },
    stakeholder_input: { label: "Stakeholder Input", icon: "Users", color: "orange" },
};

export const SIMULATION_STORAGE_KEY = "client-simulations";
export const SIMULATION_VERSION = "1.0.0";
