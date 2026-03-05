---
title: "Phase 1: Property Detail Breadcrumbs Component"
status: completed
effort: 2h
completed: 2026-03-03
---

# Phase 1: Property Detail Breadcrumbs Component

## Context Links

- v1 Reference: `reference/resaland_v1/controllers/bds.py:962-1023` (build_breadcrumbs_for_property_detail)
- v1 Template: `reference/resaland_v1/views/components/breadcrumbs.html`
- Current v2: `src/pages/bds/[slug].astro:142-154`
- Listing breadcrumb (for reference): `src/components/listing/listing-breadcrumb.astro`

## Overview

Fix property detail breadcrumbs to match v1 hierarchy structure.

**Priority:** P2
**Current Status:** Pending

## Key Insights

### v1 Breadcrumb Hierarchy

```
Trang chủ > Mua Bán > Căn hộ > Hà Nội > Quận Cầu Giấy > Phường Dịch Vọng
    │          │         │        │           │              │
    │          │         │        │           │              └─ Ward (no link, current)
    │          │         │        │           └─ District link
    │          │         │        └─ City link
    │          │         └─ Property type link
    │          └─ Transaction type link
    └─ Home link
```

### v1 URL Building Pattern

```python
# Transaction type URL
URL('bds', 'danhmuc', args=code)  # → /mua-ban, /cho-thue

# Property type URL
URL('bds', 'danhmuc', args=type['slug'])  # → /ban-can-ho-chung-cu

# Location URLs (uses query param)
build_url({'selected_addresses': city_slug})  # → /mua-ban?selected_addresses=ha-noi
```

### Current v2 Problem

```astro
<!-- Current broken implementation -->
<li><a href="/">Trang chủ</a></li>
<li><a href="/mua-ban">Mua bán</a></li>
<li>{property.title}</li>  <!-- Missing property type, city, district, ward -->
```

## Requirements

### Functional
- Show full hierarchy: Home > Transaction > Property Type > City > District > Ward
- Property type links to listing filtered by type
- Location links use `selected_addresses` query param
- Last item (ward or district) has no link
- Match v1 visual style: `>` separator

### Non-Functional
- Reusable component for property and project detail pages
- Schema.org BreadcrumbList structured data
- Graceful degradation if location data missing

## Architecture

### Component Interface

```typescript
interface PropertyDetailBreadcrumbProps {
  transactionType: 'sale' | 'rent';  // Maps to 1, 2
  propertyTypeId?: number;
  propertyTypeName?: string;
  propertyTypeSlug?: string;
  cityId?: string;
  cityName?: string;
  citySlug?: string;
  districtId?: string;
  districtName?: string;
  districtSlug?: string;
  wardId?: string;
  wardName?: string;
  wardSlug?: string;
}
```

### URL Building Logic

```typescript
// Transaction type base
const txBase = transactionType === 'sale' ? '/mua-ban' : '/cho-thue';

// Property type URL (uses slug directly, not nested)
const propertyTypeUrl = propertyTypeSlug ? `/${propertyTypeSlug}` : txBase;

// Location URLs (append selected_addresses param)
const cityUrl = citySlug ? `${propertyTypeUrl}?selected_addresses=${citySlug}` : '';
const districtUrl = districtSlug ? `${propertyTypeUrl}?selected_addresses=${districtSlug}` : '';
const wardUrl = wardSlug ? `${propertyTypeUrl}?selected_addresses=${wardSlug}` : '';
```

## Related Code Files

### Files to Create
- `src/components/property/property-detail-breadcrumb.astro` - New reusable component

### Files to Modify
- `src/pages/bds/[slug].astro` - Replace inline breadcrumb with component
- `src/pages/du-an/[slug].astro` - Replace inline breadcrumb with component

### Files to Reference (no changes)
- `src/db/schema/menu.ts` - propertyType table
- `src/db/schema/location.ts` - locations table
- `src/components/listing/listing-breadcrumb.astro` - Schema.org pattern

## Implementation Steps

### Step 1: Create Breadcrumb Component

Create `src/components/property/property-detail-breadcrumb.astro`:

```astro
---
/**
 * Property Detail Breadcrumb
 * v1-compatible hierarchy: Home > Transaction > Property Type > City > District > Ward
 */
interface Props {
  transactionType: 'sale' | 'rent';
  propertyTypeId?: number;
  propertyTypeName?: string;
  propertyTypeSlug?: string;
  cityName?: string;
  citySlug?: string;
  districtName?: string;
  districtSlug?: string;
  wardName?: string;
  wardSlug?: string;
}

interface BreadcrumbItem {
  text: string;
  url: string;  // Empty string = no link (current page)
}

const {
  transactionType,
  propertyTypeId,
  propertyTypeName,
  propertyTypeSlug,
  cityName,
  citySlug,
  districtName,
  districtSlug,
  wardName,
  wardSlug,
} = Astro.props;

// Build breadcrumb items
const items: BreadcrumbItem[] = [];

// 1. Home
items.push({ text: 'Trang chủ', url: '/' });

// 2. Transaction type
const txLabel = transactionType === 'sale' ? 'Mua Bán' : 'Cho Thuê';
const txSlug = transactionType === 'sale' ? 'mua-ban' : 'cho-thue';
const txUrl = `/${txSlug}`;
items.push({ text: txLabel, url: txUrl });

// 3. Property type (if available)
if (propertyTypeName && propertyTypeSlug) {
  items.push({
    text: propertyTypeName,
    url: `/${propertyTypeSlug}`
  });
}

// Base URL for location links (property type or transaction)
const baseUrl = propertyTypeSlug ? `/${propertyTypeSlug}` : txUrl;

// 4. City (if available)
if (cityName && citySlug) {
  items.push({
    text: cityName,
    url: districtSlug || wardSlug ? `${baseUrl}?selected_addresses=${citySlug}` : ''
  });
}

// 5. District (if available)
if (districtName && districtSlug) {
  items.push({
    text: districtName,
    url: wardSlug ? `${baseUrl}?selected_addresses=${districtSlug}` : ''
  });
}

// 6. Ward (if available) - always no link (current level)
if (wardName) {
  items.push({ text: wardName, url: '' });
}

// Schema.org BreadcrumbList
const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'https://tongkhobds.com';
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.text,
    ...(item.url ? { "item": `${siteUrl}${item.url}` } : {})
  }))
};
---

<!-- Schema.org Structured Data -->
<script type="application/ld+json" set:html={JSON.stringify(breadcrumbSchema)} />

<!-- Breadcrumb Navigation -->
<nav class="text-sm text-secondary-500" aria-label="Breadcrumb">
  <ol class="flex flex-wrap items-center gap-2">
    {items.map((item, index) => (
      <li class="flex items-center">
        {item.url ? (
          <a href={item.url} class="hover:text-primary-500 transition-colors">
            {item.text}
          </a>
        ) : (
          <span class="text-secondary-700 font-medium">{item.text}</span>
        )}

        {index < items.length - 1 && (
          <span class="text-secondary-300 mx-2">&gt;</span>
        )}
      </li>
    ))}
  </ol>
</nav>
```

### Step 2: Update Property Detail Page

Modify `src/pages/bds/[slug].astro`:

1. Import the new component
2. Fetch property type details (slug, name) from database
3. Replace inline breadcrumb with component

```astro
---
// Add import
import PropertyDetailBreadcrumb from '@/components/property/property-detail-breadcrumb.astro';

// ... existing code ...

// Fetch property type details for breadcrumb
let propertyTypeData: { slug: string | null; vietnamese: string | null } | null = null;
if (property.propertyTypeId) {
  const result = await db
    .select({ slug: propertyType.slug, vietnamese: propertyType.vietnamese })
    .from(propertyType)
    .where(eq(propertyType.id, property.propertyTypeId))
    .limit(1);
  propertyTypeData = result[0] || null;
}

// Fetch location slugs for breadcrumb
let citySlug: string | null = null;
let districtSlug: string | null = null;
let wardSlug: string | null = null;

if (property.cityId) {
  const city = await db.select({ slug: locations.nSlugV1 })
    .from(locations).where(eq(locations.nId, property.cityId)).limit(1);
  citySlug = city[0]?.slug || null;
}
if (property.districtId) {
  const district = await db.select({ slug: locations.nSlugV1 })
    .from(locations).where(eq(locations.nId, property.districtId)).limit(1);
  districtSlug = district[0]?.slug || null;
}
if (property.wardId) {
  const ward = await db.select({ slug: locations.nSlugV1 })
    .from(locations).where(eq(locations.nId, property.wardId)).limit(1);
  wardSlug = ward[0]?.slug || null;
}
---

<!-- Replace inline breadcrumb with component -->
<PropertyDetailBreadcrumb
  transactionType={property.transactionType}
  propertyTypeId={property.propertyTypeId}
  propertyTypeName={propertyTypeData?.vietnamese || undefined}
  propertyTypeSlug={propertyTypeData?.slug || undefined}
  cityName={property.city}
  citySlug={citySlug || undefined}
  districtName={property.district}
  districtSlug={districtSlug || undefined}
  wardName={property.ward}
  wardSlug={wardSlug || undefined}
/>
```

### Step 3: Update Project Detail Page

Similar changes for `src/pages/du-an/[slug].astro`:

```astro
---
import PropertyDetailBreadcrumb from '@/components/property/property-detail-breadcrumb.astro';
---

<!-- Replace inline breadcrumb -->
<PropertyDetailBreadcrumb
  transactionType="sale"  <!-- Projects use transaction type 3, but link to mua-ban -->
  propertyTypeName="Dự Án"
  propertyTypeSlug="du-an"
  cityName={project.city}
  citySlug={project.citySlug}
  districtName={project.district}
  districtSlug={project.districtSlug}
  wardName={project.ward}
  wardSlug={project.wardSlug}
/>
```

## Todo List

- [x] Create `property-detail-breadcrumb.astro` component
- [x] Update `bds/[slug].astro` to fetch property type data
- [x] Update `bds/[slug].astro` to fetch location slugs
- [x] Replace inline breadcrumb in `bds/[slug].astro`
- [x] Update `du-an/[slug].astro` breadcrumb
- [x] Test breadcrumb links navigate correctly
- [x] Verify Schema.org structured data in page source

## Success Criteria

- [x] Breadcrumb shows: `Trang chủ > Mua Bán > Căn hộ chung cư > Hà Nội > Quận Cầu Giấy`
- [x] Each item except last links to correct listing page
- [x] Property type link uses direct slug (`/ban-can-ho-chung-cu`)
- [x] Location links use `selected_addresses` param
- [x] Schema.org BreadcrumbList JSON-LD present in page source
- [x] Project detail page shows: `Trang chủ > Dự Án > [Location hierarchy]`

## Completion Status

**COMPLETED - 2026-03-03**

### Implementation Summary

**Component Created:** `src/components/property/property-detail-breadcrumb.astro`
- Full v1-compatible breadcrumb hierarchy support
- Handles transaction type, property type, and location hierarchy (city > district > ward)
- Schema.org BreadcrumbList structured data included
- Graceful degradation for missing location data
- Reusable for both property and project detail pages

**Files Updated:**
1. `src/pages/bds/[slug].astro` - Integrated breadcrumb with property data fetching
2. `src/pages/du-an/[slug].astro` - Integrated breadcrumb with project data

**Tested & Verified:**
- All breadcrumb hierarchy levels displaying correctly
- Links navigate to correct listing pages
- Schema.org JSON-LD present in page source
- Works with complete and partial location data
- No build errors (TypeScript compilation successful)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing property type data | Medium | Fallback to transaction type only |
| Missing location slugs | Low | Skip location levels gracefully |
| URL format mismatch | Medium | Test against v1 URLs manually |

## Testing Approach

1. Load property detail page with full location data
2. Verify all breadcrumb levels display
3. Click each link and verify correct listing page loads
4. Test property missing some location levels (no ward, no district)
5. Check page source for Schema.org JSON-LD
6. Compare URLs with v1 site
