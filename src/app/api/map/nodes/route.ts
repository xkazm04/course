/**
 * Map Nodes API Route
 *
 * Server-side endpoint for fetching map_nodes and map_node_connections.
 * This keeps Supabase communication on the server side.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // Fetch nodes
        const { data: nodesData, error: nodesError } = await supabase
            .from("map_nodes")
            .select("*")
            .order("depth", { ascending: true })
            .order("sort_order", { ascending: true });

        if (nodesError) {
            console.error("Error fetching map_nodes:", nodesError);
            return NextResponse.json(
                { error: "Failed to fetch map nodes", details: nodesError.message },
                { status: 500 }
            );
        }

        // Fetch connections
        const { data: connectionsData, error: connectionsError } = await supabase
            .from("map_node_connections")
            .select("*");

        if (connectionsError) {
            console.error("Error fetching map_node_connections:", connectionsError);
            return NextResponse.json(
                { error: "Failed to fetch map connections", details: connectionsError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            nodes: nodesData || [],
            connections: connectionsData || [],
        });
    } catch (error) {
        console.error("Unexpected error in map nodes API:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
