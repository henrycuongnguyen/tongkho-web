# Phase 2: Update News Detail Page to Use PostgreSQL Data

## Context

- Plan: [plan.md](./plan.md)
- Depends on: [Phase 1](./phase-01-add-get-news-by-slug-method-to-postgres-service.md)
- Page: `src/pages/tin-tuc/[slug].astro`

## Overview

- **Priority**: P1
- **Status**: ✅ completed
- **Estimate**: 45 minutes
- **Completed**: 2026-02-02

## Key Insights

1. Page currently imports `mockNews` and finds article by slug
2. Astro SSR mode enabled (`output: "server"` in astro.config.mjs)
3. Page already handles 404 redirect when article not found
4. Related articles sidebar needs same category articles

## Requirements

### Functional
- Fetch article from PostgreSQL by slug
- Display real article content (htmlcontent from DB)
- Related articles from same category
- SEO meta tags from real data

### Non-Functional
- Graceful fallback to mock data
- Consistent error handling
- Performance: single DB query for article

## Architecture

### Current Flow
```
[slug].astro → mockNews.find() → render or 404
```

### New Flow
```
[slug].astro → postgresNewsProjectService.getNewsBySlug() → render or 404
```

## Related Code Files

### Files to Modify
- `src/pages/tin-tuc/[slug].astro`

### Files for Reference
- `src/pages/bds/[slug].astro` (property detail pattern)
- `src/services/postgres-news-project-service.ts`

## Implementation Steps

1. Import `postgresNewsProjectService` instead of `mockNews`
2. Call `await postgresNewsProjectService.getNewsBySlug(slug)`
3. Keep 404 redirect logic for null result
4. Update related articles to fetch from service (or keep mock for now)
5. Ensure article.content renders correctly (HTML from DB)

## Code Changes

### Before (lines 10-18)
```typescript
import { mockNews } from '@/data/mock-properties';

// Get slug from URL params
const { slug } = Astro.params;

// Find article by slug
const article = mockNews.find((a) => a.slug === slug);
```

### After
```typescript
import { postgresNewsProjectService } from '@/services/postgres-news-project-service';

// Get slug from URL params
const { slug } = Astro.params;

// Fetch article from PostgreSQL
const article = slug ? await postgresNewsProjectService.getNewsBySlug(slug) : null;
```

## Todo List

- [x] Update import to use postgresNewsProjectService
- [x] Replace mockNews.find with service call
- [x] Verify article content renders (HTML from DB)
- [x] Test with real DB slug
- [x] Test 404 behavior for invalid slug
- [x] Verify related articles sidebar works

## Success Criteria

- [x] Page renders for valid slugs from DB
- [x] 404 redirect for invalid slugs
- [x] Article content displays correctly
- [x] SEO meta tags populated
- [x] No console errors

## Implementation Notes

**Code Changes:** `src/pages/tin-tuc/[slug].astro:10-18`

**Before:**
```typescript
import { mockNews } from '@/data/mock-properties';
const article = mockNews.find((a) => a.slug === slug);
```

**After:**
```typescript
import { postgresNewsProjectService } from '@/services/postgres-news-project-service';
const article = slug ? await postgresNewsProjectService.getNewsBySlug(slug) : null;
```

**Review Findings:**
- ⚠️ Unused imports: formatRelativeTime, NewsArticle type (cleanup needed)
- ✅ 404 redirect works correctly
- ✅ HTML content renders via set:html attribute
- ✅ SEO meta tags populated from real data
- ✅ Related articles sidebar functional

## Risk Assessment

- **HTML content rendering**: DB stores raw HTML in `htmlcontent`, should render via `set:html`
- **Image URLs**: Service already handles full URL conversion

## Next Steps

After completion, proceed to [Phase 3: Update News Listing Pages](./phase-03-update-news-listing-pages-for-consistency.md)
