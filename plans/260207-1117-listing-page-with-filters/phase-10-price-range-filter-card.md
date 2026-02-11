# Phase 10: Price Range Filter Card

## Context Links
- **Plan:** [plan.md](./plan.md)
- **V1 Reference:** `reference/resaland_v1/views/components/sidebar-price-filter.html`
- **V1 Custom Price:** `reference/resaland_v1/views/search/sidebar_price_filter_custom.load`
- **Previous Phase:** [Phase 9: Quick Contact Banner](./phase-09-quick-contact-banner.md)

## Overview
**Priority:** High
**Status:** Pending
**Dependencies:** Phase 3 (URL Parsing), Phase 8 (Sidebar Layout)

Implement price range filter card in sidebar with predefined ranges and custom min/max inputs.

## Key Insights

From v1 analysis:
- **13 predefined price ranges** (see v1 code lines 7-73)
  - Dưới 500 triệu (< 500M)
  - 500tr - 800tr
  - 800tr - 1 tỷ
  - 1 tỷ - 2 tỷ
  - ... up to "Trên 60 tỷ" (> 60B)
- Each range is a clickable link with `min_price` and `max_price` params
- Custom price filter allows user input (min, max)
- URL format: `?min_price=1000000000&max_price=2000000000`
- Filters are additive (combine with other filters in URL)

## Requirements

### Functional Requirements
- Display 13 predefined price ranges as clickable links
- Custom price input fields (min, max) with "Áp dụng" button
- Format prices in Vietnamese style (500 triệu, 1 tỷ, etc.)
- Generate URL with `min_price` and `max_price` query params
- Highlight active price range if current URL matches
- Preserve other filters when changing price

### Non-functional Requirements
- Price input validation (min <= max)
- Number formatting with thousand separators
- Fast filtering (<100ms URL update)
- Responsive: Stack inputs on mobile

## Architecture

```typescript
// src/components/listing/sidebar/price-range-filter-card.tsx
interface PriceRange {
  min: number;
  max: number;
  label: string;
}

interface PriceFilterProps {
  currentMinPrice?: number;
  currentMaxPrice?: number;
  baseUrl: string; // Current URL without price params
}

// Price ranges constant (same as v1)
const PRICE_RANGES: PriceRange[] = [
  { min: 0, max: 500_000_000, label: 'Dưới 500 triệu' },
  { min: 500_000_000, max: 800_000_000, label: '500 - 800 triệu' },
  // ... 11 more ranges
];
```

## Related Code Files

### Files to Create
- `src/components/listing/sidebar/price-range-filter-card.tsx` - Price filter UI
- `src/constants/price-ranges.ts` - Predefined price ranges
- `src/utils/price-formatter.ts` - Format prices (500 triệu, 1 tỷ)

### Files to Modify
- `src/pages/[...slug].astro` - Add PriceRangeFilterCard to sidebar
- `src/utils/listing-url-parser.ts` - Extract current price params

## Implementation Steps

1. **Define Price Range Constants**
   ```typescript
   // src/constants/price-ranges.ts
   export const PRICE_RANGES: PriceRange[] = [
     { min: 0, max: 500_000_000, label: 'Dưới 500 triệu' },
     { min: 500_000_000, max: 800_000_000, label: '500 triệu - 800 triệu' },
     { min: 800_000_000, max: 1_000_000_000, label: '800 triệu - 1 tỷ' },
     { min: 1_000_000_000, max: 2_000_000_000, label: '1 tỷ - 2 tỷ' },
     { min: 2_000_000_000, max: 3_000_000_000, label: '2 tỷ - 3 tỷ' },
     { min: 3_000_000_000, max: 5_000_000_000, label: '3 tỷ - 5 tỷ' },
     { min: 5_000_000_000, max: 7_000_000_000, label: '5 tỷ - 7 tỷ' },
     { min: 7_000_000_000, max: 10_000_000_000, label: '7 tỷ - 10 tỷ' },
     { min: 10_000_000_000, max: 20_000_000_000, label: '10 tỷ - 20 tỷ' },
     { min: 20_000_000_000, max: 30_000_000_000, label: '20 tỷ - 30 tỷ' },
     { min: 30_000_000_000, max: 40_000_000_000, label: '30 tỷ - 40 tỷ' },
     { min: 40_000_000_000, max: 60_000_000_000, label: '40 tỷ - 60 tỷ' },
     { min: 60_000_000_000, max: 1_000_000_000_000, label: 'Trên 60 tỷ' }
   ];
   ```

2. **Create Price Formatter Utility**
   ```typescript
   // src/utils/price-formatter.ts
   export const formatPriceVN = (price: number): string => {
     if (price >= 1_000_000_000) {
       return `${price / 1_000_000_000} tỷ`;
     } else if (price >= 1_000_000) {
       return `${price / 1_000_000} triệu`;
     }
     return `${price.toLocaleString('vi-VN')} VNĐ`;
   };
   ```

3. **Create Price Range Filter Component**
   ```tsx
   // src/components/listing/sidebar/price-range-filter-card.tsx
   - Render predefined ranges as links
   - Highlight active range
   - Custom min/max inputs with validation
   - "Áp dụng" button to apply custom range
   - Generate new URL with price params
   ```

4. **Update URL Parser**
   ```typescript
   // src/utils/listing-url-parser.ts
   - Extract min_price and max_price from URL
   - Return as numbers (not strings)
   ```

5. **Integrate into Listing Page**
   ```astro
   // src/pages/[...slug].astro
   const { minPrice, maxPrice } = parseListingUrl(Astro.url);

   <PriceRangeFilterCard
     currentMinPrice={minPrice}
     currentMaxPrice={maxPrice}
     baseUrl={buildBaseUrl(Astro.url)}
   />
   ```

## Todo List

- [ ] Create `price-ranges.ts` with 13 ranges
- [ ] Create `price-formatter.ts` utility
- [ ] Create `price-range-filter-card.tsx` component
- [ ] Add predefined range list with links
- [ ] Add custom price input fields (min, max)
- [ ] Add "Áp dụng" button for custom range
- [ ] Implement price validation (min <= max)
- [ ] Highlight active price range
- [ ] Generate URL with price params
- [ ] Test price filter with other filters (location, area, etc.)
- [ ] Add loading state during navigation
- [ ] Style active range (highlight)

## Success Criteria

- ✅ 13 predefined price ranges display correctly
- ✅ Clicking a range updates URL with `min_price` and `max_price`
- ✅ Custom price inputs accept numbers only
- ✅ Validation: Show error if min > max
- ✅ "Áp dụng" button updates URL with custom range
- ✅ Active range is highlighted (visual feedback)
- ✅ Other filters preserved when changing price
- ✅ Price format displays as "500 triệu", "1 tỷ", etc.
- ✅ Responsive: Inputs stack on mobile

## Risk Assessment

**Medium Risk:**
- URL parameter handling with multiple filters
- Price validation edge cases (0, negative, very large numbers)

**Potential Issues:**
- Race condition: Multiple filters updating URL simultaneously
- Invalid price input (non-numeric, negative)

**Mitigation:**
- Debounce custom price input (500ms delay)
- Client-side validation before URL update
- Server-side validation in ElasticSearch query
- Use TypeScript for type safety

## Security Considerations

- **Input Validation:** Sanitize price inputs (numbers only)
- **Max Value Cap:** Limit max price to 1 trillion VND (prevent overflow)
- **XSS Prevention:** Encode URL parameters
- **SQL Injection:** Not applicable (ElasticSearch DSL, not SQL)

## Next Steps

After price filter is complete:
- **Phase 11:** Implement Area Filter Card (similar pattern)
- **Phase 12:** Implement Ward/Commune List by District
- **Phase 13:** Implement Featured Project Banner
