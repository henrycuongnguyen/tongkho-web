# Phase 01: JSON Generator Script

```yaml
status: completed
priority: high
effort: 2h
blockedBy: []
```

## Overview

Create build script to generate static JSON files from PostgreSQL database.

## Files to Create

| File | Purpose |
|------|---------|
| `scripts/generate-locations.ts` | Main generator script |
| `public/data/.gitkeep` | Ensure directory exists |

## Implementation

### 1. Generator Script (`scripts/generate-locations.ts`)

```typescript
import { db } from '../src/db';
import { locations } from '../src/db/schema';
import { eq, and, ne, or, isNull } from 'drizzle-orm';

// Version filter conditions
const newAddressCondition = eq(locations.nStatus, '6');
const oldAddressCondition = or(
  ne(locations.nStatus, '6'),
  isNull(locations.nStatus)
);

// Query provinces
async function getProvinces(version: 'new' | 'old') {
  const statusCondition = version === 'new'
    ? newAddressCondition
    : oldAddressCondition;

  return db.select({...})
    .from(locations)
    .where(and(
      eq(locations.nLevel, 'TinhThanh'),
      statusCondition,
      eq(locations.aactive, true)
    ));
}
```

### 2. Data Structure

**provinces-{version}.json:**
```json
[
  {
    "nId": "01",
    "name": "Hà Nội",
    "slug": "ha-noi",
    "propertyCount": 12500,
    "displayOrder": 1
  }
]
```

**districts/{version}/{provinceNId}.json:**
```json
[
  {
    "nId": "001",
    "name": "Ba Đình",
    "slug": "ba-dinh",
    "provinceId": "01"
  }
]
```

**wards/{version}/{districtNId}.json:**
```json
[
  {
    "nId": "00001",
    "name": "Phúc Xá",
    "slug": "phuc-xa",
    "districtId": "001"
  }
]
```

### 3. Package.json Script

```json
{
  "scripts": {
    "generate:locations": "tsx scripts/generate-locations.ts",
    "prebuild": "npm run generate:locations"
  }
}
```

## Logic Flow

```
┌─────────────────────────────────────────┐
│ VERSION FILTERING LOGIC                 │
│ - NEW: n_status = '6'                   │
│ - OLD: n_status != '6' OR n_status NULL │
├─────────────────────────────────────────┤
│ 1. Query provinces WHERE nLevel='TinhThanh'
│    Split by n_status condition above
├─────────────────────────────────────────┤
│ 2. For each province version:
│    - Query districts WHERE nParentid=province.nId
│      AND same n_status condition
│    - Write to districts/{version}/{nId}.json
├─────────────────────────────────────────┤
│ 3. For each district:
│    - Query wards WHERE nParentid=district.nId
│      AND same n_status condition
│    - Write to wards/{version}/{nId}.json
└─────────────────────────────────────────┘
```

## SQL Conditions

```sql
-- NEW addresses (n_status = '6')
WHERE n_level = 'TinhThanh' AND n_status = '6' AND aactive = true

-- OLD addresses (n_status != '6' or null)
WHERE n_level = 'TinhThanh' AND (n_status != '6' OR n_status IS NULL) AND aactive = true
```

## Edge Cases

1. **Empty districts/wards:** Write empty array `[]`
2. **Special characters in names:** Already UTF-8 in DB
3. **Missing slugs:** Fallback to `nSlugV1` or generate from name

## Validation

```bash
# After generation, verify:
ls -la public/data/provinces-*.json
ls public/data/districts/new/ | wc -l  # Should be ~63
ls public/data/wards/new/ | wc -l      # Should be ~700
```

## TODO

- [x] Create `scripts/generate-locations.ts`
- [x] Add npm script to package.json
- [x] Create `public/data/` directory structure
- [x] Test generation with real DB
- [x] Verify JSON output format
