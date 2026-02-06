# Astro SSG + Database Integration Research Report
**Date:** 2026-02-06
**Focus:** PostgreSQL queries during Astro build-time, SSG patterns, caching strategies
**Project:** Tongkho-Web (Astro 5.2 + Drizzle ORM + PostgreSQL)

---

## Executive Summary

Astro SSG with database integration is fully viable and well-established. The project (tongkho-web) already implements best practices using:
- **Drizzle ORM** for type-safe PostgreSQL queries
- **Top-level `await`** in `.astro` component frontmatter for build-time data fetching
- **Dynamic routes** with `[slug].astro` patterns for detail pages
- **Parallel queries** via `Promise.all()` for performance

Current implementation is **production-ready**. Recommendations focus on optimization for large menu structures and caching strategies.

---

## 1. Fetching Data from PostgreSQL During Build Time

### Current Implementation (Project Status)

The project successfully fetches PostgreSQL data at build time via Drizzle ORM:

```typescript
// src/services/postgres-news-project-service.ts
export async function getLatestNews(limit: number = 8): Promise<NewsArticle[]> {
  const result = await db
    .select()
    .from(news)
    .where(
      and(
        eq(news.aactive, true),
        inArray(news.folder, NEWS_FOLDERS),
        isNotNull(news.avatar),
        ne(news.avatar, '')
      )
    )
    .orderBy(sql`${news.publishOn} DESC NULLS LAST`, desc(news.id))
    .limit(limit);

  return result.map((row) => mapToNewsArticle(row));
}
```

```typescript
// src/db/index.ts - Database connection
const client = postgres(connectionString, { max: 10 });
export const db = drizzle(client, { schema });
```

### How It Works

1. **Connection at build time:** `postgres` client connects via `DATABASE_URL` env variable
2. **Drizzle ORM queries:** Type-safe SQL generation and execution
3. **Top-level await:** In `.astro` frontmatter, queries execute sequentially or in parallel
4. **Static output:** Fetched data is hardcoded into generated HTML

**Example from homepage:**
```astro
// src/pages/index.astro
const [propertiesForSale, propertiesForRent, featuredProjects, latestNews] =
  await Promise.all([
    elasticsearchPropertyService.searchProperties('sale', 8),
    elasticsearchPropertyService.searchProperties('rent', 8),
    getFeaturedProjects(5),
    getLatestNews(8),
  ]);
```

### Key Pattern: Server-Only Services

The project isolates database queries in **service layer**:
- `postgres-property-service.ts` - Real estate queries
- `postgres-news-project-service.ts` - News/project queries
- `elasticsearch-property-service.ts` - Search queries (fallback)

This separation ensures:
- No accidental client-side data exposure
- Reusable query logic across pages
- Easy testing and mocking

---

## 2. Patterns for Generating Static Pages with Database Data

### Pattern A: Single Item Detail Pages

**File:** `src/pages/tin-tuc/[slug].astro` (News articles)

```astro
---
// Dynamic route with slug parameter
const { slug } = Astro.params;

// Fetch article and related content from PostgreSQL
const [article, allNews] = await Promise.all([
  slug ? getNewsBySlug(slug) : null,
  getLatestNews(20),
]);

if (!article) {
  return Astro.redirect('/404');
}
---

<MainLayout
  title={`${article.title} | TongkhoBDS`}
  description={article.excerpt}
>
  <!-- Render static article content -->
</MainLayout>
```

**Pattern Details:**
- Uses `Astro.params` to access URL parameters
- Fetches single item by slug from PostgreSQL
- Falls back gracefully (404 redirect)
- All data is baked into static HTML

### Pattern B: Homepage with Multiple Data Sources

**File:** `src/pages/index.astro`

```astro
---
// Parallel fetching for performance
const [
  propertiesForSale,
  propertiesForRent,
  featuredProjects,
  latestNews
] = await Promise.all([
  elasticsearchPropertyService.searchProperties('sale', 8),
  elasticsearchPropertyService.searchProperties('rent', 8),
  getFeaturedProjects(5),
  getLatestNews(8),
]);

// SSR enabled for this page (fetch fresh data on each request)
export const prerender = false;
---
```

**Pattern Details:**
- Multiple async queries via `Promise.all()`
- Set `prerender = false` for SSR (server-rendered on each request)
- Mix of static and dynamic content possible

### Pattern C: Dynamic Collection Pages

Not yet implemented in this project but required for menu structure. Example:

```astro
---
// src/pages/danh-muc/[category]/[slug].astro
export async function getStaticPaths() {
  // Fetch all categories and items from PostgreSQL
  const categories = await db.select().from(propertyCategories);
  const items = await db.select().from(properties);

  // Return path objects for each combination
  return categories.flatMap(cat =>
    items
      .filter(item => item.categoryId === cat.id)
      .map(item => ({
        params: {
          category: cat.slug,
          slug: item.slug
        },
        props: { item, category: cat }
      }))
  );
}

const { item, category } = Astro.props;
---
```

**Critical for menus:** This pattern generates all possible menu + item combinations upfront.

---

## 3. Caching Strategies for SSG with Database

### 3.1 Build-Time Caching (Recommended)

Since all data is fetched at build time, caching is **implicit in static output**. However, optimize query performance:

**Strategy: Query Result Memoization**

```typescript
// src/services/with-cache.ts
const queryCache = new Map<string, Promise<any>>();

export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  if (!queryCache.has(key)) {
    queryCache.set(key, fetcher());
  }
  return queryCache.get(key)!;
}

// Usage during build:
export async function getFeaturedProjects(limit: number = 5) {
  return getCachedData(
    `featured-projects-${limit}`,
    () => db.select()...
  );
}
```

**Benefit:** If multiple pages fetch the same data during build, result is cached in memory.

### 3.2 Conditional Data Loading

For menu structures with hundreds of items, avoid querying all upfront:

```typescript
// Fetch only active, public menu items
export async function getMenuItems() {
  return db.select()
    .from(menuItems)
    .where(
      and(
        eq(menuItems.isActive, true),
        eq(menuItems.isPublished, true)
      )
    )
    .orderBy(asc(menuItems.displayOrder));
}

// Fetch related data separately (lazy load during page generation)
export async function getMenuChildren(parentId: number) {
  return db.select()
    .from(menuItems)
    .where(eq(menuItems.parentId, parentId))
    .orderBy(asc(menuItems.displayOrder));
}
```

### 3.3 Incremental Static Regeneration (ISR) - If Needed

Astro doesn't support ISR natively in SSG, but can use **on-demand rendering** with server adapter:

```astro
// src/pages/dynamic-menu/[slug].astro
export const prerender = 'auto'; // Render on-demand + cache

const { slug } = Astro.params;
const menuItem = await getMenuItemBySlug(slug);

if (!menuItem) {
  return Astro.redirect('/404');
}
```

**Requires:** `output: 'server'` + Node adapter (already configured).

### 3.4 Database Connection Pooling

Current implementation already uses connection pooling:

```typescript
// src/db/index.ts
const client = postgres(connectionString, { max: 10 });
```

**`max: 10`** = Max 10 concurrent connections. For build process:
- Increase to `max: 20-50` if build parallelism increases
- Monitor build logs for `FATAL: sorry, too many clients already`

```typescript
// Optimized for build-time queries
const client = postgres(connectionString, {
  max: 50,           // Increased for concurrent queries
  idleTimeout: 10,   // Close idle connections quickly
  idle_in_transaction_session_timeout: 5000 // Kill hanging queries
});
```

---

## 4. Best Practices for Build-Time Data Fetching in Astro 5.x

### 4.1 Data Fetching Architecture

**✅ DO:**
- Fetch data in component frontmatter (top-level `await`)
- Use service layer for reusable queries
- Parallel queries with `Promise.all()`
- Filter at database level (WHERE clauses)
- Type-safe queries with Drizzle ORM

**❌ DON'T:**
- Fetch client-side unless necessary
- Expose database queries directly in pages
- Fetch all data then filter in JavaScript
- Use dynamic imports without build optimization

### 4.2 Performance Optimization

**Build Concurrency Control:**

```typescript
// astro.config.mjs
export default defineConfig({
  build: {
    concurrency: 5,  // Number of pages built in parallel
                     // Increase = faster builds but higher DB load
                     // Default: 1 (safe)
  }
});
```

**For menu structures with 100+ pages:**
```typescript
// Reduce concurrency to avoid DB connection exhaustion
build: {
  concurrency: 3,
}
```

### 4.3 Error Handling

**Current pattern (property detail page):**
```astro
---
const { slug } = Astro.params;

try {
  const property = await getPropertyBySlug(slug);
  if (!property) {
    return Astro.redirect('/404');
  }
} catch (error) {
  console.error(`Failed to load property ${slug}:`, error);
  return Astro.redirect('/500');
}
---
```

### 4.4 Type Safety with Drizzle

Ensure full TypeScript coverage:

```typescript
// Drizzle infers types from schema
type RealEstateRow = typeof realEstate.$inferSelect;
type NewsArticle = typeof news.$inferSelect;

// Services return typed data
export async function getNewsById(id: number): Promise<NewsRow | null> {
  return db.select().from(news).where(eq(news.id, id)).then(r => r[0] || null);
}
```

---

## 5. Performance Considerations for Large Menu Structures

### 5.1 Menu Query Optimization

For hierarchical menus (parent → children → grandchildren):

**Naive approach (BAD):**
```typescript
// Fetches entire menu tree for every page
export async function getFullMenuTree() {
  const parents = await db.select().from(menuItems).where(eq(parentId, null));
  const withChildren = await Promise.all(
    parents.map(async (parent) => ({
      ...parent,
      children: await db.select().from(menuItems).where(eq(parentId, parent.id))
    }))
  );
  return withChildren;
}
```

**Optimized approach:**
```typescript
// Fetch only what's needed per page
export async function getMenuTree(depth: number = 2) {
  // Single query with RECURSIVE CTE for PostgreSQL
  return db.execute(sql`
    WITH RECURSIVE menu_tree AS (
      SELECT id, slug, title, parentId, 0 as depth
      FROM menu_items
      WHERE parentId IS NULL AND isActive = true

      UNION ALL

      SELECT mi.id, mi.slug, mi.title, mi.parentId, mt.depth + 1
      FROM menu_items mi
      INNER JOIN menu_tree mt ON mi.parentId = mt.id
      WHERE mt.depth < ${depth}
    )
    SELECT * FROM menu_tree
    ORDER BY parentId, displayOrder
  `);
}
```

### 5.2 Static vs. Dynamic Menu Items

For real-time menu updates (e.g., "New Listings" count):

```astro
---
// src/components/header/header.astro
import { getMenuTree } from '@/services/menu-service';

// Static menu structure (built once)
const menuTree = await getMenuTree(2);

// But count updates can be dynamic if needed
export const prerender = 'auto'; // On-demand rendering
---

<nav>
  {menuTree.map(item => (
    <a href={item.url}>
      {item.title}
      {item.badge && <span>{item.badge}</span>}
    </a>
  ))}
</nav>
```

### 5.3 Build Time Estimation

For large datasets:

| Scenario | Pages | DB Queries | Est. Build Time |
|----------|-------|-----------|-----------------|
| Homepage only | 1 | 4 | <2s |
| Homepage + 10 news articles | 11 | 40 | 5-10s |
| Homepage + 100 properties + 100 news | 201 | 500+ | 30-60s |
| Full menu (500 items) | 500+ | 1000+ | 3-10min |

**Bottleneck:** Database query time, not Astro build process.

**Optimization:**
- Index frequently queried columns (slug, isActive, parentId)
- Use query result caching (memoization)
- Batch similar queries

```sql
-- PostgreSQL indexes for menu structure
CREATE INDEX idx_menu_items_parent_id ON menu_items(parentId);
CREATE INDEX idx_menu_items_slug ON menu_items(slug);
CREATE INDEX idx_menu_items_active_display ON menu_items(isActive, displayOrder);
```

### 5.4 Memory Management During Build

Large builds can exhaust memory. Monitor with:

```bash
# Monitor Node memory during build
node --max-old-space-size=4096 ./node_modules/astro/bin/astro.mjs build

# In package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' astro check && astro build"
  }
}
```

---

## 6. Advanced Patterns

### 6.1 Hybrid Rendering (SSG + SSR)

Mix static and dynamic:

```astro
---
// src/pages/products/[slug].astro

// Static: Generate list of all product slugs
export async function getStaticPaths() {
  const products = await db.select().from(products);
  return products.map(p => ({ params: { slug: p.slug }, props: { product: p } }));
}

// Dynamic: Fetch related items at request time
const { slug } = Astro.params;
const { product } = Astro.props;
const relatedItems = await getRelatedProducts(product.id);
---
```

### 6.2 Data Validation During Build

```typescript
// src/services/with-validation.ts
import { z } from 'zod';

const NewsSchema = z.object({
  id: z.number(),
  title: z.string().min(1),
  slug: z.string().min(1),
  published: z.boolean(),
});

export async function getValidatedNews() {
  const raw = await db.select().from(news);
  return raw.map(item => {
    const validated = NewsSchema.safeParse(item);
    if (!validated.success) {
      console.warn(`Invalid news item ${item.id}:`, validated.error);
    }
    return validated.data;
  }).filter(Boolean);
}
```

### 6.3 Parallel vs. Sequential Queries

```typescript
// Parallel: Fast but uses more connections
const [a, b, c] = await Promise.all([
  queryA(),
  queryB(),
  queryC()
]);

// Sequential: Slower but uses fewer connections
const a = await queryA();
const b = await queryB();
const c = await queryC();

// Smart: Parallel groups, sequential groups
const [groupA, groupB] = await Promise.all([
  Promise.all([queryA(), queryB()]),  // Parallel within group
  Promise.all([queryC(), queryD()])   // Parallel within group
]);
```

---

## 7. Integration with Tongkho-Web Architecture

### Current Stack
- **Framework:** Astro 5.2 (SSR mode via Node adapter)
- **ORM:** Drizzle 0.45.1
- **Database:** PostgreSQL
- **Adapter:** @astrojs/node (standalone)
- **Rendering:** React 19 (pre-rendered)

### Astro Config Status

```javascript
// astro.config.mjs - Currently SSR
export default defineConfig({
  output: 'server',           // SSR mode
  adapter: node({ mode: 'standalone' }),
  build: {
    inlineStylesheets: 'auto',
    concurrency: 1,           // Single page at a time
  }
});
```

**Note:** Project is configured for **server-side rendering**, not pure SSG. This is fine for menus:
- Database queries happen on each request
- Fresh menu data without rebuild
- No need to rebuild entire site for menu changes

### Recommendation: Switch to SSG for Static Menu

If menu rarely changes and site should be fast:

```javascript
// astro.config.mjs - Hybrid
export default defineConfig({
  output: 'hybrid',           // Mix of static + server
  adapter: node({ mode: 'standalone' }),
  build: {
    inlineStylesheets: 'auto',
    concurrency: 3,           // Parallel page builds
  }
});
```

Then use `prerender = true` (default) for menu pages, `prerender = false` for dynamic content.

---

## 8. Code Examples: Menu Implementation

### Example 1: Category Menu with Database

```typescript
// src/services/menu-service.ts
import { db } from '@/db';
import { menuCategories } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getCategoryMenu() {
  return db
    .select({
      id: menuCategories.id,
      name: menuCategories.name,
      slug: menuCategories.slug,
      icon: menuCategories.icon,
      order: menuCategories.displayOrder
    })
    .from(menuCategories)
    .where(eq(menuCategories.isActive, true))
    .orderBy(menuCategories.displayOrder);
}
```

```astro
---
// src/components/header/category-menu.astro
import { getCategoryMenu } from '@/services/menu-service';

const categories = await getCategoryMenu();
---

<nav class="category-menu">
  {categories.map(cat => (
    <a href={`/danh-muc/${cat.slug}`} key={cat.id}>
      {cat.icon && <Icon name={cat.icon} />}
      {cat.name}
    </a>
  ))}
</nav>
```

### Example 2: Breadcrumb from Database

```typescript
// src/utils/breadcrumb.ts
import { db } from '@/db';
import { menuItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getBreadcrumbs(slug: string) {
  const item = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.slug, slug))
    .then(r => r[0]);

  if (!item) return [];

  const crumbs = [{ title: item.title, slug: item.slug }];

  // Walk up parent chain
  let current = item;
  while (current.parentId) {
    const parent = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, current.parentId))
      .then(r => r[0]);

    if (parent) {
      crumbs.unshift({ title: parent.title, slug: parent.slug });
      current = parent;
    } else {
      break;
    }
  }

  return crumbs;
}
```

### Example 3: Dynamic Category Page with `getStaticPaths`

```astro
---
// src/pages/danh-muc/[slug].astro
import { db } from '@/db';
import { menuCategories, properties } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function getStaticPaths() {
  const categories = await db.select().from(menuCategories);
  return categories.map(cat => ({
    params: { slug: cat.slug },
    props: { category: cat }
  }));
}

const { category } = Astro.props;

// Fetch properties in this category
const categoryProperties = await db
  .select()
  .from(properties)
  .where(eq(properties.categoryId, category.id))
  .limit(12);
---

<MainLayout title={category.name}>
  <h1>{category.name}</h1>
  <PropertyGrid properties={categoryProperties} />
</MainLayout>
```

---

## 9. Common Pitfalls & Solutions

| Pitfall | Cause | Solution |
|---------|-------|----------|
| **Build fails: "too many clients"** | DB pool exhausted during concurrent queries | Reduce `build.concurrency` or increase `max` in postgres client |
| **Slow builds with large menus** | Querying all items for every page | Use memoization; query incrementally |
| **Menu changes require rebuild** | SSG caches data at build time | Use SSR (`prerender = false`) for menus; SSG for static content |
| **Memory errors during build** | Large result sets in memory | Increase Node heap size; paginate/filter queries |
| **Stale data in static output** | No way to update without rebuild | Implement webhook-triggered rebuilds or use ISR pattern |
| **N+1 queries in loops** | Service layer not optimized | Use batch queries or JOIN in database |

---

## 10. Recommended Next Steps for Tongkho-Web Menu Feature

### Phase 1: Data Schema (Week 1)
1. Create menu tables in PostgreSQL (parent-child hierarchy)
2. Seed with test data
3. Create Drizzle schema + migrations

### Phase 2: Service Layer (Week 1-2)
1. Implement `menu-service.ts` with queries
2. Add caching for frequently accessed menus
3. Optimize queries with indexes

### Phase 3: Components (Week 2)
1. Create menu components (header, sidebar, breadcrumb)
2. Test with static data
3. Integrate with service layer

### Phase 4: Pages (Week 2-3)
1. Create `src/pages/danh-muc/[slug].astro` with `getStaticPaths`
2. Implement category detail pages
3. Add filtering + sorting

### Phase 5: Build Optimization (Week 3)
1. Profile build time with large menus
2. Adjust `build.concurrency`
3. Add indexes to PostgreSQL
4. Implement query caching

### Phase 6: Testing & Deployment (Week 4)
1. Load test with 500+ menu items
2. Verify build performance
3. Deploy to production

---

## Unresolved Questions

1. **How many menu items total?** Affects `getStaticPaths` performance
2. **Menu change frequency?** Determines SSG vs. SSR trade-off
3. **Database size?** Impacts query performance and indexing strategy
4. **Real-time menu badges?** (e.g., "10 New Listings") - requires dynamic rendering
5. **Search/filter on menus?** May need Elasticsearch indexing

---

## Key Takeaways

1. **Astro SSG + PostgreSQL works perfectly** - Already implemented in project
2. **Top-level await pattern** is the standard for build-time data fetching
3. **Drizzle ORM provides type safety** and prevents SQL injection
4. **Parallel queries** via `Promise.all()` optimize build time
5. **Caching strategies** are critical for large datasets (>100 items)
6. **Connection pooling** prevents DB exhaustion during builds
7. **Menu structures** best served as static during build (no code change needed)
8. **Hybrid rendering** (SSG + SSR) allows balancing freshness vs. speed

---

## References

- [Astro Docs: Data Fetching](https://docs.astro.build/en/guides/data-fetching/)
- [Astro Docs: Dynamic Routes](https://docs.astro.build/en/guides/routing/#dynamic-routes)
- [Astro Docs: Server-Side Rendering](https://docs.astro.build/en/guides/server-side-rendering/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- **Project Code:**
  - `src/services/postgres-property-service.ts` - Property queries pattern
  - `src/services/postgres-news-project-service.ts` - News/project queries pattern
  - `src/db/index.ts` - Database connection setup
  - `src/pages/index.astro` - Build-time data fetching example
  - `src/pages/tin-tuc/[slug].astro` - Dynamic route example

---

**Report Generated:** 2026-02-06 14:43
**Prepared By:** Research Agent
**Status:** ✅ Complete
