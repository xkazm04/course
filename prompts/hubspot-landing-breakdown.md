# HubSpot Landing Page - DECOMPOSE Breakdown

## D - Define the Target Feature

**Module**: Marketing Landing Page
**Target**: HubSpot.com homepage clone
**Repository**: https://github.com/open-forge-courses/open-hub

### Core Functionality
1. Fixed navigation with dropdown menus
2. Hero section with animated headline and dual CTAs
3. Social proof logo carousel
4. Product grid showcase
5. Feature cards with hover states
6. Testimonials/case studies section
7. Awards/badges display
8. Final CTA section
9. Multi-column footer

---

## E - Extract Visual Components

### Navigation Bar
- Logo (left)
- Menu items with dropdowns (center)
- CTA buttons (right)
- Mobile hamburger menu
- Sticky/fixed positioning

### Hero Section
- Full-width container
- Background image/gradient
- Large heading (serif font)
- Subheading text
- Two CTA buttons (primary + secondary)
- Word rotation animation (optional advanced)

### Social Proof Section
- Section heading
- Horizontal logo carousel
- Navigation arrows (prev/next)
- Auto-scroll behavior

### Product Grid
- Section heading + description
- 2x4 responsive grid
- Product cards (icon + title + description)
- Hover effects
- Links to product pages

### Testimonials Section
- Tab navigation (segments)
- Quote/testimonial text
- Client info + image
- Metrics display
- Case study link

### Awards Section
- Grid of badge images
- Link to full awards page

### Footer CTA
- Centered content
- Large heading
- Dual CTAs

### Footer
- Multi-column link groups
- Social media icons
- Copyright info
- App store badges

---

## C - Categorize by Skill Domain

| Component | Primary Skill | Secondary Skills |
|-----------|--------------|------------------|
| Navigation | Tailwind Patterns | Flexbox, Responsive Design |
| Hero Layout | Flexbox Layout | Tailwind, Responsive |
| Hero Animation | Framer Motion | React Hooks |
| Social Proof Carousel | React Hooks | Flexbox, CSS Transitions |
| Product Grid | CSS Grid | Tailwind, Components |
| Product Card | Tailwind Patterns | React Components |
| Testimonials | State Management | Components, Tailwind |
| Awards Grid | CSS Grid | Tailwind |
| Footer | CSS Layout | Tailwind Patterns |

---

## O - Order by Dependencies

### Phase 1: Static Structure (HTML/CSS)
1. Page layout scaffold
2. Navigation bar (static)
3. Hero section layout
4. Footer layout

### Phase 2: Component Extraction (React)
5. Product card component
6. Logo item component
7. Testimonial card component

### Phase 3: Grid Layouts
8. Product grid section
9. Awards grid section

### Phase 4: Interactivity
10. Navigation dropdowns
11. Logo carousel (auto-scroll)
12. Testimonial tabs

### Phase 5: Polish
13. Hero text animation
14. Hover effects
15. Mobile responsiveness refinement

---

## M - Map to Lessons (Detailed)

### Homework 1: Navigation Bar - Static Layout
**Primary Lessons:**
- `tailwind-navigation` (Tailwind Patterns) - 0.95 relevance
- `flexbox-container-basics` (Flexbox Layout) - 0.85 relevance

**Secondary Lessons:**
- `justify-content-align-items` - 0.7
- `responsive-design-tailwind` - 0.6

---

### Homework 2: Hero Section - Flexbox Layout
**Primary Lessons:**
- `flexbox-container-basics` (Flexbox Layout) - 0.95 relevance
- `justify-content-align-items` (Flexbox Layout) - 0.9 relevance

**Secondary Lessons:**
- `flex-item-properties` - 0.8
- `mobile-first-design` - 0.75
- `tailwind-buttons` - 0.7

---

### Homework 3: Hero Section - Responsive Stacking
**Primary Lessons:**
- `mobile-first-design` (Responsive Design) - 0.95 relevance
- `media-queries-basics` (Responsive Design) - 0.85 relevance

**Secondary Lessons:**
- `flex-wrap-flow` - 0.8
- `responsive-design-tailwind` - 0.75

---

### Homework 4: Footer - Multi-Column Layout
**Primary Lessons:**
- `grid-container-setup` (CSS Grid Layout) - 0.9 relevance
- `grid-template-areas` (CSS Grid Layout) - 0.85 relevance

**Secondary Lessons:**
- `grid-gap-spacing` - 0.8
- `auto-fit-auto-fill` - 0.7
- `tailwind-navigation` - 0.6

---

### Homework 5: Product Card Component
**Primary Lessons:**
- `functional-components` (JSX and Components) - 0.95 relevance
- `passing-props` (Props and State) - 0.9 relevance

**Secondary Lessons:**
- `tailwind-cards` - 0.85
- `jsx-syntax` - 0.7
- `children-prop` - 0.6

---

### Homework 6: Product Grid Section
**Primary Lessons:**
- `grid-container-setup` (CSS Grid Layout) - 0.95 relevance
- `grid-item-placement` (CSS Grid Layout) - 0.85 relevance

**Secondary Lessons:**
- `auto-fit-auto-fill` - 0.8
- `grid-gap-spacing` - 0.75
- `component-composition` - 0.7

---

### Homework 7: Logo Carousel - Static
**Primary Lessons:**
- `flexbox-container-basics` (Flexbox Layout) - 0.9 relevance
- `justify-content-align-items` (Flexbox Layout) - 0.85 relevance

**Secondary Lessons:**
- `flexbox-alignment-tricks` - 0.75
- `responsive-images` - 0.7

---

### Homework 8: Logo Carousel - Animation
**Primary Lessons:**
- `keyframes-rule` (Keyframe Animations) - 0.95 relevance
- `animation-properties` (Keyframe Animations) - 0.9 relevance

**Secondary Lessons:**
- `transition-property` - 0.75
- `timing-functions` - 0.7
- `common-animation-patterns` - 0.65

---

### Homework 9: Testimonial Card Component
**Primary Lessons:**
- `functional-components` (JSX and Components) - 0.9 relevance
- `tailwind-cards` (Tailwind Patterns) - 0.9 relevance

**Secondary Lessons:**
- `passing-props` - 0.85
- `typography-utilities` - 0.7
- `color-utilities` - 0.65

---

### Homework 10: Testimonials Section - Tabs
**Primary Lessons:**
- `usestate-hook` (Props and State) - 0.95 relevance
- `state-updates` (Props and State) - 0.85 relevance

**Secondary Lessons:**
- `lifting-state-up` - 0.75
- `component-composition` - 0.7
- `state-variants` - 0.65

---

### Homework 11: Navigation Dropdown Menu
**Primary Lessons:**
- `usestate-hook` (Props and State) - 0.9 relevance
- `state-variants` (Advanced Tailwind) - 0.85 relevance

**Secondary Lessons:**
- `event-listeners` - 0.75
- `transition-property` - 0.7
- `tailwind-navigation` - 0.65

---

### Homework 12: Mobile Navigation Toggle
**Primary Lessons:**
- `usestate-hook` (Props and State) - 0.9 relevance
- `responsive-design-tailwind` (Advanced Tailwind) - 0.9 relevance

**Secondary Lessons:**
- `media-queries-basics` - 0.8
- `state-variants` - 0.75
- `motion-component` - 0.6

---

### Homework 13: Hero Text Animation
**Primary Lessons:**
- `motion-component` (Framer Motion Basics) - 0.95 relevance
- `animate-prop` (Framer Motion Basics) - 0.9 relevance

**Secondary Lessons:**
- `variants-pattern` - 0.8
- `useeffect-basics` - 0.7
- `usestate-hook` - 0.65

---

### Homework 14: Awards Badge Grid
**Primary Lessons:**
- `grid-container-setup` (CSS Grid Layout) - 0.9 relevance
- `grid-alignment` (CSS Grid Layout) - 0.85 relevance

**Secondary Lessons:**
- `responsive-images` - 0.75
- `auto-fit-auto-fill` - 0.7

---

### Homework 15: CTA Section
**Primary Lessons:**
- `tailwind-buttons` (Tailwind Patterns) - 0.95 relevance
- `flexbox-container-basics` (Flexbox Layout) - 0.85 relevance

**Secondary Lessons:**
- `color-utilities` - 0.7
- `typography-utilities` - 0.7
- `state-variants` - 0.65

---

## P - Prepare Acceptance Criteria

See individual homework definitions below.

---

## O - Optimize for Independence

Each homework is designed to be completable independently:

1. **Starter Code**: Each provides necessary imports and page structure
2. **Mock Data**: All data is provided inline or via mock files
3. **File Scope**: Clear ownership - each homework creates/modifies specific files
4. **No Blocking**: No homework requires another to be completed first
5. **Style Isolation**: All styling via Tailwind classes (no global CSS modifications)

---

## S - Size Appropriately

| Homework | Difficulty | Est. Hours | XP |
|----------|------------|------------|-----|
| 1. Nav Static | beginner | 1.5 | 50 |
| 2. Hero Layout | beginner | 1.5 | 50 |
| 3. Hero Responsive | beginner | 1 | 50 |
| 4. Footer Layout | intermediate | 2 | 100 |
| 5. Product Card | beginner | 1.5 | 50 |
| 6. Product Grid | intermediate | 2 | 100 |
| 7. Logo Carousel Static | beginner | 1 | 50 |
| 8. Logo Carousel Anim | intermediate | 2 | 100 |
| 9. Testimonial Card | beginner | 1.5 | 50 |
| 10. Testimonial Tabs | intermediate | 2.5 | 100 |
| 11. Nav Dropdown | intermediate | 2 | 100 |
| 12. Mobile Nav | intermediate | 2 | 100 |
| 13. Hero Animation | intermediate | 2 | 100 |
| 14. Awards Grid | beginner | 1 | 50 |
| 15. CTA Section | beginner | 1 | 50 |

**Total: 15 homeworks, ~23 hours, 1100 XP**

---

## E - Estimate and Tag

Complete homework definitions ready for database seeding.

---

# HOMEWORK DEFINITIONS

## Homework 01: Navigation Bar - Static Layout

```yaml
name: "Navigation Bar - Static Layout"
slug: "landing-nav-static"
homework_type: "implementation"
difficulty: "beginner"
estimated_hours: 1.5
xp_reward: 50

feature_id: "landing-page"

description: |
  Build the static navigation bar for the HubSpot clone landing page.
  The nav includes a logo, menu links, and CTA buttons in a horizontal layout.

lessons:
  - slug: tailwind-navigation
    relevance: 0.95
    is_primary: true
    context: "Use Tailwind's navigation patterns for the header layout"
  - slug: flexbox-container-basics
    relevance: 0.85
    context: "Apply flexbox for horizontal alignment"
  - slug: justify-content-align-items
    relevance: 0.70
    context: "Distribute space between logo, menu, and CTAs"
  - slug: responsive-design-tailwind
    relevance: 0.60
    context: "Hide certain elements on mobile"

instructions: |
  ## Task
  Create the main navigation bar for the landing page matching HubSpot's design.

  ## Requirements
  1. Logo on the left (use placeholder or Next.js Image)
  2. Navigation links in the center (Products, Solutions, Resources, Pricing)
  3. Two CTAs on the right ("Get a demo", "Get started free")
  4. Fixed position at top of page
  5. White background with subtle shadow

  ## Getting Started
  ```bash
  git checkout -b feat/landing-nav-static
  ```

  ## Files to Create/Modify
  - `src/components/marketing/Navbar.tsx` (create)
  - `src/app/(marketing)/layout.tsx` (import Navbar)

acceptance_criteria:
  - id: "layout-horizontal"
    description: "Logo, links, and CTAs arranged horizontally"
    weight: 25
  - id: "spacing-correct"
    description: "Logo left, menu center, CTAs right using justify-between"
    weight: 20
  - id: "fixed-position"
    description: "Navbar stays fixed at top when scrolling"
    weight: 20
  - id: "cta-styled"
    description: "CTAs have distinct button styles (outline + filled)"
    weight: 20
  - id: "semantic-html"
    description: "Uses nav, ul/li, and proper heading/link structure"
    weight: 15

hints:
  - level: 1
    content: "Use `fixed top-0 w-full z-50` for sticky positioning"
    xp_cost: 5
  - level: 2
    content: "Structure as: flex items-center justify-between px-6 py-4"
    xp_cost: 10
  - level: 3
    content: |
      Basic structure:
      ```tsx
      <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo />
          <MenuLinks />
          <CTAButtons />
        </div>
      </nav>
      ```
    xp_cost: 20

file_scope:
  - path: "src/components/marketing/Navbar.tsx"
    purpose: "Main navigation component"
    required: true
  - path: "src/app/(marketing)/layout.tsx"
    purpose: "Import and render Navbar"
    required: true

branch_prefix: "feat/landing-nav-static"
```

---

## Homework 02: Hero Section - Flexbox Layout

```yaml
name: "Hero Section - Flexbox Layout"
slug: "landing-hero-layout"
homework_type: "implementation"
difficulty: "beginner"
estimated_hours: 1.5
xp_reward: 50

feature_id: "landing-page"

description: |
  Create the hero section layout using Flexbox.
  Content on the left (heading, subheading, CTAs), image on the right.

lessons:
  - slug: flexbox-container-basics
    relevance: 0.95
    is_primary: true
    context: "Use flexbox for the two-column hero layout"
  - slug: justify-content-align-items
    relevance: 0.90
    context: "Center content vertically within the hero"
  - slug: flex-item-properties
    relevance: 0.80
    context: "Use flex-1 for equal column widths"
  - slug: tailwind-buttons
    relevance: 0.70
    context: "Style the CTA buttons"

instructions: |
  ## Task
  Build the hero section with a two-column layout for the landing page.

  ## Requirements
  1. Left column: Heading (h1), subheading (p), two CTA buttons
  2. Right column: Hero image placeholder
  3. Columns side-by-side with equal width
  4. Vertically centered content
  5. Adequate padding and max-width container

  ## Getting Started
  ```bash
  git checkout -b feat/landing-hero-layout
  ```

  ## Files to Create/Modify
  - `src/components/marketing/HeroSection.tsx` (create)
  - `src/app/(marketing)/page.tsx` (import HeroSection)

acceptance_criteria:
  - id: "two-columns"
    description: "Content and image in side-by-side columns"
    weight: 25
  - id: "vertical-center"
    description: "Content vertically centered in its column"
    weight: 20
  - id: "cta-buttons"
    description: "Two styled CTA buttons (primary + secondary)"
    weight: 20
  - id: "heading-hierarchy"
    description: "Proper h1 for main heading, semantic structure"
    weight: 15
  - id: "container-width"
    description: "Content constrained to max-w-7xl with horizontal padding"
    weight: 20

hints:
  - level: 1
    content: "Use `flex items-center gap-8` on the container"
    xp_cost: 5
  - level: 2
    content: "Each column should have `flex-1` for equal widths"
    xp_cost: 10
  - level: 3
    content: |
      ```tsx
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
      ```
    xp_cost: 20

file_scope:
  - path: "src/components/marketing/HeroSection.tsx"
    purpose: "Hero section component"
    required: true
  - path: "src/app/(marketing)/page.tsx"
    purpose: "Import and render HeroSection"
    required: true

branch_prefix: "feat/landing-hero-layout"
```

---

## Homework 03: Hero Section - Responsive Stacking

```yaml
name: "Hero Section - Responsive Stacking"
slug: "landing-hero-responsive"
homework_type: "implementation"
difficulty: "beginner"
estimated_hours: 1
xp_reward: 50

feature_id: "landing-page"

description: |
  Make the hero section responsive by stacking columns on mobile.
  Apply mobile-first design principles.

lessons:
  - slug: mobile-first-design
    relevance: 0.95
    is_primary: true
    context: "Design mobile layout first, then add desktop breakpoints"
  - slug: media-queries-basics
    relevance: 0.85
    context: "Understand breakpoint concepts (via Tailwind)"
  - slug: flex-wrap-flow
    relevance: 0.80
    context: "Control flex direction based on screen size"
  - slug: responsive-design-tailwind
    relevance: 0.75
    context: "Use Tailwind responsive prefixes"

instructions: |
  ## Task
  Update the hero section to stack vertically on mobile devices.

  ## Requirements
  1. Mobile (default): Content stacks vertically, text centered
  2. Desktop (lg+): Side-by-side as before
  3. Text sizes adjust for mobile (smaller heading)
  4. Image appears below content on mobile
  5. No horizontal scroll at any breakpoint

  ## Getting Started
  ```bash
  git checkout -b feat/landing-hero-responsive
  ```

  ## Files to Modify
  - `src/components/marketing/HeroSection.tsx`

acceptance_criteria:
  - id: "mobile-stack"
    description: "Content stacks vertically on mobile (<1024px)"
    weight: 30
  - id: "desktop-horizontal"
    description: "Content side-by-side on lg screens"
    weight: 25
  - id: "text-center-mobile"
    description: "Text centered on mobile, left-aligned on desktop"
    weight: 20
  - id: "no-overflow"
    description: "No horizontal scrollbar at any viewport width"
    weight: 15
  - id: "responsive-text"
    description: "Heading size reduces on mobile (text-3xl md:text-5xl)"
    weight: 10

hints:
  - level: 1
    content: "Use `flex-col lg:flex-row` for responsive direction"
    xp_cost: 5
  - level: 2
    content: "Add `text-center lg:text-left` for text alignment"
    xp_cost: 10
  - level: 3
    content: |
      ```tsx
      <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">...</h1>
        </div>
        <div className="flex-1 order-first lg:order-last">...</div>
      </div>
      ```
    xp_cost: 20

file_scope:
  - path: "src/components/marketing/HeroSection.tsx"
    purpose: "Update for responsive layout"
    required: true

branch_prefix: "feat/landing-hero-responsive"
```

---

## Homework 04: Footer - Multi-Column Layout

```yaml
name: "Footer - Multi-Column Layout"
slug: "landing-footer-grid"
homework_type: "implementation"
difficulty: "intermediate"
estimated_hours: 2
xp_reward: 100

feature_id: "landing-page"

description: |
  Build the footer with CSS Grid for a responsive multi-column layout.
  Includes link groups, social icons, and copyright.

lessons:
  - slug: grid-container-setup
    relevance: 0.90
    is_primary: true
    context: "Set up the grid container for footer columns"
  - slug: grid-template-areas
    relevance: 0.85
    context: "Optionally use named grid areas for clarity"
  - slug: grid-gap-spacing
    relevance: 0.80
    context: "Apply consistent gap between columns"
  - slug: auto-fit-auto-fill
    relevance: 0.70
    context: "Create responsive column count"
  - slug: tailwind-navigation
    relevance: 0.60
    context: "Style footer links consistently"

instructions: |
  ## Task
  Create the footer with 5 link columns that collapse responsively.

  ## Requirements
  1. 5 columns: Products, Free Tools, Company, Customers, Partners
  2. Each column has a heading and list of links
  3. Responsive: 5 cols on desktop, 2-3 on tablet, 1 on mobile
  4. Social media icons row
  5. Copyright bar at bottom
  6. Dark background (bg-gray-900) with light text

  ## Link Data
  ```ts
  const footerLinks = {
    Products: ["Marketing Hub", "Sales Hub", "Service Hub", "CMS Hub"],
    "Free Tools": ["Website Grader", "Email Signature", "Blog Ideas"],
    Company: ["About", "Careers", "Press", "Contact"],
    Customers: ["Customer Stories", "Support"],
    Partners: ["Become a Partner", "Partner Directory"]
  };
  ```

  ## Getting Started
  ```bash
  git checkout -b feat/landing-footer-grid
  ```

acceptance_criteria:
  - id: "five-columns-desktop"
    description: "5 link columns visible on lg screens"
    weight: 25
  - id: "responsive-columns"
    description: "Columns collapse appropriately on smaller screens"
    weight: 25
  - id: "link-styling"
    description: "Links have hover states and proper spacing"
    weight: 15
  - id: "social-icons"
    description: "Social media icons displayed in row"
    weight: 15
  - id: "dark-theme"
    description: "Dark background with light text, proper contrast"
    weight: 20

hints:
  - level: 1
    content: "Use `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8`"
    xp_cost: 5
  - level: 2
    content: "Map over footerLinks object: Object.entries(footerLinks)"
    xp_cost: 10
  - level: 3
    content: |
      ```tsx
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
      ```
    xp_cost: 20

file_scope:
  - path: "src/components/marketing/Footer.tsx"
    purpose: "Footer component"
    required: true
  - path: "src/app/(marketing)/layout.tsx"
    purpose: "Import Footer"
    required: true

branch_prefix: "feat/landing-footer-grid"
```

---

## Homework 05: Product Card Component

```yaml
name: "Product Card Component"
slug: "landing-product-card"
homework_type: "implementation"
difficulty: "beginner"
estimated_hours: 1.5
xp_reward: 50

feature_id: "landing-page"

description: |
  Create a reusable ProductCard component with icon, title, and description.
  Demonstrates React component patterns with props.

lessons:
  - slug: functional-components
    relevance: 0.95
    is_primary: true
    context: "Create a functional React component"
  - slug: passing-props
    relevance: 0.90
    context: "Accept and use props for dynamic content"
  - slug: tailwind-cards
    relevance: 0.85
    context: "Style the card with Tailwind"
  - slug: jsx-syntax
    relevance: 0.70
    context: "Write JSX markup correctly"

instructions: |
  ## Task
  Build a reusable ProductCard component for the product grid.

  ## Requirements
  1. Accept props: icon (Lucide icon component), title, description, href
  2. Display icon in a colored circle
  3. Title as h3, description as paragraph
  4. Entire card is clickable (Link wrapper)
  5. Hover effect (scale or shadow)

  ## TypeScript Interface
  ```tsx
  interface ProductCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    href: string;
    iconBg?: string; // e.g., "bg-orange-500"
  }
  ```

  ## Getting Started
  ```bash
  git checkout -b feat/landing-product-card
  ```

acceptance_criteria:
  - id: "props-interface"
    description: "Component has TypeScript interface for props"
    weight: 20
  - id: "icon-display"
    description: "Icon renders in colored circular container"
    weight: 20
  - id: "card-styling"
    description: "Card has padding, rounded corners, subtle border/shadow"
    weight: 20
  - id: "hover-effect"
    description: "Card has visible hover state (scale, shadow, or border)"
    weight: 20
  - id: "clickable"
    description: "Entire card is wrapped in Link for navigation"
    weight: 20

hints:
  - level: 1
    content: "Use Lucide React for icons: import { Megaphone } from 'lucide-react'"
    xp_cost: 5
  - level: 2
    content: "For icon: <Icon className='w-6 h-6 text-white' />"
    xp_cost: 10
  - level: 3
    content: |
      ```tsx
      export function ProductCard({ icon: Icon, title, description, href, iconBg = "bg-orange-500" }: ProductCardProps) {
        return (
          <Link href={href} className="block p-6 rounded-xl border hover:shadow-lg transition-shadow">
            <div className={`w-12 h-12 ${iconBg} rounded-full flex items-center justify-center mb-4`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
          </Link>
        );
      }
      ```
    xp_cost: 20

file_scope:
  - path: "src/components/marketing/ProductCard.tsx"
    purpose: "Reusable product card component"
    required: true

branch_prefix: "feat/landing-product-card"
```

---

## Homework 06: Product Grid Section

```yaml
name: "Product Grid Section"
slug: "landing-product-grid"
homework_type: "implementation"
difficulty: "intermediate"
estimated_hours: 2
xp_reward: 100

feature_id: "landing-page"

description: |
  Build the product grid section displaying all HubSpot products.
  Uses CSS Grid with responsive columns.

lessons:
  - slug: grid-container-setup
    relevance: 0.95
    is_primary: true
    context: "Set up CSS Grid for the product layout"
  - slug: grid-item-placement
    relevance: 0.85
    context: "Control how items flow in the grid"
  - slug: auto-fit-auto-fill
    relevance: 0.80
    context: "Create responsive column count"
  - slug: grid-gap-spacing
    relevance: 0.75
    context: "Apply consistent spacing between cards"
  - slug: component-composition
    relevance: 0.70
    context: "Compose ProductCard components"

instructions: |
  ## Task
  Create the products section with an 8-card grid.

  ## Requirements
  1. Section with heading and description
  2. 2x4 grid on desktop, 2x2 on tablet, 1 column on mobile
  3. Use ProductCard component for each product
  4. Consistent gap between cards

  ## Product Data
  ```ts
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
  ```

acceptance_criteria:
  - id: "grid-layout"
    description: "Products in CSS Grid, not flexbox"
    weight: 25
  - id: "responsive-columns"
    description: "4 cols desktop, 2 tablet, 1 mobile"
    weight: 25
  - id: "uses-product-card"
    description: "Uses ProductCard component for each item"
    weight: 20
  - id: "section-header"
    description: "Section has heading (h2) and intro text"
    weight: 15
  - id: "consistent-spacing"
    description: "Uniform gap between all cards"
    weight: 15

hints:
  - level: 1
    content: "Use `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6`"
    xp_cost: 5
  - level: 2
    content: "Map products array: products.map(p => <ProductCard {...p} />)"
    xp_cost: 10
  - level: 3
    content: |
      ```tsx
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">The HubSpot Platform</h2>
          <p className="text-gray-600 text-center mb-12">Everything you need to grow</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.title} {...product} href={`/products/${product.title.toLowerCase()}`} />
            ))}
          </div>
        </div>
      </section>
      ```
    xp_cost: 20

file_scope:
  - path: "src/components/marketing/ProductsSection.tsx"
    purpose: "Product grid section"
    required: true
  - path: "src/app/(marketing)/page.tsx"
    purpose: "Import ProductsSection"
    required: true

branch_prefix: "feat/landing-product-grid"
```

---

## Homework 07: Logo Carousel - Static

```yaml
name: "Social Proof - Logo Row"
slug: "landing-logos-static"
homework_type: "implementation"
difficulty: "beginner"
estimated_hours: 1
xp_reward: 50

feature_id: "landing-page"

description: |
  Create a static row of customer logos for social proof.
  Focus on flexbox alignment and image handling.

lessons:
  - slug: flexbox-container-basics
    relevance: 0.90
    is_primary: true
    context: "Use flexbox to align logos horizontally"
  - slug: justify-content-align-items
    relevance: 0.85
    context: "Center and space logos evenly"
  - slug: responsive-images
    relevance: 0.70
    context: "Handle logo images responsively"
  - slug: flexbox-alignment-tricks
    relevance: 0.75
    context: "Use gap for consistent spacing"

instructions: |
  ## Task
  Display customer logos in a centered horizontal row.

  ## Requirements
  1. Section with "Trusted by" heading
  2. 5-6 logos in a horizontal row
  3. Logos evenly spaced and vertically centered
  4. Grayscale logos (filter: grayscale)
  5. Responsive: wrap or scroll on mobile

  ## Logo Data (use placeholder images)
  ```ts
  const logos = [
    { name: "eBay", src: "/logos/ebay.svg" },
    { name: "DoorDash", src: "/logos/doordash.svg" },
    { name: "Reddit", src: "/logos/reddit.svg" },
    { name: "TripAdvisor", src: "/logos/tripadvisor.svg" },
    { name: "Eventbrite", src: "/logos/eventbrite.svg" }
  ];
  ```

acceptance_criteria:
  - id: "horizontal-layout"
    description: "Logos in horizontal row using flexbox"
    weight: 25
  - id: "evenly-spaced"
    description: "Logos have equal spacing between them"
    weight: 25
  - id: "vertically-centered"
    description: "All logos aligned on their vertical center"
    weight: 20
  - id: "grayscale-filter"
    description: "Logos appear grayscale"
    weight: 15
  - id: "responsive"
    description: "Layout works on mobile (wrap or overflow-x-auto)"
    weight: 15

hints:
  - level: 1
    content: "Use `flex items-center justify-center gap-12`"
    xp_cost: 5
  - level: 2
    content: "Apply `grayscale` filter with Tailwind or CSS filter property"
    xp_cost: 10
  - level: 3
    content: |
      ```tsx
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
      ```
    xp_cost: 20

file_scope:
  - path: "src/components/marketing/LogoCloud.tsx"
    purpose: "Social proof logo section"
    required: true
  - path: "src/app/(marketing)/page.tsx"
    purpose: "Import LogoCloud"
    required: true

branch_prefix: "feat/landing-logos-static"
```

---

## Homework 08: Logo Carousel - Animation

```yaml
name: "Logo Carousel - Infinite Scroll"
slug: "landing-logos-animated"
homework_type: "implementation"
difficulty: "intermediate"
estimated_hours: 2
xp_reward: 100

feature_id: "landing-page"

description: |
  Add infinite scroll animation to the logo cloud.
  Uses CSS keyframes for smooth continuous scrolling.

lessons:
  - slug: keyframes-rule
    relevance: 0.95
    is_primary: true
    context: "Define keyframes for scroll animation"
  - slug: animation-properties
    relevance: 0.90
    context: "Apply animation duration, timing, iteration"
  - slug: timing-functions
    relevance: 0.70
    context: "Use linear timing for continuous scroll"
  - slug: common-animation-patterns
    relevance: 0.65
    context: "Implement marquee/infinite scroll pattern"

instructions: |
  ## Task
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
  - Use overflow-hidden on container

acceptance_criteria:
  - id: "continuous-scroll"
    description: "Logos scroll continuously without stopping"
    weight: 30
  - id: "seamless-loop"
    description: "No visible jump when animation repeats"
    weight: 25
  - id: "pause-on-hover"
    description: "Animation pauses when user hovers"
    weight: 20
  - id: "smooth-animation"
    description: "Uses linear timing for smooth movement"
    weight: 15
  - id: "no-overflow"
    description: "Container hides overflow correctly"
    weight: 10

hints:
  - level: 1
    content: "Duplicate logos: [...logos, ...logos] for seamless loop"
    xp_cost: 5
  - level: 2
    content: |
      Define keyframes in globals.css:
      @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    xp_cost: 10
  - level: 3
    content: |
      ```tsx
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
      ```
    xp_cost: 20

file_scope:
  - path: "src/components/marketing/LogoCloud.tsx"
    purpose: "Add animation to logos"
    required: true
  - path: "src/app/globals.css"
    purpose: "Add keyframes if not using Tailwind config"
    required: false

branch_prefix: "feat/landing-logos-animated"
```

---

## Homework 09: Testimonial Card Component

```yaml
name: "Testimonial Card Component"
slug: "landing-testimonial-card"
homework_type: "implementation"
difficulty: "beginner"
estimated_hours: 1.5
xp_reward: 50

feature_id: "landing-page"

description: |
  Build a reusable testimonial card with quote, author info, and metrics.

lessons:
  - slug: functional-components
    relevance: 0.90
    is_primary: true
    context: "Create functional React component"
  - slug: tailwind-cards
    relevance: 0.90
    context: "Style testimonial card with Tailwind"
  - slug: passing-props
    relevance: 0.85
    context: "Accept testimonial data as props"
  - slug: typography-utilities
    relevance: 0.70
    context: "Style quote and author text"

instructions: |
  ## Task
  Create a TestimonialCard component for customer quotes.

  ## Requirements
  1. Large quote text with quotation marks
  2. Author info: name, title, company
  3. Author avatar (circular image)
  4. Optional metrics (e.g., "50% increase in conversions")
  5. Company logo

  ## TypeScript Interface
  ```tsx
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
  ```

acceptance_criteria:
  - id: "quote-styling"
    description: "Quote text is prominent with quotation marks"
    weight: 20
  - id: "author-layout"
    description: "Avatar, name, and title arranged properly"
    weight: 25
  - id: "avatar-circular"
    description: "Author avatar is circular (rounded-full)"
    weight: 15
  - id: "metrics-display"
    description: "Metrics shown if provided"
    weight: 20
  - id: "typescript-props"
    description: "Props properly typed with interface"
    weight: 20

hints:
  - level: 1
    content: "Use text-2xl italic for the quote text"
    xp_cost: 5
  - level: 2
    content: "Avatar: w-12 h-12 rounded-full object-cover"
    xp_cost: 10
  - level: 3
    content: |
      ```tsx
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
      ```
    xp_cost: 20

file_scope:
  - path: "src/components/marketing/TestimonialCard.tsx"
    purpose: "Testimonial card component"
    required: true

branch_prefix: "feat/landing-testimonial-card"
```

---

## Homework 10: Testimonials Section - Tabs

```yaml
name: "Testimonials Section with Tabs"
slug: "landing-testimonials-tabs"
homework_type: "implementation"
difficulty: "intermediate"
estimated_hours: 2.5
xp_reward: 100

feature_id: "landing-page"

description: |
  Build a testimonials section with tab navigation.
  Switch between different customer segments.

lessons:
  - slug: usestate-hook
    relevance: 0.95
    is_primary: true
    context: "Manage active tab state"
  - slug: state-updates
    relevance: 0.85
    context: "Update state on tab click"
  - slug: lifting-state-up
    relevance: 0.75
    context: "Control which testimonial displays"
  - slug: component-composition
    relevance: 0.70
    context: "Compose tabs and testimonial cards"

instructions: |
  ## Task
  Create testimonials section with segment tabs (Enterprise, Mid-Market, Small Business).

  ## Requirements
  1. Tab bar with 3 options
  2. Active tab visually distinct
  3. Clicking tab shows different testimonial
  4. Smooth transition between testimonials (optional)
  5. Use TestimonialCard component

  ## Data Structure
  ```ts
  const testimonials = {
    enterprise: { quote: "...", author: {...} },
    midmarket: { quote: "...", author: {...} },
    smallbusiness: { quote: "...", author: {...} }
  };
  ```

acceptance_criteria:
  - id: "tabs-render"
    description: "Three tabs displayed horizontally"
    weight: 20
  - id: "active-state"
    description: "Active tab has distinct styling"
    weight: 25
  - id: "tab-switching"
    description: "Clicking tab changes displayed testimonial"
    weight: 30
  - id: "uses-usestate"
    description: "Uses useState to track active tab"
    weight: 15
  - id: "uses-testimonial-card"
    description: "Renders TestimonialCard with correct data"
    weight: 10

hints:
  - level: 1
    content: "useState with tab keys: const [activeTab, setActiveTab] = useState('enterprise')"
    xp_cost: 5
  - level: 2
    content: "Tab button: className={activeTab === id ? 'border-b-2 border-orange-500' : ''}"
    xp_cost: 10
  - level: 3
    content: |
      ```tsx
      const [activeTab, setActiveTab] = useState<keyof typeof testimonials>('enterprise');

      return (
        <section className="py-20">
          <div className="flex justify-center gap-8 mb-12">
            {Object.keys(testimonials).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 ${activeTab === tab ? 'border-b-2 border-orange-500 font-semibold' : 'text-gray-500'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <TestimonialCard {...testimonials[activeTab]} />
        </section>
      );
      ```
    xp_cost: 20

file_scope:
  - path: "src/components/marketing/TestimonialsSection.tsx"
    purpose: "Testimonials section with tabs"
    required: true
  - path: "src/app/(marketing)/page.tsx"
    purpose: "Import TestimonialsSection"
    required: true

branch_prefix: "feat/landing-testimonials-tabs"
```

---

## Remaining Homeworks (11-15) - Summary

### Homework 11: Navigation Dropdown Menu
- **Primary**: useState, state-variants
- **Focus**: Click/hover to toggle dropdown, close on outside click
- **XP**: 100 (intermediate)

### Homework 12: Mobile Navigation Toggle
- **Primary**: useState, responsive-design-tailwind
- **Focus**: Hamburger menu, slide-out navigation, body scroll lock
- **XP**: 100 (intermediate)

### Homework 13: Hero Text Animation
- **Primary**: motion-component, animate-prop
- **Focus**: Rotating words animation using Framer Motion
- **XP**: 100 (intermediate)

### Homework 14: Awards Badge Grid
- **Primary**: grid-container-setup, grid-alignment
- **Focus**: Simple responsive grid of award badges
- **XP**: 50 (beginner)

### Homework 15: CTA Section
- **Primary**: tailwind-buttons, flexbox-container-basics
- **Focus**: Centered CTA with dual buttons
- **XP**: 50 (beginner)

---

# Summary

This breakdown produces **15 non-overlapping homework assignments** from the HubSpot Landing Page module, covering:

- **7 beginner** tasks (350 XP)
- **8 intermediate** tasks (800 XP)
- **Total: 23 hours estimated, 1150 XP**

Each homework:
1. Maps to 3-5 curriculum lessons with relevance scores
2. Has clear acceptance criteria with weights
3. Is independently completable
4. Has progressive hints
5. Owns specific files (no overlap)
