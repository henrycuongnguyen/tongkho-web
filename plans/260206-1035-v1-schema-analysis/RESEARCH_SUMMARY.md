# V1 Schema Research - Summary

## Research Completed

**Report Location:** `research/researcher-db-schema-report.md`

### What Was Analyzed

1. **Models (datatables.py)**: 57+ table definitions extracted from Web2py ORM
2. **SQL Migrations**:
   - `create_post_office_tables.sql` - Office hierarchy system (11 tables, 10 functions, triggers)
   - `migrate_remove_permission_set.sql` - V4 migration (removed legacy permission tables)
3. **Database Configuration**: PostgreSQL connection in models/db.py
4. **Audit Trail**: Standard created_on/created_by/updated_on/aactive pattern

### Key Findings

**Schema Inventory:**
- 57 active tables
- 6 primary domains (Real Estate, Office System, Users, Messaging, Finance, Config)
- ~120+ foreign key relationships
- 95% audit coverage via created_on/created_by/updated_on fields

**Office/Post-Office System (NEW in V1):**
- Hierarchical 5-level office structure (Region→Province→District→Ward→Team)
- Geographic scoping via office_territory table
- Staff assignment with multi-office support
- Auto-updated audit fields via PostgreSQL triggers

**Permission Evolution:**
- V3: office_permission_set + office_permission (removed)
- V4: Consolidated to auth_group with post_office_id foreign key
- Migration script available but deployment status unclear

**Critical Business Rules:**
1. Soft-delete via aactive boolean (no hard deletes)
2. Multi-tenancy: User can work across multiple offices
3. Geographic validation: Staff work areas must be within office territories
4. Audit immutability: transaction_history is append-only

### Tables Requiring Attention

| Category | Tables | Note |
|----------|--------|------|
| Real Estate | 10 | Core domain, complex status workflows |
| Office System | 8 | New V1 feature, hierarchical structure |
| Permission | 4 | V4 migration incomplete (check production) |
| Financial | 8 | Multi-currency, reconciliation logic |
| Messaging | 7 | SMS/Zalo/Rocket integration |
| Auth | 3 | Web2py built-in + extensions |

### Unresolved Issues

1. **Migration Status**: V4 migration script defines auth_group.post_office_id but unclear if backfilled
2. **Dual Staff Model**: Salesman table vs office_staff table creates confusion
3. **Data Scope Configuration**: JSON structure in system_function.data_scope_config not documented
4. **Index Coverage**: No composite indexes defined for common (post_office_id, aactive) queries
5. **Menu Type Field**: system_menu.menu_type added but enumeration unclear

### Next Steps for Implementation

1. **Verify V4 Migration**: Check if production database has completed migration
2. **Index Optimization**: Add composite indexes on high-cardinality lookups
3. **Consolidation Roadmap**: Plan salesman→office_staff migration
4. **Documentation**: Define JSON schema for data_scope_config and conditions fields
5. **Multi-tenancy Enforcement**: Consider PostgreSQL RLS policies

---

**Generated:** Feb 6, 2026
**Source:** tongkho_v1/models/datatables.py (4547 lines)
**Database:** PostgreSQL (Web2py PyDAL)
