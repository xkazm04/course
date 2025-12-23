"use client";

import React, { type ReactNode } from "react";
import { UserLearningGraphProvider } from "../lib/UserLearningGraphContext";

interface UserLearningGraphProviderWrapperProps {
    children: ReactNode;
}

/**
 * Wrapper component for UserLearningGraphProvider
 * Ensures client-side only rendering and provides a clean boundary
 */
export function UserLearningGraphProviderWrapper({
    children,
}: UserLearningGraphProviderWrapperProps) {
    return <UserLearningGraphProvider>{children}</UserLearningGraphProvider>;
}
