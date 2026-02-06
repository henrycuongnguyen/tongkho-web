# Astro SSG + Database Integration: Quick Reference
**For:** Menu feature implementation in tongkho-web
**Context:** PostgreSQL + Drizzle ORM + Astro 5.2

---

## Quick Patterns

### Pattern 1: Fetch Data in Component Frontmatter
```astro
---
import { db } from '@/db';
import { news } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Executes at BUILD TIME (not request time)
const articles = await db
  .select()
  .from(news)
  .where(eq(news.isActive, true))
  .limit(10);
---

<ul>
  {articles.map(a => <li>{a.title}</li>)}
</ul>
```

### Pattern 2: Service Layer (Reusable)
```typescript
// src/services/menu-service.ts
export async function getMenuItems() {
  return db.select().from(menu).where(eq(menu.isActive, true));
}
```

```astro
---
import { getMenuItems } from '@/services/menu-service';
const items = await getMenuItems();
---
```

### Pattern 3: Dynamic Routes with `getStaticPaths`
```astro
---
// src/pages/items/[slug].astro
export async function getStaticPaths() {
  const items = await db.select().from(items);
  return items.map(item => ({
    params: { slug: item.slug },
    props: { item }
  }));
}

const { item } = Astro.props;
---
<h1>{item.title}</h1>
```

### Pattern 4: Parallel Queries for Performance
```astro
---
const [menu, news, projects] = await Promise.all([
  getMenuItems(),
  getLatestNews(5),
  getFeaturedProjects(5)
]);
---
```

### Pattern 5: Error Handling
```astro
---
const { slug } = Astro.params;

const item = await getItemBySlug(slug);
if (!item) {
  return Astro.redirect('/404');
}
---
```

---

## Database Setup Checklist

- [ ] Create menu tables in PostgreSQL
- [ ] Create Drizzle schema in `src/db/schema/menu.ts`
- [ ] Run migrations: `npm run drizzle generate && npm run drizzle migrate`
- [ ] Create service in `src/services/menu-service.ts`
- [ ] Test queries locally: `npm run dev`
- [ ] Verify build: `npm run build`

---

## Performance Tips

| Optimization | Implementation | Impact |
|---|---|---|
| **Index frequently queried columns** | `CREATE INDEX idx_menu_slug ON menu(slug)` | -80% query time |
| **Filter at database, not in JS** | `where(eq(menu.isActive, true))` vs. filter in code | -90% memory usage |
| **Cache query results during build** | Memoization in service layer | -50% build time |
| **Parallel queries** | `Promise.all([...])` | -60% build time |
| **Reduce build concurrency** | `build.concurrency: 1-3` | Prevents DB exhaustion |

---

## Troubleshooting

**Error: "too many clients"**
```
Solution: Reduce build.concurrency from 5 to 1-2
```

**Error: Build is too slow**
```
Solution: Add indexes to frequently queried columns
```

**Error: Stale data in production**
```
Solution: Either rebuild when data changes, or use prerender = false
```

**Error: Out of memory**
```
Solution: NODE_OPTIONS='--max-old-space-size=4096' npm run build
```

---

## File Structure (After Implementation)

```
src/
├── db/
│   └── schema/
│       ├── index.ts
│       ├── menu.ts              ← NEW
│       ├── news.ts
│       ├── project.ts
│       └── real-estate.ts
├── services/
│   ├── menu-service.ts          ← NEW
│   ├── postgres-news-project-service.ts
│   └── postgres-property-service.ts
└── pages/
    ├── danh-muc/
    │   ├── [slug].astro         ← NEW
    │   └── index.astro          ← NEW
    ├── index.astro
    ├── tin-tuc/
    │   ├── [slug].astro
    │   └── index.astro
    └── bds/
        └── [slug].astro
```

---

## Environment Variables

```bash
# .env
DATABASE_URL=postgres://user:password@localhost:5432/tongkho
```

Verify during build:
```typescript
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not set');
}
```

---

## Next: Implementation Details

See comprehensive report:
📄 `researcher-260206-1443-astro-ssg-database-integration.md`

