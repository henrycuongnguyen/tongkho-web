# Design Guidelines

**Last Updated:** 2026-02-09
**Project:** tongkho-web (Tongkho BDS)

## Z-Index Layering System

Consistent z-index hierarchy prevents visual conflicts and ensures proper stacking order.

### Standard Z-Index Layers

| Layer | Z-Index Range | Usage | Examples |
|-------|---------------|-------|----------|
| **Base Content** | 1-9 | Normal page content, default stacking | Article text, images, cards |
| **UI Elements** | 10-49 | Interactive components, dropdowns (local) | Tooltips, inline dropdowns |
| **Navigation** | 50-59 | Fixed/sticky headers, footers | Header (z-50) |
| **Search/Filters** | 60-69 | Search bars, filter panels | Horizontal search bar (z-60) |
| **Dropdown Panels** | 100-999 | Major dropdown menus, panels | Province selector, property filters (z-99999)* |
| **Overlays** | 1000-1999 | Modal backdrops, overlays | — |
| **Modals** | 2000-2999 | Modal dialogs, lightboxes | — |
| **Toast/Alerts** | 3000-3999 | Toast notifications, alerts | — |
| **Critical UI** | 4000+ | Critical system UI (use sparingly) | Debug tools |

*Note: Current dropdowns use `z-[99999]` for legacy compatibility. Future refactor should normalize to 100-999 range.

### Stacking Context Rules

**Critical Concepts:**

1. **Creating Stacking Context:**
   - `position: relative/absolute/fixed` + `z-index` value
   - `opacity < 1`
   - `transform`, `filter`, `will-change`, etc.

2. **Context Constraints:**
   - Children with high z-index CANNOT escape parent's stacking context
   - Example: Parent `z-50` with child `z-999999` - child still below external element with `z-51`

3. **DOM Order Matters:**
   - Elements at same z-index level stack by source order
   - Later elements appear above earlier elements

### Current Implementation

**Header:**
```html
<header class="fixed top-0 z-50">
```

**Search Bar:**
```html
<div class="horizontal-search-bar relative z-[60]">
```

**Dropdown Panels:**
```html
<div class="dropdown-panel absolute z-[99999]">
```

**Reasoning:**
- Header: `z-50` (fixed navigation baseline)
- Search Bar: `z-60` (above header to allow dropdown escape)
- Dropdowns: `z-[99999]` (within search bar context, effectively above header)

### Best Practices

1. **Use Semantic Values:** Prefer layered ranges (50, 60, 100) over arbitrary high numbers (9999)
2. **Document Conflicts:** When z-index issues occur, check parent stacking contexts first
3. **Minimize Contexts:** Avoid creating unnecessary stacking contexts
4. **Test Across Pages:** Verify z-index changes don't break other components

## Typography

*To be documented*

## Color System

*To be documented*

## Spacing & Layout

*To be documented*

## Components

*To be documented*

## Responsive Design

*To be documented*

## Accessibility

*To be documented*

---

**See Also:**
- `./code-standards.md` - Code quality standards
- `./system-architecture.md` - Technical architecture
