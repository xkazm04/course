// ============================================================================
// Admin: Clear Cache API
// GET /api/admin/clear-cache - Returns instructions for clearing client cache
//
// This is a helper endpoint that returns JavaScript to clear localStorage
// ============================================================================

import { NextResponse } from "next/server";

export async function GET() {
    // Return an HTML page that clears localStorage and redirects
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Clearing Cache...</title>
</head>
<body style="font-family: system-ui; padding: 40px; background: #1a1a2e; color: white;">
    <h1>🧹 Clearing Forge Cache...</h1>
    <p id="status">Clearing localStorage...</p>
    <script>
        try {
            // Clear the Zustand persist store
            localStorage.removeItem('forge-path-sync');

            // Clear any other forge-related cache
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('forge-') || key.startsWith('supabase.'))) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));

            document.getElementById('status').innerHTML =
                '✅ Cache cleared! Removed ' + (keysToRemove.length + 1) + ' items.<br><br>' +
                '<a href="/forge/map" style="color: #f97316;">Go to Map →</a>';
        } catch (e) {
            document.getElementById('status').innerHTML =
                '❌ Error: ' + e.message + '<br><br>' +
                'Try manually running in console: localStorage.removeItem("forge-path-sync")';
        }
    </script>
</body>
</html>
    `;

    return new NextResponse(html, {
        headers: {
            "Content-Type": "text/html",
        },
    });
}
