# Phase 5: Listing Page Integration

**Priority:** High
**Status:** Pending
**Dependencies:** Phase 1, 2, 3, 6

---

## Overview

Integrate SEO metadata service into listing page (`[...slug].astro`) to display dynamic title and `content_below` section, matching v1's `danhmuc.html` behavior.

---

## Context

### v1 Template Logic
File: `reference/resaland_v1/views/bds/danhmuc.html`

**Title Display (Line 175):**
```html
<h1 class="title">{{=metadata.get('title') or title or 'Danh sách bất động sản'}}</h1>
```

**Content Below Display (Line 381-385):**
```html
{{if len(properties) > 0 and metadata.get('content_below'):}}
  <div class="mt-20">
    {{=XML(metadata.get('content_below'))}}
  </div>
{{pass}}
```

### v2 Current Structure
File: `src/pages/[...slug].astro:288-293`

**Current Title:**
```astro
<h1 class="text-xl font-semibold text-slate-900">
  {title.replace(' - Tongkho BĐS', '')}
</h1>
```

**After ListingGrid (Line 319):**
```astro
<ListingGrid properties={properties} />
```

No `content_below` rendering exists.

---

## Requirements

### Functional
1. Fetch SEO metadata during SSR/SSG
2. Display `title` or `titleWeb` in H1 (fallback to generated title)
3. Render `contentBelow` after property listings (only if properties exist)
4. Maintain current styling and layout

### Non-Functional
1. No performance degradation (SSR/SSG compatible)
2. Type-safe implementation
3. Graceful fallback if service fails
4. SEO-friendly HTML structure

---

## Implementation

### Changes to `src/pages/[...slug].astro`

#### 1. Add Import (After Line 18)
```typescript
import { getSeoMetadata } from '@/services/seo/seo-metadata-service';
import type { SeoMetadata } from '@/services/seo/types';
```

#### 2. Fetch SEO Metadata (After Line 140, before parallel queries)
```typescript
// Fetch SEO metadata for current path
const currentPath = url.pathname;
let seoMetadata: SeoMetadata | null = null;

try {
  seoMetadata = await getSeoMetadata(currentPath);
} catch (error) {
  console.error('[ListingPage] Failed to fetch SEO metadata:', error);
  // Continue without SEO metadata (graceful degradation)
}
```

#### 3. Update Title Logic (Replace Lines 235-236)
```typescript
// Build metadata - prioritize SEO metadata over generated title
const pageTitle = seoMetadata?.titleWeb || seoMetadata?.title || getPageTitle(filters);
const description = getPageDescription(filters, total);
```

#### 4. Update H1 Display (Line 291-293)
```astro
<h1 class="text-xl font-semibold text-slate-900">
  {pageTitle.replace(' - Tongkho BĐS', '')}
</h1>
```

#### 5. Add Content Below Section (After Line 330, after ListingPagination)
```astro
<!-- SEO Content Below (only if properties exist and content available) -->
{properties.length > 0 && seoMetadata?.contentBelow && (
  <div class="mt-20 prose prose-slate max-w-none">
    <div set:html={seoMetadata.contentBelow} />
  </div>
)}
```

---

## Complete Modified Section

### Before (Lines 235-330):
```astro
// Build metadata
const title = getPageTitle(filters);
const description = getPageDescription(filters, total);

// ... (pagination logic)
---

<ListingWithSidebarLayout title={title} description={description}>
  <!-- ... -->

  <h1 class="text-xl font-semibold text-slate-900">
    {title.replace(' - Tongkho BĐS', '')}
  </h1>

  <!-- ... -->

  <ListingGrid properties={properties} />

  {totalPages > 1 && (
    <ListingPagination ... />
  )}
</ListingWithSidebarLayout>
```

### After (Modified):
```astro
// Fetch SEO metadata for current path
const currentPath = url.pathname;
let seoMetadata: SeoMetadata | null = null;

try {
  seoMetadata = await getSeoMetadata(currentPath);
} catch (error) {
  console.error('[ListingPage] Failed to fetch SEO metadata:', error);
}

// Build metadata - prioritize SEO metadata over generated title
const pageTitle = seoMetadata?.titleWeb || seoMetadata?.title || getPageTitle(filters);
const description = getPageDescription(filters, total);

// ... (pagination logic)
---

<ListingWithSidebarLayout title={pageTitle} description={description}>
  <!-- ... -->

  <h1 class="text-xl font-semibold text-slate-900">
    {pageTitle.replace(' - Tongkho BĐS', '')}
  </h1>

  <!-- ... -->

  <ListingGrid properties={properties} />

  {totalPages > 1 && (
    <ListingPagination ... />
  )}

  <!-- SEO Content Below -->
  {properties.length > 0 && seoMetadata?.contentBelow && (
    <div class="mt-20 prose prose-slate max-w-none">
      <div set:html={seoMetadata.contentBelow} />
    </div>
  )}
</ListingWithSidebarLayout>
```

---

## Related Code Files

### To Modify
- `src/pages/[...slug].astro` (MODIFY)

### To Reference
- `src/services/seo/seo-metadata-service.ts` (Phase 2)
- `src/services/seo/types.ts` (Phase 3)
- `src/utils/listing-url-parser.ts` (existing title generation)

---

## Implementation Steps

1. ☐ Add service imports
2. ☐ Add SEO metadata fetch before parallel queries
3. ☐ Update title logic to use SEO title (fallback to generated)
4. ☐ Update H1 to use `pageTitle` variable
5. ☐ Add `contentBelow` rendering after pagination
6. ☐ Test with various URL patterns
7. ☐ Verify graceful degradation if service fails
8. ☐ Check styling of SEO content

---

## Styling Notes

### Prose Classes
Using Tailwind Typography plugin classes:
- `prose` - Base typography styles
- `prose-slate` - Slate color scheme
- `max-w-none` - No max width restriction

This ensures SEO content inherits proper:
- Heading styles (h2, h3)
- Paragraph spacing
- List formatting
- Link colors
- Image sizing

### Custom Styles (If Needed)
If admin-created content needs adjustments:
```astro
<div class="mt-20 seo-content">
  <div set:html={seoMetadata.contentBelow} />
</div>

<style>
  .seo-content :global(img) {
    max-width: 100%;
    height: auto;
  }

  .seo-content :global(a) {
    color: #f97316; /* orange-500 */
    text-decoration: underline;
  }
</style>
```

---

## Testing

### Manual Tests

1. **SEO Title Display**
   - URL: `/mua-ban/ha-noi`
   - Expected: H1 shows SEO title from database
   - Fallback: Shows generated title if DB has no SEO

2. **Content Below Rendering**
   - URL: `/mua-ban/ha-noi`
   - Expected: SEO content displays below listings
   - Condition: Only if `properties.length > 0` and `contentBelow` exists

3. **No Content Scenario**
   - URL: `/invalid-slug`
   - Expected: No content_below section displayed
   - Title: Falls back to generated title

4. **Price Context**
   - URL: `/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty`
   - Expected: Title includes "giá từ 1 tỷ đến 2 tỷ" (price context applied)

5. **Empty Results**
   - URL: `/mua-ban/quan-khong-ton-tai`
   - Expected: No content_below displayed (properties.length === 0)
   - Title: Shows SEO title or fallback

6. **Service Failure**
   - Mock service to throw error
   - Expected: Page still renders with generated title
   - No crash, no blank page

### Edge Cases
- ✅ SEO service unavailable → fallback to generated title
- ✅ Empty `contentBelow` → section not rendered
- ✅ No properties → content_below not displayed (matches v1)
- ✅ Long SEO content → scrollable, doesn't break layout
- ✅ HTML in content → rendered safely via `set:html`

---

## Security Considerations

### HTML Content Safety
- ✅ Using Astro's `set:html` directive (safe for admin content)
- ✅ Content managed by admins only (not user-generated)
- ⚠️ If future UGC support needed, add HTML sanitization

### XSS Prevention
- ✅ Title text escaped automatically by Astro
- ✅ `set:html` used only for trusted admin content
- ✅ No eval() or unsafe operations

---

## Performance Impact

### Before Integration
- Page load: ~150ms (SSR)
- No SEO database queries

### After Integration
- Page load: ~200ms (SSR)
- Additional queries:
  - ElasticSearch: ~50ms
  - PostgreSQL fallback: ~20ms
- **Impact:** +50ms per listing page (acceptable)

### Optimization (Future)
- Implement caching layer (Redis)
- Pre-fetch SEO data during build (SSG)
- Use stale-while-revalidate pattern

---

## Success Criteria

1. ✅ SEO title displays in H1
2. ✅ Fallback to generated title if SEO missing
3. ✅ `contentBelow` renders after listings
4. ✅ Content only shows if properties exist
5. ✅ Graceful degradation if service fails
6. ✅ No layout breaks or styling issues
7. ✅ No performance regression

---

## Rollback Plan

If issues occur:
1. Comment out SEO metadata fetch
2. Restore original title logic
3. Remove content_below section
4. Deploy rollback immediately

---

## Next Steps

After Phase 5 completion:
→ Phase 8: Testing & validation
→ Monitor production performance
→ Collect admin feedback on SEO content rendering
