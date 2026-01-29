# Phase 2: Property Info Section Component

## Context
- Work dir: `d:\BDS\tongkho-web`
- Data model: `Property` from `@/types/property`
- Utilities: `formatPrice`, `formatRelativeTime` from `@/utils/format`

## Overview
- **Priority:** High
- **Status:** Pending
- **Output:** `src/components/property/property-info-section.astro`

## Requirements
1. Property title (h1)
2. Price display with price per m2
3. Property specs: area, bedrooms, bathrooms
4. Location: address, district, city
5. Posted time (relative)
6. Property type badge
7. Transaction type badge (Bán/Cho thuê)
8. Features list with icons
9. Description section (expandable if long)
10. Breadcrumb navigation

## Implementation Steps
1. Create `property-info-section.astro`
2. Props: `property: Property`
3. Import formatPrice, formatRelativeTime utilities
4. Create specs grid layout
5. Create features tags
6. Style with Tailwind

## Component Sections
```
├── Breadcrumb (Home > Mua bán > Nhà phố > ...)
├── Title (h1)
├── Badges (type, transaction, hot, featured)
├── Price section
│   ├── Main price
│   └── Price per m2
├── Specs grid
│   ├── Area
│   ├── Bedrooms
│   ├── Bathrooms
│   └── Posted time
├── Location
├── Features tags
└── Description (with "Xem thêm" toggle)
```

## Styling
- Title: text-2xl md:text-3xl font-bold
- Price: text-primary-500 text-3xl font-bold
- Specs: grid grid-cols-2 md:grid-cols-4
- Features: flex flex-wrap gap-2

## Success Criteria
- [ ] All property info displays correctly
- [ ] Price formatted in Vietnamese (tỷ/triệu)
- [ ] Responsive layout
- [ ] Features display as tags
- [ ] Description expandable if >300 chars
