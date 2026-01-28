import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const nodeId = "37f63160-cfdc-43de-afd4-7568be14698e";

  console.log("Checking lesson content status...");

  const { data, error } = await supabase
    .from("lesson_content")
    .select("id, status, node_id, version")
    .eq("node_id", nodeId);

  if (error) {
    console.log("Error:", error.message);
    return;
  }

  console.log("Current records:", JSON.stringify(data, null, 2));

  if (data && data.length > 0 && data[0].status !== "published") {
    console.log("\nUpdating status to published...");
    const { error: updateError } = await supabase
      .from("lesson_content")
      .update({ status: "published" })
      .eq("node_id", nodeId);

    if (updateError) {
      console.log("Update error:", updateError.message);
    } else {
      console.log("Status updated to published!");
    }
  } else if (data && data.length > 0) {
    console.log("\nStatus is already published.");
  } else {
    console.log("\nNo lesson content found for this node.");
  }
}

main().catch(console.error);
