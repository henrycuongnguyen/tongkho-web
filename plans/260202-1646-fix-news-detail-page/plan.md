---
title: "Fix News Detail Page 404 Error"
description: "Fix news detail page returning 404 and replace mock data with real PostgreSQL data"
status: completed
priority: P1
effort: 2h
branch: main
tags: [bugfix, news, postgresql, astro]
created: 2026-02-02
completed: 2026-02-02
---

# Fix News Detail Page 404 Error

## Summary

The news detail page at `/tin-tuc/[slug]` returns 404 errors. Root cause analysis:

1. **Mock data mismatch**: Page uses `mockNews` to find articles by slug, but actual articles from PostgreSQL have different slugs (generated dynamically from title)
2. **Missing PostgreSQL method**: `PostgresNewsProjectService` lacks `getNewsBySlug()` method
3. **No SSR data fetching**: Page doesn't fetch from real database during server-side render

## Current State Analysis

### Routing Structure
- `/tin-tuc/` - News listing (index.astro) - uses mockNews
- `/tin-tuc/[slug]` - News detail (dynamic) - uses mockNews
- `/tin-tuc/trang/[page]` - Pagination pages
- `/tin-tuc/danh-muc/[category]` - Category pages

### Data Sources Available
| Service | Purpose | Has getBySlug? |
|---------|---------|----------------|
| `postgres-news-project-service.ts` | News & Projects | No |
| `elasticsearch-property-service.ts` | Properties | N/A |
| `postgres-property-service.ts` | Property details | Yes |

### Current News Detail Page Flow
```
/tin-tuc/[slug] → mockNews.find(a => a.slug === slug) → 404 if not found
```

### Required Flow
```
/tin-tuc/[slug] → PostgresNewsProjectService.getNewsBySlug(slug) → render article
```

## Phases

| Phase | Description | Status | Est. |
|-------|-------------|--------|------|
| 1 | Add getNewsBySlug method to PostgresNewsProjectService | ✅ completed | 30m |
| 2 | Update news detail page to use real data | ✅ completed | 45m |
| 3 | Update news listing pages for consistency | ✅ completed | 30m |
| 4 | Test & verify all news pages | ✅ completed | 15m |

## Files to Modify

- `src/services/postgres-news-project-service.ts` - Add getNewsBySlug method
- `src/pages/tin-tuc/[slug].astro` - Use PostgreSQL service
- `src/pages/tin-tuc/index.astro` - Use PostgreSQL service for consistency
- `src/components/home/news-section.astro` - Already accepts props, may need homepage update

## Success Criteria

- [x] News detail page renders correctly for real articles
- [x] No 404 errors for valid news slugs
- [x] Fallback to mock data when DB unavailable
- [x] Related articles sidebar works
- [x] SEO meta tags populated from real data

## Code Review Results

**Score:** 8.5/10 ✅ **APPROVED FOR MERGE**

**Report:** [plans/reports/code-reviewer-260202-1655-news-detail-404-fix.md](../reports/code-reviewer-260202-1655-news-detail-404-fix.md)

**Key Findings:**
- ✅ Zero critical issues, zero security vulnerabilities
- ✅ Build passes with no errors
- ⚠️ Performance: N+1 query pattern (fetch all, filter in-memory)
- ⚠️ DRY violation: generateSlug() duplicated in service and utils
- ⚠️ Minor: unused imports need cleanup

**Required Before Merge:**
1. Remove duplicate generateSlug() from service, import from utils
2. Clean unused imports (formatRelativeTime, unused types)

**Recommended After Merge:**
1. Add caching layer for slug lookups (5-min TTL)
2. Integrate error monitoring (Sentry)
3. Fix view count logic (currently random)

## Risks

- **DB connection issues**: Mitigated by mock data fallback pattern
- **Slug format mismatch**: May need slug normalization

## Related Files

- [Phase 1: Add getNewsBySlug to PostgreSQL Service](./phase-01-add-get-news-by-slug-method-to-postgres-service.md)
- [Phase 2: Update News Detail Page](./phase-02-update-news-detail-page-to-use-postgres-data.md)
- [Phase 3: Update News Listing Pages](./phase-03-update-news-listing-pages-for-consistency.md)
