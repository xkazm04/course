"use client";

import { motion } from "framer-motion";
import { BookOpen, GraduationCap, Clock, Map } from "lucide-react";

interface StatsRowProps {
    chaptersCompleted: number;
    coursesCompleted: number;
    totalLearningTime: number;
    pathsActive: number;
}

function formatTime(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

const stats = [
    { key: "chapters", icon: BookOpen, label: "Chapters", color: "text-blue-500", bg: "bg-blue-500/10" },
    { key: "courses", icon: GraduationCap, label: "Courses", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { key: "time", icon: Clock, label: "Learning Time", color: "text-purple-500", bg: "bg-purple-500/10" },
    { key: "paths", icon: Map, label: "Active Paths", color: "text-orange-500", bg: "bg-orange-500/10" },
];

export function StatsRow({
    chaptersCompleted,
    coursesCompleted,
    totalLearningTime,
    pathsActive,
}: StatsRowProps) {
    const values: Record<string, string | number> = {
        chapters: chaptersCompleted,
        courses: coursesCompleted,
        time: formatTime(totalLearningTime),
        paths: pathsActive,
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-lg overflow-hidden"
        >
            <div className="p-6">
                <h3 className="font-semibold text-[var(--forge-text-primary)] mb-4">
                    Quick Stats
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <motion.div
                                key={stat.key}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.2 + index * 0.05 }}
                                className="flex items-center gap-3"
                            >
                                <div className={`p-2 rounded-xl ${stat.bg}`}>
                                    <Icon className={`w-4 h-4 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-[var(--forge-text-primary)]">
                                        {values[stat.key]}
                                    </p>
                                    <p className="text-xs text-[var(--forge-text-muted)]">
                                        {stat.label}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
}
