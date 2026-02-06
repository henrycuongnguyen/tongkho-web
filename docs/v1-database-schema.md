# V1 Database Schema Reference

**Database:** PostgreSQL with PyDAL (Python Data Abstraction Layer)
**Framework:** Web2py
**Total Tables:** 57 active tables
**Total Relationships:** 120+ foreign keys
**Document Date:** 2026-02-06

---

## Quick Navigation

1. [Domain Overview](#domain-overview)
2. [Core Real Estate Domain](#core-real-estate-domain)
3. [Office/Post-Office System](#officepost-office-system)
4. [Permission & Menu System](#permission--menu-system)
5. [Messaging System](#messaging-system)
6. [Financial Domain](#financial-domain)
7. [Audit Trail Pattern](#audit-trail-pattern)
8. [Critical Constraints & Indexes](#critical-constraints--indexes)
9. [Business Logic Patterns](#business-logic-patterns)

---

## Domain Overview

| Domain | Tables | Purpose | Key Features |
|--------|--------|---------|--------------|
| **Real Estate Core** | 7 | Properties, transactions, projects | Multi-status lifecycle, soft-delete |
| **Office System** | 7 | Hierarchical org structure | 5-level hierarchy, territory scoping |
| **Permission & Menu** | 5 | Access control, UI navigation | V4 migration removed legacy tables |
| **Messaging** | 6 | SMS, Zalo, notifications | Campaign batching, audit logging |
| **Financial** | 9 | Banking, payments, commissions | Withdrawal workflows, reconciliation |
| **Configuration** | 10 | Enums, metadata, tags | SEO, property attributes |

---

## Core Real Estate Domain

### Primary Tables

#### `real_estate` - Property Listings
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Property identifier |
| `title` | String | NOT NULL | Property display name |
| `slug` | String | UNIQUE | URL-friendly identifier |
| `property_type_id` | FK | NOT NULL | Links to property_type |
| `status` | Integer | CHECK (1-5) | 1=draft, 2=active, 3=sold, 4=rented, 5=inactive |
| `salesman_id` | FK | | Property owner/manager |
| `city_id`, `district_id`, `ward_id` | FK | | Geographic scope |
| `price` | Numeric | | Listing price |
| `area` | Float | | Square meters |
| `bedrooms`, `bathrooms` | Integer | | Unit specs |
| `description`, `html_content` | Text | | Full details |
| `data` | JSON | | Flexible attributes |
| `aactive` | Boolean | DEFAULT TRUE | Soft-delete flag |
| `created_on`, `created_by` | Timestamp, FK | | Audit trail |
| `updated_on` | Timestamp | AUTO-TRIGGER | Last modification |

**Indexes:** `(city_id, district_id)`, `(salesman_id, aactive)`, `(status)`

**Key Constraint:** Status must be one of 5 enumerated values; never DELETE, only SET aactive=FALSE.

---

#### `real_estate_transaction` - Sales/Rental Records
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Transaction ID |
| `real_estate_id` | FK | NOT NULL | Links to real_estate |
| `salesman_id` | FK | | Transaction agent |
| `transaction_status` | Integer | CHECK | pending, approved, rejected, completed |
| `transaction_type_id` | FK | | Sale vs rental |
| `buyer_name`, `buyer_phone` | String | | Buyer contact |
| `amount`, `commission` | Numeric | | Financial details |
| `aactive`, `created_on`, `created_by`, `updated_on` | | | Audit trail |

**Indexes:** `(real_estate_id, status, aactive)`, `(salesman_id, status)`

**Workflow:** pending → approved → completed (or rejected)

---

#### `transaction_history` - Immutable Audit Log
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Audit entry ID |
| `real_estate_transaction_id` | FK | NOT NULL | Parent transaction |
| `old_status` | Integer | | Previous state |
| `new_status` | Integer | | Updated state |
| `change_reason` | Text | | Why changed |
| `created_on`, `created_by` | | | Who & when |

**Pattern:** Immutable append-only log; never UPDATE or DELETE.

---

#### `real_estate_sale` - Inventory/Unit Locks
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Sale unit ID |
| `real_estate_id` | FK | NOT NULL | Parent property |
| `unit_number` | String | | Floor/apartment number |
| `status` | Integer | | available, locked, sold |
| `aactive`, `created_on`, `created_by`, `updated_on` | | | Audit trail |

**Purpose:** Track individual units in multi-unit properties.

---

#### `consultation` - Lead Inquiries
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Lead ID |
| `salesman_id` | FK | | Assigned agent |
| `real_estate_id` | FK | | Property of interest |
| `consultation_interest_id` | FK | | Interest type (buy/rent/info) |
| `customer_name`, `customer_phone`, `customer_email` | String | | Contact details |
| `aactive`, `created_on`, `created_by`, `updated_on` | | | Audit trail |

**Status Tracking:** Via implicit status transitions (created → contacted → converted).

---

#### `project` - Development Projects
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Project ID |
| `name` | String | NOT NULL | Project display name |
| `code` | String | UNIQUE | Project code (e.g., "PRJ001") |
| `developer_project_id` | FK | | Developer company |
| `zone_of_project_id` | FK | | Zone/area classification |
| `status` | Integer | | upcoming, selling, sold_out, completed |
| `city_id`, `district_id`, `ward_id` | FK | | Location hierarchy |
| `parent_id` | FK | NULL | Self-ref for multi-phase projects |
| `aactive`, `created_on`, `created_by`, `updated_on` | | | Audit trail |

**Hierarchy:** Projects can have child projects (phases); parent_id=NULL for top-level.

---

#### `locations` - Geographic Areas (Hierarchical)
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Location ID |
| `name` | String | NOT NULL | "Hà Nội", "Cầu Giấy", etc. |
| `slug` | String | UNIQUE | "ha-noi", "cau-giay" |
| `level` | Integer | | 1=city, 2=district, 3=ward, 4=street |
| `parent_id` | FK | NULL | Self-ref to parent level |
| `aactive`, `created_on`, `created_by`, `updated_on` | | | Audit trail |

**Key Constraint:** `parent_id` determines hierarchy; city (level 1) has NULL parent.

---

## Office/Post-Office System

### Hierarchy Structure

```
Level 1: Vùng/Miền (Region)
  └─ Level 2: Tỉnh/Thành phố (Province)
      └─ Level 3: Huyện/Quận (District)
          └─ Level 4: Xã/Phường (Ward)
              └─ Level 5: Tổ/Điểm (Team/Point)
```

All stored in single `post_office` table with self-referencing `parent_id`.

---

### Primary Tables

#### `post_office` - Office Hierarchy
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Office ID |
| `name` | String | NOT NULL | "Hà Nội Region", etc. |
| `office_level` | Integer | CHECK (1-5) | Hierarchy level |
| `parent_id` | FK | NULL | Parent office |
| `manager_user_id` | FK | | Assigned manager |
| `aactive`, `created_on`, `created_by`, `updated_on` | | | Audit trail |

**Auto-trigger:** PostgreSQL trigger maintains `updated_on` on every modification.

**Composite Index:** `(office_level, parent_id, aactive)`

---

#### `office_staff` - Employee Roster
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Staff record ID |
| `post_office_id` | FK | NOT NULL | Assigned office |
| `auth_user_id` | FK | NOT NULL | Web2py user account |
| `salesman_id` | FK | | Legacy salesman reference |
| `is_primary` | Boolean | | Primary office (user can work in multiple) |
| `aactive`, `created_on`, `created_by`, `updated_on` | | | Audit trail |

**Key Constraint:** One staff record per user per office; use `is_primary=TRUE` for main assignment.

---

#### `office_department` - Team Groupings
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Department ID |
| `post_office_id` | FK | NOT NULL | Parent office |
| `name` | String | NOT NULL | "Sales Team", "Management" |
| `parent_id` | FK | NULL | Self-ref for sub-departments |
| `manager_staff_id` | FK | | Department head |
| `aactive`, `created_on`, `created_by`, `updated_on` | | | Audit trail |

---

#### `office_position` - Job Titles
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Position ID |
| `post_office_id` | FK | NULL | NULL=system-wide, else office-specific |
| `name` | String | NOT NULL | "Salesman", "Manager", "Coordinator" |
| `description` | Text | | Role responsibilities |
| `aactive`, `created_on`, `created_by`, `updated_on` | | | Audit trail |

---

#### `office_staff_department` - Staff Assignments
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Assignment ID |
| `office_staff_id` | FK | NOT NULL | Staff member |
| `department_id` | FK | NOT NULL | Department |
| `position_id` | FK | | Job title |
| `role_type` | String | | manager, deputy, staff, coordinator, specialist |
| `aactive`, `created_on`, `created_by`, `updated_on` | | | Audit trail |

**Purpose:** Track staff-department relationships with role types.

---

#### `office_territory` - Service Areas
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Territory ID |
| `post_office_id` | FK | NOT NULL | Responsible office |
| `city_id`, `district_id`, `ward_id` | FK | | Geographic scope |
| `aactive`, `created_on`, `created_by`, `updated_on` | | | Audit trail |

**Purpose:** Define geographic service area for office.

---

#### `staff_work_area` - Individual Assignments
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Work area ID |
| `office_staff_id` | FK | NOT NULL | Staff member |
| `area_type` | Integer | | 1=district, 2=ward, 3=custom |
| `location_id`, `district_id`, `ward_id` | FK | | Geographic scope |
| `must_within_office_territory` | Boolean | | Enforce office boundary validation |
| `aactive`, `created_on`, `created_by`, `updated_on` | | | Audit trail |

**Validation:** If `must_within_office_territory=TRUE`, staff area must fall within office territory.

---

## Permission & Menu System

### V4 Migration Note
Removed `office_permission_set` and `office_permission` tables (deprecated). Now uses `auth_group` with `post_office_id`.

---

### Primary Tables

#### `system_menu` - Navigation Menu
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Menu item ID |
| `name` | String | NOT NULL | Menu label |
| `url` | String | | Navigation URL |
| `icon` | String | | Icon identifier |
| `menu_level` | Integer | CHECK (1-3) | Hierarchy depth |
| `parent_id` | FK | NULL | Self-ref for nesting |
| `menu_type` | String | | sidebar, topbar, footer (enumeration) |
| `display_order` | Integer | | Sort order |
| `aactive`, `created_on`, `created_by`, `updated_on` | | | Audit trail |

---

#### `system_function` - Feature Definitions
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Function ID |
| `menu_id` | FK | | Parent menu item |
| `name` | String | NOT NULL | Function name (e.g., "create_property") |
| `function_type` | String | | action, view, report (enumeration) |
| `role_group` | String | | CSV list of auth_group IDs (legacy) |
| `requires_approval` | Boolean | | Approval workflow needed |
| `data_scope_config` | JSON | | Data filtering rules (per function) |
| `aactive`, `created_on`, `created_by`, `updated_on` | | | Audit trail |

**JSON Structure Example:**
```json
{
  "scope_type": "office_territory",
  "filters": [
    {"field": "office_id", "operator": "in", "values": [1, 2, 3]}
  ]
}
```

---

#### `menu_permission` - Menu-Level ACL
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Permission ID |
| `menu_id` | FK | NOT NULL | Menu item |
| `auth_group_id` | FK | NOT NULL | User role group |
| `access_level` | String | | view, disabled, hidden |
| `aactive`, `created_on`, `created_by`, `updated_on` | | | Audit trail |

**Access Levels:**
- `view`: Menu item visible and clickable
- `disabled`: Menu item visible but greyed out
- `hidden`: Menu item not rendered

---

#### `function_scope_permission` - Function-Level Data Filtering
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | Integer | PK | Permission ID |
| `function_id` | FK | NOT NULL | Function |
| `auth_group_id` | FK | NOT NULL | Role group |
| `conditions` | JSON | | Complex access conditions |
| `priority` | Integer | | Resolution order (lower=higher priority) |
| `aactive`, `created_on`, `created_by`, `updated_on` | | | Audit trail |

**JSON Structure Example:**
```json
{
  "operator": "AND",
  "conditions": [
    {"field": "post_office_id", "operator": "in", "values": [1, 2]},
    {"field": "status", "operator": "not_in", "values": [5]}
  ]
}
```

---

#### `auth_user`, `auth_group`, `auth_membership`
Standard Web2py built-in tables (extended in V1):
- `auth_user.email`, `auth_user.password_hash`, `auth_user.first_name`, `auth_user.last_name`
- `auth_group.post_office_id` (Added in V4) - Enable office-scoped role groups
- `auth_membership.user_id` ↔ `auth_membership.group_id` (M2M relationship)

---

## Messaging System

| Table | Purpose | Key Relations |
|-------|---------|----------------|
| `tmessage` | SMS/message records | salesman_id, tmessage_type |
| `message_campaign` | Batch campaigns | message_campaign_type, target_count |
| `notification` | In-app notifications | Generic entity linking (entity_type, entity_id) |
| `zalo_access` | Zalo API credentials | API key, secret storage |
| `sms_log` | SMS audit trail | salesman_id, status (sent/failed) |
| `rocket_message` | Rocket.Chat messages | rocket_room_id, user_id |
| `rocket_room` | Rocket.Chat channels | room_name, members |

**Audit Coverage:** All records include `created_on`, `created_by`, `updated_on`.

---

## Financial Domain

| Table | Purpose | Amount Fields |
|-------|---------|----------------|
| `dbank` | Digital bank definitions | - |
| `dbank_account` | Bank accounts | account_balance, commission |
| `transactions` | Payment records | amount, fee, status |
| `withdraw` | Withdrawal requests | amount, status (pending/approved/rejected/completed) |
| `transaction_reconciliation` | Reconciliation entries | total_commission, confirmed_amount |
| `reconciliation_batch` | Batch processing | batch_total, status |
| `loan` | Loan products | amount, interest_rate, term (months) |
| `loan_mortgage` | Collateral records | mortgage_value, asset_description |
| `sms_bank` | Bank notifications | amount, balance (from SMS parsing) |

**Workflow:** Withdrawal → approval → payment → reconciliation.

---

## Audit Trail Pattern

**Standard across all transactional tables:**

```sql
created_on       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
created_by       REFERENCE auth_user (NOT NULL, default to auth.user_id or 1)
updated_on       TIMESTAMP (AUTO-UPDATED by PostgreSQL trigger)
aactive          BOOLEAN DEFAULT TRUE (Soft-delete flag, NOT user-writable)
```

**Trigger Function (PostgreSQL):**
```sql
CREATE TRIGGER update_updated_on_trigger
BEFORE UPDATE ON {table_name}
FOR EACH ROW
EXECUTE FUNCTION update_updated_on_column();
```

**Exception:** Some lookup/enum tables omit audit fields (property_type, real_estate_status, etc.).

**Soft-Delete Convention:**
- Never execute `DELETE FROM {table}`
- Instead: `UPDATE {table} SET aactive=FALSE WHERE id=...`
- Queries must filter: `WHERE aactive=TRUE`

---

## Critical Constraints & Indexes

### CHECK Constraints
```sql
-- Real estate status enum
CHECK (status IN (1, 2, 3, 4, 5))

-- Office levels (hierarchy)
CHECK (office_level BETWEEN 1 AND 5)

-- Menu levels (navigation depth)
CHECK (menu_level BETWEEN 1 AND 3)
```

### High-Cardinality Indexes

| Table | Index | Reason |
|-------|-------|--------|
| `real_estate` | `(city_id, district_id)` | Geographic filtering |
| `real_estate` | `(salesman_id, aactive)` | Active property listings per agent |
| `real_estate_transaction` | `(real_estate_id, status, aactive)` | Transaction history |
| `office_staff` | `(post_office_id, auth_user_id)` | User scope lookup |
| `post_office` | `(office_level, parent_id, aactive)` | Hierarchy traversal |
| `menu_permission` | `(menu_id, auth_group_id)` | ACL lookup |

### JSON Fields
- `system_function.data_scope_config` - Function-level data filtering
- `function_scope_permission.conditions` - Advanced ACL rules
- `real_estate.data` - Flexible property attributes

**Index Strategy:** Use GIN (Generalized Inverted Index) for JSON queries:
```sql
CREATE INDEX ON system_function USING GIN (data_scope_config);
```

---

## Business Logic Patterns

### 1. Geographic Scoping
- **Hierarchical locations:** City → District → Ward → Street
- **Office territory:** Service area constraints
- **Staff work area:** Individual coverage areas with optional boundary validation
- **Real estate scope:** Property listings tied to city/district/ward

---

### 2. Multi-Office Multi-User
- Staff can work in multiple offices (`office_staff.is_primary`)
- Each staff-office relationship tracked separately
- Role assignment per office-department pair
- Permission scope limited by assigned office

---

### 3. Permission Model (V4)
- **No legacy office_permission tables** (removed in migration)
- **Current:** `auth_group` + `auth_membership` + `post_office_id`
- **Menu access:** `menu_permission` defines visibility (view/disabled/hidden)
- **Function access:** `function_scope_permission` defines data filtering (JSON conditions)
- **Priority:** Lower priority number = higher precedence

---

### 4. Soft-Delete Convention
- All active records: `aactive=TRUE`
- Deletion: `SET aactive=FALSE` (never DELETE)
- Queries: `WHERE aactive=TRUE` (filter required)
- Audit trail: `transaction_history` immutable append-only

---

### 5. Transaction Lifecycle
```
Consultation (lead) → Transaction Created (pending)
  → Approved → Payment → Completed
                    └─→ Rejected
```
State changes tracked in `transaction_history`.

---

### 6. Real Estate Code Generation
**Format:** `{prefix}{province_code}{property_type_code}{id}`
- Prefix: 'M' (buy/sell) or 'T' (rent)
- Province code: 2-3 character code (mapped from location)
- Property type code: 1-2 character enum
- ID: Database primary key

**Generation:** Called after `INSERT INTO real_estate` via `process_real_estate_batch()`.

---

## Configuration Tables

| Table | Purpose | Sample Records |
|-------|---------|-----------------|
| `property_type` | Enum | apartment, house, villa, land, office, shop |
| `real_estate_status` | Enum | draft, active, sold, rented, inactive |
| `transaction_type` | Enum | buy/sell, rental, project |
| `seo_meta_data` | Entity metadata | entity_type (property), entity_id (fk), meta_title, meta_description |
| `tag_categories` | Tag types | hot, featured, vip, new |
| `tags` | System tags | attached to tag_categories |
| `entity_tags` | Entity tagging | entity_type, entity_id, tag_id (flexible linking) |
| `field_type` | Custom field types | text, number, date, select |
| `condition_type` | Campaign conditions | age_range, budget, interest_type |
| `jackpot_config` | Reward configuration | points, prize descriptions |

---

## Key Relationships Summary

### Real Estate Domain
- `real_estate` → `property_type`, `real_estate_status`, `salesman`, `locations`
- `real_estate_transaction` → `real_estate`, `transaction_type`, `transaction_status`
- `transaction_history` → `real_estate_transaction` (1:N, immutable)
- `project` → `developer_project`, `zone_of_project`, `locations`, `project` (self-ref)

### Office Domain
- `post_office` → `post_office` (self-ref, parent_id)
- `office_staff` → `post_office`, `auth_user`
- `office_staff_department` → `office_staff`, `office_department`, `office_position`
- `staff_work_area` → `office_staff`, `locations`

### Permission Domain
- `auth_group` → `post_office_id` (V4 addition)
- `menu_permission` → `system_menu`, `auth_group`
- `function_scope_permission` → `system_function`, `auth_group`

---

## Database Statistics

| Metric | Value |
|--------|-------|
| **Total Tables** | 57 active + 4 deprecated |
| **Total Relationships** | 120+ foreign keys |
| **Audit Coverage** | ~95% of transactional tables |
| **PostgreSQL Features** | Triggers, REFERENCES, CHECK constraints, JSON type, GIN indexes |
| **Soft-Delete Coverage** | 100% (aactive pattern) |

---

## Unresolved Questions & Notes

1. **V4 Migration Status:** Verify office_permission cleanup deployed to production
2. **auth_group.post_office_id:** May need backfilling for existing groups
3. **data_scope_config JSON:** No standardized schema validation in codebase
4. **Salesman vs Staff:** Dual identity system; recommend consolidation roadmap
5. **SEO Metadata Performance:** Generic entity_type/entity_id design limits optimization
6. **Real Estate Custom Fields:** No schema validation for flexible JSON attributes
7. **Audit Log Retention:** No TTL policy for transaction_history archival

---

**Last Updated:** 2026-02-06
**Status:** Complete
**Total Lines:** ~640
