"use client";

import { CodeBlock } from "../CodeBlock";

export default function ForkAndCloneStep() {
    return (
        <div className="space-y-6">
            <p className="text-[var(--text-secondary)]">
                When you start a homework assignment, you'll fork the project repository
                and clone it to your local machine.
            </p>

            <div className="space-y-4">
                <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-2">
                        1. Fork the Repository
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Go to the project repository on GitHub and click the "Fork" button
                        in the top-right corner. This creates a copy under your account.
                    </p>
                </div>

                <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-2">
                        2. Clone Your Fork
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                        Replace the URL with your fork:
                    </p>
                    <CodeBlock code="git clone git@github.com:YOUR-USERNAME/PROJECT-NAME.git" />
                </div>

                <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-2">
                        3. Navigate to the Project
                    </h4>
                    <CodeBlock code="cd PROJECT-NAME" />
                </div>

                <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-2">
                        4. Add Upstream Remote
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                        Connect to the original repository to get updates:
                    </p>
                    <CodeBlock code="git remote add upstream git@github.com:ORIGINAL-OWNER/PROJECT-NAME.git" />
                </div>
            </div>
        </div>
    );
}
