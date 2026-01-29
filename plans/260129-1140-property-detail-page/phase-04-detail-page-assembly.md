# Phase 4: Detail Page Assembly

## Context
- Work dir: `d:\BDS\tongkho-web`
- Depends on: Phases 1-3

## Overview
- **Priority:** High
- **Status:** Pending
- **Output:** `src/pages/bat-dong-san/[slug].astro`

## Requirements
1. Dynamic route `/bat-dong-san/[slug]`
2. Fetch property by slug from mock data
3. 404 handling for invalid slugs
4. Assemble all components:
   - Image gallery
   - Property info section
   - Contact sidebar
   - Related properties
5. SEO meta tags
6. Structured data (JSON-LD)

## Implementation Steps
1. Create `src/pages/bat-dong-san/[slug].astro`
2. Import all components
3. Import mock data
4. Use `getStaticPaths()` for SSG
5. Layout: 2-column (content + sidebar)
6. Add related properties section
7. Add SEO meta tags

## Page Layout
```
┌─────────────────────────────────────────────┐
│ Header                                       │
├─────────────────────────────────────────────┤
│ Breadcrumb                                   │
├──────────────────────────┬──────────────────┤
│ Image Gallery            │ Contact Sidebar  │
│                          │ (sticky)         │
├──────────────────────────┤                  │
│ Property Info Section    │                  │
├──────────────────────────┴──────────────────┤
│ Related Properties                           │
├─────────────────────────────────────────────┤
│ Footer                                       │
└─────────────────────────────────────────────┘
```

## Code Structure
```astro
---
import MainLayout from '@/layouts/main-layout.astro';
import ImageGalleryCarousel from '@/components/property/image-gallery-carousel.astro';
import PropertyInfoSection from '@/components/property/property-info-section.astro';
import ContactSidebar from '@/components/property/contact-sidebar.astro';
import PropertyCard from '@/components/cards/property-card.astro';
import { mockPropertiesForSale, mockPropertiesForRent } from '@/data/mock-properties';

export function getStaticPaths() {
  const allProperties = [...mockPropertiesForSale, ...mockPropertiesForRent];
  return allProperties.map(property => ({
    params: { slug: property.slug },
    props: { property }
  }));
}

const { property } = Astro.props;
const allProperties = [...mockPropertiesForSale, mockPropertiesForRent];
const relatedProperties = allProperties
  .filter(p => p.id !== property.id && p.type === property.type)
  .slice(0, 4);
---
```

## SEO
- Title: `{property.title} | TongkhoBDS`
- Description: `{property.description}`
- OG image: `{property.thumbnail}`

## Success Criteria
- [ ] Route works at `/bat-dong-san/[slug]`
- [ ] All components render correctly
- [ ] 404 for invalid slugs
- [ ] Related properties show
- [ ] SEO meta tags present
- [ ] Responsive 2-column layout
