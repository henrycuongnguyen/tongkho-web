# TypeScript & General Standards

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

## URL Building Pattern (Centralized - DRY Principle)

**Location:** `src/services/url/search-url-builder.ts`

**Rule:** All client-side URL building uses centralized `buildSearchUrl()` function. Never build URLs manually in components.

### Pattern Template

```typescript
// ✅ CORRECT - Reuses buildSearchUrl() for v1 compatibility
import { buildSearchUrl, buildPropertyTypeSlugMap } from '@/services/url/search-url-builder';

// Build property type slug map from DOM checkboxes
const propertyTypeSlugMap = buildPropertyTypeSlugMap();

// Create filters object matching SearchFilters interface
const filters = {
  transaction_type: '1',           // '1'=sale, '2'=rent, '3'=project
  selected_addresses: 'ha-noi',    // Province slug or multi-district (comma-separated, no encoding)
  property_types: '12,13',         // Property type IDs (comma-separated)
  min_price: '1000000000',         // In VND
  max_price: '2000000000',         // In VND
  min_area: '50',                  // Square meters
  max_area: '200',
  bedrooms: '3',
  bathrooms: '2',
  radius: '5',                     // KM for location-based search
};

// Build URL using centralized function
const url = buildSearchUrl(filters, propertyTypeSlugMap);
window.location.href = url;
```

```typescript
// ❌ WRONG - Manual URL building (violation of DRY)
const urlParts = [baseUrl.replace(/^\//, '')];
if (selectedPropertyTypes.length > 0) {
  // Manual slug mapping logic - duplicates buildSearchUrl
  queryParts.push(`property_types=${selectedPropertyTypes.join(',')}`);
}
window.location.href = targetUrl;  // No slug conversion!
```

### Property Type URL Behavior

**Single Property Type:** Uses property type slug in path (v1-compatible)
```
Input:  { property_types: '12', transaction_type: '1' }
Output: /ban-can-ho-chung-cu/ha-noi  ← property type slug in path, no query param
```

**Multiple Property Types:** Uses transaction slug + query param
```
Input:  { property_types: '12,13', transaction_type: '1' }
Output: /mua-ban/ha-noi?property_types=12,13  ← transaction slug, types in param
```

**No Property Type:** Uses transaction slug only
```
Input:  { transaction_type: '1' }
Output: /mua-ban/ha-noi  ← transaction slug only
```

### Used In Components

- `src/components/home/hero-search.astro` - Homepage search bar ✅
- `src/components/listing/horizontal-search-bar.astro` - Listing page search bar ✅

### Why This Matters (DRY Principle)

1. **Single Source of Truth** - All URL logic in one place
2. **Prevents Code Duplication** - No need to reimplement in each component
3. **Easier Maintenance** - Updates to buildSearchUrl() benefit all components
4. **v1 Compatibility** - All edge cases already tested (38 test cases)
5. **Consistency** - All components generate identical URLs for same filters

### Fallback Pattern

If importing buildSearchUrl() is not possible (rare cases), reference its implementation in search-url-builder.ts for consistency checks. Never invent custom URL building logic.

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

## Testing Guidelines (Planned)

When tests are introduced:
- Write unit tests for utilities (format.ts, slugs)
- Write integration tests for component rendering
- Target >80% code coverage
- Use Vitest or similar for Astro testing

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

## Document Version

- **Version:** 2.0
- **Last Updated:** 2026-02-07
- **Parent:** [Code Standards & Conventions](./code-standards.md)
