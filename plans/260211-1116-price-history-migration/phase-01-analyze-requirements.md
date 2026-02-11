# Phase 1: Analyze Requirements

## Context Links

- [V1 Price History Research](./research/researcher-01-v1-price-history.md)
- [V2 Listing Structure Research](./research/researcher-02-v2-listing-structure.md)
- [Plan Overview](./plan.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-11 |
| Priority | P2 |
| Status | pending |
| Effort | 30m |
| Description | Gap analysis between v1 and v2 implementations |

## Key Insights

### V1 Implementation

1. **AJAX Loading**: Uses Web2py LOAD() for 2-year and 5-year tabs
2. **Backend Data**: Pre-computed `analyzedData` with:
   - `commonPriceValue` (common price in area)
   - `changedPercentValue` (+/-X%)
   - `changedPercentStatus` (up/down indicator)
3. **Base64 Encoding**: Price history JSON stored in HTML data attribute
4. **Query Params**: city, district, slug, year

### V2 Implementation (Existing)

1. **Static Props**: Data passed via Astro component props
2. **Mock Generation**: `generatePriceHistory()` creates simulated data
3. **Chart.js**: Already loaded at `/js/chart.umd.min.js`
4. **Sidebar Pattern**: 6 existing cards with consistent styling

### Gap Analysis

| Feature | V1 | V2 Current | V2 Target |
|---------|----|-----------:|-----------|
| Real price data | Yes (backend) | No | No (YAGNI) |
| 2yr/5yr toggle | Yes | Yes | Yes |
| Price change % | Yes | Yes | Yes |
| Sidebar card | No (section) | No | Yes (new) |
| AJAX loading | Yes | No | No (static) |
| Location-aware | Yes | No | No (mock) |

## Requirements

### Functional Requirements

1. **FR-01**: Display price history chart in listing sidebar
2. **FR-02**: Support 2-year and 5-year period toggles
3. **FR-03**: Show price change percentage with up/down indicator
4. **FR-04**: Display current price reference point
5. **FR-05**: Include disclaimer about mock data

### Non-Functional Requirements

1. **NFR-01**: Card height max 320px to fit sidebar
2. **NFR-02**: Chart responsive to container width
3. **NFR-03**: TypeScript strict mode compliant
4. **NFR-04**: Zero JavaScript overhead for static parts
5. **NFR-05**: Match existing sidebar card styling

## Architecture

### Component Placement

```
SidebarWrapper
├── ContactCard
├── PriceRangeFilterCard
├── AreaRangeFilterCard
├── PriceHistoryCard       <-- NEW (insert here)
├── DynamicSidebarFilters
├── LocationFilterCard
└── FeaturedProjectBanner
```

### Props Flow

```typescript
// sidebar-wrapper.astro receives:
interface Props {
  filters: PropertySearchFilters;
  // ... existing props
}

// PriceHistoryCard receives:
interface Props {
  samplePrice?: number;  // Optional, defaults to 3000 (3 tỷ)
  priceUnit?: 'billion' | 'million';
}
```

## Related Code Files

### To Modify

1. `src/components/listing/sidebar/sidebar-wrapper.astro`
   - Add import for PriceHistoryCard
   - Add component between AreaRangeFilterCard and DynamicSidebarFilters

### To Create

1. `src/components/listing/sidebar/price-history-card.astro`
   - New sidebar card component
   - Adapted from `src/components/property/price-history-chart.astro`

### Reference Files

1. `src/components/property/price-history-chart.astro` - Existing chart logic
2. `src/components/listing/sidebar/price-range-filter-card.astro` - Card styling pattern

## Implementation Steps

1. Review existing `price-history-chart.astro` (182 lines)
2. Document reusable parts:
   - `generatePriceHistory()` function
   - Chart.js configuration
   - Period toggle logic
3. Identify changes needed for sidebar context:
   - Reduce chart height (h-64 → h-48)
   - Simplify header (remove "Lịch sử giá" title redundancy)
   - Match card styling (.bg-white.rounded-lg.shadow-sm.border)
4. Create acceptance criteria checklist

## Todo List

- [ ] Review existing price-history-chart.astro structure
- [ ] Document reusable code sections
- [ ] Define card height constraints
- [ ] Create component interface (Props)
- [ ] Validate Chart.js CDN availability

## Success Criteria

- [ ] Gap analysis complete
- [ ] Props interface defined
- [ ] Placement in sidebar confirmed
- [ ] Height constraints documented
- [ ] Reusable code identified

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Existing chart tightly coupled | Low | Medium | Create fresh component |
| Chart.js not loading | Low | High | Verify CDN path |

## Security Considerations

- No user input processed
- No external data fetched
- Mock data only

## Next Steps

→ [Phase 2: Create Data Service](./phase-02-create-data-service.md)
