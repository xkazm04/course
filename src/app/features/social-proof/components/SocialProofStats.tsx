"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Clock, TrendingUp, Award } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import type { PathStats } from "../lib/types";

interface SocialProofStatsProps {
  stats: PathStats;
  reducedMotion: boolean;
  theme?: "light" | "dark";
}

/**
 * Statistics bar showing social proof metrics
 */
export function SocialProofStats({
  stats,
  reducedMotion,
  theme = "dark",
}: SocialProofStatsProps) {
  const isDark = theme === "dark";

  const statItems = [
    {
      icon: Users,
      value: `${stats.totalJourneys}+`,
      label: "Success Stories",
      color: "text-indigo-400",
    },
    {
      icon: Clock,
      value: `${stats.averageMonths}mo`,
      label: "Avg. Duration",
      color: "text-emerald-400",
    },
    {
      icon: TrendingUp,
      value: `${stats.successRate}%`,
      label: "Success Rate",
      color: "text-amber-400",
    },
    {
      icon: Award,
      value: "Real",
      label: "Verified Paths",
      color: "text-purple-400",
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-wrap justify-center gap-6 md:gap-10",
        isDark ? "text-white" : "text-slate-900"
      )}
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
          <div
            className={cn(
              "p-2 rounded-lg",
              isDark ? "bg-white/5" : "bg-slate-100"
            )}
          >
            <item.icon size={ICON_SIZES.md} className={item.color} />
          </div>
          <div>
            <div className="text-lg font-bold">{item.value}</div>
            <div
              className={cn(
                "text-xs",
                isDark ? "text-slate-400" : "text-slate-500"
              )}
            >
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
      className="flex items-center gap-4 text-xs text-slate-400"
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
      <span className="flex items-center gap-1 text-emerald-400">
        <TrendingUp size={ICON_SIZES.xs} />
        {stats.successRate}%
      </span>
    </motion.div>
  );
}
