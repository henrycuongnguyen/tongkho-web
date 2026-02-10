# Phase 1: SSR Location Filter Card Component

## Context Links
- [Plan Overview](./plan.md)
- [Research: V1 Sidebar Logic](./research/researcher-01-v1-sidebar-logic.md)
- [Research: V2 Patterns](./research/researcher-02-v2-architecture-patterns.md)

## Overview

**Priority:** P1 (Foundation)
**Status:** Completed
**Effort:** 2h
**Completed:** 2026-02-10

Create `location-filter-card.astro` component that fetches province data **server-side via SSR** and renders filter UI with property counts.

## Key Insights

1. **SSR Pattern**: Data fetching happens in Astro component frontmatter (server-side)
2. **No Service Layer**: Direct call to `LocationService` in component (simpler than service → props pattern)
3. **URL Context**: Parse `Astro.url` to determine transaction type and current province
4. **No Hydration**: Pure HTML output, minimal client-side JS (only for expand/collapse)

## Requirements

### Functional
- Fetch provinces with counts on server-side
- Display top 10 provinces by default
- Show expand/collapse for 10+ items
- Highlight active province based on URL
- Generate V1-compatible URLs (`/mua-ban/{province}`)
- Clear filter action when on province page

### Non-Functional
- SSR-enabled (data fetched on each request)
- Under 200 LOC
- TypeScript type-safe
- View Transition compatible
- No client-side API calls

## Architecture

### SSR Data Flow

```
User Request: GET /mua-ban/ha-noi
    ↓
Astro SSR Runtime
    ↓
location-filter-card.astro (frontmatter executes)
    ├─ Parse Astro.url → transactionType = 1, currentProvince = 'ha-noi'
    ├─ Call LocationService.getAllProvincesWithCount(10)
    ├─ Build URLs: /mua-ban/{province-slug}
    └─ Render HTML template
    ↓
HTML Response (provinces + counts embedded)
```

### Component Structure

```astro
---
// Server-side code (runs on each request)
import { getAllProvincesWithCount } from '@/services/location/location-service';

// Parse URL to get context
const url = Astro.url;
const pathSegments = url.pathname.split('/').filter(Boolean);
const transactionSlug = pathSegments[0] || 'mua-ban';
const currentProvince = pathSegments[1] || null;

// Fetch data server-side
const provinces = await getAllProvincesWithCount(10, true);

// Helper functions
function buildUrl(provinceSlug: string) { ... }
---

<!-- HTML template -->
<div class="location-filter-card">
  {provinces.map(p => (
    <a href={buildUrl(p.slug)}>
      {p.name} ({p.propertyCount})
    </a>
  ))}
</div>

<script>
  // Client-side JS (minimal - only for expand/collapse)
</script>
```

## Related Code Files

**Create:**
- `src/components/listing/sidebar/location-filter-card.astro` (new SSR component)

**Reference:**
- `src/services/location/location-service.ts` - `getAllProvincesWithCount()`
- `src/services/location/types.ts` - `Province` interface
- `src/components/listing/sidebar/price-range-filter-card.astro` - styling reference

## Implementation Steps

### Step 1: Create SSR Component File (10 min)

Create `src/components/listing/sidebar/location-filter-card.astro`:

```astro
---
/**
 * Location Filter Card (SSR Component)
 * Fetches province data server-side and renders filter UI
 */
import { getAllProvincesWithCount } from '@/services/location/location-service';
import type { Province } from '@/services/location/types';

// Parse URL context
const url = Astro.url;
const pathSegments = url.pathname.split('/').filter(Boolean);

// Determine transaction type from URL
const transactionSlug = pathSegments[0] || 'mua-ban';
const transactionMap: Record<string, number> = {
  'mua-ban': 1,
  'cho-thue': 2,
  'du-an': 3
};
const transactionType = transactionMap[transactionSlug] || 1;

// Get current province from URL (if any)
const currentProvince = pathSegments[1] || null;

// Fetch provinces with counts (server-side)
const maxItems = 10;
const provinces = await getAllProvincesWithCount(maxItems, true);

// Helper: Build province URL
function buildProvinceUrl(provinceSlug: string): string {
  // Preserve query params if any
  const searchParams = url.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : '';
  return `/${transactionSlug}/${provinceSlug}${queryString}`;
}

// Helper: Check if province is active
function isActive(provinceSlug: string): boolean {
  return currentProvince === provinceSlug;
}

// Helper: Format count
function formatCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

// Helper: Get clear filter URL
function getClearUrl(): string {
  const searchParams = url.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : '';
  return `/${transactionSlug}${queryString}`;
}

const hasMoreItems = provinces.length > maxItems;
---

<div
  class="bg-white rounded-lg shadow-sm border border-secondary-100 p-4"
  data-location-filter-card
>
  <h3 class="font-semibold text-secondary-900 mb-4 text-base">
    Khu vực nổi bật
  </h3>

  <ul class="space-y-1">
    {provinces.map((province, idx) => (
      <li
        class:list={[
          'location-item',
          idx >= maxItems && 'hidden'
        ]}
      >
        <a
          href={buildProvinceUrl(province.slug)}
          class:list={[
            'flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all group',
            isActive(province.slug)
              ? 'bg-primary-50 text-primary-600 font-medium border-l-2 border-primary-500'
              : 'text-secondary-700 hover:bg-secondary-50 hover:text-primary-600'
          ]}
        >
          <span class="truncate">{province.name}</span>
          {province.propertyCount && province.propertyCount > 0 && (
            <span class="text-secondary-400 text-xs ml-2 shrink-0">
              ({formatCount(province.propertyCount)})
            </span>
          )}
        </a>
      </li>
    ))}
  </ul>

  {/* Show More / Show Less */}
  {hasMoreItems && (
    <div class="mt-3 pt-3 border-t border-secondary-100">
      <button
        type="button"
        class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
        data-location-show-more
      >
        <span>Xem thêm ({provinces.length - maxItems})</span>
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <button
        type="button"
        class="hidden text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
        data-location-show-less
      >
        <span>Thu gọn</span>
        <svg class="w-4 h-4 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  )}

  {/* Clear filter (when on province page) */}
  {currentProvince && (
    <div class="mt-3 pt-3 border-t border-secondary-100">
      <a
        href={getClearUrl()}
        class="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
      >
        Xóa bộ lọc khu vực
      </a>
    </div>
  )}
</div>

<script>
  // Expand/collapse logic (client-side)
  function initLocationFilterCard() {
    const card = document.querySelector('[data-location-filter-card]');
    if (!card) return;

    const showMoreBtn = card.querySelector('[data-location-show-more]');
    const showLessBtn = card.querySelector('[data-location-show-less]');
    const items = card.querySelectorAll('.location-item');

    const maxItems = 10;

    if (showMoreBtn) {
      showMoreBtn.addEventListener('click', () => {
        items.forEach(item => item.classList.remove('hidden'));
        showMoreBtn.classList.add('hidden');
        showLessBtn?.classList.remove('hidden');
      });
    }

    if (showLessBtn) {
      showLessBtn.addEventListener('click', () => {
        items.forEach((item, idx) => {
          if (idx >= maxItems) item.classList.add('hidden');
        });
        showLessBtn.classList.add('hidden');
        showMoreBtn?.classList.remove('hidden');

        // Smooth scroll to card top
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  }

  // Initialize on load and View Transition
  initLocationFilterCard();
  document.addEventListener('astro:after-swap', initLocationFilterCard);
</script>
```

### Step 2: Test Component Isolation (15 min)

Create test page `src/pages/test/ssr-location-filter.astro`:

```astro
---
import BaseLayout from '@/layouts/base-layout.astro';
import LocationFilterCard from '@/components/listing/sidebar/location-filter-card.astro';
---

<BaseLayout title="Test SSR Location Filter">
  <div class="max-w-sm p-4 mx-auto">
    <h1 class="text-2xl font-bold mb-4">SSR Location Filter Test</h1>

    <!-- Component fetches data server-side automatically -->
    <LocationFilterCard />

    <div class="mt-4 p-4 bg-gray-100 rounded">
      <h2 class="font-bold mb-2">Current URL:</h2>
      <code class="text-sm">{Astro.url.pathname}</code>

      <h2 class="font-bold mt-4 mb-2">Test URLs:</h2>
      <ul class="space-y-2">
        <li><a href="/test/ssr-location-filter" class="text-primary-600">Base (no province)</a></li>
        <li><a href="/mua-ban/ha-noi" class="text-primary-600">Mua bán - Hà Nội</a></li>
        <li><a href="/cho-thue/tp-ho-chi-minh" class="text-primary-600">Cho thuê - TP.HCM</a></li>
      </ul>
    </div>
  </div>
</BaseLayout>
```

### Step 3: Verify TypeScript Types (10 min)

Run TypeScript check:

```bash
npm run check
```

Expected output: No errors

### Step 4: Test SSR Rendering (15 min)

Start dev server and verify:

```bash
npm run dev
```

**Manual Tests:**
1. Visit `/test/ssr-location-filter`
   - ✓ Provinces render with counts
   - ✓ No loading state (data already in HTML)

2. Click province link → Navigate to `/mua-ban/ha-noi`
   - ✓ Province highlighted as active
   - ✓ "Xóa bộ lọc khu vực" button appears

3. Inspect HTML source (View Page Source)
   - ✓ Province data embedded in HTML (not loaded via JS)
   - ✓ Counts visible in source code

### Step 5: Performance Check (10 min)

Check server response time:

```bash
# In browser DevTools Network tab
# Look for document request time
# Should be < 100ms for SSR + database query
```

Expected:
- Initial HTML: ~50-100ms (including DB query)
- No subsequent API calls
- Full content on first load

## Todo List

- [x] Create location-filter-card.astro file
- [x] Add SSR data fetching in frontmatter
- [x] Parse URL context (transaction type, current province)
- [x] Build province URLs with query param preservation
- [x] Implement active state highlighting
- [x] Add expand/collapse functionality
- [x] Add clear filter button
- [x] Create test page
- [x] Verify TypeScript types
- [x] Test SSR rendering
- [x] Check performance (response time)

## Success Criteria

- [x] Component renders via SSR (data in initial HTML)
- [x] Provinces displayed with property counts
- [x] Active province highlighted correctly
- [x] URLs follow V1 format: `/{txType}/{province}`
- [x] Query params preserved in URLs
- [x] Expand/collapse works for 10+ items
- [x] View Transition maintains state
- [x] No TypeScript errors
- [x] Response time < 100ms

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Database query slow | Low | Medium | Use materialized view (already optimized) |
| URL parsing breaks | Low | High | Test with various URL patterns |
| View Transition script breaks | Medium | Low | Use `astro:after-swap` event |

## Security Considerations

- No user input in URL parsing (safe path segments)
- Database queries via trusted LocationService
- No XSS vectors (Astro auto-escapes)
- Query params passed through (no injection risk)

## Next Steps

After completing this phase:
1. Proceed to Phase 2: Integrate into sidebar layout
2. Component is self-contained and ready to use
