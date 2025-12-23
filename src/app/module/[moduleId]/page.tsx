"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getModuleById } from "@/app/shared/lib/modules";

export default function ModulePage() {
    const params = useParams();
    const router = useRouter();
    const moduleId = params.moduleId as string;

    useEffect(() => {
        const module = getModuleById(moduleId);
        if (module) {
            // Redirect to first variant
            router.replace(`/module/${moduleId}/variant/${module.variants[0].id}`);
        } else {
            // Module not found, go home
            router.replace("/");
        }
    }, [moduleId, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F0F2F5] dark:bg-[#0a0f1a]">
            <div className="animate-pulse text-slate-600 dark:text-slate-400">
                Loading...
            </div>
        </div>
    );
}
