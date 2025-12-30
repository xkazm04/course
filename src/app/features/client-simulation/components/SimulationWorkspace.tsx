"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Play,
    Pause,
    RotateCcw,
    CheckCircle,
    XCircle,
    MessageSquare,
    LayoutGrid,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { elevation } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { useSimulation } from "../lib/useSimulation";
import { PROJECT_TYPE_CONFIG } from "../lib/types";
import { PERSONA_TEMPLATES } from "../lib/personaTemplates";
import { getAllScenarioTemplates } from "../lib/scenarioTemplates";
import { ClientProfile } from "./ClientProfile";
import { ChatInterface } from "./ChatInterface";
import { RequirementsPanel } from "./RequirementsPanel";
import { TimelineView, CompactTimeline } from "./TimelineView";
import { ComplicationList } from "./ComplicationAlert";

type ViewMode = "workspace" | "gallery" | "history";

export const SimulationWorkspace: React.FC = () => {
    const {
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
        complete,
        abandon,
        getAllCurrentRequirements,
    } = useSimulation();

    const [viewMode, setViewMode] = useState<ViewMode>(
        activeSimulations.length > 0 ? "workspace" : "gallery"
    );

    // Simulate initial client greeting when starting new simulation
    useEffect(() => {
        if (currentSimulation && currentPersona && currentScenario &&
            currentSimulation.messages.length === 0) {
            const greeting = generateGreeting(currentPersona, currentScenario.initialBrief);
            setTimeout(() => {
                simulateClientResponse(greeting, 1500);
            }, 500);
        }
    }, [currentSimulation?.id]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Users size={ICON_SIZES.xl} className="text-[var(--ember)]" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--forge-text-primary)]">
                        Client Simulation
                    </h2>
                    <p className="text-[var(--forge-text-muted)] mt-1">
                        Practice client communication with AI-generated scenarios
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Stats */}
                    <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-[var(--forge-bg-elevated)]">
                        <div className="text-center">
                            <div className="text-lg font-bold text-[var(--forge-text-primary)]">{stats.completed}</div>
                            <div className="text-xs text-[var(--forge-text-muted)]">Completed</div>
                        </div>
                        <div className="w-px h-8 bg-[var(--forge-border-subtle)]" />
                        <div className="text-center">
                            <div className="text-lg font-bold text-[var(--forge-success)]">{stats.avgSatisfaction}%</div>
                            <div className="text-xs text-[var(--forge-text-muted)]">Avg. Satisfaction</div>
                        </div>
                    </div>

                    {/* View toggle */}
                    <div className="flex rounded-lg bg-[var(--forge-bg-elevated)] p-1">
                        <button
                            onClick={() => setViewMode("workspace")}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                viewMode === "workspace"
                                    ? "bg-[var(--ember)] text-white"
                                    : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                            )}
                        >
                            Workspace
                        </button>
                        <button
                            onClick={() => setViewMode("gallery")}
                            className={cn(
                                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                                viewMode === "gallery"
                                    ? "bg-[var(--ember)] text-white"
                                    : "text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)]"
                            )}
                        >
                            Clients
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
                {viewMode === "workspace" && currentSimulation && currentPersona && currentScenario ? (
                    <WorkspaceView
                        simulation={currentSimulation}
                        persona={currentPersona}
                        scenario={currentScenario}
                        requirements={getAllCurrentRequirements()}
                        onSendMessage={sendMessage}
                        onSimulateResponse={simulateClientResponse}
                        onUpdateRequirement={updateRequirementStatus}
                        onAdvancePhase={advancePhase}
                        onComplete={complete}
                        onAbandon={abandon}
                    />
                ) : viewMode === "workspace" && !currentSimulation ? (
                    <EmptyWorkspace onSelectClient={() => setViewMode("gallery")} />
                ) : (
                    <ClientGallery
                        onStartSimulation={(clientId, scenarioId) => {
                            startNewSimulation(clientId, scenarioId);
                            setViewMode("workspace");
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

// Workspace view with chat and requirements
interface WorkspaceViewProps {
    simulation: ReturnType<typeof useSimulation>["currentSimulation"];
    persona: ReturnType<typeof useSimulation>["currentPersona"];
    scenario: ReturnType<typeof useSimulation>["currentScenario"];
    requirements: ReturnType<ReturnType<typeof useSimulation>["getAllCurrentRequirements"]>;
    onSendMessage: (content: string) => void;
    onSimulateResponse: (content: string, delay?: number) => void;
    onUpdateRequirement: (id: string, status: any) => void;
    onAdvancePhase: () => void;
    onComplete: () => void;
    onAbandon: () => void;
}

const WorkspaceView: React.FC<WorkspaceViewProps> = ({
    simulation,
    persona,
    scenario,
    requirements,
    onSendMessage,
    onSimulateResponse,
    onUpdateRequirement,
    onAdvancePhase,
    onComplete,
    onAbandon,
}) => {
    if (!simulation || !persona || !scenario) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
        >
            {/* Client header */}
            <div className={cn(
                "rounded-xl border border-[var(--forge-border-default)]",
                "bg-[var(--forge-bg-elevated)] p-4",
                elevation.elevated
            )}>
                <div className="flex items-center justify-between">
                    <ClientProfile persona={persona} compact />
                    <div className="flex items-center gap-4">
                        <SatisfactionMeter value={simulation.clientSatisfaction} />
                        <div className="flex gap-2">
                            <button
                                onClick={onComplete}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--forge-success)]/20 text-[var(--forge-success)] hover:bg-[var(--forge-success)]/30 transition-colors"
                            >
                                <CheckCircle size={ICON_SIZES.sm} />
                                Complete
                            </button>
                            <button
                                onClick={onAbandon}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--forge-error)]/20 text-[var(--forge-error)] hover:bg-[var(--forge-error)]/30 transition-colors"
                            >
                                <XCircle size={ICON_SIZES.sm} />
                                Abandon
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main workspace grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
                {/* Chat panel */}
                <div className={cn(
                    "lg:col-span-2 rounded-xl border border-[var(--forge-border-default)]",
                    "bg-[var(--forge-bg-elevated)] overflow-hidden",
                    elevation.elevated
                )}>
                    <ChatInterface
                        messages={simulation.messages}
                        persona={persona}
                        onSendMessage={(content) => {
                            onSendMessage(content);
                            // Simulate client response after user sends message
                            const responses = getContextualResponses(persona, content);
                            const response = responses[Math.floor(Math.random() * responses.length)];
                            onSimulateResponse(response, 2000 + Math.random() * 2000);
                        }}
                    />
                </div>

                {/* Requirements panel */}
                <div className={cn(
                    "rounded-xl border border-[var(--forge-border-default)]",
                    "bg-[var(--forge-bg-elevated)] overflow-hidden",
                    elevation.elevated
                )}>
                    <RequirementsPanel
                        requirements={requirements}
                        bonusObjectives={scenario.bonusObjectives}
                        budget={scenario.budget}
                        deadline={scenario.deadline}
                        currentPhase={simulation.currentPhase}
                        totalPhases={scenario.phases.length}
                        onToggleRequirement={onUpdateRequirement}
                    />
                </div>
            </div>

            {/* Timeline */}
            <div className={cn(
                "rounded-xl border border-[var(--forge-border-default)]",
                "bg-[var(--forge-bg-elevated)]",
                elevation.elevated
            )}>
                <TimelineView
                    phases={scenario.phases}
                    currentPhase={simulation.currentPhase}
                    startDate={scenario.startDate}
                    deadline={scenario.deadline}
                    triggeredComplications={scenario.triggeredComplications}
                />
            </div>

            {/* Active complications */}
            {scenario.triggeredComplications.length > 0 && (
                <ComplicationList
                    complications={scenario.triggeredComplications}
                />
            )}
        </motion.div>
    );
};

// Satisfaction meter
interface SatisfactionMeterProps {
    value: number;
}

const SatisfactionMeter: React.FC<SatisfactionMeterProps> = ({ value }) => {
    const colorClass = value >= 70 ? "bg-[var(--forge-success)]" : value >= 40 ? "bg-[var(--forge-warning)]" : "bg-[var(--forge-error)]";
    const textColorClass = value >= 70 ? "text-[var(--forge-success)]" : value >= 40 ? "text-[var(--forge-warning)]" : "text-[var(--forge-error)]";

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--forge-text-muted)]">Satisfaction</span>
            <div className="w-24 h-2 rounded-full bg-[var(--forge-bg-elevated)]">
                <motion.div
                    className={`h-full rounded-full ${colorClass}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                />
            </div>
            <span className={`text-sm font-medium ${textColorClass}`}>{value}%</span>
        </div>
    );
};

// Empty workspace state
interface EmptyWorkspaceProps {
    onSelectClient: () => void;
}

const EmptyWorkspace: React.FC<EmptyWorkspaceProps> = ({ onSelectClient }) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
        >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--forge-bg-elevated)] mb-4">
                <MessageSquare size={ICON_SIZES.xl} className="text-[var(--forge-text-muted)]" />
            </div>
            <h3 className="text-xl font-semibold text-[var(--forge-text-primary)]">
                No Active Simulation
            </h3>
            <p className="text-[var(--forge-text-muted)] mt-2 max-w-md mx-auto">
                Select a client from the gallery to start a new simulation and practice your communication skills.
            </p>
            <button
                onClick={onSelectClient}
                className="mt-6 px-6 py-3 rounded-xl bg-[var(--ember)] text-white font-medium hover:bg-[var(--ember-glow)] transition-colors"
            >
                Browse Clients
            </button>
        </motion.div>
    );
};

// Client gallery
interface ClientGalleryProps {
    onStartSimulation: (clientId: string, scenarioId: string) => void;
}

const ClientGallery: React.FC<ClientGalleryProps> = ({ onStartSimulation }) => {
    const scenarios = getAllScenarioTemplates();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PERSONA_TEMPLATES.slice(0, 6).map(persona => {
                    const personaScenarios = scenarios.filter(s => s.clientId === persona.id);
                    const scenario = personaScenarios[0];

                    return (
                        <motion.div
                            key={persona.id}
                            whileHover={{ scale: 1.02, y: -4 }}
                            className={cn(
                                "rounded-xl border border-[var(--forge-border-default)]",
                                "bg-[var(--forge-bg-elevated)] overflow-hidden cursor-pointer",
                                elevation.hoverable
                            )}
                            onClick={() => scenario && onStartSimulation(persona.id, scenario.id)}
                        >
                            <div className="p-4">
                                <ClientProfile persona={persona} compact showDetails={false} />
                                {scenario && (
                                    <div className="mt-3 p-3 rounded-lg bg-[var(--forge-bg-workshop)]">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-[var(--forge-text-muted)]">
                                                Project:
                                            </span>
                                            <span className="text-xs text-[var(--ember)]">
                                                {PROJECT_TYPE_CONFIG[scenario.projectType].label}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[var(--forge-text-secondary)] line-clamp-2">
                                            "{scenario.brief}"
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="px-4 py-3 border-t border-[var(--forge-border-subtle)] bg-[var(--forge-bg-workshop)]">
                                <button className="w-full py-2 rounded-lg bg-[var(--ember)] text-white text-sm font-medium hover:bg-[var(--ember-glow)] transition-colors">
                                    Start Simulation
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

// Helper functions
function generateGreeting(persona: any, brief: string): string {
    const greetings = persona.messageStyle.greetingStyle;
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];

    if (persona.messageStyle.formalityLevel === "formal") {
        return `${greeting},\n\n${brief}\n\nI look forward to discussing this further.`;
    } else if (persona.messageStyle.formalityLevel === "casual") {
        return `${greeting}! ${brief}`;
    }
    return `${greeting},\n\n${brief}`;
}

function getContextualResponses(persona: any, userMessage: string): string[] {
    const lowercaseMsg = userMessage.toLowerCase();

    if (lowercaseMsg.includes("timeline") || lowercaseMsg.includes("when") || lowercaseMsg.includes("deadline")) {
        return [
            "We're hoping to launch in about 4 weeks. Is that doable?",
            "Sooner is better, but we're flexible. What's realistic?",
            "No hard deadline, but I'd love to see something soon!",
        ];
    }

    if (lowercaseMsg.includes("budget") || lowercaseMsg.includes("cost") || lowercaseMsg.includes("price")) {
        if (persona.budgetSensitivity === "strict") {
            return [
                "We have a pretty tight budget on this one. What's the minimum we'd need?",
                "Cost is definitely a factor. Can we keep it lean?",
            ];
        }
        return [
            "We have some flexibility on budget if it means getting it right.",
            "Happy to discuss. What range are we looking at?",
        ];
    }

    if (lowercaseMsg.includes("feature") || lowercaseMsg.includes("requirement")) {
        return [
            "Good question! Let me think about what's most important...",
            "The core functionality is key. We can add more later.",
            "I listed the main things, but I'm open to suggestions!",
        ];
    }

    // Default responses
    return [
        "That makes sense. What do you think we should do?",
        "Interesting! Tell me more about how that would work.",
        "OK, I trust your judgment on the technical stuff.",
        "Sounds good to me. What's the next step?",
    ];
}
