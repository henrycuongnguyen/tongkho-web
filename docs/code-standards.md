# Code Standards & Conventions

## TypeScript Guidelines

### Strict Mode (REQUIRED)
All files must compile under `tsconfig.json` strict mode:
- No implicit `any` types
- No nullable assignments without `?`
- No `@ts-ignore` comments
- All function parameters typed explicitly

```typescript
// ❌ BAD
const formatPrice = (price) => `${price} tỷ`;

// ✅ GOOD
import type { PriceUnit } from '@/types/property';
const formatPrice = (price: number, unit: PriceUnit): string => {
  return `${price} tỷ`;
};
```

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Constants | SCREAMING_SNAKE_CASE | `MAX_PROPERTY_IMAGES` |
| Variables | camelCase | `propertyCount`, `isAvailable` |
| Functions | camelCase | `formatPrice()`, `generateSlug()` |
| Types/Interfaces | PascalCase | `Property`, `SearchFilters` |
| Enums | PascalCase | `PropertyStatus` |
| Files (component) | kebab-case | `property-card.astro` |
| Files (util/data) | kebab-case | `mock-properties.ts` |
| CSS Classes | kebab-case | `.property-card`, `.btn-primary` |
| Props (React) | camelCase | `itemCount`, `isActive` |

### Type Definitions
Always use explicit types; prefer interfaces over types for objects:

```typescript
// ✅ GOOD - Interface for objects
interface Property {
  id: string;
  title: string;
  price: number;
}

// ✅ GOOD - Type for unions
type PropertyType = 'apartment' | 'house' | 'villa';

// ✅ GOOD - Function types
type PropertyFilter = (p: Property) => boolean;
```

---

## Astro Component Patterns

### File Structure
Each Astro component should follow this pattern:

```astro
---
// 1. Imports (TypeScript, utilities, types)
import type { Property } from '@/types/property';
import { formatPrice } from '@/utils/format';

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

#### Example: SidebarFilterList Pattern
Instead of creating separate `PriceFilter` and `AreaFilter` components:

```typescript
// ❌ BAD - Duplicate components
// src/components/filters/price-filter.astro
// src/components/filters/area-filter.astro
// Both have identical structure, just different labels/data

// ✅ GOOD - Single reusable component with props
interface Props {
  title: string;           // "Giá" vs "Diện tích"
  items: FilterItem[];     // Price ranges vs area ranges
  onSelect?: (item: FilterItem) => void;
  selectedId?: string;
}

export function SidebarFilterList({ title, items, onSelect, selectedId }: Props) {
  return (
    <div class="sidebar-filter">
      <h3 class="filter-title">{title}</h3>
      <ul class="filter-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              class:list={['filter-item', { active: item.id === selectedId }]}
              onClick={() => onSelect?.(item)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Usage in parent component:
```typescript
<SidebarFilterList
  title="Giá"
  items={priceRanges}
  selectedId={selectedPrice}
  onSelect={(item) => setSelectedPrice(item.id)}
/>

<SidebarFilterList
  title="Diện tích"
  items={areaRanges}
  selectedId={selectedArea}
  onSelect={(item) => setSelectedArea(item.id)}
/>
```

### Refactoring Duplicate Components

#### Step 1: Identify Similarities
Compare components side-by-side:

| Aspect | Component A | Component B | Difference? |
|---|---|---|---|
| HTML Structure | List of items | List of items | ✓ Same |
| Props | `items`, `title` | `items`, `title` | ✓ Same |
| Styling | Tailwind grid | Tailwind grid | ✓ Same |
| Behavior | Click handler | Click handler | ✓ Same |

#### Step 2: Extract Common Props Interface
```typescript
// ✅ Shared interface
interface FilterListProps<T> {
  title: string;
  items: T[];
  onItemClick?: (item: T) => void;
  getLabel: (item: T) => string;
  getId: (item: T) => string;
  isSelected?: (item: T) => boolean;
}
```

#### Step 3: Create Single Reusable Component
```typescript
export function FilterList<T>({
  title,
  items,
  onItemClick,
  getLabel,
  getId,
  isSelected,
}: FilterListProps<T>) {
  return (
    <div class="filter-list">
      <h3 class="filter-title">{title}</h3>
      <ul class="filter-items">
        {items.map((item) => (
          <li key={getId(item)}>
            <button
              class:list={[
                'filter-item',
                { active: isSelected?.(item) },
              ]}
              onClick={() => onItemClick?.(item)}
            >
              {getLabel(item)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### Step 4: Delete Old Components
Remove duplicate component files after verifying all usages have been updated.

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

### Component Checklist Before Implementation

- [ ] Searched existing components for similar patterns
- [ ] Checked if variant props could solve the problem
- [ ] Verified props and data structure compatibility
- [ ] Documented reusable props interface
- [ ] Removed any duplicate components
- [ ] Updated all usages of old components
- [ ] Tested new component with multiple data sets

---

## Data Structure Patterns

### Data Organization in src/data/ [Phase 3]

**Separation of concerns:**
- `mock-properties.ts` – Dynamic property/project/news data (for rendering sections)
- `menu-data.ts` – Build-time database menu generation (nav items)
- `static-data.ts` – Static UI filter options (cities, property types, prices, areas)

**Static Data Organization (static-data.ts)**
Store immutable UI dropdown options in `src/data/static-data.ts`:

```typescript
// ✅ GOOD - Static filter options
export const cities = [
  { value: 'ha-noi', label: 'Hà Nội' },
  { value: 'ho-chi-minh', label: 'TP. Hồ Chí Minh' },
];

export const propertyTypes = [
  { value: 'can-ho', label: 'Căn hộ chung cư' },
  { value: 'nha-rieng', label: 'Nhà riêng' },
];

export const priceRanges = [
  { value: '0-500', label: 'Dưới 500 triệu' },
  { value: '500-1000', label: '500 triệu - 1 tỷ' },
];
```

**Usage:** Imported by filter components (hero-search.tsx, etc.)

### Mock Data Organization
Store mock data in `src/data/` with clear exports:

```typescript
// ✅ GOOD
export const mockProperties: Property[] = [
  {
    id: 'prop-001',
    title: 'Căn hộ cao cấp tại Hà Nội',
    // ... required fields
  },
];

export const getFeaturedProperties = (): Property[] =>
  mockProperties.filter((p) => p.isFeatured);
```

### Filtering & Searching
Implement filters as pure functions:

```typescript
const filterByCity = (props: Property[], city: string): Property[] =>
  props.filter((p) => p.city === city);

const filterByPrice = (
  props: Property[],
  min: number,
  max: number
): Property[] => props.filter((p) => p.price >= min && p.price <= max);
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

## Vietnamese Localization

### Currency & Numbers
Always use `formatPrice()` and `formatNumber()` from `@utils/format`:

```typescript
import { formatPrice, formatNumber } from '@utils/format';

// Property listing: 5.5 tỷ
const display = formatPrice(5500, 'billion');

// Number display: 1.500.000
const count = formatNumber(1500000);
```

### Date Formatting
Use Vietnamese date format via `formatDate()`:

```typescript
import { formatDate, formatRelativeTime } from '@utils/format';

// "28 tháng 1 năm 2026"
const created = formatDate('2026-01-28');

// "2 ngày trước", "Hôm qua", "1 tuần trước"
const relative = formatRelativeTime('2026-01-26');
```

### URL Slugs
Always use `generateSlug()` for Vietnamese text:

```typescript
import { generateSlug } from '@utils/format';

// "Căn hộ cao cấp tại Hà Nội" → "can-ho-cao-cap-tai-ha-noi"
const slug = generateSlug('Căn hộ cao cấp tại Hà Nội');
```

### Vietnamese Content
- Use proper Vietnamese terminology (mua bán, cho thuê, dự án)
- Store Vietnamese text in data files (header-nav-data.ts)
- Use Vietnamese punctuation (không dash nên comma)

---

## File Size Limits

| File Type | Max LOC | Rationale |
|---|---|---|
| Component | 150 | Cognitive load, reusability |
| Utility function | 50 | Single responsibility |
| Data file | 300 | Mock data consolidation |
| Page layout | 100 | Composition > nesting |
| Type definitions | 100 | Clarity, maintenance |

**Refactor strategy:** If a file exceeds limits, split into:
- Smaller components (composition pattern)
- Utility functions in separate modules
- Data aggregation via imports

---

## Import Organization

```typescript
// 1. Astro/React imports
import type { ReactNode } from 'react';

// 2. Type imports
import type { Property, SearchFilters } from '@/types/property';

// 3. Component imports
import { PropertyCard } from '@components/cards/property-card';

// 4. Utility/data imports
import { formatPrice } from '@utils/format';
import { mockProperties } from '@data/mock-properties';

// 5. Local styles (Astro only)
// <style> block at end of file
```

---

## Error Handling

### Null Checks & Guards
Always validate data before use:

```typescript
// ✅ GOOD - Guard clause
function renderProperty(property: Property | null): string {
  if (!property) return 'Property not found';
  return property.title;
}

// ✅ GOOD - Optional chaining
const bedrooms = property?.bedrooms ?? 0;

// ❌ BAD - Unsafe access
const title = property.title; // Could be undefined
```

### Type Safety
Leverage TypeScript for data validation:

```typescript
// ✅ GOOD - Type guard function
function isProperty(obj: unknown): obj is Property {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'price' in obj
  );
}

if (isProperty(data)) {
  // data is now typed as Property
}
```

---

## Testing Guidelines (Planned)

When tests are introduced:
- Write unit tests for utilities (format.ts, slugs)
- Write integration tests for component rendering
- Target >80% code coverage
- Use Vitest or similar for Astro testing

---

## Database & Service Layer Standards [Phase 1]

### Service Layer Architecture
Services encapsulate business logic and database access:

```typescript
// src/services/menu-service.ts pattern
export async function buildMenuStructure(): Promise<MenuStructure> {
  return getCached('menu_structure', async () => {
    // Fetch from DB
    // Transform to domain models
    // Return typed structure
  }, cacheTTL);
}
```

**Rules:**
- One responsibility per service file
- Use interfaces for input/output types (MenuStructure, MenuPropertyType)
- Implement caching for build-time performance
- Graceful error handling with fallback data
- Console logging for debugging (cache hits/misses, errors)

### Drizzle ORM Schema Guidelines
Schemas define database table structure:

```typescript
// src/db/schema/menu.ts pattern
export const propertyType = pgTable('property_type', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 512 }),
  transactionType: integer('transaction_type'),
  aactive: boolean('aactive').default(true),
});

export type PropertyTypeRow = typeof propertyType.$inferSelect;
```

**Rules:**
- Column names match database (snake_case)
- Types match PostgreSQL types (varchar, integer, boolean)
- Export inferred types for TypeScript safety
- Use `.default()` for common defaults
- Document V1 table mappings in comments

### Database Client Usage
```typescript
// src/db/index.ts pattern
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = import.meta.env.DATABASE_URL || process.env.DATABASE_URL;
const client = postgres(connectionString, {
  max: 10,
  connect_timeout: 10,  // 10 seconds connection timeout
  idle_timeout: 30,     // 30 seconds idle timeout
});
export const db = drizzle(client, { schema });
```

**Rules:**
- Use DATABASE_URL environment variable (via `import.meta.env` or `process.env`)
- Connection pooling (max: 10 connections)
- Set reasonable timeouts (10s connect, 30s idle)
- Export single db instance for import throughout app
- Handle connection errors gracefully during build

### Environment Variables [Phase 2]
Environment variables must be loaded at build time for data generation:

```typescript
// astro.config.mjs pattern
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), '');
```

**Rules:**
- Load DATABASE_URL before building menu data
- Never expose to client bundle (security risk)
- Fallback gracefully if variable missing
- Log missing variables for troubleshooting
- Do NOT commit `.env` files; use `.env.example`

**Typical .env contents:**
```
DATABASE_URL=postgresql://user:password@localhost:5432/tongkho
NODE_ENV=development
```

**Security:**
- DATABASE_URL contains credentials → keep it secret
- Use `import.meta.env` safely (NOT exposed to client)
- Never log full connection strings
- Use connection pooling to limit active connections

### Database Queries in Services
```typescript
// Query pattern with type safety
const result = await db
  .select({
    id: propertyType.id,
    title: propertyType.title,
  })
  .from(propertyType)
  .where(and(
    eq(propertyType.aactive, true),
    eq(propertyType.transactionType, 1)
  ));
```

**Rules:**
- Explicitly select needed columns (no SELECT *)
- Use `and()`, `eq()`, `isNull()` from drizzle-orm
- Always filter by `aactive=true` (V1 soft-delete pattern)
- Use `.orderBy()` for consistent results
- Wrap in try-catch with error logging

### Caching Strategy (Build-Time)
```typescript
const cache = new Map<string, MenuCacheEntry<unknown>>();

function getCached<T>(
  key: string,
  compute: () => Promise<T>,
  ttl: number
): Promise<T> {
  const cached = cache.get(key);
  if (cached && !isExpired(cached)) return cached.data;
  return compute().then(data => {
    cache.set(key, { data, timestamp: Date.now(), ttl });
    return data;
  });
}
```

**Rules:**
- Cache only at build time (no runtime caching)
- 1-hour TTL (3600000ms) default for menu data
- Use string keys that describe the cache entry
- Log cache hits/misses for debugging
- Provide manual `clearMenuCache()` function

### Recursive Data Structures [Phase 4]
For hierarchical data (e.g., nested news folders), use recursive type definitions:

```typescript
// MenuFolder with optional nested children
interface MenuFolder {
  id: number;
  parent: number | null;
  name: string | null;
  label: string | null;
  publish: string; // 'T' = published
  displayOrder: number | null;
  subFolders?: MenuFolder[];  // Recursive property for children
}

// Transformation function that recursively maps hierarchy
function folderToNavItem(folder: MenuFolder): NavItem {
  const navItem: NavItem = {
    label: folder.label || folder.name || "",
    href: `/tin-tuc/danh-muc/${folder.name}`,
  };

  // Recursively transform sub-folders
  if (folder.subFolders && folder.subFolders.length > 0) {
    navItem.children = folder.subFolders.map(folderToNavItem);
  }

  return navItem;
}
```

**Rules:**
- Use optional `?` for recursive properties to indicate tree leaves
- Provide separate fetch functions for parent and child data if needed
- Transform hierarchies recursively to match expected output format
- Set limits on depth if necessary (e.g., max 5 levels)

## Performance Checklist

- Use `<picture>` elements for responsive images
- Lazy load non-critical images (`loading="lazy"`)
- Minimize inline styles; use Tailwind classes
- Preload critical fonts (Inter, Be Vietnam Pro)
- Never use `<script>` tags (defeats static generation)
- Use CSS containment for large grids (`contain: layout`)
- **Database:** Ensure queries have indexes on filtered columns (transaction_type, parent, display_order)
- **Services:** Implement caching for repeated data fetches during build
- **Schemas:** Use explicit column selection in queries (no SELECT *)

---

## Git & Commit Conventions

### Branch Naming
```
feature/property-search
fix/mobile-header-layout
docs/update-readme
```

### Commit Messages
```
feat: Add property search filter component
fix: Correct price formatting for billion range
docs: Update deployment guide
style: Format header component
refactor: Extract filtering logic to utils
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

## Document History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-01-28 | Initial code standards documentation |
| 1.1 | 2026-01-30 | Add Component Documentation Standards section with JSDoc templates |
| 1.2 | 2026-02-05 | Add Image Guidelines section for Astro image optimization |
| 1.3 | 2026-02-06 | Phase 1: Add Database & Service Layer standards (Drizzle ORM, menu service, caching, V1 soft-delete pattern) |
| 1.4 | 2026-02-06 | Phase 2: Add Environment Variable handling, connection timeouts, build-time data loading security |
| 1.5 | 2026-02-06 | Phase 3: Add static-data.ts pattern for UI filter options; document separation of concerns (mock-data vs menu-data vs static-data) |
| 1.6 | 2026-02-06 | Phase 4: Add Recursive Data Structures guidelines for hierarchical data patterns; document folderToNavItem() recursive transformation pattern |
