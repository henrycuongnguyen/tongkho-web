---
phase: 3
title: "Analyze Data Flow"
status: pending
effort: 3h
priority: P1
---

# Phase 3: Analyze Data Flow

## Context Links

- Parent Plan: [plan.md](plan.md)
- Previous Phases:
  - [phase-01-document-database-schema.md](phase-01-document-database-schema.md)
  - [phase-02-document-elasticsearch-schema.md](phase-02-document-elasticsearch-schema.md)
- Target Doc: [docs/v1-data-flow.md](../../docs/v1-data-flow.md)

## Overview

**Date:** 2026-02-06
**Description:** Map complete data flow from database to Elasticsearch, including sync mechanisms, transformations, and consistency strategies
**Priority:** P1 - Critical
**Implementation Status:** Not started
**Review Status:** Not reviewed

## Key Insights

From research:
- Real-time sync: DB creation → process_real_estate_batch()
- Batch sync: 2000-20000 records with parallel workers
- LocationHandler: String location IDs with migration support
- No explicit fallback mechanism
- Computed fields: created_time_updated (UTC+7)

## Requirements

### Functional Requirements

1. **Sync Flow Mapping**
   - Document DB → ES data flow
   - Map real-time sync triggers
   - Document batch sync processes
   - Identify sync timing and frequency

2. **Data Transformation**
   - Map DB fields to ES fields
   - Document computed fields
   - Identify data enrichment
   - Note location ID expansion

3. **Consistency Mechanisms**
   - Document eventual consistency model
   - Identify conflict resolution
   - Note retry logic
   - Document error handling

4. **Performance Patterns**
   - Batch sizes and optimization
   - Parallel worker configuration
   - Index refresh strategies
   - Query performance patterns

### Non-Functional Requirements

- Clear flow diagrams (text-based)
- Document failure scenarios
- Identify bottlenecks
- Performance recommendations

## Architecture

### Data Flow Overview

```
Database (PostgreSQL)
    ↓
[Create/Update Operation]
    ↓
process_real_estate_batch()
├── Generate real_estate_code
├── Transform data
│   ├── Location expansion (city/district/ward)
│   ├── Compute created_time_updated
│   └── Parse latlng to geo_point
└── Index to Elasticsearch
    ↓
Elasticsearch Index
├── real_estate
└── project
```

### Sync Patterns

**Real-Time Sync:**
```
DB INSERT/UPDATE → Trigger → Batch Processor → ES Index
```

**Batch Sync:**
```
Scheduler → LocationHandler → Worker Pool → ES Bulk Index
```

### Field Mapping

```
DB Field              → ES Field
-----------------------------------------
real_estate.id        → _id
real_estate.city      → city_id (expanded)
real_estate.price     → price (number)
real_estate.latitude  → latlng_parsed.lat
real_estate.longitude → latlng_parsed.lon
real_estate.created   → created_time_updated (UTC+7)
```

## Related Code Files

### Source Files to Analyze

- Previous phase docs
- Research reports
- Python sync code patterns

### Target Documentation

- `docs/v1-data-flow.md` (create new)
- `docs/system-architecture.md` (update)

## Implementation Steps

1. **Review Previous Phases** (20 min)
   - Read DB schema doc
   - Read ES schema doc
   - Identify sync points

2. **Map Real-Time Sync** (45 min)
   - Document trigger points
   - Map process_real_estate_batch() flow
   - Identify real_estate_code generation
   - Document immediate indexing

3. **Map Batch Sync** (45 min)
   - Document batch processes
   - Map LocationHandler role
   - Note batch sizes (2000-20000)
   - Document parallel workers

4. **Document Field Transformations** (40 min)
   - Map DB→ES field mappings
   - Document computed fields
   - Explain location expansion
   - Note geo_point parsing

5. **Analyze Consistency** (30 min)
   - Document eventual consistency
   - Identify conflict scenarios
   - Note retry mechanisms
   - Document error handling

6. **Document Performance** (25 min)
   - Note optimization patterns
   - Document bottlenecks
   - Recommend improvements
   - List monitoring needs

7. **Identify Failure Scenarios** (20 min)
   - ES unavailable
   - Batch sync failure
   - Data inconsistency
   - Network issues

8. **Create Flow Diagrams** (30 min)
   - Text-based diagrams
   - Sync flow visualization
   - Transformation pipeline
   - Error handling flow

9. **Write Documentation** (40 min)
   - Create v1-data-flow.md
   - Organize by sync type
   - Add diagrams
   - Include recommendations

10. **Quality Review** (15 min)
    - Verify completeness
    - Check clarity
    - Validate diagrams

## Todo List

- [ ] Review DB and ES schema docs
- [ ] Map real-time sync flow
- [ ] Map batch sync processes
- [ ] Document field transformations
- [ ] Create field mapping table
- [ ] Analyze consistency mechanisms
- [ ] Document error handling
- [ ] Identify performance patterns
- [ ] Map failure scenarios
- [ ] Create flow diagrams
- [ ] Write v1-data-flow.md
- [ ] Quality review

## Success Criteria

- Complete sync flow documented
- Real-time and batch sync explained
- Field mappings table created
- Consistency model documented
- Performance patterns identified
- Failure scenarios analyzed
- Flow diagrams clear
- Recommendations provided
- Ready for Phase 4

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Incomplete sync details | High | Document known patterns, flag unknowns |
| Complex transformations | Medium | Use examples, step-by-step explanations |
| Missing error handling | Medium | Note as improvement opportunity |

## Security Considerations

- Document data exposure during sync
- Note authentication in pipeline
- Identify PII transformation
- Recommend encryption at rest

## Next Steps

After completing Phase 3:
1. Proceed to Phase 4: Update system architecture
2. Integrate findings into architecture doc
3. Create migration strategy
4. Update codebase summary
