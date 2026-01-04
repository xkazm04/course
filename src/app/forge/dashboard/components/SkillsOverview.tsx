"use client";

import Link from "next/link";
import { cn } from "@/app/shared/lib/utils";
import { useForge } from "../../layout";

const levelColors: Record<string, string> = {
    beginner: "bg-[var(--forge-success)]",
    intermediate: "bg-[var(--gold)]",
    advanced: "bg-[var(--ember)]",
    expert: "bg-[var(--ember-glow)]",
};

// Mock skills data for demo (ForgeUser doesn't have skills yet)
const MOCK_SKILLS = [
    { id: "1", name: "JavaScript", level: "advanced", proficiency: 85 },
    { id: "2", name: "React", level: "intermediate", proficiency: 70 },
    { id: "3", name: "TypeScript", level: "intermediate", proficiency: 65 },
    { id: "4", name: "Node.js", level: "beginner", proficiency: 45 },
];

export function SkillsOverview() {
    const { user } = useForge();
    const skills = MOCK_SKILLS; // Use mock data until skills are added to ForgeUser

    if (!user) return null;

    return (
        <div className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-xl border border-[var(--forge-border-subtle)] shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-[var(--forge-border-subtle)]">
                <h3 className="font-semibold text-[var(--forge-text-primary)]">Your Skills</h3>
                <Link
                    href="/forge/profile"
                    className="text-sm text-[var(--ember)] hover:underline"
                >
                    View All
                </Link>
            </div>
            <div className="p-4 space-y-4">
                {skills.slice(0, 4).map((skill) => (
                    <div key={skill.id}>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-sm font-medium text-[var(--forge-text-primary)]">
                                {skill.name}
                            </span>
                            <span className="text-xs text-[var(--forge-text-muted)] capitalize">
                                {skill.level}
                            </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[var(--forge-bg-elevated)]">
                            <div
                                className={cn("h-full rounded-full", levelColors[skill.level])}
                                style={{ width: `${skill.proficiency}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
