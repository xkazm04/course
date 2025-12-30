"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Radar } from "lucide-react";
import { getRadarChartData } from "./mockData";
import { CATEGORY_CONFIG, type SkillCategory } from "./types";

interface CompetencyRadarProps {
    size?: number;
    animated?: boolean;
}

export function CompetencyRadar({ size = 240, animated = true }: CompetencyRadarProps) {
    const data = getRadarChartData();
    const center = size / 2;
    const maxRadius = (size / 2) - 36;
    const levels = 5;
    const angleStep = (2 * Math.PI) / data.length;

    const getLevelPoints = (level: number) => {
        const radius = (maxRadius / levels) * level;
        return data.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`;
        }).join(" ");
    };

    const dataPoints = useMemo(() => {
        return data.map((item, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const radius = (item.value / item.maxValue) * maxRadius;
            return {
                x: center + radius * Math.cos(angle),
                y: center + radius * Math.sin(angle),
                value: item.value,
                category: item.category,
                label: item.label,
            };
        });
    }, [data, angleStep, maxRadius, center]);

    const dataPointsString = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

    const labelPositions = useMemo(() => {
        return data.map((item, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const radius = maxRadius + 22;
            return {
                x: center + radius * Math.cos(angle),
                y: center + radius * Math.sin(angle),
                label: item.label,
                category: item.category,
                value: item.value,
            };
        });
    }, [data, angleStep, maxRadius, center]);

    return (
        <section className="bg-[var(--forge-bg-daylight)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-sm p-5">
            <h2 className="font-semibold text-[var(--forge-text-primary)] mb-4 flex items-center gap-2">
                <Radar size={16} className="text-[var(--ember)]" />
                Competency Radar
            </h2>

            <div className="flex justify-center">
                <div className="relative">
                    <svg width={size} height={size} className="overflow-visible">
                        <defs>
                            <linearGradient id="radar-fill" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="var(--ember)" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.15" />
                            </linearGradient>
                            <linearGradient id="radar-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="var(--ember)" />
                                <stop offset="100%" stopColor="var(--gold)" />
                            </linearGradient>
                        </defs>

                        {/* Background levels */}
                        {Array.from({ length: levels }, (_, i) => (
                            <polygon
                                key={`level-${i}`}
                                points={getLevelPoints(i + 1)}
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1}
                                className="text-[var(--forge-border-subtle)]"
                            />
                        ))}

                        {/* Axis lines */}
                        {data.map((_, i) => {
                            const angle = i * angleStep - Math.PI / 2;
                            return (
                                <line
                                    key={`axis-${i}`}
                                    x1={center}
                                    y1={center}
                                    x2={center + maxRadius * Math.cos(angle)}
                                    y2={center + maxRadius * Math.sin(angle)}
                                    stroke="currentColor"
                                    strokeWidth={1}
                                    className="text-[var(--forge-border-subtle)]"
                                />
                            );
                        })}

                        {/* Data polygon */}
                        <motion.polygon
                            points={dataPointsString}
                            fill="url(#radar-fill)"
                            stroke="url(#radar-stroke)"
                            strokeWidth={2}
                            initial={animated ? { opacity: 0, scale: 0.6 } : {}}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7, ease: "easeOut" }}
                            style={{ transformOrigin: `${center}px ${center}px` }}
                        />

                        {/* Data points */}
                        {dataPoints.map((point, i) => (
                            <motion.circle
                                key={`point-${i}`}
                                cx={point.x}
                                cy={point.y}
                                r={5}
                                className="fill-[var(--forge-bg-daylight)] stroke-[var(--ember)]"
                                strokeWidth={2}
                                initial={animated ? { opacity: 0, scale: 0 } : {}}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: animated ? 0.7 + i * 0.08 : 0 }}
                            />
                        ))}
                    </svg>

                    {/* Labels */}
                    {labelPositions.map((pos, i) => {
                        const config = CATEGORY_CONFIG[pos.category as SkillCategory];
                        return (
                            <motion.div
                                key={`label-${i}`}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                style={{ left: pos.x, top: pos.y }}
                                initial={animated ? { opacity: 0 } : {}}
                                animate={{ opacity: 1 }}
                                transition={{ delay: animated ? 0.9 + i * 0.05 : 0 }}
                            >
                                <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-[10px] font-medium text-[var(--forge-text-secondary)] whitespace-nowrap">
                                        {pos.label}
                                    </span>
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--ember)]/10 text-[var(--ember)]">
                                        {pos.value}%
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
