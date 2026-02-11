# Phase 2: Integrate Location Filter Card into Sidebar

## Context Links
- [Plan Overview](./plan.md)
- [Phase 1: SSR Component](./phase-01-ssr-location-filter-card.md)
- [sidebar-wrapper.astro](../../src/components/listing/sidebar/sidebar-wrapper.astro)

## Overview

**Priority:** P1
**Status:** Completed
**Effort:** 1h
**Completed:** 2026-02-10

Integrate the SSR `location-filter-card.astro` component into the listing page sidebar layout.

## Key Insights

1. **Self-Contained**: Component handles its own data fetching (no props needed)
2. **Placement**: After contact banner, before price filter
3. **SSR Compatible**: No changes needed to parent components
4. **Simple Integration**: Just add `<LocationFilterCard />` import

## Requirements

### Functional
- Add location filter card to sidebar
- Position correctly in sidebar layout
- Maintain existing sidebar components
- Works on all listing pages

### Non-Functional
- No props drilling needed (SSR handles context)
- No breaking changes to existing sidebar
- Maintains responsive design

## Architecture

### Sidebar Component Hierarchy

```
[...slug].astro (Listing Page)
    ↓
sidebar-wrapper.astro
    ├─ contact-banner.astro (existing)
    ├─ location-filter-card.astro (NEW - SSR)
    ├─ price-range-filter-card.astro (existing)
    ├─ area-range-filter-card.astro (existing)
    └─ dynamic-sidebar-filters.astro (existing)
```

## Related Code Files

**Modify:**
- `src/components/listing/sidebar/sidebar-wrapper.astro` - add location card import

**No Changes Needed:**
- `src/pages/[...slug].astro` - sidebar already SSR-enabled
- `src/components/listing/sidebar/location-filter-card.astro` - self-contained

## Implementation Steps

### Step 1: Import Component (5 min)

Modify `sidebar-wrapper.astro`:

```astro
---
// Existing imports
import ContactBanner from './contact-banner.astro';
import PriceRangeFilterCard from './price-range-filter-card.astro';
import AreaRangeFilterCard from './area-range-filter-card.astro';
import DynamicSidebarFilters from './dynamic-sidebar-filters.astro';

// NEW: Import location filter card
import LocationFilterCard from './location-filter-card.astro';

// ... existing code
---
```

### Step 2: Add to Sidebar Layout (10 min)

Insert component after contact banner:

```astro
<aside class="space-y-4">
  <!-- Existing: Contact banner -->
  <ContactBanner />

  <!-- NEW: Location filter card (SSR) -->
  <LocationFilterCard />

  <!-- Existing: Price filter -->
  <PriceRangeFilterCard
    transactionType={transactionType}
    currentPriceRange={currentPriceRange}
  />

  <!-- Existing: Area filter -->
  <AreaRangeFilterCard
    currentAreaRange={currentAreaRange}
  />

  <!-- Existing: Dynamic filters -->
  <DynamicSidebarFilters
    transactionType={transactionType}
    propertyTypes={propertyTypes}
  />
</aside>
```

### Step 3: Test Integration (20 min)

**Test URLs:**
1. `/mua-ban` - Should show location card
2. `/mua-ban/ha-noi` - Location card with "Hà Nội" active
3. `/cho-thue/tp-ho-chi-minh` - Different transaction type
4. `/mua-ban?property_types=can-ho` - With query params

**Verify:**
- [ ] Location card appears in sidebar
- [ ] Positioned correctly (after contact, before price)
- [ ] No layout breaks
- [ ] Responsive on mobile
- [ ] Works with View Transitions

### Step 4: Responsive Design Check (15 min)

Test on different screen sizes:

**Desktop (≥1024px):**
- Sidebar width: 320px
- Location card fits without horizontal scroll

**Tablet (768px - 1023px):**
- Sidebar remains visible
- Card layout intact

**Mobile (<768px):**
- Sidebar may be hidden/collapsible
- Card renders correctly when shown

### Step 5: Performance Verification (10 min)

Check impact on page load time:

```bash
# Before: Baseline listing page load
# After: With location card added
# Expected increase: +10-30ms (database query)
```

**Metrics to check:**
- Server response time (should be <150ms total)
- No cumulative layout shift (CLS)
- No hydration errors in console

## Todo List

- [x] Import LocationFilterCard in sidebar-wrapper.astro
- [x] Add component to sidebar layout
- [x] Position after contact banner
- [x] Test on /mua-ban (no province)
- [x] Test on /mua-ban/ha-noi (with province)
- [x] Test with query parameters
- [x] Check responsive design (mobile/tablet/desktop)
- [x] Verify View Transition compatibility
- [x] Measure performance impact
- [x] Check for console errors

## Success Criteria

- [x] Location card visible in sidebar
- [x] Correct position in layout
- [x] No layout breaks or overlaps
- [x] Works on all listing page URLs
- [x] Responsive on all screen sizes
- [x] No console errors
- [x] Page load time increase <50ms

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Layout breaks on mobile | Low | Medium | Test responsive design |
| SSR timing issue | Very Low | Low | Component is self-contained |
| Performance degradation | Low | Medium | Monitor response times |

## Security Considerations

- No new security concerns (component is SSR, no user input)

## Next Steps

After completing this phase:
1. Proceed to Phase 3: URL building and V1 compatibility
2. Verify URLs match V1 format exactly
