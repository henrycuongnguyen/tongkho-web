# Database & Service Layer Standards

## Service Layer Architecture

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

---

## Drizzle ORM Schema Guidelines

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

---

## Database Client Usage

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

---

## Environment Variables

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

---

## Database Queries in Services

### Standard Query Pattern

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
  ))
  .orderBy(propertyType.title);
```

**Rules:**
- Explicitly select needed columns (no SELECT *)
- Use `and()`, `eq()`, `isNull()` from drizzle-orm
- Always filter by `aactive=true` (V1 soft-delete pattern)
- Use `.orderBy()` for consistent results
- Wrap in try-catch with error logging

### V1-Aligned Soft-Delete Pattern

**CRITICAL:** Never hard-DELETE records. Instead:

```typescript
// ✅ CORRECT: Soft delete (V1 convention)
await db.update(realEstate)
  .set({ aactive: false })
  .where(eq(realEstate.id, propertyId));

// ❌ WRONG: Hard delete (violates audit trail)
await db.delete(realEstate)
  .where(eq(realEstate.id, propertyId));

// ✅ CORRECT: Always filter active records
const active = await db.select()
  .from(realEstate)
  .where(eq(realEstate.aactive, true));

// ❌ WRONG: Missing aactive filter
const all = await db.select()
  .from(realEstate); // May include deleted records!
```

### Status Enum Pattern (V1)

Real estate and transactions use integer status enums:

```typescript
// status codes from V1 schema
const PROPERTY_STATUS = {
  DRAFT: 1,      // Not published
  ACTIVE: 2,     // Listed
  SOLD: 3,       // Transaction completed
  RENTED: 4,     // Leased
  INACTIVE: 5,   // Deactivated
} as const;

const TRANSACTION_STATUS = {
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
  IN_RECONCILIATION: 4,
  COMPLETED: 5,
} as const;

// Enforce via CHECK constraint in schema:
// CHECK (status IN (1, 2, 3, 4, 5))
```

### Hierarchical Data Queries

For parent-child relationships (property types, news folders, office hierarchy):

```typescript
// Fetch with parent reference
const folders = await db.select()
  .from(folder)
  .where(and(
    eq(folder.parent, null),  // Only top-level folders
    eq(folder.aactive, true)
  ))
  .orderBy(folder.displayOrder);

// Recursively fetch children
async function getFolderWithChildren(parentId: number) {
  const parent = await db.select()
    .from(folder)
    .where(eq(folder.id, parentId));

  const children = await db.select()
    .from(folder)
    .where(and(
      eq(folder.parent, parentId),
      eq(folder.aactive, true)
    ));

  return {
    ...parent[0],
    subFolders: children,
  };
}
```

---

## Caching Strategy (Build-Time)

### In-Memory Cache Pattern (V1-Aligned)

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
- 1-hour TTL (3600000ms) default for menu/property data
- Use string keys that describe the cache entry (e.g., `property_type_1`, `folder_123`)
- Log cache hits/misses for debugging
- Provide manual `clearMenuCache()` function
- **V1 Alignment:** In-memory cache matches V1 RAM-cache strategy (24h TTL in V1 → 1h in build-time)

### Multi-Layer Caching (V1 Reference Pattern)

V1 ResaLand uses browser → RAM → database → API caching strategy:
- **Browser Cache:** Static assets via HTTP cache headers (1-year TTL)
- **Build-Time RAM:** Menu data cached during build (1 hour TTL)
- **Future:** Redis for multi-server scaling (when scaling beyond single-server builds)

**Migration Path:**
```typescript
// Phase 2-3: Redis integration for distributed builds
import { createClient } from 'redis';

const redis = createClient({ url: process.env.REDIS_URL });
const CACHE_TTL = 3600; // 1 hour

// Falls back to in-memory if Redis unavailable
async function getCachedRedis<T>(
  key: string,
  compute: () => Promise<T>
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } catch (e) {
    console.warn('Redis unavailable, using in-memory cache');
  }

  const data = await compute();
  await redis.setex(key, CACHE_TTL, JSON.stringify(data));
  return data;
}
```

---

## Multi-Source Fallback Pattern (SEO Services - Phase 5)

For critical features that require high availability, implement multi-source fallback pattern:

```typescript
// seo-metadata-service.ts pattern
export async function getSeoMetadata(slug: string): Promise<SeoMetadata> {
  // 1. Try primary source (ElasticSearch)
  let result = await searchSeoMetadata({ slug });

  // 2. Fallback to secondary source (PostgreSQL)
  if (!result) {
    result = await getSeoMetadataFromDb(slug);
  }

  // 3. Fallback to tertiary source (Default)
  if (!result) {
    result = await getDefaultSeoMetadata();
  }

  // 4. Format and return (never null)
  return formatSeoMetadata(result);
}
```

**Benefits:**
- Search features unaffected by ElasticSearch outages
- Database query fallback for consistency
- Default values ensure graceful degradation
- Proper error logging at each layer

**Implementation Rules:**
- Each layer should be independent (no cascade failures)
- Log at WARN level when falling back to next layer
- Return typed result (never null) to prevent downstream errors
- Handle serialization (JSON.parse for ES, case mapping for DB)
- Validate input (sanitize slugs to prevent injection)

**Example: SEO Metadata Flow**
```typescript
// ElasticSearch layer - validates & sanitizes
async function searchSeoMetadata(options: SeoMetadataSearchOptions): Promise<SeoMetadataResult | null> {
  const sanitized = sanitizeSlug(options.slug);  // Only a-z, 0-9, -, /, _
  if (!sanitized) return null;

  // Query with exact match + is_active filter
  const hits = await es.search({
    query: { bool: { must: [
      { term: { slug } },
      { term: { is_active: true } }
    ]}}
  });

  return hits.length > 0 ? parseSeoHit(hits[0]._source) : null;
}

// Database layer - Drizzle ORM
async function getSeoMetadataFromDb(slug: string): Promise<SeoMetadataResult | null> {
  const result = await db
    .select()
    .from(seoMetaData)
    .where(and(
      eq(seoMetaData.slug, slug),
      eq(seoMetaData.isActive, true)
    ))
    .limit(1);

  return result.length > 0 ? mapDbRecordToResult(result[0]) : null;
}

// Default layer - hardcoded or from database
async function getDefaultSeoMetadata(): Promise<SeoMetadataResult | null> {
  return getSeoMetadataFromDb('/default/');  // Reuse DB layer
}
```

**Environment Config:**
```typescript
const ES_URL = import.meta.env.ES_URL || process.env.ES_URL || '';
const ES_API_KEY = import.meta.env.ES_API_KEY || process.env.ES_API_KEY || '';

// If either is missing, ES layer returns null immediately
if (!ES_URL || !ES_API_KEY) {
  console.warn('[Service] ElasticSearch not configured, will use database');
}
```

---

## Recursive Data Structures

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

---

## Database Services

Services encapsulate complex data fetching and transformation:

```typescript
// src/services/elasticsearch-property-service.ts
export async function searchProperties(filters: SearchFilters): Promise<Property[]> {
  // ApiKey auth to Elasticsearch
  // Parse prices and handle image URLs from CDN
  // Return typed Property[] results
}

// src/services/postgres-property-service.ts
export async function getPropertyDetail(slug: string): Promise<Property | null> {
  // Drizzle ORM query with proper indexing
  // Fetch related properties for sidebar
  // Handle NULL cases gracefully
}

// src/services/menu-service.ts
export async function buildMenuStructure(): Promise<MenuStructure> {
  // In-memory cache with TTL
  // Hierarchical folder fetching with recursion
  // Fallback to static menu if DB unavailable
}
```

**Rules:**
- One responsibility per service (don't mix search + detail queries)
- Use interfaces for input (filters) and output (typed results)
- Implement error handling with try-catch
- Log cache hits/misses and data fetching duration
- Return graceful fallbacks (empty arrays, null, defaults)

---

## Data Structure Patterns

### Data Organization in src/data/

**Separation of concerns:**
- `mock-properties.ts` – Dynamic property/project/news data (for rendering sections)
- `menu-data.ts` – Build-time database menu generation (nav items)
- `static-data.ts` – Static UI filter options (cities, property types, prices, areas)

### Static Data Organization

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

## Document Version

- **Version:** 2.0
- **Last Updated:** 2026-02-07
- **Parent:** [Code Standards & Conventions](./code-standards.md)
