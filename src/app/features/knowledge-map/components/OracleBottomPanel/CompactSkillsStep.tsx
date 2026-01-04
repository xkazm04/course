"use client";

/**
 * CompactSkillsStep Component
 *
 * Compact skill selection step for the Oracle wizard.
 * Displays skill chips with quick add/remove functionality.
 * Features satisfying micro-interactions including spring animations,
 * scale pulse on hover, and particle burst for first skill.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Search } from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { commonSkills } from "@/app/features/goal-path/lib/useCareerOracle";

// ============================================================================
// TYPES
// ============================================================================

export interface CompactSkillsStepProps {
    /** Currently selected skills */
    selectedSkills: string[];
    /** Callback when skills change */
    onSkillsChange: (skills: string[]) => void;
}

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================

/** Spring animation for skill chip addition */
const skillChipSpring = {
    type: "spring" as const,
    damping: 20,
    stiffness: 400,
};

/** Entry animation for selected skill chips */
const selectedChipVariants = {
    initial: {
        scale: 0.3,
        opacity: 0,
        y: 10,
    },
    animate: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: skillChipSpring,
    },
    exit: {
        scale: 0.5,
        opacity: 0,
        transition: { duration: 0.15 },
    },
    hover: {
        scale: 1.05,
        transition: { duration: 0.1 },
    },
    tap: {
        scale: 0.95,
    },
};

/** Available skill chip variants */
const availableChipVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    hover: {
        scale: 1.05,
        backgroundColor: "var(--forge-border-subtle)",
        transition: { duration: 0.1 },
    },
    tap: {
        scale: 0.92,
        transition: { duration: 0.05 },
    },
};

// ============================================================================
// PARTICLE BURST COMPONENT
// ============================================================================

interface ParticleBurstProps {
    onComplete: () => void;
}

// Pre-generated particles for consistent behavior (avoiding useEffect setState)
const PARTICLE_CONFIG = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    angle: i * 45, // 45° apart in radial pattern
    delay: i * 0.01, // Slight stagger
}));

function ParticleBurst({ onComplete }: ParticleBurstProps) {
    const hasCalledComplete = useRef(false);

    // Call onComplete after animation duration
    useEffect(() => {
        if (hasCalledComplete.current) return;

        const timer = setTimeout(() => {
            if (!hasCalledComplete.current) {
                hasCalledComplete.current = true;
                onComplete();
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-visible z-10">
            {PARTICLE_CONFIG.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-[var(--ember)]"
                    initial={{
                        x: 0,
                        y: 0,
                        scale: 1,
                        opacity: 1,
                    }}
                    animate={{
                        x: Math.cos(particle.angle * Math.PI / 180) * 30,
                        y: Math.sin(particle.angle * Math.PI / 180) * 30,
                        scale: 0,
                        opacity: 0,
                    }}
                    transition={{
                        duration: 0.5,
                        delay: particle.delay,
                        ease: [0.32, 0, 0.67, 0],
                    }}
                />
            ))}
        </div>
    );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CompactSkillsStep({
    selectedSkills,
    onSkillsChange,
}: CompactSkillsStepProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [showFirstSkillBurst, setShowFirstSkillBurst] = useState(false);
    const [hoveredRemoveSkill, setHoveredRemoveSkill] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    // Track if we've already shown the first skill celebration (to avoid repeats)
    const hasShownFirstCelebration = useRef(false);

    // Clear particle burst
    const handleBurstComplete = useCallback(() => {
        setShowFirstSkillBurst(false);
    }, []);

    // Filter skills based on search
    const filteredSkills = commonSkills.filter(
        skill =>
            skill.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !selectedSkills.includes(skill)
    );

    // Add skill with haptic-like visual feedback
    const addSkill = useCallback((skill: string) => {
        const wasEmpty = selectedSkills.length === 0;
        onSkillsChange([...selectedSkills, skill]);

        // Trigger first skill celebration if this is the first skill
        if (wasEmpty && !hasShownFirstCelebration.current) {
            hasShownFirstCelebration.current = true;
            setShowFirstSkillBurst(true);
        }

        // Haptic-like visual feedback: brief flash on the container
        if (containerRef.current) {
            containerRef.current.style.transform = "scale(1.002)";
            setTimeout(() => {
                if (containerRef.current) {
                    containerRef.current.style.transform = "scale(1)";
                }
            }, 50);
        }
    }, [selectedSkills, onSkillsChange]);

    // Remove skill
    const removeSkill = useCallback((skill: string) => {
        onSkillsChange(selectedSkills.filter(s => s !== skill));
    }, [selectedSkills, onSkillsChange]);

    return (
        <div
            ref={containerRef}
            className="h-full flex flex-col gap-4 transition-transform duration-50"
            data-testid="compact-skills-step"
        >
            {/* Header */}
            <div className="flex items-center justify-between py-1">
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-sm font-semibold text-[var(--forge-text-primary)]">
                        What skills do you have?
                    </h3>
                    <p className="text-xs text-[var(--forge-text-secondary)]">
                        Select at least one skill to continue
                    </p>
                </div>
                <motion.span
                    key={selectedSkills.length}
                    initial={{ scale: 1.2, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={skillChipSpring}
                    className="text-xs font-medium text-[var(--ember)]"
                    data-testid="skills-selected-count"
                >
                    {selectedSkills.length} selected
                </motion.span>
            </div>

            {/* Selected skills */}
            <div className="flex flex-wrap gap-1.5 min-h-[28px] relative">
                {/* Particle burst for first skill celebration */}
                {showFirstSkillBurst && (
                    <ParticleBurst onComplete={handleBurstComplete} />
                )}

                <AnimatePresence mode="popLayout">
                    {selectedSkills.map((skill, index) => (
                        <motion.button
                            key={skill}
                            layout
                            variants={selectedChipVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => removeSkill(skill)}
                            onMouseEnter={() => setHoveredRemoveSkill(skill)}
                            onMouseLeave={() => setHoveredRemoveSkill(null)}
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-md relative",
                                "text-xs font-medium",
                                "bg-[var(--ember)]/20",
                                "text-[var(--ember)]",
                                "hover:bg-[var(--ember)]/30",
                                "transition-colors",
                                // First skill celebration glow
                                index === 0 && selectedSkills.length === 1 && showFirstSkillBurst && "skill-chip-first-glow"
                            )}
                            data-testid={`selected-skill-chip-${skill.toLowerCase().replace(/\s+/g, "-")}`}
                        >
                            {skill}
                            {/* Animated X icon with scale pulse on hover */}
                            <motion.span
                                animate={{
                                    scale: hoveredRemoveSkill === skill ? [1, 1.2, 1] : 1,
                                }}
                                transition={{
                                    duration: 0.3,
                                    repeat: hoveredRemoveSkill === skill ? Infinity : 0,
                                    repeatDelay: 0.5,
                                }}
                            >
                                <X size={12} />
                            </motion.span>
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>

            {/* Search and available skills - subsection uses gap-2 */}
            <div className="flex-1 flex flex-col gap-2 min-h-0">
                {/* Search input */}
                <div className="relative">
                    <Search
                        size={14}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--forge-text-muted)]"
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search skills..."
                        className={cn(
                            "w-full pl-8 pr-3 py-1.5 rounded-lg",
                            "text-xs",
                            "bg-[var(--forge-bg-anvil)]",
                            "border border-[var(--forge-border-subtle)]",
                            "text-[var(--forge-text-primary)]",
                            "placeholder-[var(--forge-text-muted)]",
                            "focus:outline-none focus:ring-2 focus:ring-[var(--ember)]/20",
                            "transition-shadow duration-150"
                        )}
                        data-testid="skills-search-input"
                    />
                </div>

                {/* Available skills */}
                <div className="flex flex-wrap gap-1.5 overflow-y-auto" data-testid="available-skills-list">
                    <AnimatePresence>
                        {filteredSkills.slice(0, 15).map((skill, index) => (
                            <motion.button
                                key={skill}
                                variants={availableChipVariants}
                                initial="initial"
                                animate="animate"
                                whileHover="hover"
                                whileTap="tap"
                                transition={{
                                    ...skillChipSpring,
                                    delay: index * 0.02, // Staggered entrance
                                }}
                                onClick={() => addSkill(skill)}
                                className={cn(
                                    "flex items-center gap-1 px-2 py-1 rounded-md",
                                    "text-xs",
                                    "bg-[var(--forge-bg-anvil)]",
                                    "text-[var(--forge-text-secondary)]",
                                    "border border-[var(--forge-border-subtle)]",
                                    "transition-colors duration-100"
                                )}
                                data-testid={`available-skill-chip-${skill.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                                <motion.span
                                    whileHover={{ rotate: 90 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    <Plus size={10} />
                                </motion.span>
                                {skill}
                            </motion.button>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
