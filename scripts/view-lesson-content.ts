import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const nodeId = "37f63160-cfdc-43de-afd4-7568be14698e";

  // Get node info
  const { data: node } = await supabase
    .from("map_nodes")
    .select("name, slug")
    .eq("id", nodeId)
    .single();

  console.log("=== LESSON NODE ===");
  console.log(`Name: ${node?.name}`);
  console.log(`Slug: ${node?.slug}`);

  // Get lesson content
  const { data: content, error } = await supabase
    .from("lesson_content")
    .select("content_markdown, introduction, metadata")
    .eq("node_id", nodeId)
    .single();

  if (error) {
    console.log("Error:", error.message);
    return;
  }

  console.log("\n=== INTRODUCTION ===");
  console.log(content.introduction || "None");
  console.log("\n=== CONTENT MARKDOWN (first 3000 chars) ===");
  console.log(content.content_markdown?.slice(0, 3000) || "None");
  console.log("\n=== METADATA ===");
  console.log(JSON.stringify(content.metadata, null, 2));

  // Get sections
  const { data: lessonContent } = await supabase
    .from("lesson_content")
    .select("id")
    .eq("node_id", nodeId)
    .single();

  if (lessonContent) {
    const { data: sections } = await supabase
      .from("lesson_sections")
      .select("title, section_type, content_markdown, code_snippet, code_language")
      .eq("lesson_content_id", lessonContent.id)
      .order("sort_order");

    console.log("\n=== SECTIONS ===");
    sections?.forEach((s, i) => {
      console.log(`\n--- Section ${i + 1}: ${s.title} (${s.section_type}) ---`);
      if (s.content_markdown) {
        console.log("Content:", s.content_markdown.slice(0, 500));
      }
      if (s.code_snippet) {
        console.log(`Code (${s.code_language}):`);
        console.log(s.code_snippet.slice(0, 300));
      }
    });
  }
}

main().catch(console.error);
