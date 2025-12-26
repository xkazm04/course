"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type OracleVariant = 'holographic' | 'cinematic' | 'minimalist';

interface OracleVariantContextType {
    variant: OracleVariant;
    setVariant: (variant: OracleVariant) => void;
}

const OracleVariantContext = createContext<OracleVariantContextType | undefined>(undefined);

export function OracleVariantProvider({ children }: { children: ReactNode }) {
    const [variant, setVariant] = useState<OracleVariant>('holographic');

    return (
        <OracleVariantContext.Provider value={{ variant, setVariant }}>
            {children}
        </OracleVariantContext.Provider>
    );
}

export function useOracleVariant() {
    const context = useContext(OracleVariantContext);
    if (context === undefined) {
        throw new Error("useOracleVariant must be used within an OracleVariantProvider");
    }
    return context;
}
