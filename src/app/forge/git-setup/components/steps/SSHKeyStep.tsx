"use client";

import { useState } from "react";
import { CodeBlock } from "../CodeBlock";
import { OSSelector, OS } from "../OSSelector";

export default function SSHKeyStep() {
    const [os, setOs] = useState<OS>("windows");

    return (
        <div className="space-y-6">
            <p className="text-[var(--text-secondary)]">
                SSH keys allow you to connect to GitHub without entering your password each time.
            </p>

            <OSSelector value={os} onChange={setOs} />

            <div className="space-y-4">
                <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-2">
                        1. Generate an SSH Key
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                        Replace the email with your GitHub email:
                    </p>
                    <CodeBlock code='ssh-keygen -t ed25519 -C "your.email@example.com"' />
                    <p className="text-sm text-[var(--text-muted)] mt-2">
                        Press Enter to accept the default file location. You can set a passphrase
                        for extra security (optional).
                    </p>
                </div>

                <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-2">
                        2. Start the SSH Agent
                    </h4>
                    <CodeBlock code='eval "$(ssh-agent -s)"' />
                </div>

                <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-2">
                        3. Add Your SSH Key to the Agent
                    </h4>
                    {os === "mac" ? (
                        <CodeBlock code="ssh-add --apple-use-keychain ~/.ssh/id_ed25519" />
                    ) : (
                        <CodeBlock code="ssh-add ~/.ssh/id_ed25519" />
                    )}
                </div>

                <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-2">
                        4. Copy Your Public Key
                    </h4>
                    {os === "windows" ? (
                        <CodeBlock code="clip < ~/.ssh/id_ed25519.pub" />
                    ) : os === "mac" ? (
                        <CodeBlock code="pbcopy < ~/.ssh/id_ed25519.pub" />
                    ) : (
                        <>
                            <CodeBlock code="cat ~/.ssh/id_ed25519.pub" />
                            <p className="text-sm text-[var(--text-muted)] mt-2">
                                Select and copy the entire output.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
