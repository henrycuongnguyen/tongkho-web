---
title: "Maps/Network Page Implementation"
description: "Migrate v1 /maps page to v2 with SSG + Google Maps API"
status: completed
priority: P2
effort: 6h
branch: main53
tags: [feature, maps, google-maps, ssg, drizzle]
created: 2026-03-05
completed: 2026-03-05
---

# Maps/Network Page Implementation Plan

## Overview

Implement `/maps` page (office network locator) in v2, migrating from v1 with hybrid SSG + client-side JavaScript approach.

**Architecture Decision:** Hybrid SSG + Client JS
- Build-time data fetch from PostgreSQL `post_office` table
- Static HTML office list (SEO-friendly, crawlable)
- Google Maps JavaScript API loaded async for interactivity
- Trade-off: Violates zero-JS principle but acceptable for utility page UX

## Context Links

- [Brainstorm Report](../reports/brainstormer-260305-1412-maps-network-page.md)
- [v1 Template](../../reference/resaland_v1/views/home/maps.html)
- [v1 Client Script](../../reference/resaland_v1/static/js/office-locator.js)
- [v1 CSS](../../reference/resaland_v1/static/css/network-hero.css)
- [v1 SQL Schema](../../reference/tongkho_v1/sql/create_post_office_tables.sql)

## File Structure

```
src/
├── db/schema/
│   └── office.ts                    # Drizzle schema (NEW)
├── services/
│   └── office-service.ts            # Data service (NEW)
├── pages/
│   └── maps.astro                   # Page component (NEW)
public/
├── js/
│   └── office-locator.js            # Client script (NEW)
├── css/
│   └── network-hero.css             # Styling (NEW)
└── images/section/
    └── element.png                  # Hero image (VERIFY EXISTS)
```

## Phases

| Phase | Name | Status | Effort | Dependencies |
|-------|------|--------|--------|--------------|
| 1 | Database Schema | completed | 0.5h | None |
| 2 | Office Service | completed | 1h | Phase 1 |
| 3 | Astro Page | completed | 1.5h | Phase 2 |
| 4 | Client Script | completed | 1.5h | Phase 3 |
| 5 | Styling | completed | 1h | Phase 3 |
| 6 | Environment & Testing | completed | 0.5h | All |

## Success Criteria

### Functional
- [x] `/maps` page loads successfully
- [x] Hero section displays correctly
- [x] Office list shows all active offices from DB
- [x] Map loads with office markers
- [x] Click office → map centers + info window
- [x] "Chỉ đường" opens Google Maps navigation
- [x] Responsive on mobile/tablet/desktop

### Technical
- [x] Build-time data fetch from PostgreSQL works
- [x] Zero runtime DB queries
- [x] Google Maps API loads async (no blocking)
- [x] Graceful error handling with fallback data
- [x] No console errors in production

### Performance
- [x] Lighthouse Performance ≥ 90
- [x] Lighthouse SEO ≥ 95
- [x] Lighthouse Accessibility ≥ 90
- [x] LCP < 2.5s

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| DB connection fail at build | Build fails | Fallback to demo offices |
| Google Maps API cost | High traffic charges | Set quota limits, billing alerts |
| Stale office data | Outdated info | Document rebuild frequency |
| Invalid coordinates | Map errors | Validate + skip invalid, log for cleanup |

## Detailed Phase Files

- [Phase 1: Database Schema](./phase-01-database-schema.md)
- [Phase 2: Office Service](./phase-02-office-service.md)
- [Phase 3: Astro Page](./phase-03-astro-page.md)
- [Phase 4: Client Script](./phase-04-client-script.md)
- [Phase 5: Styling](./phase-05-styling.md)
- [Phase 6: Environment & Testing](./phase-06-environment-testing.md)
