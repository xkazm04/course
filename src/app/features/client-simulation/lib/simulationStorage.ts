"use client";

import { createTimestampedStorage, generateId } from "@/app/shared/lib/storageFactory";
import {
    Simulation,
    SimulationStorage,
    SimulationPreferences,
    SimulationStatus,
    ChatMessage,
    Requirement,
    RequirementStatus,
    SIMULATION_STORAGE_KEY,
    SIMULATION_VERSION,
} from "./types";

function getDefaultStorage(): SimulationStorage {
    return {
        version: SIMULATION_VERSION,
        lastUpdated: new Date().toISOString(),
        activeSimulations: [],
        completedSimulations: [],
        preferences: {
            defaultDifficulty: "medium",
            showTutorialTips: true,
            autoSaveInterval: 5,
        },
    };
}

const simulationStorage = createTimestampedStorage<SimulationStorage>({
    storageKey: SIMULATION_STORAGE_KEY,
    getDefault: getDefaultStorage,
    version: SIMULATION_VERSION,
    migrate: (oldData: unknown) => {
        const data = oldData as Partial<SimulationStorage>;
        return {
            ...getDefaultStorage(),
            activeSimulations: data?.activeSimulations || [],
            completedSimulations: data?.completedSimulations || [],
        };
    },
});

export function getSimulationStorage(): SimulationStorage {
    return simulationStorage.get();
}

export function saveSimulationStorage(data: SimulationStorage): void {
    simulationStorage.save(data);
}

// Active simulations
export function getActiveSimulations(): Simulation[] {
    return getSimulationStorage().activeSimulations;
}

export function getActiveSimulation(id: string): Simulation | undefined {
    return getActiveSimulations().find(s => s.id === id);
}

export function createSimulation(
    clientId: string,
    scenarioId: string
): Simulation {
    const storage = getSimulationStorage();
    const now = new Date().toISOString();

    const simulation: Simulation = {
        id: generateId(),
        clientId,
        scenarioId,
        status: "not_started",
        startedAt: now,
        messages: [],
        currentPhase: 0,
        hoursSpent: 0,
        clientSatisfaction: 75, // Start neutral-positive
    };

    storage.activeSimulations = [simulation, ...storage.activeSimulations];
    saveSimulationStorage(storage);

    return simulation;
}

export function updateSimulation(id: string, updates: Partial<Simulation>): Simulation | null {
    const storage = getSimulationStorage();
    const index = storage.activeSimulations.findIndex(s => s.id === id);

    if (index === -1) return null;

    storage.activeSimulations[index] = {
        ...storage.activeSimulations[index],
        ...updates,
    };

    saveSimulationStorage(storage);
    return storage.activeSimulations[index];
}

export function startSimulation(id: string): Simulation | null {
    return updateSimulation(id, { status: "in_progress" });
}

export function addMessage(id: string, message: Omit<ChatMessage, "id" | "timestamp">): Simulation | null {
    const simulation = getActiveSimulation(id);
    if (!simulation) return null;

    const newMessage: ChatMessage = {
        ...message,
        id: generateId(),
        timestamp: new Date().toISOString(),
    };

    return updateSimulation(id, {
        messages: [...simulation.messages, newMessage],
    });
}

export function updatePhase(id: string, phase: number): Simulation | null {
    return updateSimulation(id, { currentPhase: phase });
}

export function updateClientSatisfaction(id: string, delta: number): Simulation | null {
    const simulation = getActiveSimulation(id);
    if (!simulation) return null;

    const newSatisfaction = Math.max(0, Math.min(100, simulation.clientSatisfaction + delta));
    return updateSimulation(id, { clientSatisfaction: newSatisfaction });
}

export function addHoursSpent(id: string, hours: number): Simulation | null {
    const simulation = getActiveSimulation(id);
    if (!simulation) return null;

    return updateSimulation(id, { hoursSpent: simulation.hoursSpent + hours });
}

export function completeSimulation(id: string): Simulation | null {
    const storage = getSimulationStorage();
    const index = storage.activeSimulations.findIndex(s => s.id === id);

    if (index === -1) return null;

    const simulation = {
        ...storage.activeSimulations[index],
        status: "completed" as SimulationStatus,
        completedAt: new Date().toISOString(),
    };

    // Move from active to completed
    storage.activeSimulations.splice(index, 1);
    storage.completedSimulations = [simulation, ...storage.completedSimulations];
    saveSimulationStorage(storage);

    return simulation;
}

export function abandonSimulation(id: string): boolean {
    const storage = getSimulationStorage();
    const index = storage.activeSimulations.findIndex(s => s.id === id);

    if (index === -1) return false;

    const simulation = {
        ...storage.activeSimulations[index],
        status: "abandoned" as SimulationStatus,
        completedAt: new Date().toISOString(),
    };

    storage.activeSimulations.splice(index, 1);
    storage.completedSimulations = [simulation, ...storage.completedSimulations];
    saveSimulationStorage(storage);

    return true;
}

// Completed simulations
export function getCompletedSimulations(): Simulation[] {
    return getSimulationStorage().completedSimulations;
}

// Preferences
export function getPreferences(): SimulationPreferences {
    return getSimulationStorage().preferences;
}

export function updatePreferences(updates: Partial<SimulationPreferences>): void {
    const storage = getSimulationStorage();
    storage.preferences = { ...storage.preferences, ...updates };
    saveSimulationStorage(storage);
}

// Utility functions
export function getSimulationStats(): {
    total: number;
    completed: number;
    active: number;
    abandoned: number;
    avgSatisfaction: number;
} {
    const storage = getSimulationStorage();
    const all = [...storage.activeSimulations, ...storage.completedSimulations];

    const completed = storage.completedSimulations.filter(s => s.status === "completed");
    const abandoned = storage.completedSimulations.filter(s => s.status === "abandoned");

    const avgSatisfaction = completed.length > 0
        ? Math.round(completed.reduce((sum, s) => sum + s.clientSatisfaction, 0) / completed.length)
        : 0;

    return {
        total: all.length,
        completed: completed.length,
        active: storage.activeSimulations.length,
        abandoned: abandoned.length,
        avgSatisfaction,
    };
}

export function clearAllSimulations(): void {
    saveSimulationStorage(getDefaultStorage());
}
