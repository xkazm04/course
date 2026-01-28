/**
 * Script to list map node slugs
 * Run with: npx tsx scripts/list-map-slugs.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listSlugs() {
  const { data, error } = await supabase
    .from("map_nodes")
    .select("slug, name, node_type, depth")
    .in("depth", [1, 2])
    .order("depth", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Error:", error.message);
    return;
  }

  console.log("Map nodes at depth 1-2:\n");
  for (const node of data || []) {
    console.log(`[${node.depth}] ${node.slug} - "${node.name}" (${node.node_type})`);
  }
}

listSlugs().catch(console.error);
