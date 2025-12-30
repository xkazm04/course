"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Clock, TrendingUp, Award } from "lucide-react";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { PathStats } from "../lib/types";

interface SocialProofStatsProps {
  stats: PathStats;
  reducedMotion: boolean;
}

/**
 * Statistics bar showing social proof metrics
 */
export function SocialProofStats({
  stats,
  reducedMotion,
}: SocialProofStatsProps) {
  const statItems = [
    {
      icon: Users,
      value: `${stats.totalJourneys}+`,
      label: "Success Stories",
      color: "text-[var(--forge-accent-ember)]",
    },
    {
      icon: Clock,
      value: `${stats.averageMonths}mo`,
      label: "Avg. Duration",
      color: "text-[var(--forge-accent-spark)]",
    },
    {
      icon: TrendingUp,
      value: `${stats.successRate}%`,
      label: "Success Rate",
      color: "text-[var(--forge-accent-molten)]",
    },
    {
      icon: Award,
      value: "Real",
      label: "Verified Paths",
      color: "text-[var(--forge-accent-forge)]",
    },
  ];

  return (
    <div
      className="flex flex-wrap justify-center gap-6 md:gap-10 text-[var(--forge-text-primary)]"
      data-testid="social-proof-stats"
    >
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          className="flex items-center gap-2"
          initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reducedMotion ? 0 : 0.2 + index * 0.1,
            duration: reducedMotion ? 0 : 0.4,
          }}
          data-testid={`stat-${item.label.toLowerCase().replace(" ", "-")}`}
        >
          <div className="p-2 rounded-lg bg-[var(--forge-bg-elevated)]">
            <item.icon size={ICON_SIZES.md} className={item.color} />
          </div>
          <div>
            <div className="text-lg font-bold">{item.value}</div>
            <div className="text-xs text-[var(--forge-text-muted)]">
              {item.label}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

interface SocialProofStatsCompactProps {
  stats: PathStats;
  reducedMotion: boolean;
}

/**
 * Compact inline stats for smaller displays
 */
export function SocialProofStatsCompact({
  stats,
  reducedMotion,
}: SocialProofStatsCompactProps) {
  return (
    <motion.div
      className="flex items-center gap-4 text-xs text-[var(--forge-text-muted)]"
      initial={{ opacity: reducedMotion ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: reducedMotion ? 0 : 0.3 }}
      data-testid="social-proof-stats-compact"
    >
      <span className="flex items-center gap-1">
        <Users size={ICON_SIZES.xs} />
        {stats.totalJourneys}+ paths
      </span>
      <span className="flex items-center gap-1">
        <Clock size={ICON_SIZES.xs} />
        ~{stats.averageMonths}mo avg
      </span>
      <span className="flex items-center gap-1 text-[var(--forge-accent-spark)]">
        <TrendingUp size={ICON_SIZES.xs} />
        {stats.successRate}%
      </span>
    </motion.div>
  );
}
