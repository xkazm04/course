"use client";

import React from "react";
import { ThemeProvider } from "../lib/ThemeContext";

export function ThemeProviderWrapper({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            {children}
        </ThemeProvider>
    );
}
