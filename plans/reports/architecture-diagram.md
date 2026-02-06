# Astro SSG + Database: Architecture Diagrams

## 1. Build-Time Data Flow (Current Implementation)

```
┌─────────────────────────────────────────────────────────────────┐
│                        BUILD PROCESS                            │
└─────────────────────────────────────────────────────────────────┘

npm run build
    │
    ├─→ Load .env (DATABASE_URL)
    │
    ├─→ src/pages/*.astro (components with top-level await)
    │
    ├─→ For each page:
    │   ├─→ src/services/menu-service.ts (query PostgreSQL)
    │   ├─→ src/services/postgres-news-project-service.ts
    │   └─→ src/services/elasticsearch-property-service.ts
    │
    ├─→ Database Queries (at build time)
    │   ├─→ SELECT menu FROM db (1ms)
    │   ├─→ SELECT news FROM db (5ms)
    │   └─→ SELECT projects FROM db (10ms)
    │
    ├─→ React components render to HTML
    │
    └─→ dist/ (pure static HTML, zero JS)

Total build time for 100 pages: 30-60 seconds
(depending on query performance + database size)
```

---

## 2. File Processing During Build

```
.astro Frontmatter (top-level)
         ↓
   [Top-level await]
         ↓
   [Execute async queries]
         ↓
   [Data available in template]
         ↓
   [Render React components]
         ↓
   [Generate static HTML]
         ↓
   dist/page.html (static output)
```

---

## 3. Dynamic Routes with Database

```
Database: menu_items table
├─ id: 1, slug: "mua-ban", parent: null, order: 1
├─ id: 2, slug: "cho-thue", parent: null, order: 2
├─ id: 3, slug: "ha-noi", parent: 1, order: 1
└─ id: 4, slug: "tphcm", parent: 1, order: 2

                    ↓

getStaticPaths() execution
├─ Query all menu_items
├─ Return 4 routes:
│  ├─ { params: {slug: "mua-ban"}, props: {item: {...}} }
│  ├─ { params: {slug: "cho-thue"}, props: {item: {...}} }
│  ├─ { params: {slug: "ha-noi"}, props: {item: {...}} }
│  └─ { params: {slug: "tphcm"}, props: {item: {...}} }
└─ Build 4 static pages: /mua-ban, /cho-thue, /ha-noi, /tphcm
```

---

## 4. Query Performance During Build

```
Sequential Queries (BAD)
├─ Query 1: 100ms ─────────┐
├─ Query 2: 50ms  ────────┬┘
└─ Query 3: 75ms  ────┬──┘
Total: 225ms

Parallel Queries (GOOD)
├─ Query 1: 100ms ─┐
├─ Query 2: 50ms  ├─ max(100ms)
└─ Query 3: 75ms  ┘
Total: 100ms

Code:
  // Sequential
  const a = await queryA(); // 100ms
  const b = await queryB(); // 50ms
  const c = await queryC(); // 75ms
  // Total: 225ms

  // Parallel
  const [a, b, c] = await Promise.all([
    queryA(),  // 100ms
    queryB(),  // 50ms
    queryC()   // 75ms
  ]); // Total: 100ms
```

---

## 5. Database Connection Pool

```
Available Pool (max: 10)

Connection 1  ──→ Query 1 (100ms)
Connection 2  ──→ Query 2 (50ms)
Connection 3  ──→ Query 3 (75ms)
Connection 4  ──→ (idle)
...
Connection 10 ──→ (idle)

After queries complete → Connections return to pool
```

**For large menu structures:**
- Increase pool: `max: 20-50`
- Monitor: `max_connections` in PostgreSQL

---

## 6. Memory Usage During Build

```
Before Build:
├─ Node base: 50MB
├─ Modules: 200MB
└─ Free: 15GB

During Data Fetching:
├─ Query results in memory: +100MB (for 1000 items)
├─ React render trees: +50MB
└─ Total used: 400MB

Static Output (dist/):
└─ Pure HTML: 5-10MB (no JavaScript)

Note: Memory can spike with large result sets
Solution: Pagination or increase Node heap size
```

---

## 7. Build Time vs. Menu Size

```
├─ 10 items      → 2-3 seconds
├─ 50 items      → 5-10 seconds
├─ 100 items     → 15-30 seconds
├─ 500 items     → 60-120 seconds
└─ 1000+ items   → 3-10 minutes (optimization needed)

Bottleneck:
1. Database query time (largest impact)
2. React rendering (medium)
3. File I/O (smallest)

Optimization:
- Add database indexes
- Query result caching
- Batch queries
- Reduce build concurrency
```

---

## 8. Astro Config: Static vs. Server vs. Hybrid

```
Output: 'static' (Default SSG)
├─ Build time: Data fetched once
├─ Output: Pure static HTML
├─ Refresh: Rebuild required
└─ Ideal for: Menus, stable content

Output: 'server' (SSR - Current in project)
├─ Build time: No data fetching
├─ Output: Node.js server
├─ Refresh: On every request
└─ Ideal for: Dynamic homepages, real-time data

Output: 'hybrid' (Mixed)
├─ Some pages: Static (prerender: true) → SSG
├─ Some pages: Dynamic (prerender: false) → SSR
└─ Ideal for: Menus (static) + homepage (dynamic)
```

---

## 9. Service Layer Architecture

```
Page Components
    ↓
Service Layer (src/services/)
├─ menu-service.ts
├─ postgres-property-service.ts
├─ postgres-news-project-service.ts
└─ elasticsearch-property-service.ts
    ↓
Database Abstraction (Drizzle ORM)
├─ db/schema/menu.ts
├─ db/schema/news.ts
├─ db/schema/project.ts
└─ db/schema/real-estate.ts
    ↓
PostgreSQL Database
├─ menu_items table
├─ news table
├─ projects table
└─ real_estate table
```

**Benefits:**
- Reusable queries across pages
- Easy testing/mocking
- Type-safe with Drizzle
- Centralized error handling

---

## 10. Type Safety Flow

```
Database
  ├─ Table: menu_items
  │   └─ Columns: id, slug, title, parentId

Drizzle Schema
  ├─ pgTable('menu_items', { ... })
  └─ Infer type: MenuItemRow = typeof menu_items.$inferSelect

Service Layer
  ├─ getMenuItems(): Promise<MenuItemRow[]>
  └─ Query is type-checked ✓

Component
  ├─ items: MenuItemRow[]
  ├─ Access: items[0].slug ✓ (type-safe)
  └─ Typo: items[0].slg ✗ (TS error caught at build)

Result:
  - Zero runtime type errors
  - IDE autocomplete support
  - SQL injection prevention
```

---

## 11. Caching Strategy During Build

```
First Page Build:
├─ Query getMenuItems()
│  └─ Result: 50 items (50ms)
└─ Render + save to cache

Second Page (same query):
├─ Check cache: HIT
├─ Return cached result (0ms)
└─ Reuse without re-query

If multiple pages share data:
├─ 100 pages × 50ms = 5000ms (no cache)
└─ 100 pages × 0ms = 0ms (with cache)

Caching implementation:
const queryCache = new Map();

export async function getCachedMenuItems() {
  const key = 'menu-items';
  if (!queryCache.has(key)) {
    queryCache.set(key, db.select().from(menu));
  }
  return queryCache.get(key);
}
```

---

## 12. Error Handling Flow

```
Page Load
  ├─ Fetch data
  │  ├─ Database down → Astro.redirect('/500')
  │  ├─ Item not found → Astro.redirect('/404')
  │  └─ Success → Render page
  │
  └─ Static HTML output
     ├─ If error during build → Build fails
     └─ (User doesn't see error in production)

Contrast with SSR:
  ├─ Error during build → Build still succeeds
  ├─ Error at request time → User sees error page
  └─ Better for real-time data fetching
```

---

## 13. Tongkho-Web Current Architecture

```
┌─────────────────────────────────────────────────┐
│            Tongkho-Web (Astro 5.2)              │
│             output: 'server' (SSR)              │
└─────────────────────────────────────────────────┘

Homepage (index.astro)
  ├─ elasticsearchPropertyService.searchProperties('sale')
  ├─ elasticsearchPropertyService.searchProperties('rent')
  ├─ getFeaturedProjects()
  └─ getLatestNews()
      ↓
  [Data fetched at REQUEST TIME]
      ↓
  Static HTML generated on-the-fly
      ↓
  Served by Node.js server

Dynamic Routes
  ├─ /tin-tuc/[slug].astro
  │  └─ getNewsBySlug(slug) → Fetch article
  │
  ├─ /bds/[slug].astro
  │  └─ getPropertyBySlug(slug) → Fetch property
  │
  └─ /danh-muc/[slug].astro (PLANNED)
     └─ getMenuItemBySlug(slug) → Fetch menu item
         ├─ Related items
         └─ Child items
```

**Note:** Currently using SSR (server-rendered on demand)
**For menus:** Can switch to SSG for faster builds

---

## 14. Proposed Menu Implementation

```
Database Schema:
  menu_items
  ├─ id: serial
  ├─ name: varchar
  ├─ slug: varchar
  ├─ parentId: integer (nullable)
  ├─ displayOrder: integer
  ├─ icon: varchar (optional)
  ├─ isActive: boolean
  └─ createdAt: timestamp

Service Layer:
  ├─ getMenuTree(depth: number)
  ├─ getMenuItemBySlug(slug: string)
  ├─ getChildItems(parentId: number)
  └─ getBreadcrumbs(slug: string)

Pages:
  ├─ src/pages/danh-muc/index.astro (all categories)
  ├─ src/pages/danh-muc/[slug].astro (category + items)
  └─ src/components/header/menu.astro (header menu)

Build Process:
  ├─ getStaticPaths() → fetch all menu items
  ├─ Return 50-100 route objects
  ├─ Build 50-100 static pages
  └─ Total build: 30-60 seconds
```

---

## Summary

**Current State (Tongkho-Web):**
- ✅ Uses Drizzle ORM for type-safe queries
- ✅ Fetches from PostgreSQL at request time
- ✅ Service layer pattern for code organization
- ✅ Error handling with redirects

**For Menu Feature:**
- ✅ Can use same patterns
- ✅ Consider: SSG vs. SSR trade-off
- ✅ Need: `getStaticPaths` for large menus
- ✅ Optimize: Caching + indexing
- ✅ Monitor: Build time + memory

**Recommendation:**
Use hybrid rendering: Menus as SSG (fast, no rebuild needed for data changes), homepage as SSR (fresh data).

