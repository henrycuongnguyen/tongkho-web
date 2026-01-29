---
title: "Responsive Homepage + SEO Compliance"
description: "Full responsive audit for all homepage sections + JSON-LD schema + semantic HTML review"
status: completed
priority: P2
effort: 3h
branch: main
tags: [responsive, seo, homepage, tailwind]
created: 2026-01-29
---

# Responsive Homepage + SEO Compliance

## Overview

This plan covers three key areas for the TongkhoBDS.com homepage:
1. **Responsive audit & fixes** - ensure all sections render correctly across mobile (<640px), tablet (640-1024px), and desktop (>1024px)
2. **JSON-LD structured data** - add schema.org markup for SEO
3. **Semantic HTML audit** - verify heading hierarchy, landmarks, alt texts, ARIA labels

## Current State Analysis

### Components to Audit (8 sections + header/footer)
| Component | LOC | Status | Notes |
|-----------|-----|--------|-------|
| hero-section.astro | 33 | Has md/lg breakpoints | Check text sizes on mobile |
| hero-search.astro | 161 | Has sm/md breakpoints | Touch targets, dropdown overflow |
| featured-project-section.astro | 292 | Has lg breakpoints | Carousel on mobile needs review |
| properties-section.astro | 48 | Has sm/lg grid | OK structure |
| locations-section.astro | 59 | Custom CSS grid | Already has media queries in global.css |
| partners-section.astro | 35 | Infinite scroll | Check mobile width |
| download-app-section.astro | 153 | Has lg breakpoints | Padding/overlap on mobile |
| news-section.astro | 93 | Has sm/lg grid | OK structure |
| header.astro | 89 | Has xl breakpoint | Mobile menu via React |
| footer.astro | 186 | Has md/lg grid | Check spacing on mobile |

### Existing Responsive Patterns
- Tailwind breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Custom media queries in `global.css` for location-grid
- Container: `max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-7`

## Phases

| Phase | Description | Effort | Status |
|-------|-------------|--------|--------|
| [Phase 1](./phase-01-responsive-audit-fixes.md) | Responsive audit & fixes | 1.5h | completed |
| [Phase 2](./phase-02-json-ld-structured-data.md) | JSON-LD structured data | 1h | completed |
| [Phase 3](./phase-03-semantic-html-audit.md) | Semantic HTML audit | 0.5h | completed |

## Key Constraints
- Tailwind CSS only (no external CSS frameworks)
- Keep files under 200 lines
- No breaking changes to existing functionality
- Vietnamese content preserved
- Test with `npm run build` before marking complete

## Success Criteria
- [x] No horizontal scroll on any breakpoint
- [x] All touch targets >= 44px
- [x] JSON-LD validates in Google Rich Results Test
- [x] Single h1 per page, proper heading hierarchy
- [x] All images have Vietnamese alt text
- [ ] Lighthouse SEO score >= 90 (manual verification needed)

## Dependencies
- None (standalone improvements)

## Risk Assessment
- Low risk: CSS-only changes + new SEO component
- Mitigation: Test build after each section fix
