---
title: "Refactor Reusable Components"
description: "Consolidate duplicate dropdown components and add JSDoc documentation standards"
status: completed
priority: P2
effort: 5h
branch: main
tags: [refactor, components, documentation, DRY]
created: 2026-01-30
---

# Refactor Reusable Components Plan

## Summary

Consolidate 95%+ duplicate `price-range-dropdown` and `area-range-dropdown` into single generic `range-slider-dropdown.astro`, and establish JSDoc documentation standards across components.

## Analysis Findings

| Component | LOC | Pattern | Action |
|-----------|-----|---------|--------|
| price-range-dropdown.astro | 295 | Slider + quick picks | **Merge** |
| area-range-dropdown.astro | 292 | Slider + quick picks | **Merge** |
| property-type-dropdown.astro | 298 | Multi-select checkboxes | Keep as-is |
| location-dropdown.astro | 286 | Grid + list hybrid | Keep as-is |
| share-buttons.astro | 266 | Variant props (good pattern) | Reference pattern |

## Phases

| # | Phase | Status | Effort | File |
|---|-------|--------|--------|------|
| 1 | [Consolidate Dropdown Components](./phase-01-consolidate-dropdown-components.md) | completed | 2h | range-slider-dropdown.astro |
| 2 | [Add JSDoc Documentation](./phase-02-add-jsdoc-documentation.md) | completed | 2h | ALL component directories |
| 3 | [Update Documentation Standards](./phase-03-update-documentation-standards.md) | completed | 1h | docs/code-standards.md |

## Key Dependencies

- Phase 2 depends on Phase 1 (document new component)
- Phase 3 can run in parallel with Phase 2

## Success Criteria

- [x] Single `range-slider-dropdown.astro` replaces both price/area dropdowns
- [x] All ui/ and cards/ components have JSDoc comments
- [x] code-standards.md includes component documentation rules

## Notes

- Follow existing `share-buttons.astro` pattern for variant props
- Keep location-dropdown and property-type-dropdown separate (different patterns)
- Card components (team-member, achievement-stat) have distinct structures; no consolidation needed

---

## Validation Summary

**Validated:** 2026-01-30
**Questions asked:** 4

### Confirmed Decisions

| Decision | User Choice |
|----------|-------------|
| Props design | **Hybrid approach**: `type: 'price' \| 'area' \| 'custom'` + optional `formatFn` for custom types |
| Old file cleanup | **Delete immediately** after verification (git history as backup) |
| JSDoc scope | **All components** - expand Phase 2 to include header/, footer/, home/, property/, news/, about/ |

### Action Items (Plan Updates Needed)

- [ ] **Phase 1**: Update Props interface to hybrid design with optional `formatFn` for custom types
- [ ] **Phase 2**: Expand scope to all component directories (estimated +1h effort)
