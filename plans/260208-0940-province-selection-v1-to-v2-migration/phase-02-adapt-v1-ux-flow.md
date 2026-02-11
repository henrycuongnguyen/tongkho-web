# Phase 2: Adapt v1 UX Flow

## Context Links
- [location-selector.astro](../../src/components/listing/sidebar/location-selector.astro)
- [v1 search.js](../../reference/resaland_v1/static/js/module/search.js) - setupCityField (734-831), setupDistrictField (906-950)
- [v1 CSS styles](../../reference/resaland_v1/static/css/styles-update.css) - Lines 770-900
- [MEMORY.md](../../.claude/projects/d--tongkho-web/memory/MEMORY.md) - Province filter patterns

## Overview

- **Priority:** P2 (Enhancement after dropdown fix)
- **Status:** pending
- **Effort:** 1.5h
- **Depends on:** Phase 1 complete

Enhance v2 location selector to match v1 UX flow while preserving v2 architecture (SSG + HTMX + URL-based navigation).

## Key Insights

### v1 UX Flow (from search.js:750-811)

1. User clicks province input → shows province panel with "Toàn quốc" + all provinces
2. User clicks a province → closes panel, updates display, saves to localStorage
3. District panel activates (adds `.active` class) → shows loading spinner
4. Districts load via AJAX → user can select multiple districts
5. On search submit → URL built from localStorage values

### v2 Current Flow (location-selector.astro:144-242)

1. User clicks province button → shows province panel
2. User clicks province → closes panel, updates display
3. **Navigates to province URL** (e.g., `/mua-ban/ha-noi`)
4. Page reloads, districts load via HTMX `hx-trigger="load once"`

### Key Difference

| Aspect | v1 | v2 |
|--------|----|----|
| Navigation | No navigation, in-page updates | URL navigation on selection |
| District load | AJAX into same page | HTMX after page load |
| State | localStorage | URL parameters |

## Requirements

### Functional
- v2 should maintain current URL-based navigation (SSG-friendly)
- Improve visual feedback when province selected
- Show loading state in district panel during HTMX fetch

### Non-Functional
- No additional JavaScript bundle size
- Preserve Tailwind styling patterns
- Maintain infinite reload prevention from MEMORY.md

## Architecture

### Keep v2 URL-Based Approach

v2's URL navigation is correct for SSG. Don't change to localStorage.

**Reason:** With SSG, each URL generates a static page with correct province data baked in. HTMX then loads districts dynamically.

### Enhance Visual Feedback

Add visual states matching v1:
1. Province button shows loading state after selection
2. District panel shows clear loading indicator
3. Smooth transitions between states

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `src/components/listing/sidebar/location-selector.astro` | MODIFY | Add visual states |
| `src/pages/api/location/districts.ts` | NO CHANGE | Already working |

## Implementation Steps

### Step 1: Enhance Province Button States

Add visual feedback when province is selected:

```html
<!-- Province button - add data-state for styling -->
<button
  type="button"
  class="w-full px-3 py-2.5 border border-secondary-200 rounded-lg bg-white text-sm text-left flex items-center justify-between gap-1 hover:border-secondary-300 transition-colors"
  data-province-trigger
  data-state="idle"
>
```

CSS states:
```css
[data-province-trigger][data-state="loading"] {
  opacity: 0.7;
  pointer-events: none;
}
```

### Step 2: Show Loading on Province Selection

Before navigation, show loading state:

```javascript
provinceItems.forEach((item) => {
  item.addEventListener('click', () => {
    const provinceSlug = item.dataset.provinceSlug || '';

    if (provinceSlug) {
      // Show loading state before navigation
      provinceTrigger.setAttribute('data-state', 'loading');
      provinceTrigger.innerHTML = `
        <span class="truncate text-secondary-500">Đang tải...</span>
        <svg class="w-4 h-4 animate-spin text-secondary-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      `;

      // Navigate to province URL
      const targetUrl = `${baseUrl}/${provinceSlug}`;
      window.location.href = targetUrl;
    }
    // ... rest of logic
  });
});
```

### Step 3: Enhance District Panel Loading State

Current loading spinner is good, but add clearer messaging:

```html
{selectedProvince ? (
  <div class="flex flex-col items-center justify-center h-full py-4">
    <svg class="w-5 h-5 animate-spin text-primary-500 mb-2" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
    <span class="text-xs text-secondary-500">Đang tải quận/huyện...</span>
  </div>
) : (
  <span class="flex items-center justify-center h-full text-center">Chọn tỉnh để xem quận/huyện</span>
)}
```

### Step 4: Add District Panel Activation Visual

Match v1's `.active` class behavior - show district panel is "ready":

```html
<!-- District panel - conditional styling -->
<div
  class:list={[
    'w-full h-full min-h-[42px] px-3 py-2.5 border rounded-lg text-sm overflow-y-auto max-h-40 transition-all',
    selectedProvince
      ? 'border-primary-200 bg-white'  // Active state
      : 'border-secondary-200 bg-secondary-50 text-secondary-500'  // Inactive state
  ]}
  data-district-panel
  hx-get={selectedProvince ? `/api/location/districts?province=${selectedProvince.nId}&base=${baseUrl}` : undefined}
  hx-trigger={selectedProvince ? 'load once' : undefined}
  hx-swap="innerHTML"
>
```

### Step 5: Add Hover States for Province Items

Enhance province list item interaction:

```html
<button
  type="button"
  class:list={[
    'province-item w-full text-left px-3 py-2 text-sm transition-all duration-150',
    province.slug === currentProvince
      ? 'bg-primary-50 text-primary-600 font-medium border-l-2 border-primary-500'
      : 'text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900 hover:border-l-2 hover:border-secondary-300'
  ]}
  data-province-nid={province.nId}
  data-province-slug={province.slug}
  data-province-name={province.name}
>
```

### Step 6: Test Complete Flow

1. Load page without province → district panel shows "Chọn tỉnh để xem quận/huyện"
2. Click province button → dropdown opens
3. Click province → button shows loading, page navigates
4. New page loads → district panel has active styling, shows loading
5. Districts load via HTMX → clickable district links appear
6. Click district → navigates to district URL

## Todo List

- [ ] Add data-state attribute to province trigger
- [ ] Add CSS for loading state
- [ ] Show loading UI on province selection before navigation
- [ ] Enhance district panel loading message
- [ ] Add active/inactive visual states to district panel
- [ ] Add hover states to province items
- [ ] Test complete flow
- [ ] Test with View Transitions

## Success Criteria

1. Province button shows loading state on selection
2. District panel has visual "active" state when province selected
3. Loading message is clear ("Đang tải quận/huyện...")
4. Province items have clear hover states
5. Selected province has visual indicator (border, background)
6. All existing navigation continues to work

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CSS conflicts with existing Tailwind | Low | Low | Use specific selectors |
| Loading state stuck if navigation fails | Medium | Medium | Add timeout fallback |

## Security Considerations

No security concerns - client-side visual enhancements only.

## Next Steps

After Phase 2 complete:
- Monitor user feedback
- Consider adding keyboard navigation (arrow keys)
- Consider adding search/filter within province list
