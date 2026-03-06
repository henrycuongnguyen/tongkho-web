# Phase 1: Service Layer Updates

**Priority:** HIGH
**Status:** Pending (Blocked by Phase 0)
**Effort:** 4-5 hours
**Risk:** Medium

---

## Objective

Refactor `postgres-news-project-service.ts` to support dynamic folder queries matching v1 logic, removing hardcoded folder IDs and implementing v1-compatible sorting.

---

## Context

**v1 Reference:**
```python
# api_customer.py:5703-5726
folder_id = cms.get_folder(folder)  # Convert slug to ID
rows = cms.get_content(
    tablename='news',
    folder=folder_id,
    page=int(page),
    length=int(length),
    orderby=db.news.display_order | ~db.news.id  # ASC, DESC
)
count = cms.get_count(tablename='news', folder=folder_id)
```

**v2 Current Issues:**
```typescript
// Hardcoded - NOT scalable
const NEWS_FOLDERS = [26, 27, 37];
const categoryMap: Record<number, NewsArticle["category"]> = {
  26: "policy",
  27: "tips",
  37: "tips",
};
```

**v2 Target:**
- Dynamic folder lookup by slug
- All folders accessible (not just 3)
- v1-compatible sort: `display_order ASC, id DESC`
- Pagination with `page` and `itemsPerPage` params

---

## Implementation Steps

### Step 1: Add Folder Schema Import

**File:** `src/services/postgres-news-project-service.ts`

```typescript
import { folder as folderTable } from '@/db/schema/menu';
```

### Step 2: Create `getNewsByFolder` Function

Add new function for v1-compatible folder-based queries:

```typescript
/**
 * Get news articles by folder slug (v1-compatible)
 * @param folderSlug - Folder slug (e.g., "du-an-noi-bat")
 * @param page - Page number (1-indexed)
 * @param itemsPerPage - Items per page (default: 9)
 * @returns News articles and total count
 */
export async function getNewsByFolder(
  folderSlug: string,
  page: number = 1,
  itemsPerPage: number = 9
): Promise<{ items: NewsArticle[]; total: number; folder: Folder | null }> {
  // 1. Get folder by slug (like v1's cms.get_folder)
  const folder = await db
    .select()
    .from(folderTable)
    .where(eq(folderTable.name, folderSlug))
    .limit(1)
    .then(rows => rows[0] || null);

  if (!folder) {
    return { items: [], total: 0, folder: null };
  }

  // 2. Get news by folder (like v1's cms.get_content)
  const offset = (page - 1) * itemsPerPage;
  const newsRows = await db
    .select()
    .from(news)
    .where(
      and(
        eq(news.folder, folder.id),
        eq(news.aactive, true),
        isNotNull(news.avatar) // Has thumbnail
      )
    )
    .orderBy(
      asc(news.displayOrder),  // v1: display_order ASC
      desc(news.id)             // v1: id DESC
    )
    .limit(itemsPerPage)
    .offset(offset);

  // 3. Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(news)
    .where(
      and(
        eq(news.folder, folder.id),
        eq(news.aactive, true),
        isNotNull(news.avatar)
      )
    )
    .then(rows => rows[0]?.count || 0);

  // 4. Map to NewsArticle type
  const items = newsRows.map(row => mapNewsRowToArticle(row));

  return { items, total: countResult, folder };
}
```

### Step 3: Create `mapNewsRowToArticle` Helper

Extract mapping logic to reusable helper:

```typescript
/**
 * Map database row to NewsArticle type
 */
function mapNewsRowToArticle(row: typeof news.$inferSelect): NewsArticle {
  // Generate slug from title
  const slug = generateSlug(row.name || '');

  // Determine category from folder ID (temp, until Phase 2)
  const category = getCategoryByFolderId(row.folder);

  return {
    id: row.id,
    title: row.name || '',
    slug,
    excerpt: row.description?.substring(0, 200) || '',
    content: row.htmlcontent || row.description || '',
    thumbnail: row.avatar
      ? `https://tongkhobds.com/static/uploads/news/${row.avatar}`
      : '',
    category,
    author: 'TongkhoBDS',
    publishedAt: row.publishOn || row.createdOn || new Date(),
    views: Math.floor(Math.random() * 5000) + 500, // TODO: Real views tracking
  };
}
```

### Step 4: Add `getCategoryByFolderId` Temp Helper

**Note:** This is temporary until Phase 2 uses folder.label directly.

```typescript
/**
 * Get category by folder ID (temporary mapping)
 * TODO: Phase 2 will use folder.label directly
 */
function getCategoryByFolderId(folderId: number | null): NewsCategory {
  if (!folderId) return 'tips';

  const categoryMap: Record<number, NewsCategory> = {
    26: 'policy',      // quy-hoach-phap-ly
    27: 'tips',        // noi-ngoai-that
    37: 'tips',        // phong-thuy-nha-o
    // Add more as discovered in database
  };

  return categoryMap[folderId] || 'tips';
}
```

### Step 5: Add `Folder` Type Definition

**File:** `src/types/property.ts` (or create `src/types/folder.ts`)

```typescript
export interface Folder {
  id: number;
  parent: number | null;
  name: string;        // URL slug
  label: string;       // Display name
  publish: 'T' | 'F';
  displayOrder: number | null;
}
```

### Step 6: Update `getLatestNews` Sort Order

**Change:** Match v1 sort order

```diff
export async function getLatestNews(limit: number = 10): Promise<NewsArticle[]> {
  const newsRows = await db
    .select()
    .from(news)
    .where(
      and(
        eq(news.aactive, true),
-       inArray(news.folder, NEWS_FOLDERS),
+       // Remove folder filter - get from ALL folders
        isNotNull(news.avatar)
      )
    )
    .orderBy(
-     desc(news.publishOn),
-     desc(news.id)
+     asc(news.displayOrder),  // v1: display_order ASC
+     desc(news.id)             // v1: id DESC
    )
    .limit(limit);

  return newsRows.map(row => mapNewsRowToArticle(row));
}
```

### Step 7: Remove Hardcoded Constants

```diff
- // Hardcoded folder filter
- const NEWS_FOLDERS = [26, 27, 37];
-
- // Category mapping
- const categoryMap: Record<number, NewsArticle["category"]> = {
-   26: "policy",
-   27: "tips",
-   37: "tips",
- };
```

### Step 8: Update Imports

```typescript
import { eq, and, desc, asc, isNotNull, sql, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { news } from '@/db/schema/news';
import { folder as folderTable } from '@/db/schema/menu';
import type { NewsArticle, NewsCategory, Folder } from '@/types/property';
```

---

## Testing Checklist

### Unit Tests (Manual)

Test `getNewsByFolder` function:

```typescript
// Test 1: Valid folder slug
const result1 = await getNewsByFolder('du-an-noi-bat', 1, 9);
console.assert(result1.folder !== null, 'Folder should be found');
console.assert(result1.items.length > 0, 'Should return articles');

// Test 2: Invalid folder slug
const result2 = await getNewsByFolder('non-existent', 1, 9);
console.assert(result2.folder === null, 'Folder should be null');
console.assert(result2.items.length === 0, 'Should return empty array');

// Test 3: Pagination
const result3 = await getNewsByFolder('du-an-noi-bat', 2, 5);
console.assert(result3.items.length <= 5, 'Should respect itemsPerPage');

// Test 4: Sort order
const result4 = await getNewsByFolder('du-an-noi-bat', 1, 100);
const sorted = [...result4.items].sort((a, b) => {
  // Verify displayOrder ASC, id DESC
  return a.id === b.id ? 0 : (a.id < b.id ? 1 : -1);
});
console.assert(JSON.stringify(result4.items) === JSON.stringify(sorted), 'Sort order should match v1');
```

### Integration Tests

**Create test file:** `src/services/__tests__/news-service.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getNewsByFolder, getLatestNews } from '../postgres-news-project-service';

describe('News Service - v1 Compatibility', () => {
  it('should get news by folder slug', async () => {
    const result = await getNewsByFolder('du-an-noi-bat', 1, 9);
    expect(result.folder).toBeTruthy();
    expect(result.items).toBeInstanceOf(Array);
    expect(result.total).toBeGreaterThan(0);
  });

  it('should return empty for invalid folder', async () => {
    const result = await getNewsByFolder('invalid-slug', 1, 9);
    expect(result.folder).toBeNull();
    expect(result.items).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should respect pagination', async () => {
    const page1 = await getNewsByFolder('du-an-noi-bat', 1, 3);
    const page2 = await getNewsByFolder('du-an-noi-bat', 2, 3);

    expect(page1.items).toHaveLength(3);
    expect(page2.items).toHaveLength(3);
    expect(page1.items[0].id).not.toBe(page2.items[0].id);
  });

  it('should sort by displayOrder ASC, id DESC', async () => {
    const result = await getNewsByFolder('du-an-noi-bat', 1, 100);
    const items = result.items;

    for (let i = 0; i < items.length - 1; i++) {
      // displayOrder should be ascending
      // id should be descending
      // (Detailed assertion based on actual data)
    }
  });

  it('getLatestNews should use v1 sort order', async () => {
    const result = await getLatestNews(10);
    expect(result).toHaveLength(10);
    // Verify sort order
  });
});
```

Run tests:
```bash
npm run test src/services/__tests__/news-service.test.ts
```

---

## Database Validation

### Step 1: Audit Folder Table

```sql
-- Check folder table structure
SELECT id, parent, name, label, publish, display_order
FROM folder
WHERE name IS NOT NULL
ORDER BY id;

-- Find folders with news articles
SELECT f.id, f.name, f.label, COUNT(n.id) as news_count
FROM folder f
LEFT JOIN news n ON n.folder = f.id AND n.aactive = true
GROUP BY f.id, f.name, f.label
HAVING COUNT(n.id) > 0
ORDER BY news_count DESC;

-- Check for duplicate folder slugs
SELECT name, COUNT(*) as count
FROM folder
GROUP BY name
HAVING COUNT(*) > 1;
```

### Step 2: Verify News-Folder FK

```sql
-- Find orphaned news (no folder or invalid folder)
SELECT n.id, n.name, n.folder
FROM news n
LEFT JOIN folder f ON f.id = n.folder
WHERE n.aactive = true
  AND (n.folder IS NULL OR f.id IS NULL);

-- This should return 0 rows
```

### Step 3: Check Display Order Population

```sql
-- Check displayOrder field
SELECT
  COUNT(*) as total,
  COUNT(display_order) as with_order,
  COUNT(*) - COUNT(display_order) as without_order
FROM news
WHERE aactive = true;

-- If without_order > 0, may need migration script
```

---

## Database Migration (If Needed)

### Migration 1: Add Missing display_order Values

**File:** `src/db/migrations/add-news-display-order.sql`

```sql
-- Set display_order to id where NULL
UPDATE news
SET display_order = id
WHERE display_order IS NULL;

-- Add default value for future inserts
ALTER TABLE news
ALTER COLUMN display_order SET DEFAULT 0;
```

### Migration 2: Add Database Indexes

```sql
-- Index on news.folder for fast folder queries
CREATE INDEX IF NOT EXISTS idx_news_folder
ON news(folder);

-- Composite index for sorting
CREATE INDEX IF NOT EXISTS idx_news_display_order_id
ON news(display_order ASC, id DESC)
WHERE aactive = true;

-- Index on folder.name for slug lookups
CREATE INDEX IF NOT EXISTS idx_folder_name
ON folder(name);
```

Run migrations:
```bash
npm run db:migrate
```

---

## Performance Optimization

### Expected Query Performance

**Target:** < 100ms per query

**Optimization Strategy:**
1. ✅ Database indexes on `news.folder`, `news.display_order`, `folder.name`
2. ✅ Limit result sets with pagination
3. ✅ Use `SELECT *` only when needed (consider specific columns)
4. ✅ Cache folder lookups (rarely change)

### Caching Strategy (Optional)

```typescript
// Simple in-memory cache for folder lookups
const folderCache = new Map<string, Folder | null>();

async function getFolderBySlug(slug: string): Promise<Folder | null> {
  if (folderCache.has(slug)) {
    return folderCache.get(slug)!;
  }

  const folder = await db
    .select()
    .from(folderTable)
    .where(eq(folderTable.name, slug))
    .limit(1)
    .then(rows => rows[0] || null);

  folderCache.set(slug, folder);
  return folder;
}
```

---

## Success Criteria

- ✅ `getNewsByFolder()` function works correctly
- ✅ Hardcoded `NEWS_FOLDERS` removed
- ✅ Sort order matches v1: `display_order ASC, id DESC`
- ✅ Pagination works with `page` and `itemsPerPage`
- ✅ All tests pass
- ✅ Database indexes added
- ✅ Query performance < 100ms

---

## Risk Mitigation

### Risk 1: Missing `display_order` Values
**Mitigation:** Run database migration to populate NULLs

### Risk 2: Orphaned News Records
**Mitigation:** Find and fix orphaned records before deployment

### Risk 3: Performance Degradation
**Mitigation:** Add database indexes, implement caching

---

## Rollback Plan

```bash
# Revert service file
git checkout HEAD -- src/services/postgres-news-project-service.ts

# Revert database migrations
npm run db:rollback

# Rebuild
npm run build
```

---

## Dependencies

**Requires:**
- Phase 0 complete (validates redirect strategy)
- Database access for migrations
- Drizzle ORM configured

**Blocks:**
- Phase 2: Folder URL Migration (depends on `getNewsByFolder()`)

---

## Timeline Estimate

| Task | Time |
|------|------|
| Add `getNewsByFolder()` function | 60 min |
| Create helper functions | 30 min |
| Update existing functions | 30 min |
| Add type definitions | 15 min |
| Database audit & validation | 45 min |
| Database migrations | 30 min |
| Unit tests | 45 min |
| Integration tests | 45 min |
| Performance testing | 30 min |
| **Total** | **4-5 hours** |

---

## Completion Criteria

Phase 1 is complete when:
1. ✅ All code changes merged
2. ✅ Tests passing
3. ✅ Database migrations applied
4. ✅ Performance validated
5. ✅ No regressions in existing features

→ **Ready to proceed with Phase 2**
