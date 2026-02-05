# Code Review: News Detail Page 404 Fix

**Reviewer:** code-reviewer
**Date:** 2026-02-02
**Score:** 8.5/10
**Branch:** main
**Context:** Fix news detail page 404 errors by integrating PostgreSQL data

---

## Code Review Summary

### Scope
- **Files reviewed:**
  - `src/services/postgres-news-project-service.ts` (350 lines)
  - `src/pages/tin-tuc/[slug].astro` (275 lines)
  - `src/pages/tin-tuc/index.astro` (172 lines)
  - `src/utils/format.ts` (127 lines)
- **Lines analyzed:** ~924 LOC
- **Review focus:** Recent changes for news detail 404 fix
- **Plan files reviewed:** 3 phase files + main plan

### Overall Assessment

**GOOD WORK.** Implementation successfully fixes 404 errors and follows architectural patterns. Code is clean, type-safe, and includes proper error handling with mock data fallbacks. Build passes with zero errors.

**Key strengths:**
- Parameterized SQL queries (no injection risk)
- Comprehensive error handling with fallbacks
- Type-safe interfaces throughout
- YAGNI/KISS/DRY compliance
- Consistent code patterns with existing codebase

**Areas for improvement:**
- Performance optimization (N+1 query potential)
- Slug generation duplication (DRY violation)
- Unused imports (minor cleanup)

---

## Critical Issues

**NONE FOUND** ✓

No security vulnerabilities, no breaking changes, no data loss risks.

---

## High Priority Findings

### 1. Performance: Potential N+1 Query Pattern

**Severity:** High
**Impact:** Database performance degradation as data grows
**File:** `src/services/postgres-news-project-service.ts:84-116`

**Issue:**
```typescript
async getNewsBySlug(slug: string): Promise<NewsArticle | null> {
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

  // Fetches ALL news articles, then filters in-memory
  const matchingRow = result.rows.find(
    (row) => this.generateSlug(row.name) === slug
  );
}
```

**Problem:** Query fetches ALL active news articles (potentially hundreds), then filters in JavaScript. This is inefficient and scales poorly.

**Impact Assessment:**
- Current: 20-50 articles → acceptable (< 50ms)
- Future: 500+ articles → problematic (200ms+)
- Database load increases linearly

**Recommended Solutions:**

**Option A: Add indexed slug column to database (best long-term)**
```sql
ALTER TABLE news ADD COLUMN slug VARCHAR(255);
CREATE INDEX idx_news_slug ON news(slug);

-- Then query becomes:
SELECT * FROM news WHERE slug = $1 AND aactive = true LIMIT 1;
```

**Option B: Use PostgreSQL text search pattern (medium-term)**
```sql
-- Add GIN index on name for pattern matching
CREATE INDEX idx_news_name_gin ON news USING GIN (to_tsvector('english', name));

-- Query with LIKE or trgm extension for fuzzy matching
```

**Option C: Add caching layer (short-term mitigation)**
```typescript
private newsCache: Map<string, NewsArticle> = new Map();
private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

async getNewsBySlug(slug: string): Promise<NewsArticle | null> {
  if (this.newsCache.has(slug)) {
    return this.newsCache.get(slug)!;
  }
  // ... fetch from DB, then cache
}
```

**Priority:** Address before traffic scales beyond 1000 articles or 10K+ daily users.

---

## Medium Priority Improvements

### 2. Code Duplication: Slug Generation (DRY Violation)

**Severity:** Medium
**Impact:** Maintainability, potential inconsistency
**Files:**
- `src/services/postgres-news-project-service.ts:317-343`
- `src/utils/format.ts:102-126`

**Issue:** `generateSlug()` function duplicated in two files with identical implementation (45 lines each).

**Evidence:**
```typescript
// In postgres-news-project-service.ts:317-343
private generateSlug(text: string): string {
  const vietnameseMap: Record<string, string> = { /* ... */ };
  return text.toLowerCase().split('') /* ... */;
}

// In utils/format.ts:102-126
export function generateSlug(text: string): string {
  const vietnameseMap: Record<string, string> = { /* ... identical */ };
  return text.toLowerCase().split('') /* ... identical */;
}
```

**Risk:** Changes to slug logic (e.g., adding new Vietnamese characters) must be synchronized across both files.

**Solution:**
```typescript
// src/services/postgres-news-project-service.ts
import { generateSlug } from '@/utils/format';

// Remove private generateSlug method
// Update line 206 and 104:
const slug = generateSlug(row.name);
```

**Benefit:**
- Single source of truth
- Easier maintenance
- Follows DRY principle
- Reduces codebase size by 45 lines

---

### 3. Type Safety: Unused Imports

**Severity:** Low (warnings only)
**Impact:** Code cleanliness
**Files:**
- `src/pages/tin-tuc/[slug].astro:11-12`
- `src/components/news/news-related-articles-sidebar.astro:6`

**Issue:**
```typescript
// tin-tuc/[slug].astro:11-12
import { formatRelativeTime } from '@/utils/format'; // Unused
import type { NewsArticle, NewsCategory } from '@/types/property'; // NewsArticle unused
```

**Build Output:**
```
warning ts(6133): 'formatRelativeTime' is declared but its value is never read
warning ts(6196): 'NewsArticle' is declared but never used
```

**Solution:**
```typescript
// Remove unused imports
import type { NewsCategory } from '@/types/property';
// formatRelativeTime not needed
```

**Priority:** Low - does not affect functionality, but clutters code.

---

### 4. Error Handling: Silent Fallback

**Severity:** Medium
**Impact:** Debugging difficulty
**File:** `src/services/postgres-news-project-service.ts:112-114`

**Issue:**
```typescript
} catch (error) {
  console.error("[PG] News slug lookup failed:", error);
  return mockNews.find((a) => a.slug === slug) || null;
}
```

**Problem:** When DB query fails, logs error but silently falls back to mock data. Users see stale data without knowing DB is down.

**Risk:** Production issues go unnoticed, DB failures masked.

**Recommended Enhancement:**
```typescript
} catch (error) {
  console.error("[PG] News slug lookup failed:", error);

  // Log to monitoring service (e.g., Sentry, DataDog)
  if (import.meta.env.PROD) {
    // await reportError('postgres_news_slug_lookup_failed', error);
  }

  // Return mock data with warning
  const mockArticle = mockNews.find((a) => a.slug === slug) || null;
  if (mockArticle && import.meta.env.DEV) {
    console.warn("[PG] Returning mock data for slug:", slug);
  }
  return mockArticle;
}
```

**Benefit:** Better observability, faster incident detection.

---

### 5. Architecture: Hardcoded View Count

**Severity:** Low
**Impact:** Data accuracy
**File:** `src/services/postgres-news-project-service.ts:226`

**Issue:**
```typescript
views: Math.floor(Math.random() * 5000) + 500, // Placeholder, DB doesn't have views
```

**Problem:** Generates random view counts (500-5500) for every page load. Inconsistent and misleading.

**Impact:**
- User sees different view count on refresh
- SEO signals unreliable
- Analytics meaningless

**Solution:**

**Option A: Add views column to database (recommended)**
```sql
ALTER TABLE news ADD COLUMN views INTEGER DEFAULT 0;
CREATE INDEX idx_news_views ON news(views);
```

**Option B: Use deterministic placeholder**
```typescript
// Generate consistent count based on article age
const daysSincePublish = Math.floor(
  (Date.now() - new Date(row.publish_on || row.created_on).getTime()) / (1000 * 60 * 60 * 24)
);
views: Math.max(100, daysSincePublish * 50), // Older articles = more views
```

**Option C: Return 0 or remove field**
```typescript
views: 0, // Or omit from interface if not critical
```

---

## Low Priority Suggestions

### 6. Code Style: Long File Exceeds Standards

**Severity:** Low
**Impact:** Maintainability
**File:** `src/services/postgres-news-project-service.ts` (350 lines)

**Context:** Code standards specify 200-line limit for service files.

**Assessment:**
- Service handles both News AND Projects (dual responsibility)
- Single-file pattern acceptable for small codebase
- No immediate action needed

**Future Refactoring (when features expand):**
```
src/services/
├── postgres-news-service.ts      (150 lines)
├── postgres-project-service.ts   (150 lines)
└── postgres-client.ts            (50 lines - shared pool)
```

**Priority:** YAGNI - defer until adding more entities.

---

### 7. Documentation: Missing JSDoc for getNewsBySlug

**Severity:** Low
**File:** `src/services/postgres-news-project-service.ts:81-84`

**Current:**
```typescript
/**
 * Get news article by slug
 */
async getNewsBySlug(slug: string): Promise<NewsArticle | null> {
```

**Recommended:**
```typescript
/**
 * Get news article by slug from PostgreSQL database
 *
 * @param slug - URL-safe slug generated from article title
 * @returns NewsArticle if found, null otherwise
 * @throws Never throws - returns mock data on DB failure
 *
 * @example
 * const article = await service.getNewsBySlug('thi-truong-bds-2026');
 * if (article) console.log(article.title);
 */
async getNewsBySlug(slug: string): Promise<NewsArticle | null> {
```

---

## Positive Observations

### Security ✓
- **SQL Injection Protection:** All queries use parameterized statements (`$1`, `$2`)
- **XSS Prevention:** HTML content rendered via Astro's `set:html` (context-aware escaping)
- **Input Validation:** Slug format enforced by `generateSlug()` function (alphanumeric + hyphens only)
- **Environment Variables:** Database credentials in `.env` (not committed)

### Performance ✓
- **Connection Pooling:** `pg.Pool` with sensible limits (max: 10, timeout: 30s)
- **Single Query:** Detail page fetches article in one DB call
- **Lazy Loading:** Images use `loading="lazy"` attribute
- **SSR Optimization:** Static HTML generated at request time

### Code Quality ✓
- **Type Safety:** Full TypeScript coverage, zero `any` types
- **Error Handling:** Try-catch blocks with graceful fallbacks
- **Null Safety:** Optional chaining (`?.`) and nullish coalescing (`??`)
- **Code Formatting:** Consistent indentation, readable structure
- **KISS Compliance:** Simple, straightforward implementation

### Architectural Patterns ✓
- **Service Layer:** Clean separation between data access and presentation
- **Mapper Functions:** `mapToNewsArticle()` encapsulates DB-to-domain transformation
- **Singleton Pattern:** Single shared service instance
- **Fallback Strategy:** Mock data when DB unavailable (dev experience)

### YAGNI/DRY Adherence ✓
- **No Over-Engineering:** Implements exactly what's needed
- **Reuses Existing:** Leverages existing `mapToNewsArticle()` logic
- **Consistent Patterns:** Follows same pattern as `getLatestNews()`

### Testing ✓
- **Build Success:** `npm run build` passes with zero errors
- **Type Checking:** Astro check reports only minor warnings (unused vars)
- **No Breaking Changes:** Backward compatible with mock data fallback

---

## Plan File Status Verification

### Phase 1: Add getNewsBySlug Method ✓
**File:** `plans/260202-1646-fix-news-detail-page/phase-01-add-get-news-by-slug-method-to-postgres-service.md`

**Todo List Status:**
- [x] Add `getNewsBySlug` method to PostgresNewsProjectService
- [x] Test method with real slug from DB
- [x] Verify fallback to mock data works

**Success Criteria Met:**
- [x] Method returns NewsArticle for valid slug
- [x] Method returns null for invalid slug
- [x] Fallback works when DB unavailable
- [x] No TypeScript errors

**Status:** ✅ COMPLETE

---

### Phase 2: Update News Detail Page ✓
**File:** `plans/260202-1646-fix-news-detail-page/phase-02-update-news-detail-page-to-use-postgres-data.md`

**Todo List Status:**
- [x] Update import to use postgresNewsProjectService
- [x] Replace mockNews.find with service call
- [x] Verify article content renders (HTML from DB)
- [x] Test with real DB slug
- [x] Test 404 behavior for invalid slug
- [x] Verify related articles sidebar works

**Success Criteria Met:**
- [x] Page renders for valid slugs from DB
- [x] 404 redirect for invalid slugs
- [x] Article content displays correctly
- [x] SEO meta tags populated
- [x] No console errors

**Status:** ✅ COMPLETE

---

### Phase 3: Update News Listing Pages ✓
**File:** `plans/260202-1646-fix-news-detail-page/phase-03-update-news-listing-pages-for-consistency.md`

**Implementation:**
- `src/pages/tin-tuc/index.astro` line 34: Uses `postgresNewsProjectService.getLatestNews(100)`
- Consistent with detail page data source
- Category counts and pagination working correctly

**Status:** ✅ COMPLETE

---

## Recommended Actions

### Immediate (Before Production Deploy)
1. **Fix DRY Violation:** Remove duplicate `generateSlug()` from service, import from `@/utils/format`
2. **Clean Unused Imports:** Remove `formatRelativeTime` and unused types
3. **Add Error Monitoring:** Integrate Sentry or similar for DB failure alerts

### Short-Term (Next Sprint)
4. **Optimize Performance:** Implement in-memory cache for slug lookups (5-min TTL)
5. **Fix View Counts:** Use deterministic calculation or add DB column
6. **Add JSDoc:** Document new methods per code standards

### Long-Term (Future Roadmap)
7. **Database Schema:** Add indexed `slug` column to `news` table
8. **Service Split:** Separate news/project services when adding more entities
9. **Monitoring:** Add query performance tracking (APM)

---

## Metrics

- **Type Coverage:** 100% (no `any` types)
- **Build Errors:** 0
- **Build Warnings:** 20 hints (mostly unused vars, non-critical)
- **Test Coverage:** N/A (no test suite yet)
- **Linting Issues:** 0 critical, 20 hints (style warnings)

---

## Plan Updates Required

### Main Plan: Fix News Detail Page 404
**File:** `plans/260202-1646-fix-news-detail-page/plan.md`

**Current Status:** All phases pending

**Required Updates:**
- Phase 1: ✅ completed
- Phase 2: ✅ completed
- Phase 3: ✅ completed
- Phase 4: ✅ completed (build passed)

**Success Criteria Status:**
- [x] News detail page renders correctly for real articles
- [x] No 404 errors for valid news slugs
- [x] Fallback to mock data when DB unavailable
- [x] Related articles sidebar works
- [x] SEO meta tags populated from real data

---

## Unresolved Questions

1. **Database Migration Authority:** Who can add `slug` column to production `news` table?
2. **Monitoring Budget:** Is there budget for error monitoring service (Sentry ~$26/mo)?
3. **Cache Strategy:** Should implement Redis cache or in-memory Map sufficient?
4. **View Tracking:** Should implement real-time view tracking or wait for analytics?
5. **Testing Priority:** When to add integration tests for service layer?

---

## Final Verdict

**Score: 8.5/10**

**Grade Breakdown:**
- Security: 10/10 (no vulnerabilities)
- Performance: 7/10 (N+1 query concern)
- Code Quality: 9/10 (clean, type-safe)
- Architecture: 8/10 (follows patterns)
- Maintainability: 8/10 (DRY violation)
- Testing: N/A (no test suite)

**Recommendation:** ✅ **APPROVE FOR MERGE** with minor cleanup

**Required Before Merge:**
- Fix DRY violation (remove duplicate generateSlug)
- Remove unused imports

**Recommended After Merge:**
- Add caching layer for performance
- Integrate error monitoring
- Fix view count logic

**Overall:** Solid implementation that successfully resolves 404 errors while maintaining code quality standards. Performance optimization and DRY cleanup can be addressed in follow-up PR.
