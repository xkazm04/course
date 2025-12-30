"use client";

/**
 * CompactSkillsStep Component
 *
 * Compact skill selection step for the Oracle wizard.
 * Displays skill chips with quick add/remove functionality.
 */

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
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
// COMPONENT
// ============================================================================

export function CompactSkillsStep({
    selectedSkills,
    onSkillsChange,
}: CompactSkillsStepProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Filter skills based on search
    const filteredSkills = commonSkills.filter(
        skill =>
            skill.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !selectedSkills.includes(skill)
    );

    // Toggle skill selection
    const toggleSkill = useCallback((skill: string) => {
        if (selectedSkills.includes(skill)) {
            onSkillsChange(selectedSkills.filter(s => s !== skill));
        } else {
            onSkillsChange([...selectedSkills, skill]);
        }
    }, [selectedSkills, onSkillsChange]);

    // Remove skill
    const removeSkill = useCallback((skill: string) => {
        onSkillsChange(selectedSkills.filter(s => s !== skill));
    }, [selectedSkills, onSkillsChange]);

    return (
        <div className="h-full flex flex-col gap-3" data-testid="compact-skills-step">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-semibold text-[var(--forge-text-primary)]">
                        What skills do you have?
                    </h3>
                    <p className="text-xs text-[var(--forge-text-secondary)]">
                        Select at least one skill to continue
                    </p>
                </div>
                <span className="text-xs font-medium text-[var(--ember)]">
                    {selectedSkills.length} selected
                </span>
            </div>

            {/* Selected skills */}
            {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {selectedSkills.map(skill => (
                        <motion.button
                            key={skill}
                            layout
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            onClick={() => removeSkill(skill)}
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-md",
                                "text-xs font-medium",
                                "bg-[var(--ember)]/20",
                                "text-[var(--ember)]",
                                "hover:bg-[var(--ember)]/30",
                                "transition-colors"
                            )}
                        >
                            {skill}
                            <X size={12} />
                        </motion.button>
                    ))}
                </div>
            )}

            {/* Search and available skills */}
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
                            "focus:outline-none focus:ring-2 focus:ring-[var(--ember)]/20"
                        )}
                    />
                </div>

                {/* Available skills */}
                <div className="flex flex-wrap gap-1.5 overflow-y-auto">
                    {filteredSkills.slice(0, 15).map(skill => (
                        <motion.button
                            key={skill}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleSkill(skill)}
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-md",
                                "text-xs",
                                "bg-[var(--forge-bg-anvil)]",
                                "text-[var(--forge-text-secondary)]",
                                "hover:bg-[var(--forge-border-subtle)]",
                                "border border-[var(--forge-border-subtle)]",
                                "transition-colors"
                            )}
                        >
                            <Plus size={10} />
                            {skill}
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    );
}
