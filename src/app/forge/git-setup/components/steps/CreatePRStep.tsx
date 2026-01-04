"use client";

import { AlertCircle } from "lucide-react";
import { CodeBlock } from "../CodeBlock";

export default function CreatePRStep() {
    return (
        <div className="space-y-6">
            <p className="text-[var(--text-secondary)]">
                After completing your homework, create a branch and submit a pull request.
            </p>

            <div className="space-y-4">
                <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-2">
                        1. Create a Branch
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] mb-2">
                        Use the branch name shown in your homework assignment:
                    </p>
                    <CodeBlock code="git checkout -b feat/feature-name:homework-name:your-username" />
                </div>

                <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-2">
                        2. Make Your Changes
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Write your code and save your files. Check what's changed with:
                    </p>
                    <CodeBlock code="git status" />
                </div>

                <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-2">
                        3. Stage and Commit
                    </h4>
                    <CodeBlock code={`git add .
git commit -m "feat: implement homework assignment"`} />
                </div>

                <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-2">
                        4. Push Your Branch
                    </h4>
                    <CodeBlock code="git push -u origin feat/feature-name:homework-name:your-username" />
                </div>

                <div>
                    <h4 className="font-medium text-[var(--text-primary)] mb-2">
                        5. Create Pull Request
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Go to GitHub and click the "Compare & pull request" button that appears.
                        Make sure the PR is from your fork to the original repository.
                    </p>
                </div>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <h4 className="font-medium text-[var(--text-primary)] mb-2 flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-500" />
                    Important
                </h4>
                <p className="text-sm text-[var(--text-secondary)]">
                    After creating your PR, return to the chapter page and click "Refresh PR Status"
                    to verify your submission. The system will automatically detect your PR.
                </p>
            </div>
        </div>
    );
}
