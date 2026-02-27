# Plan: SSG JSON + Client Lazy Load cho Danh mục Hành chính

```yaml
status: completed
created: 2026-02-27
completed: 2026-02-27
branch: refactoradress
priority: high
effort: medium
```

## Overview

Refactor address system từ API/SSR sang SSG JSON + Client lazy load để tối ưu initial load speed.

## Current State

- API endpoints trả HTML fragments (`/api/location/provinces`, `/api/location/districts`)
- HTMX reload khi toggle old/new
- In-memory cache tại build time
- ~20,000 records (63 tỉnh, ~700 huyện, ~10,000 xã)

## Target State

- Static JSON files generated at build time
- Client-side fetch + render
- Instant toggle between old/new (URL prefix switch)
- CDN-cacheable, zero runtime DB queries

## Phases

| Phase | Description | Effort | Status |
|-------|-------------|--------|--------|
| [01](./phase-01-json-generator.md) | JSON Generator Script | 2h | completed |
| [02](./phase-02-client-fetcher.md) | Client Fetcher Module | 2h | completed |
| [03](./phase-03-ui-integration.md) | UI Component Integration | 3h | completed |
| [04](./phase-04-cleanup.md) | Cleanup & Optimization | 1h | completed |

## File Structure

```
public/data/
├── provinces-new.json          # 63 records
├── provinces-old.json
├── districts/
│   ├── new/{provinceNId}.json  # ~63 files
│   └── old/{provinceNId}.json
└── wards/
    ├── new/{districtNId}.json  # ~700 files
    └── old/{districtNId}.json
```

## Key Decisions

1. **JSON location:** `public/data/` (served as static assets)
2. **Generation:** Build script via `npm run generate:locations`
3. **Client fetch:** Vanilla JS (no React needed for dropdowns)
4. **Toggle behavior:** Reset selection + switch URL prefix
5. **Version filter:**
   - NEW: `n_status = '6'`
   - OLD: `n_status != '6'` OR `n_status IS NULL`

## Dependencies

- Existing `location-service.ts` functions for data queries
- PostgreSQL database access at build time

## Success Criteria

- [x] Initial page load < 100KB (provinces only)
- [x] Toggle response < 50ms (no network)
- [x] District fetch < 100ms (CDN cached)
- [x] All existing functionality preserved

## Next Steps

1. Read phase-01-json-generator.md
2. Run `/cook plans/260227-1500-ssg-json-lazy-load`
