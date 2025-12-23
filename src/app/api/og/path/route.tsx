import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

// Color hex values for OG image
const COLOR_HEX: Record<string, { bg: string; text: string; gradient: string }> = {
    indigo: { bg: "#6366f1", text: "#eef2ff", gradient: "#4f46e5" },
    purple: { bg: "#a855f7", text: "#faf5ff", gradient: "#9333ea" },
    emerald: { bg: "#10b981", text: "#ecfdf5", gradient: "#059669" },
    cyan: { bg: "#06b6d4", text: "#ecfeff", gradient: "#0891b2" },
    orange: { bg: "#f97316", text: "#fff7ed", gradient: "#ea580c" },
    pink: { bg: "#ec4899", text: "#fdf2f8", gradient: "#db2777" },
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const pathName = searchParams.get("name") || "Learning Path";
    const pathColor = searchParams.get("color") || "indigo";
    const courses = searchParams.get("courses") || "0";
    const hours = searchParams.get("hours") || "0";
    const skillsParam = searchParams.get("skills") || "";
    const progress = searchParams.get("progress");

    const skills = skillsParam ? skillsParam.split(",").slice(0, 4) : [];
    const colors = COLOR_HEX[pathColor] || COLOR_HEX.indigo;
    const progressValue = progress ? parseInt(progress, 10) : null;

    return new ImageResponse(
        (
            <div
                style={{
                    width: "1200px",
                    height: "630px",
                    display: "flex",
                    flexDirection: "column",
                    background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.gradient} 100%)`,
                    padding: "60px",
                    fontFamily: "system-ui, sans-serif",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "40px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                        }}
                    >
                        <div
                            style={{
                                width: "48px",
                                height: "48px",
                                background: "rgba(255,255,255,0.2)",
                                borderRadius: "12px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                <path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5" />
                            </svg>
                        </div>
                        <span
                            style={{
                                fontSize: "24px",
                                fontWeight: "600",
                                color: "rgba(255,255,255,0.9)",
                            }}
                        >
                            Learning Path
                        </span>
                    </div>

                    {progressValue !== null && progressValue > 0 && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                background: "rgba(255,255,255,0.2)",
                                borderRadius: "16px",
                                padding: "12px 24px",
                            }}
                        >
                            <div
                                style={{
                                    width: "80px",
                                    height: "8px",
                                    background: "rgba(255,255,255,0.3)",
                                    borderRadius: "4px",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        width: `${progressValue}%`,
                                        height: "100%",
                                        background: "white",
                                        borderRadius: "4px",
                                    }}
                                />
                            </div>
                            <span
                                style={{
                                    fontSize: "20px",
                                    fontWeight: "700",
                                    color: "white",
                                }}
                            >
                                {progressValue}% Complete
                            </span>
                        </div>
                    )}
                </div>

                {/* Main content */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        flex: "1",
                    }}
                >
                    <h1
                        style={{
                            fontSize: "72px",
                            fontWeight: "800",
                            color: "white",
                            margin: "0 0 24px 0",
                            lineHeight: "1.1",
                        }}
                    >
                        {pathName}
                    </h1>

                    {/* Stats */}
                    <div
                        style={{
                            display: "flex",
                            gap: "32px",
                            marginBottom: "40px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                background: "rgba(255,255,255,0.15)",
                                borderRadius: "12px",
                                padding: "16px 24px",
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span style={{ fontSize: "28px", fontWeight: "700", color: "white" }}>
                                {courses} Courses
                            </span>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                background: "rgba(255,255,255,0.15)",
                                borderRadius: "12px",
                                padding: "16px 24px",
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span style={{ fontSize: "28px", fontWeight: "700", color: "white" }}>
                                {hours} Hours
                            </span>
                        </div>
                    </div>

                    {/* Skills */}
                    {skills.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                flexWrap: "wrap",
                            }}
                        >
                            {skills.map((skill, i) => (
                                <div
                                    key={i}
                                    style={{
                                        background: "rgba(255,255,255,0.2)",
                                        borderRadius: "20px",
                                        padding: "8px 20px",
                                        fontSize: "20px",
                                        fontWeight: "600",
                                        color: "white",
                                    }}
                                >
                                    {skill}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer branding */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "auto",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                background: "white",
                                borderRadius: "10px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill={colors.bg}>
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span
                            style={{
                                fontSize: "24px",
                                fontWeight: "700",
                                color: "white",
                            }}
                        >
                            Course Platform
                        </span>
                    </div>
                    <span
                        style={{
                            fontSize: "18px",
                            color: "rgba(255,255,255,0.7)",
                        }}
                    >
                        Start your learning journey today
                    </span>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
