# Phase 6: Listing Section & Pagination

## Context
[← Back to Plan](./plan.md)

Display property cards grid with sorting, result count, and pagination.

## Priority
**HIGH** - Core Feature

## Status
**Pending**

## Components

### 1. Result Header
```
Danh sách bất động sản (1,234 kết quả)
[Sort Dropdown: Mới nhất ▼]
```

### 2. Property Cards Grid
- Use existing `property-card.astro`
- Grid layout: 3 columns desktop, 2 tablet, 1 mobile
- Show: image, title, price, area, location, bedrooms, bathrooms
- Posted time: "6 giờ trước", "1 ngày trước"

### 3. Pagination
```
← Trang trước [1] 2 3 4 5 ... 10 Trang sau →
```

## Implementation

```typescript
// src/components/listing/listing-grid.astro
---
import PropertyCard from '@/components/cards/property-card.astro';
import { formatRelativeTime } from '@/utils/format';

const { properties, total, filters } = Astro.props;
---

<div class="listing-section">
  <div class="listing-header">
    <h1>Danh sách bất động sản ({total.toLocaleString('vi-VN')} kết quả)</h1>

    <select id="sort-select" onchange="handleSortChange(this.value)">
      <option value="newest" selected={filters.sort === 'newest'}>Mới nhất</option>
      <option value="price_asc" selected={filters.sort === 'price_asc'}>Giá thấp đến cao</option>
      <option value="price_desc" selected={filters.sort === 'price_desc'}>Giá cao đến thấp</option>
      <option value="area_asc" selected={filters.sort === 'area_asc'}>Diện tích nhỏ đến lớn</option>
      <option value="area_desc" selected={filters.sort === 'area_desc'}>Diện tích lớn đến nhỏ</option>
    </select>
  </div>

  <div class="property-grid">
    {properties.map(property => (
      <PropertyCard
        property={property}
        postedTime={formatRelativeTime(property.created_on)}
      />
    ))}
  </div>

  {properties.length === 0 && (
    <div class="no-results">
      <p>Không tìm thấy bất động sản phù hợp</p>
    </div>
  )}
</div>

<script>
function handleSortChange(sort: string) {
  const url = new URL(window.location.href);
  url.searchParams.set('sort', sort);
  url.searchParams.set('page', '1'); // Reset to page 1
  window.location.href = url.toString();
}
</script>
```

## Pagination Component

```typescript
// src/components/listing/listing-pagination.astro
---
interface Props {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
}

const { currentPage, totalItems, itemsPerPage } = Astro.props;
const totalPages = Math.ceil(totalItems / itemsPerPage);

// Generate page numbers (show max 7 pages)
function getPageNumbers() {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '...', totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
}

const pageNumbers = getPageNumbers();
---

<div class="pagination">
  {currentPage > 1 && (
    <a href={`?page=${currentPage - 1}`} class="pagination-link">
      ← Trang trước
    </a>
  )}

  {pageNumbers.map(page => (
    page === '...' ? (
      <span class="pagination-ellipsis">...</span>
    ) : (
      <a
        href={`?page=${page}`}
        class={`pagination-link ${page === currentPage ? 'active' : ''}`}
      >
        {page}
      </a>
    )
  ))}

  {currentPage < totalPages && (
    <a href={`?page=${currentPage + 1}`} class="pagination-link">
      Trang sau →
    </a>
  )}
</div>
```

## Todo List

- [ ] Create listing-grid component
- [ ] Add sort dropdown with URL update
- [ ] Display property cards in grid
- [ ] Add "no results" message
- [ ] Create pagination component
- [ ] Test pagination navigation
- [ ] Add loading states
- [ ] Optimize for mobile

## Success Criteria

- [ ] Grid displays properties correctly
- [ ] Sort updates URL and re-renders
- [ ] Pagination works (20 items/page)
- [ ] Result count accurate
- [ ] Posted time formatting correct
- [ ] Mobile responsive grid
- [ ] Performance: <2s page load

## Next Steps

→ **Phase 7:** Interactive Features (favorites, compare, share)
