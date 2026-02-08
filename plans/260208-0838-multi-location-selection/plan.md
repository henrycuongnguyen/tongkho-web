---
title: "Multi-Location Selection Feature"
description: "Enable selecting multiple locations via autocomplete for property filtering"
status: pending
priority: P1
effort: 6h
branch: listing72
tags: [feature, location, autocomplete, htmx, elasticsearch]
created: 2026-02-08
---

# Multi-Location Selection Feature

## Overview

Implement multi-location selection in the listing page autocomplete, allowing users to select multiple provinces, districts, or wards. The first location goes in the URL path (arg2), additional locations go in `addresses` query param.

**Target URL Pattern:**
```
/mua-ban/phuong-ba-dinh-thanh-pho-ha-noi?addresses=quan-cau-giay-thanh-pho-ha-noi,quan-hoan-kiem-thanh-pho-ha-noi
```

## Current State

| Component | Status | File |
|-----------|--------|------|
| Single location via URL path | Working | `[...slug].astro`, `listing-url-parser.ts` |
| Location autocomplete | Working | `location-autocomplete.astro`, `api/location/search.ts` |
| Province/district selector | Working | `location-selector.astro` |
| ElasticSearch location search | Working | `location-search-service.ts` |

## Key Insights from V1 Reference

1. **URL Structure** (from `search-url-builder.js:160-167`):
   - First address -> URL path arg2: `/mua-ban/{first-location-slug}`
   - Additional addresses -> `?addresses=slug2,slug3,...`

2. **LocalStorage Pattern** (from `search-bar-storage.min.js`):
   - Key: `selected-addresses-{tab-instance-id}` (per-tab isolation)
   - Store: `[{slug, title, type, nId}, ...]` array

3. **UI Pattern** (from `search.js:46-49`):
   - Single location: show title text
   - Multiple: show "Da chon X dia diem" (Selected X locations)
   - Chips for removal (X button per location)

4. **ID Type** (CRITICAL from Memory):
   - Use `nId` (string like "VN-HN") NOT `id` (integer PK)
   - ES documents store `province_id`, `district_id` as strings

## Phases

| Phase | Description | Status | Effort |
|-------|-------------|--------|--------|
| 1 | URL Parser: Parse `addresses` query param | pending | 1h |
| 2 | Location Service: Batch resolve slugs to nIds | pending | 1h |
| 3 | Autocomplete: Multi-select with chips UI | pending | 2h |
| 4 | LocalStorage: Per-tab persistence | pending | 1h |
| 5 | Integration: Wire all components | pending | 1h |

## Dependencies

- ElasticSearch locations index with `n_slug` field
- Existing `searchLocations()` in `location-search-service.ts`
- HTMX for autocomplete dropdown

## Files to Modify

1. `src/utils/listing-url-parser.ts` - Add `addresses` param parsing
2. `src/services/location/location-service.ts` - Add batch slug resolution
3. `src/components/listing/location-autocomplete.astro` - Multi-select UI
4. `src/pages/api/location/search.ts` - Return data for chip display
5. `src/pages/[...slug].astro` - Merge path + addresses locations

## Success Criteria

- [ ] Select multiple locations from autocomplete
- [ ] First location in URL path, rest in `addresses` param
- [ ] Locations persist in localStorage across navigations
- [ ] Chips display with remove button
- [ ] ES query filters by all selected location nIds
- [ ] No infinite reload loops (same pattern as previous fixes)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| ID type mismatch | Always use nId (string), verified in Phase 2 |
| Infinite reload | Check URL before navigation (established pattern) |
| LocalStorage collision | Per-tab key with session ID |
| Large query strings | Limit to 10 locations max |
