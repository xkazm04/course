"use client";

import { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { CodeBlock } from "../CodeBlock";
import { OSSelector, OS } from "../OSSelector";
import { VerifyBox } from "../VerifyBox";

const installCommands: Record<OS, string> = {
    windows: "winget install --id Git.Git -e --source winget",
    mac: "brew install git",
    linux: "sudo apt-get install git",
};

export default function InstallGitStep() {
    const [os, setOs] = useState<OS>("windows");

    return (
        <div className="space-y-6">
            <p className="text-[var(--text-secondary)]">
                First, you need to have Git installed on your computer. Select your operating
                system below:
            </p>

            <OSSelector value={os} onChange={setOs} />

            <div className="space-y-4">
                {os === "windows" && (
                    <>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Option 1: Download from the official website
                        </p>
                        <a
                            href="https://git-scm.com/download/win"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:bg-[var(--surface-overlay)] transition-colors"
                        >
                            <Download size={16} />
                            Download Git for Windows
                            <ExternalLink size={14} />
                        </a>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Option 2: Install via Windows Package Manager (winget)
                        </p>
                        <CodeBlock code={installCommands.windows} />
                    </>
                )}

                {os === "mac" && (
                    <>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Install using Homebrew (recommended):
                        </p>
                        <CodeBlock code={installCommands.mac} />
                        <p className="text-sm text-[var(--text-muted)]">
                            Don't have Homebrew?{" "}
                            <a
                                href="https://brew.sh"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--accent-primary)] hover:underline"
                            >
                                Install it here
                            </a>
                        </p>
                    </>
                )}

                {os === "linux" && (
                    <>
                        <p className="text-sm text-[var(--text-secondary)]">
                            Install using apt (Debian/Ubuntu):
                        </p>
                        <CodeBlock code={installCommands.linux} />
                        <p className="text-sm text-[var(--text-muted)]">
                            For other distributions, use your package manager (dnf, pacman, etc.)
                        </p>
                    </>
                )}
            </div>

            <VerifyBox
                title="Verify Installation"
                description="Open a terminal and run:"
                command="git --version"
                expectedOutput="git version 2.40.0"
            />
        </div>
    );
}
