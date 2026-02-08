# Phase 5: Breadcrumb Section

## Context
[← Back to Plan](./plan.md)

Generate dynamic breadcrumb navigation based on URL structure, matching v1 logic.

## Priority
**LOW** - UI Enhancement (SEO benefit)

## Status
**Pending**

## V1 Logic Reference

From `resaland_v1/controllers/bds.py`:
```python
breadcrumbs = [
    {'text': 'Trang chủ', 'url': URL('home', 'index')}
]

# Add transaction type if different from property type
if transaction_type_title != property_type_title:
    breadcrumbs.append({
        'text': transaction_type_title,  # "Mua bán", "Cho thuê", "Dự án"
        'url': build_url({'transaction_type': transaction_type_id})
    })

# Add property type (current page, no URL)
breadcrumbs.append({'text': property_type_title, 'url': ''})
```

**Breadcrumb Structure:**
```
1. Home (always)
2. Transaction Type (if different from property type)
   - Mua bán | Cho thuê | Dự án
3. Property Type OR Location (current context)
   - Nhà đất | Căn hộ | Hà Nội | ...
4. Additional Context (optional)
   - Price range | Area range | District
```

## Examples

### Case 1: Simple transaction type
```
URL: /mua-ban
Breadcrumb: Trang chủ > Mua bán
```

### Case 2: Property type
```
URL: /nha-dat
Breadcrumb: Trang chủ > Mua bán > Nhà đất
```

### Case 3: With location
```
URL: /mua-ban/ha-noi
Breadcrumb: Trang chủ > Mua bán > Hà Nội
```

### Case 4: With price
```
URL: /mua-ban/ha-noi/gia-tu-1-ty-den-2-ty
Breadcrumb: Trang chủ > Mua bán > Hà Nội > Giá từ 1 tỷ đến 2 tỷ
```

### Case 5: Property type + location
```
URL: /nha-dat/ha-noi
Breadcrumb: Trang chủ > Mua bán > Nhà đất > Hà Nội
```

## Implementation

**File:** `src/components/listing/listing-breadcrumb.astro`

```typescript
---
import type { PropertySearchFilters } from '@/services/elasticsearch/types';

interface BreadcrumbItem {
  text: string;
  url: string;  // Empty string for current page
}

interface Props {
  filters: PropertySearchFilters;
}

const { filters } = Astro.props;

/**
 * Build breadcrumb items based on filters
 */
function buildBreadcrumbs(filters: PropertySearchFilters): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [
    { text: 'Trang chủ', url: '/' }
  ];

  // Transaction type labels
  const transactionTypeLabels: Record<number, string> = {
    1: 'Mua bán',
    2: 'Cho thuê',
    3: 'Dự án'
  };

  const transactionLabel = transactionTypeLabels[filters.transactionType] || 'Mua bán';
  const transactionSlug = getTransactionSlug(filters.transactionType);

  // Check if we have property type
  const hasPropertyType = filters.propertyTypes && filters.propertyTypes.length === 1;

  if (hasPropertyType) {
    const propertyTypeId = filters.propertyTypes[0];
    const propertyTypeName = getPropertyTypeName(propertyTypeId);

    // Add transaction type first
    breadcrumbs.push({
      text: transactionLabel,
      url: `/${transactionSlug}`
    });

    // Add property type
    breadcrumbs.push({
      text: propertyTypeName,
      url: '' // Current page, no link
    });
  } else {
    // Just transaction type
    breadcrumbs.push({
      text: transactionLabel,
      url: '' // Current page
    });
  }

  // Add location if exists
  if (filters.provinceIds && filters.provinceIds.length > 0) {
    const provinceId = filters.provinceIds[0];
    const provinceName = getProvinceName(provinceId);

    breadcrumbs.push({
      text: provinceName,
      url: '' // Can make it linkable if needed
    });
  }

  // Add price range if exists
  if (filters.minPrice || filters.maxPrice) {
    const priceText = formatPriceRange(filters.minPrice, filters.maxPrice);
    breadcrumbs.push({
      text: priceText,
      url: ''
    });
  }

  return breadcrumbs;
}

/**
 * Helper functions
 */
function getTransactionSlug(type: number): string {
  const slugs: Record<number, string> = {
    1: 'mua-ban',
    2: 'cho-thue',
    3: 'du-an'
  };
  return slugs[type] || 'mua-ban';
}

function getPropertyTypeName(id: number): string {
  // TODO: Lookup from static data or prop
  // For now, return placeholder
  return `Loại hình ${id}`;
}

function getProvinceName(id: number): string {
  // TODO: Lookup from PROVINCE_BY_ID map
  return `Tỉnh ${id}`;
}

function formatPriceRange(min?: number, max?: number): string {
  if (!min && !max) return '';

  if (min === 0 && max === 0) {
    return 'Giá thương lượng';
  }

  const formatPrice = (price: number) => {
    if (price >= 1000000000) {
      const ty = price / 1000000000;
      return `${ty.toFixed(1).replace(/\.0$/, '')} tỷ`;
    }
    const trieu = price / 1000000;
    return `${trieu} triệu`;
  };

  if (min && !max) {
    return `Giá từ ${formatPrice(min)}`;
  }

  if (!min && max) {
    return `Giá dưới ${formatPrice(max)}`;
  }

  return `Giá từ ${formatPrice(min!)} đến ${formatPrice(max!)}`;
}

const breadcrumbItems = buildBreadcrumbs(filters);
---

<nav aria-label="Breadcrumb" class="breadcrumb-container">
  <ol
    class="breadcrumb"
    itemscope
    itemtype="https://schema.org/BreadcrumbList"
  >
    {breadcrumbItems.map((item, index) => (
      <li
        class="breadcrumb-item"
        itemprop="itemListElement"
        itemscope
        itemtype="https://schema.org/ListItem"
      >
        {item.url ? (
          <a
            href={item.url}
            class="breadcrumb-link"
            itemprop="item"
          >
            <span itemprop="name">{item.text}</span>
          </a>
        ) : (
          <span
            class="breadcrumb-current"
            itemprop="name"
          >
            {item.text}
          </span>
        )}
        <meta itemprop="position" content={String(index + 1)} />
      </li>
    ))}
  </ol>
</nav>

<style>
  .breadcrumb-container {
    padding: 1rem 0;
    background: #f8f9fa;
  }

  .breadcrumb {
    display: flex;
    flex-wrap: wrap;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 0.5rem;
  }

  .breadcrumb-item:not(:last-child)::after {
    content: '>';
    margin-left: 0.5rem;
    color: #6c757d;
  }

  .breadcrumb-link {
    color: #007bff;
    text-decoration: none;
  }

  .breadcrumb-link:hover {
    text-decoration: underline;
  }

  .breadcrumb-current {
    color: #6c757d;
  }
</style>
```

## Schema.org Structured Data

**BreadcrumbList JSON-LD:**

```typescript
// Generate in page
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": breadcrumbItems.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.text,
    "item": item.url ? `https://tongkhobds.com${item.url}` : undefined
  }))
};
```

**In page head:**
```html
<script type="application/ld+json">
  {JSON.stringify(breadcrumbSchema)}
</script>
```

## Related Code Files

**From V1 (Reference):**
- `resaland_v1/controllers/bds.py` (line 650-660) - Breadcrumb logic
- `resaland_v1/views/components/breadcrumbs.html` - Component template

**To Create:**
- `src/components/listing/listing-breadcrumb.astro`
- `src/utils/breadcrumb-builder.ts` (helper functions)

## Todo List

- [ ] Create breadcrumb component (Astro)
- [ ] Implement buildBreadcrumbs() function
- [ ] Add helper functions:
  - [ ] getTransactionSlug()
  - [ ] getPropertyTypeName() (lookup from data)
  - [ ] getProvinceName() (lookup from PROVINCE_BY_ID)
  - [ ] formatPriceRange()
- [ ] Add Schema.org BreadcrumbList structured data
- [ ] Style with Tailwind CSS
- [ ] Test all breadcrumb variations:
  - [ ] /mua-ban
  - [ ] /nha-dat
  - [ ] /mua-ban/ha-noi
  - [ ] /mua-ban/ha-noi/gia-tu-1-ty-den-2-ty
- [ ] Test clickable links navigation
- [ ] Mobile responsive styling
- [ ] Verify SEO markup (check with Google Rich Results Test)

## Success Criteria

- [ ] Breadcrumb matches URL structure
- [ ] Follows v1 logic (transaction type → property type → location → price)
- [ ] All links clickable (except current page)
- [ ] Schema.org BreadcrumbList markup valid
- [ ] Mobile responsive (wraps properly on small screens)
- [ ] Matches design system colors
- [ ] No hydration errors (pure Astro component)

## Risk Assessment

**Low Risk:**
- Simple component, no complex state
- Pure server-side rendering
- Well-defined v1 logic

**Mitigation:**
- Test with all URL patterns
- Ensure property type and province lookups work

## Security Considerations

- No user input in breadcrumb
- URLs are server-generated (safe)
- Schema.org markup is static (no injection risk)

## Performance

- **Zero JavaScript:** Pure HTML + CSS
- **Build-time generation:** No runtime overhead
- **SEO benefit:** Rich snippets in Google search

## Next Steps

After Phase 5 completion:
→ **Phase 7:** Interactive Features (favorites, compare, share)

---

## Notes

- Breadcrumb is purely informational (navigation aid)
- Current page has no link (text only)
- Can extend to show district, ward in future
- Schema.org markup improves search appearance
