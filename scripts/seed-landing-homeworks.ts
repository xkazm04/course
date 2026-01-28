#!/usr/bin/env npx tsx
/**
 * Seeds homework definitions for the HubSpot Landing Page module.
 * Creates:
 * - Project repository (if not exists)
 * - Landing page feature
 * - 15 homework definitions
 * - Lesson mappings for each homework
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ===========================================================================
// DATA DEFINITIONS
// ===========================================================================

const PROJECT_REPO = {
    name: "OpenHub",
    owner: "open-forge-courses",
    source_repo_url: "https://github.com/open-forge-courses/open-hub",
    default_branch: "main",
    primary_language: "TypeScript",
    framework: "nextjs",
    difficulty_tier: "intermediate" as const,
    readme_summary: "HubSpot clone - open source CRM and marketing platform built with Next.js",
    status: "ready"
};

const LANDING_FEATURE = {
    name: "Marketing Landing Page",
    slug: "landing-page",
    description: "Complete marketing landing page with hero, products, testimonials, and footer",
    complexity_score: 5,
    difficulty: "intermediate" as const,
    status: "approved" as const,
    estimated_hours: 25
};

interface HomeworkDef {
    name: string;
    slug: string;
    homework_type: "implementation" | "refactoring" | "debugging" | "testing";
    difficulty: "beginner" | "intermediate" | "advanced";
    estimated_hours: number;
    xp_reward: number;
    description: string;
    instructions: string;
    acceptance_criteria: Array<{
        id: string;
        description: string;
        weight: number;
    }>;
    hints: Array<{
        level: number;
        content: string;
        xp_cost: number;
    }>;
    file_scope: Array<{
        path: string;
        purpose: string;
        required: boolean;
    }>;
    branch_prefix: string;
    lessons: Array<{
        slug: string;
        relevance: number;
        is_primary: boolean;
        context: string;
    }>;
}

const HOMEWORKS: HomeworkDef[] = [
    // ===========================================================================
    // HOMEWORK 1: Navigation Bar - Static Layout
    // ===========================================================================
    {
        name: "Navigation Bar - Static Layout",
        slug: "landing-nav-static",
        homework_type: "implementation",
        difficulty: "beginner",
        estimated_hours: 1.5,
        xp_reward: 50,
        description: "Build the static navigation bar for the HubSpot clone landing page. The nav includes a logo, menu links, and CTA buttons in a horizontal layout.",
        instructions: `## Task
Create the main navigation bar for the landing page matching HubSpot's design.

## Requirements
1. Logo on the left (use placeholder or Next.js Image)
2. Navigation links in the center (Products, Solutions, Resources, Pricing)
3. Two CTAs on the right ("Get a demo", "Get started free")
4. Fixed position at top of page
5. White background with subtle shadow

## Getting Started
\`\`\`bash
git checkout -b feat/landing-nav-static
\`\`\`

## Files to Create/Modify
- \`src/components/marketing/Navbar.tsx\` (create)
- \`src/app/(marketing)/layout.tsx\` (import Navbar)`,
        acceptance_criteria: [
            { id: "layout-horizontal", description: "Logo, links, and CTAs arranged horizontally", weight: 25 },
            { id: "spacing-correct", description: "Logo left, menu center, CTAs right using justify-between", weight: 20 },
            { id: "fixed-position", description: "Navbar stays fixed at top when scrolling", weight: 20 },
            { id: "cta-styled", description: "CTAs have distinct button styles (outline + filled)", weight: 20 },
            { id: "semantic-html", description: "Uses nav, ul/li, and proper heading/link structure", weight: 15 }
        ],
        hints: [
            { level: 1, content: "Use `fixed top-0 w-full z-50` for sticky positioning", xp_cost: 5 },
            { level: 2, content: "Structure as: flex items-center justify-between px-6 py-4", xp_cost: 10 },
            { level: 3, content: `Basic structure:
\`\`\`tsx
<nav className="fixed top-0 w-full bg-white shadow-sm z-50">
  <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <Logo />
    <MenuLinks />
    <CTAButtons />
  </div>
</nav>
\`\`\``, xp_cost: 20 }
        ],
        file_scope: [
            { path: "src/components/marketing/Navbar.tsx", purpose: "Main navigation component", required: true },
            { path: "src/app/(marketing)/layout.tsx", purpose: "Import and render Navbar", required: true }
        ],
        branch_prefix: "feat/landing-nav-static",
        lessons: [
            { slug: "tailwind-navigation", relevance: 0.95, is_primary: true, context: "Use Tailwind navigation patterns for the header layout" },
            { slug: "flexbox-container-basics", relevance: 0.85, is_primary: false, context: "Apply flexbox for horizontal alignment" },
            { slug: "justify-content-align-items", relevance: 0.70, is_primary: false, context: "Distribute space between logo, menu, and CTAs" },
            { slug: "responsive-design-tailwind", relevance: 0.60, is_primary: false, context: "Hide certain elements on mobile" }
        ]
    },

    // ===========================================================================
    // HOMEWORK 2: Hero Section - Flexbox Layout
    // ===========================================================================
    {
        name: "Hero Section - Flexbox Layout",
        slug: "landing-hero-layout",
        homework_type: "implementation",
        difficulty: "beginner",
        estimated_hours: 1.5,
        xp_reward: 50,
        description: "Create the hero section layout using Flexbox. Content on the left (heading, subheading, CTAs), image on the right.",
        instructions: `## Task
Build the hero section with a two-column layout for the landing page.

## Requirements
1. Left column: Heading (h1), subheading (p), two CTA buttons
2. Right column: Hero image placeholder
3. Columns side-by-side with equal width
4. Vertically centered content
5. Adequate padding and max-width container

## Getting Started
\`\`\`bash
git checkout -b feat/landing-hero-layout
\`\`\`

## Files to Create/Modify
- \`src/components/marketing/HeroSection.tsx\` (create)
- \`src/app/(marketing)/page.tsx\` (import HeroSection)`,
        acceptance_criteria: [
            { id: "two-columns", description: "Content and image in side-by-side columns", weight: 25 },
            { id: "vertical-center", description: "Content vertically centered in its column", weight: 20 },
            { id: "cta-buttons", description: "Two styled CTA buttons (primary + secondary)", weight: 20 },
            { id: "heading-hierarchy", description: "Proper h1 for main heading, semantic structure", weight: 15 },
            { id: "container-width", description: "Content constrained to max-w-7xl with horizontal padding", weight: 20 }
        ],
        hints: [
            { level: 1, content: "Use `flex items-center gap-8` on the container", xp_cost: 5 },
            { level: 2, content: "Each column should have `flex-1` for equal widths", xp_cost: 10 },
            { level: 3, content: `\`\`\`tsx
<section className="py-20">
  <div className="max-w-7xl mx-auto px-6 flex items-center gap-12">
    <div className="flex-1">
      <h1 className="text-5xl font-bold">...</h1>
      <p className="text-xl text-gray-600 mt-4">...</p>
      <div className="flex gap-4 mt-8">
        <Button variant="primary">Get a demo</Button>
        <Button variant="outline">Get started free</Button>
      </div>
    </div>
    <div className="flex-1">
      <Image src="/hero.jpg" alt="Hero" />
    </div>
  </div>
</section>
\`\`\``, xp_cost: 20 }
        ],
        file_scope: [
            { path: "src/components/marketing/HeroSection.tsx", purpose: "Hero section component", required: true },
            { path: "src/app/(marketing)/page.tsx", purpose: "Import and render HeroSection", required: true }
        ],
        branch_prefix: "feat/landing-hero-layout",
        lessons: [
            { slug: "flexbox-container-basics", relevance: 0.95, is_primary: true, context: "Use flexbox for the two-column hero layout" },
            { slug: "justify-content-align-items", relevance: 0.90, is_primary: false, context: "Center content vertically within the hero" },
            { slug: "flex-item-properties", relevance: 0.80, is_primary: false, context: "Use flex-1 for equal column widths" },
            { slug: "tailwind-buttons", relevance: 0.70, is_primary: false, context: "Style the CTA buttons" }
        ]
    },

    // ===========================================================================
    // HOMEWORK 3: Hero Section - Responsive Stacking
    // ===========================================================================
    {
        name: "Hero Section - Responsive Stacking",
        slug: "landing-hero-responsive",
        homework_type: "implementation",
        difficulty: "beginner",
        estimated_hours: 1,
        xp_reward: 50,
        description: "Make the hero section responsive by stacking columns on mobile. Apply mobile-first design principles.",
        instructions: `## Task
Update the hero section to stack vertically on mobile devices.

## Requirements
1. Mobile (default): Content stacks vertically, text centered
2. Desktop (lg+): Side-by-side as before
3. Text sizes adjust for mobile (smaller heading)
4. Image appears below content on mobile
5. No horizontal scroll at any breakpoint

## Getting Started
\`\`\`bash
git checkout -b feat/landing-hero-responsive
\`\`\`

## Files to Modify
- \`src/components/marketing/HeroSection.tsx\``,
        acceptance_criteria: [
            { id: "mobile-stack", description: "Content stacks vertically on mobile (<1024px)", weight: 30 },
            { id: "desktop-horizontal", description: "Content side-by-side on lg screens", weight: 25 },
            { id: "text-center-mobile", description: "Text centered on mobile, left-aligned on desktop", weight: 20 },
            { id: "no-overflow", description: "No horizontal scrollbar at any viewport width", weight: 15 },
            { id: "responsive-text", description: "Heading size reduces on mobile (text-3xl md:text-5xl)", weight: 10 }
        ],
        hints: [
            { level: 1, content: "Use `flex-col lg:flex-row` for responsive direction", xp_cost: 5 },
            { level: 2, content: "Add `text-center lg:text-left` for text alignment", xp_cost: 10 },
            { level: 3, content: `\`\`\`tsx
<div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
  <div className="flex-1 text-center lg:text-left">
    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">...</h1>
  </div>
  <div className="flex-1 order-first lg:order-last">...</div>
</div>
\`\`\``, xp_cost: 20 }
        ],
        file_scope: [
            { path: "src/components/marketing/HeroSection.tsx", purpose: "Update for responsive layout", required: true }
        ],
        branch_prefix: "feat/landing-hero-responsive",
        lessons: [
            { slug: "mobile-first-design", relevance: 0.95, is_primary: true, context: "Design mobile layout first, then add desktop breakpoints" },
            { slug: "media-queries-basics", relevance: 0.85, is_primary: false, context: "Understand breakpoint concepts (via Tailwind)" },
            { slug: "flex-wrap-flow", relevance: 0.80, is_primary: false, context: "Control flex direction based on screen size" },
            { slug: "responsive-design-tailwind", relevance: 0.75, is_primary: false, context: "Use Tailwind responsive prefixes" }
        ]
    },

    // ===========================================================================
    // HOMEWORK 4: Footer - Multi-Column Layout
    // ===========================================================================
    {
        name: "Footer - Multi-Column Layout",
        slug: "landing-footer-grid",
        homework_type: "implementation",
        difficulty: "intermediate",
        estimated_hours: 2,
        xp_reward: 100,
        description: "Build the footer with CSS Grid for a responsive multi-column layout. Includes link groups, social icons, and copyright.",
        instructions: `## Task
Create the footer with 5 link columns that collapse responsively.

## Requirements
1. 5 columns: Products, Free Tools, Company, Customers, Partners
2. Each column has a heading and list of links
3. Responsive: 5 cols on desktop, 2-3 on tablet, 1 on mobile
4. Social media icons row
5. Copyright bar at bottom
6. Dark background (bg-gray-900) with light text

## Link Data
\`\`\`ts
const footerLinks = {
  Products: ["Marketing Hub", "Sales Hub", "Service Hub", "CMS Hub"],
  "Free Tools": ["Website Grader", "Email Signature", "Blog Ideas"],
  Company: ["About", "Careers", "Press", "Contact"],
  Customers: ["Customer Stories", "Support"],
  Partners: ["Become a Partner", "Partner Directory"]
};
\`\`\`

## Getting Started
\`\`\`bash
git checkout -b feat/landing-footer-grid
\`\`\``,
        acceptance_criteria: [
            { id: "five-columns-desktop", description: "5 link columns visible on lg screens", weight: 25 },
            { id: "responsive-columns", description: "Columns collapse appropriately on smaller screens", weight: 25 },
            { id: "link-styling", description: "Links have hover states and proper spacing", weight: 15 },
            { id: "social-icons", description: "Social media icons displayed in row", weight: 15 },
            { id: "dark-theme", description: "Dark background with light text, proper contrast", weight: 20 }
        ],
        hints: [
            { level: 1, content: "Use `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8`", xp_cost: 5 },
            { level: 2, content: "Map over footerLinks object: Object.entries(footerLinks)", xp_cost: 10 },
            { level: 3, content: `\`\`\`tsx
<footer className="bg-gray-900 text-gray-300 py-16">
  <div className="max-w-7xl mx-auto px-6">
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
      {Object.entries(footerLinks).map(([title, links]) => (
        <div key={title}>
          <h3 className="text-white font-semibold mb-4">{title}</h3>
          <ul className="space-y-2">
            {links.map(link => (
              <li key={link}>
                <a href="#" className="hover:text-white">{link}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
</footer>
\`\`\``, xp_cost: 20 }
        ],
        file_scope: [
            { path: "src/components/marketing/Footer.tsx", purpose: "Footer component", required: true },
            { path: "src/app/(marketing)/layout.tsx", purpose: "Import Footer", required: true }
        ],
        branch_prefix: "feat/landing-footer-grid",
        lessons: [
            { slug: "grid-container-setup", relevance: 0.90, is_primary: true, context: "Set up the grid container for footer columns" },
            { slug: "grid-template-areas", relevance: 0.85, is_primary: false, context: "Optionally use named grid areas for clarity" },
            { slug: "grid-gap-spacing", relevance: 0.80, is_primary: false, context: "Apply consistent gap between columns" },
            { slug: "auto-fit-auto-fill", relevance: 0.70, is_primary: false, context: "Create responsive column count" },
            { slug: "tailwind-navigation", relevance: 0.60, is_primary: false, context: "Style footer links consistently" }
        ]
    },

    // ===========================================================================
    // HOMEWORK 5: Product Card Component
    // ===========================================================================
    {
        name: "Product Card Component",
        slug: "landing-product-card",
        homework_type: "implementation",
        difficulty: "beginner",
        estimated_hours: 1.5,
        xp_reward: 50,
        description: "Create a reusable ProductCard component with icon, title, and description. Demonstrates React component patterns with props.",
        instructions: `## Task
Build a reusable ProductCard component for the product grid.

## Requirements
1. Accept props: icon (Lucide icon component), title, description, href
2. Display icon in a colored circle
3. Title as h3, description as paragraph
4. Entire card is clickable (Link wrapper)
5. Hover effect (scale or shadow)

## TypeScript Interface
\`\`\`tsx
interface ProductCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  iconBg?: string; // e.g., "bg-orange-500"
}
\`\`\`

## Getting Started
\`\`\`bash
git checkout -b feat/landing-product-card
\`\`\``,
        acceptance_criteria: [
            { id: "props-interface", description: "Component has TypeScript interface for props", weight: 20 },
            { id: "icon-display", description: "Icon renders in colored circular container", weight: 20 },
            { id: "card-styling", description: "Card has padding, rounded corners, subtle border/shadow", weight: 20 },
            { id: "hover-effect", description: "Card has visible hover state (scale, shadow, or border)", weight: 20 },
            { id: "clickable", description: "Entire card is wrapped in Link for navigation", weight: 20 }
        ],
        hints: [
            { level: 1, content: "Use Lucide React for icons: import { Megaphone } from 'lucide-react'", xp_cost: 5 },
            { level: 2, content: "For icon: <Icon className='w-6 h-6 text-white' />", xp_cost: 10 },
            { level: 3, content: `\`\`\`tsx
export function ProductCard({ icon: Icon, title, description, href, iconBg = "bg-orange-500" }: ProductCardProps) {
  return (
    <Link href={href} className="block p-6 rounded-xl border hover:shadow-lg transition-shadow">
      <div className={\`w-12 h-12 \${iconBg} rounded-full flex items-center justify-center mb-4\`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </Link>
  );
}
\`\`\``, xp_cost: 20 }
        ],
        file_scope: [
            { path: "src/components/marketing/ProductCard.tsx", purpose: "Reusable product card component", required: true }
        ],
        branch_prefix: "feat/landing-product-card",
        lessons: [
            { slug: "functional-components", relevance: 0.95, is_primary: true, context: "Create a functional React component" },
            { slug: "passing-props", relevance: 0.90, is_primary: false, context: "Accept and use props for dynamic content" },
            { slug: "tailwind-cards", relevance: 0.85, is_primary: false, context: "Style the card with Tailwind" },
            { slug: "jsx-syntax", relevance: 0.70, is_primary: false, context: "Write JSX markup correctly" }
        ]
    },

    // ===========================================================================
    // HOMEWORK 6: Product Grid Section
    // ===========================================================================
    {
        name: "Product Grid Section",
        slug: "landing-product-grid",
        homework_type: "implementation",
        difficulty: "intermediate",
        estimated_hours: 2,
        xp_reward: 100,
        description: "Build the product grid section displaying all HubSpot products. Uses CSS Grid with responsive columns.",
        instructions: `## Task
Create the products section with an 8-card grid.

## Requirements
1. Section with heading and description
2. 2x4 grid on desktop, 2x2 on tablet, 1 column on mobile
3. Use ProductCard component for each product
4. Consistent gap between cards

## Product Data
\`\`\`ts
const products = [
  { icon: Megaphone, title: "Marketing Hub", description: "All-in-one marketing software" },
  { icon: DollarSign, title: "Sales Hub", description: "Sales CRM software" },
  { icon: HeadphonesIcon, title: "Service Hub", description: "Customer service software" },
  { icon: FileText, title: "Content Hub", description: "Content management system" },
  { icon: Database, title: "Data Hub", description: "Data sync and quality" },
  { icon: ShoppingCart, title: "Commerce Hub", description: "B2B commerce software" },
  { icon: Brain, title: "Smart CRM", description: "AI-powered CRM platform" },
  { icon: Briefcase, title: "Small Business", description: "Starter bundle for small teams" }
];
\`\`\``,
        acceptance_criteria: [
            { id: "grid-layout", description: "Products in CSS Grid, not flexbox", weight: 25 },
            { id: "responsive-columns", description: "4 cols desktop, 2 tablet, 1 mobile", weight: 25 },
            { id: "uses-product-card", description: "Uses ProductCard component for each item", weight: 20 },
            { id: "section-header", description: "Section has heading (h2) and intro text", weight: 15 },
            { id: "consistent-spacing", description: "Uniform gap between all cards", weight: 15 }
        ],
        hints: [
            { level: 1, content: "Use `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`", xp_cost: 5 },
            { level: 2, content: "Map products array: products.map(p => <ProductCard {...p} />)", xp_cost: 10 },
            { level: 3, content: `\`\`\`tsx
<section className="py-20 bg-gray-50">
  <div className="max-w-7xl mx-auto px-6">
    <h2 className="text-3xl font-bold text-center mb-4">The HubSpot Platform</h2>
    <p className="text-gray-600 text-center mb-12">Everything you need to grow</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map(product => (
        <ProductCard key={product.title} {...product} href={\`/products/\${product.title.toLowerCase()}\`} />
      ))}
    </div>
  </div>
</section>
\`\`\``, xp_cost: 20 }
        ],
        file_scope: [
            { path: "src/components/marketing/ProductsSection.tsx", purpose: "Product grid section", required: true },
            { path: "src/app/(marketing)/page.tsx", purpose: "Import ProductsSection", required: true }
        ],
        branch_prefix: "feat/landing-product-grid",
        lessons: [
            { slug: "grid-container-setup", relevance: 0.95, is_primary: true, context: "Set up CSS Grid for the product layout" },
            { slug: "grid-item-placement", relevance: 0.85, is_primary: false, context: "Control how items flow in the grid" },
            { slug: "auto-fit-auto-fill", relevance: 0.80, is_primary: false, context: "Create responsive column count" },
            { slug: "grid-gap-spacing", relevance: 0.75, is_primary: false, context: "Apply consistent spacing between cards" },
            { slug: "component-composition", relevance: 0.70, is_primary: false, context: "Compose ProductCard components" }
        ]
    },

    // ===========================================================================
    // HOMEWORK 7: Social Proof - Logo Row
    // ===========================================================================
    {
        name: "Social Proof - Logo Row",
        slug: "landing-logos-static",
        homework_type: "implementation",
        difficulty: "beginner",
        estimated_hours: 1,
        xp_reward: 50,
        description: "Create a static row of customer logos for social proof. Focus on flexbox alignment and image handling.",
        instructions: `## Task
Display customer logos in a centered horizontal row.

## Requirements
1. Section with "Trusted by" heading
2. 5-6 logos in a horizontal row
3. Logos evenly spaced and vertically centered
4. Grayscale logos (filter: grayscale)
5. Responsive: wrap or scroll on mobile

## Logo Data (use placeholder images)
\`\`\`ts
const logos = [
  { name: "eBay", src: "/logos/ebay.svg" },
  { name: "DoorDash", src: "/logos/doordash.svg" },
  { name: "Reddit", src: "/logos/reddit.svg" },
  { name: "TripAdvisor", src: "/logos/tripadvisor.svg" },
  { name: "Eventbrite", src: "/logos/eventbrite.svg" }
];
\`\`\``,
        acceptance_criteria: [
            { id: "horizontal-layout", description: "Logos in horizontal row using flexbox", weight: 25 },
            { id: "evenly-spaced", description: "Logos have equal spacing between them", weight: 25 },
            { id: "vertically-centered", description: "All logos aligned on their vertical center", weight: 20 },
            { id: "grayscale-filter", description: "Logos appear grayscale", weight: 15 },
            { id: "responsive", description: "Layout works on mobile (wrap or overflow-x-auto)", weight: 15 }
        ],
        hints: [
            { level: 1, content: "Use `flex items-center justify-center gap-12`", xp_cost: 5 },
            { level: 2, content: "Apply `grayscale` filter with Tailwind or CSS filter property", xp_cost: 10 },
            { level: 3, content: `\`\`\`tsx
<section className="py-12 bg-white">
  <p className="text-center text-gray-500 mb-8">Trusted by leading companies</p>
  <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap px-6">
    {logos.map(logo => (
      <Image
        key={logo.name}
        src={logo.src}
        alt={logo.name}
        width={120}
        height={40}
        className="grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition"
      />
    ))}
  </div>
</section>
\`\`\``, xp_cost: 20 }
        ],
        file_scope: [
            { path: "src/components/marketing/LogoCloud.tsx", purpose: "Social proof logo section", required: true },
            { path: "src/app/(marketing)/page.tsx", purpose: "Import LogoCloud", required: true }
        ],
        branch_prefix: "feat/landing-logos-static",
        lessons: [
            { slug: "flexbox-container-basics", relevance: 0.90, is_primary: true, context: "Use flexbox to align logos horizontally" },
            { slug: "justify-content-align-items", relevance: 0.85, is_primary: false, context: "Center and space logos evenly" },
            { slug: "responsive-images", relevance: 0.70, is_primary: false, context: "Handle logo images responsively" },
            { slug: "flexbox-alignment-tricks", relevance: 0.75, is_primary: false, context: "Use gap for consistent spacing" }
        ]
    },

    // ===========================================================================
    // HOMEWORK 8: Logo Carousel - Animation
    // ===========================================================================
    {
        name: "Logo Carousel - Infinite Scroll",
        slug: "landing-logos-animated",
        homework_type: "implementation",
        difficulty: "intermediate",
        estimated_hours: 2,
        xp_reward: 100,
        description: "Add infinite scroll animation to the logo cloud. Uses CSS keyframes for smooth continuous scrolling.",
        instructions: `## Task
Convert the static logo row into an infinite scrolling carousel.

## Requirements
1. Logos scroll continuously from right to left
2. Animation loops seamlessly (no jump)
3. Pause on hover
4. Smooth linear timing
5. Duplicate logos to create seamless loop

## Animation Technique
- Duplicate the logo set (render logos twice)
- Animate translateX from 0 to -50%
- Use overflow-hidden on container`,
        acceptance_criteria: [
            { id: "continuous-scroll", description: "Logos scroll continuously without stopping", weight: 30 },
            { id: "seamless-loop", description: "No visible jump when animation repeats", weight: 25 },
            { id: "pause-on-hover", description: "Animation pauses when user hovers", weight: 20 },
            { id: "smooth-animation", description: "Uses linear timing for smooth movement", weight: 15 },
            { id: "no-overflow", description: "Container hides overflow correctly", weight: 10 }
        ],
        hints: [
            { level: 1, content: "Duplicate logos: [...logos, ...logos] for seamless loop", xp_cost: 5 },
            { level: 2, content: "Define keyframes in globals.css: @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }", xp_cost: 10 },
            { level: 3, content: `\`\`\`tsx
// In component
<div className="overflow-hidden">
  <div className="flex gap-12 animate-scroll hover:[animation-play-state:paused]">
    {[...logos, ...logos].map((logo, i) => (
      <Image key={i} ... />
    ))}
  </div>
</div>

// In tailwind.config or globals.css
.animate-scroll {
  animation: scroll 20s linear infinite;
}
\`\`\``, xp_cost: 20 }
        ],
        file_scope: [
            { path: "src/components/marketing/LogoCloud.tsx", purpose: "Add animation to logos", required: true },
            { path: "src/app/globals.css", purpose: "Add keyframes if not using Tailwind config", required: false }
        ],
        branch_prefix: "feat/landing-logos-animated",
        lessons: [
            { slug: "keyframes-rule", relevance: 0.95, is_primary: true, context: "Define keyframes for scroll animation" },
            { slug: "animation-properties", relevance: 0.90, is_primary: false, context: "Apply animation duration, timing, iteration" },
            { slug: "timing-functions", relevance: 0.70, is_primary: false, context: "Use linear timing for continuous scroll" },
            { slug: "common-animation-patterns", relevance: 0.65, is_primary: false, context: "Implement marquee/infinite scroll pattern" }
        ]
    },

    // ===========================================================================
    // HOMEWORK 9: Testimonial Card Component
    // ===========================================================================
    {
        name: "Testimonial Card Component",
        slug: "landing-testimonial-card",
        homework_type: "implementation",
        difficulty: "beginner",
        estimated_hours: 1.5,
        xp_reward: 50,
        description: "Build a reusable testimonial card with quote, author info, and metrics.",
        instructions: `## Task
Create a TestimonialCard component for customer quotes.

## Requirements
1. Large quote text with quotation marks
2. Author info: name, title, company
3. Author avatar (circular image)
4. Optional metrics (e.g., "50% increase in conversions")
5. Company logo

## TypeScript Interface
\`\`\`tsx
interface TestimonialCardProps {
  quote: string;
  author: {
    name: string;
    title: string;
    company: string;
    avatar: string;
  };
  metrics?: { label: string; value: string }[];
  companyLogo?: string;
}
\`\`\``,
        acceptance_criteria: [
            { id: "quote-styling", description: "Quote text is prominent with quotation marks", weight: 20 },
            { id: "author-layout", description: "Avatar, name, and title arranged properly", weight: 25 },
            { id: "avatar-circular", description: "Author avatar is circular (rounded-full)", weight: 15 },
            { id: "metrics-display", description: "Metrics shown if provided", weight: 20 },
            { id: "typescript-props", description: "Props properly typed with interface", weight: 20 }
        ],
        hints: [
            { level: 1, content: "Use text-2xl italic for the quote text", xp_cost: 5 },
            { level: 2, content: "Avatar: w-12 h-12 rounded-full object-cover", xp_cost: 10 },
            { level: 3, content: `\`\`\`tsx
<div className="bg-white p-8 rounded-2xl shadow-sm">
  <p className="text-2xl italic text-gray-800 mb-6">"{quote}"</p>
  <div className="flex items-center gap-4">
    <Image src={author.avatar} alt={author.name} className="w-12 h-12 rounded-full" />
    <div>
      <p className="font-semibold">{author.name}</p>
      <p className="text-sm text-gray-500">{author.title}, {author.company}</p>
    </div>
  </div>
  {metrics && (
    <div className="flex gap-8 mt-6 pt-6 border-t">
      {metrics.map(m => (
        <div key={m.label}>
          <p className="text-3xl font-bold text-orange-500">{m.value}</p>
          <p className="text-sm text-gray-500">{m.label}</p>
        </div>
      ))}
    </div>
  )}
</div>
\`\`\``, xp_cost: 20 }
        ],
        file_scope: [
            { path: "src/components/marketing/TestimonialCard.tsx", purpose: "Testimonial card component", required: true }
        ],
        branch_prefix: "feat/landing-testimonial-card",
        lessons: [
            { slug: "functional-components", relevance: 0.90, is_primary: true, context: "Create functional React component" },
            { slug: "tailwind-cards", relevance: 0.90, is_primary: false, context: "Style testimonial card with Tailwind" },
            { slug: "passing-props", relevance: 0.85, is_primary: false, context: "Accept testimonial data as props" },
            { slug: "typography-utilities", relevance: 0.70, is_primary: false, context: "Style quote and author text" }
        ]
    },

    // ===========================================================================
    // HOMEWORK 10: Testimonials Section - Tabs
    // ===========================================================================
    {
        name: "Testimonials Section with Tabs",
        slug: "landing-testimonials-tabs",
        homework_type: "implementation",
        difficulty: "intermediate",
        estimated_hours: 2.5,
        xp_reward: 100,
        description: "Build a testimonials section with tab navigation. Switch between different customer segments.",
        instructions: `## Task
Create testimonials section with segment tabs (Enterprise, Mid-Market, Small Business).

## Requirements
1. Tab bar with 3 options
2. Active tab visually distinct
3. Clicking tab shows different testimonial
4. Smooth transition between testimonials (optional)
5. Use TestimonialCard component

## Data Structure
\`\`\`ts
const testimonials = {
  enterprise: { quote: "...", author: {...} },
  midmarket: { quote: "...", author: {...} },
  smallbusiness: { quote: "...", author: {...} }
};
\`\`\``,
        acceptance_criteria: [
            { id: "tabs-render", description: "Three tabs displayed horizontally", weight: 20 },
            { id: "active-state", description: "Active tab has distinct styling", weight: 25 },
            { id: "tab-switching", description: "Clicking tab changes displayed testimonial", weight: 30 },
            { id: "uses-usestate", description: "Uses useState to track active tab", weight: 15 },
            { id: "uses-testimonial-card", description: "Renders TestimonialCard with correct data", weight: 10 }
        ],
        hints: [
            { level: 1, content: "useState with tab keys: const [activeTab, setActiveTab] = useState('enterprise')", xp_cost: 5 },
            { level: 2, content: "Tab button: className={activeTab === id ? 'border-b-2 border-orange-500' : ''}", xp_cost: 10 },
            { level: 3, content: `\`\`\`tsx
const [activeTab, setActiveTab] = useState<keyof typeof testimonials>('enterprise');

return (
  <section className="py-20">
    <div className="flex justify-center gap-8 mb-12">
      {Object.keys(testimonials).map(tab => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={\`pb-2 \${activeTab === tab ? 'border-b-2 border-orange-500 font-semibold' : 'text-gray-500'}\`}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
    <TestimonialCard {...testimonials[activeTab]} />
  </section>
);
\`\`\``, xp_cost: 20 }
        ],
        file_scope: [
            { path: "src/components/marketing/TestimonialsSection.tsx", purpose: "Testimonials section with tabs", required: true },
            { path: "src/app/(marketing)/page.tsx", purpose: "Import TestimonialsSection", required: true }
        ],
        branch_prefix: "feat/landing-testimonials-tabs",
        lessons: [
            { slug: "usestate-hook", relevance: 0.95, is_primary: true, context: "Manage active tab state" },
            { slug: "state-updates", relevance: 0.85, is_primary: false, context: "Update state on tab click" },
            { slug: "lifting-state-up", relevance: 0.75, is_primary: false, context: "Control which testimonial displays" },
            { slug: "component-composition", relevance: 0.70, is_primary: false, context: "Compose tabs and testimonial cards" }
        ]
    },

    // ===========================================================================
    // HOMEWORK 11: Navigation Dropdown Menu
    // ===========================================================================
    {
        name: "Navigation Dropdown Menu",
        slug: "landing-nav-dropdown",
        homework_type: "implementation",
        difficulty: "intermediate",
        estimated_hours: 2,
        xp_reward: 100,
        description: "Add dropdown menus to the navigation bar. Shows submenu on hover/click.",
        instructions: `## Task
Enhance the navbar with dropdown menus for Products and Resources.

## Requirements
1. Dropdown appears on hover (desktop) or click
2. Dropdown contains links with icons/descriptions
3. Close on outside click
4. Smooth enter/exit animation
5. Accessible (keyboard navigation optional)`,
        acceptance_criteria: [
            { id: "dropdown-toggle", description: "Dropdown opens on hover or click", weight: 25 },
            { id: "submenu-content", description: "Dropdown shows links with proper styling", weight: 20 },
            { id: "close-outside", description: "Dropdown closes when clicking outside", weight: 25 },
            { id: "animation", description: "Smooth opacity/transform transition", weight: 15 },
            { id: "multiple-dropdowns", description: "Multiple nav items can have dropdowns", weight: 15 }
        ],
        hints: [
            { level: 1, content: "Use useState for open/closed state per dropdown", xp_cost: 5 },
            { level: 2, content: "Use onMouseEnter/Leave for hover, onClick for toggle", xp_cost: 10 },
            { level: 3, content: `\`\`\`tsx
const [openDropdown, setOpenDropdown] = useState<string | null>(null);

<div
  onMouseEnter={() => setOpenDropdown('products')}
  onMouseLeave={() => setOpenDropdown(null)}
>
  <button>Products</button>
  {openDropdown === 'products' && (
    <div className="absolute top-full left-0 bg-white shadow-lg rounded-lg p-4">
      {/* dropdown content */}
    </div>
  )}
</div>
\`\`\``, xp_cost: 20 }
        ],
        file_scope: [
            { path: "src/components/marketing/Navbar.tsx", purpose: "Add dropdown functionality", required: true },
            { path: "src/components/marketing/NavDropdown.tsx", purpose: "Dropdown component", required: false }
        ],
        branch_prefix: "feat/landing-nav-dropdown",
        lessons: [
            { slug: "usestate-hook", relevance: 0.90, is_primary: true, context: "Manage dropdown open/close state" },
            { slug: "state-variants", relevance: 0.85, is_primary: false, context: "Style based on state (open/closed)" },
            { slug: "event-listeners", relevance: 0.75, is_primary: false, context: "Handle mouse events for hover" },
            { slug: "transition-property", relevance: 0.70, is_primary: false, context: "Add smooth transitions" },
            { slug: "tailwind-navigation", relevance: 0.65, is_primary: false, context: "Style dropdown menu" }
        ]
    },

    // ===========================================================================
    // HOMEWORK 12: Mobile Navigation Toggle
    // ===========================================================================
    {
        name: "Mobile Navigation Toggle",
        slug: "landing-mobile-nav",
        homework_type: "implementation",
        difficulty: "intermediate",
        estimated_hours: 2,
        xp_reward: 100,
        description: "Add hamburger menu for mobile navigation. Slide-out menu with all nav links.",
        instructions: `## Task
Create mobile navigation with hamburger toggle and slide-out menu.

## Requirements
1. Hamburger icon visible only on mobile (<lg)
2. Desktop nav hidden on mobile
3. Slide-out panel from right
4. All nav links in vertical list
5. Close button or outside click to close
6. Body scroll lock when open (optional)`,
        acceptance_criteria: [
            { id: "hamburger-mobile-only", description: "Hamburger icon shows only on mobile", weight: 20 },
            { id: "slide-animation", description: "Menu slides in from side", weight: 20 },
            { id: "close-mechanism", description: "Can close via X button or outside click", weight: 20 },
            { id: "nav-links-vertical", description: "Links displayed vertically with spacing", weight: 20 },
            { id: "overlay-backdrop", description: "Dark overlay behind menu when open", weight: 20 }
        ],
        hints: [
            { level: 1, content: "Use `lg:hidden` to show hamburger only on mobile", xp_cost: 5 },
            { level: 2, content: "Position menu with `fixed inset-y-0 right-0 w-64`", xp_cost: 10 },
            { level: 3, content: `\`\`\`tsx
{isOpen && (
  <>
    <div className="fixed inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
    <div className="fixed inset-y-0 right-0 w-64 bg-white shadow-xl p-6">
      <button onClick={() => setIsOpen(false)}>
        <X className="w-6 h-6" />
      </button>
      <nav className="mt-8 flex flex-col gap-4">
        {links.map(link => (
          <a key={link.href} href={link.href}>{link.label}</a>
        ))}
      </nav>
    </div>
  </>
)}
\`\`\``, xp_cost: 20 }
        ],
        file_scope: [
            { path: "src/components/marketing/Navbar.tsx", purpose: "Add mobile nav toggle", required: true },
            { path: "src/components/marketing/MobileNav.tsx", purpose: "Mobile nav drawer", required: false }
        ],
        branch_prefix: "feat/landing-mobile-nav",
        lessons: [
            { slug: "usestate-hook", relevance: 0.90, is_primary: true, context: "Manage open/close state" },
            { slug: "responsive-design-tailwind", relevance: 0.90, is_primary: false, context: "Show/hide elements responsively" },
            { slug: "media-queries-basics", relevance: 0.80, is_primary: false, context: "Understand breakpoints" },
            { slug: "state-variants", relevance: 0.75, is_primary: false, context: "Style based on state" },
            { slug: "motion-component", relevance: 0.60, is_primary: false, context: "Animate slide-in (optional)" }
        ]
    },

    // ===========================================================================
    // HOMEWORK 13: Hero Text Animation
    // ===========================================================================
    {
        name: "Hero Text Animation",
        slug: "landing-hero-animation",
        homework_type: "implementation",
        difficulty: "intermediate",
        estimated_hours: 2,
        xp_reward: 100,
        description: "Add rotating text animation to the hero headline using Framer Motion.",
        instructions: `## Task
Animate the hero heading to rotate through different words.

## Requirements
1. Heading: "Where teams go to [grow/scale/close/retain]"
2. Word rotates every 2-3 seconds
3. Smooth fade/slide animation
4. Loop infinitely
5. Use Framer Motion for animation

## Words to Rotate
\`\`\`ts
const words = ["grow", "scale", "close", "retain"];
\`\`\``,
        acceptance_criteria: [
            { id: "word-rotation", description: "Different words appear in sequence", weight: 25 },
            { id: "smooth-animation", description: "Words animate in/out smoothly", weight: 25 },
            { id: "timing", description: "Words change every 2-3 seconds", weight: 20 },
            { id: "uses-framer-motion", description: "Uses Framer Motion for animation", weight: 20 },
            { id: "infinite-loop", description: "Animation loops back to first word", weight: 10 }
        ],
        hints: [
            { level: 1, content: "Use useState + useEffect with setInterval for word cycling", xp_cost: 5 },
            { level: 2, content: "AnimatePresence with mode='wait' for smooth transitions", xp_cost: 10 },
            { level: 3, content: `\`\`\`tsx
const [index, setIndex] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setIndex(i => (i + 1) % words.length);
  }, 2500);
  return () => clearInterval(interval);
}, []);

<h1>
  Where teams go to{' '}
  <AnimatePresence mode="wait">
    <motion.span
      key={words[index]}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-orange-500"
    >
      {words[index]}
    </motion.span>
  </AnimatePresence>
</h1>
\`\`\``, xp_cost: 20 }
        ],
        file_scope: [
            { path: "src/components/marketing/HeroSection.tsx", purpose: "Add text animation", required: true }
        ],
        branch_prefix: "feat/landing-hero-animation",
        lessons: [
            { slug: "motion-component", relevance: 0.95, is_primary: true, context: "Use motion for animated elements" },
            { slug: "animate-prop", relevance: 0.90, is_primary: false, context: "Define animation states" },
            { slug: "variants-pattern", relevance: 0.80, is_primary: false, context: "Coordinate enter/exit animations" },
            { slug: "useeffect-basics", relevance: 0.70, is_primary: false, context: "Set up interval for word cycling" },
            { slug: "usestate-hook", relevance: 0.65, is_primary: false, context: "Track current word index" }
        ]
    },

    // ===========================================================================
    // HOMEWORK 14: Awards Badge Grid
    // ===========================================================================
    {
        name: "Awards Badge Grid",
        slug: "landing-awards-grid",
        homework_type: "implementation",
        difficulty: "beginner",
        estimated_hours: 1,
        xp_reward: 50,
        description: "Display G2 and other award badges in a responsive grid.",
        instructions: `## Task
Create a section displaying award badges.

## Requirements
1. Section heading "Industry Recognition"
2. Grid of 6 award badge images
3. Responsive: 3x2 on desktop, 2x3 on tablet, 2x3 on mobile
4. Badges evenly sized
5. Link to full awards page`,
        acceptance_criteria: [
            { id: "grid-layout", description: "Badges in CSS Grid", weight: 25 },
            { id: "responsive", description: "Grid adapts to screen size", weight: 25 },
            { id: "equal-sizing", description: "All badges same size", weight: 20 },
            { id: "section-heading", description: "Has heading above grid", weight: 15 },
            { id: "awards-link", description: "Link to see all awards", weight: 15 }
        ],
        hints: [
            { level: 1, content: "Use `grid grid-cols-2 md:grid-cols-3 gap-6`", xp_cost: 5 },
            { level: 2, content: "Set fixed dimensions on images or use aspect-ratio", xp_cost: 10 },
            { level: 3, content: `\`\`\`tsx
<section className="py-16 bg-gray-50">
  <div className="max-w-4xl mx-auto px-6 text-center">
    <h2 className="text-2xl font-bold mb-8">Industry Recognition</h2>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
      {awards.map(award => (
        <Image
          key={award.name}
          src={award.src}
          alt={award.name}
          width={150}
          height={150}
          className="mx-auto"
        />
      ))}
    </div>
    <a href="/awards" className="inline-block mt-8 text-orange-500 hover:underline">
      See all awards →
    </a>
  </div>
</section>
\`\`\``, xp_cost: 20 }
        ],
        file_scope: [
            { path: "src/components/marketing/AwardsSection.tsx", purpose: "Awards badge grid", required: true },
            { path: "src/app/(marketing)/page.tsx", purpose: "Import AwardsSection", required: true }
        ],
        branch_prefix: "feat/landing-awards-grid",
        lessons: [
            { slug: "grid-container-setup", relevance: 0.90, is_primary: true, context: "Set up grid for badges" },
            { slug: "grid-alignment", relevance: 0.85, is_primary: false, context: "Center badges in grid cells" },
            { slug: "responsive-images", relevance: 0.75, is_primary: false, context: "Handle badge images" },
            { slug: "auto-fit-auto-fill", relevance: 0.70, is_primary: false, context: "Responsive columns" }
        ]
    },

    // ===========================================================================
    // HOMEWORK 15: CTA Section
    // ===========================================================================
    {
        name: "CTA Section",
        slug: "landing-cta-section",
        homework_type: "implementation",
        difficulty: "beginner",
        estimated_hours: 1,
        xp_reward: 50,
        description: "Build the final call-to-action section with centered content and dual buttons.",
        instructions: `## Task
Create a prominent CTA section near the footer.

## Requirements
1. Full-width background (gradient or solid color)
2. Centered heading and subtext
3. Two CTA buttons (primary + secondary)
4. Adequate vertical padding
5. Text contrasts with background`,
        acceptance_criteria: [
            { id: "centered-content", description: "All content centered horizontally", weight: 25 },
            { id: "dual-ctas", description: "Two distinct button styles", weight: 25 },
            { id: "background", description: "Section has colored/gradient background", weight: 20 },
            { id: "contrast", description: "Text readable against background", weight: 15 },
            { id: "padding", description: "Generous vertical padding (py-16+)", weight: 15 }
        ],
        hints: [
            { level: 1, content: "Use `text-center` and flexbox for centering", xp_cost: 5 },
            { level: 2, content: "Try gradient: `bg-gradient-to-r from-orange-500 to-red-500`", xp_cost: 10 },
            { level: 3, content: `\`\`\`tsx
<section className="py-20 bg-gradient-to-r from-orange-500 to-red-500">
  <div className="max-w-3xl mx-auto px-6 text-center text-white">
    <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
    <p className="text-xl mb-8 text-white/90">
      Join thousands of companies growing with HubSpot
    </p>
    <div className="flex gap-4 justify-center">
      <Button variant="white">Get a demo</Button>
      <Button variant="outline-white">Start free</Button>
    </div>
  </div>
</section>
\`\`\``, xp_cost: 20 }
        ],
        file_scope: [
            { path: "src/components/marketing/CTASection.tsx", purpose: "CTA section component", required: true },
            { path: "src/app/(marketing)/page.tsx", purpose: "Import CTASection", required: true }
        ],
        branch_prefix: "feat/landing-cta-section",
        lessons: [
            { slug: "tailwind-buttons", relevance: 0.95, is_primary: true, context: "Style CTA buttons" },
            { slug: "flexbox-container-basics", relevance: 0.85, is_primary: false, context: "Center content and buttons" },
            { slug: "color-utilities", relevance: 0.70, is_primary: false, context: "Apply background colors/gradients" },
            { slug: "typography-utilities", relevance: 0.70, is_primary: false, context: "Style heading and text" },
            { slug: "state-variants", relevance: 0.65, is_primary: false, context: "Button hover states" }
        ]
    }
];

// ===========================================================================
// MAIN SEEDING FUNCTION
// ===========================================================================

async function main() {
    console.log("=== SEEDING LANDING PAGE HOMEWORKS ===\n");

    // Step 1: Check/Create Project Repository
    console.log("1. Checking project repository...");
    const { data: existingRepo } = await supabase
        .from("project_repositories")
        .select("id")
        .eq("owner", PROJECT_REPO.owner)
        .eq("name", PROJECT_REPO.name)
        .single();

    let repoId: string;

    if (existingRepo) {
        repoId = existingRepo.id;
        console.log("   Repository exists:", repoId);
    } else {
        const { data: newRepo, error } = await supabase
            .from("project_repositories")
            .insert(PROJECT_REPO)
            .select("id")
            .single();

        if (error) {
            console.error("   Error creating repository:", error.message);
            return;
        }
        repoId = newRepo!.id;
        console.log("   Created repository:", repoId);
    }

    // Step 2: Check/Create Feature
    console.log("\n2. Checking feature...");
    const { data: existingFeature } = await supabase
        .from("project_features")
        .select("id")
        .eq("slug", LANDING_FEATURE.slug)
        .eq("repo_id", repoId)
        .single();

    let featureId: string;

    if (existingFeature) {
        featureId = existingFeature.id;
        console.log("   Feature exists:", featureId);
    } else {
        const { data: newFeature, error } = await supabase
            .from("project_features")
            .insert({ ...LANDING_FEATURE, repo_id: repoId })
            .select("id")
            .single();

        if (error) {
            console.error("   Error creating feature:", error.message);
            return;
        }
        featureId = newFeature!.id;
        console.log("   Created feature:", featureId);
    }

    // Step 3: Get lesson IDs for mapping
    console.log("\n3. Fetching lesson IDs...");
    const allLessonSlugs = [...new Set(HOMEWORKS.flatMap(h => h.lessons.map(l => l.slug)))];

    const { data: lessonsData, error: lessonsError } = await supabase
        .from("map_nodes")
        .select("id, slug")
        .in("slug", allLessonSlugs)
        .eq("depth", 4);

    if (lessonsError) {
        console.error("   Error fetching lessons:", lessonsError.message);
        return;
    }

    const lessonIdMap = new Map<string, string>();
    lessonsData?.forEach(l => lessonIdMap.set(l.slug, l.id));
    console.log("   Found", lessonIdMap.size, "/", allLessonSlugs.length, "lessons");

    // Check for missing lessons
    const missingLessons = allLessonSlugs.filter(slug => !lessonIdMap.has(slug));
    if (missingLessons.length > 0) {
        console.warn("   Missing lessons:", missingLessons.join(", "));
    }

    // Step 4: Create Homework Definitions
    console.log("\n4. Creating homework definitions...");
    let created = 0;
    let skipped = 0;

    for (const hw of HOMEWORKS) {
        // Check if exists
        const { data: existing } = await supabase
            .from("project_homework_definitions")
            .select("id")
            .eq("slug", hw.slug)
            .eq("feature_id", featureId)
            .single();

        if (existing) {
            console.log("   Skipped (exists):", hw.slug);
            skipped++;
            continue;
        }

        // Find primary lesson ID
        const primaryLesson = hw.lessons.find(l => l.is_primary);
        const primaryLessonId = primaryLesson ? lessonIdMap.get(primaryLesson.slug) : null;

        // Insert homework definition
        const { data: newHw, error: hwError } = await supabase
            .from("project_homework_definitions")
            .insert({
                feature_id: featureId,
                name: hw.name,
                slug: hw.slug,
                homework_type: hw.homework_type,
                difficulty: hw.difficulty,
                estimated_hours: hw.estimated_hours,
                xp_reward: hw.xp_reward,
                description: hw.description,
                instructions: hw.instructions,
                acceptance_criteria: hw.acceptance_criteria,
                hints: hw.hints,
                file_scope: hw.file_scope,
                branch_prefix: hw.branch_prefix,
                primary_lesson_id: primaryLessonId,
                status: "open"
            })
            .select("id")
            .single();

        if (hwError) {
            console.error("   Error creating", hw.slug, ":", hwError.message);
            continue;
        }

        console.log("   Created:", hw.slug);
        created++;

        // Step 5: Create lesson mappings
        const mappings = hw.lessons
            .filter(l => lessonIdMap.has(l.slug))
            .map(l => ({
                homework_definition_id: newHw!.id,
                lesson_node_id: lessonIdMap.get(l.slug)!,
                relevance_score: l.relevance,
                is_primary: l.is_primary,
                lesson_context: l.context
            }));

        if (mappings.length > 0) {
            const { error: mapError } = await supabase
                .from("homework_lesson_mappings")
                .insert(mappings);

            if (mapError) {
                console.error("     Mapping error:", mapError.message);
            } else {
                console.log("     Mapped to", mappings.length, "lessons");
            }
        }
    }

    // Summary
    console.log("\n=== SUMMARY ===");
    console.log("Created:", created);
    console.log("Skipped:", skipped);
    console.log("Total homeworks:", HOMEWORKS.length);

    // Verify
    const { count } = await supabase
        .from("project_homework_definitions")
        .select("*", { count: "exact", head: true })
        .eq("feature_id", featureId);

    console.log("\nHomeworks in feature:", count);

    const { count: mappingCount } = await supabase
        .from("homework_lesson_mappings")
        .select("*", { count: "exact", head: true });

    console.log("Total lesson mappings:", mappingCount);
}

main().catch(console.error);
