import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { learningPaths } from "@/app/shared/lib/mockData";
import { generateOGImageUrl } from "@/app/features/shareable-links/lib/shareUtils";

interface PageProps {
    params: Promise<{ pathId: string }>;
    searchParams: Promise<{ progress?: string; utm_source?: string; utm_medium?: string }>;
}

// Generate static paths for all learning paths
export async function generateStaticParams() {
    return learningPaths.map((path) => ({
        pathId: path.id,
    }));
}

// Dynamic metadata generation for OG tags
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const pathId = resolvedParams.pathId;
    const path = learningPaths.find((p) => p.id === pathId);

    if (!path) {
        return {
            title: "Learning Path Not Found",
        };
    }

    const progress = resolvedSearchParams.progress ? parseInt(resolvedSearchParams.progress, 10) : undefined;

    // Get the base URL from environment or use a fallback
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const ogImageUrl = generateOGImageUrl(path, progress, baseUrl);
    const shareUrl = `${baseUrl}/path/${pathId}`;

    const title = progress
        ? `${path.name} - ${progress}% Complete`
        : path.name;

    const description = `${path.description} Master ${path.skills.join(", ")} with ${path.courses} courses over ${path.hours} hours.`;

    return {
        title: `${title} | Learning Path`,
        description,
        openGraph: {
            title,
            description,
            url: shareUrl,
            siteName: "Course Platform",
            type: "website",
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: `${path.name} learning path preview`,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImageUrl],
        },
    };
}

// The page component - redirects to the main page with the selected path
export default async function SharedPathPage({ params, searchParams }: PageProps) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const pathId = resolvedParams.pathId;
    const path = learningPaths.find((p) => p.id === pathId);

    if (!path) {
        notFound();
    }

    // Redirect to the main overview page
    // The frontend can pick up the path ID from localStorage or URL state
    const queryParams = new URLSearchParams();
    queryParams.set("path", pathId);

    if (resolvedSearchParams.progress) {
        queryParams.set("progress", resolvedSearchParams.progress);
    }

    redirect(`/?${queryParams.toString()}`);
}
