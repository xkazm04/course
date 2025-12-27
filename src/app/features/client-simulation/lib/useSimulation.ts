"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
    Simulation,
    Scenario,
    ClientPersona,
    ChatMessage,
    Requirement,
    RequirementStatus,
    ScenarioPhase,
    TriggeredComplication,
} from "./types";
import {
    getActiveSimulations,
    getCompletedSimulations,
    createSimulation,
    updateSimulation,
    startSimulation,
    addMessage,
    updatePhase,
    updateClientSatisfaction,
    completeSimulation,
    abandonSimulation,
    getSimulationStats,
} from "./simulationStorage";
import { getPersonaById, PERSONA_TEMPLATES } from "./personaTemplates";
import { getScenarioTemplate, SCENARIO_TEMPLATES } from "./scenarioTemplates";

interface UseSimulationReturn {
    // Data
    activeSimulations: Simulation[];
    completedSimulations: Simulation[];
    currentSimulation: Simulation | null;
    currentPersona: ClientPersona | null;
    currentScenario: Scenario | null;
    stats: ReturnType<typeof getSimulationStats>;
    isLoading: boolean;

    // Actions
    startNewSimulation: (clientId: string, scenarioId: string) => Simulation;
    selectSimulation: (id: string) => void;
    sendMessage: (content: string) => void;
    simulateClientResponse: (content: string, delay?: number) => void;
    advancePhase: () => void;
    updateRequirementStatus: (reqId: string, status: RequirementStatus) => void;
    triggerComplication: (complicationId: string) => void;
    complete: () => void;
    abandon: () => void;

    // Helpers
    getAllCurrentRequirements: () => Requirement[];
    getClientResponseDelay: () => number;
}

export function useSimulation(): UseSimulationReturn {
    const [activeSimulations, setActiveSimulations] = useState<Simulation[]>([]);
    const [completedSimulations, setCompletedSimulations] = useState<Simulation[]>([]);
    const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(null);
    const [scenarios, setScenarios] = useState<Record<string, Scenario>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Load initial data
    useEffect(() => {
        const active = getActiveSimulations();
        const completed = getCompletedSimulations();

        // Load scenarios for active simulations
        const loadedScenarios: Record<string, Scenario> = {};
        active.forEach(sim => {
            const scenario = getScenarioTemplate(sim.scenarioId);
            if (scenario) {
                loadedScenarios[sim.scenarioId] = scenario;
            }
        });

        setActiveSimulations(active);
        setCompletedSimulations(completed);
        setScenarios(loadedScenarios);
        setIsLoading(false);
    }, []);

    // Current simulation derived state
    const currentSimulation = useMemo(() => {
        if (!currentSimulationId) return null;
        return activeSimulations.find(s => s.id === currentSimulationId) || null;
    }, [currentSimulationId, activeSimulations]);

    const currentPersona = useMemo(() => {
        if (!currentSimulation) return null;
        return getPersonaById(currentSimulation.clientId) || null;
    }, [currentSimulation]);

    const currentScenario = useMemo(() => {
        if (!currentSimulation) return null;
        return scenarios[currentSimulation.scenarioId] || null;
    }, [currentSimulation, scenarios]);

    const stats = useMemo(() => getSimulationStats(), [activeSimulations, completedSimulations]);

    // Actions
    const startNewSimulation = useCallback((clientId: string, scenarioId: string): Simulation => {
        const simulation = createSimulation(clientId, scenarioId);
        const scenario = getScenarioTemplate(scenarioId);

        if (scenario) {
            setScenarios(prev => ({ ...prev, [scenarioId]: scenario }));
        }

        setActiveSimulations(prev => [simulation, ...prev]);
        setCurrentSimulationId(simulation.id);

        // Start the simulation
        startSimulation(simulation.id);

        return simulation;
    }, []);

    const selectSimulation = useCallback((id: string) => {
        setCurrentSimulationId(id);
    }, []);

    const sendMessage = useCallback((content: string) => {
        if (!currentSimulationId) return;

        const message: Omit<ChatMessage, "id" | "timestamp"> = {
            sender: "user",
            content,
        };

        const updated = addMessage(currentSimulationId, message);
        if (updated) {
            setActiveSimulations(prev =>
                prev.map(s => s.id === currentSimulationId ? updated : s)
            );
        }
    }, [currentSimulationId]);

    const simulateClientResponse = useCallback((content: string, delay: number = 1000) => {
        if (!currentSimulationId) return;

        // First show typing indicator
        const typingMessage: Omit<ChatMessage, "id" | "timestamp"> = {
            sender: "client",
            content: "",
            isTyping: true,
        };

        const withTyping = addMessage(currentSimulationId, typingMessage);
        if (withTyping) {
            setActiveSimulations(prev =>
                prev.map(s => s.id === currentSimulationId ? withTyping : s)
            );
        }

        // Then show actual message after delay
        setTimeout(() => {
            // Remove typing message and add real message
            const sim = getActiveSimulations().find(s => s.id === currentSimulationId);
            if (!sim) return;

            const messagesWithoutTyping = sim.messages.filter(m => !m.isTyping);
            const realMessage: ChatMessage = {
                id: `msg-${Date.now()}`,
                sender: "client",
                content,
                timestamp: new Date().toISOString(),
            };

            const updated = updateSimulation(currentSimulationId, {
                messages: [...messagesWithoutTyping, realMessage],
            });

            if (updated) {
                setActiveSimulations(prev =>
                    prev.map(s => s.id === currentSimulationId ? updated : s)
                );
            }
        }, delay);
    }, [currentSimulationId]);

    const advancePhase = useCallback(() => {
        if (!currentSimulation || !currentScenario) return;

        const nextPhase = currentSimulation.currentPhase + 1;
        if (nextPhase >= currentScenario.phases.length) return;

        const updated = updatePhase(currentSimulationId!, nextPhase);
        if (updated) {
            setActiveSimulations(prev =>
                prev.map(s => s.id === currentSimulationId ? updated : s)
            );

            // Trigger phase messages
            const phase = currentScenario.phases[nextPhase];
            phase.clientMessages.forEach((msg, index) => {
                if (!msg.triggered) {
                    setTimeout(() => {
                        simulateClientResponse(msg.content, 500);
                    }, (index + 1) * 2000);
                }
            });
        }
    }, [currentSimulation, currentScenario, currentSimulationId, simulateClientResponse]);

    const updateRequirementStatus = useCallback((reqId: string, status: RequirementStatus) => {
        if (!currentScenario) return;

        // Update scenario requirements
        const updatedScenario = { ...currentScenario };
        updatedScenario.phases = updatedScenario.phases.map(phase => ({
            ...phase,
            newRequirements: phase.newRequirements.map(req =>
                req.id === reqId ? { ...req, status } : req
            ),
        }));

        setScenarios(prev => ({
            ...prev,
            [currentScenario.id]: updatedScenario,
        }));

        // Update satisfaction based on completion
        if (status === "completed" && currentSimulationId) {
            updateClientSatisfaction(currentSimulationId, 5);
            const sim = getActiveSimulations().find(s => s.id === currentSimulationId);
            if (sim) {
                setActiveSimulations(prev =>
                    prev.map(s => s.id === currentSimulationId
                        ? { ...s, clientSatisfaction: Math.min(100, s.clientSatisfaction + 5) }
                        : s
                    )
                );
            }
        }
    }, [currentScenario, currentSimulationId]);

    const triggerComplication = useCallback((complicationId: string) => {
        if (!currentScenario || !currentSimulationId) return;

        const complication = currentScenario.plannedComplications.find(c => c.id === complicationId);
        if (!complication) return;

        const triggered: TriggeredComplication = {
            ...complication,
            triggeredAt: new Date().toISOString(),
            resolved: false,
        };

        const updatedScenario = {
            ...currentScenario,
            triggeredComplications: [...currentScenario.triggeredComplications, triggered],
        };

        setScenarios(prev => ({
            ...prev,
            [currentScenario.id]: updatedScenario,
        }));

        // Send complication message
        simulateClientResponse(complication.clientMessage, 500);

        // Decrease satisfaction based on stress level
        const satisfactionDelta = complication.impact.stressLevel === "high" ? -10 :
            complication.impact.stressLevel === "medium" ? -5 : -2;
        updateClientSatisfaction(currentSimulationId, satisfactionDelta);
    }, [currentScenario, currentSimulationId, simulateClientResponse]);

    const complete = useCallback(() => {
        if (!currentSimulationId) return;

        const completed = completeSimulation(currentSimulationId);
        if (completed) {
            setActiveSimulations(prev => prev.filter(s => s.id !== currentSimulationId));
            setCompletedSimulations(prev => [completed, ...prev]);
            setCurrentSimulationId(null);
        }
    }, [currentSimulationId]);

    const abandon = useCallback(() => {
        if (!currentSimulationId) return;

        const success = abandonSimulation(currentSimulationId);
        if (success) {
            const abandoned = { ...currentSimulation!, status: "abandoned" as const };
            setActiveSimulations(prev => prev.filter(s => s.id !== currentSimulationId));
            setCompletedSimulations(prev => [abandoned, ...prev]);
            setCurrentSimulationId(null);
        }
    }, [currentSimulationId, currentSimulation]);

    // Helper functions
    const getAllCurrentRequirements = useCallback((): Requirement[] => {
        if (!currentScenario || !currentSimulation) return [];

        const requirements: Requirement[] = [];
        for (let i = 0; i <= currentSimulation.currentPhase; i++) {
            if (currentScenario.phases[i]) {
                requirements.push(...currentScenario.phases[i].newRequirements);
            }
        }
        return requirements;
    }, [currentScenario, currentSimulation]);

    const getClientResponseDelay = useCallback((): number => {
        if (!currentPersona) return 2000;
        return currentPersona.typicalResponseDelay * 100; // Scale down for demo
    }, [currentPersona]);

    return {
        activeSimulations,
        completedSimulations,
        currentSimulation,
        currentPersona,
        currentScenario,
        stats,
        isLoading,
        startNewSimulation,
        selectSimulation,
        sendMessage,
        simulateClientResponse,
        advancePhase,
        updateRequirementStatus,
        triggerComplication,
        complete,
        abandon,
        getAllCurrentRequirements,
        getClientResponseDelay,
    };
}
