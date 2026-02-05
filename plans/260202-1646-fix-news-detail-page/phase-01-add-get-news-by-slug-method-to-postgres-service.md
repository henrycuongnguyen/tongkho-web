# Phase 1: Add getNewsBySlug Method to PostgreSQL Service

## Context

- Plan: [plan.md](./plan.md)
- Service: `src/services/postgres-news-project-service.ts`

## Overview

- **Priority**: P1
- **Status**: ✅ completed
- **Estimate**: 30 minutes
- **Completed**: 2026-02-02

## Key Insights

1. Service already has `getLatestNews()` method with DB mapping logic
2. News table structure: `id`, `name`, `description`, `htmlcontent`, `avatar`, `folder`, `publish_on`, `created_on`
3. Slug generated dynamically from `name` field using `generateSlug()` method
4. Challenge: DB has no `slug` column, must match by generating slug from `name`

## Requirements

### Functional
- Add `getNewsBySlug(slug: string)` method
- Return single `NewsArticle` or `null`
- Fallback to mock data when DB unavailable

### Non-Functional
- Consistent error handling pattern
- Type-safe return values

## Architecture

### Option A: Match by Generated Slug (Recommended)
```sql
SELECT * FROM news WHERE aactive = true AND folder = ANY($1)
```
Then filter in code: `rows.find(r => generateSlug(r.name) === slug)`

**Pros**: Works with existing DB schema
**Cons**: Fetches more rows than needed

### Option B: Add slug column to DB
**Pros**: Efficient single-row query
**Cons**: Requires DB migration, out of scope

## Related Code Files

### Files to Modify
- `src/services/postgres-news-project-service.ts`

### Files for Reference
- `src/services/postgres-property-service.ts` (reference: getPropertyBySlug pattern)

## Implementation Steps

1. Add `getNewsBySlug(slug: string): Promise<NewsArticle | null>` method
2. Query all active news from allowed folders
3. Map rows to NewsArticle, find matching slug
4. Return article or null
5. Add fallback to mockNews when pool unavailable

## Code Snippet

```typescript
/**
 * Get news article by slug
 */
async getNewsBySlug(slug: string): Promise<NewsArticle | null> {
  if (!this.pool) {
    console.warn("[PG] No pool, using mock news for slug lookup");
    return mockNews.find((a) => a.slug === slug) || null;
  }

  try {
    const result = await this.pool.query<DBNewsRow>(
      `SELECT id, name, description, htmlcontent, avatar, folder,
              publish_on, created_on, display_order
       FROM news
       WHERE aactive = true
         AND folder = ANY($1)
         AND avatar IS NOT NULL AND avatar != ''
       ORDER BY publish_on DESC NULLS LAST`,
      [this.NEWS_FOLDERS]
    );

    // Find article by generated slug
    const matchingRow = result.rows.find(
      (row) => this.generateSlug(row.name) === slug
    );

    if (!matchingRow) {
      return mockNews.find((a) => a.slug === slug) || null;
    }

    return this.mapToNewsArticle(matchingRow);
  } catch (error) {
    console.error("[PG] News slug lookup failed:", error);
    return mockNews.find((a) => a.slug === slug) || null;
  }
}
```

## Todo List

- [x] Add `getNewsBySlug` method to PostgresNewsProjectService
- [x] Test method with real slug from DB
- [x] Verify fallback to mock data works

## Success Criteria

- [x] Method returns NewsArticle for valid slug
- [x] Method returns null for invalid slug
- [x] Fallback works when DB unavailable
- [x] No TypeScript errors

## Implementation Notes

**Code Location:** `src/services/postgres-news-project-service.ts:84-116`

**Approach:** Option A (match by generated slug in-memory)
- Query all active news from folders [26, 27, 37]
- Generate slug for each row using `generateSlug(row.name)`
- Find matching row by comparing slugs
- Fallback to mock data on error or no pool

**Review Findings:**
- ⚠️ Performance concern: Fetches all articles, filters in-memory (N+1 pattern)
- ⚠️ DRY violation: generateSlug() duplicated from utils/format.ts
- ✅ Security: Parameterized queries prevent SQL injection
- ✅ Type safety: Full TypeScript coverage
- ✅ Error handling: Proper try-catch with fallback

## Next Steps

After completion, proceed to [Phase 2: Update News Detail Page](./phase-02-update-news-detail-page-to-use-postgres-data.md)
