# Property Detail Page Implementation Plan

## Overview
Implement property listing detail page at `/bat-dong-san/[slug]` based on reference design from tongkhobds.com.

## Reference
- URL: https://tongkhobds.com/bds/nha-pho-tai-hem-103-chien-luoc-quan-binh-tan-gia-65-ty-san-sang-vao-o-ngay-6215784
- Design: Vietnamese real estate detail page with image gallery, property info, contact sidebar, related listings

## Dependency Graph
```
Phase 1 (Image Gallery)     ─┐
Phase 2 (Property Info)     ─┼─→ Phase 4 (Detail Page Assembly)
Phase 3 (Contact Sidebar)   ─┘
```

## Execution Strategy
- **Parallel:** Phases 1-3 (independent components)
- **Sequential:** Phase 4 (depends on 1-3)

## File Ownership Matrix
| Phase | Files | Owner |
|-------|-------|-------|
| 1 | `src/components/property/image-gallery.astro` | Agent 1 |
| 2 | `src/components/property/property-info.astro` | Agent 2 |
| 3 | `src/components/property/contact-sidebar.astro` | Agent 3 |
| 4 | `src/pages/bat-dong-san/[slug].astro` | Sequential |

## Phases

### Phase 1: Image Gallery Component
- **Status:** Completed
- **File:** [phase-01-image-gallery-carousel-component.md](phase-01-image-gallery-carousel-component.md)
- **Output:** `src/components/property/property-detail-image-gallery-carousel.astro`

### Phase 2: Property Info Component
- **Status:** Completed
- **File:** [phase-02-property-info-section-component.md](phase-02-property-info-section-component.md)
- **Output:** `src/components/property/property-info-section.astro`

### Phase 3: Contact Sidebar Component
- **Status:** Completed
- **File:** [phase-03-contact-sidebar-component.md](phase-03-contact-sidebar-component.md)
- **Output:** `src/components/property/contact-sidebar.astro`

### Phase 4: Detail Page Assembly
- **Status:** Completed
- **File:** [phase-04-detail-page-assembly.md](phase-04-detail-page-assembly.md)
- **Output:** `src/pages/bat-dong-san/[slug].astro`
- **Depends on:** Phases 1-3
- **Reuses:** `src/components/cards/property-card.astro` for related properties

## Tech Stack
- Astro 5.2 + TypeScript
- Tailwind CSS 3.4
- Existing utilities: formatPrice, formatRelativeTime

## Data Model
Uses existing `Property` interface from `@/types/property`
