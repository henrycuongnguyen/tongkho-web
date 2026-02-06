---
phase: 4
title: "Update System Architecture Documentation"
status: pending
effort: 3h
priority: P2
---

# Phase 4: Update System Architecture Documentation

## Context Links

- Parent Plan: [plan.md](plan.md)
- Previous Phases:
  - [phase-01-document-database-schema.md](phase-01-document-database-schema.md)
  - [phase-02-document-elasticsearch-schema.md](phase-02-document-elasticsearch-schema.md)
  - [phase-03-analyze-data-flow.md](phase-03-analyze-data-flow.md)
- Target Doc: [docs/system-architecture.md](../../docs/system-architecture.md)
- Current Architecture: [docs/system-architecture.md](../../docs/system-architecture.md)

## Overview

**Date:** 2026-02-06
**Description:** Update system-architecture.md with V1 schema insights, comparing V1 vs V2 approaches and documenting migration strategy
**Priority:** P2 - High
**Implementation Status:** Not started
**Review Status:** Not reviewed

## Key Insights

V1 Architecture Insights:
- 3-tier: Web2py → PostgreSQL → Elasticsearch
- Office hierarchy: 5-level structure
- Real-time + batch sync patterns
- Permission system: Role-based ACL
- Geographic scoping for offices

V2 Architecture (Current):
- Static site: Astro → Mock Data
- No backend yet
- Planning migration strategy

## Requirements

### Functional Requirements

1. **V1 Architecture Section**
   - Add "V1 Architecture Overview" section
   - Document 3-tier structure
   - Explain data flow
   - Note key components

2. **Database Layer Documentation**
   - Add V1 database architecture
   - Document domain structure
   - Explain audit patterns
   - Note PostgreSQL features

3. **Search Layer Documentation**
   - Add Elasticsearch architecture
   - Document index structure
   - Explain sync mechanisms
   - Note search patterns

4. **Migration Strategy**
   - Compare V1 vs V2 approaches
   - Identify reusable patterns
   - Document differences
   - Recommend migration path

### Non-Functional Requirements

- Maintain existing structure
- Keep file under 800 LOC
- Add version history entry
- Cross-reference new docs

## Architecture

### Updated Document Structure

```
system-architecture.md
├── [Existing V2 Content]
│   ├── High-Level Overview
│   ├── Technology Stack
│   ├── Project Structure
│   └── ...
├── [NEW] V1 Architecture (Legacy)
│   ├── Overview
│   ├── Technology Stack
│   ├── Database Layer
│   ├── Search Layer
│   └── Data Flow
├── [NEW] V1 vs V2 Comparison
│   ├── Architecture Differences
│   ├── Data Models
│   └── Technology Choices
└── [NEW] Migration Considerations
    ├── Reusable Patterns
    ├── Breaking Changes
    └── Phased Approach
```

### V1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│              TongKho V1 Architecture (Legacy)            │
└─────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                    Users (Browser)                        │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│                    Web2py Application                     │
│  ├── Controllers (Python)                                │
│  ├── Models (PyDAL ORM)                                  │
│  └── Views (HTML Templates)                              │
└──────────────────────────────────────────────────────────┘
            ↓                           ↓
┌─────────────────────────┐   ┌─────────────────────────┐
│   PostgreSQL Database    │   │    Elasticsearch        │
│   (57 tables, 6 domains) │   │    (2 indexes)          │
│   ├── Real Estate        │   │    ├── real_estate      │
│   ├── Office             │   │    └── project          │
│   ├── User               │◄──┤                         │
│   ├── Permission         │   │    [Sync: Real-time     │
│   ├── Messaging          │   │     + Batch]            │
│   └── Financial          │   │                         │
└─────────────────────────┘   └─────────────────────────┘
```

## Related Code Files

### Source Files to Analyze

- Previous phase documentation
- Current system-architecture.md
- V1 schema docs

### Target Documentation

- `docs/system-architecture.md` (update)

## Implementation Steps

1. **Read Existing Architecture** (15 min)
   - Review current system-architecture.md
   - Identify insertion points
   - Plan document structure

2. **Read Previous Phase Docs** (20 min)
   - Review DB schema doc
   - Review ES schema doc
   - Review data flow doc

3. **Draft V1 Architecture Section** (45 min)
   - Write overview
   - Document technology stack
   - Add architecture diagram
   - Explain components

4. **Document Database Layer** (30 min)
   - Summarize V1 database
   - Highlight key domains
   - Explain audit patterns
   - Note PostgreSQL features

5. **Document Search Layer** (30 min)
   - Summarize ES architecture
   - Explain index structure
   - Document sync mechanisms
   - Note search capabilities

6. **Create Comparison Section** (40 min)
   - Compare V1 vs V2 architectures
   - Highlight differences
   - Note pros/cons
   - Document data models

7. **Write Migration Strategy** (35 min)
   - Identify reusable patterns
   - Document breaking changes
   - Recommend phased approach
   - List migration priorities

8. **Add Cross-References** (15 min)
   - Link to v1-database-schema.md
   - Link to v1-elasticsearch-schema.md
   - Link to v1-data-flow.md
   - Update navigation

9. **Update Version History** (10 min)
   - Add document version entry
   - Note changes made
   - Update last modified date

10. **Quality Review** (20 min)
    - Verify LOC limit
    - Check cross-references
    - Validate diagrams
    - Ensure consistency

## Todo List

- [ ] Read current system-architecture.md
- [ ] Review all previous phase docs
- [ ] Draft V1 Architecture section
- [ ] Add V1 technology stack
- [ ] Create V1 architecture diagram
- [ ] Document database layer summary
- [ ] Document search layer summary
- [ ] Write V1 vs V2 comparison
- [ ] Document data model differences
- [ ] Create migration strategy section
- [ ] Add cross-references
- [ ] Update version history
- [ ] Quality review

## Success Criteria

- V1 architecture documented
- V1 vs V2 comparison complete
- Migration strategy provided
- Cross-references accurate
- Document under 800 LOC
- Version history updated
- Ready for Phase 5

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Document too large | Medium | Summarize, link to details |
| V1/V2 comparison unclear | Low | Use tables, diagrams |
| Migration strategy incomplete | Low | Focus on high-level approach |

## Security Considerations

- Compare V1 vs V2 security models
- Note credential management differences
- Document access control changes
- Highlight security improvements in V2

## Next Steps

After completing Phase 4:
1. Proceed to Phase 5: Create schema reference
2. Consolidate all findings
3. Create comprehensive V1 reference
4. Document unresolved questions
