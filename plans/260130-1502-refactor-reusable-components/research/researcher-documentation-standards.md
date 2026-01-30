# Component Documentation Standards Research

**Date:** 2026-01-30 | **Context:** Tongkho-Web (Astro + TypeScript)

---

## Executive Summary

For Astro/TypeScript frontend projects, effective component documentation combines:
1. **TypeScript Props interfaces** (primary type documentation)
2. **JSDoc comments** (inline code docs)
3. **Naming conventions** (self-documenting file/folder structure)
4. **Markdown READMEs** (component library docs at scale)

Current codebase has **minimal documentation** - Props are typed but lack usage examples.

---

## 1. Component Documentation Standards

### JSDoc Pattern (Astro)
Best practice for Astro components:

```astro
---
/**
 * PropertyCard - Display property listing with price, location, features
 *
 * @component
 * @example
 * <PropertyCard property={property} />
 *
 * @prop {Property} property - Required. Property object with title, price, location
 * @prop {string} [className] - Optional. Additional CSS classes
 * @returns {AstroComponentFactory}
 */
import type { Property } from '@/types/property';

interface Props {
  property: Property;
  className?: string;
}

const { property, className = '' } = Astro.props;
---

<!-- Template -->
```

**Key Elements:**
- `@component` - Identifies Astro component
- `@example` - Shows minimal usage
- `@prop` - Documents each prop with type + purpose
- `@returns` - Describes output

### React Component Pattern
```typescript
/**
 * HeroSearch - Interactive search form with tabs and advanced filters
 *
 * Manages state for transaction type (buy/rent/project) and filters.
 * Persists selections via URL params.
 *
 * @example
 * const [filters, setFilters] = useState<SearchFilters>({});
 * return <HeroSearch onSearch={setFilters} />;
 */
interface HeroSearchProps {
  onSearch?: (filters: SearchFilters) => void;
}

export function HeroSearch({ onSearch }: HeroSearchProps) {
  // ...
}
```

---

## 2. File & Folder Naming Conventions

### Current Codebase Pattern (✅ Good)
```
src/components/
├── cards/               # Card components (product/listing)
├── ui/                  # Atomic UI elements (buttons, inputs, dropdowns)
├── header/              # Header/navigation section
├── footer/              # Footer section
├── home/                # Homepage-specific sections
├── property/            # Property detail components
├── auth/                # Authentication/modal components
├── news/                # News/blog components
├── about/               # About page components
└── seo/                 # SEO/meta components
```

**Guidelines:**
- Use **kebab-case** for files: `property-card.astro`, NOT `PropertyCard.astro`
- Use **category folders** for related components (cards, sections)
- **One component per file** (max 150 LOC)
- Name should describe **purpose**, not just "Card" or "Button"

### Better Naming Examples
```
✅ property-card.astro          ❌ card.astro
✅ sidebar-filter-list.astro    ❌ filter.astro
✅ price-range-dropdown.astro   ❌ dropdown.astro
✅ property-detail-image-gallery-carousel.astro
```

---

## 3. Props Documentation Best Practices

### TypeScript Interfaces (Primary Documentation)
```typescript
// ✅ GOOD - Self-documenting
interface PropertyCardProps {
  /** The property data to display */
  property: Property;

  /** Show hot/featured badges if applicable */
  showBadges?: boolean;

  /** Callback when card is clicked (prevents default link) */
  onCardClick?: (property: Property) => void;

  /** Custom CSS classes to append */
  className?: string;
}
```

### Props with Unions/Enums
```typescript
interface ButtonProps {
  /** Button visual variant */
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';

  /** Button size */
  size: 'sm' | 'md' | 'lg';

  /** Whether button is disabled */
  isDisabled?: boolean;

  /** Optional aria-label for accessibility */
  ariaLabel?: string;
}
```

### Complex Props with JSDoc
```typescript
/**
 * Configuration for advanced filtering
 *
 * @typedef {Object} FilterConfig
 * @property {string[]} cities - List of cities to filter by
 * @property {number} minPrice - Minimum price in million VND
 * @property {number} maxPrice - Maximum price in million VND
 * @property {'apartment'|'house'|'villa'|'land'} propertyType - Type filter
 * @property {boolean} [isHotOnly] - Only show hot properties (optional)
 */
interface FilterConfig {
  cities: string[];
  minPrice: number;
  maxPrice: number;
  propertyType: 'apartment' | 'house' | 'villa' | 'land';
  isHotOnly?: boolean;
}
```

---

## 4. Component README/Usage Documentation

### Minimal README Pattern
For component library components, add `component.md` alongside file:

```
src/components/cards/
├── property-card.astro
└── property-card.md        # ← Usage documentation
```

**Example: property-card.md**
```markdown
# PropertyCard

Displays a property listing card with image, price, location, and features.

## Props

- `property: Property` (required) - Property data object
- `showBadges?: boolean` (optional, default: true) - Display hot/featured badges
- `className?: string` (optional) - Additional CSS classes

## Example Usage

\`\`\`astro
---
import PropertyCard from '@/components/cards/property-card.astro';
import { mockProperties } from '@/data/mock-properties';

const properties = mockProperties.slice(0, 6);
---

<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
  {properties.map(prop => (
    <PropertyCard property={prop} showBadges={true} />
  ))}
</div>
\`\`\`

## Features

- ✅ Responsive image container (4:3 aspect ratio)
- ✅ Hover zoom effect on image
- ✅ Price badge with gradient
- ✅ Location and time metadata
- ✅ Feature icons (area, bedrooms, bathrooms)
- ✅ Action buttons (compare, share, favorite)
- ✅ Lazy loading images

## Styling

Uses Tailwind CSS classes. Supports dark mode via CSS variables.
```

---

## 5. Design System Documentation

### Color & Typography Documentation
Keep in `docs/design-guidelines.md`:

```markdown
## Design System

### Primary Colors
- **Primary Orange:** #f97316 (buttons, headers, CTAs)
- **Secondary Slate:** #64748b (text, borders)
- **Accent:** #3b82f6 (links, highlights)

### Typography
- **Headings:** Be Vietnam Pro (Vietnamese optimized)
- **Body:** Inter (sans-serif)
- **Monospace:** Fira Code (code blocks)

### Component Tokens
- Button: `px-4 py-2.5 min-h-11 rounded-full font-medium transition-all`
- Card: `bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow`
- Badge: `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium`
```

---

## 6. Current State Analysis

### What's Good ✅
- File names are descriptive and consistent (kebab-case)
- Props interfaces are fully typed
- Components are grouped logically by category
- TypeScript strict mode enforced

### What's Missing ❌
- **No JSDoc comments** on components
- **No component README files** for usage examples
- **Props lack documentation strings** (need `/** */` comments)
- **No Storybook setup** (nice-to-have for scale)

---

## 7. Recommended Implementation Plan

### Phase 1: Add JSDoc Comments (High Priority)
```typescript
// Before
interface Props {
  property: Property;
}

// After
/**
 * PropertyCard - Displays property listing with image, price, and features
 *
 * @example
 * <PropertyCard property={property} />
 */
interface Props {
  /** The property object to display */
  property: Property;
}
```

### Phase 2: Add Component READMEs (Medium Priority)
Create `component-name.md` files for 10-15 most-reused components.

### Phase 3: Document Design System (Low Priority)
Expand `docs/design-guidelines.md` with component tokens and patterns.

---

## Key Takeaways

1. **TypeScript interfaces ARE the primary documentation** - types convey contracts
2. **JSDoc comments enhance readability** - add 1-2 line description + @example
3. **Naming is documentation** - `property-card.astro` > `card.astro`
4. **READMEs needed at scale** - when >20 reusable components exist
5. **No Storybook needed yet** - static site doesn't require interactive component docs

## Unresolved Questions

- Should we establish pattern for testing docs (e.g., test file naming)?
- When should we implement Storybook vs. markdown docs?
- Do we need version/changelog docs for components?
