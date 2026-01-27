/**
 * Run migration via Supabase service role
 * Usage: npx tsx scripts/run-migration.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function runMigration() {
  console.log("Running migration: 022_treemap_cover_images.sql");

  // Check if column already exists
  const { data: columns, error: checkError } = await supabase.rpc("get_columns", {
    table_name: "map_nodes",
  });

  // If rpc doesn't exist, just try the alter
  const migrationSQL = `
    ALTER TABLE map_nodes
    ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500) DEFAULT NULL;
  `;

  const { error } = await supabase.rpc("exec_sql", { sql: migrationSQL });

  if (error) {
    // Try direct approach - the column might already exist or we need different method
    console.log("RPC not available, column may already exist or need manual migration");
    console.log("Error:", error.message);

    // Let's verify by selecting from the table
    const { data, error: selectError } = await supabase
      .from("map_nodes")
      .select("id, cover_image_url")
      .limit(1);

    if (selectError && selectError.message.includes("cover_image_url")) {
      console.log("\nColumn does not exist. Please run this SQL in Supabase Dashboard:");
      console.log("----------------------------------------");
      console.log(`ALTER TABLE map_nodes ADD COLUMN cover_image_url VARCHAR(500) DEFAULT NULL;`);
      console.log("----------------------------------------");
    } else if (data) {
      console.log("Column already exists!");
    }
  } else {
    console.log("Migration completed successfully!");
  }
}

runMigration().catch(console.error);
