# Phase 2: Utility Sidebar Component

## Overview
- **Priority**: High
- **Status**: Pending
- **Effort**: 0.5h

## Context Links
- [Code standards - components](../../docs/code-standards-components.md)
- [Existing sidebar patterns](../../src/components/listing/sidebar/)

## Key Insights

### v1 Sidebar Behavior
- Vertical list of utility names
- Active utility highlighted
- Click navigates to `/tienich/{slug}`
- "So sánh bất động sản" always first

### Styling (match v2 design)
- White background card
- Orange highlight for active
- Hover states
- Mobile: collapsible or horizontal scroll

## Requirements

### Functional
- Display all utilities from API
- Highlight current utility (active state)
- Navigate on click
- Handle empty state

### Non-Functional
- Static rendering (no hydration)
- Accessible links
- Mobile responsive

## Related Code Files

### Files to Create
1. `src/components/utility/utility-sidebar.astro`

### Files to Reference
- `src/components/listing/sidebar/sidebar-wrapper.astro`

## Implementation Steps

### Step 1: Create utility-sidebar.astro

```astro
---
/**
 * Utility Sidebar - Navigation menu for utilities page
 *
 * @example
 * <UtilitySidebar utilities={utilities} currentSlug="tu-van-tuoi-xay-nha" />
 *
 * @prop utilities - Array of utility items
 * @prop currentSlug - Currently active utility slug
 */
import type { Utility } from '@/services/utility/types';

interface Props {
  utilities: Utility[];
  currentSlug: string;
}

const { utilities, currentSlug } = Astro.props;
---

<aside class="bg-white rounded-lg shadow-sm overflow-hidden">
  <h2 class="px-4 py-3 bg-slate-50 text-slate-800 font-semibold border-b border-slate-100">
    Tiện ích
  </h2>

  <nav class="divide-y divide-slate-100">
    {utilities.length === 0 ? (
      <p class="px-4 py-3 text-slate-500 text-sm">
        Không có tiện ích nào.
      </p>
    ) : (
      utilities.map((utility) => {
        const isActive = utility.slug === currentSlug;
        return (
          <a
            href={`/tienich/${utility.slug}`}
            class:list={[
              'block px-4 py-3 text-sm transition-colors',
              isActive
                ? 'bg-orange-50 text-orange-600 font-medium border-l-4 border-orange-500'
                : 'text-slate-700 hover:bg-slate-50 hover:text-orange-500',
            ]}
          >
            {utility.name}
          </a>
        );
      })
    )}
  </nav>
</aside>
```

### Step 2: Add icons (optional enhancement)

If utilities have icons in API response:

```astro
<a href={`/tienich/${utility.slug}`} class="...">
  {utility.icon && (
    <span class="mr-2">{utility.icon}</span>
  )}
  {utility.name}
</a>
```

## Todo List

- [ ] Create `src/components/utility/` directory
- [ ] Create `utility-sidebar.astro`
- [ ] Test with mock data
- [ ] Verify active state styling
- [ ] Test mobile responsiveness

## Success Criteria

- [ ] Renders utility list correctly
- [ ] Active utility highlighted
- [ ] Links navigate properly
- [ ] Accessible navigation
- [ ] Mobile responsive (stack or scroll)

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Empty utilities | Show "no utilities" message |
| Long utility names | Text truncation with title tooltip |

## Next Steps

Proceed to phase-03-dynamic-form.md
