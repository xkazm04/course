import { NextRequest, NextResponse } from "next/server";

// Note: This endpoint provides verification info but actual verification
// happens client-side since certificates are stored in localStorage.
// In production, this would query a database.

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
        return NextResponse.json(
            {
                success: false,
                error: "Verification code is required",
                message: "Please provide a verification code using the 'code' query parameter.",
            },
            { status: 400 }
        );
    }

    // Return verification page URL
    // Actual verification happens client-side
    return NextResponse.json({
        success: true,
        message: "Please visit the verification page to verify this certificate.",
        verificationUrl: `/verify/${code}`,
        code: code,
        note: "Certificate data is stored client-side. Visit the verification URL to check certificate authenticity.",
    });
}
