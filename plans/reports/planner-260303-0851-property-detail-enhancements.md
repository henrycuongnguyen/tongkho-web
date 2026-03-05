# Plan Report: Property Detail Breadcrumbs & Recently Viewed

**Date:** 2026-03-03
**Agent:** planner
**Plan:** `plans/260303-0851-property-detail-breadcrumbs-recently-viewed/`

## Summary

Created detailed implementation plan for two property detail page enhancements:
1. Fix breadcrumbs to match v1 hierarchy
2. Add recently viewed properties tracking

## Research Findings

### Breadcrumbs

**v1 Structure** (from `bds.py:962-1023`):
```
Trang chủ > Transaction > Property Type > City > District > Ward
```

**Current v2 Problem:**
- Missing property type level
- Missing location hierarchy
- Only shows: `Trang chủ > Mua Bán > [Title]`

**v1 URL Patterns:**
- Property type: `/{slug}` (e.g., `/ban-can-ho-chung-cu`)
- Locations: `?selected_addresses={slug}`

### Recently Viewed

**v1 Implementation** (from `watched_properties.js`):
- Storage: `localStorage.watched_properties_list`
- Max 8 items, newest first
- Current property excluded from display
- AJAX fetch for card data
- Swiper on mobile, grid on desktop

**Existing v2 Pattern:**
- `compare-manager.ts` provides excellent reference
- Singleton IIFE, localStorage, event delegation, XSS sanitization

## Deliverables

| File | Description |
|------|-------------|
| `plan.md` | Overview with phase summary |
| `phase-01-breadcrumbs-component.md` | Breadcrumb component (2h) |
| `phase-02-recently-viewed-system.md` | Recently viewed system (4h) |

## Key Architecture Decisions

1. **Breadcrumbs:** Create reusable component accepting property + location data
2. **Recently Viewed:** Client-side localStorage + API endpoint for batch fetch
3. **Data attributes already exist** in `property-info-section.astro` (lines 52-62)

## Files to Create

1. `src/components/property/property-detail-breadcrumb.astro`
2. `src/scripts/watched-properties-manager.ts`
3. `src/pages/api/properties/batch.ts`

## Files to Modify

1. `src/pages/bds/[slug].astro` - Add breadcrumb, fetch data, add container
2. `src/pages/du-an/[slug].astro` - Add breadcrumb
3. `src/layouts/base-layout.astro` - Import manager (optional)

## Effort Estimate

- Phase 1 (Breadcrumbs): 2 hours
- Phase 2 (Recently Viewed): 4 hours
- **Total: 6 hours**

## Unresolved Questions

1. Should project detail page use same "Dự Án" breadcrumb or transaction-based?
   - Plan assumes: `Trang chủ > Dự Án > [Location]`

2. Recently viewed section position: after Related Properties or before?
   - Plan assumes: after Related Properties (matches v1 order)

3. Should API endpoint be cached server-side or rely on browser cache?
   - Plan assumes: 5-minute Cache-Control header
