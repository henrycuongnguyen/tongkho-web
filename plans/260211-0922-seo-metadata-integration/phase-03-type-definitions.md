# Phase 3: Type Definitions

**Priority:** High
**Status:** Pending
**Dependencies:** None (can be done in parallel with Phase 1)

---

## Overview

Define TypeScript types for SEO metadata service, matching database schema and ensuring type safety across all components.

---

## Context

### Database Schema
File: `src/db/migrations/schema.ts:1796-1830`

```typescript
export const seoMetaData = pgTable("seo_meta_data", {
  id: serial().primaryKey().notNull(),
  slug: varchar({ length: 255 }).notNull(),
  pageType: varchar("page_type", { length: 64 }),
  title: varchar({ length: 255 }),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  ogTitle: varchar("og_title", { length: 512 }),
  ogDescription: text("og_description"),
  ogImage: varchar("og_image", { length: 512 }),
  twitterTitle: varchar("twitter_title", { length: 512 }),
  twitterDescription: text("twitter_description"),
  twitterImage: varchar("twitter_image", { length: 512 }),
  canonicalUrl: varchar("canonical_url", { length: 512 }),
  schemaType: varchar("schema_type", { length: 512 }),
  schemaJson: text("schema_json"),
  breadcrumbJson: text("breadcrumb_json"),
  contentAbove: text("content_above"),
  contentBelow: text("content_below"),
  isActive: boolean("is_active"),
  // ... other fields
  titleWeb: varchar("title_web"),
  cachedHtml: text("cached_html"),
});
```

---

## Requirements

### Type Categories
1. **Database Result Type:** Raw data from DB/ES queries
2. **Service Response Type:** Formatted data for application use
3. **API Response Type:** Optional, for HTTP endpoint (Phase 4)

---

## Implementation

### File: `src/services/seo/types.ts`

```typescript
/**
 * SEO Metadata Type Definitions
 */

/**
 * Raw SEO metadata result from database or ElasticSearch
 * Maps directly to seo_meta_data table schema
 */
export interface SeoMetadataResult {
  id?: number;
  slug: string;
  pageType?: string | null;
  title?: string | null;
  titleWeb?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  twitterTitle?: string | null;
  twitterDescription?: string | null;
  twitterImage?: string | null;
  canonicalUrl?: string | null;
  schemaType?: string | null;
  schemaJson?: string | null;
  breadcrumbJson?: string | null;
  contentAbove?: string | null;
  contentBelow?: string | null;
  isActive?: boolean | null;
  isDefault?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  orderby?: number | null;
  cachedHtml?: string | null;
  socialTags?: string | null;
}

/**
 * Formatted SEO metadata for application use
 * All fields guaranteed to be non-null (empty string if missing)
 */
export interface SeoMetadata {
  /** Page title (H1) - Use titleWeb if available, otherwise title */
  title: string;

  /** Web-specific title (for display, not meta tag) */
  titleWeb?: string;

  /** Meta description */
  metaDescription?: string;

  /** Meta keywords */
  metaKeywords?: string;

  /** Content to display above listings */
  contentAbove?: string;

  /** Content to display below listings (main SEO content) */
  contentBelow?: string;

  /** Open Graph title */
  ogTitle?: string;

  /** Open Graph description */
  ogDescription?: string;

  /** Open Graph image URL */
  ogImage?: string;

  /** Twitter card title */
  twitterTitle?: string;

  /** Twitter card description */
  twitterDescription?: string;

  /** Twitter card image URL */
  twitterImage?: string;

  /** Canonical URL */
  canonicalUrl?: string;

  /** Schema.org type (e.g., 'WebPage', 'Product') */
  schemaType?: string;

  /** Schema.org JSON-LD markup */
  schemaJson?: string;

  /** Breadcrumb JSON-LD markup */
  breadcrumbJson?: string;
}

/**
 * Options for fetching SEO metadata
 */
export interface SeoMetadataOptions {
  /** URL slug (e.g., '/mua-ban/ha-noi') */
  slug: string;

  /** Whether to apply price context (default: true) */
  applyPriceContext?: boolean;

  /** Whether to replace image URLs (default: true) */
  replaceImageUrls?: boolean;
}

/**
 * API response wrapper (optional - for Phase 4)
 */
export interface SeoMetadataApiResponse {
  status: 'success' | 'error';
  data?: SeoMetadata;
  message?: string;
}

/**
 * ElasticSearch hit type for SEO metadata
 */
export interface SeoMetadataESHit {
  _index: string;
  _id: string;
  _score: number;
  _source: SeoMetadataResult;
}

/**
 * ElasticSearch response type for SEO metadata
 */
export interface SeoMetadataESResponse {
  took: number;
  timed_out: boolean;
  hits: {
    total: {
      value: number;
      relation: string;
    };
    max_score: number | null;
    hits: SeoMetadataESHit[];
  };
}
```

---

## Type Usage Examples

### In ElasticSearch Service
```typescript
import type { SeoMetadataResult } from '../seo/types';

export async function searchSeoMetadata(
  options: { slug: string }
): Promise<SeoMetadataResult | null> {
  // Query ES and return SeoMetadataResult
}
```

### In Main Service
```typescript
import type { SeoMetadata, SeoMetadataResult } from './types';

export async function getSeoMetadata(slug: string): Promise<SeoMetadata> {
  const result: SeoMetadataResult | null = await searchSeoMetadata({ slug });
  return formatSeoMetadata(result);
}
```

### In Listing Page
```typescript
import type { SeoMetadata } from '@/services/seo/types';

const seoMetadata: SeoMetadata = await getSeoMetadata(currentPath);
```

---

## Related Code Files

### To Create
- `src/services/seo/types.ts` (NEW)

### To Reference
- `src/db/migrations/schema.ts` (database schema)
- `src/services/elasticsearch/types.ts` (ES response patterns)

---

## Implementation Steps

1. ☐ Create `types.ts` file in `src/services/seo/`
2. ☐ Define `SeoMetadataResult` interface (DB schema mapping)
3. ☐ Define `SeoMetadata` interface (app usage)
4. ☐ Define `SeoMetadataOptions` interface (fetch options)
5. ☐ Define `SeoMetadataApiResponse` interface (API response)
6. ☐ Define `SeoMetadataESHit` interface (ES hit type)
7. ☐ Define `SeoMetadataESResponse` interface (ES response)
8. ☐ Add JSDoc comments for all types
9. ☐ Verify type compatibility with schema

---

## Type Safety Checklist

- ✅ All DB fields mapped to `SeoMetadataResult`
- ✅ All fields in `SeoMetadata` are nullable (optional)
- ✅ `title` field is required in `SeoMetadata` (non-nullable string)
- ✅ ES response types match actual ElasticSearch structure
- ✅ Type imports don't create circular dependencies

---

## Success Criteria

1. ✅ Types defined for all SEO metadata structures
2. ✅ Type-safe across all service layers
3. ✅ No TypeScript errors in service files
4. ✅ JSDoc comments for developer clarity
5. ✅ Compatible with existing DB schema

---

## Next Steps

After Phase 3 completion:
→ Use types in Phase 1 (ElasticSearch service)
→ Use types in Phase 2 (Main service)
→ Use types in Phase 5 (Listing page integration)
