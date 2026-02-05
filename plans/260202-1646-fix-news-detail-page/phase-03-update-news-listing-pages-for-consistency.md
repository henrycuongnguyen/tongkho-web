# Phase 3: Update News Listing Pages for Consistency

## Context

- Plan: [plan.md](./plan.md)
- Depends on: [Phase 1](./phase-01-add-get-news-by-slug-method-to-postgres-service.md)

## Overview

- **Priority**: P2
- **Status**: pending
- **Estimate**: 30 minutes

## Key Insights

1. News listing pages use `mockNews` for article list
2. Links point to `/tin-tuc/${article.slug}`
3. Slugs from mockNews won't match slugs from PostgreSQL
4. Must use same data source for listing and detail pages

## Requirements

### Functional
- Update index page to use PostgreSQL service
- Ensure slugs match between listing and detail pages
- Maintain pagination functionality
- Keep category filtering working

### Non-Functional
- Consistent data source across all news pages
- Fallback to mock data when DB unavailable

## Pages to Update

| Page | Path | Current Source |
|------|------|----------------|
| News Index | `/tin-tuc/index.astro` | mockNews |
| Pagination | `/tin-tuc/trang/[page].astro` | mockNews |
| Category | `/tin-tuc/danh-muc/[category].astro` | mockNews |

## Related Code Files

### Files to Modify
- `src/pages/tin-tuc/index.astro`
- `src/pages/tin-tuc/trang/[page].astro` (optional - can keep mock for pagination demo)
- `src/pages/tin-tuc/danh-muc/[category].astro` (optional)

### Files for Reference
- `src/services/postgres-news-project-service.ts`
- `src/components/home/news-section.astro`

## Implementation Steps

### For index.astro (Required)

1. Import `postgresNewsProjectService`
2. Replace `mockNews` usage with `await postgresNewsProjectService.getLatestNews(limit)`
3. Update category counts to use fetched data
4. Popular articles sidebar can use same data sorted by views

### Code Changes

```typescript
// Before
import { mockNews } from '@/data/mock-properties';
const sortedNews = [...mockNews].sort(...);

// After
import { postgresNewsProjectService } from '@/services/postgres-news-project-service';
const allNews = await postgresNewsProjectService.getLatestNews(50);
const sortedNews = [...allNews].sort(...);
```

### For Other Pages (Optional)

Pagination and category pages can be updated later or kept with mock data for now, as primary fix is the detail page 404.

## Todo List

- [ ] Update `/tin-tuc/index.astro` to use PostgreSQL service
- [ ] Verify article links work with new slugs
- [ ] Test category counts calculation
- [ ] Verify popular articles sidebar

## Success Criteria

- [ ] Listing page shows real articles from DB
- [ ] Clicking article links opens detail page (no 404)
- [ ] Category counts are accurate
- [ ] Fallback works when DB unavailable

## Risk Assessment

- **Pagination mismatch**: Index shows page 1 from DB, but `/trang/[page]` may use mock
- **Mitigation**: Either update all pages or note limitation

## Next Steps

After completion, proceed to Phase 4: Testing & Verification
