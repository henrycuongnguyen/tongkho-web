# Brainstorm: News URL & Data Alignment (v1 vs v2)

**Date:** 2026-03-06
**Session:** Brainstorming news implementation differences between v1 and v2
**Goal:** Align v2 news URLs and data fetching with v1 logic

---

## Problem Statement

v2 news pages use different URL structure and data fetching approach compared to v1:

### URL Differences
- **v1**: `/chuyenmuc/du-an-noi-bat` (direct folder slug)
- **v2**: `/tin-tuc/danh-muc/du-an-noi-bat` (nested under `/tin-tuc/danh-muc/`)

### Data Fetching Differences
- **v1**: Dynamic folder-based queries using `cms.get_content(tablename='news', folder=folder_id)`
- **v2**: Hardcoded 5 categories (market, policy, tips, project_news, investment) with only 3 mapped to database folders (26, 27, 37)

---

## V1 Implementation Analysis

### URL Structure
```python
# api.py:3634-3645
elif '/chuyenmuc/' in slug:
    folder_id = slug.split('/chuyenmuc/')[-1].split('/')[0]
    folder = db(db.folder.name == folder_id).select().first()
```
- Pattern: `/chuyenmuc/{folder.name}` where `folder.name` is the slug
- Example: `/chuyenmuc/du-an-noi-bat` → queries `db.folder.name == 'du-an-noi-bat'`

### Data Fetching
```python
# api_customer.py:5703-5726
folder_id = cms.get_folder(folder)  # Convert slug to ID
rows = cms.get_content(
    tablename='news',
    folder=folder_id,
    page=int(page),
    length=int(length),
    orderby=db.news.display_order | ~db.news.id
)
count = cms.get_count(tablename='news', folder=folder_id)
```
- Query by `folder` column in news table
- Sort by: `display_order ASC, id DESC`
- Pagination: `page` and `length` params
- News detail URL: `/tin/{news_slug}` (line 5732)

### Database Schema
**folder table:**
- `id`: Primary key
- `name`: URL slug (e.g., "du-an-noi-bat")
- `label`: Display name (e.g., "Dự án nổi bật")
- `parent`: Parent folder ID for hierarchy
- `publish`: 'T' or 'F' for published status
- `display_order`: Sort order

**news table:**
- `folder`: Foreign key to folder.id
- `display_order`: Sort order
- News are assigned to folders via `folder` column

---

## V2 Implementation Analysis

### URL Structure
**Two routing systems:**

1. **Hardcoded Categories** (SSR)
   - Route: `tin-tuc/danh-muc/[category].astro`
   - URLs: `/tin-tuc/danh-muc/thi-truong`, `/tin-tuc/danh-muc/kien-thuc`, etc.
   - 5 categories: market, policy, tips, project_news, investment

2. **Database Folders** (SSG)
   - Route: `tin-tuc/danh-muc/[folder].astro`
   - Generated from database at build time (27 pages)
   - Uses folder hierarchy from `db.folder` table

### Data Fetching
**Service:** `postgres-news-project-service.ts`

```typescript
// Hardcoded folder filter
const NEWS_FOLDERS = [26, 27, 37];

// Category mapping
const categoryMap: Record<number, NewsArticle["category"]> = {
  26: "policy",      // quy-hoach-phap-ly
  27: "tips",        // noi-ngoai-that
  37: "tips",        // phong-thuy-nha-o
};
```

**Issues:**
- Only 3 folders have articles (26, 27, 37)
- 5 frontend categories but only 2 mapped (policy, tips)
- Categories "market" and "investment" return 0 results
- Hardcoded approach doesn't scale with new folders

### News Detail URL
- **NOT aligned with v1**: v2 uses `/tin-tuc/{slug}`, v1 uses `/tin/{slug}`
- Route file: `src/pages/tin-tuc/[slug].astro`
- 8 files reference `/tin-tuc/` URLs need updating

---

## Key Differences Summary

| Aspect | v1 | v2 |
|--------|-----|-----|
| **Folder URL** | `/chuyenmuc/{folder.name}` | `/tin-tuc/danh-muc/{folder.name}` |
| **Query Method** | `cms.get_content(folder=folder_id)` | Hardcoded folder IDs `[26, 27, 37]` |
| **Sort Order** | `display_order ASC, id DESC` | `publishOn DESC, id DESC` |
| **Pagination** | API params `page`, `length` | Static `ITEMS_PER_PAGE = 9` |
| **News Detail** | `/tin/{slug}` ✅ | `/tin-tuc/{slug}` ❌ (wrong prefix) |
| **Folder Filter** | Dynamic (any folder) | Static (only 3 folders) |

---

## Approaches Evaluated

### Approach 1: Direct v1 URL Structure (RECOMMENDED)
**Change v2 URLs to match v1 exactly**

**Pros:**
- ✅ Perfect backward compatibility with v1 URLs
- ✅ SEO continuity (no redirects needed)
- ✅ Simpler routing (single dynamic route)
- ✅ Consistent with existing v1 URLs in search engines

**Cons:**
- ⚠️ Requires refactoring existing v2 routes
- ⚠️ Breaking change for any v2 URLs already indexed

**Implementation:**
1. Create `src/pages/chuyenmuc/[folder].astro` (SSR)
2. Query: `db.folder.name == folder_slug`
3. Fetch news: `db.news.folder == folder_id`
4. Sort: `display_order ASC, id DESC`
5. Remove `/tin-tuc/danh-muc/` routes
6. Add 301 redirects: `/tin-tuc/danh-muc/*` → `/chuyenmuc/*`

**Risk Assessment:**
- **Low Risk**: v2 likely not in production yet
- **High ROI**: Perfect v1 compatibility
- **Migration**: Simple redirect rules

---

### Approach 2: Hybrid URLs with Redirects
**Keep v2 URLs but add 301 redirects from v1 URLs**

**Pros:**
- ✅ No breaking changes to v2
- ✅ v1 URLs still work via redirects
- ✅ Gradual migration possible

**Cons:**
- ❌ SEO penalty from redirect chains
- ❌ Two URL patterns for same content
- ❌ Increased complexity
- ❌ Slower page load (redirect hop)

**Implementation:**
1. Keep `tin-tuc/danh-muc/[folder].astro`
2. Add redirect: `/chuyenmuc/*` → `/tin-tuc/danh-muc/*`
3. Update data fetching to match v1 logic

**Risk Assessment:**
- **Medium Risk**: SEO implications
- **Low ROI**: Doesn't solve root issue
- **Technical Debt**: Maintains two patterns

---

### Approach 3: Consolidate Under `/tin-tuc`
**Move everything to `/tin-tuc/{folder}` (new pattern)**

**Pros:**
- ✅ Cleaner v2 structure
- ✅ Vietnamese term "tin-tuc" more intuitive
- ✅ Consistent with news detail URLs

**Cons:**
- ❌ Breaks both v1 AND v2 URLs
- ❌ Requires extensive redirects
- ❌ SEO impact from changing v1 URLs
- ❌ Not backward compatible

**Implementation:**
1. Create `tin-tuc/[folder].astro`
2. Add redirects: `/chuyenmuc/*` → `/tin-tuc/*`
3. Add redirects: `/tin-tuc/danh-muc/*` → `/tin-tuc/*`

**Risk Assessment:**
- **High Risk**: Breaking changes everywhere
- **Low ROI**: No clear advantage over v1 URLs
- **Not Recommended**: Violates v1 compatibility goal

---

## Data Fetching Alignment

### Current v2 Issues
```typescript
// Hardcoded - NOT scalable
const NEWS_FOLDERS = [26, 27, 37];
const categoryMap: Record<number, NewsArticle["category"]> = {
  26: "policy",
  27: "tips",
  37: "tips",
};
```

### Recommended v1-Style Approach
```typescript
// Dynamic folder query (matches v1)
export async function getNewsByFolder(
  folderSlug: string,
  page: number = 1,
  itemsPerPage: number = 9
): Promise<{ items: NewsArticle[]; total: number }> {
  // 1. Get folder ID from slug (like v1's cms.get_folder)
  const folder = await db
    .select()
    .from(folderTable)
    .where(eq(folderTable.name, folderSlug))
    .limit(1)
    .then(rows => rows[0]);

  if (!folder) {
    return { items: [], total: 0 };
  }

  // 2. Get news by folder (like v1's cms.get_content)
  const offset = (page - 1) * itemsPerPage;
  const items = await db
    .select()
    .from(news)
    .where(
      and(
        eq(news.folder, folder.id),
        eq(news.aactive, true)
      )
    )
    .orderBy(
      asc(news.displayOrder),  // v1: display_order ASC
      desc(news.id)             // v1: id DESC
    )
    .limit(itemsPerPage)
    .offset(offset);

  // 3. Get total count
  const total = await db
    .select({ count: sql<number>`count(*)` })
    .from(news)
    .where(
      and(
        eq(news.folder, folder.id),
        eq(news.aactive, true)
      )
    )
    .then(rows => rows[0].count);

  return { items, total };
}
```

**Key Changes:**
1. **Remove hardcoded folders** → Dynamic folder lookup
2. **Remove category mapping** → Use folder.label directly
3. **Sort order alignment** → `display_order ASC, id DESC` (matches v1)
4. **Pagination params** → Dynamic `page`, `itemsPerPage` (matches v1's `page`, `length`)

---

## Recommended Solution

**✅ APPROACH 1: Direct v1 URL Structure**

### Why This Approach?
1. **Perfect Backward Compatibility**: v1 URLs work without redirects
2. **SEO Preservation**: No loss of search rankings from v1 site
3. **Simplicity**: Single routing pattern, not two conflicting systems
4. **User Experience**: Existing bookmarks and links continue working
5. **Development Velocity**: Less code to maintain (one pattern vs two)

### Implementation Plan

#### Phase 0: News Detail URL Migration (PRIORITY 1)
**Align news detail URLs with v1: `/tin-tuc/{slug}` → `/tin/{slug}`**

**Files to migrate:**
- Move: `src/pages/tin-tuc/[slug].astro` → `src/pages/tin/[slug].astro`

**Files to update (8 files with `/tin-tuc/` references):**
- `src/components/news/news-related-articles-sidebar.astro`
- `src/components/home/news-section.astro`
- `src/pages/tin-tuc/index.astro`
- `src/pages/tin-tuc/danh-muc/[folder].astro`
- `src/pages/tin-tuc/danh-muc/[category].astro`
- `src/pages/tin-tuc/trang/[page].astro`
- `src/services/menu-service.ts`
- Any other news card components

**Changes:**
1. Move route file to `/tin/[slug].astro`
2. Update all `href="/tin-tuc/${slug}"` → `href="/tin/${slug}"`
3. Update canonical URLs, breadcrumbs, sitemaps
4. Add redirect: `/tin-tuc/:slug` → `/tin/:slug` (301 permanent)

**Why Priority 1?**
- Simpler change (just URL prefix update)
- Lower SEO risk (detail pages less indexed than listings)
- Can be deployed independently
- Validates redirect strategy before folder URL changes

---

#### Phase 1: Database & Service Updates
**Files to modify:**
- `src/services/postgres-news-project-service.ts`
- `src/db/schema/news.ts` (verify folder FK)
- `src/db/schema/menu.ts` (verify folder.name field)

**Changes:**
1. Add `getNewsByFolder(folderSlug, page, itemsPerPage)` function
2. Remove hardcoded `NEWS_FOLDERS` and `categoryMap`
3. Implement v1-style sort: `display_order ASC, id DESC`
4. Add folder lookup by slug: `db.folder.name == slug`

#### Phase 2: Routing Updates
**Files to create:**
- `src/pages/chuyenmuc/[folder].astro` (SSR, matches v1 pattern)

**Files to modify:**
- `src/components/news/*` (reuse existing components)
- `src/utils/news-url-builder.ts` (new helper for folder URLs)

**Changes:**
1. Create `/chuyenmuc/[folder]` route
2. Query folder by slug from URL
3. Fetch news using new `getNewsByFolder()` service
4. Reuse existing news components (grid, card, pagination)

#### Phase 3: Cleanup & Redirects
**Files to delete/deprecate:**
- `src/pages/tin-tuc/danh-muc/[category].astro` (hardcoded categories)
- Keep `src/pages/tin-tuc/danh-muc/[folder].astro` temporarily with redirects

**Redirect config** (add to Astro config or Netlify/Vercel):
```javascript
// Redirect old v2 URLs to v1 pattern
redirects: {
  // News detail URLs
  '/tin-tuc/:slug': '/tin/:slug',

  // Folder listing URLs
  '/tin-tuc/danh-muc/:folder': '/chuyenmuc/:folder',
}
```

#### Phase 4: Menu Integration
**Files to modify:**
- `src/services/menu-service.ts`

**Changes:**
1. Update folder URL generation: `/chuyenmuc/{folder.name}` (not `/tin-tuc/danh-muc/`)
2. Verify folder hierarchy rendering
3. Test menu dropdown links

---

## Success Criteria

### Functional Requirements
- ✅ URL `/chuyenmuc/du-an-noi-bat` returns news from folder "du-an-noi-bat"
- ✅ News sorted by `display_order ASC, id DESC`
- ✅ Pagination works with `page` param
- ✅ All database folders accessible (not just 3 hardcoded ones)
- ✅ Folder hierarchy respected in breadcrumbs and menus
- ✅ News detail URLs aligned with v1: `/tin/{slug}` (not `/tin-tuc/{slug}`)

### Non-Functional Requirements
- ✅ No SEO impact (v1 URLs preserved)
- ✅ Page load time < 2s (SSR with DB query)
- ✅ No 404s for existing v1 URLs
- ✅ Redirect from old v2 URLs (301 permanent)
- ✅ Backward compatible with v1 database schema

### Testing Validation
1. **URL Compatibility**: v1 URLs work in v2
2. **Data Accuracy**: Same results as v1 for same folder
3. **Performance**: DB query time < 100ms
4. **SEO**: No duplicate content issues
5. **User Experience**: Breadcrumbs, pagination, sorting all functional

---

## Risk Assessment

### Potential Issues

**1. Database Folder Data Quality**
- **Risk**: Folders in database may not match v1 expectations
- **Mitigation**: Audit `db.folder` table, verify `name` field uniqueness
- **Severity**: Medium

**2. News-Folder Relationship**
- **Risk**: News may reference non-existent folders
- **Mitigation**: Add database constraint, validate FK integrity
- **Severity**: Low

**3. Menu Hierarchy Complexity**
- **Risk**: Recursive folder hierarchy may cause infinite loops
- **Mitigation**: Implement max depth limit (already exists: 10 levels)
- **Severity**: Low

**4. Redirect Configuration**
- **Risk**: Redirects may not work in all hosting environments
- **Mitigation**: Test on staging with actual deploy platform (Netlify/Vercel/Cloudflare)
- **Severity**: Medium

**5. SEO Transition**
- **Risk**: Google may temporarily drop rankings during URL migration
- **Mitigation**: Submit updated sitemap, monitor Search Console
- **Severity**: Low (if using 301 redirects correctly)

---

## Security Considerations

### Input Validation
- **Folder Slug**: Sanitize to prevent SQL injection (Drizzle ORM handles this)
- **Page Number**: Validate as positive integer, cap max value
- **Items Per Page**: Validate range (e.g., 1-100)

### Access Control
- **Published Folders**: Filter by `publish = 'T'` in folder query
- **Active News**: Filter by `aactive = true` in news query
- **No Sensitive Data**: Ensure news.htmlcontent doesn't expose admin data

### Performance
- **Query Optimization**: Add index on `news.folder` and `news.display_order`
- **Pagination Limit**: Cap max items per page to prevent DoS
- **Cache Strategy**: Consider caching folder lookups (rarely change)

---

## Next Steps

### Immediate Actions
1. **Verify Database Schema**: Confirm `folder.name` field contains URL slugs
2. **Audit Folder Data**: Check for duplicates, empty names, invalid characters
3. **Test v1 URLs**: List actual v1 URLs to validate in v2

### Decision Point
**❓ Before proceeding, user should confirm:**
- Is v2 already in production? (affects redirect strategy)
- Are there v2 URLs already indexed by Google? (SEO impact)
- Should we support BOTH `/chuyenmuc/` and `/tin-tuc/danh-muc/` temporarily?

### Implementation Order
1. ✅ Create v1-compatible service functions
2. ✅ Build `/chuyenmuc/[folder]` route
3. ✅ Test with actual v1 folder slugs
4. ✅ Add redirects for old v2 URLs
5. ✅ Update menu generation
6. ✅ Deploy to staging
7. ✅ SEO validation (sitemap, robots.txt)
8. ✅ Production deployment

---

## Unresolved Questions

1. **Production Status**: Is v2 live? Are v2 URLs already indexed?
2. **Folder Slugs**: Do all folders in database have valid `name` slugs?
3. **News Assignment**: Are all news records properly assigned to folders?
4. **Display Order**: Is `display_order` field populated for all news?
5. **Hosting Platform**: Netlify, Vercel, or Cloudflare Pages? (affects redirect config)
6. **Analytics**: Should we track v1 vs v2 URL patterns during transition?

---

## Conclusion

**Recommended Approach:** ✅ **Approach 1 - Direct v1 URL Structure**

**Rationale:**
- Perfect backward compatibility with v1
- Simplest implementation (one pattern)
- Best SEO preservation
- Lowest technical debt
- Easiest to maintain long-term

**Trade-offs Accepted:**
- Small refactor of existing v2 routes
- Need to add redirects for any indexed v2 URLs
- Minor deployment complexity (redirect rules)

**Next Action Required:**
User decision on:
1. Confirm v2 production status
2. Approve breaking changes to v2 URLs (with redirects)
3. Authorize proceeding with implementation plan
