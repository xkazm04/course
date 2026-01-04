"use client";

import { cn } from "@/app/shared/lib/utils";

export type OS = "windows" | "mac" | "linux";

interface OSSelectorProps {
    value: OS;
    onChange: (os: OS) => void;
}

export function OSSelector({ value, onChange }: OSSelectorProps) {
    const options: OS[] = ["windows", "mac", "linux"];

    return (
        <div className="flex items-center gap-2 p-1 bg-[var(--surface-overlay)] rounded-lg w-fit">
            {options.map((osType) => (
                <button
                    key={osType}
                    onClick={() => onChange(osType)}
                    className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize",
                        value === osType
                            ? "bg-[var(--surface-elevated)] text-[var(--text-primary)]"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                >
                    {osType === "mac" ? "macOS" : osType}
                </button>
            ))}
        </div>
    );
}
