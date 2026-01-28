import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const UPDATED_CONTENT = `:::definition[title="Generic Constraint"]
A generic constraint uses \`extends\` to limit a type parameter to types that are assignable to a specific type. \`T extends Constraint\` means T must have at least all the properties that Constraint has.
:::

## Why Constraints Matter

Without constraints, TypeScript can't know what properties or methods are available on a generic type parameter. Constraints let you safely access specific properties while still keeping your function generic.

:::animated[title="How Constraints Work" description="Step-by-step type narrowing"]
\`\`\`typescript
// Without constraint - T could be ANYTHING
function getLength<T>(item: T): number {
  return item.length; // Error! T might not have length
}

// With constraint - T must have length
function getLengthSafe<T extends { length: number }>(
  item: T
): number {
  return item.length; // OK! TypeScript knows T has length
}

// Usage - TypeScript checks constraint
getLengthSafe("hello");     // string has length: OK
getLengthSafe([1, 2, 3]);   // array has length: OK
getLengthSafe(123);         // number has NO length: Error!
\`\`\`
:::

## Implementation Approaches

There are multiple ways to express the same constraint. Choose based on readability and reusability:

:::tabs[title="Constraint Approaches"]
TAB: Inline Object Shape
\`\`\`typescript
// Inline constraint - good for simple, one-off cases
function getLength<T extends { length: number }>(item: T): number {
  return item.length;
}

// Works with strings, arrays, any object with length
getLength("hello");          // 5
getLength([1, 2, 3]);        // 3
getLength({ length: 10 });   // 10
\`\`\`
TAB: Interface Constraint
\`\`\`typescript
// Define reusable constraint interface
interface Measurable {
  length: number;
}

function getLength<T extends Measurable>(item: T): number {
  return item.length;
}

// Same functionality, but constraint is named and reusable
getLength("hello");          // 5
getLength([1, 2, 3]);        // 3
\`\`\`
TAB: Type Alias Constraint
\`\`\`typescript
// Type alias for the constraint
type WithLength = { length: number };

// Can be combined with other constraints
type Serializable = { toString(): string };

function stringify<T extends WithLength & Serializable>(
  item: T
): string {
  return \`Length: \${item.length}, Value: \${item.toString()}\`;
}

stringify("hello");  // "Length: 5, Value: hello"
\`\`\`
:::

## The keyof Constraint Pattern

The \`keyof\` constraint is essential for type-safe property access. It ensures the key parameter is always a valid property name.

:::code[language="typescript" title="Type-Safe Property Access"]
interface Person {
  name: string;
  age: number;
  email: string;
}

// K is constrained to valid keys of T
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person: Person = { name: "Alice", age: 30, email: "alice@test.com" };

const name = getProperty(person, "name");   // type: string
const age = getProperty(person, "age");     // type: number
getProperty(person, "invalid");             // Error: not a valid key
:::

## Multiple Constraints with Intersection

When your generic needs to satisfy multiple requirements, combine constraints with \`&\`:

:::code[language="typescript" title="Intersection Constraints"]
interface HasId { id: number; }
interface HasName { name: string; }
interface Timestamped { createdAt: Date; }

// T must have ALL of these properties
function createAuditLog<T extends HasId & HasName & Timestamped>(
  entity: T
): string {
  return \`[\${entity.createdAt.toISOString()}] Entity \${entity.id}: \${entity.name}\`;
}

// Must satisfy all constraints
createAuditLog({
  id: 1,
  name: "Product",
  createdAt: new Date(),
  price: 99  // Extra properties are fine
});
:::

## Constraining to Specific Types

Use \`extends\` with union types to limit to a set of allowed types:

:::code[language="typescript" title="Union Type Constraints"]
type AllowedTypes = string | number | boolean;

function formatValue<T extends AllowedTypes>(value: T): string {
  return String(value);
}

formatValue("hello");  // OK
formatValue(42);       // OK
formatValue(true);     // OK
formatValue({});       // Error: {} doesn't extend AllowedTypes
:::

:::tip[title="When to Use Constraints"]
- Use **inline object constraints** for simple, one-off requirements
- Use **interface constraints** when the shape is reused across multiple functions
- Use **keyof constraints** for type-safe property access patterns
- Use **intersection constraints** when combining multiple requirements
:::
`;

async function main() {
  const nodeId = "37f63160-cfdc-43de-afd4-7568be14698e";

  console.log("Updating lesson content with new directives...");

  const { data, error } = await supabase
    .from("lesson_content")
    .update({ content_markdown: UPDATED_CONTENT })
    .eq("node_id", nodeId)
    .select();

  if (error) {
    console.error("Error updating content:", error.message);
    return;
  }

  console.log("Successfully updated lesson content!");
  console.log("Updated rows:", data?.length);
  console.log("\nNew content includes:");
  console.log("- :::animated directive for animated code walkthrough");
  console.log("- :::tabs directive with 3 different implementation approaches");
  console.log("- Various :::code and :::tip directives");
}

main().catch(console.error);
