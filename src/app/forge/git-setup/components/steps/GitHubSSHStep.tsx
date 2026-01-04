"use client";

import { ExternalLink } from "lucide-react";
import { CodeBlock } from "../CodeBlock";
import { VerifyBox } from "../VerifyBox";

function NumberedStep({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-4 p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border-default)]">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-[var(--accent-primary)]">{number}</span>
            </div>
            <div>
                <h4 className="font-medium text-[var(--text-primary)]">{title}</h4>
                <div className="text-sm text-[var(--text-secondary)] mt-1">{children}</div>
            </div>
        </div>
    );
}

export default function GitHubSSHStep() {
    return (
        <div className="space-y-6">
            <p className="text-[var(--text-secondary)]">
                Now add your SSH key to your GitHub account to authenticate.
            </p>

            <div className="space-y-4">
                <NumberedStep number={1} title="Go to GitHub SSH Settings">
                    <p>Click the link below to open your GitHub SSH key settings:</p>
                    <a
                        href="https://github.com/settings/keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-[var(--forge-bg-void)] text-white hover:bg-[var(--forge-bg-anvil)] transition-colors"
                    >
                        Open GitHub SSH Settings
                        <ExternalLink size={14} />
                    </a>
                </NumberedStep>

                <NumberedStep number={2} title='Click "New SSH key"'>
                    <p>Look for the green "New SSH key" button on the right side of the page.</p>
                </NumberedStep>

                <NumberedStep number={3} title="Add Your Key">
                    <p>Give it a title (like "My Laptop") and paste your public key.</p>
                </NumberedStep>
            </div>

            <VerifyBox
                title="Test Your Connection"
                description="Verify that everything works:"
                command="ssh -T git@github.com"
                expectedOutput='Hi username! You have successfully authenticated...'
            />
        </div>
    );
}
