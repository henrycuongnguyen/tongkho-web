# Phase 1: Responsive Audit & Fixes

## Context Links
- [plan.md](./plan.md)
- [global.css](../../src/styles/global.css) - existing responsive utilities
- [Tailwind breakpoints](https://tailwindcss.com/docs/responsive-design) - sm:640px, md:768px, lg:1024px

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 1.5h
- **Description:** Audit and fix responsive issues across all homepage sections for mobile (<640px), tablet (640-1024px), desktop (>1024px)

## Key Insights
- Most components already use Tailwind responsive prefixes (sm, md, lg)
- `global.css` has custom media queries for location-grid
- Touch target minimum: 44x44px (WCAG 2.1 AAA)
- Primary issues expected: hero search overflow, carousel navigation, download section overlap

## Requirements

### Functional
- All content readable on all breakpoints
- No horizontal scrollbar
- Interactive elements have adequate touch targets
- Images scale proportionally

### Non-functional
- Tailwind-only (no custom CSS unless necessary)
- Performance: no layout shifts (CLS < 0.1)

---

## Section-by-Section Audit

### 1. Header (header.astro)

**Current State:**
- Desktop nav hidden below xl (1280px)
- Mobile menu button appears below xl
- Logo height: h-10 lg:h-12

**Issues to Check:**
- [ ] Logo touch target on mobile (should be 44px min)
- [ ] Mobile menu button size (currently p-2, icon w-6 h-6)
- [ ] Header height consistency (h-16 lg:h-20)

**Fixes:**
```astro
<!-- Increase mobile menu button touch area -->
<button class="xl:hidden p-3 -m-1 text-secondary-700..." />
<!-- Logo wrapper for larger touch target -->
<a href="/" class="flex items-center min-h-11 min-w-11">
```

---

### 2. Hero Section (hero-section.astro)

**Current State:**
- min-h-[600px] lg:min-h-[700px]
- Text: text-4xl md:text-5xl lg:text-6xl
- Content width: w-5xl (fixed)

**Issues:**
- [ ] `w-5xl` is fixed 64rem - may overflow on mobile
- [ ] No horizontal padding inside content wrapper

**Fixes:**
```astro
<!-- Change fixed width to responsive -->
<div class="relative z-9999 w-full max-w-5xl mx-auto px-4 text-center...">
```

---

### 3. Hero Search (hero-search.astro)

**Current State:**
- max-w-7xl with px-4
- Tabs: gap-1.5, px-4 py-2
- Main input row: rounded-full border
- Filters: flex-col md:flex-row

**Issues:**
- [ ] Location dropdown `min-w-32` may be too wide on small screens
- [ ] Search button text hidden on mobile (good)
- [ ] Touch targets on tabs (px-4 py-2 = ~32px height)

**Fixes:**
```astro
<!-- Tabs - increase vertical padding for touch targets -->
<button class="tab-btn px-4 py-2.5 min-h-11 rounded-full..." />

<!-- Location dropdown - responsive min-width -->
<div class="border-r border-secondary-200 min-w-24 sm:min-w-32">

<!-- Main search row - stack on very small screens -->
<div class="relative flex flex-col sm:flex-row items-stretch sm:items-center...">
```

---

### 4. Featured Project Section (featured-project-section.astro)

**Current State:**
- Carousel with lg:grid-cols-2
- Image stack: absolute positioning
- Navigation buttons: absolute positioned

**Issues:**
- [ ] Image stack layout on mobile (w-[65%] and w-[70%] overlap)
- [ ] Navigation buttons position on mobile (top-[190px] lg:top-[225px])
- [ ] Stats grid: grid-cols-3 may be cramped on mobile
- [ ] CTA button text length

**Fixes:**
```astro
<!-- Image container - adjust heights for mobile -->
<div class="relative h-[320px] sm:h-[380px] lg:h-[450px]">

<!-- Navigation buttons - adjust for mobile -->
<button class="absolute top-[160px] sm:top-[190px] lg:top-[225px]..." />

<!-- Stats - slightly smaller icons on mobile -->
<div class="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16..." />
```

---

### 5. Properties Section (properties-section.astro)

**Current State:**
- Grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
- Section header: flex items-center justify-between

**Issues:**
- [ ] "Xem them" link may wrap on mobile
- [ ] Gap: gap-6 lg:gap-8 is good

**Fixes:**
```astro
<!-- Header - wrap on mobile -->
<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
```

---

### 6. Locations Section (locations-section.astro)

**Current State:**
- Custom CSS grid in global.css
- Media queries at 1024px and 640px
- Row heights: 140px, 120px, 100px

**Issues:**
- [ ] Verify location-grid CSS is applying correctly
- [ ] Check text visibility on small cards

**Fixes (in global.css if needed):**
```css
/* Already has responsive rules - verify functioning */
@media (max-width: 640px) {
  .location-grid {
    grid-template-rows: repeat(2, 120px); /* Increase from 100px */
  }
}
```

---

### 7. Partners Section (partners-section.astro)

**Current State:**
- Infinite scroll with gap-8
- Partner items: min-width: 180px, h-16 logo

**Issues:**
- [ ] gap-8 may be too large on mobile
- [ ] Partner item min-width may cause overflow

**Fixes:**
```astro
<!-- Reduce gap on mobile -->
<div class="partners-track flex items-center gap-4 sm:gap-8">

<!-- Partner item - responsive sizing -->
<a class="partner-item flex-shrink-0 bg-white rounded-xl p-3 sm:p-4...">
  <img class="h-12 sm:h-16 w-auto..." />
</a>
```

**CSS update (global.css):**
```css
.partner-item {
  min-width: 140px;
}
@media (min-width: 640px) {
  .partner-item {
    min-width: 180px;
  }
}
```

---

### 8. Download App Section (download-app-section.astro)

**Current State:**
- Grid: grid-cols-1 lg:grid-cols-2
- Left panel: lg:pr-70 min-h-100
- Right panel: lg:pl-55 min-h-85
- Center phones: hidden lg:flex

**Issues:**
- [ ] `lg:pr-70` and `lg:pl-55` - large padding may not be needed on tablet
- [ ] `mt-36` for QR section - too much on mobile
- [ ] Background images may overlap content

**Fixes:**
```astro
<!-- Adjust spacing for mobile -->
<div class="flex items-end gap-4 mt-20 sm:mt-28 lg:mt-36 relative z-10">

<!-- Reduce left padding on tablet -->
<div class="bg-[#f1913d] rounded-2xl ... p-6 sm:p-8 lg:pr-70 min-h-80 sm:min-h-100...">

<!-- Stack QR and buttons vertically on very small screens -->
<div class="flex flex-col sm:flex-row items-start sm:items-end gap-4...">
```

---

### 9. News Section (news-section.astro)

**Current State:**
- Grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
- Gap: gap-5 lg:gap-6
- Image aspect ratio: aspect-[16/10]

**Issues:**
- [ ] Same header pattern as properties section
- [ ] Card content padding: p-4 is adequate

**Fixes:**
```astro
<!-- Header - wrap on mobile (same as properties) -->
<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
```

---

### 10. Footer (footer.astro)

**Current State:**
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-5
- Company info: lg:col-span-2
- Copyright: flex-col md:flex-row

**Issues:**
- [ ] Address text may be too long on mobile
- [ ] Social icons touch targets (w-10 h-10 = 40px, should be 44px)

**Fixes:**
```astro
<!-- Social icons - increase size for touch -->
<a class="w-11 h-11 flex items-center justify-center rounded-full..." />
```

---

## Implementation Steps

1. **Header** - increase touch targets (5 min)
2. **Hero Section** - fix content width overflow (5 min)
3. **Hero Search** - responsive input layout, touch targets (15 min)
4. **Featured Project** - carousel mobile layout (20 min)
5. **Properties Section** - header wrap pattern (5 min)
6. **Locations Section** - verify CSS grid (5 min)
7. **Partners Section** - responsive gap and sizing (10 min)
8. **Download App** - mobile spacing adjustments (15 min)
9. **News Section** - header wrap pattern (5 min)
10. **Footer** - touch targets (5 min)
11. **Test** - run `npm run build`, check all breakpoints (10 min)

---

## Todo List

- [ ] Fix header mobile menu button touch target
- [ ] Fix hero section content width
- [ ] Fix hero search responsive layout
- [ ] Fix featured project carousel mobile layout
- [ ] Fix properties section header wrap
- [ ] Verify locations grid CSS
- [ ] Fix partners section responsive sizing
- [ ] Fix download app section mobile spacing
- [ ] Fix news section header wrap
- [ ] Fix footer social icons touch targets
- [ ] Run npm run build
- [ ] Test on mobile/tablet/desktop breakpoints

---

## Success Criteria

- [ ] No horizontal scroll on 320px width
- [ ] All buttons/links >= 44px touch target
- [ ] Text readable without zooming
- [ ] Images don't overflow containers
- [ ] Build passes without errors

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing layout | Low | Medium | Test after each section |
| CSS conflicts | Low | Low | Use Tailwind utilities only |
| Carousel JS issues | Low | Medium | Don't modify JS, only CSS |

---

## Security Considerations
- N/A (CSS-only changes)

---

## Next Steps
- After completion, proceed to [Phase 2: JSON-LD Structured Data](./phase-02-json-ld-structured-data.md)
