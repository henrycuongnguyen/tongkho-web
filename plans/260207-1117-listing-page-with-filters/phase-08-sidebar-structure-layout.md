# Phase 8: Sidebar Structure & Layout

## Context Links
- **Plan:** [plan.md](./plan.md)
- **V1 Reference:** `reference/resaland_v1/views/bds/danhmuc.html` (lines 389-468)
- **V1 Sidebar:** `reference/resaland_v1/views/bds/components/sidebar-filters.html`

## Overview
**Priority:** Medium
**Status:** Pending
**Dependencies:** Phase 1 (ES Service), Phase 2 (Location Data)

Implement the right sidebar structure and layout for the listing page with sticky positioning and responsive behavior.

## Key Insights

From v1 analysis:
- Sidebar uses `col-lg-3` (25% width on large screens)
- Main content uses `col-lg-9` (75% width)
- Sidebar contains multiple card sections stacked vertically
- Each card has consistent spacing (`mt-20`, `mb-20`)
- Uses lazy loading for some components (`ajax=True`)
- Sticky positioning for sidebar on scroll

## Requirements

### Functional Requirements
- Sidebar layout with 25% width on desktop
- Stack vertically on mobile (100% width)
- Sticky positioning (top offset ~100px for header)
- Smooth scrolling behavior
- Consistent card spacing (20px gap)

### Non-functional Requirements
- Responsive: Desktop (sidebar right), Mobile (sidebar bottom/collapsible)
- Performance: Lazy load non-critical cards
- Accessibility: Proper ARIA labels for sidebar navigation
- SEO: Sidebar content should be crawlable

## Architecture

```typescript
// src/layouts/listing-with-sidebar.astro
interface SidebarProps {
  children: any;
  sticky?: boolean;
  topOffset?: number;
}

// Sidebar layout component with slots
// - slot="main" → main content area
// - slot="sidebar" → sidebar content
```

## Related Code Files

### Files to Create
- `src/layouts/listing-with-sidebar.astro` - Main layout with sidebar
- `src/components/listing/sidebar/sidebar-wrapper.astro` - Sidebar container
- `src/styles/listing-sidebar.css` - Sidebar-specific styles

### Files to Modify
- `src/pages/[...slug].astro` - Use new sidebar layout

## Implementation Steps

1. **Create Sidebar Layout Component**
   ```astro
   // src/layouts/listing-with-sidebar.astro
   - Create 2-column layout (9:3 ratio)
   - Add responsive breakpoints
   - Implement sticky positioning
   - Add slot areas for main + sidebar
   ```

2. **Create Sidebar Wrapper Component**
   ```astro
   // src/components/listing/sidebar/sidebar-wrapper.astro
   - Container for sidebar cards
   - Consistent spacing between cards
   - Lazy loading support
   - Mobile collapse/expand behavior
   ```

3. **Add Sidebar Styles**
   ```css
   // src/styles/listing-sidebar.css
   - Desktop sticky positioning
   - Mobile stacking layout
   - Card spacing utilities
   - Smooth scroll behavior
   ```

4. **Update Listing Page**
   ```astro
   // src/pages/[...slug].astro
   - Wrap content with ListingWithSidebarLayout
   - Add sidebar slot with placeholder
   - Test responsive behavior
   ```

## Todo List

- [ ] Create `listing-with-sidebar.astro` layout
- [ ] Create `sidebar-wrapper.astro` component
- [ ] Add sidebar CSS with sticky positioning
- [ ] Update `[...slug].astro` to use sidebar layout
- [ ] Test desktop sticky behavior
- [ ] Test mobile responsive stacking
- [ ] Add smooth scroll for sidebar links
- [ ] Verify accessibility (ARIA labels)

## Success Criteria

- ✅ Sidebar displays at 25% width on desktop (>= 1024px)
- ✅ Sidebar stacks below content on mobile (< 1024px)
- ✅ Sticky positioning works on scroll (desktop only)
- ✅ Consistent 20px spacing between sidebar cards
- ✅ Smooth scroll behavior when clicking sidebar filters
- ✅ Mobile sidebar collapsible/expandable
- ✅ No layout shift during page load
- ✅ Passes accessibility audit (WCAG AA)

## Risk Assessment

**Low Risk:**
- Standard CSS Grid/Flexbox layout
- Well-established sticky positioning pattern
- Similar to v1 implementation

**Mitigation:**
- Test on multiple browsers (Chrome, Firefox, Safari)
- Use CSS feature detection for sticky support
- Fallback to static positioning on older browsers

## Security Considerations

- No user input in this phase
- Static layout structure
- No XSS risks

## Next Steps

After sidebar layout is complete:
- **Phase 9:** Implement Quick Contact Banner
- **Phase 10:** Implement Price Range Filter Card
- **Phase 11:** Implement Area Filter Card
