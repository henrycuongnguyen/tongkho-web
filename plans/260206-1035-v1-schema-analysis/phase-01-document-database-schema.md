---
phase: 1
title: "Document Database Schema"
status: pending
effort: 4h
priority: P1
---

# Phase 1: Document Database Schema

## Context Links

- Parent Plan: [plan.md](plan.md)
- Research Report: [researcher-db-schema-report.md](research/researcher-db-schema-report.md)
- Target Doc: [docs/v1-database-schema.md](../../docs/v1-database-schema.md)

## Overview

**Date:** 2026-02-06
**Description:** Extract and document complete V1 database schema with detailed table definitions, relationships, and business rules
**Priority:** P1 - Critical
**Implementation Status:** Not started
**Review Status:** Not reviewed

## Key Insights

From research report:
- 57 active PostgreSQL tables across 6 domains
- Web2py PyDAL ORM with declarative models
- 95% audit trail coverage (created_on, created_by, updated_on, aactive)
- Office hierarchy: 5-level structure with geographic scoping
- Complex permission system (V3→V4 migration)

## Requirements

### Functional Requirements

1. **Table Inventory**
   - Document all 57 tables with descriptions
   - Group by domain (Real Estate, Office, User, Permission, Messaging, Financial)
   - Include field names, types, constraints

2. **Relationships Mapping**
   - Document all foreign key relationships
   - Create ERD-style relationship diagram (text/markdown)
   - Identify one-to-many, many-to-many patterns

3. **Business Rules Extraction**
   - Document check constraints
   - List triggers (update_updated_on_column)
   - Identify soft-delete patterns (aactive flag)
   - Document status enums and their meanings

4. **Audit Trail Pattern**
   - Document standard audit fields
   - Explain auto-update triggers
   - List exceptions (tables without audit)

### Non-Functional Requirements

- Documentation under 800 LOC (split if needed)
- Markdown format with clear sections
- Code examples for complex relationships
- Cross-references to other docs

## Architecture

### Domain Structure

```
V1 Database (PostgreSQL)
├── Real Estate Domain (10 tables)
│   ├── Properties (real_estate)
│   ├── Projects (project)
│   ├── Locations (locations, districts, wards)
│   └── Transactions (transaction)
├── Office Domain (8 tables)
│   ├── post_office (5-level hierarchy)
│   ├── office_territory
│   ├── office_position
│   ├── office_staff
│   └── staff_work_area
├── User Domain (3+ tables)
│   ├── auth_user
│   ├── auth_group
│   └── salesman
├── Permission Domain (4 tables)
│   ├── system_menu
│   ├── system_function
│   ├── menu_function_mapping
│   └── menu_permission
├── Messaging Domain (7 tables)
│   └── Campaigns, templates, logs
└── Financial Domain (8 tables)
    └── Banking, withdrawals, loans
```

### Relationship Patterns

1. **Hierarchical:** post_office.parent_id → post_office.id
2. **Polymorphic:** created_by → auth_user.id (across all tables)
3. **Many-to-Many:** menu_function_mapping (menu ↔ function)
4. **Geographic:** office_territory → post_office (1:N)

## Related Code Files

### Source Files to Analyze

- `tongkho_v1/models/db.py` - Main model definitions
- `tongkho_v1/sql/*.sql` - Migration scripts
- `tongkho_v1/controllers/bds_*.py` - Business logic

### Target Documentation

- `docs/v1-database-schema.md` (create new)
- `docs/system-architecture.md` (update)
- `docs/codebase-summary.md` (reference)

## Implementation Steps

1. **Read Research Report** (10 min)
   - Review researcher-db-schema-report.md
   - Identify tables and relationships
   - Note critical findings

2. **Analyze V1 Models** (60 min)
   - Read tongkho_v1/models/db.py
   - Extract table definitions
   - Document field types and constraints
   - Map foreign key relationships

3. **Analyze SQL Migrations** (30 min)
   - Read create_post_office_tables.sql
   - Extract additional tables
   - Document triggers and constraints

4. **Create Domain Groups** (30 min)
   - Group tables by domain
   - Write domain descriptions
   - Document table purposes

5. **Document Relationships** (45 min)
   - Create ERD in markdown
   - Document FK relationships
   - Identify cascade rules

6. **Document Business Rules** (30 min)
   - Extract check constraints
   - Document enum values
   - List status meanings

7. **Document Audit Pattern** (15 min)
   - Describe standard audit fields
   - Explain trigger mechanism
   - List exceptions

8. **Create Schema Reference** (30 min)
   - Write docs/v1-database-schema.md
   - Organize by domain
   - Add cross-references

9. **Quality Check** (20 min)
   - Verify completeness
   - Check LOC limit
   - Review cross-references

## Todo List

- [ ] Read research report and V1 models
- [ ] Extract all table definitions
- [ ] Document field types and constraints
- [ ] Map foreign key relationships
- [ ] Create ERD diagram in markdown
- [ ] Group tables by domain
- [ ] Document business rules and constraints
- [ ] Document audit trail pattern
- [ ] Write v1-database-schema.md
- [ ] Verify documentation quality

## Success Criteria

- All 57 tables documented
- Relationships mapped with ERD
- Business rules extracted
- Audit pattern documented
- Documentation under 800 LOC
- Cross-references accurate
- Ready for Phase 2

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Incomplete model definitions | Medium | Document from SQL migrations |
| Complex relationships | Low | Use ERD notation, add examples |
| Documentation too large | Low | Split by domain if needed |

## Security Considerations

- Document sensitive fields (passwords, keys)
- Note PII data (user info, locations)
- Identify fields requiring encryption
- Document access control patterns

## Next Steps

After completing Phase 1:
1. Proceed to Phase 2: Elasticsearch schema
2. Use database schema as reference
3. Map DB-to-ES field mappings
4. Identify data sync patterns
