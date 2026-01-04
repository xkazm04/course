"use client";

import { CodeBlock } from "../CodeBlock";
import { VerifyBox } from "../VerifyBox";

export default function ConfigureGitStep() {
    return (
        <div className="space-y-6">
            <p className="text-[var(--text-secondary)]">
                Configure Git with your name and email. This information will be associated
                with your commits.
            </p>

            <div className="space-y-4">
                <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                        Set your name (use your GitHub username or real name):
                    </p>
                    <CodeBlock code='git config --global user.name "Your Name"' />
                </div>

                <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                        Set your email (use the same email as your GitHub account):
                    </p>
                    <CodeBlock code='git config --global user.email "your.email@example.com"' />
                </div>

                <div>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                        Set the default branch name to <code>main</code>:
                    </p>
                    <CodeBlock code="git config --global init.defaultBranch main" />
                </div>
            </div>

            <VerifyBox
                title="Verify Configuration"
                description="Check your settings with:"
                command="git config --global --list"
            />
        </div>
    );
}
