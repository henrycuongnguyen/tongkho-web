---
title: "Single Page News Article & About Page"
description: "Design news article detail page and company introduction/about page for Astro real estate website"
status: completed
priority: P2
effort: 4h
branch: main
tags: [frontend, astro, design, pages]
created: 2026-01-30
---

# Single Page News Article & About Page Implementation

## Overview

Create two new page types for TongkhoBDS website:
1. **News Article Single Page** - `/tin-tuc/[slug].astro`
2. **About/Introduction Page** - `/gioi-thieu.astro`

## Phase Summary

| Phase | Description | Effort | Status |
|-------|------------|--------|--------|
| [Phase 1](./phase-01-news-article-detail-page.md) | News Article Detail Page | 2h | completed |
| [Phase 2](./phase-02-company-about-introduction-page.md) | Company Introduction Page | 2h | completed |

## Key Context

### Existing Patterns to Follow
- Layout: `main-layout.astro` wraps all pages
- Styling: Tailwind CSS with primary (orange) / secondary (slate) theme
- Data: Mock data in `src/data/mock-properties.ts`
- Types: `NewsArticle` interface in `src/types/property.ts`
- Utilities: `formatDate`, `formatRelativeTime` from `@utils/format`

### Reference Components
- `src/pages/bat-dong-san/[slug].astro` - Property detail page pattern
- `src/components/home/news-section.astro` - News card styling
- `src/components/cards/property-card.astro` - Share button pattern

## Dependencies

- Existing `NewsArticle` type
- Existing `mockNews` data
- `main-layout.astro` for page wrapper
- Tailwind CSS theme colors

## Files to Create

### Phase 1 - News Article
- `src/pages/tin-tuc/[slug].astro` - Article detail page
- `src/components/news/article-share-buttons.astro` - Social share component
- `src/components/news/related-articles.astro` - Related news grid

### Phase 2 - About Page
- `src/pages/gioi-thieu.astro` - About/introduction page
- `src/components/about/team-member-card.astro` - Team member component
- `src/components/about/achievement-card.astro` - Stats/achievement card
- `src/data/company-data.ts` - Company info, team, achievements

## Success Criteria

- [x] News article page renders with hero, content, author, share buttons
- [x] About page renders all sections (about, mission, team, achievements)
- [x] Responsive design works on mobile/tablet/desktop
- [x] SEO meta tags configured for both page types
- [x] Follows existing codebase patterns and styling
