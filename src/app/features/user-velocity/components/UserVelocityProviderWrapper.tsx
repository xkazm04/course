"use client";

import React from "react";
import { UserVelocityProvider } from "../lib/UserVelocityContext";

/**
 * Wrapper component for UserVelocityProvider to be used in app layout.
 * This follows the same pattern as ThemeProviderWrapper.
 */
export function UserVelocityProviderWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    return <UserVelocityProvider>{children}</UserVelocityProvider>;
}
