# Search URL Building - v1 Alignment

**Status:** Draft
**Priority:** High
**Created:** 2026-02-10
**Branch:** listing72

## Overview

Align v2 search URL building with v1 logic to ensure proper SEO-friendly URLs and multi-location support.

**Current State:**
- Hero search: Query-param-only URLs (`/mua-ban?q=...&city=...`)
- Listing search: Missing location context, uses `gtn/gcn` instead of price slugs
- No multi-location support via `addresses` param
- Property types not in URL path

**Target State:**
- v1-compatible URLs: `/[property-type-slug]/[location]/[price-slug]?[params]`
- Multi-location support: First location in path, rest in `addresses` param
- Price slugs in URL path (predefined ranges) or `gtn/gcn` params (custom)
- Area/rooms/radius in query params

**Example URL:**
```
/ban-can-ho-chung-cu/quan-ba-dinh-thanh-pho-ha-noi/gia-tu-1-ty-den-2-ty?addresses=quan-tay-ho,quan-hoan-kiem&radius=10&bathrooms=2&bedrooms=3&dtnn=50&dtcn=80
```

## Phases

1. **[Phase 1: URL Builder Service](phase-01-url-builder-service.md)** - Create centralized URL building service
2. **[Phase 2: Hero Search Integration](phase-02-hero-search-integration.md)** - Update home page search bar
3. **[Phase 3: Listing Search Integration](phase-03-listing-search-integration.md)** - Update listing page search bar
4. **[Phase 4: Multi-Location UI](phase-04-multi-location-ui.md)** - Add multi-location selection UI
5. **[Phase 5: Testing & Validation](phase-05-testing-validation.md)** - Verify URL building correctness

## Related Files

**To Modify:**
- `src/components/home/hero-search.astro` - Home search bar
- `src/components/listing/horizontal-search-bar.astro` - Listing search bar
- `src/utils/listing-url-parser.ts` - Add URL building functions

**To Create:**
- `src/services/url/search-url-builder.ts` - URL building service
- `src/types/search-filters.ts` - Type definitions

**Reference:**
- `reference/resaland_v1/static/js/module/search-url-builder.js` - v1 implementation

## Key Dependencies

- Property type slug mapping (from database)
- Location slug format (single vs multi)
- Price range predefined options
- Query param standards

## Success Criteria

- ✅ Search URLs match v1 format exactly
- ✅ Single location → URL path
- ✅ Multi-location → `addresses` param
- ✅ Price slugs for predefined ranges
- ✅ Custom prices use `gtn/gcn` params
- ✅ All filters preserved in URL
- ✅ Backward compatible with existing URLs

## Risk Assessment

**Medium Risk:**
- Breaking existing deep links
- URL parsing logic mismatch
- Property type slug mapping incomplete

**Mitigation:**
- Test with existing URLs first
- Keep backward compatibility
- Add comprehensive URL validation

## Next Steps

1. Review plan with user
2. Create URL builder service (Phase 1)
3. Update hero search (Phase 2)
4. Add multi-location UI (Phase 4)
5. Test thoroughly (Phase 5)
