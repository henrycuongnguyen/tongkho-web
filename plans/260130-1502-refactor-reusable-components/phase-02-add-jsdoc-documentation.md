# Phase 2: Add JSDoc Documentation

## Overview

| Field | Value |
|-------|-------|
| Priority | MEDIUM |
| Status | pending |
| Effort | 2h |
| Description | Add JSDoc comments to ALL components across all directories |

## Key Insights

- Current components have typed Props but lack JSDoc descriptions
- `share-buttons.astro` and `about-*-card.astro` already have good JSDoc examples
- JSDoc provides IDE tooltips and auto-documentation
- Focus on most-reused components first

## Requirements

### Functional
- Every component in `src/components/ui/` has JSDoc header
- Every component in `src/components/cards/` has JSDoc header
- Props interface members have inline `/** */` comments

### Non-functional
- Follow existing pattern from `share-buttons.astro`
- Keep JSDoc concise (1-3 lines max per prop)
- Include `@example` for complex props

## JSDoc Template

```astro
---
/**
 * ComponentName - Brief description of purpose
 *
 * @example
 * <ComponentName prop={value} />
 *
 * @prop propName - Description of what this prop does
 * @prop optionalProp - Description (optional, default: value)
 */
interface Props {
  /** Required prop description */
  propName: string;
  /** Optional prop description */
  optionalProp?: boolean;
}

const { propName, optionalProp = false } = Astro.props;
---
```

## Related Code Files

### Files to MODIFY

**ui/ directory:**
- `src/components/ui/range-slider-dropdown.astro` (new from Phase 1)
- `src/components/ui/property-type-dropdown.astro`
- `src/components/ui/location-dropdown.astro`
- `src/components/ui/share-buttons.astro` (already done, verify)

**cards/ directory:**
- `src/components/cards/property-card.astro`

**header/ directory:**
- `src/components/header/header.astro`

**footer/ directory:**
- `src/components/footer/footer.astro`

**home/ directory:**
- `src/components/home/hero-section.astro`
- `src/components/home/hero-search.astro`
- `src/components/home/properties-section.astro`
- `src/components/home/featured-project-section.astro`
- `src/components/home/locations-section.astro`
- `src/components/home/news-section.astro`
- `src/components/home/download-app-section.astro`
- `src/components/home/partners-section.astro`
- `src/components/home/press-coverage-section.astro`

**property/ directory:**
- `src/components/property/contact-sidebar.astro`
- `src/components/property/sidebar-featured-project.astro`
- `src/components/property/sidebar-filter-list.astro`
- `src/components/property/property-detail-image-gallery-carousel.astro`
- `src/components/property/price-history-chart.astro`
- `src/components/property/property-info-section.astro`

**news/ directory:**
- `src/components/news/news-related-articles-sidebar.astro`
- `src/components/news/article-share-buttons.astro`

**about/ directory:**
- `src/components/about/about-team-member-card.astro` (already done, verify)
- `src/components/about/about-achievement-stat-card.astro` (already done, verify)

**auth/ directory:**
- `src/components/auth/auth-modal.astro`

**seo/ directory:**
- `src/components/seo/json-ld-schema.astro`

**root components:**
- `src/components/scroll-to-top-button.astro`

## Implementation Steps

1. **Audit existing JSDoc coverage**
   ```bash
   grep -l "^\s*\*.*@prop" src/components/ui/*.astro
   grep -l "^\s*\*.*@prop" src/components/cards/*.astro
   ```

2. **Add JSDoc to range-slider-dropdown.astro** (if not done in Phase 1)
   ```typescript
   /**
    * RangeSliderDropdown - Dual-range slider with quick picks for filtering
    *
    * @example
    * <RangeSliderDropdown type="price" name="price-filter" />
    * <RangeSliderDropdown type="area" placeholder="Chọn diện tích" />
    *
    * @prop type - 'price' or 'area' determines formatting and defaults
    * @prop id - Form input ID (optional)
    * @prop name - Form input name (optional)
    * @prop placeholder - Trigger button text (optional, uses type default)
    * @prop quickPicks - Custom quick pick options (optional)
    * @prop min - Minimum range value (optional)
    * @prop max - Maximum range value (optional)
    * @prop step - Slider step increment (optional)
    */
   ```

3. **Add JSDoc to property-type-dropdown.astro**
   ```typescript
   /**
    * PropertyTypeDropdown - Multi-select checkbox dropdown for property types
    *
    * @example
    * <PropertyTypeDropdown name="property-type" />
    *
    * @prop id - Form input ID (optional, default: 'property-type')
    * @prop name - Form input name (optional, default: 'propertyType')
    * @prop placeholder - Trigger button text (optional, default: 'Loại nhà đất')
    */
   ```

4. **Add JSDoc to location-dropdown.astro**
   ```typescript
   /**
    * LocationDropdown - City/province selector with featured cities grid
    *
    * @example
    * <LocationDropdown name="location" />
    *
    * @prop id - Form input ID (optional)
    * @prop name - Form input name (optional)
    * @prop placeholder - Trigger button text (optional, default: 'Tất cả')
    */
   ```

5. **Add JSDoc to property-card.astro**
   ```typescript
   /**
    * PropertyCard - Property listing card with image, price, and features
    *
    * @example
    * <PropertyCard property={propertyData} />
    *
    * @prop property - Property object with title, price, images, etc.
    */
   ```

6. **Verify existing JSDoc** in about/ components
   - Check `about-team-member-card.astro` has complete JSDoc
   - Check `about-achievement-stat-card.astro` has complete JSDoc

7. **Run TypeScript check**
   ```bash
   npm run astro check
   ```

## Todo List

- [ ] Audit existing JSDoc coverage in ui/ and cards/
- [ ] Add/update JSDoc for range-slider-dropdown.astro
- [ ] Add JSDoc for property-type-dropdown.astro
- [ ] Add JSDoc for location-dropdown.astro
- [ ] Add JSDoc for property-card.astro
- [ ] Verify JSDoc in about-team-member-card.astro
- [ ] Verify JSDoc in about-achievement-stat-card.astro
- [ ] Run astro check to verify no TypeScript errors

## Success Criteria

- [ ] All ui/ components have JSDoc with @prop annotations
- [ ] All cards/ components have JSDoc with @prop annotations
- [ ] Each component has at least one @example
- [ ] `npm run astro check` passes

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Incorrect prop documentation | Low | Cross-reference with Props interface |
| Missing components | Low | Run glob to list all .astro files |

## Security Considerations

- Documentation only; no runtime impact
- No sensitive information in JSDoc comments
