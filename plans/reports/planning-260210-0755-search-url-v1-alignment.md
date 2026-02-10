# Planning Report: Search URL v1 Alignment

**Date:** 2026-02-10 07:55
**Type:** Feature Implementation Plan
**Priority:** High
**Status:** Ready for Review

## Summary

Created comprehensive 5-phase plan to align v2 search URL building with v1 format, supporting SEO-friendly URLs and multi-location search.

## v1 URL Format Analyzed

```
/[property-type-slug]/[location]/[price-slug]?[query-params]
```

**Example:**
```
/ban-can-ho-chung-cu/quan-ba-dinh-thanh-pho-ha-noi/gia-tu-1-ty-den-2-ty?addresses=quan-tay-ho,quan-hoan-kiem&radius=10&bathrooms=2&bedrooms=3&dtnn=50&dtcn=80
```

**Key Findings:**

1. **Arg0 (Property Type or Transaction):**
   - Single property type → slug (e.g., `ban-can-ho-chung-cu`)
   - Otherwise → transaction slug (`mua-ban`, `cho-thue`, `du-an`)
   - Multiple types → transaction + `property_types` param

2. **Arg1 (Location):**
   - Single → slug in path
   - Multiple → first in path, rest in `addresses` param
   - No location + price → `toan-quoc`

3. **Arg2 (Price):**
   - Predefined ranges → slug (e.g., `gia-tu-1-ty-den-2-ty`)
   - Custom ranges → `gtn/gcn` query params

4. **Query Params:**
   - `addresses` - Additional locations
   - `property_types` - Multiple types
   - `radius`, `bathrooms`, `bedrooms` - Room/distance filters
   - `dtnn`, `dtcn` - Area range
   - `gtn`, `gcn` - Custom price (slug format)

## Current v2 Issues

**Hero Search (`hero-search.astro`):**
- ❌ Query-param-only URLs
- ❌ Location ignored in URL
- ❌ No price slug conversion
- ❌ No property type slug support

**Listing Search (`horizontal-search-bar.astro`):**
- ❌ Uses `gtn/gcn` instead of price slugs
- ❌ Doesn't extract location from URL
- ❌ Partial v1 alignment only

**Missing Features:**
- ❌ No multi-location UI
- ❌ No property type slug mapping
- ❌ No predefined price range detection

## Implementation Phases

### Phase 1: URL Builder Service ✅ Planned
- Create type definitions
- Price slug converter utilities
- Central URL builder service
- Export from existing parser

**Files to Create:**
- `src/types/search-filters.ts`
- `src/services/url/price-slug-converter.ts`
- `src/services/url/search-url-builder.ts`

### Phase 2: Hero Search Integration ✅ Planned
- Add property type `data-slug` attributes
- Load URL builder script
- Update search button handler
- Transaction type tab switching

**Files to Modify:**
- `src/components/home/hero-search.astro`

### Phase 3: Listing Search Integration ✅ Planned
- Extract current context from URL
- Update search submit handler
- Filter change handlers
- Preserve all query params

**Files to Modify:**
- `src/components/listing/horizontal-search-bar.astro`
- `src/components/listing/sidebar/price-range-filter-card.astro`
- `src/components/listing/sidebar/area-range-filter-card.astro`

### Phase 4: Multi-Location UI ✅ Planned
- Location dropdown → checkbox multi-select
- "Đã chọn X địa điểm" display
- Select All / Clear All buttons
- Update district API response

**Files to Create:**
- `src/components/ui/location-multi-selector.astro`

**Files to Modify:**
- `src/components/ui/location-dropdown.astro`
- `src/pages/api/location/districts.ts`

### Phase 5: Testing & Validation ✅ Planned
- Automated unit tests
- Manual testing checklist
- v1/v2 URL comparison
- Cross-browser testing
- Performance benchmarks

**Files to Create:**
- `src/tests/search-url-builder.test.ts`

## v1 Reference Files Used

1. **`search-url-builder.js`** - Complete URL building logic
   - Price conversion functions
   - Predefined price ranges
   - URL path construction
   - Query param handling

2. **`home-search-bar.html`** - Hero search UI
   - Location dropdown structure
   - Multi-location display
   - Transaction type tabs

3. **`homepage_filters_muaban.html`** - Advanced filters
   - Property type checkboxes with `data-slug`
   - Price range options
   - Area range options

## Test Coverage Plan

**Automated Tests:**
- ✅ Price slug conversion (ty/trieu formats)
- ✅ Predefined price range detection
- ✅ URL building for all filter combinations
- ✅ Multi-location URL structure
- ✅ Query param preservation

**Manual Tests:**
- ✅ Hero search all scenarios
- ✅ Listing search updates
- ✅ Multi-location selection
- ✅ Transaction type switching
- ✅ Cross-browser compatibility

**URL Comparison:**
- ✅ v1 vs v2 URL matrix
- ✅ 100% format match target

## Risk Assessment

**Medium Risks:**
- Breaking existing deep links
- URL parsing logic mismatch
- Property type slug mapping incomplete

**Mitigation:**
- Backward compatibility layer
- Comprehensive testing
- Gradual rollout with feature flag

## Success Metrics

- ✅ All URLs match v1 format exactly
- ✅ Multi-location support working
- ✅ SEO-friendly price/location slugs
- ✅ No regression in search functionality
- ✅ Performance <10ms per URL build

## Plan Location

**Directory:** `plans/260210-0755-search-url-v1-alignment/`

**Files:**
- `plan.md` - Overview
- `phase-01-url-builder-service.md` - Core service
- `phase-02-hero-search-integration.md` - Home page
- `phase-03-listing-search-integration.md` - Listing page
- `phase-04-multi-location-ui.md` - Multi-select UI
- `phase-05-testing-validation.md` - Testing plan

## Next Steps

1. ✅ Review plan with user
2. ⏳ Implement Phase 1 (URL builder service)
3. ⏳ Integrate hero search (Phase 2)
4. ⏳ Add multi-location UI (Phase 4)
5. ⏳ Comprehensive testing (Phase 5)

## Questions for User

None - plan is complete and ready for implementation.

## Estimated Effort

- Phase 1: 2-3 hours (service creation + tests)
- Phase 2: 2-3 hours (hero search integration)
- Phase 3: 2-3 hours (listing search integration)
- Phase 4: 3-4 hours (multi-location UI + API)
- Phase 5: 2-3 hours (testing + validation)

**Total:** 11-16 hours

## Implementation Priority

1. **High:** Phase 1 (foundation for all)
2. **High:** Phase 2 (hero search - most visible)
3. **Medium:** Phase 3 (listing search - less visible)
4. **Medium:** Phase 4 (multi-location - nice to have)
5. **High:** Phase 5 (validation - critical)

---

**Plan Status:** Ready for user approval and implementation
