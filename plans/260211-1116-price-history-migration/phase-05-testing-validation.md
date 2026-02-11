# Phase 5: Testing and Validation

## Context Links

- [Phase 4: Integration](./phase-04-integrate-listing-page.md)
- [Plan Overview](./plan.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-11 |
| Priority | P2 |
| Status | pending |
| Effort | 45m |
| Description | Validate implementation across browsers and scenarios |

## Key Insights

1. **TypeScript Check**: Use `npm run astro check` for compile validation
2. **Dev Server**: Use `npm run dev` for visual testing
3. **Browser Testing**: Chrome, Firefox, Safari (latest 2 versions per project README)
4. **Responsive Testing**: Mobile (<640px), Tablet (640-1024px), Desktop (>1024px)

## Requirements

### Test Scenarios

1. **TS-01**: TypeScript compilation passes
2. **TS-02**: Dev server starts without errors
3. **TS-03**: Chart renders in sidebar
4. **TS-04**: 2yr/5yr toggle works
5. **TS-05**: Price change updates on toggle
6. **TS-06**: Responsive layout correct
7. **TS-07**: No console errors
8. **TS-08**: Chart.js loads correctly

### Test URLs

```
/mua-ban                           # No price filter
/mua-ban/ha-noi                    # Location only
/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty  # With price filter
/cho-thue/ha-noi                   # Different transaction
```

## Related Code Files

### Files to Validate

1. `src/utils/price-history-utils.ts` - Utility functions
2. `src/components/listing/sidebar/price-history-card.astro` - New component
3. `src/components/listing/sidebar/sidebar-wrapper.astro` - Modified wrapper

## Implementation Steps

### Step 1: TypeScript Validation

```bash
npm run astro check
```

Expected: No errors related to price-history files.

**Checklist:**
- [ ] price-history-utils.ts compiles
- [ ] price-history-card.astro Props valid
- [ ] sidebar-wrapper.astro imports resolve

### Step 2: Dev Server Test

```bash
npm run dev
```

Navigate to: http://localhost:3000/mua-ban/ha-noi

**Checklist:**
- [ ] Server starts without errors
- [ ] Page loads completely
- [ ] No console errors in browser

### Step 3: Visual Inspection

**Chart Display:**
- [ ] Card appears between Area filter and Dynamic filters
- [ ] Header shows "Biến động giá"
- [ ] Toggle buttons visible (2 Năm / 5 Năm)
- [ ] Price info row shows reference price
- [ ] Chart canvas renders
- [ ] Disclaimer text visible

**Styling:**
- [ ] Card matches other sidebar cards
- [ ] Text sizes appropriate
- [ ] Colors match design system (primary-500 = #F97316)
- [ ] Border/shadow consistent

### Step 4: Interaction Testing

**Toggle Functionality:**
1. Click "5 Năm" button
   - [ ] Button style changes (active state)
   - [ ] Chart updates with 5-year data
   - [ ] Price change percentage updates
2. Click "2 Năm" button
   - [ ] Returns to 2-year view
   - [ ] Button states toggle correctly

**Chart Hover:**
- [ ] Tooltip appears on hover
- [ ] Tooltip shows price value
- [ ] Point highlight works

### Step 5: Responsive Testing

**Desktop (>1024px):**
- [ ] Chart fits sidebar width
- [ ] All elements visible

**Tablet (640-1024px):**
- [ ] Sidebar stacks properly
- [ ] Chart maintains aspect ratio

**Mobile (<640px):**
- [ ] Card full width
- [ ] Toggle buttons accessible
- [ ] Chart readable

### Step 6: Cross-Browser Testing

| Browser | Version | Chart Renders | Toggle Works | Console Clean |
|---------|---------|--------------|--------------|---------------|
| Chrome | Latest | [ ] | [ ] | [ ] |
| Firefox | Latest | [ ] | [ ] | [ ] |
| Safari | Latest | [ ] | [ ] | [ ] |
| Edge | Latest | [ ] | [ ] | [ ] |

### Step 7: Edge Cases

**No Price Filter:**
- URL: `/mua-ban`
- [ ] Card shows with default price (3 tỷ)

**Million-Range Filter:**
- URL with maxPrice < 1B
- [ ] Unit shows "triệu" instead of "tỷ"

**Multiple Pages:**
- Navigate to different listing pages
- [ ] Chart renders correctly on each

### Step 8: Build Test

```bash
npm run build
npm run preview
```

- [ ] Build completes without errors
- [ ] Preview server works
- [ ] Chart renders in production build

## Todo List

- [ ] Run `npm run astro check`
- [ ] Start dev server
- [ ] Test chart rendering
- [ ] Test toggle functionality
- [ ] Test responsive layouts
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Check console for errors
- [ ] Run production build
- [ ] Test preview server

## Success Criteria

- [ ] All TypeScript checks pass
- [ ] No console errors in any browser
- [ ] Chart renders correctly
- [ ] Toggle switches data properly
- [ ] Price change updates correctly
- [ ] Responsive layout works
- [ ] Production build succeeds

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Chart.js CDN unavailable | Very Low | High | Local fallback |
| Build fails | Low | Medium | Fix TS errors |
| Mobile layout broken | Low | Medium | Responsive fixes |

## Bug Tracking

| Issue | Status | Resolution |
|-------|--------|------------|
| (none yet) | - | - |

## Security Considerations

- Verify no sensitive data exposed in console
- Confirm Chart.js loaded from trusted CDN
- Check for XSS in tooltip (should be safe - numeric data only)

## Documentation Updates

After successful validation:
- [ ] Update component index if exists
- [ ] Add to codebase-summary.md (component count)
- [ ] Update project-roadmap.md (Phase 2 progress)

## Final Checklist

- [ ] All tests pass
- [ ] No console errors
- [ ] Responsive verified
- [ ] Production build works
- [ ] Ready for code review

## Rollback Plan

If issues found:
1. Remove PriceHistoryCard from sidebar-wrapper.astro
2. Keep utility files (no harm if unused)
3. Debug in isolation before re-integrating
