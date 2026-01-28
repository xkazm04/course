/**
 * Script to update cover_image_url for map nodes
 * Run with: npx tsx scripts/update-cover-images.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const COVER_IMAGES = [
  // Frontend Domain - Topics (depth 1) - Using correct database slugs
  {
    slug: "html-css-foundations",
    coverImageUrl: "https://cdn.leonardo.ai/users/65d71243-f7c2-4204-a1b3-433aaf62da5b/generations/1f0fb8d1-bad7-6b40-bbb4-933578065d27/seedream-4.5_Abstract_geometric_symbol_representing_web_structure_and_styling._Interlocking_a-1.jpg",
  },
  {
    slug: "javascript-mastery",
    coverImageUrl: "https://cdn.leonardo.ai/users/65d71243-f7c2-4204-a1b3-433aaf62da5b/generations/1f0fb8db-bb53-61a0-ad2d-c7615cfecaa9/seedream-4.5_Abstract_symbol_of_curly_braces_morphing_into_dynamic_flowing_lines_representing-1.jpg",
  },
  {
    slug: "react-ecosystem",
    coverImageUrl: "https://cdn.leonardo.ai/users/65d71243-f7c2-4204-a1b3-433aaf62da5b/generations/1f0fb8de-fc54-69d0-a19d-b4480e40b24d/seedream-4.5_Stylized_atomic_orbital_symbol_with_three_elliptical_paths_intersecting_at_cente-0.jpg",
  },
  {
    slug: "typescript-professional",
    coverImageUrl: "https://cdn.leonardo.ai/users/65d71243-f7c2-4204-a1b3-433aaf62da5b/generations/1f0fb8ee-ca09-64c0-99b3-1022370133e5/seedream-4.5_Abstract_geometric_symbol_combining_angular_brackets_with_a_subtle_checkmark_int-0.jpg",
  },
  {
    slug: "nextjs-fullstack",
    coverImageUrl: "https://cdn.leonardo.ai/users/65d71243-f7c2-4204-a1b3-433aaf62da5b/generations/1f0fb8f6-bfc7-6e50-bf29-48c90f9992d5/seedream-4.5_Abstract_triangular_form_with_forward-pointing_momentum_suggesting_server-side_r-1.jpg",
  },
  {
    slug: "modern-css-styling",
    coverImageUrl: "https://cdn.leonardo.ai/users/65d71243-f7c2-4204-a1b3-433aaf62da5b/generations/1f0fb9e2-ca59-68e0-84e6-9885f50bf9cd/seedream-4.5_Abstract_composition_of_overlapping_geometric_frames_and_golden_ratio_spirals_su-1.jpg",
  },
  {
    slug: "testing-frontend",
    coverImageUrl: "https://cdn.leonardo.ai/users/65d71243-f7c2-4204-a1b3-433aaf62da5b/generations/1f0fb9d9-847e-6090-add5-9c6d6b58221f/seedream-4.5_Abstract_speedometer_or_gauge_needle_at_peak_position_with_radiating_efficiency_-0.jpg",
  },
];

async function updateCoverImages() {
  console.log(`Updating ${COVER_IMAGES.length} cover images...`);

  let successCount = 0;
  let failCount = 0;

  for (const update of COVER_IMAGES) {
    const { data, error } = await supabase
      .from("map_nodes")
      .update({ cover_image_url: update.coverImageUrl })
      .eq("slug", update.slug)
      .select("id, slug, name");

    if (error) {
      console.error(`Failed to update ${update.slug}:`, error.message);
      failCount++;
    } else if (!data || data.length === 0) {
      console.warn(`Node not found: ${update.slug}`);
      failCount++;
    } else {
      console.log(`Updated: ${data[0].name} (${update.slug})`);
      successCount++;
    }
  }

  console.log(`\nDone: ${successCount} updated, ${failCount} failed`);
}

updateCoverImages().catch(console.error);
