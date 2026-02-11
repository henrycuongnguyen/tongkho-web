---
title: "Price History Migration V1 to V2"
description: "Port v1 price history logic to v2 listing page sidebar"
status: pending
priority: P2
effort: 4h
branch: listing72ui
tags: [migration, sidebar, chart, price-history]
created: 2026-02-11
---

# Price History Migration: V1 to V2

## Overview

Migrate price history functionality from v1 (Web2py AJAX tabs) to v2 (Astro SSG sidebar card). V1 uses tabbed AJAX loading with base64-encoded chart data; v2 will use static props-based sidebar card with mock data generation.

## Research Reports

- [V1 Price History Analysis](./research/researcher-01-v1-price-history.md)
- [V2 Listing Structure Analysis](./research/researcher-02-v2-listing-structure.md)

## Architecture Summary

| Aspect | V1 | V2 |
|--------|----|----|
| Loading | AJAX LOAD() tabs | SSG static props |
| Data | Backend pre-computed | Mock generation (existing) |
| UI | Standalone section | Sidebar card |
| Chart | Chart.js base64 JSON | Chart.js data attribute |

## Implementation Phases

| Phase | Description | Status | Effort |
|-------|-------------|--------|--------|
| [Phase 1](./phase-01-analyze-requirements.md) | Analyze requirements & gap analysis | pending | 30m |
| [Phase 2](./phase-02-create-data-service.md) | Create price history data service | pending | 45m |
| [Phase 3](./phase-03-create-sidebar-card.md) | Create sidebar card component | pending | 1.5h |
| [Phase 4](./phase-04-integrate-listing-page.md) | Integrate into [...slug].astro | pending | 30m |
| [Phase 5](./phase-05-testing-validation.md) | Testing and validation | pending | 45m |

## Key Files

**Existing (to reference):**
- `src/components/property/price-history-chart.astro` - Existing chart (182 lines)
- `src/components/listing/sidebar/sidebar-wrapper.astro` - Sidebar orchestrator
- `src/pages/[...slug].astro` - Main listing page

**New (to create):**
- `src/components/listing/sidebar/price-history-card.astro` - New sidebar card
- `src/utils/price-history-utils.ts` - Shared utility functions (optional)

## Data Flow

```
[...slug].astro
  └─ filters.minPrice / filters.maxPrice (from URL)
      └─ SidebarWrapper (props)
          └─ PriceHistoryCard (samplePrice prop)
              └─ generatePriceHistory() → Chart.js
```

## Dependencies

- Chart.js (already loaded: `/js/chart.umd.min.js`)
- Tailwind CSS (existing)
- V2 sidebar card pattern (reference: price-range-filter-card.astro)

## Success Criteria

1. Price history card displays in sidebar (between AreaRange and DynamicFilters)
2. 2-year/5-year toggle works
3. Chart renders correctly with mock data
4. Styling matches existing v2 card pattern
5. No console errors, TypeScript passes

## Risks

| Risk | Mitigation |
|------|------------|
| Chart.js conflicts | Use isolated data attribute pattern |
| Card too tall for sidebar | Reduce chart height to h-48 (vs h-64) |
| Mock data feels generic | Add disclaimer text (existing pattern) |

## Notes

- Following YAGNI: Using mock data like existing component (real data = future phase)
- Following KISS: Minimal wrapper around existing chart logic
- Following DRY: Extract `generatePriceHistory()` to shared util if reused

## Validation Log

### Session 1 — 2026-02-11
**Trigger:** Initial plan creation validation
**Questions asked:** 5

#### Questions & Answers

1. **[Data Source]** The plan uses mock data generation instead of real backend price history. Should we proceed with mock data for MVP or integrate with real v1 database now?
   - Options: Mock data for MVP (Recommended) | Integrate v1 database now | Hybrid approach
   - **Answer:** Integrate v1 database now
   - **Rationale:** User wants real price history from v1 PostgreSQL immediately, not mock data. Requires database service layer and schema integration.

2. **[Visibility]** Price history card will always show (even without price filters). Should it be conditional or always visible?
   - Options: Always show (Recommended) | Hide when no price filter | Show but with placeholder
   - **Answer:** Hide when no price filter
   - **Rationale:** Card should only appear when user sets minPrice or maxPrice filter, reducing noise in default sidebar state.

3. **[Price Calc]** Sample price calculation uses filters.maxPrice (upper bound). Should it use maxPrice, average, or midpoint?
   - Options: Use maxPrice (Recommended) | Use midpoint (min+max)/2 | Use actual search results average
   - **Answer:** Use maxPrice (Recommended)
   - **Rationale:** Simple approach showing high-end trend, no additional calculation overhead.

4. **[Chart.js Load]** Chart.js is loaded via static file. Should we verify CDN availability or bundle it?
   - Options: Keep static file (Recommended) | Add fallback CDN | Bundle via npm
   - **Answer:** ở v2 cần build cho phù hợp với astro, ở chi tiết tôi thấy cũng có biểu đồ rồi, xem có đưa qua được không
   - **Custom input:** User suggests checking if detail page chart component can be adapted for Astro build compatibility
   - **Rationale:** Reuse existing price-history-chart.astro if possible to avoid duplication, ensure Astro build compatibility.

5. **[Chart Reuse]** User wants to check if detail page chart can be reused. Should we adapt existing price-history-chart.astro or create new sidebar-specific component?
   - Options: Reuse detail page chart (Recommended) | Create new sidebar component | Extract shared chart logic
   - **Answer:** ở listing chart hiện riêng 1 section
   - **Custom input:** Chart should display as separate section on listing page, not reuse detail component
   - **Rationale:** Listing page requires distinct chart section/component, not sidebar card pattern originally planned.

#### Confirmed Decisions
- **Data source**: Real v1 database integration (not mock data)
- **Visibility**: Conditional rendering (only when price filters active)
- **Price calculation**: Use filters.maxPrice
- **Chart location**: Separate section on listing page (not sidebar card)
- **Chart component**: New listing-specific component (not reuse detail page chart)

#### Action Items
- [ ] Add Phase 2a: Create database service for v1 price history table
- [ ] Update Phase 3: Change from sidebar card to listing page section component
- [ ] Update Phase 4: Integration into listing page main content (not sidebar)
- [ ] Add conditional rendering logic (show only when minPrice or maxPrice set)
- [ ] Research v1 price history table schema and API endpoints

#### Impact on Phases
- **Phase 2**: Add database service layer to fetch real price history from v1 PostgreSQL instead of mock data generation. Requires DB schema analysis and service implementation.
- **Phase 3**: Change component from sidebar card (`price-history-card.astro`) to listing page section component. Update styling from sidebar pattern to main content section pattern.
- **Phase 4**: Integration point changes from sidebar-wrapper.astro to main listing grid/content area in [...slug].astro. Add conditional rendering based on filters.minPrice or filters.maxPrice.
- **Overall effort**: Increase from 4h to ~6-7h due to database integration complexity.
