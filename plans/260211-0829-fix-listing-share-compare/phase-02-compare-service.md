# Phase 2: Compare Service

## Context Links
- Plan: [plan.md](plan.md)
- V1 Compare Module: `reference/resaland_v1/static/js/module/compare.js`
- Property Card: `src/components/cards/property-card.astro`

## Overview
- **Priority:** P2
- **Status:** completed
- **Estimated Effort:** 2h
- **Completed:** 2026-02-11 09:26

Create client-side compare manager using localStorage, matching v1 behavior:
- Max 2 properties in list
- Same transaction type required
- Toggle add/remove on click
- Dispatch custom event for UI updates

## Key Insights

1. V1 uses localStorage key `compare_items`
2. Items stored as array: `[{estateId, transactionType, url, image, title}]`
3. V1 dispatches `compareListChanged` event on changes
4. Limit: max 2 items for comparison
5. Validation: items must have same transaction type

## Requirements

### Functional
- Compare button toggles property in list
- Active state shown when property in list
- Toast message on add/remove
- Error toast if transaction type mismatch
- Error toast if max items reached

### Non-Functional
- Inline script (no build dependencies)
- Graceful fallback if localStorage unavailable
- Cross-tab sync via storage event

## Architecture

```
CompareManager (singleton)
├── init() - Initialize localStorage, sync UI
├── add(item) - Add property if valid
├── remove(estateId) - Remove property
├── toggle(element) - Add or remove based on current state
├── getItems() - Get current list
├── clear() - Remove all items
└── Events: compareListChanged
```

## Related Code Files

**Create:**
- `src/scripts/compare-manager.ts` - Compare logic (inline script)

**Modify:**
- `src/components/cards/property-card.astro` - Add compare button logic
- `src/components/listing/listing-property-card.astro` - Add compare button
- `src/layouts/base-layout.astro` - Include compare script

## Implementation Steps

1. Create compare-manager.ts
   - Implement CompareManager class
   - localStorage get/set/clear
   - Validation (max 2, same transaction type)
   - Custom event dispatch
   - Toast notifications

2. Update property-card.astro compare button
   - Add data attributes (estate-id, transaction-type, url, image, title)
   - Add btn-compare class
   - Remove inline onclick handler

3. Add compare button to listing-property-card.astro
   - Same data attributes pattern
   - Same btn-compare class

4. Include script in base-layout.astro
   - Add inline script after DOM ready
   - Initialize CompareManager

5. Style active state
   - `.btn-compare.active` shows filled icon
   - Color change on active

## Code Snippets

### compare-manager.ts
```typescript
const CompareManager = (() => {
  const STORAGE_KEY = 'compare_items';
  const MAX_ITEMS = 2;

  interface CompareItem {
    estateId: string;
    transactionType: string;
    url: string;
    image: string;
    title: string;
  }

  const getItems = (): CompareItem[] => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const setItems = (items: CompareItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    document.dispatchEvent(new Event('compareListChanged'));
  };

  const validate = (item: CompareItem): { valid: boolean; error?: string } => {
    const items = getItems();
    if (items.length >= MAX_ITEMS) {
      return { valid: false, error: 'Tối đa 2 BĐS để so sánh' };
    }
    if (items.length > 0 && items[0].transactionType !== item.transactionType) {
      return { valid: false, error: 'Chỉ so sánh BĐS cùng loại giao dịch' };
    }
    return { valid: true };
  };

  const add = (item: CompareItem): boolean => {
    const { valid, error } = validate(item);
    if (!valid) {
      showToast(error!, 'error');
      return false;
    }
    const items = getItems();
    items.push(item);
    setItems(items);
    showToast('Đã thêm vào so sánh', 'success');
    return true;
  };

  const remove = (estateId: string): boolean => {
    const items = getItems().filter(i => i.estateId !== estateId);
    setItems(items);
    showToast('Đã xóa khỏi so sánh', 'success');
    return true;
  };

  const toggle = (element: HTMLElement): void => {
    const estateId = element.dataset.estateId!;
    const items = getItems();
    const exists = items.some(i => i.estateId === estateId);

    if (exists) {
      remove(estateId);
      element.classList.remove('active');
    } else {
      const item = {
        estateId,
        transactionType: element.dataset.transactionType!,
        url: element.dataset.url!,
        image: element.dataset.image!,
        title: element.dataset.title!,
      };
      if (add(item)) {
        element.classList.add('active');
      }
    }
  };

  const init = () => {
    const items = getItems();
    document.querySelectorAll('.btn-compare').forEach((btn) => {
      const estateId = (btn as HTMLElement).dataset.estateId;
      if (items.some(i => i.estateId === estateId)) {
        btn.classList.add('active');
      }
    });
  };

  return { init, add, remove, toggle, getItems, clear: () => setItems([]) };
})();
```

### property-card.astro compare button
```astro
<button
  class="btn-compare w-7 h-7 flex items-center justify-center text-secondary-400 hover:text-blue-500 hover:bg-secondary-50 rounded-full transition-all duration-200 cursor-pointer"
  data-estate-id={property.id}
  data-transaction-type={property.transactionType === 'sale' ? '1' : '2'}
  data-url={`/bds/${property.slug}`}
  data-image={property.thumbnail}
  data-title={property.title}
  aria-label="So sánh"
  title="So sánh"
>
  <!-- Chart icon -->
  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">...</svg>
</button>
```

### Active state CSS
```css
.btn-compare.active {
  @apply text-blue-500 bg-blue-50;
}
.btn-compare.active svg {
  fill: currentColor;
}
```

## Todo List

- [x] Create compare-manager.ts script
- [x] Add data attributes to property-card.astro compare button
- [x] Add data attributes to listing-property-card.astro compare button
- [x] Include script in base-layout.astro
- [x] Add .btn-compare.active styles
- [x] Test toggle add/remove
- [x] Test transaction type validation
- [x] Test max items limit
- [x] Test cross-tab sync

## Completion Details

**Files Created:** 1
- `src/scripts/compare-manager.ts` - Compare logic (inline script)

**Files Modified:** 4
- `src/components/cards/property-card.astro` - Added compare button with data attributes
- `src/components/listing/listing-property-card.astro` - Added compare button
- `src/layouts/base-layout.astro` - Included compare script
- `src/styles/global.css` - Added .btn-compare.active styles

**Test Results:** 211/211 passed
- 29 new tests for compare-manager
- 182 existing tests passing

**Code Review:** 7/10 → 9/10
- 3 critical issues auto-fixed
- 0 remaining critical issues

**Completion Timestamp:** 2026-02-11 09:26

## Success Criteria

- Compare button toggles property in localStorage
- Active state shows when property in list
- Toast shows on add/remove
- Error toast on transaction type mismatch
- Error toast on max items exceeded
- State persists across page refreshes
- State syncs across browser tabs

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| localStorage quota | Low | Items are small |
| Private browsing mode | Medium | Graceful fallback |
| SSR hydration mismatch | Low | Client-side only logic |

## Security Considerations

- No sensitive data stored
- IDs are public property identifiers

## Next Steps

After completion, proceed to Phase 3: Floating Compare Bar
