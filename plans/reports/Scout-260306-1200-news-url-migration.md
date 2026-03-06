# Scout Report: News URL Migration Implementation

**Date:** 2026-03-06 | **Status:** Complete

## Executive Summary

Successfully identified all files, components, and implementation patterns for news system URL migration. System uses `/tin-tuc/` URLs (detail + listing + folders) with hardcoded folder IDs [26, 27, 37]. Migration targets: `/tin/{slug}` (detail), `/chuyenmuc/{folder}` (folders).

## Route Files Identified

### Current Routes (tin-tuc/)
1. **d:\worktrees\tongkho-web-feature-menu\src\pages\tin-tuc\index.astro**
   - News listing (page 1) - URL: `/tin-tuc`
   - Fetches 9-item paginated list from `getLatestNews(100)`
   - Has category filter links

2. **d:\worktrees\tongkho-web-feature-menu\src\pages\tin-tuc\[slug].astro**
   - Article detail page - URL: `/tin-tuc/{slug}`
   - Uses `getNewsBySlug(slug)` from service
   - Shows full article + related articles sidebar
   - Generates article URL at line 48: `const articleUrl = `/tin-tuc/${article.slug}`;`

3. **d:\worktrees\tongkho-web-feature-menu\src\pages\tin-tuc\trang\[page].astro**
   - Paginated listing - URL: `/tin-tuc/trang/{page}`
   - SSR (prerender: false)
   - Returns redirect to `/tin-tuc` if page < 2

4. **d:\worktrees\tongkho-web-feature-menu\src\pages\tin-tuc\danh-muc\[folder].astro**
   - Folder page (SSG) - URL: `/tin-tuc/danh-muc/{folder-name}`
   - Generates static pages for all published folders at build
   - Uses `getStaticPaths()` to fetch folders from DB
   - TODO: Filter articles by folder (currently shows all 20 latest)

5. **d:\worktrees\tongkho-web-feature-menu\src\pages\tin-tuc\danh-muc\[category].astro**
   - Category filter page (SSR) - URL: `/tin-tuc/danh-muc/{category-slug}`
   - Hardcoded categories: thi-truong, kien-thuc, chinh-sach, du-an, dau-tu
   - Filters articles by category

## Components Generating News URLs

### 8 Files Using `/tin-tuc/` URLs
1. **d:\worktrees\tongkho-web-feature-menu\src\components\home\news-section.astro**
   - Line 36, 21: `href={/tin-tuc/${article.slug}}`

2. **d:\worktrees\tongkho-web-feature-menu\src\components\news\news-related-articles-sidebar.astro**
   - Line 58, 95: `href={/tin-tuc/${article.slug}}` + `/tin-tuc` link

3. **d:\worktrees\tongkho-web-feature-menu\src\pages\tin-tuc\index.astro**
   - Line 99, 114, 135: Category links to `/tin-tuc/danh-muc/{slug}`
   - Line 92: Link to `/tin-tuc`
   - Line 143: `href={/tin-tuc/${article.slug}}`

4. **d:\worktrees\tongkho-web-feature-menu\src\pages\tin-tuc\trang\[page].astro**
   - Similar pattern to index.astro

5. **d:\worktrees\tongkho-web-feature-menu\src\pages\tin-tuc\[slug].astro**
   - Line 48: `const articleUrl = /tin-tuc/${article.slug}`
   - Line 88: Link to `/tin-tuc`
   - Line 159, 162: Links to `/tin-tuc?category=` + `/tin-tuc`

6. **d:\worktrees\tongkho-web-feature-menu\src\pages\tin-tuc\danh-muc\[folder].astro**
   - Line 71: `href={/tin-tuc/${article.slug}}`

7. **d:\worktrees\tongkho-web-feature-menu\src\services\menu-service.ts**
   - Line 330: Folder URLs - `const href = /tin-tuc/danh-muc/${slug}`
   - Line 390: Main menu - `href: "/tin-tuc"`
   - Line 419: Footer menu - `href: "/tin-tuc"`

8. **d:\worktrees\tongkho-web-feature-menu\src\components\footer\footer.astro**
   - Line 24: `href: '/tin-tuc'`

9. **d:\worktrees\tongkho-web-feature-menu\src\components\ui\pagination.astro**
   - Line 9: Comment mentions pagination URL pattern

## Service Implementation

### PostgreSQL News Service
**File:** d:\worktrees\tongkho-web-feature-menu\src\services\postgres-news-project-service.ts

**Hardcoded Folder IDs (line 16):**
```typescript
const NEWS_FOLDERS = [26, 27, 37];
// 26: quy-hoach-phap-ly
// 27: noi-ngoai-that
// 37: phong-thuy-nha-o
```

**Key Methods:**
- `getNewsBySlug(slug)` - Fetches by generated slug, filters by folder
- `getLatestNews(limit)` - Gets articles ordered by publishOn DESC, filters by folder
- Uses `generateSlug()` utility for slug generation

**Query Filters:**
- WHERE: `aactive=true AND folder IN (26,27,37) AND avatar IS NOT NULL AND avatar != ''`
- ORDER: `publishOn DESC NULLS LAST, id DESC`

## Schema Files

### News Schema
**File:** d:\worktrees\tongkho-web-feature-menu\src\db\schema\news.ts

Fields: id, name, description, htmlcontent, avatar, folder, publishOn, createdOn, displayOrder, aactive, locations, versionDocs

### Menu/Folder Schema
**File:** d:\worktrees\tongkho-web-feature-menu\src\db\schema\menu.ts

Folder table (lines 21-28):
- id, parent, name, label, publish, displayOrder
- Used in [folder].astro to generate static paths

## URL Building Patterns

### Article Detail URLs
- **Current:** `/tin-tuc/{slug}`
  - Built with template literal: `href={/tin-tuc/${article.slug}}`
  - generateSlug() converts title to slug
  
- **Target:** `/tin/{slug}`
  - Same slug generation logic, different base path

### Folder URLs
- **Current:** `/tin-tuc/danh-muc/{folder-name}`
  - Built in menu-service.ts line 330
  - Uses folder.name directly

- **Target:** `/chuyenmuc/{folder-name}`
  - Same folder name, different base path

### Category URLs
- **Current:** `/tin-tuc/danh-muc/{category-slug}`
  - Hardcoded in index.astro and [category].astro
  - Slugs: thi-truong, kien-thuc, chinh-sach, du-an, dau-tu

- **Target:** Unknown (kept same or migrate?)
  - Decision needed if categories stay under /chuyenmuc or move to /tin/danh-muc

## Pagination Pattern

Component: `src\components\ui\pagination.astro` (lines 15-18)
- Page 1: Uses baseUrl only (e.g., `/tin-tuc`)
- Page 2+: `${baseUrl}/trang/{page}` (e.g., `/tin-tuc/trang/2`)

**Migration Impact:**
- Need to update baseUrl param in pagination calls
- Pagination logic stays same

## Dependencies & Integration Points

### Service Dependencies
- postgres-news-project-service: Used by all route files
- menu-service: Generates folder navigation

### Shared Utilities
- generateSlug() - slug generation (consistent across system)
- formatRelativeTime() - relative date formatting

### Data Flow
1. Routes call service methods
2. Service queries DB with folder/category filters
3. Service maps NewsRow to NewsArticle type
4. Components receive articles, generate URLs in JSX/templates

## Build Configuration

README.md mentions:
- "✅ **27 dynamic news folder pages** generated at /tin-tuc/danh-muc/{folder-name}"
- These are SSG (prerender: true) in [folder].astro

## Unresolved Questions

1. **Category URL migration**: Should `/tin-tuc/danh-muc/{category}` migrate to `/tin/danh-muc/{category}` or `/chuyenmuc/{category}`?
2. **Pagination base URL**: What's new pagination URL pattern after migration?
3. **Redirect strategy**: Need permanent 301 redirects from old → new URLs for SEO?
4. **Folder article filtering**: [folder].astro has TODO for folder filtering - should this be implemented during migration?
5. **Menu data integration**: Does news system need v1 parity in folder hierarchy/labels?

