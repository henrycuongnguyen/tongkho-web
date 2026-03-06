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

## Server-Side Rendering (SSR) Component Patterns [NEW]

### When to Use SSR Components

SSR components fetch data at build time (not runtime) to populate static HTML with fresh database content. Use when:

1. **Data is stable within build window** – Property counts, menu items, listings don't change mid-build
2. **Zero client-side API calls needed** – All data embedded in HTML
3. **SEO-relevant content** – Data should be in source HTML (crawlable)
4. **No real-time updates** – Data doesn't change between builds

### Pattern Example: Location Filter Card

**File:** `components/listing/sidebar/location-filter-card.astro`

```astro
---
/**
 * Location Filter Card - Server-rendered province list with property counts
 *
 * ✅ SSR Benefits:
 *    - Fresh data at every build
 *    - Property counts aggregated from DB
 *    - Zero JavaScript for core functionality
 *    - SEO: All links crawlable
 */

// 1. Parse context from Astro.url (no props needed)
const url = Astro.url;
const currentProvince = url.pathname.split('/')[2];

// 2. Async server function - runs at build time only
import { getAllProvincesWithCount } from '@/services/location/location-service';
let provinces: Province[] = [];
try {
  provinces = await getAllProvincesWithCount(20);
} catch (error) {
  console.error('Failed to load provinces:', error);
}

// 3. Helper functions (pure, no side effects)
function buildProvinceUrl(slug: string): string {
  const searchParams = url.searchParams.toString();
  return `/${transactionType}/${slug}${searchParams ? `?${searchParams}` : ''}`;
}
---

<!-- 4. Render static links (no hydration) -->
<div class="filter-card">
  {provinces.map((prov) => (
    <a
      href={buildProvinceUrl(prov.slug)}
      class:list={[
        'province-link',
        currentProvince === prov.slug && 'active'
      ]}
    >
      <span>{prov.name}</span>
      <span>({prov.propertyCount})</span>
    </a>
  ))}
</div>

<!-- 5. Optional: Client-side enhancement (expand/collapse) -->
<script>
  function initExpand() {
    const btn = document.querySelector('[data-expand]');
    btn?.addEventListener('click', () => {
      // Minimal JS for interactivity
    });
  }
  initExpand();
  document.addEventListener('astro:after-swap', initExpand);
</script>
```

### Structure: Three Phases

| Phase | When | What Runs | Example |
|-------|------|-----------|---------|
| **Server** | Build time | Async functions, DB queries | `getAllProvincesWithCount()` |
| **Render** | Build → HTML | JSX/HTML template, loops | Province links, property counts |
| **Client** | Runtime (optional) | Event listeners, interactivity | Expand/collapse buttons |

### Key Rules

1. **Async functions only in frontmatter:**
   ```astro
   ---
   // ✅ OK - Build time
   const data = await db.query(...);
   ---
   ```

2. **Avoid props for data already in context:**
   ```astro
   <!-- ✅ Parse from URL instead -->
   const slug = new URL(Astro.url).pathname.split('/')[2];

   <!-- ❌ Don't pass as prop if context available -->
   <!-- <Component province={slug} /> -->
   ```

3. **Error handling with fallbacks:**
   ```typescript
   // ✅ Graceful degradation
   let data = [];
   try {
     data = await fetchData();
   } catch (error) {
     console.error('Failed to load:', error);
     // Component renders empty/fallback state
   }
   ```

4. **Query parameter preservation:**
   ```typescript
   // ✅ Maintain filter state when navigating
   const searchParams = url.searchParams.toString();
   const href = `/path?${searchParams}`;
   ```

5. **Minimal optional client script:**
   ```astro
   <script>
     // Only if interactivity needed (expand/collapse, toggle, etc.)
     // Never for navigation or data loading
   </script>
   ```

### Service Layer Pattern

Create typed, reusable service functions:

```typescript
// services/location/location-service.ts
export async function getAllProvincesWithCount(
  limit?: number,
  useNewAddresses = true
): Promise<Province[]> {
  // Type-safe query
  const rows = await db
    .select({
      id: locations.id,
      name: locations.title,
      slug: locations.slug,
      propertyCount: locations.propertyCount,
    })
    .from(locations)
    .limit(limit);

  return rows;
}
```

Component usage is clean:
```astro
---
import { getAllProvincesWithCount } from '@/services/location/location-service';
const provinces = await getAllProvincesWithCount(20);
---
```

### When NOT to Use SSR Components

- ❌ Real-time data (prices, availability changing every minute)
- ❌ User-specific data (requires authentication)
- ❌ High-frequency updates needed mid-build
- → Use client-side React + API instead

### When to Use Client Components Instead

```astro
---
// ❌ This needs client-side fetching
// const realtimeData = await fetch('/api/...');  // Never works at build time
---

<!-- ✅ Use client-side React instead -->
<RealtimeSearch client:load />
```

```typescript
// components/RealtimeSearch.tsx
export function RealtimeSearch() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // This runs in browser
    fetch('/api/search').then(r => r.json()).then(setData);
  }, []);

  return <div>{/* Render data */}</div>;
}
```

---

---

## Recursive Component Patterns

Use recursive components for hierarchical data structures (menus, categories, org charts, trees).

### Astro Self-Recursion Pattern

For unlimited nesting depth without explicit naming. Component calls itself recursively via `Astro.self`.

**File:** `components/header/header-desktop-submenu.astro`

**Pattern:**
```astro
---
import type { NavItem } from '@/types/menu';

interface Props {
  items: NavItem[];
  level?: number;
}

const { items, level = 2 } = Astro.props;
const maxDepth = 10; // Safeguard: prevent infinite recursion
const zIndex = Math.min(70 + (level - 2) * 10, 90); // L2=70, L3=80, L4+=90
---

<div class={`bg-white rounded-xl shadow-xl py-2 min-w-[280px]`} style={`z-index: ${zIndex}`}>
  {items.map((item) => (
    <div class="relative group/submenu">
      <a
        href={item.href}
        class="flex items-center justify-between px-4 py-2.5 hover:bg-primary-50 transition-colors"
        aria-haspopup={item.children ? 'true' : undefined}
        aria-expanded={item.children ? 'false' : undefined}
      >
        <span>{item.label}</span>
        {item.children && item.children.length > 0 && (
          <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </a>
      {item.children && item.children.length > 0 && level < maxDepth && (
        <div
          class="absolute top-0 left-full z-[80] ml-1 opacity-0 invisible group-hover/submenu:opacity-100 group-hover/submenu:visible transition-all duration-200"
          style={`z-index: ${zIndex + 10}`}
        >
          <Astro.self items={item.children} level={level + 1} />
        </div>
      )}
    </div>
  ))}
</div>
```

**Key Points:**
- `Astro.self` – References the current component for recursion
- `level` parameter – Tracks nesting depth, determines z-index
- `maxDepth` safeguard – Stops recursion at depth 10, prevents stack overflow
- `level < maxDepth` condition – Controls when to render children
- Z-index strategy – Each level increments by 10 (capped at 90)
- CSS transitions – Hover state via group-hover (no JavaScript)

**When to Use:**
- Multi-level navigation menus
- Folder hierarchies (files → subfolders → sub-subfolders)
- Product categories (category → subcategory → items)
- Comment threads with nested replies
- Organization charts

---

### React Recursive Component with State

For hierarchical data with expand/collapse state management. Uses path-based keys in Set for O(1) lookups.

**File:** `components/header/header-mobile-menu.tsx`

**Pattern:**
```typescript
import { useState } from 'react';
import type { NavItem } from '@/types/menu';

const MAX_DEPTH = 10;

interface MenuItemProps {
  item: NavItem;
  path: string;
  depth: number;
  expandedPaths: Set<string>;
  toggleExpanded: (path: string) => void;
}

function MenuItem({
  item,
  path,
  depth,
  expandedPaths,
  toggleExpanded,
}: MenuItemProps) {
  // Safeguard: prevent infinite recursion
  if (depth >= MAX_DEPTH) {
    return null;
  }

  const isExpanded = expandedPaths.has(path);
  const hasChildren = item.children && item.children.length > 0;
  const paddingLeft = `${(depth + 1) * 1}rem`; // pl-4 → pl-8 → pl-12

  // Leaf item: no children
  if (!hasChildren) {
    return (
      <a
        href={item.href}
        className="block py-2 text-secondary-600 hover:text-primary-500 transition-colors"
        style={{ paddingLeft }}
      >
        {item.label}
      </a>
    );
  }

  // Parent item: has children, toggleable
  return (
    <>
      <button
        onClick={() => toggleExpanded(path)}
        className="flex items-center justify-between w-full py-2 text-secondary-600 hover:text-primary-500 transition-colors"
        style={{ paddingLeft }}
        aria-expanded={isExpanded}
        aria-haspopup="true"
      >
        <span>{item.label}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded children container */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isExpanded ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        style={{
          maxHeight: isExpanded
            ? `${(item.children?.length || 0) * 48}px`
            : '0',
        }}
      >
        {item.children?.map((child) => (
          <MenuItem
            key={child.href}
            item={child}
            path={`${path}.${child.label}`}
            depth={depth + 1}
            expandedPaths={expandedPaths}
            toggleExpanded={toggleExpanded}
          />
        ))}
      </div>
    </>
  );
}

export default function HeaderMobileMenu({ navItems }: Props) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const toggleExpanded = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path); // Collapse
      } else {
        next.add(path); // Expand
      }
      return next;
    });
  };

  return (
    <div className="mobile-menu">
      {navItems.map((item) => (
        <MenuItem
          key={item.href}
          item={item}
          path={`root.${item.label}`}
          depth={0}
          expandedPaths={expandedPaths}
          toggleExpanded={toggleExpanded}
        />
      ))}
    </div>
  );
}
```

**Key Points:**
- `expandedPaths: Set<string>` – Tracks open menu items (O(1) lookup)
- `path: string` – Unique key: `'root.Mua bán.Căn hộ.Bán'`
- `depth: number` – Increments with recursion, stops at MAX_DEPTH
- `toggleExpanded()` – Adds/removes path from Set on click
- `paddingLeft` – Visual hierarchy via depth × 1rem
- Chevron rotation – 180° on expand (via isExpanded)
- `maxHeight` animation – Smooth expand/collapse (300ms)

**Performance Considerations:**
- Set has O(1) add/remove/lookup operations
- Avoids Array.find() for large hierarchies
- CSS animations (maxHeight, opacity) are GPU-accelerated
- Update only toggleExpanded Set on click (immutable pattern)

**When to Use:**
- Mobile/accordion menus
- Collapsible sections with state
- Threaded comment systems
- Expandable data tables
- Settings panels with collapsible groups

---

## Safeguarding Recursive Components

Always include depth limits and recursion guards:

```typescript
// ❌ BAD - Infinite recursion risk
function UnsafeComponent({ children }) {
  return <div>{children?.map(child => <UnsafeComponent {...child} />)}</div>;
}

// ✅ GOOD - Depth safeguard
function SafeComponent({ children, depth = 0 }) {
  if (depth >= MAX_DEPTH) return null; // Stop recursion
  return (
    <div>
      {children?.map(child => (
        <SafeComponent {...child} depth={depth + 1} />
      ))}
    </div>
  );
}
```

**Safeguarding Checklist:**
- ✅ Define `MAX_DEPTH` constant (typically 10-20)
- ✅ Check `if (depth >= MAX_DEPTH) return null;` before recursion
- ✅ Pass `depth + 1` to child recursive call
- ✅ Validate props (ensure children is array before map)
- ✅ Set key prop on recursive calls (for React list rendering)
- ✅ Test with deep nesting (verify max depth works)
- ✅ Log depth in development (catch unexpected deep trees)

---

## Performance Checklist

- Use `<picture>` elements for responsive images
- Lazy load non-critical images (`loading="lazy"`)
- Minimize inline styles; use Tailwind classes
- Preload critical fonts (Inter, Be Vietnam Pro)
- Never use `<script>` tags (defeats static generation)
- Use CSS containment for large grids (`contain: layout`)
- For HTMX, use `hx-trigger="load once"` to prevent repeated requests
- **[NEW]** SSR components: Fetch at build time, embed in HTML, minimize runtime JS
- **[NEW]** Recursive components: Include depth safeguards, use Set for state lookups

---

## Document Version

- **Version:** 2.3
- **Last Updated:** 2026-03-06
- **Parent:** [Code Standards & Conventions](./code-standards.md)
- **Latest Change:** Added recursive component patterns (Astro self-recursion, React stateful recursion) with safeguarding guidelines
