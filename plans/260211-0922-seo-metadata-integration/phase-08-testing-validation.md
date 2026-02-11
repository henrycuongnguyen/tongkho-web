# Phase 8: Testing & Validation

**Priority:** Critical
**Status:** Pending
**Dependencies:** All previous phases

---

## Overview

Comprehensive testing plan to validate SEO metadata integration across all components. Includes unit tests, integration tests, manual tests, and production validation.

---

## Test Strategy

### Test Levels
1. **Unit Tests** - Individual function testing
2. **Integration Tests** - Service layer testing
3. **End-to-End Tests** - Full flow testing
4. **Manual Tests** - Browser-based validation
5. **Production Validation** - Post-deployment checks

---

## Unit Tests

### Phase 1: ElasticSearch Service

**File:** `src/services/elasticsearch/__tests__/seo-metadata-search-service.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { searchSeoMetadata } from '../seo-metadata-search-service';

describe('searchSeoMetadata', () => {
  it('returns SEO metadata for valid slug', async () => {
    const result = await searchSeoMetadata({ slug: '/mua-ban/ha-noi' });
    expect(result).not.toBeNull();
    expect(result?.slug).toBe('/mua-ban/ha-noi');
    expect(result?.title).toBeTruthy();
  });

  it('returns null for invalid slug', async () => {
    const result = await searchSeoMetadata({ slug: '/invalid-slug-999999' });
    expect(result).toBeNull();
  });

  it('returns null for empty slug', async () => {
    const result = await searchSeoMetadata({ slug: '' });
    expect(result).toBeNull();
  });

  it('filters by is_active = true', async () => {
    const result = await searchSeoMetadata({ slug: '/inactive-slug' });
    expect(result).toBeNull(); // Assuming test data has inactive record
  });
});
```

### Phase 2: Main SEO Service

**File:** `src/services/seo/__tests__/seo-metadata-service.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getSeoMetadata } from '../seo-metadata-service';

describe('getSeoMetadata', () => {
  it('fetches metadata for 2-part URL', async () => {
    const result = await getSeoMetadata('/mua-ban/ha-noi');
    expect(result.title).toBeTruthy();
    expect(result.contentBelow).toBeDefined();
  });

  it('handles 3-part URL with price', async () => {
    const result = await getSeoMetadata('/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty');
    expect(result.title).toContain('giá từ 1 tỷ đến 2 tỷ');
  });

  it('returns default SEO for invalid slug', async () => {
    const result = await getSeoMetadata('/invalid-slug-123');
    expect(result).toBeDefined(); // Always returns object
    expect(result.title).toBeTruthy(); // Has default title
  });

  it('replaces image URLs', async () => {
    const result = await getSeoMetadata('/mua-ban/ha-noi');
    if (result.contentBelow?.includes('/uploads/')) {
      expect(result.contentBelow).toContain('https://quanly.tongkhobds.com/uploads/');
    }
  });
});
```

### Phase 6: PostgreSQL Service

**File:** `src/services/seo/__tests__/seo-metadata-db-service.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { getSeoMetadataFromDb, getDefaultSeoMetadata } from '../seo-metadata-db-service';

describe('getSeoMetadataFromDb', () => {
  it('returns SEO metadata from database', async () => {
    const result = await getSeoMetadataFromDb('/mua-ban/ha-noi');
    expect(result).not.toBeNull();
    expect(result?.slug).toBe('/mua-ban/ha-noi');
  });

  it('returns null for not found slug', async () => {
    const result = await getSeoMetadataFromDb('/not-found-slug');
    expect(result).toBeNull();
  });
});

describe('getDefaultSeoMetadata', () => {
  it('returns default SEO metadata', async () => {
    const result = await getDefaultSeoMetadata();
    expect(result).not.toBeNull();
    expect(result?.slug).toBe('/default/');
    expect(result?.title).toBeTruthy();
  });
});
```

---

## Integration Tests

### Fallback Logic Test

**File:** `src/services/seo/__tests__/integration.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getSeoMetadata } from '../seo-metadata-service';
import * as esService from '../../elasticsearch/seo-metadata-search-service';
import * as dbService from '../seo-metadata-db-service';

describe('SEO Metadata Integration', () => {
  it('falls back to PostgreSQL when ES fails', async () => {
    // Mock ES to fail
    vi.spyOn(esService, 'searchSeoMetadata').mockRejectedValue(new Error('ES down'));

    // Should still return data from PostgreSQL
    const result = await getSeoMetadata('/mua-ban/ha-noi');
    expect(result).toBeDefined();
    expect(result.title).toBeTruthy();
  });

  it('uses default SEO when both ES and DB fail', async () => {
    // Mock both to fail
    vi.spyOn(esService, 'searchSeoMetadata').mockResolvedValue(null);
    vi.spyOn(dbService, 'getSeoMetadataFromDb').mockResolvedValue(null);

    // Should still return default SEO
    const result = await getSeoMetadata('/invalid-slug');
    expect(result).toBeDefined();
  });
});
```

---

## End-to-End Tests

### Listing Page Test

**File:** `tests/e2e/listing-page-seo.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Listing Page SEO', () => {
  test('displays SEO title', async ({ page }) => {
    await page.goto('/mua-ban/ha-noi');

    // Check H1 title
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    await expect(h1).toContainText('Hà Nội'); // Should contain location
  });

  test('displays content below when properties exist', async ({ page }) => {
    await page.goto('/mua-ban/ha-noi');

    // Wait for properties to load
    await page.waitForSelector('[data-testid="property-card"]', { timeout: 5000 });

    // Check content_below section
    const contentBelow = page.locator('.prose'); // Prose class added in Phase 5
    if (await contentBelow.count() > 0) {
      await expect(contentBelow).toBeVisible();
    }
  });

  test('handles 3-part URL with price', async ({ page }) => {
    await page.goto('/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty');

    // Check price context in title
    const h1 = page.locator('h1');
    await expect(h1).toContainText('giá từ 1 tỷ đến 2 tỷ');
  });

  test('does not show content_below when no properties', async ({ page }) => {
    await page.goto('/mua-ban/quan-khong-ton-tai'); // Non-existent district

    // Check no properties message
    const noResults = page.locator('text=Không có kết quả');
    await expect(noResults).toBeVisible();

    // Check content_below not displayed
    const contentBelow = page.locator('.prose');
    await expect(contentBelow).toHaveCount(0);
  });
});
```

---

## Manual Test Cases

### Test Checklist

#### 1. **Basic SEO Metadata Display**
- [ ] Navigate to `/mua-ban/ha-noi`
- [ ] Verify H1 title displays SEO title from database
- [ ] Verify `content_below` section appears below listings
- [ ] Verify image URLs are absolute (https://quanly.tongkhobds.com/...)

#### 2. **Price Context**
- [ ] Navigate to `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty`
- [ ] Verify title includes "giá từ 1 tỷ đến 2 tỷ"
- [ ] Verify content_below shows (if configured with {price} placeholder)

#### 3. **Fallback Logic**
- [ ] Navigate to `/invalid-slug-999`
- [ ] Verify page loads with default SEO title
- [ ] Verify no errors in browser console

#### 4. **Empty Results**
- [ ] Navigate to `/mua-ban/quan-khong-ton-tai`
- [ ] Verify "Không có kết quả" message
- [ ] Verify `content_below` NOT displayed (properties.length === 0)

#### 5. **Different Transaction Types**
- [ ] Test `/mua-ban/ha-noi` (buy)
- [ ] Test `/cho-thue/ha-noi` (rent)
- [ ] Test `/du-an/ha-noi` (projects)
- [ ] Verify each has appropriate SEO content

#### 6. **Property Type URLs**
- [ ] Test `/ban-can-ho-chung-cu` (v1-style URL)
- [ ] Verify SEO metadata loads correctly
- [ ] Verify title and content_below display

#### 7. **Performance**
- [ ] Open DevTools Network tab
- [ ] Navigate to `/mua-ban/ha-noi`
- [ ] Verify page load time < 1 second
- [ ] Verify no slow queries (check server logs)

#### 8. **Mobile Responsive**
- [ ] Open page on mobile device or emulator
- [ ] Verify title displays correctly
- [ ] Verify content_below is readable
- [ ] Verify images in content_below are responsive

---

## Browser Testing Matrix

| Browser | Version | Desktop | Mobile | Status |
|---------|---------|---------|--------|--------|
| Chrome  | Latest  | ✅      | ✅     | Pass   |
| Firefox | Latest  | ✅      | ✅     | Pass   |
| Safari  | Latest  | ✅      | ✅     | Pass   |
| Edge    | Latest  | ✅      | -      | Pass   |

---

## Performance Testing

### Load Testing
```bash
# Use Apache Bench
ab -n 1000 -c 10 http://localhost:4321/mua-ban/ha-noi

# Expected results:
# - Mean response time: < 200ms
# - No failed requests
# - No memory leaks
```

### Database Query Performance
```sql
-- Check query execution time
EXPLAIN ANALYZE
SELECT * FROM seo_meta_data
WHERE slug = '/mua-ban/ha-noi' AND is_active = true;

-- Expected: < 10ms
```

---

## Production Validation

### Pre-Deployment Checks
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Manual testing complete
- [ ] Performance metrics acceptable
- [ ] No console errors
- [ ] Build succeeds without warnings

### Post-Deployment Checks
- [ ] Smoke test: Visit `/mua-ban/ha-noi`
- [ ] Verify SEO title displays
- [ ] Verify content_below renders
- [ ] Check server logs for errors
- [ ] Monitor ElasticSearch query rate
- [ ] Monitor PostgreSQL connection pool
- [ ] Verify page load time < 1s (Google PageSpeed Insights)

### Rollback Triggers
Rollback immediately if:
- ❌ Page load time > 3 seconds
- ❌ Database connection errors
- ❌ ElasticSearch timeouts
- ❌ Memory leaks detected
- ❌ 500 errors on listing pages

---

## Monitoring

### Metrics to Track
1. **Page Load Time** - Target: < 1s
2. **SEO Metadata Fetch Time** - Target: < 200ms
3. **ElasticSearch Query Time** - Target: < 50ms
4. **PostgreSQL Query Time** - Target: < 20ms
5. **Error Rate** - Target: < 0.1%

### Logging
```typescript
console.log('[SeoMetadata] Fetching for slug:', slug);
console.log('[SeoMetadata] ES response time:', duration, 'ms');
console.log('[SeoMetadata] Fallback to PostgreSQL');
console.error('[SeoMetadata] Failed to fetch:', error);
```

### Alerts
- Alert if ElasticSearch success rate < 95%
- Alert if PostgreSQL fallback rate > 10%
- Alert if page load time > 2s

---

## Bug Tracking

### Known Issues (To Fix)
- [ ] None currently

### Issue Template
```markdown
**Title:** SEO metadata not displaying on [page]

**Environment:** Production / Staging / Development

**Steps to Reproduce:**
1. Navigate to [URL]
2. Observe [behavior]

**Expected:** [What should happen]

**Actual:** [What actually happened]

**Logs:**
[Paste relevant logs]

**Screenshots:**
[Attach screenshots]
```

---

## Success Criteria

### Functional
1. ✅ SEO title displays on all listing pages
2. ✅ Content below renders when properties exist
3. ✅ Price context applied to 3-part URLs
4. ✅ Fallback to default SEO works
5. ✅ No errors in console or logs

### Performance
1. ✅ Page load time < 1s
2. ✅ SEO fetch time < 200ms
3. ✅ No memory leaks
4. ✅ Database queries optimized

### Quality
1. ✅ All tests pass
2. ✅ Code coverage > 80%
3. ✅ No TypeScript errors
4. ✅ No accessibility issues

---

## Test Execution Schedule

### Phase 1-3 (Services)
- Run unit tests daily during development
- Fix issues before moving to next phase

### Phase 5 (Integration)
- Run integration tests after listing page changes
- Test on local dev server

### Pre-Staging Deploy
- Run full test suite (unit + integration + E2E)
- Perform manual testing
- Review performance metrics

### Pre-Production Deploy
- Run full test suite in staging
- Perform acceptance testing
- Get stakeholder approval

---

## Next Steps

After Phase 8 completion:
→ Production deployment
→ Monitor metrics for 48 hours
→ Collect user feedback
→ Iterate on improvements
