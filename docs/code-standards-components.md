# Component Patterns

## Astro Component Patterns

### File Structure
Each Astro component should follow this pattern:

```astro
---
// 1. Imports (TypeScript, utilities, types)
import type { Property } from '@/types/property';
import { formatPrice } from '@utils/format';

// 2. Props definition
interface Props {
  properties: Property[];
  maxItems?: number;
}

// 3. Component logic
const { properties, maxItems = 6 } = Astro.props;
const items = maxItems ? properties.slice(0, maxItems) : properties;
---

<!-- 4. HTML template -->
<section class="properties-grid">
  {items.map((prop) => (
    <div class="property-card">
      <h3>{prop.title}</h3>
      <p>{formatPrice(prop.price, prop.priceUnit)}</p>
    </div>
  ))}
</section>

<!-- 5. Scoped styles (optional) -->
<style>
  .properties-grid {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4;
  }
</style>
```

### Component Naming
- Descriptive names: `property-card.astro`, NOT `card.astro`
- One component per file (prefer small, focused files)
- Group related components in subdirectories (`cards/`, `sections/`, `header/`)

### Props Best Practices
```typescript
// ✅ GOOD - Use interfaces for prop validation
interface Props {
  title: string;
  price: number;
  isHot?: boolean;  // Optional with ?
  images: string[];
}

// ✅ GOOD - Destructure with defaults
const { title, price, isHot = false, images } = Astro.props;

// ❌ BAD - Loose prop passing
const props: any = Astro.props;
```

---

## React Component Patterns

### Functional Components Only
All React components must be functional components with TypeScript:

```typescript
import type { ReactNode } from 'react';

interface HeroSearchProps {
  onSearch?: (filters: SearchFilters) => void;
}

export function HeroSearch({ onSearch }: HeroSearchProps): ReactNode {
  return (
    <form>
      {/* Component JSX */}
    </form>
  );
}
```

### Client Components in Astro
Mark interactive React components with `client:` directive:

```astro
---
import { HeroSearch } from '@components/home/hero-search';
---

<!-- Only re-render in browser (hydration) -->
<HeroSearch client:load />
```

### Hooks Best Practices
```typescript
// ✅ GOOD - Custom hook for reusable logic
function useSearchFilters() {
  const [filters, setFilters] = useState<SearchFilters>({
    transactionType: 'sale',
  });
  return { filters, setFilters };
}

// ❌ BAD - Complex state without abstraction
const [a, setA] = useState();
const [b, setB] = useState();
const [c, setC] = useState();
```

---

## Component Documentation Standards

### JSDoc for Astro Components

Every Astro component MUST have a JSDoc header with:
- Brief description (1 line)
- `@example` showing basic usage
- `@prop` for each prop with type and purpose

**Template:**
```astro
---
/**
 * ComponentName - Brief description of what this component does
 *
 * @example
 * <ComponentName requiredProp="value" />
 *
 * @prop requiredProp - Description of required prop
 * @prop optionalProp - Description (optional, default: value)
 */
interface Props {
  /** Inline description for IDE tooltips */
  requiredProp: string;
  /** Optional prop with default */
  optionalProp?: boolean;
}

const { requiredProp, optionalProp = false } = Astro.props;
---
```

**Reference Example:** See `src/components/ui/share-buttons.astro` for a well-documented component with variant props.

### JSDoc for React Components

```typescript
/**
 * ComponentName - Brief description
 *
 * @example
 * <ComponentName onAction={handleAction} />
 */
interface ComponentNameProps {
  /** Callback when action occurs */
  onAction?: (value: string) => void;
}

export function ComponentName({ onAction }: ComponentNameProps) {
  // ...
}
```

### Props Interface Comments

Add inline `/** */` comments for complex props:

```typescript
interface Props {
  /** The property data object to display */
  property: Property;

  /** Visual variant: 'primary' | 'secondary' | 'ghost' */
  variant?: 'primary' | 'secondary' | 'ghost';

  /** Size preset affecting padding and font */
  size?: 'sm' | 'md' | 'lg';
}
```

---

## Component Reusability (DRY Principle)

### Before Creating New Components
**ALWAYS check existing components before creating new ones.** This is critical to maintaining a clean, maintainable codebase.

#### Discovery Checklist (MANDATORY)
Before implementing a new component, verify:

1. **Search existing components:**
   ```bash
   # Search by name pattern
   ls src/components/**/*.astro | grep -i "keyword"

   # Search by functionality in file contents
   grep -r "similar-feature" src/components/
   ```

2. **Check for parameterization opportunity:**
   - Can existing component accept variant prop?
   - Can existing component accept different data via props?
   - Reference: `share-buttons.astro` uses `variant` and `size` props

3. **Analyze structure similarity:**
   | Aspect | Existing | New | Same? |
   |--------|----------|-----|-------|
   | HTML structure | | | |
   | Props shape | | | |
   | Styling pattern | | | |
   | Behavior | | | |

4. **Decision matrix:**
   - >80% similar structure → **Extend existing component**
   - Different structure, same data → **Composition pattern**
   - Fundamentally different → **Create new component**

5. **Document decision:**
   - If extending: Note which component and what props added
   - If creating new: Note why existing components insufficient

### Variant Props vs Multiple Components

**Use variant props when:**
- Components differ only in styling (colors, sizes)
- Behavior is identical
- Same data structure

```typescript
interface Props {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
}

export function Button({ variant = 'primary', size = 'md' }: Props) {
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

  return (
    <button class={`${variantStyles[variant]} ${sizeStyles[size]}`}>
      {/* Content */}
    </button>
  );
}
```

**Create separate components when:**
- Structure is fundamentally different
- Props are incompatible
- Use cases are unrelated

### Composition Over Duplication

Combine smaller, focused components to create complex layouts:

```typescript
// ✅ Good composition
export function PropertyFilters() {
  return (
    <div class="filters">
      <FilterList title="Loại" items={propertyTypes} />
      <FilterList title="Giá" items={priceRanges} />
      <FilterList title="Diện tích" items={areaRanges} />
    </div>
  );
}
```

Not:
```typescript
// ❌ Bad - Separate components for same pattern
<PropertyTypeFilter />
<PriceFilter />
<AreaFilter />
```

---

## Styling Conventions

### Tailwind-First Approach
Prefer Tailwind utility classes over custom CSS:

```astro
<!-- ✅ GOOD - Tailwind utilities -->
<div class="flex items-center justify-between p-4 bg-primary-500 rounded-lg">
  <h2 class="text-2xl font-bold text-white">Properties</h2>
  <button class="px-4 py-2 bg-secondary-600 text-white rounded">
    View All
  </button>
</div>

<!-- ❌ BAD - Custom CSS when Tailwind exists -->
<style>
  .header {
    display: flex;
    padding: 20px;
    background-color: custom-color;
  }
</style>
```

### Custom CSS (When Necessary)
Use `<style>` in Astro components for scoped, non-reusable styles:

```astro
<style>
  /* Scoped to this component only */
  .property-grid {
    @apply grid grid-cols-1 md:grid-cols-3 gap-4;
  }

  /* Media query with @apply */
  @media (min-width: 768px) {
    .property-item {
      @apply hover:shadow-lg transition-shadow;
    }
  }
</style>
```

### Color Usage
```typescript
// ✅ Use defined Tailwind colors
<div class="bg-primary-500 text-secondary-900">Primary theme</div>

// ❌ Avoid arbitrary hex codes
<div style={{ backgroundColor: '#f97316' }}>Bad practice</div>
```

### Responsive Design
Mobile-first with Tailwind breakpoints:
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

```astro
<!-- ✅ GOOD - Mobile first, then desktop -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  <!-- Single column on mobile, 2 on tablet, 3 on desktop -->
</div>
```

---

## Image Guidelines

### Asset Organization

Store images in `src/assets/images/` organized by semantic category:

```
src/assets/images/
├── branding/      # Logos, brand assets
├── hero/          # Hero section backgrounds
├── partners/      # Partner/developer logos
├── download-app/  # App download section assets
├── auth/          # Authentication modal images
└── placeholders/  # Fallback images
```

**Exception:** SVGs used as external link badges (e.g., BCT certification) may stay in `public/` for direct URL access.

### Component Selection

| Scenario | Component | Example |
|----------|-----------|---------|
| Local image, static | `<Image />` | Logo, hero background |
| Data-driven images | `<Image />` with `ImageMetadata` | Partner logos |
| External/CDN URL | `<Image />` with dimensions | Property thumbnails from API |
| SVG icon | Native `<img>` or `?raw` import | UI icons, badges |
| CSS background | Native CSS | Decorative patterns |

### Import Patterns

**Static imports (recommended):**
```astro
---
import { Image } from 'astro:assets';
import logo from '@/assets/images/branding/logo.webp';
---

<Image src={logo} alt="TongkhoBDS" class="h-10" />
```

**Data-driven imports:**
```typescript
// src/data/partners.ts
import type { ImageMetadata } from 'astro';
import vinhomesLogo from '@/assets/images/partners/vinhomes.webp';

export interface Partner {
  image: ImageMetadata; // Not string
}
```

### Remote Images

For external URLs (future CDN integration):

```astro
<Image
  src="https://api.tongkhobds.com/images/property.jpg"
  alt="Property"
  width={800}
  height={600}
/>
```

**Required:** Configure `image.remotePatterns` in `astro.config.mjs` before using.

### Best Practices

- Always provide descriptive `alt` text in Vietnamese
- Use `loading="lazy"` for below-fold images
- Prefer WebP source format (re-optimized by Astro)
- Use `class` for sizing, let Astro infer dimensions from import

---

## HTMX Integration Patterns

When using HTMX for dynamic content loading, follow these best practices:

### Trigger Patterns

**Load Only Once (Static Content)**
```html
<!-- ✅ CORRECT - Load districts on page load, then stop -->
<div
  data-district-panel
  hx-get="/api/location/districts?province=1"
  hx-trigger="load once"
  hx-swap="innerHTML"
>
  Loading...
</div>
```

**Load Repeatedly (Dynamic Content)**
```html
<!-- ✅ CORRECT - Refresh on user action -->
<div
  data-notifications
  hx-get="/api/notifications"
  hx-trigger="click, every 5s"
  hx-swap="innerHTML"
>
  Notifications
</div>
```

### Anti-Pattern: Infinite Requests
```html
<!-- ❌ WRONG - Loads every page load, can cause infinite requests -->
<div
  hx-get="/api/districts"
  hx-trigger="load"
>
  Never use bare "load" for static content
</div>
```

**When to use `load once`:**
- Initial page load content (districts for selected province)
- Hierarchical data that changes only on user action
- API calls that should execute only once during component lifetime

**Reference:** See `src/components/listing/sidebar/location-selector.astro` (line 87) for correct pattern.

---

## Performance Checklist

- Use `<picture>` elements for responsive images
- Lazy load non-critical images (`loading="lazy"`)
- Minimize inline styles; use Tailwind classes
- Preload critical fonts (Inter, Be Vietnam Pro)
- Never use `<script>` tags (defeats static generation)
- Use CSS containment for large grids (`contain: layout`)
- For HTMX, use `hx-trigger="load once"` to prevent repeated requests

---

## Document Version

- **Version:** 2.1
- **Last Updated:** 2026-02-08
- **Parent:** [Code Standards & Conventions](./code-standards.md)
- **Latest Change:** Added HTMX trigger patterns and load once best practices
