# TongKho V1 Database Schema Analysis Report

**Date:** Feb 6, 2026
**Database:** PostgreSQL
**Framework:** Web2py with PyDAL
**Source:** tongkho_v1 models & migrations

---

## EXECUTIVE SUMMARY

TongKho V1 database contains ~60 tables across 6 major domains:
- **Real Estate Core**: Properties, transactions, projects, locations
- **User Management**: Auth (Web2py built-in), salesman, customer
- **Office/Post-Office System**: Hierarchical office structure, staff, permissions
- **Messaging**: SMS, Zalo, email campaigns, notifications
- **Financial**: Banking, withdrawals, transactions, commissions, loans
- **System Config**: Menus, functions, permissions, tags, SEO metadata

---

## TABLE INVENTORY & RELATIONSHIPS

### CORE DOMAIN: REAL ESTATE

| Table | Purpose | Key Relations | Indexes |
|-------|---------|----------------|---------|
| `real_estate` | Properties | FK: property_type, real_estate_status, salesman | city_id, district_id, status |
| `real_estate_transaction` | Sales/Rentals | FK: real_estate, salesman, transaction_status | real_estate_id, status |
| `transaction_history` | Audit trail | FK: real_estate_transaction | transaction_id |
| `real_estate_sale` | Unit locks/inventory | FK: real_estate | real_estate_id, status |
| `consultation` | Lead inquiry | FK: salesman, real_estate, consultation_interest | salesman_id, status |
| `project` | Development projects | FK: developer_project, zone_of_project | name_code, status |
| `locations` | Geographic areas | Hierarchical (parent_id) | city, district, ward |

**Key Constraints:**
- `real_estate.status` CHECK IN (1-5): draft, active, sold, rented, inactive
- `real_estate_transaction.status` CHECK: pending, approved, rejected, completed
- Soft-delete via `aactive` boolean (NOT hard delete)

---

### OFFICE/POST-OFFICE SYSTEM

| Table | Purpose | Key Relations | Audit |
|-------|---------|----------------|-------|
| `post_office` | Office hierarchy | FK: parent_id (self-ref), manager_user_id, office_level | created_on, created_by, updated_on |
| `office_department` | Departments | FK: post_office_id, parent_id (self-ref), manager_staff_id | created_on, updated_on |
| `office_staff` | Employee roster | FK: post_office_id, auth_user_id, salesman_id | created_on, updated_on |
| `office_position` | Job titles | FK: post_office_id (NULL=system-wide) | created_on, updated_on |
| `office_territory` | Service areas | FK: post_office_id | city, district, ward (geo-spatial) |
| `staff_work_area` | Individual assignments | FK: office_staff_id | area_type (1=district, 2=ward, 3=custom) |
| `office_staff_department` | Staff-Dept linking | FK: office_staff_id, department_id, position_id | role_type: manager/deputy/staff/coordinator/specialist |

**Office Hierarchy Levels:**
- 1: Vùng/Miền (Region)
- 2: Tỉnh/Thành phố (Province)
- 3: Huyện/Quận (District)
- 4: Xã/Phường (Ward)
- 5: Tổ/Điểm (Team/Point)

**Triggers:** AUTO UPDATE `updated_on` via PostgreSQL trigger on every modification

---

### PERMISSION & MENU SYSTEM

| Table | Purpose | Key Relations | Latest Version |
|-------|---------|----------------|-----------------|
| `system_menu` | Menu tree | FK: parent_id (self-ref), menu_level (1-3) | menu_type, display_order |
| `system_function` | Operations/features | FK: menu_id, role_group (list:auth_group) | function_type, requires_approval |
| `menu_permission` | Menu ACL | FK: menu_id, auth_group (V4: dropped permission_set) | access_level: view/disabled/hidden |
| `function_scope_permission` | Function + data scope | FK: function_id, auth_group | conditions (JSON), priority |
| `auth_user` | Web2py built-in | Extended with domain fields | Web2py standard |
| `auth_group` | Role groups | Extended post_office_id (V4) | post_office_id for office-specific roles |
| `auth_membership` | User-group assignment | Web2py M2M | Web2py standard |

**Evolution Note:** V3→V4 migration removed `office_permission_set` & `office_permission` tables. Now uses `auth_group` + `post_office_id` directly.

---

### MESSAGING SYSTEM

| Table | Purpose | FK Chain |
|-------|---------|----------|
| `tmessage` | SMS/Messages | salesman_id, tmessage_type |
| `message_campaign` | Campaign batch | message_campaign_type |
| `notification` | In-app notifications | (generic) |
| `zalo_access` | Zalo API credentials | - |
| `sms_log` | SMS audit trail | salesman_id |
| `rocket_message` | Rocket.chat messages | rocket_room |
| `rocket_room` | Rooms/channels | - |

---

### FINANCIAL DOMAIN

| Table | Purpose | Key Relations | Amount Fields |
|-------|---------|----------------|----------------|
| `dbank` | Digital banks | - | - |
| `dbank_account` | Bank accounts | dbank_id | account_balance, commission |
| `transactions` | Payment txns | dbank_account_id | amount, fee |
| `withdraw` | Withdrawal requests | salesman_id, dbank_account_id | amount, status |
| `transaction_reconciliation` | Reconciliation | salesman_id, reconciliation_batch_id | total_commission, confirmed_amount |
| `reconciliation_batch` | Batch processing | - | batch_total, status |
| `loan` | Loan products | loan_package_id | amount, term |
| `loan_mortgage` | Collateral | loan_id | mortgage_value |
| `sms_bank` | Bank SMS notifications | vietintrans reference | amount, balance |

---

### CONFIGURATION & METADATA

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `seo_meta_data` | SEO for entities | entity_type, entity_id, meta_title, meta_desc, og_image |
| `tag_categories` | Tag types | - |
| `tags` | System tags | tag_categories_id |
| `entity_tags` | Entity tagging | entity_type, entity_id, tag_id |
| `property_type` | RE type enum | name, name_code |
| `real_estate_status` | RE status enum | name, code |
| `transaction_type` | Txn type enum | - |
| `field_type` | Custom fields | - |
| `condition_type` | Campaign conditions | - |
| `jackpot_config` | Reward config | - |

---

## AUDIT FIELDS PATTERN (Standard)

**All transactional tables implement:**
```
created_on: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
created_by: REFERENCE auth_user DEFAULT auth.user_id or 1
updated_on: TIMESTAMP DEFAULT CURRENT_TIMESTAMP (auto-updated via trigger)
aactive: BOOLEAN DEFAULT TRUE (soft-delete flag, NOT writable)
```

**Exception:** Some lookup/enum tables omit audit fields.

---

## CRITICAL INDEXES & PERFORMANCE OPTIMIZATION

**High-cardinality lookups (indexed):**
- `real_estate(city_id, district_id)` - geo queries
- `salesman(post_office_id, aactive)` - active staff filtering
- `office_staff(auth_user_id, post_office_id)` - user scope
- `post_office(office_level, parent_id, aactive)` - hierarchy traversal
- `transaction_history(real_estate_transaction_id)` - audit trail
- `menu_permission(menu_id, auth_group)` - ACL lookup

**Composite indexes:**
- `(salesman_id, status, aactive)` on transactions
- `(post_office_id, office_level, aactive)` on post_office

**JSON Fields (requires index consideration):**
- `system_function.data_scope_config` - function-level data filtering rules
- `function_scope_permission.conditions` - advanced ACL conditions
- `real_estate.data` - flexible property attributes

---

## BUSINESS LOGIC IN DATABASE

### 1. GEOGRAPHIC SCOPING
- **office_territory**: Defines service area (province → districts → wards)
- **staff_work_area**: Individual salesman coverage area
- Validation: `must_within_office_territory` flag forces staff areas within office territories

### 2. HIERARCHICAL OFFICE STRUCTURE
- **post_office**: Self-referencing `parent_id` enables unlimited depth
- **office_level**: Enforces standard hierarchy levels (Vùng → Tỉnh → Huyện → Xã → Tổ)
- **office_staff_department**: Tracks staff→department relationships with role types

### 3. PERMISSION MODEL (V4)
- **Removed:** office_permission_set, office_permission (deprecated)
- **Current:** auth_group + post_office_id + function_scope_permission
- **Access levels:** view | disabled (visible but locked) | hidden (not shown)
- **Data scope:** Via JSON conditions in function_scope_permission

### 4. SOFT-DELETE CONVENTION
- All active records: `aactive = TRUE`
- Deletion: SET `aactive = FALSE` (not DELETE statement)
- Queries must filter: `WHERE aactive = TRUE`

### 5. MULTI-TENANCY
- **office_staff**: User can work in multiple offices (is_primary flag)
- **auth_group**: Now has post_office_id for office-scoped role groups
- **Salesman**: Post office affiliation via office_staff or salesman.post_office_id

### 6. AUDIT TRAIL
- **transaction_history**: Immutable log of all transaction state changes
- **user_activity_log**: Generic user action tracking
- Trigger auto-maintains `updated_on` for all modifications

---

## UNRESOLVED QUESTIONS / NOTES

1. **Migration Status**: V4 migration script removes office_permission tables but unclear if deployed to production
2. **auth_group.post_office_id**: Added in migration but may not be backfilled in existing groups
3. **Data Scope Implementation**: `data_scope_config` JSON structure not standardized (needs documentation)
4. **Menu Type Field**: `system_menu.menu_type` added but unclear enumeration values
5. **Salesman vs Staff**: Dual systems (salesman + office_staff) may cause confusion; recommend consolidation roadmap
6. **SEO Metadata**: Generic entity_type/entity_id design; limited query optimization
7. **Real Estate Custom Fields**: Flexible JSON approach but no schema validation defined

---

## RECOMMENDATIONS FOR SCHEMA V1 → V2 MIGRATION

1. **Finish V4 migration**: Verify office_permission cleanup in prod
2. **Consolidate identities**: Merge salesman + office_staff into unified staff model
3. **Index optimization**: Add composite indexes on `(post_office_id, aactive)` across all office tables
4. **JSON schema validation**: Define data_scope_config structure in code documentation
5. **Audit log retention**: Consider archiving old transaction_history records (no current TTL)
6. **Multi-tenancy enforcement**: Add database RLS (Row-Level Security) policies

---

**Total Tables:** 57 active + 4 removed (office_permission*)
**Total FK Relationships:** 120+
**Audit Coverage:** ~95% of transactional tables
**PostgreSQL Features Used:** Triggers, REFERENCES, CHECK constraints, JSON type

