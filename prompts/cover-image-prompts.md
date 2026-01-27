# Cover Image Generation Prompts

Generated for treemap navigator card backgrounds.
All images should be used at 10-15% opacity as subtle background elements.

## Style Guidelines

- **Colors**: Ember orange (#F97316) on dark charcoal (#1a1510)
- **Style**: Minimalist geometric, line art, subtle glow
- **Format**: 1:1 square, centered symbol, clean vectors
- **No**: Text, gradients, photorealism, busy details

---

## Level 1: Topics (Depth 1)

### Frontend Domain

#### HTML & CSS Basics
```
Abstract geometric symbol representing web structure and styling. Interlocking angular brackets forming a layered grid pattern, suggesting markup hierarchy. Single continuous line art in ember orange (#F97316) on dark charcoal (#1a1510). Subtle outer glow. Minimalist, modern tech aesthetic. Centered composition, 1:1 ratio. No text.
```

#### JavaScript Fundamentals
```
Abstract symbol of curly braces morphing into dynamic flowing lines, representing code execution and logic flow. Geometric interpretation of function blocks and variable scope. Ember orange (#F97316) line art on dark charcoal (#1a1510). Subtle glow effect. Clean vectors, minimalist developer aesthetic. 1:1 square, centered. No text.
```

#### React Ecosystem
```
Stylized atomic orbital symbol with three elliptical paths intersecting at center point. Abstract representation of component composition and state cycles. Ember orange (#F97316) continuous line on dark charcoal (#1a1510). Soft glow around orbital paths. Modern, minimal tech logo style. 1:1 ratio, centered. No text.
```

#### TypeScript
```
Abstract geometric symbol combining angular brackets with a subtle checkmark integration, representing type safety and validation. Sharp precise lines suggesting strictness and structure. Ember orange (#F97316) on dark charcoal (#1a1510). Minimal glow. Clean vector style, developer tool aesthetic. 1:1 square. No text.
```

#### Next.js
```
Abstract triangular form with forward-pointing momentum, suggesting server-side rendering and build optimization. Geometric layers implying hybrid architecture. Ember orange (#F97316) line art on dark charcoal (#1a1510). Subtle directional glow. Minimalist, modern framework aesthetic. 1:1 ratio, centered. No text.
```

### Backend Domain

#### Node.js Backend
```
Abstract hexagonal network pattern representing event loop and asynchronous operations. Interconnected nodes suggesting non-blocking I/O. Geometric, circuit-like aesthetic. Ember orange (#F97316) on dark charcoal (#1a1510). Soft glow at connection points. Minimalist server infrastructure style. 1:1 square. No text.
```

#### Python Backend
```
Abstract intertwining serpentine curves forming elegant geometric pattern, suggesting simplicity and readability. Flowing lines with mathematical precision. Ember orange (#F97316) continuous stroke on dark charcoal (#1a1510). Subtle glow. Clean, minimal developer aesthetic. 1:1 ratio, centered. No text.
```

#### API Design
```
Abstract symbol of bidirectional arrows connecting geometric endpoints, representing request-response patterns. Clean pathways suggesting data flow and endpoints. Ember orange (#F97316) line art on dark charcoal (#1a1510). Glow at connection nodes. Minimalist architecture diagram style. 1:1 square. No text.
```

#### Authentication & Authorization
```
Abstract geometric lock or shield form with layered concentric patterns, suggesting security gates and access control. Keyhole negative space at center. Ember orange (#F97316) on dark charcoal (#1a1510). Protective glow effect. Minimal, secure tech aesthetic. 1:1 ratio, centered. No text.
```

### Databases Domain

#### SQL Fundamentals
```
Abstract geometric table grid with intersecting lines forming structured rows and columns. Relational connection points between cells. Clean database schema aesthetic. Ember orange (#F97316) line art on dark charcoal (#1a1510). Subtle glow at intersections. Minimalist data structure style. 1:1 square. No text.
```

#### PostgreSQL
```
Abstract elephant silhouette reduced to essential geometric curves, integrated with database cylinder form. Elegant minimal interpretation. Ember orange (#F97316) continuous line on dark charcoal (#1a1510). Soft glow outline. Modern logo style, tech aesthetic. 1:1 ratio, centered. No text.
```

#### NoSQL Databases
```
Abstract scattered geometric shapes - documents, key-value pairs, nodes - floating in organized chaos pattern. Flexible schema representation. Ember orange (#F97316) on dark charcoal (#1a1510). Glow connecting disparate elements. Minimalist, modern data aesthetic. 1:1 square. No text.
```

### Group Nodes

#### Performance
```
Abstract speedometer or gauge needle at peak position, with radiating efficiency lines. Geometric representation of optimization and speed. Ember orange (#F97316) line art on dark charcoal (#1a1510). Dynamic glow suggesting velocity. Minimalist metric aesthetic. 1:1 ratio, centered. No text.
```

#### Security
```
Abstract geometric shield with embedded circuit patterns, suggesting digital protection layers. Fortress-like angular construction. Ember orange (#F97316) on dark charcoal (#1a1510). Protective aura glow. Clean vector security aesthetic. 1:1 square, centered. No text.
```

#### UI Design
```
Abstract composition of overlapping geometric frames and golden ratio spirals, suggesting layout and visual harmony. Balance and proportion principles. Ember orange (#F97316) line art on dark charcoal (#1a1510). Subtle glow. Minimalist design system aesthetic. 1:1 ratio. No text.
```

---

## Level 2: Skills (Depth 2)

### React Ecosystem Skills

#### React Components
```
Abstract modular blocks fitting together like puzzle pieces, representing component composition and reusability. Geometric shapes with clear boundaries and connection points. Ember orange (#F97316) on dark charcoal (#1a1510). Glow at component edges. Minimalist building-block aesthetic. 1:1 square. No text.
```

#### React Hooks
```
Abstract curved hook shapes interconnecting, forming a flowing system of state and effects. Fishing hook geometry abstracted into functional programming symbol. Ember orange (#F97316) continuous line on dark charcoal (#1a1510). Subtle connection glow. Modern React aesthetic. 1:1 ratio, centered. No text.
```

#### State Management
```
Abstract central hub with radiating spokes connecting to satellite nodes, representing global state distribution. Tree-like data flow pattern. Ember orange (#F97316) line art on dark charcoal (#1a1510). Glow pulses from center. Minimalist architecture diagram style. 1:1 square. No text.
```

#### React Router
```
Abstract branching pathways diverging from single point, representing navigation routes and URL mapping. Road-like geometric intersections. Ember orange (#F97316) on dark charcoal (#1a1510). Directional glow along paths. Minimalist wayfinding aesthetic. 1:1 ratio, centered. No text.
```

#### Forms & Validation
```
Abstract input field rectangles with checkmark overlays, representing data entry and verification. Form elements reduced to geometric essence. Ember orange (#F97316) line art on dark charcoal (#1a1510). Validation glow effect. Clean UI component aesthetic. 1:1 square. No text.
```

---

## Usage Instructions

1. Copy the prompt for your target node
2. Paste into your image generator (Midjourney, DALL-E, Stable Diffusion, etc.)
3. Generate at 1024x1024 or higher resolution
4. Save as PNG with transparency if possible
5. Upload to storage and update `cover_image_url` in `map_nodes` table

### Platform Tips

**Midjourney**: Append `--style raw --stylize 50 --no text --ar 1:1`

**DALL-E 3**: Use prompt as-is

**Stable Diffusion**: Add negative prompt: `text, words, letters, photorealistic, 3D, complex, busy, colorful, multiple colors, gradients`

---

## Database Update Template

After generating images, update the database:

```sql
UPDATE map_nodes
SET cover_image_url = 'https://your-storage.com/images/react-ecosystem.png'
WHERE slug = 'react-ecosystem';
```

---

*Generated: 2026-01-27*
*Style: Ember Forge Theme*
