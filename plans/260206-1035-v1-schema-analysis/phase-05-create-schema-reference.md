---
phase: 5
title: "Create Database Schema Reference"
status: pending
effort: 3h
priority: P2
---

# Phase 5: Create Database Schema Reference

## Context Links

- Parent Plan: [plan.md](plan.md)
- Previous Phases: All phases 1-4
- Target Doc: [docs/v1-schema-reference.md](../../docs/v1-schema-reference.md)

## Overview

**Date:** 2026-02-06
**Description:** Create comprehensive V1 schema reference document consolidating all findings from database, Elasticsearch, and data flow analysis
**Priority:** P2 - High
**Implementation Status:** Not started
**Review Status:** Not reviewed

## Key Insights

Consolidate findings from:
- Database schema (57 tables, 6 domains)
- Elasticsearch schema (2 indexes, 40+ fields)
- Data flow patterns (real-time + batch)
- Migration considerations

## Requirements

### Functional Requirements

1. **Complete Schema Reference**
   - Consolidate all table definitions
   - Include ES index mappings
   - Document field-to-field mappings
   - Provide quick reference tables

2. **Quick Reference Section**
   - Table of contents with anchors
   - Domain summaries
   - Common patterns
   - Key relationships

3. **Migration Guide**
   - V1 to V2 mapping guidelines
   - Breaking changes
   - Deprecated features
   - Recommended replacements

4. **Unresolved Questions**
   - List all flagged questions
   - Categorize by priority
   - Suggest investigation paths
   - Note dependencies

### Non-Functional Requirements

- Searchable structure
- Keep under 800 LOC
- Quick navigation
- Clear examples

## Architecture

### Document Structure

```
v1-schema-reference.md
├── Quick Reference
│   ├── Table of Contents
│   ├── Domain Overview
│   └── Common Patterns
├── Database Schema
│   ├── Real Estate Domain
│   ├── Office Domain
│   ├── User Domain
│   ├── Permission Domain
│   ├── Messaging Domain
│   └── Financial Domain
├── Elasticsearch Schema
│   ├── real_estate Index
│   └── project Index
├── Data Flow Patterns
│   ├── Real-Time Sync
│   ├── Batch Sync
│   └── Field Transformations
├── Migration Guide
│   ├── V1 to V2 Mapping
│   ├── Breaking Changes
│   └── Recommendations
└── Unresolved Questions
    ├── Database Questions
    ├── Elasticsearch Questions
    └── Sync Questions
```

### Quick Reference Tables

**Domain Summary Table:**
| Domain | Tables | Primary Entities | Key Features |
|--------|--------|------------------|--------------|
| Real Estate | 10 | properties, projects | Geographic search, pricing |
| Office | 8 | post_office, staff | 5-level hierarchy, territories |
| ... | ... | ... | ... |

**Field Mapping Table:**
| DB Field | ES Field | Type | Transformation |
|----------|----------|------|----------------|
| real_estate.id | _id | string | direct |
| real_estate.city | city_id | string | location expansion |
| ... | ... | ... | ... |

## Related Code Files

### Source Files to Analyze

- All previous phase documentation
- Research reports
- V1 source code samples

### Target Documentation

- `docs/v1-schema-reference.md` (create new)

## Implementation Steps

1. **Review All Previous Phases** (30 min)
   - Read phase 1-4 docs
   - Extract key findings
   - Identify consolidation points

2. **Create Document Structure** (20 min)
   - Draft table of contents
   - Create section anchors
   - Plan navigation

3. **Write Quick Reference** (40 min)
   - Create domain summary table
   - List common patterns
   - Add quick links
   - Include key statistics

4. **Consolidate Database Schema** (45 min)
   - Summarize each domain
   - List tables with descriptions
   - Highlight key relationships
   - Note important constraints

5. **Consolidate ES Schema** (30 min)
   - Summarize each index
   - List fields with types
   - Document mappings
   - Note search features

6. **Document Data Flow** (30 min)
   - Summarize sync patterns
   - Create field mapping table
   - Document transformations
   - Note performance patterns

7. **Write Migration Guide** (40 min)
   - Map V1 to V2 equivalents
   - Document breaking changes
   - List deprecated features
   - Recommend alternatives

8. **Compile Unresolved Questions** (25 min)
   - Gather from all phases
   - Categorize by domain
   - Prioritize by impact
   - Suggest investigation

9. **Add Cross-References** (15 min)
   - Link to detailed docs
   - Reference code files
   - Add external resources

10. **Final Quality Review** (25 min)
    - Verify completeness
    - Check LOC limit
    - Test navigation
    - Validate examples

## Todo List

- [ ] Review all phase 1-4 documentation
- [ ] Create document structure and TOC
- [ ] Write quick reference section
- [ ] Create domain summary table
- [ ] Consolidate database schema sections
- [ ] Consolidate Elasticsearch schema
- [ ] Create field mapping table
- [ ] Document data flow patterns
- [ ] Write migration guide
- [ ] Compile unresolved questions
- [ ] Add cross-references
- [ ] Final quality review

## Success Criteria

- All findings consolidated
- Quick reference functional
- Domain summaries complete
- Field mappings documented
- Migration guide provided
- Unresolved questions listed
- Navigation clear
- Document under 800 LOC
- Ready for use

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Document too large | Medium | Focus on summaries, link to details |
| Information overload | Low | Strong organization, clear sections |
| Missing critical info | Low | Review all previous phases carefully |

## Security Considerations

- Summarize security issues from V1
- Highlight credential management
- Note PII handling
- Document access control

## Next Steps

After completing Phase 5:
1. All phases complete
2. Documentation ready for team review
3. Begin V2 implementation planning
4. Schedule knowledge transfer sessions
