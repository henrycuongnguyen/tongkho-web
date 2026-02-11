# Phase 1: ElasticSearch SEO Metadata Service

**Priority:** High
**Status:** Pending
**Dependencies:** None

---

## Overview

Create ElasticSearch service to query `seo_meta_data` index, matching v1's query logic. This provides fast SEO metadata lookup with proper slug handling and price parsing.

---

## Context

### v1 Reference
File: `reference/tongkho_v1/controllers/api.py:3493-3528`

```python
def _query_seo_es(slug_val):
    """Query SEO from ElasticSearch"""
    es_url = 'https://elastic.tongkhobds.com/seo_meta_data/_search'
    api_key = 'OTFsazRaa0JXOHN1MG5HMGxGbU06Z2xBVDFnLWlSZC1VY2NNSVItcGtZQQ=='

    es_body = {
        "query": {
            "bool": {
                "must": [
                    {"term": {"slug": slug_val}},
                    {"term": {"is_active": True}}
                ]
            }
        },
        "size": 1
    }

    res = requests.post(es_url, headers={...}, json=es_body)
    hits = res.json().get('hits', {}).get('hits', [])
    return hits[0]['_source'] if hits else None
```

### v2 Pattern
File: `src/services/elasticsearch/location-search-service.ts`

- Import ES credentials from env
- Use fetch API with proper headers
- Parse response hits
- Error handling with console.error
- Return typed results

---

## Requirements

### Functional
1. Query ElasticSearch `seo_meta_data` index
2. Filter by:
   - `slug` (exact match)
   - `is_active = true`
3. Return single result (size: 1)
4. Handle errors gracefully (return null)

### Non-Functional
1. Fast response time (< 100ms typical)
2. Type-safe (TypeScript)
3. Environment-aware (ES_URL, ES_API_KEY)
4. Error logging for debugging

---

## Implementation

### File: `src/services/elasticsearch/seo-metadata-search-service.ts`

```typescript
/**
 * SEO Metadata Search Service
 * Query seo_meta_data index via ElasticSearch
 */

import type { SeoMetadataResult } from '../seo/types';

// Environment configuration
const ES_URL = import.meta.env.ES_URL || process.env.ES_URL || '';
const ES_API_KEY = import.meta.env.ES_API_KEY || process.env.ES_API_KEY || '';
const SEO_INDEX = 'seo_meta_data';

export interface SeoMetadataSearchOptions {
  slug: string;
}

/**
 * Search SEO metadata by slug from ElasticSearch
 * Returns null if not found or error occurs
 */
export async function searchSeoMetadata(
  options: SeoMetadataSearchOptions
): Promise<SeoMetadataResult | null> {
  const { slug } = options;

  // Validate slug
  if (!slug || slug.trim().length === 0) {
    console.error('[SeoMetadataSearch] Empty slug provided');
    return null;
  }

  // Validate environment
  if (!ES_URL || !ES_API_KEY) {
    console.error('[SeoMetadataSearch] Missing ES_URL or ES_API_KEY');
    return null;
  }

  try {
    const esQuery = buildSeoQuery(slug.trim());

    const response = await fetch(`${ES_URL}/${SEO_INDEX}/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `ApiKey ${ES_API_KEY}`
      },
      body: JSON.stringify({
        query: esQuery,
        size: 1,
        _source: [
          'id', 'slug', 'page_type',
          'title', 'title_web', 'meta_description', 'meta_keywords',
          'og_title', 'og_description', 'og_image',
          'twitter_title', 'twitter_description', 'twitter_image',
          'canonical_url', 'schema_type', 'schema_json', 'breadcrumb_json',
          'content_above', 'content_below',
          'is_active', 'is_default', 'cached_html',
          'social_tags'
        ]
      })
    });

    if (!response.ok) {
      console.error('[SeoMetadataSearch] ES request failed:', response.status);
      return null;
    }

    const data = await response.json();
    const hits = data?.hits?.hits || [];

    if (hits.length === 0) {
      return null;
    }

    // Parse first hit
    return parseSeoHit(hits[0]._source);

  } catch (error) {
    console.error('[SeoMetadataSearch] Search failed:', error);
    return null;
  }
}

/**
 * Build ElasticSearch query for SEO metadata
 * Matches v1 logic: exact slug match + is_active filter
 */
function buildSeoQuery(slug: string) {
  return {
    bool: {
      must: [
        { term: { slug } },
        { term: { is_active: true } }
      ]
    }
  };
}

/**
 * Parse ElasticSearch hit into typed result
 */
function parseSeoHit(source: any): SeoMetadataResult {
  return {
    id: source.id,
    slug: source.slug || '',
    pageType: source.page_type,
    title: source.title,
    titleWeb: source.title_web,
    metaDescription: source.meta_description,
    metaKeywords: source.meta_keywords,
    ogTitle: source.og_title,
    ogDescription: source.og_description,
    ogImage: source.og_image,
    twitterTitle: source.twitter_title,
    twitterDescription: source.twitter_description,
    twitterImage: source.twitter_image,
    canonicalUrl: source.canonical_url,
    schemaType: source.schema_type,
    schemaJson: source.schema_json,
    breadcrumbJson: source.breadcrumb_json,
    contentAbove: source.content_above,
    contentBelow: source.content_below,
    isActive: source.is_active,
    isDefault: source.is_default,
    cachedHtml: source.cached_html,
    socialTags: source.social_tags
  };
}
```

---

## Related Code Files

### To Create
- `src/services/elasticsearch/seo-metadata-search-service.ts` (NEW)

### To Reference
- `src/services/elasticsearch/location-search-service.ts` (pattern)
- `src/services/elasticsearch/types.ts` (ES response types)

---

## Implementation Steps

1. ☐ Create `seo-metadata-search-service.ts` file
2. ☐ Add environment imports (ES_URL, ES_API_KEY)
3. ☐ Implement `searchSeoMetadata()` function
4. ☐ Implement `buildSeoQuery()` helper
5. ☐ Implement `parseSeoHit()` helper
6. ☐ Add proper TypeScript types
7. ☐ Add error handling and logging
8. ☐ Test with valid slug
9. ☐ Test with invalid slug
10. ☐ Test with missing env vars

---

## Testing

### Manual Tests

1. **Valid Slug**
   ```typescript
   const result = await searchSeoMetadata({ slug: '/mua-ban/ha-noi' });
   // Expected: SeoMetadataResult object with title, contentBelow, etc.
   ```

2. **Invalid Slug**
   ```typescript
   const result = await searchSeoMetadata({ slug: '/invalid-slug-123' });
   // Expected: null
   ```

3. **Empty Slug**
   ```typescript
   const result = await searchSeoMetadata({ slug: '' });
   // Expected: null (with console error)
   ```

4. **3-Part URL (will be handled in service layer)**
   ```typescript
   // Service layer will parse this to 2-part before calling ES
   const slug = '/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty';
   const parsedSlug = '/mua-ban/ha-noi'; // parsed in service
   const result = await searchSeoMetadata({ slug: parsedSlug });
   ```

### Edge Cases
- ✅ Empty string → return null
- ✅ Whitespace only → return null
- ✅ Missing ES_URL → return null
- ✅ Network error → return null
- ✅ Invalid JSON response → return null

---

## Success Criteria

1. ✅ Function queries ElasticSearch `seo_meta_data` index
2. ✅ Returns typed `SeoMetadataResult` or `null`
3. ✅ Filters by `is_active = true`
4. ✅ Handles errors gracefully (no crashes)
5. ✅ Logs errors for debugging
6. ✅ Matches v1 query structure

---

## Security Considerations

- ✅ ES_API_KEY stored in environment (not hardcoded)
- ✅ Slug parameter validated (no injection risk in term query)
- ✅ Response parsed safely (no eval or unsafe operations)

---

## Performance Notes

- ElasticSearch query typically < 50ms
- Single hit retrieval (size: 1)
- No aggregations or complex queries
- Network timeout: inherit from fetch default

---

## Next Steps

After Phase 1 completion:
→ Phase 2: Main SEO service (orchestration + PostgreSQL fallback)
