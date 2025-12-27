// Client Simulation Feature
// Generative Simulation Model for practicing client communication

// Types
export * from "./lib/types";

// Data & Templates
export { PERSONA_TEMPLATES } from "./lib/personaTemplates";
export { getAllScenarioTemplates, getScenariosByClient } from "./lib/scenarioTemplates";

// Storage
export {
    getSimulationStorage,
    saveSimulationStorage,
    getActiveSimulations,
    getActiveSimulation,
    createSimulation,
    updateSimulation,
    startSimulation,
    addMessage,
    updatePhase,
    updateClientSatisfaction,
    addHoursSpent,
    completeSimulation,
    abandonSimulation,
    getCompletedSimulations,
    getPreferences,
    updatePreferences,
    getSimulationStats,
    clearAllSimulations,
} from "./lib/simulationStorage";

// Hook
export { useSimulation } from "./lib/useSimulation";

// Components
export {
    ClientProfile,
    ChatInterface,
    RequirementsPanel,
    TimelineView,
    CompactTimeline,
    ComplicationAlert,
    ComplicationBadge,
    ComplicationList,
    SimulationWorkspace,
    FeedbackReview,
} from "./components";
