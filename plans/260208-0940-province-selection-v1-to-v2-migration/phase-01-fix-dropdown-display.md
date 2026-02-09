# Phase 1: Fix Province Dropdown Display

## Context Links
- [location-selector.astro](../../src/components/listing/sidebar/location-selector.astro)
- [v1 search.js setupCityField](../../reference/resaland_v1/static/js/module/search.js) - Lines 734-831

## Overview

- **Priority:** P1 (Critical - blocks user interaction)
- **Status:** pending
- **Effort:** 1.5h

Province dropdown button exists but clicking it does not show the province panel. The toggle logic is in place but may not be executing.

## Key Insights

### Current Code Analysis (location-selector.astro:114-143)

```javascript
document.querySelectorAll('[data-location-selector]').forEach((container) => {
  // ... setup code ...

  provinceTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen = !isOpen;
    provincePanel.classList.toggle('hidden', !isOpen);
    provinceArrow.classList.toggle('rotate-180', isOpen);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target as Node)) {
      isOpen = false;
      provincePanel.classList.add('hidden');
      provinceArrow.classList.remove('rotate-180');
    }
  });
});
```

### Potential Issues

1. **Astro View Transitions** - Script runs once on initial load but not after soft navigation
2. **Selector timing** - Elements may not exist when script runs
3. **Optional chaining masking errors** - `provinceTrigger?.addEventListener` fails silently if null
4. **Multiple instances** - Script adds multiple global `document.addEventListener('click')` handlers

## Requirements

### Functional
- Click province button → shows dropdown panel
- Click outside → closes dropdown
- Arrow icon rotates when open

### Non-Functional
- Must work with Astro View Transitions
- Must not cause memory leaks (cleanup listeners)
- Must handle multiple component instances on page

## Architecture

### Solution: Use Astro View Transition Hooks

Replace current inline `<script>` with View Transition-aware pattern:

```javascript
// Run on initial load AND after each soft navigation
function initLocationSelector() {
  document.querySelectorAll('[data-location-selector]').forEach(initContainer);
}

// Use Astro's page-load event (fires on initial + every soft nav)
document.addEventListener('astro:page-load', initLocationSelector);
```

### Why This Works

| Event | When it fires |
|-------|---------------|
| `DOMContentLoaded` | Only on hard page load |
| `astro:page-load` | On initial load + every View Transition |
| `astro:after-swap` | After DOM is swapped but before transition completes |

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `src/components/listing/sidebar/location-selector.astro` | MODIFY | Fix event listener initialization |

## Implementation Steps

### Step 1: Update Script Initialization (location-selector.astro)

Replace the current inline script (lines 114-245) with:

```javascript
<script>
  // Initialize location selector - runs on page load and after View Transitions
  function initLocationSelectors() {
    document.querySelectorAll('[data-location-selector]').forEach(initContainer);
  }

  function initContainer(container: Element) {
    // Skip if already initialized
    if (container.getAttribute('data-initialized')) return;
    container.setAttribute('data-initialized', 'true');

    const baseUrl = container.getAttribute('data-base-url') || '/mua-ban';
    const provinceTrigger = container.querySelector('[data-province-trigger]') as HTMLButtonElement;
    const provincePanel = container.querySelector('[data-province-panel]') as HTMLDivElement;
    const provinceArrow = container.querySelector('[data-province-arrow]') as SVGElement;
    const provinceDisplay = container.querySelector('[data-province-display]') as HTMLSpanElement;
    const districtPanel = container.querySelector('[data-district-panel]') as HTMLDivElement;
    const provinceItems = container.querySelectorAll('.province-item') as NodeListOf<HTMLButtonElement>;

    // Early return if elements missing
    if (!provinceTrigger || !provincePanel) {
      console.warn('[location-selector] Missing required elements');
      return;
    }

    let isOpen = false;

    // Toggle province dropdown
    provinceTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      isOpen = !isOpen;
      provincePanel.classList.toggle('hidden', !isOpen);
      provinceArrow?.classList.toggle('rotate-180', isOpen);
    });

    // Close on outside click - use AbortController for cleanup
    const abortController = new AbortController();
    document.addEventListener('click', (e) => {
      if (!container.contains(e.target as Node)) {
        isOpen = false;
        provincePanel.classList.add('hidden');
        provinceArrow?.classList.remove('rotate-180');
      }
    }, { signal: abortController.signal });

    // Cleanup on before-swap (View Transition about to happen)
    document.addEventListener('astro:before-swap', () => {
      abortController.abort();
    }, { once: true });

    // ... rest of province selection logic (unchanged) ...
  }

  // Astro View Transitions: run on initial load + every soft navigation
  document.addEventListener('astro:page-load', initLocationSelectors);
</script>
```

### Step 2: Add Initialization Guard

Add `data-initialized` attribute check to prevent duplicate initialization:

```javascript
if (container.getAttribute('data-initialized')) return;
container.setAttribute('data-initialized', 'true');
```

### Step 3: Add Console Debug Logging

Temporarily add debug logging to verify execution:

```javascript
provinceTrigger.addEventListener('click', (e) => {
  console.log('[location-selector] Province trigger clicked, isOpen:', !isOpen);
  // ... rest of logic
});
```

### Step 4: Verify CSS Hidden Class

Confirm `hidden` utility class is available (Tailwind default):

```html
<!-- Province panel should have hidden class initially -->
<div class="... hidden ..." data-province-panel>
```

### Step 5: Test Scenarios

1. Initial page load → click province button → dropdown shows
2. Navigate away (View Transition) → navigate back → click → dropdown shows
3. Click outside dropdown → closes
4. Multiple location-selectors on page → each works independently

## Todo List

- [ ] Read current location-selector.astro implementation
- [ ] Replace inline script with View Transition-aware version
- [ ] Add initialization guard (data-initialized)
- [ ] Add AbortController for cleanup
- [ ] Add temporary debug logging
- [ ] Verify hidden class in HTML
- [ ] Test on listing page
- [ ] Test View Transition navigation
- [ ] Remove debug logging after verification

## Success Criteria

1. Province dropdown toggles on button click
2. Dropdown closes when clicking outside
3. Arrow rotates correctly
4. Works after View Transition navigation
5. No console errors
6. No memory leaks (listeners cleaned up)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AbortController browser support | Low | Medium | Modern browsers only (supported since 2017) |
| astro:page-load not firing | Low | High | Fallback to DOMContentLoaded + astro:after-swap |

## Security Considerations

No security concerns - this is client-side UI toggle logic only.

## Next Steps

After Phase 1 complete:
- Proceed to Phase 2 if district loading needs adjustment
- If dropdown works but districts don't load, investigate HTMX timing
