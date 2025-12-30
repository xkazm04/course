"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme, Theme } from "../lib/ThemeContext";
import { cn } from "@/app/shared/lib/utils";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { DURATION_NORMAL, DURATION_FAST } from "@/app/shared/lib/motionPrimitives";

const themes: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const currentTheme = themes.find(t => t.value === theme) || themes[2];
    const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;

    return (
        <div ref={containerRef} className="relative">
            {/* Main Toggle Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-xl",
                    "bg-[var(--forge-bg-elevated)] backdrop-blur-md",
                    "border border-[var(--forge-border-default)]",
                    "shadow-[var(--shadow-sm)]",
                    "hover:bg-[var(--forge-bg-anvil)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ember)] focus-visible:ring-offset-2",
                    "transition-all duration-200"
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                data-testid="theme-toggle-btn"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={resolvedTheme}
                        initial={{ scale: 0, rotate: -180, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0, rotate: 180, opacity: 0 }}
                        transition={{ duration: DURATION_NORMAL, ease: "easeInOut" }}
                    >
                        <CurrentIcon
                            size={ICON_SIZES.md}
                            className={cn(
                                "transition-colors",
                                resolvedTheme === "dark" ? "text-[var(--forge-warning)]" : "text-[var(--forge-warning)]"
                            )}
                        />
                    </motion.div>
                </AnimatePresence>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: DURATION_FAST, ease: "easeOut" }}
                        className={cn(
                            "absolute right-0 mt-2 w-40 py-1",
                            "bg-[var(--forge-bg-anvil)] backdrop-blur-xl",
                            "border border-[var(--forge-border-default)]",
                            "rounded-xl shadow-[var(--shadow-lg)]",
                            "z-50"
                        )}
                        data-testid="theme-dropdown"
                    >
                        {themes.map(({ value, label, icon: Icon }) => (
                            <motion.button
                                key={value}
                                onClick={() => {
                                    setTheme(value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium",
                                    "transition-colors duration-150",
                                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ember)]",
                                    theme === value
                                        ? "bg-[var(--ember)]/10 text-[var(--ember)]"
                                        : "text-[var(--forge-text-secondary)] hover:bg-[var(--forge-bg-elevated)]"
                                )}
                                whileHover={{ x: 2 }}
                                data-testid={`theme-option-${value}`}
                            >
                                <Icon size={ICON_SIZES.sm} />
                                <span>{label}</span>
                                {theme === value && (
                                    <motion.div
                                        layoutId="theme-indicator"
                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--ember)]"
                                    />
                                )}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
