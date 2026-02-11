# Phase 2: Location Data Service

## Context
[← Back to Plan](./plan.md)

Load provinces/districts from PostgreSQL database at build time and provide lookup services for filters.

## Priority
**HIGH** - Required for location filtering

## Status
**Pending**

## Overview
Fetch location data (provinces + districts) from database during Astro build, similar to menu system. Generate static data for client-side multi-select filtering.

## Requirements

### Functional
- Load all 63 provinces from DB
- Load all districts (grouped by province)
- **Support grant parameter for old/new addresses**
  - `grant=2` → Load new addresses (modern)
  - `grant!=2` or no grant → Load old addresses (legacy, via mergedintoid)
- Provide lookup by ID, slug, name
- Generate hierarchical structure (province → districts)
- Store for client-side access (static JSON file)
- Support multi-select in filter UI
- **Phase 1 scope: 2 levels only (Province + District)**
- **Future:** Can extend to 3 levels (+ Ward)

### Non-Functional
- Build-time data generation only
- <100ms query time during build
- Optimized data structure for lookups
- Vietnamese text normalization for search
- Handle address migration (old → new via mergedintoid)

## Architecture

### Database Schema

From v1 reference, locations table structure:
```sql
-- Key fields
n_id           VARCHAR    -- Location ID
n_name         VARCHAR    -- Name (e.g., "Hà Nội")
n_slug         VARCHAR    -- Slug (e.g., "ha-noi")
n_level        INTEGER    -- 0=Province, 1=District, 2=Ward
n_parentid     VARCHAR    -- Parent location ID
n_status       VARCHAR    -- Status (!= "6" is active)
mergedintoid   VARCHAR    -- New location ID (if migrated)
n_normalizedname VARCHAR  -- Normalized for search
created_on     DATETIME
updated_on     DATETIME
aactive        BOOLEAN    -- Is active

-- Load NEW addresses (grant=2)
SELECT n_id, n_name, n_slug, n_level, n_parentid
FROM locations
WHERE n_level = 0           -- Province level
  AND n_status != '6'       -- Active only
  AND aactive = TRUE
ORDER BY n_name;

-- Load OLD addresses (no grant or grant!=2)
-- Tìm địa chỉ cũ qua mergedintoid
SELECT n_id, n_name, n_slug, n_level, n_parentid, mergedintoid
FROM locations
WHERE n_level = 0
  AND n_status != '6'
  AND mergedintoid IS NOT NULL  -- Has been migrated
ORDER BY n_name;
```

**Grant Logic:**
- `grant='2'` → Modern addresses (direct query)
- `grant!='2'` → Legacy addresses (query via mergedintoid mapping)

### Service Structure

```
src/services/
└── location/
    ├── location-service.ts          # Main service API
    ├── location-data-generator.ts   # Build-time generator
    └── types.ts                     # Location interfaces
src/data/
└── static-locations.ts              # Generated at build time
public/
└── data/
    └── locations.json               # Static JSON file
```

## Implementation Steps

### 1. Define Types (15 mins)

**File:** `src/services/location/types.ts`

```typescript
// Province data
export interface Province {
  id: number;
  name: string;           // "Hà Nội"
  slug: string;           // "ha-noi"
  districtCount: number;  // Number of districts
}

// District data
export interface District {
  id: number;
  name: string;           // "Ba Đình"
  slug: string;           // "ba-dinh"
  provinceId: number;     // Parent province ID
  provinceName?: string;  // "Hà Nội" (optional denormalization)
}

// Hierarchical structure
export interface LocationHierarchy {
  provinces: Province[];
  districtsByProvince: Record<number, District[]>;
}

// For client-side multi-select
export interface SelectedLocation {
  id: number;
  type: 'province' | 'district';
  name: string;
  slug: string;
  parentId?: number;      // For districts
}
```

### 2. Location Service (1-2 hours)

**File:** `src/services/location/location-service.ts`

```typescript
import { db } from '@/db';
import { locations } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { Province, District, LocationHierarchy } from './types';

export class LocationService {

  /**
   * Load all provinces from database
   * @param grant - '2' for new addresses, other for old addresses
   */
  static async getAllProvinces(grant: string = '2'): Promise<Province[]> {
    try {
      // Build query based on grant
      const isNewAddress = grant === '2';

      let query = db
        .select({
          id: locations.nId,
          name: locations.nName,
          slug: locations.nSlug,
          mergedIntoId: locations.mergedintoid,
        })
        .from(locations)
        .where(
          and(
            eq(locations.nLevel, '0'),           // Province level
            ne(locations.nStatus, '6'),          // Active status
            eq(locations.aactive, true)          // Active flag
          )
        );

      // If loading old addresses, only get those with mergedintoid
      if (!isNewAddress) {
        query = query.where(isNotNull(locations.mergedintoid));
      }

      const result = await query.orderBy(locations.nName);

      // Count districts for each province
      const provincesWithCount = await Promise.all(
        result.map(async (province) => {
          const districts = await db
            .select({ id: locations.id })
            .from(locations)
            .where(
              eq(locations.parent, province.id),
              eq(locations.nLevel, 1)
            );

          return {
            ...province,
            districtCount: districts.length
          };
        })
      );

      return provincesWithCount;

    } catch (error) {
      console.error('[LocationService] Failed to load provinces:', error);
      return [];
    }
  }

  /**
   * Load districts by province IDs
   */
  static async getDistrictsByProvinces(
    provinceIds: number[]
  ): Promise<Record<number, District[]>> {
    if (provinceIds.length === 0) return {};

    try {
      const result = await db
        .select({
          id: locations.id,
          name: locations.name,
          slug: locations.slug,
          provinceId: locations.parent,
        })
        .from(locations)
        .where(
          inArray(locations.parent, provinceIds),
          eq(locations.nLevel, 1)
        )
        .orderBy(locations.name);

      // Group by province
      const grouped: Record<number, District[]> = {};
      for (const district of result) {
        if (!grouped[district.provinceId]) {
          grouped[district.provinceId] = [];
        }
        grouped[district.provinceId].push({
          id: district.id,
          name: district.name,
          slug: district.slug,
          provinceId: district.provinceId
        });
      }

      return grouped;

    } catch (error) {
      console.error('[LocationService] Failed to load districts:', error);
      return {};
    }
  }

  /**
   * Load all districts for all provinces
   */
  static async getAllDistrictsByProvinces(): Promise<Record<number, District[]>> {
    try {
      const provinces = await this.getAllProvinces();
      const provinceIds = provinces.map(p => p.id);
      return await this.getDistrictsByProvinces(provinceIds);
    } catch (error) {
      console.error('[LocationService] Failed to load all districts:', error);
      return {};
    }
  }

  /**
   * Build complete hierarchy (for build-time generation)
   */
  static async buildLocationHierarchy(): Promise<LocationHierarchy> {
    const provinces = await this.getAllProvinces();
    const districtsByProvince = await this.getAllDistrictsByProvinces();

    return {
      provinces,
      districtsByProvince
    };
  }

  /**
   * Get province by slug
   */
  static async getProvinceBySlug(slug: string): Promise<Province | null> {
    try {
      const result = await db
        .select({
          id: locations.id,
          name: locations.name,
          slug: locations.slug,
        })
        .from(locations)
        .where(
          eq(locations.slug, slug),
          eq(locations.nLevel, 0)
        )
        .limit(1);

      if (!result[0]) return null;

      // Count districts
      const districts = await db
        .select({ id: locations.id })
        .from(locations)
        .where(
          eq(locations.parent, result[0].id),
          eq(locations.nLevel, 1)
        );

      return {
        ...result[0],
        districtCount: districts.length
      };

    } catch (error) {
      console.error('[LocationService] Failed to get province:', error);
      return null;
    }
  }

  /**
   * Get district by slug (need province context)
   */
  static async getDistrictBySlug(
    provinceId: number,
    slug: string
  ): Promise<District | null> {
    try {
      const result = await db
        .select({
          id: locations.id,
          name: locations.name,
          slug: locations.slug,
          provinceId: locations.parent,
        })
        .from(locations)
        .where(
          eq(locations.slug, slug),
          eq(locations.parent, provinceId),
          eq(locations.nLevel, 1)
        )
        .limit(1);

      return result[0] || null;

    } catch (error) {
      console.error('[LocationService] Failed to get district:', error);
      return null;
    }
  }
}
```

### 3. Build-Time Data Generator (1 hour)

**File:** `src/services/location/location-data-generator.ts`

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { LocationService } from './location-service';

/**
 * Generate static location data at build time
 * Run this during Astro build process
 */
export async function generateStaticLocationData(): Promise<void> {
  console.log('[LocationDataGenerator] Starting...');

  try {
    // Fetch all location data
    const hierarchy = await LocationService.buildLocationHierarchy();

    // Generate TypeScript data file
    const tsContent = generateTypeScriptFile(hierarchy);
    const tsPath = path.resolve(process.cwd(), 'src/data/static-locations.ts');
    await fs.writeFile(tsPath, tsContent, 'utf-8');
    console.log(`[LocationDataGenerator] Generated ${tsPath}`);

    // Generate JSON file for client-side access
    const jsonContent = JSON.stringify(hierarchy, null, 2);
    const jsonPath = path.resolve(process.cwd(), 'public/data/locations.json');

    // Ensure directory exists
    await fs.mkdir(path.dirname(jsonPath), { recursive: true });
    await fs.writeFile(jsonPath, jsonContent, 'utf-8');
    console.log(`[LocationDataGenerator] Generated ${jsonPath}`);

    console.log(`[LocationDataGenerator] Success: ${hierarchy.provinces.length} provinces, ${Object.keys(hierarchy.districtsByProvince).length} province groups`);

  } catch (error) {
    console.error('[LocationDataGenerator] Failed:', error);
    throw error;
  }
}

/**
 * Generate TypeScript file content
 */
function generateTypeScriptFile(hierarchy: any): string {
  return `/**
 * Static location data - Generated at build time
 * DO NOT EDIT MANUALLY
 * Run: npm run generate:locations
 */

import type { LocationHierarchy } from '@/services/location/types';

export const STATIC_LOCATIONS: LocationHierarchy = ${JSON.stringify(hierarchy, null, 2)};

// Quick lookup maps
export const PROVINCE_BY_ID = new Map(
  STATIC_LOCATIONS.provinces.map(p => [p.id, p])
);

export const PROVINCE_BY_SLUG = new Map(
  STATIC_LOCATIONS.provinces.map(p => [p.slug, p])
);

// District lookups
const allDistricts = Object.values(STATIC_LOCATIONS.districtsByProvince).flat();
export const DISTRICT_BY_ID = new Map(
  allDistricts.map(d => [d.id, d])
);
`;
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  generateStaticLocationData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
```

### 4. Package.json Script (5 mins)

```json
{
  "scripts": {
    "generate:locations": "tsx src/services/location/location-data-generator.ts",
    "prebuild": "npm run generate:locations"
  }
}
```

### 5. Usage in Components (30 mins)

**React Component Example:**

```typescript
// src/components/listing/location-filter.tsx
import { useState, useEffect } from 'react';
import type { Province, District } from '@/services/location/types';

interface Props {
  onSelectionChange: (provinceIds: number[], districtIds: number[]) => void;
}

export function LocationFilter({ onSelectionChange }: Props) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districtsByProvince, setDistrictsByProvince] = useState<Record<number, District[]>>({});
  const [selectedProvinces, setSelectedProvinces] = useState<Set<number>>(new Set());
  const [selectedDistricts, setSelectedDistricts] = useState<Set<number>>(new Set());

  // Load location data from static JSON
  useEffect(() => {
    fetch('/data/locations.json')
      .then(res => res.json())
      .then(data => {
        setProvinces(data.provinces);
        setDistrictsByProvince(data.districtsByProvince);
      })
      .catch(err => console.error('Failed to load locations:', err));
  }, []);

  const handleProvinceToggle = (provinceId: number) => {
    const newSelected = new Set(selectedProvinces);
    if (newSelected.has(provinceId)) {
      newSelected.delete(provinceId);
      // Also remove all districts of this province
      const districtIds = districtsByProvince[provinceId]?.map(d => d.id) || [];
      districtIds.forEach(id => selectedDistricts.delete(id));
    } else {
      newSelected.add(provinceId);
    }
    setSelectedProvinces(newSelected);
    onSelectionChange(Array.from(newSelected), Array.from(selectedDistricts));
  };

  const handleDistrictToggle = (districtId: number, provinceId: number) => {
    const newSelected = new Set(selectedDistricts);
    if (newSelected.has(districtId)) {
      newSelected.delete(districtId);
    } else {
      newSelected.add(districtId);
      // Auto-select province
      selectedProvinces.add(provinceId);
    }
    setSelectedDistricts(newSelected);
    onSelectionChange(Array.from(selectedProvinces), Array.from(newSelected));
  };

  return (
    <div className="location-filter">
      <h3>Địa điểm</h3>

      {/* Province list */}
      <div className="province-list">
        {provinces.map(province => (
          <div key={province.id}>
            <label>
              <input
                type="checkbox"
                checked={selectedProvinces.has(province.id)}
                onChange={() => handleProvinceToggle(province.id)}
              />
              {province.name} ({province.districtCount})
            </label>

            {/* District list (show when province selected) */}
            {selectedProvinces.has(province.id) && (
              <div className="district-list ml-4">
                {districtsByProvince[province.id]?.map(district => (
                  <label key={district.id}>
                    <input
                      type="checkbox"
                      checked={selectedDistricts.has(district.id)}
                      onChange={() => handleDistrictToggle(district.id, province.id)}
                    />
                    {district.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Related Code Files

**Database Schema:**
- `src/db/schema/locations.ts` - Locations table definition

**To Create:**
- `src/services/location/types.ts`
- `src/services/location/location-service.ts`
- `src/services/location/location-data-generator.ts`
- `src/data/static-locations.ts` (generated)
- `public/data/locations.json` (generated)

## Todo List

- [ ] Create location types in types.ts
- [ ] Implement LocationService with DB queries
- [ ] **Add grant parameter support (default: grant='2' for new addresses)**
- [ ] Handle mergedintoid mapping for old addresses (if needed)
- [ ] Implement location-data-generator script
- [ ] Add npm script `generate:locations`
- [ ] Test data generation with real DB (both grant='2' and grant!='2')
- [ ] Verify JSON output structure
- [ ] Create React location filter component
- [ ] Add localStorage persistence for selected locations
- [ ] Test multi-select functionality
- [ ] Document data refresh process
- [ ] **Document grant usage (default to '2' for v2 modern addresses)**

## Success Criteria

- [ ] All 63 provinces loaded correctly
- [ ] All districts grouped by province
- [ ] Static data generated at build time
- [ ] JSON file accessible via /data/locations.json
- [ ] Lookup maps working (by ID, by slug)
- [ ] Multi-select UI functional
- [ ] Performance: <100ms to load location data
- [ ] Data structure matches v1 format

## Risk Assessment

**Low Risk:**
- Database schema already exists from v1
- Simple hierarchical structure
- Read-only operations

**Mitigation:**
- Test with production database
- Verify all 63 provinces exist
- Handle missing data gracefully

## Security Considerations

- No sensitive data in locations
- Static JSON publicly accessible (safe)
- No user input in data generation

## Next Steps

After Phase 2 completion:
→ **Phase 3:** Dynamic Route & URL Parsing
→ **Phase 4:** Filter Section UI (uses location data)
