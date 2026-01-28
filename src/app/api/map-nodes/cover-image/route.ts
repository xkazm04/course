/**
 * API to update cover_image_url for map nodes
 * POST /api/map-nodes/cover-image
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface UpdateRequest {
  slug: string;
  coverImageUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Support single update or batch updates
    const updates: UpdateRequest[] = Array.isArray(body) ? body : [body];

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No updates provided" },
        { status: 400 }
      );
    }

    // Validate all updates have required fields
    for (const update of updates) {
      if (!update.slug || !update.coverImageUrl) {
        return NextResponse.json(
          { error: "Each update must have slug and coverImageUrl" },
          { status: 400 }
        );
      }
    }

    // Perform updates
    const results = [];
    for (const update of updates) {
      const { data, error } = await supabase
        .from("map_nodes")
        .update({ cover_image_url: update.coverImageUrl })
        .eq("slug", update.slug)
        .select("id, slug, name, cover_image_url");

      if (error) {
        results.push({ slug: update.slug, success: false, error: error.message });
      } else if (!data || data.length === 0) {
        results.push({ slug: update.slug, success: false, error: "Node not found" });
      } else {
        results.push({ slug: update.slug, success: true, node: data[0] });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Updated ${successCount} nodes, ${failCount} failed`,
      results,
    });
  } catch (error) {
    console.error("Cover image update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
