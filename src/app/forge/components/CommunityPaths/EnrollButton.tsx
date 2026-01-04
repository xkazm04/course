"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Check, Loader2 } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { useForge } from "../../layout";

interface EnrollButtonProps {
    pathId: string;
    isEnrolled?: boolean;
    onEnroll?: (pathId: string) => void;
}

export function EnrollButton({ pathId, isEnrolled: initialEnrolled, onEnroll }: EnrollButtonProps) {
    const { isAuthenticated, signInWithGoogle } = useForge();
    const [isEnrolled, setIsEnrolled] = useState(initialEnrolled || false);
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        if (isEnrolled) return;

        if (!isAuthenticated) {
            signInWithGoogle();
            return;
        }

        setIsLoading(true);

        // Simulate enrollment API call
        await new Promise((resolve) => setTimeout(resolve, 800));

        setIsEnrolled(true);
        setIsLoading(false);
        onEnroll?.(pathId);
    };

    if (isEnrolled) {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--forge-success)]/10 text-[var(--forge-success)] text-sm font-medium"
            >
                <Check size={14} />
                <span>Enrolled</span>
            </motion.div>
        );
    }

    return (
        <motion.button
            onClick={handleClick}
            disabled={isLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                "bg-[var(--ember)] text-white",
                "shadow-md shadow-[var(--ember)]/20",
                "hover:shadow-lg hover:shadow-[var(--ember)]/30",
                "disabled:opacity-70 disabled:cursor-not-allowed",
                "transition-shadow"
            )}
        >
            {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
            ) : (
                <Plus size={14} />
            )}
            <span>{isLoading ? "..." : "Enroll"}</span>

            {/* Glow effect on hover */}
            <motion.div
                className="absolute inset-0 rounded-lg bg-[var(--ember)] opacity-0 blur-lg -z-10"
                whileHover={{ opacity: 0.4 }}
                transition={{ duration: 0.2 }}
            />
        </motion.button>
    );
}
