# Phase 2: Office Service

## Context Links
- [Existing Service Pattern](../../src/services/menu-service.ts)
- [v1 API Response Structure](../../reference/resaland_v1/static/js/office-locator.js) (lines 9-32)
- [Brainstorm Service Design](../reports/brainstormer-260305-1412-maps-network-page.md)

## Overview
- **Priority:** P1 (blocking)
- **Status:** completed
- **Effort:** 1h
- **Dependencies:** Phase 1 (Database Schema)
- **Completed:** 2026-03-05

## Key Insights

From v1 `office-locator.js` (lines 16-21):
```javascript
// Expected data structure from API
{
  id, name, address, lat, lng, area,
  ward_name, district_name, city_name,
  company_representative, position_representative, time_work, phone
}
```

Coordinate handling (v1 stores as VARCHAR, needs parsing to float).

## Requirements

### Functional
- Fetch active offices from `post_office` table
- Filter: `aactive = true` AND `status = 1`
- Convert coordinates: VARCHAR → number
- Return typed `OfficeLocation[]` array
- Fallback demo data if DB query fails

### Non-Functional
- Build-time execution only (no client bundle)
- Error logging without build failure
- Sort by name for consistent ordering

## Architecture

```
office-service.ts
├── OfficeLocation interface (API shape)
├── getActiveOffices() - Main fetch function
├── parseCoordinate() - Helper for lat/lng parsing
└── getFallbackOffices() - Demo data fallback
```

## Related Code Files

**Create:**
- `src/services/office-service.ts`

**Dependencies:**
- `src/db/index.ts` (db connection)
- `src/db/schema/office.ts` (schema)

## Implementation Steps

### Step 1: Create office-service.ts

**File:** `src/services/office-service.ts`

```typescript
/**
 * Office Service
 * Provides office location data for the /maps network page
 *
 * Features:
 * - Build-time data fetch from PostgreSQL post_office table
 * - Coordinate parsing (VARCHAR → number)
 * - Graceful error handling with fallback demo data
 * - Type-safe queries via Drizzle ORM
 */

import { db } from '@/db';
import { postOffice } from '@/db/schema/office';
import { eq, and } from 'drizzle-orm';

/**
 * Office location data structure for maps page
 * Matches v1 API response format
 */
export interface OfficeLocation {
  id: number;
  name: string;
  address: string;
  phone: string | null;
  cityName: string | null;
  districtName: string | null;
  wardName: string | null;
  lat: number | null;
  lng: number | null;
  companyRepresentative: string | null;
  positionRepresentative: string | null;
  timeWork: string | null;
}

/**
 * Parse coordinate string to number
 * Handles null, empty string, and invalid values gracefully
 */
function parseCoordinate(coord: string | null): number | null {
  if (!coord || coord.trim() === '') return null;
  const parsed = parseFloat(coord);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Fetch all active offices from database
 * Filters: aactive=true AND status=1 (Active)
 * Returns: Array of OfficeLocation sorted by name
 *
 * @returns Promise<OfficeLocation[]>
 */
export async function getActiveOffices(): Promise<OfficeLocation[]> {
  try {
    const offices = await db
      .select({
        id: postOffice.id,
        name: postOffice.name,
        address: postOffice.address,
        phone: postOffice.phone,
        cityName: postOffice.cityName,
        districtName: postOffice.districtName,
        wardName: postOffice.wardName,
        addressLatitude: postOffice.addressLatitude,
        addressLongitude: postOffice.addressLongitude,
        companyRepresentative: postOffice.companyRepresentative,
        positionRepresentative: postOffice.positionRepresentative,
        timeWork: postOffice.timeWork,
      })
      .from(postOffice)
      .where(
        and(
          eq(postOffice.aactive, true),
          eq(postOffice.status, 1) // Active only
        )
      )
      .orderBy(postOffice.name);

    // Transform DB rows to OfficeLocation format
    return offices.map((office) => ({
      id: office.id,
      name: office.name,
      address: office.address || '',
      phone: office.phone,
      cityName: office.cityName,
      districtName: office.districtName,
      wardName: office.wardName,
      lat: parseCoordinate(office.addressLatitude),
      lng: parseCoordinate(office.addressLongitude),
      companyRepresentative: office.companyRepresentative,
      positionRepresentative: office.positionRepresentative,
      timeWork: office.timeWork,
    }));
  } catch (error) {
    console.error('[office-service] Failed to fetch offices:', error);
    // Return fallback demo data to prevent build failure
    return getFallbackOffices();
  }
}

/**
 * Fallback demo offices for build resilience
 * Used when database is unavailable or query fails
 */
function getFallbackOffices(): OfficeLocation[] {
  console.warn('[office-service] Using fallback demo offices');
  return [
    {
      id: 1,
      name: 'Văn phòng Hà Nội',
      address: 'Tòa nhà ABC, Quận Cầu Giấy',
      phone: '024 1234 5678',
      cityName: 'Hà Nội',
      districtName: 'Cầu Giấy',
      wardName: 'Dịch Vọng',
      lat: 21.028511,
      lng: 105.804817,
      companyRepresentative: 'Nguyễn Văn A',
      positionRepresentative: 'Giám đốc chi nhánh',
      timeWork: 'Thứ 2 - Thứ 6: 8:00 - 17:30',
    },
    {
      id: 2,
      name: 'Văn phòng TP.HCM',
      address: 'Tòa nhà XYZ, Quận 1',
      phone: '028 9876 5432',
      cityName: 'TP. Hồ Chí Minh',
      districtName: 'Quận 1',
      wardName: 'Bến Nghé',
      lat: 10.776889,
      lng: 106.700806,
      companyRepresentative: 'Trần Thị B',
      positionRepresentative: 'Giám đốc chi nhánh',
      timeWork: 'Thứ 2 - Thứ 6: 8:00 - 17:30',
    },
  ];
}
```

### Step 2: Add path alias (if needed)

Verify `tsconfig.json` has `@/db` and `@/services` aliases. Existing project should already have this.

### Step 3: Test service (manual verification)

Create temporary test in any existing page:
```typescript
// Temporary test - remove after verification
import { getActiveOffices } from '@/services/office-service';
const offices = await getActiveOffices();
console.log('[test] Fetched offices:', offices.length);
```

Run `npm run build` and check console output.

## Todo List

- [x] Create `src/services/office-service.ts`
- [x] Run `npm run astro check` - verify no TS errors
- [x] Test service by temporarily importing in existing page
- [x] Verify offices are fetched or fallback used
- [x] Remove temporary test code

## Success Criteria

- [x] `office-service.ts` compiles without errors
- [x] `getActiveOffices()` returns `OfficeLocation[]`
- [x] Coordinates parsed correctly (number | null)
- [x] Fallback data returned on DB error
- [x] Error logged (not thrown) on failure

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| DB table doesn't exist | Medium | High | Fallback demo data prevents build failure |
| Column names differ from schema | Medium | Medium | Error logged, fallback used |
| All coordinates invalid | Low | Medium | Filter in client script |

## Security Considerations

- No user input accepted (read-only service)
- No sensitive data returned (excludes manager_user_id, email)
- Build-time only execution

## Next Steps

After completion: Proceed to [Phase 3: Astro Page](./phase-03-astro-page.md)
