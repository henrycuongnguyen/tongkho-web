# Phase 4: Integrate into Listing Page Main Content

<!-- Updated: Validation Session 1 - Integration into main content area, not sidebar -->

## Context Links

- [Phase 3: Sidebar Card](./phase-03-create-sidebar-card.md)
- [Sidebar Wrapper](../src/components/listing/sidebar/sidebar-wrapper.astro)
- [Listing Page](../src/pages/[...slug].astro)
- [Plan Overview](./plan.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-11 |
| Priority | P2 |
| Status | pending |
| Effort | 30m |
| Description | Wire up PriceHistorySection in listing page with conditional rendering |

## Key Insights

<!-- Updated: Validation Session 1 - Changed integration location and added conditional rendering -->

1. **Placement**: In main content area of [...slug].astro, after listing grid or before pagination
2. **Conditional Rendering**: Only show when filters.minPrice OR filters.maxPrice is set
3. **Props Source**: Use `filters.maxPrice` for price history query
4. **Unit Logic**: If maxPrice > 1B → billion, else → million
5. **Modified File**: [...slug].astro (main listing page, not sidebar-wrapper)

## Requirements

### Functional Requirements

1. **FR-01**: Import PriceHistoryCard in sidebar-wrapper
2. **FR-02**: Add component between Area and Dynamic filters
3. **FR-03**: Pass appropriate samplePrice prop
4. **FR-04**: Determine price unit from filter context

### Non-Functional Requirements

1. **NFR-01**: Maintain sidebar card order consistency
2. **NFR-02**: No breaking changes to existing components
3. **NFR-03**: TypeScript compatibility

## Architecture

### Sidebar Card Order (Updated)

```
sidebar-wrapper.astro
├── ContactCard (1)
├── PriceRangeFilterCard (2)
├── AreaRangeFilterCard (3)
├── PriceHistoryCard (4)      <-- NEW
├── DynamicSidebarFilters (5)
├── LocationFilterCard (6)
└── FeaturedProjectBanner (7)
```

### Props Calculation

```typescript
// In sidebar-wrapper.astro frontmatter

// Calculate sample price from filters
const samplePrice = filters.maxPrice
  ? filters.maxPrice / 1_000_000_000  // Convert VND to billions
  : 3;  // Default 3 tỷ

// Determine unit based on value
const priceUnit: 'billion' | 'million' =
  (filters.maxPrice && filters.maxPrice < 1_000_000_000)
    ? 'million'
    : 'billion';
```

## Related Code Files

### To Modify

1. **`src/components/listing/sidebar/sidebar-wrapper.astro`**
   - Add import for PriceHistoryCard
   - Add props calculation
   - Insert component in template

### Reference Files

1. `src/pages/[...slug].astro` - Source of filters prop (line 297)

## Implementation Steps

### Step 1: Add Import

Add import at top of sidebar-wrapper.astro (after existing imports):

```astro
import PriceHistoryCard from './price-history-card.astro';
```

### Step 2: Add Props Calculation

Add in frontmatter section (after destructuring):

```astro
// Calculate price history props
const samplePrice = filters.maxPrice
  ? Math.round((filters.maxPrice / 1_000_000_000) * 10) / 10  // Round to 1 decimal
  : 3;  // Default 3 tỷ

const priceUnit: 'billion' | 'million' =
  (filters.maxPrice && filters.maxPrice < 1_000_000_000)
    ? 'million'
    : 'billion';
```

### Step 3: Insert Component

Add after AreaRangeFilterCard, before DynamicSidebarFilters:

```astro
<!-- Area Range Filter -->
<AreaRangeFilterCard currentMin={filters.minArea} currentMax={filters.maxArea} />

<!-- Price History Chart -->
<PriceHistoryCard samplePrice={samplePrice} priceUnit={priceUnit} />

<!-- Dynamic Filters (context-aware) -->
{dynamicFilterBlocks.length > 0 && (
  <DynamicSidebarFilters blocks={dynamicFilterBlocks} />
)}
```

### Step 4: Complete Modified File

Updated `sidebar-wrapper.astro` (~55 lines):

```astro
---
/**
 * Sidebar Wrapper
 * Contains all sidebar widgets for listing page
 */
import type { PropertySearchFilters } from '@/services/elasticsearch/types';
import type { SidebarFilterBlock } from '@/services/sidebar-filter-service';
import type { FeaturedProject } from '@/services/featured-project-service';
import type { SideBlock } from '@/services/get-side-block-service';
import ContactCard from '@/components/shared/contact-card.astro';
import LocationFilterCard from './location-filter-card.astro';
import PriceRangeFilterCard from './price-range-filter-card.astro';
import AreaRangeFilterCard from './area-range-filter-card.astro';
import PriceHistoryCard from './price-history-card.astro';
import DynamicSidebarFilters from './dynamic-sidebar-filters.astro';
import FeaturedProjectBanner from './featured-project-banner.astro';

interface Props {
  filters: PropertySearchFilters;
  dynamicFilterBlocks?: SidebarFilterBlock[];
  featuredProjects?: FeaturedProject[];
  sideBlocks?: SideBlock[];
}

const { filters, dynamicFilterBlocks = [], featuredProjects = [], sideBlocks = [] } = Astro.props;

// Calculate price history props
const samplePrice = filters.maxPrice
  ? Math.round((filters.maxPrice / 1_000_000_000) * 10) / 10
  : 3;

const priceUnit: 'billion' | 'million' =
  (filters.maxPrice && filters.maxPrice < 1_000_000_000)
    ? 'million'
    : 'billion';
---

<div class="space-y-4">
  <!-- Quick Contact -->
  <ContactCard />

  <!-- Price Range Filter -->
  <PriceRangeFilterCard currentMin={filters.minPrice} currentMax={filters.maxPrice} />

  <!-- Area Range Filter -->
  <AreaRangeFilterCard currentMin={filters.minArea} currentMax={filters.maxArea} />

  <!-- Price History Chart -->
  <PriceHistoryCard samplePrice={samplePrice} priceUnit={priceUnit} />

  <!-- Dynamic Filters (context-aware) -->
  {dynamicFilterBlocks.length > 0 && (
    <DynamicSidebarFilters blocks={dynamicFilterBlocks} />
  )}

  <!-- Location Filter (SSR) -->
  <LocationFilterCard sideBlocks={sideBlocks} />

  <!-- Featured Projects -->
  <FeaturedProjectBanner projects={featuredProjects} />
</div>
```

## Todo List

- [ ] Add PriceHistoryCard import
- [ ] Add samplePrice calculation
- [ ] Add priceUnit calculation
- [ ] Insert component in template
- [ ] Verify import path resolves
- [ ] Run `npm run astro check`
- [ ] Test dev server renders

## Success Criteria

- [ ] No TypeScript errors
- [ ] Component appears in sidebar
- [ ] Chart renders correctly
- [ ] Price reflects filter context
- [ ] Other sidebar cards unaffected

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Import path wrong | Low | Medium | Use consistent @/ alias |
| Props type mismatch | Low | Low | Match interface |
| Layout shift | Low | Low | Test responsive |

## Security Considerations

- No new external data
- Props derived from existing filters
- No user input processing

## Next Steps

→ [Phase 5: Testing and Validation](./phase-05-testing-validation.md)
