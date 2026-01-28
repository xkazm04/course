import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Get a few sample lessons with different characteristics
  const sampleIds = [
    "5aa6cc74-3742-4910-8dc0-5b0f070d49bb", // Ternary Operator - shortest
    "a79f83b6-1fe4-4175-a833-224989c83737", // useLocalStorage hook
    "526e99fa-4e88-4be7-93ac-f8dc8ebed4e8", // useContext Hook
    "3315837f-6e6e-4f6c-b2ea-b8993772c97b", // React.memo
  ];

  for (const nodeId of sampleIds) {
    console.log("\n" + "=".repeat(80));

    // Get node info
    const { data: node } = await supabase
      .from("map_nodes")
      .select("name, slug, description")
      .eq("id", nodeId)
      .single();

    console.log(`\nLESSON: ${node?.name}`);
    console.log(`SLUG: ${node?.slug}`);
    console.log(`DESCRIPTION: ${node?.description || "None"}`);

    // Get lesson content
    const { data: content } = await supabase
      .from("lesson_content")
      .select("content_markdown, introduction, metadata")
      .eq("node_id", nodeId)
      .single();

    console.log("\n--- INTRODUCTION ---");
    console.log(content?.introduction || "None");

    console.log("\n--- FULL CONTENT ---");
    console.log(content?.content_markdown);

    console.log("\n--- METADATA ---");
    console.log(JSON.stringify(content?.metadata, null, 2));
  }
}

main().catch(console.error);
