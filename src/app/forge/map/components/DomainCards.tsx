"use client";

import { motion } from "framer-motion";
import {
    Monitor, Layers, Smartphone, Gamepad2, Server, Database,
    type LucideIcon
} from "lucide-react";
import type { LearningPath, DomainCard } from "../lib/types";

interface DomainCardsProps {
    onSelect: (domain: LearningPath) => void;
}

const DOMAINS: DomainCard[] = [
    {
        id: "frontend",
        title: "Frontend",
        tagline: "Craft beautiful interfaces",
        icon: Monitor,
        gradient: "from-[var(--ember)] via-[var(--ember-glow)] to-[var(--ember)]",
        pattern: "radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)",
        accent: "#6366f1",
    },
    {
        id: "fullstack",
        title: "Fullstack",
        tagline: "Master the complete stack",
        icon: Layers,
        gradient: "from-[var(--ember-glow)] via-[var(--ember-glow)] to-[var(--ember)]",
        pattern: "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 50%)",
        accent: "#a855f7",
    },
    {
        id: "mobile",
        title: "Mobile",
        tagline: "Build native experiences",
        icon: Smartphone,
        gradient: "from-[var(--forge-error)] via-[var(--forge-error)] to-[var(--ember-glow)]",
        pattern: "radial-gradient(circle at 50% 100%, rgba(255,255,255,0.1) 0%, transparent 40%)",
        accent: "#ec4899",
    },
    {
        id: "games",
        title: "Games",
        tagline: "Create immersive worlds",
        icon: Gamepad2,
        gradient: "from-orange-500 via-amber-500 to-yellow-500",
        pattern: "radial-gradient(circle at 10% 10%, rgba(255,255,255,0.15) 0%, transparent 45%)",
        accent: "#f97316",
    },
    {
        id: "backend",
        title: "Backend",
        tagline: "Power the infrastructure",
        icon: Server,
        gradient: "from-[var(--forge-success)] via-[var(--forge-success)] to-[var(--forge-info)]",
        pattern: "radial-gradient(circle at 90% 90%, rgba(255,255,255,0.1) 0%, transparent 50%)",
        accent: "#10b981",
    },
    {
        id: "databases",
        title: "Databases",
        tagline: "Architect data systems",
        icon: Database,
        gradient: "from-[var(--forge-info)] via-[var(--forge-info)] to-[var(--forge-info)]",
        pattern: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12) 0%, transparent 45%)",
        accent: "#06b6d4",
    },
];

function DomainCard({
    domain,
    index,
    onSelect
}: {
    domain: DomainCard;
    index: number;
    onSelect: (id: LearningPath) => void;
}) {
    const Icon = domain.icon;

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(domain.id)}
            className={`
                relative overflow-hidden rounded-2xl
                bg-gradient-to-br ${domain.gradient}
                flex flex-col items-center justify-center gap-4
                cursor-pointer group transition-shadow duration-300
                hover:shadow-2xl hover:shadow-black/20
            `}
            style={{ background: domain.pattern }}
        >
            {/* Gradient base */}
            <div className={`absolute inset-0 bg-gradient-to-br ${domain.gradient} opacity-90`} />

            {/* Pattern overlay */}
            <div
                className="absolute inset-0 opacity-30"
                style={{ background: domain.pattern }}
            />

            {/* Decorative shapes */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-black/10 blur-3xl" />

            {/* Hex pattern background */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id={`hex-${domain.id}`} width="56" height="100" patternUnits="userSpaceOnUse">
                        <path
                            d="M28 66L0 50V16L28 0L56 16V50L28 66ZM28 100L0 84V50L28 34L56 50V84L28 100Z"
                            fill="none"
                            stroke="white"
                            strokeWidth="1"
                        />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill={`url(#hex-${domain.id})`} />
            </svg>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-3">
                <motion.div
                    className="p-5 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20
                               group-hover:bg-white/25 transition-colors duration-300"
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                >
                    <Icon className="w-12 h-12 text-white drop-shadow-lg" strokeWidth={1.5} />
                </motion.div>

                <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">
                    {domain.title}
                </h2>

                <p className="text-white/80 text-lg font-medium">
                    {domain.tagline}
                </p>

                {/* Progress hint */}
                <div className="mt-4 flex items-center gap-2 text-white/60 text-sm">
                    <div className="w-16 h-1.5 rounded-full bg-white/20 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "0%" }}
                            className="h-full bg-white/60 rounded-full"
                        />
                    </div>
                    <span>Start</span>
                </div>
            </div>

            {/* Hover shine effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500
                            bg-gradient-to-tr from-transparent via-white/10 to-transparent
                            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
        </motion.button>
    );
}

export function DomainCards({ onSelect }: DomainCardsProps) {
    return (
        <div className="fixed inset-0 bg-[var(--forge-bg-void)] overflow-hidden">
            {/* Ambient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--forge-bg-anvil)] via-[var(--forge-bg-void)] to-black" />

            {/* Grid container */}
            <div className="relative z-10 h-full grid grid-cols-3 grid-rows-2 gap-3 p-3">
                {DOMAINS.map((domain, i) => (
                    <DomainCard
                        key={domain.id}
                        domain={domain}
                        index={i}
                        onSelect={onSelect}
                    />
                ))}
            </div>

            {/* Header overlay */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute top-6 left-1/2 -translate-x-1/2 z-20
                           px-6 py-3 rounded-full bg-black/40 backdrop-blur-md border border-white/10"
            >
                <h1 className="text-white/90 text-lg font-medium tracking-wide">
                    Choose Your Path
                </h1>
            </motion.div>
        </div>
    );
}
