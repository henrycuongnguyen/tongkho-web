# Phase 11: Area Filter Card

## Context Links
- **Plan:** [plan.md](./plan.md)
- **V1 Reference:** `reference/resaland_v1/views/search/sidebar_area_filter.load`
- **V1 Custom Area:** `reference/resaland_v1/views/search/sidebar_area_filter_category.load`
- **Previous Phase:** [Phase 10: Price Range Filter](./phase-10-price-range-filter-card.md)

## Overview
**Priority:** High
**Status:** Pending
**Dependencies:** Phase 3 (URL Parsing), Phase 8 (Sidebar Layout)

Implement area filter card in sidebar with predefined area ranges and custom min/max inputs (m²).

## Key Insights

From v1 analysis:
- Similar structure to price filter
- Area ranges vary by property type (apartment vs land)
- Common ranges:
  - Dưới 30 m² (< 30m²)
  - 30 - 50 m²
  - 50 - 80 m²
  - 80 - 100 m²
  - 100 - 150 m²
  - 150 - 200 m²
  - 200 - 250 m²
  - 250 - 300 m²
  - 300 - 500 m²
  - Trên 500 m² (> 500m²)
- URL format: `?min_area=50&max_area=100`
- Custom area input allows user-defined range

## Requirements

### Functional Requirements
- Display ~10 predefined area ranges as clickable links
- Custom area input fields (min, max) in m²
- Format areas with thousand separators (e.g., "1,500 m²")
- Generate URL with `min_area` and `max_area` query params
- Highlight active area range if current URL matches
- Preserve other filters when changing area

### Non-functional Requirements
- Area input validation (min <= max, positive numbers)
- Number formatting (m² suffix)
- Fast filtering (<100ms URL update)
- Responsive: Stack inputs on mobile

## Architecture

```typescript
// src/components/listing/sidebar/area-range-filter-card.tsx
interface AreaRange {
  min: number;
  max: number;
  label: string;
}

interface AreaFilterProps {
  currentMinArea?: number;
  currentMaxArea?: number;
  baseUrl: string;
}

// Area ranges constant
const AREA_RANGES: AreaRange[] = [
  { min: 0, max: 30, label: 'Dưới 30 m²' },
  { min: 30, max: 50, label: '30 - 50 m²' },
  // ... 8 more ranges
];
```

## Related Code Files

### Files to Create
- `src/components/listing/sidebar/area-range-filter-card.tsx` - Area filter UI
- `src/constants/area-ranges.ts` - Predefined area ranges
- `src/utils/area-formatter.ts` - Format areas (50 m², 1,500 m²)

### Files to Modify
- `src/pages/[...slug].astro` - Add AreaRangeFilterCard to sidebar
- `src/utils/listing-url-parser.ts` - Extract current area params

## Implementation Steps

1. **Define Area Range Constants**
   ```typescript
   // src/constants/area-ranges.ts
   export const AREA_RANGES: AreaRange[] = [
     { min: 0, max: 30, label: 'Dưới 30 m²' },
     { min: 30, max: 50, label: '30 - 50 m²' },
     { min: 50, max: 80, label: '50 - 80 m²' },
     { min: 80, max: 100, label: '80 - 100 m²' },
     { min: 100, max: 150, label: '100 - 150 m²' },
     { min: 150, max: 200, label: '150 - 200 m²' },
     { min: 200, max: 250, label: '200 - 250 m²' },
     { min: 250, max: 300, label: '250 - 300 m²' },
     { min: 300, max: 500, label: '300 - 500 m²' },
     { min: 500, max: 999999, label: 'Trên 500 m²' }
   ];
   ```

2. **Create Area Formatter Utility**
   ```typescript
   // src/utils/area-formatter.ts
   export const formatAreaVN = (area: number): string => {
     return `${area.toLocaleString('vi-VN')} m²`;
   };
   ```

3. **Create Area Range Filter Component**
   ```tsx
   // src/components/listing/sidebar/area-range-filter-card.tsx
   - Render predefined ranges as links
   - Highlight active range
   - Custom min/max inputs with validation
   - "Áp dụng" button to apply custom range
   - Generate new URL with area params
   ```

4. **Update URL Parser**
   ```typescript
   // src/utils/listing-url-parser.ts
   - Extract min_area and max_area from URL
   - Return as numbers (not strings)
   ```

5. **Integrate into Listing Page**
   ```astro
   // src/pages/[...slug].astro
   const { minArea, maxArea } = parseListingUrl(Astro.url);

   <AreaRangeFilterCard
     currentMinArea={minArea}
     currentMaxArea={maxArea}
     baseUrl={buildBaseUrl(Astro.url)}
   />
   ```

## Todo List

- [ ] Create `area-ranges.ts` with 10 ranges
- [ ] Create `area-formatter.ts` utility
- [ ] Create `area-range-filter-card.tsx` component
- [ ] Add predefined range list with links
- [ ] Add custom area input fields (min, max)
- [ ] Add "Áp dụng" button for custom range
- [ ] Implement area validation (min <= max, positive)
- [ ] Highlight active area range
- [ ] Generate URL with area params
- [ ] Test area filter with other filters (price, location, etc.)
- [ ] Add loading state during navigation
- [ ] Style active range (highlight)
- [ ] Add m² suffix to input fields

## Success Criteria

- ✅ 10 predefined area ranges display correctly
- ✅ Clicking a range updates URL with `min_area` and `max_area`
- ✅ Custom area inputs accept numbers only
- ✅ Validation: Show error if min > max or negative
- ✅ "Áp dụng" button updates URL with custom range
- ✅ Active range is highlighted (visual feedback)
- ✅ Other filters preserved when changing area
- ✅ Area format displays as "50 m²", "1,500 m²", etc.
- ✅ Responsive: Inputs stack on mobile
- ✅ m² suffix displays on input focus

## Risk Assessment

**Low Risk:**
- Similar implementation to Phase 10 (Price Filter)
- Reuse validation and URL generation logic

**Potential Issues:**
- Area ranges may need adjustment based on property type
  - Apartments: Smaller ranges (30-150 m²)
  - Land: Larger ranges (500-5000 m²)

**Mitigation:**
- Use single set of ranges for all property types (v1 approach)
- Future enhancement: Dynamic ranges based on property type filter

## Security Considerations

- **Input Validation:** Sanitize area inputs (numbers only, positive)
- **Max Value Cap:** Limit max area to 100,000 m² (prevent overflow)
- **XSS Prevention:** Encode URL parameters
- **SQL Injection:** Not applicable (ElasticSearch DSL)

## Next Steps

After area filter is complete:
- **Phase 12:** Implement Ward/Commune List by District
- **Phase 13:** Implement Featured Project Banner
- **Integration:** Combine price + area filters in single ElasticSearch query
