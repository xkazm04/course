"use client";

import React from "react";
import { motion } from "framer-motion";
import { Monitor, Film, Square } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useOracleVariant, type OracleVariant } from "../context/OracleVariantContext";

export function VariantSwitcher() {
    const { variant, setVariant } = useOracleVariant();

    const variants: { id: OracleVariant; label: string; icon: React.ElementType }[] = [
        { id: 'holographic', label: 'Holographic', icon: Monitor },
        { id: 'cinematic', label: 'Cinematic', icon: Film },
        { id: 'minimalist', label: 'Minimalist', icon: Square },
    ];

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center p-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg">
                {variants.map((v) => (
                    <button
                        key={v.id}
                        onClick={() => setVariant(v.id)}
                        className={cn(
                            "relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                            variant === v.id
                                ? "text-white"
                                : "text-slate-400 hover:text-slate-200"
                        )}
                    >
                        {variant === v.id && (
                            <motion.div
                                layoutId="activeVariant"
                                className="absolute inset-0 bg-indigo-500/80 rounded-full"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <v.icon size={14} />
                            {v.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
