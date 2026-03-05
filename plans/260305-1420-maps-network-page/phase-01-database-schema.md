# Phase 1: Database Schema

## Context Links
- [v1 SQL Schema](../../reference/tongkho_v1/sql/create_post_office_tables.sql)
- [Existing Schema Pattern](../../src/db/schema/menu.ts)

## Overview
- **Priority:** P1 (blocking)
- **Status:** completed
- **Effort:** 0.5h
- **Dependencies:** None
- **Completed:** 2026-03-05

## Key Insights

v1 `post_office` table structure (lines 28-56 of create_post_office_tables.sql):
```sql
CREATE TABLE post_office (
    id SERIAL PRIMARY KEY,
    parent_id INTEGER REFERENCES post_office(id),
    office_level INTEGER DEFAULT 2,    -- 1=Vùng, 2=Tỉnh, 3=Huyện, 4=Xã, 5=Tổ
    manager_user_id INTEGER,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    address VARCHAR(200),
    city VARCHAR(20),
    district VARCHAR(20),
    ward VARCHAR(20),
    city_name VARCHAR(255),
    district_name VARCHAR(255),
    ward_name VARCHAR(255),
    address_latitude VARCHAR(20),      -- Note: stored as VARCHAR
    address_longitude VARCHAR(20),     -- Note: stored as VARCHAR
    status INTEGER DEFAULT 1,          -- 1=Active, 2=Pending, 3=Suspended, 4=Closed, 9=Deleted
    aactive BOOLEAN DEFAULT TRUE,
    created_on TIMESTAMP,
    updated_on TIMESTAMP
);
```

Additional fields observed in v1 client script (lines 74, 99-102 of office-locator.js):
- `company_representative` - Representative name
- `position_representative` - Representative position
- `time_work` - Working hours

## Requirements

### Functional
- Define Drizzle schema matching `post_office` table
- Type-safe column selection for queries
- Export inferred TypeScript type

### Non-Functional
- Follow existing schema patterns in `src/db/schema/menu.ts`
- Minimal columns (only what's needed for maps page)
- Export via `src/db/schema/index.ts`

## Architecture

```
src/db/schema/office.ts
    └─> postOffice table definition
    └─> Office type export

src/db/schema/index.ts
    └─> re-export from ./office
```

## Related Code Files

**Create:**
- `src/db/schema/office.ts` - Drizzle schema definition

**Modify:**
- `src/db/schema/index.ts` - Add export line

## Implementation Steps

### Step 1: Create office.ts schema file

**File:** `src/db/schema/office.ts`

```typescript
import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';

/**
 * Post Office table schema for network/maps page
 * Stores TongKhoBDS office locations with coordinates for map display
 *
 * office_level: 1=Vùng, 2=Tỉnh, 3=Huyện, 4=Xã, 5=Tổ
 * status: 1=Active, 2=Pending, 3=Suspended, 4=Closed, 9=Deleted
 */
export const postOffice = pgTable('post_office', {
  id: serial('id').primaryKey(),
  parentId: integer('parent_id'),
  officeLevel: integer('office_level').default(2),
  name: varchar('name', { length: 200 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 100 }),
  address: varchar('address', { length: 200 }),
  city: varchar('city', { length: 20 }),
  district: varchar('district', { length: 20 }),
  ward: varchar('ward', { length: 20 }),
  cityName: varchar('city_name', { length: 255 }),
  districtName: varchar('district_name', { length: 255 }),
  wardName: varchar('ward_name', { length: 255 }),
  addressLatitude: varchar('address_latitude', { length: 20 }),
  addressLongitude: varchar('address_longitude', { length: 20 }),
  companyRepresentative: varchar('company_representative', { length: 200 }),
  positionRepresentative: varchar('position_representative', { length: 100 }),
  timeWork: varchar('time_work', { length: 255 }),
  status: integer('status').default(1),
  aactive: boolean('aactive').default(true),
  createdOn: timestamp('created_on'),
  updatedOn: timestamp('updated_on'),
});

// Type inference for TypeScript
export type PostOfficeRow = typeof postOffice.$inferSelect;
```

### Step 2: Export from schema index

**File:** `src/db/schema/index.ts`

Add export line:
```typescript
export * from './office';
```

### Step 3: Verify TypeScript compilation

```bash
npm run astro check
```

Expected: No TypeScript errors related to new schema.

## Todo List

- [x] Create `src/db/schema/office.ts`
- [x] Add export to `src/db/schema/index.ts`
- [x] Run `npm run astro check` - verify no TS errors
- [x] Verify table exists in database (optional manual check)

## Success Criteria

- [x] `office.ts` created with correct Drizzle schema
- [x] Schema exported from `index.ts`
- [x] TypeScript compilation passes
- [x] `PostOfficeRow` type available for import

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Table doesn't exist in DB | Low | High | Query will fail gracefully with fallback in service layer |
| Column name mismatch | Medium | Medium | Verify against actual DB schema if issues arise |

## Security Considerations

- Schema is read-only (no mutations)
- No sensitive fields exposed (manager_user_id not needed)
- Build-time only (no client exposure of schema)

## Next Steps

After completion: Proceed to [Phase 2: Office Service](./phase-02-office-service.md)
