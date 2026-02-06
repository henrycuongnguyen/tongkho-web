---
phase: 2
title: "Document Elasticsearch Schema"
status: pending
effort: 4h
priority: P1
updated: 2026-02-06
---

# Phase 2: Document Elasticsearch Schema

## Context Links

- Parent Plan: [plan.md](plan.md)
- Research Report: [researcher-elasticsearch-schema-report.md](research/researcher-elasticsearch-schema-report.md)
- Previous Phase: [phase-01-document-database-schema.md](phase-01-document-database-schema.md)
- Target Doc: [docs/v1-elasticsearch-schema.md](../../docs/v1-elasticsearch-schema.md)

## Overview

**Date:** 2026-02-06
**Description:** Document V1 Elasticsearch implementation including index mappings, field types, analyzers, and search query patterns
**Priority:** P1 - Critical
**Implementation Status:** Not started
**Review Status:** Not reviewed
**Update:** Added locations index (discovered 2026-02-06)

## Key Insights

From research report + code analysis:
- **3-index architecture**: real_estate, project, **locations**
- 40+ indexed fields per index
- Geo-distance search with dynamic zoom levels
- Real-time + batch sync patterns
- Hardcoded API credentials (security risk)
- No ES fallback strategy found
- Locations index used for geographic autocomplete (cities, districts, wards, streets)

## Requirements

### Functional Requirements

1. **Index Documentation**
   - Document real_estate index structure
   - Document project index structure
   - **Document locations index structure**
   - Map field types and properties
   - Document special fields (geo_point, computed)

2. **Mapping Analysis**
   - Field type mappings (text, keyword, geo_point, etc.)
   - Analyzer configuration
   - Index settings
   - Field properties (searchable, aggregatable)

3. **Search Query Patterns**
   - Document dynamic query builder
   - Geo-distance queries
   - Boolean logic (must/should/filter)
   - Featured content logic

4. **Sync Mechanism Documentation**
   - Real-time sync patterns
   - Batch sync processes
   - Data transformation logic
   - Error handling

### Non-Functional Requirements

- Documentation under 800 LOC
- Include query examples
- Document performance considerations
- Highlight security issues

## Architecture

### Index Structure

```
Elasticsearch V1
├── real_estate index
│   ├── Mappings (40+ fields)
│   │   ├── Location fields (city_id, district_id, ward_id)
│   │   ├── Pricing fields (price, price_from, price_to)
│   │   ├── Physical attributes (area, bedrooms, etc.)
│   │   ├── Geo fields (latlng_parsed: geo_point)
│   │   └── Meta fields (created_time_updated, aactive)
│   └── Settings
│       ├── Analyzers
│       ├── Tokenizers
│       └── Filters
├── project index
│   ├── Mappings (similar structure)
│   └── Settings
└── locations index
    ├── Mappings
    │   ├── n_name (location name)
    │   ├── n_slug (URL slug)
    │   ├── n_level (Street/District/City/Ward)
    │   ├── n_parentid (hierarchical reference)
    │   ├── n_normalizedname (search optimization)
    │   └── Location IDs (city_id, district_id, ward_id)
    └── Settings (autocomplete optimization)
```

### Query Flow

```
User Search Request
    ↓
Dynamic Query Builder
    ↓
Boolean Query Construction
├── must clauses (required filters)
├── should clauses (relevance boosting)
└── filter clauses (post-filter)
    ↓
Geo-Distance Filter (if location-based)
    ↓
Featured Content Logic
    ↓
Execute Search
    ↓
Return Results
```

## Related Code Files

### Source Files to Analyze

- Research report: `research/researcher-elasticsearch-schema-report.md`
- Python ES code: `tongkho_v1/controllers/*elastic*.py`
- Config files: `tongkho_v1/**/*elastic*.json`

### Target Documentation

- `docs/v1-elasticsearch-schema.md` (create new)
- `docs/system-architecture.md` (update)

## Implementation Steps

1. **Read Research Report** (15 min)
   - Review elasticsearch findings
   - Note index structures
   - Identify query patterns

2. **Extract Index Mappings** (60 min)
   - Document real_estate index fields
   - Document project index fields
   - **Document locations index fields**
   - Map field types
   - Document special fields

3. **Analyze Field Properties** (30 min)
   - Identify searchable fields
   - Document aggregatable fields
   - Note geo_point configuration
   - Document computed fields

4. **Document Analyzers** (30 min)
   - Extract analyzer configuration
   - Document tokenizers
   - List filters
   - Document language-specific settings

5. **Extract Query Patterns** (45 min)
   - Document dynamic query builder
   - Extract geo-distance queries
   - Document boolean logic
   - Note featured content logic

6. **Document Sync Mechanisms** (30 min)
   - Map real-time sync flow
   - Document batch sync process
   - Identify data transformation
   - Note LocationHandler role

7. **Identify Issues** (15 min)
   - Document hardcoded credentials
   - Note missing fallback
   - List performance concerns
   - Flag security risks

8. **Write Documentation** (40 min)
   - Create v1-elasticsearch-schema.md
   - Organize by sections
   - Add query examples
   - Include unresolved questions

9. **Quality Review** (20 min)
   - Verify completeness
   - Check LOC limit
   - Validate examples

## Todo List

- [ ] Read ES research report
- [ ] Extract real_estate index mappings
- [ ] Extract project index mappings
- [ ] **Extract locations index mappings**
- [ ] **Document locations index fields (n_name, n_slug, n_level, etc.)**
- [ ] **Analyze locations + project combined search pattern**
- [ ] Document field types and properties
- [ ] Document analyzers and tokenizers
- [ ] Extract search query patterns
- [ ] Document geo-distance queries
- [ ] Map data sync mechanisms
- [ ] Identify security and performance issues
- [ ] Write v1-elasticsearch-schema.md
- [ ] Quality review

## Success Criteria

- **All 3 indexes fully documented** (real_estate, project, locations)
- Field mappings complete for each index
- **Locations index autocomplete logic documented**
- **Combined search patterns explained** (locations,project)
- Query patterns explained with examples
- Sync mechanisms mapped
- Security issues highlighted
- Documentation under 800 LOC
- Unresolved questions listed
- Ready for Phase 3

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Incomplete ES config | Medium | Document from Python code |
| Unknown ES version | Low | Note as unresolved question |
| Missing sync details | Medium | Document known patterns, flag gaps |

## Security Considerations

- **Critical:** Hardcoded API credentials in source
- ES cluster exposed without circuit breaker
- No authentication beyond ApiKey
- Recommend credential vault
- Implement connection pooling

## Next Steps

After completing Phase 2:
1. Proceed to Phase 3: Data flow analysis
2. Map DB-to-ES field transformations
3. Document sync triggers
4. Identify consistency mechanisms
