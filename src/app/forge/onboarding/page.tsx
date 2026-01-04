"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    Github,
    ArrowRight,
    Check,
    AlertCircle,
    Hammer,
    GitPullRequest,
    Award,
    Code,
} from "lucide-react";
import { cn } from "@/app/shared/lib/utils";
import { ForgeBackground } from "../components";

// ============================================================================
// GITHUB CONNECT PAGE
// ============================================================================

export default function OnboardingPage() {
    const router = useRouter();
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    const handleConnect = async () => {
        setIsConnecting(true);
        // TODO: Implement actual GitHub OAuth flow
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsConnected(true);
        setIsConnecting(false);
    };

    const handleContinue = () => {
        router.push("/forge");
    };

    const benefits = [
        {
            icon: GitPullRequest,
            title: "Submit Pull Requests",
            description: "Contribute to real open-source projects directly from OpenForge",
        },
        {
            icon: Code,
            title: "Fork Projects",
            description: "Clone and customize projects to your own GitHub account",
        },
        {
            icon: Award,
            title: "Build Your Profile",
            description: "Track contributions and build a verified developer portfolio",
        },
    ];

    return (
        <div className="min-h-screen relative">
            <ForgeBackground showNoise />

            {/* Header */}
            <div className="relative z-10 p-6">
                <Link href="/" className="inline-flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] flex items-center justify-center shadow-md shadow-[var(--ember)]/30">
                        <Hammer size={18} className="text-white" />
                    </div>
                    <span className="text-lg font-bold text-[var(--forge-text-primary)]">
                        OpenForge
                    </span>
                </Link>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-xl"
                >
                    {/* Card */}
                    <div className="bg-[var(--forge-bg-elevated)]/80 backdrop-blur-xl rounded-2xl border border-[var(--forge-border-subtle)] shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="p-8 text-center border-b border-[var(--forge-border-subtle)]">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--ember)] to-[var(--ember-glow)] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[var(--ember)]/30">
                                <Github size={32} className="text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-[var(--forge-text-primary)] mb-2">
                                Connect Your GitHub
                            </h1>
                            <p className="text-[var(--forge-text-secondary)]">
                                Link your GitHub account to start contributing to projects
                            </p>
                        </div>

                        {/* Benefits */}
                        <div className="p-6 space-y-4">
                            {benefits.map((benefit, index) => {
                                const Icon = benefit.icon;
                                return (
                                    <motion.div
                                        key={benefit.title}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * (index + 1) }}
                                        className="flex items-start gap-4"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-[var(--forge-bg-bench)] flex items-center justify-center flex-shrink-0">
                                            <Icon size={20} className="text-[var(--ember)]" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-[var(--forge-text-primary)]">
                                                {benefit.title}
                                            </h3>
                                            <p className="text-sm text-[var(--forge-text-muted)]">
                                                {benefit.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Action */}
                        <div className="p-6 pt-0">
                            {isConnected ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center"
                                >
                                    <div className="w-16 h-16 rounded-full bg-[var(--forge-success)]/20 flex items-center justify-center mx-auto mb-4">
                                        <Check size={32} className="text-[var(--forge-success)]" />
                                    </div>
                                    <h3 className="font-semibold text-[var(--forge-text-primary)] mb-2">
                                        GitHub Connected!
                                    </h3>
                                    <p className="text-sm text-[var(--forge-text-secondary)] mb-6">
                                        You're ready to start contributing to projects
                                    </p>
                                    <button
                                        onClick={handleContinue}
                                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--ember)] to-[var(--ember-glow)] text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-[var(--ember)]/30"
                                    >
                                        Continue to Dashboard
                                        <ArrowRight size={18} />
                                    </button>
                                </motion.div>
                            ) : (
                                <>
                                    <button
                                        onClick={handleConnect}
                                        disabled={isConnecting}
                                        className={cn(
                                            "w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-medium transition-all",
                                            isConnecting
                                                ? "bg-[var(--forge-bg-bench)] text-[var(--forge-text-muted)] cursor-wait"
                                                : "bg-[#24292e] text-white hover:bg-[#2f363d]"
                                        )}
                                    >
                                        {isConnecting ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-[var(--forge-text-muted)] border-t-transparent rounded-full animate-spin" />
                                                Connecting...
                                            </>
                                        ) : (
                                            <>
                                                <Github size={20} />
                                                Connect GitHub Account
                                            </>
                                        )}
                                    </button>

                                    <div className="flex items-start gap-3 p-4 mt-4 rounded-xl bg-[var(--ember)]/5 border border-[var(--ember)]/20">
                                        <AlertCircle size={18} className="text-[var(--ember)] flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-[var(--forge-text-secondary)]">
                                            You can explore projects without GitHub, but you'll need to connect before submitting contributions.
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        {!isConnected && (
                            <div className="px-6 pb-6">
                                <button
                                    onClick={handleContinue}
                                    className="w-full text-center py-3 text-sm text-[var(--forge-text-muted)] hover:text-[var(--forge-text-secondary)] transition-colors"
                                >
                                    Skip for now
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
