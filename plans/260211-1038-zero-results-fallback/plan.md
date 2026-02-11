# Zero Results Fallback & Suggestions Implementation

**Plan Created:** 2026-02-11 10:38 AM
**Updated:** 2026-02-11 10:53 AM
**Branch:** listing72
**Status:** Planning Complete

## Overview

Implement intelligent fallback suggestions when property search returns zero results, matching v1 behavior. When users apply filters that yield no results, progressively relax search criteria to show relevant alternatives.

## Context

**v1 Behavior:**
- Displays "Không có kết quả phù hợp" message
- Shows "Gợi ý cho bạn" section with **relaxed search results** (NOT featured projects)
- 3-tier relaxation: Keep location → Expand to city → Go nationwide
- Transparent to user (doesn't explicitly mention relaxed filters)

**v2 Current State:**
- Only shows simple empty state message: "Không tìm thấy kết quả"
- No fallback suggestions
- No filter relaxation logic
- Data already available for optimization

## Goals

1. ✅ **v1 Parity**: Match v1's intelligent filter relaxation behavior
2. ✅ **User Experience**: Show relevant alternatives, never blank page
3. ✅ **SEO Value**: Keep users engaged, reduce bounce rate
4. ✅ **Performance**: Optimize with caching, < 300ms total

## Research Reports

- [v1 Zero Results Fallback Analysis](./research/researcher-260211-1038-v1-zero-results-fallback.md)
- [v2 Current Listing Implementation](./reports/scout-260211-1038-v2-listing-current-state.md)

## Implementation Phases

| Phase | Description | Status | Complexity |
|-------|-------------|--------|------------|
| [Phase 1](./phase-01-filter-relaxation-service.md) | Filter relaxation service + Level 1 fallback | 📋 Planned | Medium |
| [Phase 2](./phase-02-three-tier-fallback-strategy.md) | 3-tier fallback strategy (v1 logic) | 📋 Planned | High |
| [Phase 3](./phase-03-polish-analytics-testing.md) | Polish UI/UX, analytics, testing | 📋 Planned | Medium |

## Success Criteria

- [ ] Zero results executes relaxed search (matches v1)
- [ ] Fallback follows v1's 3-tier relaxation strategy
- [ ] UI clearly shows "Gợi ý cho bạn" with relevant results
- [ ] No performance degradation (< 100ms overhead per fallback)
- [ ] Mobile responsive fallback UI
- [ ] Analytics track zero results events
- [ ] Tests cover all fallback scenarios

## Key Technical Decisions

1. **Approach:** 3 phases (removed featured projects shortcut)
2. **Phase 1:** Implement v1's filter relaxation logic (Level 1)
3. **Phase 2:** Complete 3-tier fallback (Levels 2-3)
4. **Phase 3:** Polish, analytics, and optimize
5. **No shortcuts:** Implement TRUE v1 logic from start

## Dependencies

- ElasticSearch query builder (`src/services/elasticsearch/query-builder.ts`)
- Property search service (`src/services/elasticsearch/property-search-service.ts`)
- Listing page routing (`src/pages/[...slug].astro`)
- Listing grid component (`src/components/listing/listing-grid.astro`)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Complex filter combinations | High | Unit test all relaxation paths |
| Performance on fallback search | Medium | Cache results, limit retries |
| UX confusion (original vs fallback) | Medium | Clear messaging, visual separation |
| Mobile layout for suggestions | Low | Responsive design, test early |

## Timeline Estimate

- **Phase 1**: 2-3 days (filter relaxation + Level 1)
- **Phase 2**: 2-3 days (Levels 2-3 expansion)
- **Phase 3**: 2-3 days (polish + analytics)
- **Total**: 6-9 days for complete v1 parity

## Next Steps

1. Review and approve updated plan
2. Start with Phase 1 (filter relaxation service)
3. Implement Level 1 fallback with true v1 logic
4. Test thoroughly before moving to Phase 2
