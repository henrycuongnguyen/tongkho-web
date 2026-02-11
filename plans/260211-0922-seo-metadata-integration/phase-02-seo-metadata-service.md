# Phase 2: SEO Metadata Service (Main Logic)

**Priority:** High
**Status:** Pending
**Dependencies:** Phase 1 (ElasticSearch service)

---

## Overview

Create main SEO metadata service that orchestrates ElasticSearch + PostgreSQL fallback, handles 3-part URL parsing, and returns formatted metadata with defaults.

---

## Context

### v1 Reference
File: `reference/tongkho_v1/controllers/api.py:3487-3796`

**Key Logic:**
1. Parse slug into parts (transaction/location/price)
2. Extract price slug from 3-part URLs
3. Query ElasticSearch first
4. Fallback to PostgreSQL
5. Apply location context to SEO data
6. Return default SEO if not found

```python
slug_parts = slug_local.strip('/').split('/')
if len(slug_parts) == 3:
    slug_local = "/" + slug_parts[0] + "/" + slug_parts[1]
    price_slug = slug_parts[2]

# Try ES first
seo_record = _query_seo_es(slug_local)
if not seo_record:
    seo_record = db(db.seo_meta_data.slug == slug_local).select().first()

if not seo_record:
    return _return_default()
```

---

## Requirements

### Functional
1. Parse URL slug (handle 3-part URLs)
2. Try ElasticSearch first
3. Fallback to PostgreSQL if ES fails/not found
4. Return default SEO if slug not found
5. Format metadata consistently

### Non-Functional
1. Fast response (< 200ms total)
2. Resilient (handle ES downtime)
3. Type-safe
4. Maintainable

---

## Implementation

### File: `src/services/seo/seo-metadata-service.ts`

```typescript
/**
 * SEO Metadata Service
 * Main orchestration service for fetching SEO metadata
 * Handles: ElasticSearch → PostgreSQL → Default fallback
 */

import { searchSeoMetadata } from '../elasticsearch/seo-metadata-search-service';
import { getSeoMetadataFromDb, getDefaultSeoMetadata } from './seo-metadata-db-service';
import type { SeoMetadata, SeoMetadataResult } from './types';

/**
 * Get SEO metadata for a given URL slug
 * Orchestrates: ES → PostgreSQL → Default
 *
 * @param slug - URL path (e.g., '/mua-ban/ha-noi' or '/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty')
 * @returns SEO metadata (always returns object, never null)
 */
export async function getSeoMetadata(slug: string): Promise<SeoMetadata> {
  // Parse slug (handle 3-part URLs)
  const { baseSlug, priceSlug } = parseSlug(slug);

  let seoResult: SeoMetadataResult | null = null;

  // 1. Try ElasticSearch first
  try {
    seoResult = await searchSeoMetadata({ slug: baseSlug });
  } catch (error) {
    console.warn('[SeoMetadata] ElasticSearch failed, trying PostgreSQL:', error);
  }

  // 2. Fallback to PostgreSQL if ES failed or not found
  if (!seoResult) {
    try {
      seoResult = await getSeoMetadataFromDb(baseSlug);
    } catch (error) {
      console.warn('[SeoMetadata] PostgreSQL failed, using default:', error);
    }
  }

  // 3. Use default SEO if still not found
  if (!seoResult) {
    console.info('[SeoMetadata] No SEO found for slug:', baseSlug, '- using default');
    const defaultSeo = await getDefaultSeoMetadata();
    if (defaultSeo) {
      seoResult = defaultSeo;
    }
  }

  // 4. Format and return metadata
  return formatSeoMetadata(seoResult, priceSlug);
}

/**
 * Parse slug into base slug and price slug
 * Handles 3-part URLs: /transaction/location/price → /transaction/location + price
 *
 * Examples:
 * - '/mua-ban/ha-noi' → { baseSlug: '/mua-ban/ha-noi', priceSlug: null }
 * - '/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty' → { baseSlug: '/mua-ban/ha-noi', priceSlug: 'gia-tu-1-ty-den-2-ty' }
 * - '/cho-thue' → { baseSlug: '/cho-thue', priceSlug: null }
 */
function parseSlug(slug: string): { baseSlug: string; priceSlug: string | null } {
  const cleanSlug = slug.trim();
  const parts = cleanSlug.split('/').filter(Boolean);

  // 3-part URL: transaction/location/price
  if (parts.length === 3) {
    const baseSlug = `/${parts[0]}/${parts[1]}`;
    const priceSlug = parts[2];
    return { baseSlug, priceSlug };
  }

  // 2-part or 1-part URL
  return { baseSlug: cleanSlug, priceSlug: null };
}

/**
 * Format raw SEO result into clean SeoMetadata
 * Apply price context if price slug exists
 */
function formatSeoMetadata(
  result: SeoMetadataResult | null,
  priceSlug: string | null
): SeoMetadata {
  if (!result) {
    return getEmptyMetadata();
  }

  // Base metadata
  let metadata: SeoMetadata = {
    title: result.title || '',
    titleWeb: result.titleWeb || result.title || '',
    metaDescription: result.metaDescription || '',
    metaKeywords: result.metaKeywords || '',
    contentAbove: replaceImageUrls(result.contentAbove || ''),
    contentBelow: replaceImageUrls(result.contentBelow || ''),
    ogTitle: result.ogTitle || result.title || '',
    ogDescription: result.ogDescription || result.metaDescription || '',
    ogImage: result.ogImage || '',
    twitterTitle: result.twitterTitle || result.title || '',
    twitterDescription: result.twitterDescription || result.metaDescription || '',
    twitterImage: result.twitterImage || '',
    canonicalUrl: result.canonicalUrl || '',
    schemaType: result.schemaType || '',
    schemaJson: result.schemaJson || '',
    breadcrumbJson: result.breadcrumbJson || ''
  };

  // Apply price context if price slug exists
  if (priceSlug) {
    metadata = applyPriceContext(metadata, priceSlug);
  }

  return metadata;
}

/**
 * Apply price context to SEO metadata
 * Replace {price} placeholder with actual price range
 *
 * Example: "Mua bán nhà đất {price} tại Hà Nội"
 *          → "Mua bán nhà đất giá từ 1 tỷ đến 2 tỷ tại Hà Nội"
 */
function applyPriceContext(metadata: SeoMetadata, priceSlug: string): SeoMetadata {
  const priceDisplay = convertPriceSlugToDisplay(priceSlug);

  if (!priceDisplay) {
    return metadata;
  }

  // Replace {price} placeholder in all text fields
  return {
    ...metadata,
    title: metadata.title.replace(/{price}/gi, priceDisplay),
    titleWeb: metadata.titleWeb?.replace(/{price}/gi, priceDisplay) || metadata.titleWeb,
    metaDescription: metadata.metaDescription?.replace(/{price}/gi, priceDisplay) || metadata.metaDescription,
    ogTitle: metadata.ogTitle?.replace(/{price}/gi, priceDisplay) || metadata.ogTitle,
    ogDescription: metadata.ogDescription?.replace(/{price}/gi, priceDisplay) || metadata.ogDescription,
    twitterTitle: metadata.twitterTitle?.replace(/{price}/gi, priceDisplay) || metadata.twitterTitle,
    twitterDescription: metadata.twitterDescription?.replace(/{price}/gi, priceDisplay) || metadata.twitterDescription
  };
}

/**
 * Convert price slug to display text
 * Examples:
 * - 'gia-tu-1-ty-den-2-ty' → 'giá từ 1 tỷ đến 2 tỷ'
 * - 'gia-duoi-500-trieu' → 'giá dưới 500 triệu'
 * - 'gia-tren-5-ty' → 'giá trên 5 tỷ'
 */
function convertPriceSlugToDisplay(priceSlug: string): string {
  // Match pattern: gia-tu-X-ty-den-Y-ty
  const rangeMatch = priceSlug.match(/gia-tu-(\d+)-ty-den-(\d+)-ty/);
  if (rangeMatch) {
    return `giá từ ${rangeMatch[1]} tỷ đến ${rangeMatch[2]} tỷ`;
  }

  // Match pattern: gia-tu-X-trieu-den-Y-trieu
  const rangeTrieuMatch = priceSlug.match(/gia-tu-(\d+)-trieu-den-(\d+)-trieu/);
  if (rangeTrieuMatch) {
    return `giá từ ${rangeTrieuMatch[1]} triệu đến ${rangeTrieuMatch[2]} triệu`;
  }

  // Match pattern: gia-duoi-X-trieu
  const underTrieuMatch = priceSlug.match(/gia-duoi-(\d+)-trieu/);
  if (underTrieuMatch) {
    return `giá dưới ${underTrieuMatch[1]} triệu`;
  }

  // Match pattern: gia-duoi-X-ty
  const underTyMatch = priceSlug.match(/gia-duoi-(\d+)-ty/);
  if (underTyMatch) {
    return `giá dưới ${underTyMatch[1]} tỷ`;
  }

  // Match pattern: gia-tren-X-ty
  const overTyMatch = priceSlug.match(/gia-tren-(\d+)-ty/);
  if (overTyMatch) {
    return `giá trên ${overTyMatch[1]} tỷ`;
  }

  // Match pattern: gia-tren-X-trieu
  const overTrieuMatch = priceSlug.match(/gia-tren-(\d+)-trieu/);
  if (overTrieuMatch) {
    return `giá trên ${overTrieuMatch[1]} triệu`;
  }

  return '';
}

/**
 * Replace relative image URLs with absolute URLs
 * /uploads/image.jpg → https://quanly.tongkhobds.com/uploads/image.jpg
 */
function replaceImageUrls(content: string): string {
  if (!content) return '';
  return content.replace(/\/uploads\//g, 'https://quanly.tongkhobds.com/uploads/');
}

/**
 * Return empty metadata structure
 */
function getEmptyMetadata(): SeoMetadata {
  return {
    title: '',
    titleWeb: '',
    metaDescription: '',
    metaKeywords: '',
    contentAbove: '',
    contentBelow: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    canonicalUrl: '',
    schemaType: '',
    schemaJson: '',
    breadcrumbJson: ''
  };
}
```

---

## Related Code Files

### To Create
- `src/services/seo/seo-metadata-service.ts` (NEW)

### To Reference
- `src/services/elasticsearch/seo-metadata-search-service.ts` (Phase 1)
- `src/services/seo/seo-metadata-db-service.ts` (Phase 6)
- `src/services/seo/types.ts` (Phase 3)

---

## Implementation Steps

1. ☐ Create `seo-metadata-service.ts` file
2. ☐ Implement `getSeoMetadata()` main function
3. ☐ Implement `parseSlug()` helper
4. ☐ Implement `formatSeoMetadata()` helper
5. ☐ Implement `applyPriceContext()` helper
6. ☐ Implement `convertPriceSlugToDisplay()` helper
7. ☐ Implement `replaceImageUrls()` helper
8. ☐ Implement `getEmptyMetadata()` helper
9. ☐ Add error handling for all fallbacks
10. ☐ Test all URL patterns
11. ☐ Test fallback logic (ES → DB → Default)

---

## Testing

### Test Cases

1. **2-Part URL (Transaction + Location)**
   ```typescript
   const result = await getSeoMetadata('/mua-ban/ha-noi');
   // Expected: Returns metadata from ES or DB
   ```

2. **3-Part URL (With Price)**
   ```typescript
   const result = await getSeoMetadata('/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty');
   // Expected: Parses to '/mua-ban/ha-noi', applies price context
   // title: "Mua bán nhà đất {price} tại Hà Nội" → "Mua bán nhà đất giá từ 1 tỷ đến 2 tỷ tại Hà Nội"
   ```

3. **1-Part URL (Transaction Only)**
   ```typescript
   const result = await getSeoMetadata('/cho-thue');
   // Expected: Returns metadata for '/cho-thue'
   ```

4. **Not Found (Fallback to Default)**
   ```typescript
   const result = await getSeoMetadata('/invalid-slug-123');
   // Expected: Returns default SEO metadata
   ```

5. **ES Down (Fallback to PostgreSQL)**
   ```typescript
   // Mock ES to fail
   const result = await getSeoMetadata('/mua-ban/ha-noi');
   // Expected: Still returns metadata from PostgreSQL
   ```

### Edge Cases
- ✅ Empty slug → returns default
- ✅ Slug with trailing slash → normalized
- ✅ Slug without leading slash → normalized
- ✅ 4+ part URL → treats as invalid, returns default
- ✅ Price slug without match → returns metadata without price replacement

---

## Success Criteria

1. ✅ Orchestrates ES → PostgreSQL → Default fallback
2. ✅ Handles 3-part URLs correctly
3. ✅ Applies price context to placeholders
4. ✅ Returns consistent SeoMetadata structure
5. ✅ Never returns null (always has fallback)
6. ✅ Replaces image URLs to absolute paths

---

## Performance Notes

- ElasticSearch: ~50ms
- PostgreSQL: ~20ms
- Total: < 200ms (including fallbacks)
- Caching: Not implemented (rely on SSG rebuild)

---

## Next Steps

After Phase 2 completion:
→ Phase 3: Type definitions
→ Phase 6: PostgreSQL fallback service
