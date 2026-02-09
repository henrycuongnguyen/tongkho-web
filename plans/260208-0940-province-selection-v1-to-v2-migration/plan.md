---
title: "Province Selection v1 to v2 Migration"
description: "Fix province dropdown display and adapt v1 location selection logic to v2 architecture"
status: pending
priority: P1
effort: 3h
branch: listing72
tags: [filter, province, htmx, dropdown, bug-fix]
created: 2026-02-08
---

# Province Selection v1 to v2 Migration

## Overview

Migrate province selection logic from v1 to v2 filter component. The province dropdown exists in v2 but is not displaying correctly when clicked.

## Problem Analysis

### Root Cause Identified

After analyzing `location-selector.astro`, the dropdown toggle logic EXISTS and is correct:

```javascript
provinceTrigger?.addEventListener('click', (e) => {
  e.stopPropagation();
  isOpen = !isOpen;
  provincePanel.classList.toggle('hidden', !isOpen);
  provinceArrow.classList.toggle('rotate-180', isOpen);
});
```

**The issue is likely one of these:**
1. **View Transitions cleanup** - Astro View Transitions may cause event listeners to be lost/duplicated
2. **DOM timing** - Script may run before DOM is ready
3. **Selector scope** - Multiple `.location-selector` instances causing conflicts

### v1 vs v2 Comparison

| Aspect | v1 | v2 (Current) |
|--------|----|----|
| Toggle mechanism | `.show` class on parent | `hidden` class on panel |
| Data loading | AJAX (web2py_component) | SSG + HTMX |
| Province list | Runtime fetch | Build-time (prop) |
| District loading | On province click | HTMX endpoint |
| State persistence | localStorage | URL-based |
| Event handling | Global DOM ready | Inline script |

## Phases

| Phase | Description | Effort | Status |
|-------|-------------|--------|--------|
| [Phase 1](./phase-01-fix-dropdown-display.md) | Fix dropdown display issue | 1.5h | pending |
| [Phase 2](./phase-02-adapt-v1-ux-flow.md) | Adapt v1 UX flow (click → show provinces → select → load districts) | 1.5h | pending |

## Key Files

### Files to Modify
- `src/components/listing/sidebar/location-selector.astro` - Main fix location

### Files for Reference
- `reference/resaland_v1/static/js/module/search.js:734-831` - v1 city/district setup
- `reference/resaland_v1/static/css/styles-update.css:770-900` - v1 CSS toggle patterns

## Dependencies

- Existing HTMX integration (working)
- Districts API endpoint (`/api/location/districts`) (working)
- Province list passed as prop (working)

## Success Criteria

1. Province dropdown shows when clicking the input field
2. Province selection displays selected province name
3. District panel loads districts via HTMX after province selection
4. URL navigation works correctly (existing behavior preserved)
5. No infinite reload loops (follows code-standards.md patterns)
6. Works with Astro View Transitions

## Risks

| Risk | Mitigation |
|------|------------|
| View Transitions breaking event listeners | Use `astro:page-load` event instead of DOMContentLoaded |
| Multiple component instances on page | Use unique data-* attributes for scoping |
| HTMX timing issues | Use `hx-trigger="load once"` pattern from MEMORY.md |

## Architecture Decisions

1. **Keep URL-based navigation** - v2 uses URL changes instead of localStorage (SSG-compatible)
2. **Keep HTMX for districts** - Already working, no need to change
3. **Fix client-side toggle only** - Minimal change to fix display issue
4. **Use Astro View Transition hooks** - Ensure event listeners survive navigation

## Related Documentation

- [MEMORY.md](../../.claude/projects/d--tongkho-web/memory/MEMORY.md) - Province filter fixes, infinite loop prevention
- [code-standards.md](../../docs/code-standards.md) - Navigation safety patterns
