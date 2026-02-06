# V1 Data Flow & Synchronization Patterns

**System:** TongKho V1 (Web2py + PostgreSQL + Elasticsearch)
**Focus:** Database-to-Elasticsearch synchronization, real-time updates, batch processing
**Document Date:** 2026-02-06

---

## Quick Navigation

1. [Data Flow Overview](#data-flow-overview)
2. [Real Estate Listing Flow](#real-estate-listing-flow)
3. [Geographic Hierarchy Sync](#geographic-hierarchy-sync)
4. [Office Organization Flow](#office-organization-flow)
5. [Permission & Access Control Flow](#permission--access-control-flow)
6. [Financial Transaction Flow](#financial-transaction-flow)
7. [Computed Fields & Transformations](#computed-fields--transformations)
8. [Data Consistency Patterns](#data-consistency-patterns)

---

## Data Flow Overview

```
┌─────────────────────────────────────────────────────────┐
│                 DATA SOURCES & SINKS                     │
└─────────────────────────────────────────────────────────┘

   Application Layer
   (Web2py Controllers)
            ↓
   ┌─────────────────────────────┐
   │    PostgreSQL Database      │
   │  (57 tables, 120+ FKs)      │
   └─────────────────────────────┘
            ↓↑
   ┌─────────────────────────────┐
   │  Elasticsearch Cluster      │
   │  (3 indexes, search)        │
   └─────────────────────────────┘
            ↓
   ┌─────────────────────────────┐
   │     Search Results API      │
   │  (Filter, Sort, Paginate)   │
   └─────────────────────────────┘
            ↓
   Web Browser / Mobile Client
```

---

## Real Estate Listing Flow

### 1. Property Creation (Real-Time)

```
USER ACTION: Create new property listing
    ↓
POST /property/add (HTTP request)
    ↓
CONTROLLER: real_estate_handle.py
  ├─ Validate input (title, price, location, images)
  ├─ Parse geographic data (city_id, district_id, ward_id)
  ├─ Set initial status (draft/active)
  └─ Extract featured flag (from form or defaults)
    ↓
DATABASE INSERT:
  INSERT INTO real_estate (
    title, slug, property_type_id, status,
    price, area, bedrooms, bathrooms,
    city_id, district_id, ward_id,
    description, aactive, created_on, created_by
  ) VALUES (...)
  → Returns: real_estate.id (e.g., 12345)
    ↓
POST-INSERT TRIGGERS:
  ├─ Trigger: update_updated_on (set updated_on=now)
  └─ EXPLICIT CALL: process_real_estate_batch(id=12345)
       ├─ Task 1: Generate real_estate_code
       │   Format: {prefix}{province_code}{type}{id}
       │   Example: M6M12345 (buy/sell, Hà Nội, apartment, ID 12345)
       │
       ├─ Task 2: Fetch configuration data
       │   ├─ property_type code (apartment→M)
       │   ├─ province code (city_id 6 → "6")
       │   └─ prefix (transaction type → M or T)
       │
       └─ Task 3: UPDATE real_estate
           UPDATE real_estate SET real_estate_code='M6M12345'
           WHERE id=12345
    ↓
ELASTICSEARCH AUTO-SYNC (implicit):
  [ES index implicitly updated - mechanism unclear]
  ├─ Possible: Logstash pipeline
  ├─ Possible: Background indexing job
  └─ Possible: External ETL process
    ↓
RESULT: Property now searchable in ES
  GET /real_estate/_search
  └─ Query returns: {id: 12345, slug, title, price, ...}
```

### Key Database Transformations
```
Input Fields:
  title: "Căn hộ cao cấp tại Hà Nội"
  slug: "can-ho-cao-cap-tai-ha-noi" (auto-generated)
  property_type_id: 1 (apartment)
  transaction_type_id: 1 (buy/sell)
  city_id: 1 (Hà Nội)

Generated Fields:
  real_estate_code: "M1M12345"
  created_on: CURRENT_TIMESTAMP
  created_by: auth.user_id
  updated_on: CURRENT_TIMESTAMP (trigger)
  aactive: TRUE (default)

Elasticsearch Indexed:
  id, slug, title, price, area, bedrooms, bathrooms,
  city_id, district_id, ward_id, latlng_parsed,
  created_time, aactive, is_featured, status_id
```

---

### 2. Property Updates (Soft-Update Flow)

```
USER ACTION: Edit property (change price, status, etc.)
    ↓
PUT /property/{id}/edit
    ↓
VALIDATION & TRANSFORMATION:
  ├─ Validate new status (must be in 1-5 enum)
  ├─ Validate geographic scope (no changing city)
  └─ Parse updated fields
    ↓
DATABASE UPDATE:
  UPDATE real_estate SET
    price = 6000000000,
    status = 2,          -- active
    updated_on = now()   -- Auto-set by trigger
  WHERE id = 12345 AND aactive = TRUE
    ↓
AUDIT TRAIL:
  IF status changed:
    INSERT INTO transaction_history (
      real_estate_transaction_id, old_status, new_status,
      change_reason, created_on, created_by
    ) VALUES (...)
    ↓
ELASTICSEARCH UPDATE (implicit):
  [ES document refreshed - mechanism unclear]
  ├─ Field sync: price, status, updated_on
  ├─ Computed field: created_time_updated (UTC+7)
  └─ Index refresh: minutes-scale latency
    ↓
SEARCH RESULT REFLECTION:
  Query next search → reflects new price/status
```

---

### 3. Property Deletion (Soft-Delete)

```
USER ACTION: Remove property from listing
    ↓
DELETE /property/{id}
    ↓
DATABASE SOFT-DELETE:
  UPDATE real_estate SET
    aactive = FALSE,
    updated_on = now()
  WHERE id = 12345

  [Never execute: DELETE FROM real_estate WHERE id=12345]
    ↓
ELASTICSEARCH SYNC:
  Query filter: aactive = true (implicit)
  → Property excluded from search results
  [ES document not deleted, just filtered out]
    ↓
AVAILABILITY:
  Admin queries can still access via aactive=FALSE filter:
    GET /real_estate/_search
    {
      "query": {
        "term": {"aactive": false}
      }
    }
```

---

## Geographic Hierarchy Sync

### Location Hierarchy Structure

```
PostgreSQL locations table:
┌─────────────────────────────────────┐
│ id  │ name     │ level │ parent_id  │
├─────┼──────────┼───────┼────────────┤
│  1  │ Hà Nội   │   1   │   NULL     │  Level 1: City
│ 101 │ Ba Đình  │   2   │    1       │  Level 2: District
│10101│ Quảng An │   3   │   101      │  Level 3: Ward
└─────────────────────────────────────┘
           ↓
Elasticsearch locations index:
{
  "id": 1,
  "n_name": "Hà Nội",
  "n_level": 1,
  "n_parentid": null,
  "n_normalizedname": "hanoi"
}
```

---

### Location Mapping Sync (Batch)

```
SCHEDULED JOB: Periodic location mapping update
    ↓
TRIGGER: map_real_estate_locations()
         (Called periodically or on-demand)
    ↓
BATCH PROCESSING:
  FOR batch in paginate(records, size=2000-20000):
    1. Query Elasticsearch:
       GET /real_estate/_search?from=0&size=2000

    2. For each property hit:
       a. Extract current city_id
       b. Lookup in PostgreSQL locations:
          SELECT * FROM locations
          WHERE parent_id={city_id} AND level=2
          → Get all districts for that city

       c. Map old location IDs to new IDs
          old_id=101 → new_id=102 (if consolidation occurred)

       d. Update ES document:
          UPDATE /real_estate/_update/{id}
          {
            "doc": {
              "city_id": "1",
              "district_id": "102",  -- Updated
              "ward_id": "10201"     -- Updated
            }
          }

    3. Commit batch changes to ES

    4. Sleep/throttle for next batch

  END FOR
    ↓
PARALLELIZATION:
  ThreadPoolExecutor available
  ├─ Multiple workers process different city ranges
  ├─ Coordinated commits (no conflicts)
  └─ Progress tracking per batch
    ↓
RESULT: All real estate records have current location mappings
        ES index reflects latest geographic hierarchy
```

---

### Location Search (Autocomplete)

```
USER TYPES: "Hà" in search box
    ↓
JAVASCRIPT: Trigger autocomplete API
    POST /location/autocomplete
    {
      "query": "Hà"
    }
    ↓
BACKEND HANDLER:
  1. Query Elasticsearch locations index:
     GET /locations/_search
     {
       "query": {
         "multi_match": {
           "query": "Hà",
           "fields": ["n_name", "n_normalizedname"],
           "type": "match_phrase_prefix"
         }
       }
     }

  2. Parse results:
     [
       {id: 1, n_name: "Hà Nội", n_level: 1},
       {id: 2, n_name: "Hà Tây", n_level: 1},
       ...
     ]

  3. Return to frontend as JSON
    ↓
FRONTEND: Display suggestions
  ├─ "Hà Nội" (city)
  ├─ "Hà Tây" (province)
  ├─ "Cầu Giấy, Hà Nội" (district → click shows wards)
  └─ ... more suggestions
    ↓
USER SELECTS: "Hà Nội"
    ↓
SEARCH FILTERS: city_id=1 (applied to real_estate query)
```

---

## Office Organization Flow

### Office Hierarchy Creation

```
ADMIN ACTION: Create new office structure
    ↓
Vùng (Region) → INSERT INTO post_office
  Level: 1, Parent: NULL, Name: "Miền Bắc"
  ID: 1001
  │
  ├─ Tỉnh (Province) → INSERT INTO post_office
  │  Level: 2, Parent: 1001, Name: "Hà Nội"
  │  ID: 2001
  │  │
  │  ├─ Huyện (District) → INSERT INTO post_office
  │  │  Level: 3, Parent: 2001, Name: "Ba Đình"
  │  │  ID: 3001
  │  │  │
  │  │  ├─ Xã (Ward) → INSERT INTO post_office
  │  │  │  Level: 4, Parent: 3001, Name: "Quảng An"
  │  │  │  ID: 4001
  │  │  │  │
  │  │  │  └─ Tổ (Team) → INSERT INTO post_office
  │  │  │     Level: 5, Parent: 4001, Name: "Team A"
  │  │  │     ID: 5001
  │  │  └─ Xã (Ward) → Similar structure
  │  │
  │  └─ Huyện (District) → Similar structure
  │
  └─ Tỉnh (Province) → Similar structure
    ↓
DATABASE RESULT:
  post_office tree stored in flat table with self-references

  id   │ level │ parent_id │ name
  ─────┼───────┼───────────┼──────────────
  1001 │  1    │   NULL    │ Miền Bắc
  2001 │  2    │   1001    │ Hà Nội
  3001 │  3    │   2001    │ Ba Đình
  4001 │  4    │   3001    │ Quảng An
  5001 │  5    │   4001    │ Team A
```

---

### Staff Assignment Flow

```
HR ASSIGNS: Staff member to office
    ↓
INSERT INTO office_staff
  post_office_id: 2001 (Hà Nội office)
  auth_user_id: 123 (user account)
  salesman_id: 456 (legacy reference, optional)
  is_primary: TRUE
  created_on: now()
  created_by: auth.user_id
    ↓
MULTIPLE OFFICE SUPPORT:
  If same user works in multiple offices:
    INSERT INTO office_staff
      post_office_id: 3001 (Ba Đình branch)
      auth_user_id: 123 (same user)
      is_primary: FALSE (secondary office)
    ↓
DEPARTMENT ASSIGNMENT:
  INSERT INTO office_staff_department
    office_staff_id: <from above>
    department_id: 601 (Sales Team)
    position_id: 701 (Salesman)
    role_type: "staff"
    ↓
WORK AREA ASSIGNMENT:
  INSERT INTO staff_work_area
    office_staff_id: <from above>
    area_type: 1 (district level)
    district_id: 3001 (Ba Đình)
    must_within_office_territory: TRUE
    ↓
VALIDATION:
  Verify: Ba Đình (district 3001) ∈ Hà Nội office territory
  Via: office_territory table
    ↓
RESULT: Staff can now:
  ├─ View properties in Ba Đình district
  ├─ Create consultations/transactions
  ├─ See colleagues in same department
  └─ Manage commissions/withdrawals
```

---

## Permission & Access Control Flow

### Menu Access Control

```
SYSTEM STARTUP: Initialize menu permissions
    ↓
DATABASE: Load menu hierarchy
  system_menu (5 records):
    ├─ Dashboard (level 1, parent=NULL)
    ├─ Property Management (level 2, parent=Dashboard)
    │  ├─ Create Property (level 3, parent=Property Management)
    │  └─ Edit Property (level 3, parent=Property Management)
    └─ Office Management (level 2, parent=Dashboard)
    ↓
DATABASE: Load function definitions
  system_function (10 records):
    ├─ view_dashboard → function_type: "view"
    ├─ create_property → function_type: "action", requires_approval: FALSE
    ├─ edit_property → function_type: "action", requires_approval: FALSE
    └─ manage_office → function_type: "action", requires_approval: TRUE
    ↓
DATABASE: Load access rules
  menu_permission (20 records):
    ├─ menu_id=1, auth_group=2 (Salesman), access_level="view"
    ├─ menu_id=2, auth_group=2 (Salesman), access_level="view"
    ├─ menu_id=3, auth_group=2 (Salesman), access_level="view"
    ├─ menu_id=4, auth_group=2 (Salesman), access_level="disabled"  ← Greyed out
    └─ menu_id=5, auth_group=1 (Admin), access_level="view"
    ↓
USER LOGIN: Authenticate
  auth_user (id=123)
  ├─ Password verified
  └─ Load groups: auth_membership for user_id=123
      → groups: [2 (Salesman), 3 (Office Manager)]
    ↓
RENDER NAVIGATION:
  FOR each menu_item in system_menu:
    1. Check menu_permission WHERE
       menu_id={item_id} AND auth_group IN [2, 3]

    2. Access level:
       ├─ "view" → Render normally
       ├─ "disabled" → Render greyed out
       └─ "hidden" → Don't render

    3. Build navigation tree
    ↓
RESULT:
  Salesman sees:
    ├─ Dashboard (view)
    ├─ Property Management (view)
    │  ├─ Create Property (view)
    │  └─ Edit Property (disabled)
    └─ Office Management (hidden)
```

---

### Function-Level Data Filtering

```
ACTION TRIGGERED: Salesman clicks "View Properties"
    ↓
CONTROLLER: real_estate_handle.py
  GET /property/list
    ↓
LOAD DATA SCOPE PERMISSIONS:
  1. Get user's groups: [2 (Salesman), 3 (Office Manager)]

  2. Query function_scope_permission:
     SELECT * FROM function_scope_permission
     WHERE function_id=<view_property_function>
       AND auth_group_id IN [2, 3]
       AND aactive=TRUE
     ORDER BY priority

  3. Parse conditions (JSON):
     {
       "operator": "AND",
       "conditions": [
         {
           "field": "salesman_id",
           "operator": "in",
           "values": [123, 124, 125]  ← Salesman's team
         },
         {
           "field": "status",
           "operator": "not_in",
           "values": [5]  ← Exclude inactive
         }
       ]
     }
    ↓
BUILD ELASTICSEARCH QUERY:
  GET /real_estate/_search
  {
    "query": {
      "bool": {
        "must": [
          {"term": {"aactive": true}},
          {"exists": {"field": "slug"}},
          {"terms": {"salesman_id": [123, 124, 125]}},
          {"bool": {
            "must_not": [
              {"term": {"status": 5}}
            ]
          }}
        ]
      }
    }
  }
    ↓
RESULT: Salesman sees only own team's properties
  ├─ 50 properties (salesman_id in team)
  ├─ 0 properties (from other teams)
  └─ 0 inactive properties (status=5 excluded)
```

---

## Financial Transaction Flow

### Withdrawal Request Lifecycle

```
SALESMAN ACTION: Request commission withdrawal
    ↓
INSERT INTO withdraw
  salesman_id: 123
  dbank_account_id: 456
  amount: 10000000  (10 million VND)
  status: 0 (pending)
  created_on: now()
  created_by: 123
    ↓
WORKFLOW STATE: PENDING
  ├─ Salesman can view request status
  ├─ Manager receives notification
  └─ Withdrawal locked in dbank_account (balance reserved)
    ↓
MANAGER REVIEW:
  1. View pending withdrawals (status=0)
  2. Verify:
     ├─ Sufficient balance in account
     ├─ Valid bank information
     └─ Compliance checks (no flagged transactions)
  3. Approve or reject
    ↓
APPROVAL STATE: status = 1 (approved)
  UPDATE withdraw SET status=1, updated_on=now()
  WHERE id=789 AND status=0
    ↓
FINANCIAL PROCESSING:
  1. Batch process all approved withdrawals:
     SELECT * FROM withdraw WHERE status=1

  2. Create payment transaction:
     INSERT INTO transactions
       dbank_account_id: 456
       amount: 10000000
       fee: 50000  (0.5%)
       direction: "OUT"
       status: "processing"

  3. Update bank account:
     UPDATE dbank_account SET
       account_balance = account_balance - 10050000,
       last_withdrawal_date = now()
     WHERE id=456
       ↓
COMPLETION STATE: status = 2 (completed)
  UPDATE withdraw SET status=2, updated_on=now()

  INSERT INTO transaction_reconciliation
    salesman_id: 123
    reconciliation_batch_id: 999
    total_commission: 10000000
    confirmed_amount: 10000000
    status: "reconciled"
    ↓
RESULT:
  ├─ Withdrawal processed
  ├─ Bank account updated
  ├─ Audit trail recorded (created_on, created_by, updated_on)
  ├─ Salesman receives notification
  └─ Finance team has reconciliation record
```

---

### Commission Calculation Flow

```
TRANSACTION COMPLETED: Real estate sale finalized
    ↓
DATABASE STATE:
  real_estate_transaction.status = 4 (completed)
  amount = 5500000000 (property price)
  commission_percentage = 3% (configured)
    ↓
BATCH JOB: Calculate commissions
  FOR each completed transaction in current period:
    commission = amount × commission_percentage

    INSERT INTO dbank_account.commission
      SET commission = commission + calculated_value
      WHERE salesman_id = {transaction.salesman_id}

    UPDATE dbank_account
      SET account_balance = account_balance + commission
      WHERE salesman_id = {transaction.salesman_id}
    ↓
ACCRUAL ENTRY:
  INSERT INTO transactions (accrual batch)
    amount: 165000000 (5.5B × 3%)
    direction: "IN"
    type: "commission"
    status: "accrued"
    ↓
WITHDRAWAL AVAILABILITY:
  Salesman can now:
    ├─ View balance: 165000000
    ├─ Request withdrawal: up to available balance
    └─ See commission history

AUDIT TRAIL:
  All records timestamped with created_on, created_by, updated_on
```

---

## Computed Fields & Transformations

### Database-Level Computed Fields

#### 1. `updated_on` (PostgreSQL Trigger)
```sql
CREATE OR REPLACE FUNCTION update_updated_on_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_on := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_updated_on_trigger
BEFORE UPDATE ON real_estate
FOR EACH ROW
EXECUTE FUNCTION update_updated_on_column();
```

**Applied to:** All transactional tables
**Frequency:** On every UPDATE statement
**Use Case:** Audit trail; show last-modified timestamp

---

#### 2. `real_estate_code` (Application-Generated)
```
Generation: process_real_estate_batch(id)

Logic:
  prefix = 'M' (buy/sell) or 'T' (rent)
  province_code = lookup(city_id → config table)
  type_code = property_type_id (enum)
  id = database PK

Result: '{M|T}{province}{type}{id}'
Example: 'M6M12345'

Trigger: After INSERT INTO real_estate
Storage: real_estate.real_estate_code (VARCHAR, UNIQUE)
```

---

### Elasticsearch-Level Computed Fields

#### 1. `created_time_updated` (Script Field)
```json
{
  "script_fields": {
    "created_time_updated": {
      "script": {
        "lang": "painless",
        "source": "ZonedDateTime t = ZonedDateTime.parse(doc['created_time'].value.toString());\nreturn t.plusHours(7).format(DateTimeFormatter.ofPattern(\"yyyy-MM-dd HH:mm:ss\"));"
      }
    }
  }
}
```

**Input:** `created_time` (UTC ISO format)
**Transformation:** Add 7 hours (UTC+7 Vietnam time)
**Output:** `"2026-02-06 15:30:00"` (formatted string)
**Use Case:** Display user-friendly timestamp in search results

---

#### 2. `latlng_parsed` (Geo-Point Conversion)
```
Input:
  lat: 21.0285 (float)
  lon: 105.8542 (float)

Elasticsearch Type: geo_point

Use Cases:
  ├─ Geo-distance filtering: radius from point
  ├─ Geo-bounding box: within rectangle
  └─ Map visualization: marker placement

Query Example:
  {
    "geo_distance": {
      "distance": "5km",
      "latlng_parsed": {"lat": 21.0285, "lon": 105.8542}
    }
  }
```

---

### Field Transformation Pipeline (ES Response)

```
Elasticsearch Response:
{
  "id": 12345,
  "created_on": "2026-01-15T08:30:00Z",
  "created_time": "2026-01-15T08:30:00Z",
  "latlng": {"lat": 21.05, "lon": 105.81}
}
    ↓
_convert_es_result_to_dal_format():

  1. Date fields:
     "2026-01-15T08:30:00Z" (ISO) → remove 'Z'
     Result: datetime(2026, 1, 15, 8, 30, 0)  [naive]

  2. Geo fields:
     {"lat": 21.05, "lon": 105.81} → "21.05,105.81"

  3. Script fields:
     created_time_updated → "2026-01-15 15:30:00"  [from script]
    ↓
Final Result (Web2py DAL compatible):
{
  "id": 12345,
  "created_on": datetime(2026, 1, 15, 8, 30, 0),
  "created_time": datetime(2026, 1, 15, 8, 30, 0),
  "latlng": "21.05,105.81",
  "created_time_updated": "2026-01-15 15:30:00"
}
```

---

## Data Consistency Patterns

### Soft-Delete Convention

**Pattern:** Never DELETE records; set `aactive=FALSE`

```
QUERY PATTERN (All searches must follow):
  WHERE aactive = TRUE

EXAMPLE:
  -- Wrong (can return deleted records):
  SELECT * FROM real_estate WHERE salesman_id = 123

  -- Correct:
  SELECT * FROM real_estate
  WHERE salesman_id = 123 AND aactive = TRUE

ELASTICSEARCH FILTER:
  {
    "bool": {
      "must": [
        {"term": {"aactive": true}}
      ]
    }
  }
```

**Benefits:**
- ✓ Audit trail preserved
- ✓ Admin can restore (soft-undelete via UPDATE)
- ✓ Referential integrity maintained
- ✗ Storage overhead (deleted records remain)

---

### Audit Trail Immutability

**Pattern:** `transaction_history` is append-only

```
State Change Workflow:
  OLD: transaction_status = 1 (pending)
  NEW: transaction_status = 2 (approved)
    ↓
1. Validate new state (must exist in enum)
2. INSERT INTO transaction_history:
   {
     real_estate_transaction_id: 456,
     old_status: 1,
     new_status: 2,
     change_reason: "Approved by manager",
     created_on: now(),
     created_by: auth.user_id
   }
3. UPDATE real_estate_transaction SET
   transaction_status = 2,
   updated_on = now()
   WHERE id = 456
    ↓
GUARANTEE: transaction_history never modified
  (No UPDATE, no DELETE on transaction_history)

QUERY:
  SELECT * FROM transaction_history
  WHERE real_estate_transaction_id = 456
  ORDER BY created_on ASC
  → Shows complete state evolution
```

---

### Multi-Office Scoping

**Pattern:** User's office determines data scope

```
USER: alice@example.com
  auth_user.id = 123

OFFICES:
  INSERT INTO office_staff
    auth_user_id = 123
    post_office_id = 1 (Hà Nội)
    is_primary = TRUE

  INSERT INTO office_staff
    auth_user_id = 123
    post_office_id = 2 (TP.HCM)
    is_primary = FALSE

VISIBLE DATA SCOPE:
  ├─ Properties in Hà Nội (post_office_id=1 territory)
  ├─ Properties in TP.HCM (post_office_id=2 territory)
  ├─ Consultations from both offices
  ├─ BUT: Team members from both offices
  └─ AND: Manage staff in both locations

QUERY FILTER:
  function_scope_permission.conditions:
  {
    "operator": "OR",
    "conditions": [
      {"field": "post_office_id", "operator": "in", "values": [1, 2]}
    ]
  }
```

---

### Real-Time vs Batch Consistency

| Operation | Consistency | Latency | Method |
|-----------|-------------|---------|--------|
| **Real estate create** | Near-real-time | <100ms | Direct insert + auto-sync |
| **Real estate update** | Eventual | Seconds-minutes | Trigger + implicit ES sync |
| **Location mapping** | Eventually consistent | Minutes-hours | Batch job |
| **Commission accrual** | Scheduled | Batch cycle (hourly/daily) | Nightly job |

---

## Data Flow Summary

```
┌──────────────────────────────────────────────────────┐
│           REAL ESTATE LISTING LIFECYCLE              │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 1. CREATE (Real-time)                               │
│    User input → DB insert → ES auto-index           │
│    Latency: <1 second                               │
│                                                      │
│ 2. UPDATE (Soft-update)                             │
│    Field change → DB update → Trigger → ES refresh  │
│    Latency: <10 seconds                             │
│    Audit: transaction_history logged                │
│                                                      │
│ 3. DELETE (Soft-delete)                             │
│    User action → SET aactive=FALSE → ES filter      │
│    Latency: <1 second                               │
│    Recovery: Available via UPDATE aactive=TRUE      │
│                                                      │
│ 4. SEARCH (Elasticsearch)                           │
│    Query: geo, price, location filters              │
│    Latency: <500ms                                  │
│    Pagination: from/size (max 1000 for geo)         │
│                                                      │
│ 5. GEOGRAPHIC SYNC (Batch)                          │
│    Location hierarchy update → DB → ES batch        │
│    Latency: Minutes-hours                           │
│    Worker threads: Parallel processing              │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

**Last Updated:** 2026-02-06
**Status:** Complete
**Total Lines:** ~550
