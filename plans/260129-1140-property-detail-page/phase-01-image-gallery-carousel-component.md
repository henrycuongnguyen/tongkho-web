# Phase 1: Image Gallery Carousel Component

## Context
- Work dir: `d:\BDS\tongkho-web`
- Data: `Property.images: string[]`, `Property.thumbnail: string`

## Overview
- **Priority:** High
- **Status:** Pending
- **Output:** `src/components/property/image-gallery-carousel.astro`

## Requirements
1. Main image display (large, 16:9 aspect ratio)
2. Thumbnail strip below main image
3. Previous/Next navigation arrows
4. Image counter badge (e.g., "1/10")
5. Click thumbnail to switch main image
6. Responsive: full-width on mobile, max-width on desktop
7. Lazy loading for performance

## Implementation Steps
1. Create `src/components/property/` directory if not exists
2. Create `image-gallery-carousel.astro` component
3. Props: `images: string[]`
4. Use CSS-only carousel (no JS dependencies for Astro SSG)
5. Add thumbnail navigation
6. Style with Tailwind

## Component Structure
```astro
---
interface Props {
  images: string[];
}
const { images } = Astro.props;
---
<div class="image-gallery">
  <div class="main-image">...</div>
  <div class="thumbnails">...</div>
  <div class="nav-arrows">...</div>
  <div class="image-counter">...</div>
</div>
```

## Styling
- Primary bg: white
- Border radius: rounded-xl
- Shadow: shadow-lg
- Thumbnail: 80x60px, border on active

## Success Criteria
- [ ] Main image displays correctly
- [ ] Thumbnails clickable and switch image
- [ ] Navigation arrows work
- [ ] Image counter shows current/total
- [ ] Responsive on mobile/tablet/desktop
