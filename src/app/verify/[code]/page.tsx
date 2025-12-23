"use client";

import React from "react";
import { use } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { BackgroundAtmosphere } from "@/app/shared/components";
import { ICON_SIZES } from "@/app/shared/lib/iconSizes";
import { ThemeToggle } from "@/app/features/theme";
import {
    CertificateVerification,
    useCertificateVerification,
} from "@/app/features/certificates";

interface VerifyPageProps {
    params: Promise<{ code: string }>;
}

export default function VerifyPage({ params }: VerifyPageProps) {
    const { code } = use(params);
    const { isLoading, isValid, certificate, message } = useCertificateVerification(code);

    return (
        <div className="min-h-screen bg-[#F0F2F5] dark:bg-[#0a0f1a] font-sans transition-colors duration-300">
            <BackgroundAtmosphere variant="cool" />

            {/* Header */}
            <header className="sticky top-0 z-50 px-4 lg:px-8 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                        data-testid="verify-back-link"
                    >
                        <ArrowLeft size={ICON_SIZES.md} />
                        <span className="text-sm font-medium">Back to Platform</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Shield size={ICON_SIZES.sm} className="text-indigo-500" />
                            <span className="text-sm font-medium">Certificate Verification</span>
                        </div>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Title Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                            Certificate Verification
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                            Verify the authenticity of a course completion certificate
                        </p>
                        {code && (
                            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    Verification Code:
                                </span>
                                <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">
                                    {code}
                                </span>
                            </div>
                        )}
                    </motion.div>

                    {/* Verification Result */}
                    <CertificateVerification
                        isLoading={isLoading}
                        isValid={isValid}
                        certificate={certificate}
                        message={message}
                    />

                    {/* Info Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mt-12 text-center"
                    >
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Certificates are verified using unique codes issued upon course completion.
                        </p>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
