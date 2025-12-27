import { Scenario, Complication, BonusObjective, ScenarioPhase, ProjectType } from "./types";

// Pre-built scenario templates
export const SCENARIO_TEMPLATES: Record<string, Omit<Scenario, "id" | "startDate">> = {
    // Marcus Chen - Architecture PM Tool
    "marcus-pm-tool": {
        clientId: "marcus-chen",
        projectType: "dashboard",
        initialBrief: "We need something to keep track of our projects. Nothing fancy, just... organized, you know? Right now we're using spreadsheets and it's a mess.",
        phases: [
            {
                id: "phase-1",
                name: "Initial Requirements",
                description: "Basic project tracking features",
                triggerCondition: { type: "time_elapsed", parameters: { hours: 0 } },
                newRequirements: [
                    { id: "req-1", description: "Project list view with status", priority: "must", status: "pending", addedInPhase: 0 },
                    { id: "req-2", description: "Project details page", priority: "must", status: "pending", addedInPhase: 0 },
                    { id: "req-3", description: "Status tracking (Active, On Hold, Complete)", priority: "must", status: "pending", addedInPhase: 0 },
                    { id: "req-4", description: "Assign team members to projects", priority: "should", status: "pending", addedInPhase: 0 },
                ],
                clientMessages: [],
                completed: false,
            },
            {
                id: "phase-2",
                name: "Feature Request",
                description: "File attachments requested",
                triggerCondition: { type: "time_elapsed", parameters: { days: 2 } },
                newRequirements: [
                    { id: "req-5", description: "File attachments for projects", priority: "should", status: "pending", addedInPhase: 1 },
                ],
                clientMessages: [
                    { delay: 0, content: "Hey, my junior architect just mentioned - we really need to attach files to projects. Is that hard to add?", triggered: false },
                ],
                completed: false,
            },
            {
                id: "phase-3",
                name: "Scope Expansion",
                description: "Client portal requested",
                triggerCondition: { type: "requirement_met", parameters: { requirementId: "req-5" } },
                newRequirements: [
                    { id: "req-6", description: "Client login portal to view their projects", priority: "could", status: "pending", addedInPhase: 2 },
                ],
                clientMessages: [
                    { delay: 0, content: "Actually, one of our clients just asked if they could check their project status themselves instead of emailing us. Any chance we could add a client login?", triggered: false },
                ],
                completed: false,
            },
        ],
        currentPhase: 0,
        plannedComplications: [
            {
                id: "comp-1",
                type: "stakeholder_input",
                triggerCondition: { type: "random", parameters: { probability: 0.3 } },
                clientMessage: "My business partner just looked at it and thinks we need a timeline view. Can we add that?",
                impact: { timeImpact: 8, budgetImpact: 0, stressLevel: "medium" },
                probability: 0.3,
            },
        ],
        triggeredComplications: [],
        budget: { initial: 3000, remaining: 3000, currency: "USD", billingType: "fixed" },
        deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(), // 4 weeks
        requirements: [],
        bonusObjectives: [
            { id: "bonus-1", description: "Mobile-responsive design", points: 50, completed: false },
            { id: "bonus-2", description: "Dark mode support", points: 30, completed: false },
            { id: "bonus-3", description: "Export projects to PDF", points: 40, completed: false },
        ],
    },

    // Sarah Johnson - Restaurant Online Ordering
    "sarah-ordering": {
        clientId: "sarah-johnson",
        projectType: "e_commerce",
        initialBrief: "I need online ordering yesterday 😅 We're drowning in phone orders and I'm losing customers to DoorDash. Something simple please!",
        phases: [
            {
                id: "phase-1",
                name: "MVP Launch",
                description: "Basic ordering functionality",
                triggerCondition: { type: "time_elapsed", parameters: { hours: 0 } },
                newRequirements: [
                    { id: "req-1", description: "Menu display with categories", priority: "must", status: "pending", addedInPhase: 0 },
                    { id: "req-2", description: "Add items to cart", priority: "must", status: "pending", addedInPhase: 0 },
                    { id: "req-3", description: "Checkout with payment", priority: "must", status: "pending", addedInPhase: 0 },
                    { id: "req-4", description: "Order confirmation email", priority: "should", status: "pending", addedInPhase: 0 },
                ],
                clientMessages: [],
                completed: false,
            },
            {
                id: "phase-2",
                name: "Menu Management",
                description: "Ability to update menu",
                triggerCondition: { type: "time_elapsed", parameters: { days: 1 } },
                newRequirements: [
                    { id: "req-5", description: "Admin panel to update menu items", priority: "must", status: "pending", addedInPhase: 1 },
                    { id: "req-6", description: "Mark items as sold out", priority: "should", status: "pending", addedInPhase: 1 },
                ],
                clientMessages: [
                    { delay: 0, content: "Wait how do I update the menu? We change specials daily!", triggered: false },
                ],
                completed: false,
            },
            {
                id: "phase-3",
                name: "Time Slots",
                description: "Pickup time selection",
                triggerCondition: { type: "time_elapsed", parameters: { days: 3 } },
                newRequirements: [
                    { id: "req-7", description: "Select pickup time slot", priority: "must", status: "pending", addedInPhase: 2 },
                ],
                clientMessages: [
                    { delay: 0, content: "Okay so people are just showing up whenever... we need time slots or something", triggered: false },
                ],
                completed: false,
            },
        ],
        currentPhase: 0,
        plannedComplications: [
            {
                id: "comp-1",
                type: "deadline_change",
                triggerCondition: { type: "time_elapsed", parameters: { days: 4 } },
                clientMessage: "So we have a food blogger coming next week and I REALLY want to show off the new system... any chance we can launch by Friday? 🙏",
                impact: { timeImpact: -48, budgetImpact: 500, stressLevel: "high" },
                probability: 1,
            },
        ],
        triggeredComplications: [],
        budget: { initial: 2000, remaining: 2000, currency: "USD", billingType: "fixed" },
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks
        requirements: [],
        bonusObjectives: [
            { id: "bonus-1", description: "Mobile-first design", points: 60, completed: false },
            { id: "bonus-2", description: "Dietary filter (vegan, GF, etc)", points: 40, completed: false },
        ],
    },

    // David Kumar - Fashion Marketplace
    "david-marketplace": {
        clientId: "david-kumar",
        projectType: "e_commerce",
        initialBrief: "Okay so picture this - Etsy meets Patagonia. A marketplace where sustainable fashion brands can sell directly to conscious consumers. I've got 10 brands ready to launch. Let's build something beautiful!",
        phases: [
            {
                id: "phase-1",
                name: "Platform Foundation",
                description: "Core marketplace features",
                triggerCondition: { type: "time_elapsed", parameters: { hours: 0 } },
                newRequirements: [
                    { id: "req-1", description: "Brand storefronts", priority: "must", status: "pending", addedInPhase: 0 },
                    { id: "req-2", description: "Product listings with images", priority: "must", status: "pending", addedInPhase: 0 },
                    { id: "req-3", description: "Shopping cart (multi-vendor)", priority: "must", status: "pending", addedInPhase: 0 },
                    { id: "req-4", description: "User accounts", priority: "must", status: "pending", addedInPhase: 0 },
                    { id: "req-5", description: "Search and filters", priority: "should", status: "pending", addedInPhase: 0 },
                ],
                clientMessages: [],
                completed: false,
            },
            {
                id: "phase-2",
                name: "Sustainability Focus",
                description: "Eco-friendly features",
                triggerCondition: { type: "time_elapsed", parameters: { days: 3 } },
                newRequirements: [
                    { id: "req-6", description: "Sustainability score for each product", priority: "should", status: "pending", addedInPhase: 1 },
                    { id: "req-7", description: "Carbon footprint calculator", priority: "could", status: "pending", addedInPhase: 1 },
                ],
                clientMessages: [
                    { delay: 0, content: "Had a call with our brand partners - they LOVE the idea of showing sustainability scores on each product. Can we add that? Also someone mentioned carbon footprint tracking... thoughts?", triggered: false },
                ],
                completed: false,
            },
            {
                id: "phase-3",
                name: "Vendor Dashboard",
                description: "Seller tools",
                triggerCondition: { type: "phase_complete", parameters: { phaseId: "phase-2" } },
                newRequirements: [
                    { id: "req-8", description: "Vendor analytics dashboard", priority: "should", status: "pending", addedInPhase: 2 },
                    { id: "req-9", description: "Inventory management", priority: "must", status: "pending", addedInPhase: 2 },
                ],
                clientMessages: [
                    { delay: 0, content: "Brands are asking how they'll manage their inventory and see sales data. We need some kind of seller dashboard!", triggered: false },
                ],
                completed: false,
            },
        ],
        currentPhase: 0,
        plannedComplications: [
            {
                id: "comp-1",
                type: "scope_addition",
                triggerCondition: { type: "random", parameters: { probability: 0.5 } },
                clientMessage: "OMG just got off a call with a potential investor. They want to see a mobile app demo. I know I know... but can we at least make sure the PWA experience is solid?",
                impact: { timeImpact: 16, budgetImpact: 0, stressLevel: "medium" },
                probability: 0.5,
            },
        ],
        triggeredComplications: [],
        budget: { initial: 8000, remaining: 8000, currency: "USD", billingType: "fixed" },
        deadline: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(), // 6 weeks
        requirements: [],
        bonusObjectives: [
            { id: "bonus-1", description: "Social sharing features", points: 30, completed: false },
            { id: "bonus-2", description: "Wishlist functionality", points: 25, completed: false },
            { id: "bonus-3", description: "Brand story pages", points: 35, completed: false },
        ],
    },

    // Lisa Chang - Nonprofit Donor Management
    "lisa-donor-mgmt": {
        clientId: "lisa-chang",
        projectType: "crud_app",
        initialBrief: "We're a small environmental nonprofit and we've been tracking donors in Google Sheets for years. It's getting unwieldy and we're worried about losing data. We need something simple and affordable.",
        phases: [
            {
                id: "phase-1",
                name: "Core Donor Management",
                description: "Basic donor tracking",
                triggerCondition: { type: "time_elapsed", parameters: { hours: 0 } },
                newRequirements: [
                    { id: "req-1", description: "Donor database with contact info", priority: "must", status: "pending", addedInPhase: 0 },
                    { id: "req-2", description: "Donation history tracking", priority: "must", status: "pending", addedInPhase: 0 },
                    { id: "req-3", description: "Import existing data from CSV", priority: "must", status: "pending", addedInPhase: 0 },
                    { id: "req-4", description: "Search and filter donors", priority: "should", status: "pending", addedInPhase: 0 },
                ],
                clientMessages: [],
                completed: false,
            },
            {
                id: "phase-2",
                name: "Reporting",
                description: "Board-ready reports",
                triggerCondition: { type: "time_elapsed", parameters: { days: 5 } },
                newRequirements: [
                    { id: "req-5", description: "Generate donation summary reports", priority: "must", status: "pending", addedInPhase: 1 },
                    { id: "req-6", description: "Export reports to PDF", priority: "should", status: "pending", addedInPhase: 1 },
                ],
                clientMessages: [
                    { delay: 0, content: "Board meeting is coming up - they always want to see donation trends. Can we add some kind of report feature?", triggered: false },
                ],
                completed: false,
            },
        ],
        currentPhase: 0,
        plannedComplications: [
            {
                id: "comp-1",
                type: "budget_change",
                triggerCondition: { type: "time_elapsed", parameters: { days: 7 } },
                clientMessage: "I hate to do this, but we just found out a major grant fell through. Is there any way we can reduce the scope to fit a smaller budget? I still really want the core features...",
                impact: { timeImpact: 0, budgetImpact: -500, stressLevel: "high" },
                probability: 1,
            },
        ],
        triggeredComplications: [],
        budget: { initial: 1500, remaining: 1500, currency: "USD", billingType: "fixed" },
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks
        requirements: [],
        bonusObjectives: [
            { id: "bonus-1", description: "Email integration for thank you letters", points: 40, completed: false },
            { id: "bonus-2", description: "Recurring donation tracking", points: 30, completed: false },
        ],
    },
};

// Get scenario template by ID
export function getScenarioTemplate(templateId: string): Scenario | undefined {
    const template = SCENARIO_TEMPLATES[templateId];
    if (!template) return undefined;

    return {
        ...template,
        id: `scenario-${Date.now()}`,
        startDate: new Date().toISOString(),
    };
}

// Get scenarios by client ID
export function getScenariosByClient(clientId: string): string[] {
    return Object.entries(SCENARIO_TEMPLATES)
        .filter(([_, scenario]) => scenario.clientId === clientId)
        .map(([id]) => id);
}

// Get scenarios by project type
export function getScenariosByProjectType(projectType: ProjectType): string[] {
    return Object.entries(SCENARIO_TEMPLATES)
        .filter(([_, scenario]) => scenario.projectType === projectType)
        .map(([id]) => id);
}

// Get all available scenarios
export function getAllScenarioTemplates(): Array<{ id: string; clientId: string; projectType: ProjectType; brief: string }> {
    return Object.entries(SCENARIO_TEMPLATES).map(([id, scenario]) => ({
        id,
        clientId: scenario.clientId,
        projectType: scenario.projectType,
        brief: scenario.initialBrief.substring(0, 100) + "...",
    }));
}
