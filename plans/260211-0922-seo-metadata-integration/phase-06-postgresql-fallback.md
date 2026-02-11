# Phase 6: PostgreSQL Fallback Service

**Priority:** High
**Status:** Pending
**Dependencies:** Phase 3 (Type definitions)

---

## Overview

Implement PostgreSQL fallback service to query `seo_meta_data` table when ElasticSearch is unavailable or returns no results. Provides resilient SEO metadata access with default fallback.

---

## Context

### Database Schema
File: `src/db/migrations/schema.ts:1796-1830`

Table: `seo_meta_data`
- Primary key: `id` (serial)
- Unique constraint: `slug`
- Index: `idx_seo_meta_data_slug`
- Index: `idx_seo_meta_data_is_active`

### v1 Fallback Logic
File: `reference/tongkho_v1/controllers/api.py:3584-3586`

```python
# Try ES first
seo_record = _query_seo_es(slug_local)
if not seo_record:
    # Fallback to PostgreSQL
    seo_record = db(db.seo_meta_data.slug == slug_local).select().first()
```

**Default SEO (Line 3553):**
```python
default_seo = db(db.seo_meta_data.slug == '/default/').select().first()
```

---

## Requirements

### Functional
1. Query `seo_meta_data` table by slug
2. Filter by `is_active = true`
3. Return default SEO if slug not found
4. Handle database connection errors

### Non-Functional
1. Fast query (< 50ms)
2. Type-safe (use Drizzle ORM)
3. Connection pooling
4. Error resilience

---

## Implementation

### File: `src/services/seo/seo-metadata-db-service.ts`

```typescript
/**
 * SEO Metadata Database Service
 * PostgreSQL fallback for SEO metadata queries
 */

import { db } from '@/db/db';
import { seoMetaData } from '@/db/migrations/schema';
import { eq, and } from 'drizzle-orm';
import type { SeoMetadataResult } from './types';

/**
 * Get SEO metadata from PostgreSQL by slug
 * Filters by is_active = true
 *
 * @param slug - URL path (e.g., '/mua-ban/ha-noi')
 * @returns SEO metadata or null if not found
 */
export async function getSeoMetadataFromDb(slug: string): Promise<SeoMetadataResult | null> {
  if (!slug || slug.trim().length === 0) {
    console.error('[SeoMetadataDB] Empty slug provided');
    return null;
  }

  try {
    const result = await db
      .select()
      .from(seoMetaData)
      .where(
        and(
          eq(seoMetaData.slug, slug.trim()),
          eq(seoMetaData.isActive, true)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return mapDbRecordToResult(result[0]);

  } catch (error) {
    console.error('[SeoMetadataDB] Query failed:', error);
    return null;
  }
}

/**
 * Get default SEO metadata (fallback when slug not found)
 * Queries for slug = '/default/'
 *
 * @returns Default SEO metadata or null
 */
export async function getDefaultSeoMetadata(): Promise<SeoMetadataResult | null> {
  try {
    const result = await db
      .select()
      .from(seoMetaData)
      .where(
        and(
          eq(seoMetaData.slug, '/default/'),
          eq(seoMetaData.isActive, true)
        )
      )
      .limit(1);

    if (result.length === 0) {
      console.warn('[SeoMetadataDB] No default SEO metadata found in database');
      return null;
    }

    return mapDbRecordToResult(result[0]);

  } catch (error) {
    console.error('[SeoMetadataDB] Failed to fetch default SEO:', error);
    return null;
  }
}

/**
 * Map database record to SeoMetadataResult type
 * Handles camelCase conversion and null values
 */
function mapDbRecordToResult(record: any): SeoMetadataResult {
  return {
    id: record.id,
    slug: record.slug,
    pageType: record.pageType || record.page_type,
    title: record.title,
    titleWeb: record.titleWeb || record.title_web,
    metaDescription: record.metaDescription || record.meta_description,
    metaKeywords: record.metaKeywords || record.meta_keywords,
    ogTitle: record.ogTitle || record.og_title,
    ogDescription: record.ogDescription || record.og_description,
    ogImage: record.ogImage || record.og_image,
    twitterTitle: record.twitterTitle || record.twitter_title,
    twitterDescription: record.twitterDescription || record.twitter_description,
    twitterImage: record.twitterImage || record.twitter_image,
    canonicalUrl: record.canonicalUrl || record.canonical_url,
    schemaType: record.schemaType || record.schema_type,
    schemaJson: record.schemaJson || record.schema_json,
    breadcrumbJson: record.breadcrumbJson || record.breadcrumb_json,
    contentAbove: record.contentAbove || record.content_above,
    contentBelow: record.contentBelow || record.content_below,
    isActive: record.isActive || record.is_active,
    isDefault: record.isDefault || record.is_default,
    createdAt: record.createdAt || record.created_at,
    updatedAt: record.updatedAt || record.updated_at,
    orderby: record.orderby,
    cachedHtml: record.cachedHtml || record.cached_html,
    socialTags: record.socialTags || record.social_tags
  };
}

/**
 * Check if SEO metadata exists for a given slug
 * Lightweight check (doesn't return full record)
 *
 * @param slug - URL path
 * @returns true if exists, false otherwise
 */
export async function seoMetadataExists(slug: string): Promise<boolean> {
  try {
    const result = await db
      .select({ id: seoMetaData.id })
      .from(seoMetaData)
      .where(
        and(
          eq(seoMetaData.slug, slug.trim()),
          eq(seoMetaData.isActive, true)
        )
      )
      .limit(1);

    return result.length > 0;

  } catch (error) {
    console.error('[SeoMetadataDB] Exists check failed:', error);
    return false;
  }
}
```

---

## Related Code Files

### To Create
- `src/services/seo/seo-metadata-db-service.ts` (NEW)

### To Reference
- `src/db/db.ts` (Drizzle connection)
- `src/db/migrations/schema.ts` (seoMetaData table)
- `src/services/seo/types.ts` (Phase 3)

---

## Implementation Steps

1. ☐ Create `seo-metadata-db-service.ts` file
2. ☐ Import Drizzle ORM and schema
3. ☐ Implement `getSeoMetadataFromDb()` function
4. ☐ Implement `getDefaultSeoMetadata()` function
5. ☐ Implement `mapDbRecordToResult()` helper
6. ☐ Implement `seoMetadataExists()` helper (optional)
7. ☐ Add proper error handling
8. ☐ Test database queries
9. ☐ Verify connection pooling works

---

## Testing

### Manual Tests

1. **Valid Slug**
   ```typescript
   const result = await getSeoMetadataFromDb('/mua-ban/ha-noi');
   // Expected: SeoMetadataResult with title, contentBelow, etc.
   ```

2. **Invalid Slug**
   ```typescript
   const result = await getSeoMetadataFromDb('/invalid-slug-123');
   // Expected: null
   ```

3. **Default SEO**
   ```typescript
   const result = await getDefaultSeoMetadata();
   // Expected: SeoMetadataResult for '/default/' slug
   ```

4. **Empty Slug**
   ```typescript
   const result = await getSeoMetadataFromDb('');
   // Expected: null (with console error)
   ```

5. **Inactive Record**
   ```typescript
   // Assuming slug exists but is_active = false
   const result = await getSeoMetadataFromDb('/inactive-slug');
   // Expected: null (filtered by is_active)
   ```

6. **Database Connection Error**
   ```typescript
   // Mock database to fail
   const result = await getSeoMetadataFromDb('/mua-ban/ha-noi');
   // Expected: null (with console error, no crash)
   ```

### Edge Cases
- ✅ Empty slug → return null
- ✅ Slug with trailing slash → matches DB (should normalize in service)
- ✅ Case sensitivity → exact match (PostgreSQL default)
- ✅ is_active = false → filtered out
- ✅ No default SEO record → return null

---

## Database Query Optimization

### Indexes Used
- `idx_seo_meta_data_slug` - Fast slug lookup
- `idx_seo_meta_data_is_active` - Fast active filter

### Query Plan (Expected)
```sql
EXPLAIN ANALYZE
SELECT * FROM seo_meta_data
WHERE slug = '/mua-ban/ha-noi' AND is_active = true
LIMIT 1;

-- Expected:
-- Index Scan using idx_seo_meta_data_slug
-- Planning time: < 1ms
-- Execution time: < 5ms
```

### Connection Pooling
- Drizzle ORM manages connection pool
- Default pool size: 10 connections
- No manual connection management needed

---

## Success Criteria

1. ✅ Queries `seo_meta_data` table successfully
2. ✅ Filters by `is_active = true`
3. ✅ Returns null for not found slugs
4. ✅ Default SEO query works
5. ✅ Type-safe (no TypeScript errors)
6. ✅ Fast queries (< 50ms)
7. ✅ Error handling prevents crashes

---

## Error Handling

### Database Connection Errors
```typescript
try {
  const result = await db.select()...
} catch (error) {
  console.error('[SeoMetadataDB] Query failed:', error);
  return null; // Graceful degradation
}
```

### Missing Default SEO
```typescript
if (result.length === 0) {
  console.warn('[SeoMetadataDB] No default SEO metadata found');
  return null; // Handled by service layer
}
```

---

## Performance Notes

### Query Times (Typical)
- By slug (indexed): ~5-10ms
- Default SEO query: ~5-10ms
- Connection overhead: ~2-5ms

### Total Fallback Time
- ElasticSearch failure: ~100ms timeout
- PostgreSQL query: ~10ms
- **Total:** ~110ms (acceptable for fallback)

---

## Security Considerations

### SQL Injection Prevention
- ✅ Using Drizzle ORM parameterized queries
- ✅ No raw SQL strings with user input
- ✅ Slug parameter sanitized via ORM

### Data Access
- ✅ Only reads `seo_meta_data` table (no writes)
- ✅ No sensitive data exposure
- ✅ Public SEO content only

---

## Next Steps

After Phase 6 completion:
→ Phase 2: Integrate DB service into main orchestration
→ Phase 8: Test complete fallback flow (ES → DB → Default)
