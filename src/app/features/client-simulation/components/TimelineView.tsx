"use client";

import React from "react";
import { motion } from "framer-motion";
import {
    Flag,
    FileText,
    AlertTriangle,
    CheckCircle,
    Circle,
    Calendar,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ScenarioPhase, TriggeredComplication, COMPLICATION_CONFIG } from "../lib/types";

interface TimelineViewProps {
    phases: ScenarioPhase[];
    currentPhase: number;
    startDate: string;
    deadline?: string;
    triggeredComplications: TriggeredComplication[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({
    phases,
    currentPhase,
    startDate,
    deadline,
    triggeredComplications,
}) => {
    // Create timeline events from phases and complications
    const events = createTimelineEvents(phases, currentPhase, triggeredComplications, startDate, deadline);

    return (
        <div className="p-4">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase mb-4 flex items-center gap-1">
                <Calendar size={ICON_SIZES.xs} />
                Project Timeline
            </h4>

            {/* Horizontal timeline */}
            <div className="relative">
                {/* Track line */}
                <div className="absolute top-4 left-0 right-0 h-1 bg-[var(--surface-overlay)] rounded-full" />

                {/* Progress line */}
                <motion.div
                    className="absolute top-4 left-0 h-1 bg-[var(--accent-primary)] rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                        width: `${((currentPhase + 1) / phases.length) * 100}%`
                    }}
                    transition={{ duration: 0.5 }}
                />

                {/* Events */}
                <div className="relative flex justify-between">
                    {events.map((event, index) => (
                        <TimelineEvent
                            key={event.id}
                            event={event}
                            index={index}
                            total={events.length}
                        />
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-6 text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                    <CheckCircle size={ICON_SIZES.xs} className="text-emerald-400" />
                    Completed
                </span>
                <span className="flex items-center gap-1">
                    <Circle size={ICON_SIZES.xs} className="text-blue-400" />
                    Current
                </span>
                <span className="flex items-center gap-1">
                    <Circle size={ICON_SIZES.xs} className="text-[var(--text-muted)]" />
                    Upcoming
                </span>
                <span className="flex items-center gap-1">
                    <AlertTriangle size={ICON_SIZES.xs} className="text-amber-400" />
                    Complication
                </span>
            </div>
        </div>
    );
};

// Timeline event data structure
interface TimelineEventData {
    id: string;
    type: "phase" | "complication" | "deadline";
    label: string;
    description?: string;
    status: "completed" | "current" | "upcoming";
    date?: string;
}

function createTimelineEvents(
    phases: ScenarioPhase[],
    currentPhase: number,
    complications: TriggeredComplication[],
    startDate: string,
    deadline?: string
): TimelineEventData[] {
    const events: TimelineEventData[] = [];

    // Add phase events
    phases.forEach((phase, index) => {
        events.push({
            id: phase.id,
            type: "phase",
            label: phase.name,
            description: phase.description,
            status: index < currentPhase ? "completed" :
                index === currentPhase ? "current" : "upcoming",
        });
    });

    // Add deadline if exists
    if (deadline) {
        events.push({
            id: "deadline",
            type: "deadline",
            label: "Deadline",
            date: deadline,
            status: "upcoming",
        });
    }

    return events;
}

// Timeline event component
interface TimelineEventProps {
    event: TimelineEventData;
    index: number;
    total: number;
}

const TimelineEvent: React.FC<TimelineEventProps> = ({ event, index, total }) => {
    const getIcon = () => {
        switch (event.type) {
            case "phase":
                if (event.status === "completed") {
                    return <CheckCircle size={ICON_SIZES.md} className="text-emerald-400" />;
                }
                if (event.status === "current") {
                    return <Circle size={ICON_SIZES.md} className="text-blue-400 fill-blue-400" />;
                }
                return <Circle size={ICON_SIZES.md} className="text-[var(--text-muted)]" />;
            case "complication":
                return <AlertTriangle size={ICON_SIZES.md} className="text-amber-400" />;
            case "deadline":
                return <Flag size={ICON_SIZES.md} className="text-red-400" />;
            default:
                return <Circle size={ICON_SIZES.md} />;
        }
    };

    const getNodeColor = () => {
        if (event.status === "completed") return "bg-emerald-500";
        if (event.status === "current") return "bg-blue-500";
        if (event.type === "complication") return "bg-amber-500";
        if (event.type === "deadline") return "bg-red-500";
        return "bg-[var(--surface-overlay)]";
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center"
            style={{ width: `${100 / total}%` }}
        >
            {/* Node */}
            <motion.div
                className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center z-10",
                    getNodeColor(),
                    event.status === "current" && "ring-4 ring-blue-500/30"
                )}
                whileHover={{ scale: 1.1 }}
            >
                {getIcon()}
            </motion.div>

            {/* Label */}
            <div className="mt-3 text-center">
                <p className={cn(
                    "text-xs font-medium",
                    event.status === "current" ? "text-[var(--text-primary)]" :
                    event.status === "completed" ? "text-emerald-400" :
                    "text-[var(--text-muted)]"
                )}>
                    {event.label}
                </p>
                {event.description && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
                        {event.description}
                    </p>
                )}
                {event.date && (
                    <p className="text-xs text-red-400 mt-0.5">
                        {formatDate(new Date(event.date))}
                    </p>
                )}
            </div>
        </motion.div>
    );
};

// Compact timeline for smaller spaces
interface CompactTimelineProps {
    phases: ScenarioPhase[];
    currentPhase: number;
}

export const CompactTimeline: React.FC<CompactTimelineProps> = ({
    phases,
    currentPhase,
}) => {
    return (
        <div className="flex items-center gap-1">
            {phases.map((phase, index) => (
                <React.Fragment key={phase.id}>
                    <motion.div
                        className={cn(
                            "w-3 h-3 rounded-full",
                            index < currentPhase ? "bg-emerald-500" :
                            index === currentPhase ? "bg-blue-500" :
                            "bg-[var(--surface-overlay)]"
                        )}
                        whileHover={{ scale: 1.2 }}
                        title={phase.name}
                    />
                    {index < phases.length - 1 && (
                        <div className={cn(
                            "flex-1 h-0.5 min-w-[8px]",
                            index < currentPhase ? "bg-emerald-500" : "bg-[var(--surface-overlay)]"
                        )} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

function formatDate(date: Date): string {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
}
