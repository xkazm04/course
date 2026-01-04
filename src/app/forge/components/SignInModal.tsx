"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    redirectPath?: string;
}

const providers = [
    {
        id: "google",
        name: "Google",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
            </svg>
        ),
        colors: {
            bg: "bg-white dark:bg-[var(--forge-bg-elevated)]",
            hover: "hover:bg-gray-50 dark:hover:bg-[var(--forge-bg-workshop)]",
            text: "text-gray-700 dark:text-[var(--forge-text-primary)]",
            border: "border-gray-300 dark:border-[var(--forge-border-default)]",
        },
    },
    {
        id: "github",
        name: "GitHub",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
        ),
        colors: {
            bg: "bg-[#24292e] dark:bg-[#24292e]",
            hover: "hover:bg-[#2f363d] dark:hover:bg-[#2f363d]",
            text: "text-white",
            border: "border-[#24292e] dark:border-[#444c56]",
        },
    },
];

export function SignInModal({ isOpen, onClose, redirectPath = "/forge" }: SignInModalProps) {
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Listen for auth state changes to close modal on successful sign in
    useEffect(() => {
        if (!isOpen) return;

        const supabase = createClient();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === "SIGNED_IN") {
                console.log("[SignInModal] User signed in, closing modal");
                setLoadingProvider(null);
                onClose();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [isOpen, onClose]);

    const handleSignIn = useCallback(async (providerId: string) => {
        setLoadingProvider(providerId);
        setError(null);

        try {
            const supabase = createClient();

            // Use popup-based OAuth to avoid page redirect
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: providerId as "google" | "github",
                options: {
                    // Use the popup-specific callback that closes the window
                    redirectTo: `${window.location.origin}/auth/callback/popup`,
                    skipBrowserRedirect: true, // Don't redirect, we'll handle it
                },
            });

            if (error) {
                setError(error.message);
                setLoadingProvider(null);
                return;
            }

            if (data?.url) {
                // Open OAuth in a popup window
                const width = 500;
                const height = 600;
                const left = window.screenX + (window.outerWidth - width) / 2;
                const top = window.screenY + (window.outerHeight - height) / 2;

                const popup = window.open(
                    data.url,
                    "oauth-popup",
                    `width=${width},height=${height},left=${left},top=${top},popup=true`
                );

                if (!popup) {
                    // Popup blocked, fall back to redirect
                    console.log("[SignInModal] Popup blocked, falling back to redirect");
                    window.location.href = data.url;
                    return;
                }

                // Poll to check if popup closed
                const checkPopup = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(checkPopup);
                        setLoadingProvider(null);
                    }
                }, 500);
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            setLoadingProvider(null);
        }
    }, [redirectPath]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                    >
                        <div className="bg-[var(--forge-bg-daylight)] dark:bg-[var(--forge-bg-elevated)] rounded-2xl shadow-2xl border border-[var(--forge-border-subtle)] overflow-hidden">
                            {/* Header */}
                            <div className="relative px-6 pt-6 pb-4">
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 p-2 rounded-lg text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-bg-bench)]/60 transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <div className="text-center">
                                    {/* Logo/Icon */}
                                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] mb-4 shadow-lg shadow-[var(--ember)]/20">
                                        <span className="text-2xl">🔥</span>
                                    </div>

                                    <h2 className="text-xl font-semibold text-[var(--forge-text-primary)]">
                                        Welcome to OpenForge
                                    </h2>
                                    <p className="text-sm text-[var(--forge-text-secondary)] mt-1">
                                        Sign in to save your progress and access all features
                                    </p>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="px-6">
                                <div className="h-px bg-[var(--forge-border-subtle)]" />
                            </div>

                            {/* OAuth Buttons */}
                            <div className="p-6 space-y-3">
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm text-center"
                                    >
                                        {error}
                                    </motion.div>
                                )}

                                {providers.map((provider) => (
                                    <button
                                        key={provider.id}
                                        onClick={() => handleSignIn(provider.id)}
                                        disabled={loadingProvider !== null}
                                        className={`
                                            w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl
                                            border-2 font-medium transition-all duration-200
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                            ${provider.colors.bg} ${provider.colors.hover}
                                            ${provider.colors.text} ${provider.colors.border}
                                        `}
                                    >
                                        {loadingProvider === provider.id ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            provider.icon
                                        )}
                                        <span>
                                            {loadingProvider === provider.id
                                                ? "Signing in..."
                                                : `Continue with ${provider.name}`}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="px-6 pb-6">
                                <p className="text-xs text-center text-[var(--forge-text-muted)]">
                                    By signing in, you agree to our{" "}
                                    <a href="/terms" className="text-[var(--ember)] hover:underline">
                                        Terms of Service
                                    </a>{" "}
                                    and{" "}
                                    <a href="/privacy" className="text-[var(--ember)] hover:underline">
                                        Privacy Policy
                                    </a>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
