---
title: "Sidebar Location Filter Cards (SSR)"
description: "Add province/district filter cards to listing sidebar using Astro SSR"
status: completed
priority: P2
effort: 5h
branch: listing72ui
tags: [sidebar, filters, location, ssr, astro]
created: 2026-02-10
updated: 2026-02-10
completed: 2026-02-10
---

# Sidebar Location Filter Cards (SSR Approach)

## Overview

Add location-based filter cards to listing page sidebar using **Astro SSR** (Server-Side Rendering). Data is fetched server-side on each request, eliminating need for build-time generation or client-side API calls.

## Key Architecture Decision: SSR

**Why SSR instead of Build-Time:**
- ✅ Fresh data on every request (no stale counts)
- ✅ Simpler architecture (no caching layer needed)
- ✅ Dynamic filtering based on URL context
- ✅ Better for frequently updated property counts
- ✅ Astro handles response caching automatically

**How SSR Works:**
```
User Request → Astro SSR
              ↓
    location-filter-card.astro
              ↓
    LocationService.getAllProvincesWithCount()
              ↓
    Database Query (locations_with_count_property)
              ↓
    Render HTML with data
              ↓
    Response to User
```

## Implementation Phases

| Phase | Description | Effort | Status |
|-------|-------------|--------|--------|
| [Phase 1](./phase-01-ssr-location-filter-card.md) | SSR component with data fetching | 2h | completed |
| [Phase 2](./phase-02-integrate-sidebar.md) | Integration with sidebar layout | 1h | completed |
| [Phase 3](./phase-03-url-building-navigation.md) | URL building and V1 compatibility | 1h | completed |
| [Phase 4](./phase-04-testing-validation.md) | Testing and validation | 1h | completed |

## SSR Data Flow

```
[...slug].astro (Listing Page - SSR enabled)
    ↓
sidebar-wrapper.astro
    ↓
location-filter-card.astro (SSR Component)
    ├─ Parse URL context (transactionType, currentProvince)
    ├─ Fetch provinces: LocationService.getAllProvincesWithCount()
    ├─ Build filter URLs
    └─ Render HTML with data

Runtime (No API calls needed):
    - All data fetched server-side
    - HTML sent to browser ready to use
    - No JavaScript data fetching
```

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│         Browser Request: GET /mua-ban/ha-noi                 │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│              Astro SSR: [...slug].astro                      │
│  ┌────────────────────┐  ┌──────────────────────────────┐   │
│  │ sidebar-wrapper    │  │  Main Content (Grid)          │   │
│  │ ├─ SSR Components  │  │                               │   │
│  │ │  ├─ location-    │  │  (Property listings)          │   │
│  │ │  │  filter-card  │  │                               │   │
│  │ │  │  (SSR ↓)      │  │                               │   │
│  │ │  │                                                   │   │
│  │ │  │  Server-side:                                    │   │
│  │ │  │  - Parse URL                                     │   │
│  │ │  │  - Fetch data                                    │   │
│  │ │  │  - Render HTML                                   │   │
│  │ │  │                                                   │   │
│  │ │  ├─ price-card   │  │                               │   │
│  │ │  └─ area-card    │  │                               │   │
│  └────────────────────┘  └──────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│             HTML Response (No Client Hydration)              │
│  - Sidebar with provinces + counts                           │
│  - All URLs pre-built                                        │
│  - No loading states needed                                  │
└──────────────────────────────────────────────────────────────┘
```

## Success Criteria

- [x] Location filter card renders via SSR
- [x] Province data fetched on server-side
- [x] Property counts displayed correctly
- [x] URLs follow V1 format: `/mua-ban/{province}`
- [x] No client-side data fetching
- [x] Page loads with complete data (no spinners)
- [x] TypeScript type-safe

## Dependencies

**Existing Services:**
- `LocationService.getAllProvincesWithCount()` - fetch provinces with counts
- `locations_with_count_property` table - materialized view with counts

**No New Dependencies:**
- No caching layer needed (Astro handles response caching)
- No API endpoints needed (data fetched in component)

## Performance Considerations

**SSR Performance:**
- Database query on each request (~10-50ms)
- Materialized view ensures fast aggregation
- Astro response caching at CDN level
- No client-side hydration overhead

**vs Build-Time:**
| Metric | SSR | Build-Time |
|--------|-----|------------|
| Data freshness | Real-time | Stale until rebuild |
| Build time | No impact | +5-10s per build |
| Response time | +10-50ms | 0ms (static) |
| Complexity | Lower | Higher (caching layer) |

## Related Files

**Modify:**
- `src/components/listing/sidebar/sidebar-wrapper.astro` - add location card

**Create:**
- `src/components/listing/sidebar/location-filter-card.astro` - SSR component

**Reference:**
- `src/services/location/location-service.ts` - data fetching
- `src/pages/[...slug].astro` - SSR page context

## Unresolved Questions

1. **Caching Strategy:** Should we add in-memory caching in LocationService? (Astro response cache may be sufficient)
2. **Province Limit:** Show top 10 or top 20 provinces? (V1 uses 20-item threshold)
3. **District Loading:** Keep HTMX approach or render districts server-side too?
