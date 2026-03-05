---
status: completed
priority: high
created: 2026-03-05
updated: 2026-03-05
completed: 2026-03-05
complexity: medium
effort: 2-3 hours
risk: low-medium
---

# Fix Property Type URL Structure

## Problem

Property type URLs in horizontal search bar don't match v1 logic:
- **Current (Wrong):** `/mua-ban/ha-noi?property_types=12` (always uses query param)
- **Expected (Correct):**
  - Single type: `/ban-can-ho-chung-cu/ha-noi` (use property type slug)
  - Multiple types: `/mua-ban/ha-noi?property_types=12,13` (use query param)

## Root Cause

1. `horizontal-search-bar.astro` builds URLs manually (lines 1769-1849)
2. Checkboxes missing `data-slug` attributes (line 268)
3. Doesn't use existing `buildSearchUrl()` function that has correct logic

## Solution

Reuse existing `buildSearchUrl()` function (DRY principle):
- Add `data-slug` attributes to checkboxes
- Import `buildSearchUrl()` and `buildPropertyTypeSlugMap()`
- Replace manual URL building with function call
- Consistent with hero-search implementation

## Implementation Phases

| Phase | Description | Status |
|-------|-------------|--------|
| [Phase 1](./phase-01-update-checkboxes.md) | Add data-slug attributes to checkboxes | ✅ Complete |
| [Phase 2](./phase-02-integrate-buildSearchUrl.md) | Replace manual URL building with buildSearchUrl | ✅ Complete |
| [Phase 3](./phase-03-testing.md) | Test single vs multiple property type URLs | ✅ Complete |

## Key Files

**Modified:**
- `src/components/listing/horizontal-search-bar.astro` - Main fix

**Referenced:**
- `src/services/url/search-url-builder.ts` - URL building logic
- `src/services/property-type-service.ts` - Property type data with slugs

## Success Criteria

- ✅ Single property type → URL uses property type slug in path
- ✅ Multiple property types → URL uses transaction slug + query param
- ✅ All other filters (price, location, etc.) work correctly
- ✅ URL format matches v1 exactly
- ✅ No breaking changes to existing URLs

## Context

**Brainstorm Report:** [brainstorm-260305-1014-property-type-url-fix.md](../reports/brainstorm-260305-1014-property-type-url-fix.md)
**Scout Report:** Embedded in brainstorm report

## Estimated Effort

- **Total Time:** 2-3 hours
- **Complexity:** Medium
- **Risk:** Low-Medium (isolated change)
