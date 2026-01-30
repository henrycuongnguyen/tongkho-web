# Phase 1: Consolidate Dropdown Components

## Overview

| Field | Value |
|-------|-------|
| Priority | HIGH |
| Status | pending |
| Effort | 2h |
| Description | Merge price-range-dropdown and area-range-dropdown into single generic range-slider-dropdown component |

## Key Insights

- `price-range-dropdown.astro` (295 LOC) and `area-range-dropdown.astro` (292 LOC) are 95%+ identical
- Only differences: quick picks data, MIN/MAX values, unit formatting function, data attributes
- Both use identical: HTML structure, slider logic, toggle behavior, quick pick selection UI
- Pattern should follow `share-buttons.astro` variant props approach

## Requirements

### Functional
- Support both price and area use cases via props
- Accept custom quick picks array
- Accept min/max range values
- Accept unit formatting function or type

### Non-functional
- Single component <300 LOC
- TypeScript strict mode compliant
- No behavior changes from original components

## Architecture

```typescript
interface QuickPick {
  label: string;
  min: number;
  max: number;
}

type FormatFn = (value: number) => string;

interface Props {
  type: 'price' | 'area' | 'custom';  // Determines formatting
  id?: string;
  name?: string;
  placeholder?: string;
  quickPicks?: QuickPick[];           // Override defaults
  min?: number;                        // Override MIN
  max?: number;                        // Override MAX
  step?: number;                       // Override STEP
  formatFn?: FormatFn;                 // Custom formatter (required if type='custom')
}
```

**Formatting logic (hybrid approach):**
```typescript
const defaultFormatters: Record<'price' | 'area', FormatFn> = {
  price: (value) => {
    if (value === 0) return '0 triệu';
    if (value >= 1000) return `${value / 1000} tỷ`;
    return `${value} triệu`;
  },
  area: (value) => `${value} m²`,
};

const formatValue = (value: number, type: Props['type'], formatFn?: FormatFn): string => {
  if (type === 'custom' && formatFn) return formatFn(value);
  return defaultFormatters[type as 'price' | 'area'](value);
};
```

**Benefits of hybrid approach:**
- Simple usage for common cases: `<RangeSlider type="price" />`
- Extensible for future needs: `<RangeSlider type="custom" formatFn={myFormatter} />`
- No breaking changes if new types added later

## Related Code Files

### Files to CREATE
- `src/components/ui/range-slider-dropdown.astro` - New consolidated component

### Files to MODIFY
- `src/components/home/hero-search.astro` - Update imports (if using dropdowns)
- Any page/component importing price-range-dropdown or area-range-dropdown

### Files to DELETE (after verification)
- `src/components/ui/price-range-dropdown.astro`
- `src/components/ui/area-range-dropdown.astro`

## Implementation Steps

1. **Create new component file**
   - Create `src/components/ui/range-slider-dropdown.astro`
   - Copy structure from `price-range-dropdown.astro` as base

2. **Add Props interface with JSDoc**
   ```typescript
   /**
    * Range Slider Dropdown Component
    * Generic dual-range slider with quick picks for price/area filtering
    *
    * @prop type - 'price' or 'area' determines formatting and default values
    * @prop id - Form input ID
    * @prop name - Form input name
    * @prop placeholder - Trigger button placeholder text
    * @prop quickPicks - Custom quick pick options (optional)
    * @prop min - Minimum range value (optional, uses type defaults)
    * @prop max - Maximum range value (optional, uses type defaults)
    * @prop step - Slider step value (optional, uses type defaults)
    */
   ```

3. **Add type-based defaults**
   ```typescript
   const DEFAULTS = {
     price: {
       min: 0, max: 60000, step: 100,
       placeholder: 'Khoảng giá',
       quickPicks: [/* price quick picks */]
     },
     area: {
       min: 0, max: 1000, step: 5,
       placeholder: 'Diện tích',
       quickPicks: [/* area quick picks */]
     }
   };
   ```

4. **Parameterize data attributes**
   - Change `data-dropdown` to `data-range-dropdown`
   - Add `data-type={type}` for script identification

5. **Update script to use type**
   - Read `data-type` attribute
   - Use appropriate formatValue function
   - Apply correct default placeholder text

6. **Search for usages of old components**
   ```bash
   grep -r "price-range-dropdown" src/
   grep -r "area-range-dropdown" src/
   ```

7. **Update all imports**
   - Replace: `import PriceRange from '@components/ui/price-range-dropdown.astro'`
   - With: `import RangeSlider from '@components/ui/range-slider-dropdown.astro'`
   - Update usage: `<RangeSlider type="price" />`

8. **Test both variants**
   - Verify price dropdown works identically
   - Verify area dropdown works identically
   - Check slider drag behavior
   - Check quick pick selection
   - Check reset functionality

9. **Delete old component files**
   - Remove `price-range-dropdown.astro`
   - Remove `area-range-dropdown.astro`

10. **Run build verification**
    ```bash
    npm run build
    ```

## Todo List

- [ ] Create range-slider-dropdown.astro with Props interface
- [ ] Add type-based defaults (price/area configurations)
- [ ] Implement formatValue function with type parameter
- [ ] Update data attributes for script identification
- [ ] Update script to handle both types
- [ ] Find and update all usages of price-range-dropdown
- [ ] Find and update all usages of area-range-dropdown
- [ ] Test price variant functionality
- [ ] Test area variant functionality
- [ ] Delete old component files
- [ ] Verify build passes

## Success Criteria

- [ ] Single `range-slider-dropdown.astro` exists in `src/components/ui/`
- [ ] Both `<RangeSlider type="price" />` and `<RangeSlider type="area" />` work
- [ ] No `price-range-dropdown.astro` or `area-range-dropdown.astro` in codebase
- [ ] `npm run build` passes without errors
- [ ] UI behavior identical to original components

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Script scope conflicts | Medium | Use unique data attribute `data-range-dropdown` |
| Missing usage updates | High | Run comprehensive grep search before deleting |
| Behavior regression | Medium | Manual test all slider/quick pick interactions |

## Security Considerations

- No user input is stored or transmitted
- Form values are sanitized by existing form handling
- No authentication or authorization changes
