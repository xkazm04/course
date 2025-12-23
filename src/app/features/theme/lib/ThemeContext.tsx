"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: ResolvedTheme;
    setTheme: (theme: Theme) => void;
}

const defaultContext: ThemeContextType = {
    theme: "system",
    resolvedTheme: "light",
    setTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

const STORAGE_KEY = "theme-preference";

function getSystemTheme(): ResolvedTheme {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme {
    if (typeof window === "undefined") return "system";
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "light" || stored === "dark" || stored === "system") {
            return stored;
        }
    } catch {
        // localStorage not available
    }
    return "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("system");
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
    const [mounted, setMounted] = useState(false);

    const updateResolvedTheme = useCallback((currentTheme: Theme) => {
        const resolved = currentTheme === "system" ? getSystemTheme() : currentTheme;
        setResolvedTheme(resolved);

        // Apply theme to document
        if (typeof document !== "undefined") {
            const root = document.documentElement;
            root.classList.remove("light", "dark");
            root.classList.add(resolved);
            root.setAttribute("data-theme", resolved);
        }
    }, []);

    // Initialize theme from localStorage
    useEffect(() => {
        const storedTheme = getStoredTheme();
        setThemeState(storedTheme);
        updateResolvedTheme(storedTheme);
        setMounted(true);
    }, [updateResolvedTheme]);

    // Listen for system theme changes
    useEffect(() => {
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

        const handleChange = () => {
            if (theme === "system") {
                updateResolvedTheme("system");
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme, updateResolvedTheme]);

    const setTheme = useCallback((newTheme: Theme) => {
        setThemeState(newTheme);
        try {
            localStorage.setItem(STORAGE_KEY, newTheme);
        } catch {
            // localStorage not available
        }
        updateResolvedTheme(newTheme);
    }, [updateResolvedTheme]);

    // Prevent flash by not rendering until mounted
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
