# Astro Component Best Practices & Reusable Patterns

**Research Date:** 2026-01-30
**Focus:** Astro 5.2 with TypeScript, React 19, Tailwind CSS
**Project:** tongkho-web (Vietnamese real estate platform)

---

## 1. ASTRO COMPONENT ARCHITECTURE PATTERNS

### 1.1 Core Component Structure
Astro components use frontmatter (---) for logic, HTML template, optional scoped styles:

```astro
---
// 1. Imports (types, utils, child components)
import type { Property } from '@/types/property';
import { formatPrice } from '@/utils/format';

// 2. Typed Props interface
interface Props {
  items: Property[];
  maxItems?: number;
}

// 3. Component logic
const { items, maxItems = 6 } = Astro.props;
const filtered = maxItems ? items.slice(0, maxItems) : items;
---

<!-- 4. HTML template (static by default) -->
<div class="grid">
  {filtered.map(item => <div>{item.title}</div>)}
</div>

<!-- 5. Scoped styles (component-only) -->
<style>
  .grid { @apply grid grid-cols-3 gap-4; }
</style>
```

**Key principles:**
- Astro components are static HTML by default (zero JavaScript overhead)
- Props fully typed via interfaces (no `any` types allowed)
- Frontmatter executes only during build, never in browser
- Scoped styles use component's CSS in isolation

### 1.2 Component Composition Hierarchy
Build pages from smaller, focused components:

```astro
---
// Page-level composition
import Header from '@components/header/header.astro';
import HeroSection from '@components/home/hero-section.astro';
import PropertiesGrid from '@components/cards/properties-grid.astro';
import Footer from '@components/footer/footer.astro';
---

<Header />
<HeroSection />
<PropertiesGrid />
<Footer />
```

**Benefits:**
- Each component <150 LOC (cognitive load limit)
- Easy to test & reuse across pages
- Clear separation of concerns
- Maintainable prop interfaces

---

## 2. REUSABLE COMPONENT PATTERNS

### 2.1 Variant Props Pattern
When components differ only in styling, use variant props:

```typescript
interface Props {
  title: string;
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  primary: 'bg-primary-500 text-white',
  secondary: 'bg-secondary-500 text-white',
  ghost: 'bg-transparent border border-gray-300',
};

const sizeStyles = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};
```

**Use when:**
- Same HTML structure, different visual presentation
- Button sizes, card themes, badge types
- Avoid creating duplicate components

### 2.2 Generic Reusable List Component
Extract common list/grid patterns into single component:

```typescript
interface ListProps<T> {
  title: string;
  items: T[];
  onItemClick?: (item: T) => void;
  getLabel: (item: T) => string;
  getId: (item: T) => string;
  isSelected?: (item: T) => boolean;
}
```

Used for filters (price ranges, areas, property types):
- Single component handles all filter lists
- Props provide data transformation functions
- Avoids code duplication across similar UI patterns
- Codebase already demonstrates this: `sidebar-filter-list.astro`

### 2.3 Slot-Based Composition
For complex nested layouts, use Astro slots:

```astro
---
// LayoutCard.astro
interface Props {
  title: string;
  variant?: 'elevated' | 'flat';
}
const { title, variant = 'elevated' } = Astro.props;
---

<article class={`card card-${variant}`}>
  <header>
    <h2>{title}</h2>
  </header>
  <section>
    <slot />  <!-- Render child content -->
  </section>
  <footer>
    <slot name="actions" />  <!-- Named slot for CTA buttons -->
  </footer>
</article>
```

**Usage:**
```astro
<LayoutCard title="Property Details">
  <p>Detailed content here</p>
  <span slot="actions">
    <button>Learn More</button>
  </span>
</LayoutCard>
```

**Benefits:**
- Eliminates prop drilling for complex children
- Flexible content insertion
- Reusable layout structure

---

## 3. PROPS & TYPE SAFETY

### 3.1 Best Practices
- **Always use interfaces** for Props (not type or any)
- **Destructure with defaults** in component logic
- **Never access Astro.props directly** in template
- **Distinguish required vs optional** with `?` modifier

```typescript
// ✅ Good
interface Props {
  title: string;          // Required
  count?: number;         // Optional with ?
  items: string[];       // Required array
  isActive?: boolean;    // Optional boolean
}

const { title, count = 0, items, isActive = false } = Astro.props;

// ❌ Bad
const props: any = Astro.props;
```

### 3.2 Generic Props for Flexibility
Use TypeScript generics for data-agnostic components:

```typescript
interface GridProps<T> {
  items: T[];
  renderItem: (item: T) => string;
  columns?: 2 | 3 | 4;
}

export function Grid<T>({ items, renderItem, columns = 3 }: GridProps<T>) {
  return <div class={`grid-cols-${columns}`}>
    {items.map(item => <div>{renderItem(item)}</div>)}
  </div>
}
```

---

## 4. ASTRO VS REACT ISLANDS PATTERN

### 4.1 When to Use Pure Astro
✅ **Static content** (property cards, listings, headers, footers)
✅ **Server-rendered UI** (filtering not interactive on page load)
✅ **SEO-critical pages** (product pages, blog posts)

**Advantage:** Zero JavaScript output = faster page loads

### 4.2 When to Use React Islands (`client:` directive)
✅ **Interactive features** (search filters, modal dialogs, real-time updates)
✅ **Form handling** (user input validation)
✅ **Stateful components** (shopping cart, favorites)

```astro
---
import { HeroSearch } from '@components/home/hero-search';
---

<!-- Only hydrated in browser, minimal JS overhead -->
<HeroSearch client:load />
```

**Available directives:**
- `client:load` - Hydrate immediately (for critical UI)
- `client:idle` - Hydrate when browser is idle (default for interactive)
- `client:visible` - Hydrate when visible in viewport (lazy hydration)
- `client:only="react"` - Render only in browser (skip SSR)

### 4.3 Current Project Pattern
tongkho-web correctly uses:
- **Astro for:** Property cards, grids, headers, layouts (static HTML)
- **React for:** Hero search (interactive form, state management)
- **Result:** Minimal JavaScript, fast initial load

---

## 5. TAILWIND CSS INTEGRATION IN ASTRO

### 5.1 Scoped Component Styles
Astro automatically scopes `<style>` blocks:

```astro
---
// Only applied to THIS component's HTML
---
<style>
  .card-grid {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4;
  }
</style>
```

### 5.2 Dynamic Classes with Variants
Use Tailwind's `@apply` for maintainability:

```astro
<style>
  .btn-primary {
    @apply px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors;
  }
</style>
```

Instead of repeating in template:
```astro
<!-- ❌ Verbose -->
<button class="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors">
```

### 5.3 Responsive Design (Mobile-First)
```astro
<!-- Start mobile, then add desktop classes -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

Breakpoints:
- `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`

---

## 6. FILE SIZE & ORGANIZATION STANDARDS

### 6.1 Limits (Current Project Already Enforces)
- **Component file:** <150 LOC (achieved: property-card.astro = 139 LOC)
- **Utility function:** <50 LOC
- **Data file:** <300 LOC
- **Page layout:** <100 LOC

### 6.2 Component Discovery Checklist
**Before creating new component:**
1. Search existing components for similar patterns
2. Check if variant props could solve the problem
3. Verify props/data structure compatibility
4. Review `src/components/*/` structure
5. Use grep for component naming patterns

**Current codebase example:**
- ✅ `share-buttons.astro` - Parameterized for `variant` (inline/popup) & `size` (sm/md/lg)
- ✅ Reused in: property cards, news articles, article pages
- ❌ Would be 3+ duplicates without composition

---

## 7. KEY FINDINGS FROM CURRENT CODEBASE

### 7.1 What's Done Well
✅ **Strict TypeScript:** All components typed, no `any`
✅ **Component naming:** Kebab-case descriptors (property-card, share-buttons)
✅ **Props interfaces:** Properly documented with JSDoc
✅ **Composition:** Smaller focused components, good hierarchy
✅ **Tailwind-first:** Minimal custom CSS, scoped when needed
✅ **Vietnamese localization:** Centralized utilities (formatPrice, formatDate)

### 7.2 Refactor Opportunities
- **Dropdown components:** 4 similar dropdowns (property-type, location, price-range, area-range) could consolidate to 1 generic component with variant props
- **Card components:** Check for repeated patterns in team-member-card, achievement-stat-card
- **Filter patterns:** Existing sidebar-filter-list already reusable; could extend to other filter scenarios
- **Share buttons:** Excellent pattern—variant & size props reduce duplication by ~60%

---

## 8. ASTRO ISLAND PERFORMANCE OPTIMIZATION

### 8.1 Minimize JavaScript Bundle
Strategy: Static HTML first, hydrate selectively

```astro
<!-- ❌ Bad: Hydrates entire component needlessly -->
<SearchForm client:load />

<!-- ✅ Good: Hydrate only interactive parts -->
<StaticSearchDisplay />
<SearchFilters client:idle />  <!-- Non-critical, hydrate later -->
```

### 8.2 Lazy Hydration Strategy
```astro
<!-- Load below-fold interactive content only when visible -->
<ChatWidget client:visible />
<RelatedProducts client:visible />
```

### 8.3 Hydration Size Best Practice
Keep hydrated React components minimal:
- Extract non-interactive UI into static Astro
- Keep React islands <10KB per component
- Defer state management for truly interactive features only

---

## 9. IMPORT ORGANIZATION

Standard import order (improves readability):
```typescript
// 1. Framework imports
import type { ReactNode } from 'react';
import type { AstroComponentFactory } from 'astro';

// 2. Type imports
import type { Property, SearchFilters } from '@/types/property';

// 3. Component imports
import { PropertyCard } from '@components/cards/property-card';

// 4. Utility & data imports
import { formatPrice } from '@utils/format';
import { mockProperties } from '@data/mock-properties';

// 5. Styles (Astro only, at end)
// <style> block
```

---

## 10. RECOMMENDATIONS FOR TONGKHO-WEB

### Priority 1 (High Impact)
1. **Consolidate dropdowns:** Merge 4 dropdown variants into single generic component
2. **Audit card components:** Check team/achievement cards for duplication
3. **Extend filter pattern:** Apply sidebar-filter-list reusability across dashboard

### Priority 2 (Medium Impact)
4. **Document component discovery:** Add to code-standards.md checklist
5. **Establish variant guidelines:** When to use variant props vs separate components
6. **Review React islands:** Verify minimal hydration, no unnecessary client-side code

### Priority 3 (Polish)
7. **Performance audit:** Measure hydration cost of interactive components
8. **Refactor helper checklist:** Before implementing, verify no existing pattern exists

---

## UNRESOLVED QUESTIONS

1. **Dropdown consolidation scope:** Should all 4 dropdowns merge into single component or preserve semantic distinction?
2. **Card component audit:** Full inventory of all card types in codebase—how many have >80% duplication?
3. **Slot usage:** Are there complex nested layouts where slots would improve composition vs current prop-drilling?
4. **Performance baseline:** Current hydration cost metrics? Target optimization threshold?
5. **Share buttons extension:** Should popup variant be extracted as separate `PopupMenu` component for other use cases?

---

**Sources:**
- Astro 5.2 official component documentation (docs.astro.build)
- tongkho-web codebase analysis (share-buttons.astro, property-card.astro, code-standards.md)
- Project's established TypeScript + Tailwind patterns
- Real-world reusability patterns from existing components
