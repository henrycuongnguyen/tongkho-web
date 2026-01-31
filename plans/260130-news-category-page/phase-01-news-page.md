# Phase 1: News Category Page

## Priority: High
## Status: In Progress

## Overview
Create main news listing page with category filtering, following existing patterns from `gioi-thieu.astro` and `news-section.astro`.

## Key Insights
- Existing patterns: Hero section, breadcrumb, card grid layout
- Categories: market, tips, policy, project_news, investment
- Category labels/colors defined in `[slug].astro`
- Mock data: 8 news articles in `mockNews`

## Requirements

### Functional
- Display all news articles in grid
- Category tabs for filtering (client-side or URL-based)
- Sort by date (newest first)
- Link to article detail pages

### Non-functional
- Responsive: 1 col mobile, 2 col tablet, 3-4 col desktop
- SEO optimized title/description
- Fast load (static generation)

## Architecture
```
/tin-tuc (index.astro)
├── Hero Section (gradient bg, title, description)
├── Breadcrumb (Trang chủ > Tin tức)
├── Category Filter Tabs
├── News Grid (3-4 cols)
│   └── NewsCard (reuse pattern from news-section.astro)
└── View More / Pagination (if needed)
```

## Related Code Files
- **Reference**: `src/pages/gioi-thieu.astro` (page structure)
- **Reference**: `src/components/home/news-section.astro` (card design)
- **Reference**: `src/pages/tin-tuc/[slug].astro` (category labels/colors)
- **Data**: `src/data/mock-properties.ts` (mockNews)
- **Types**: `src/types/property.ts` (NewsArticle, NewsCategory)

## Implementation Steps

1. Create `src/pages/tin-tuc/index.astro`
2. Import MainLayout, mockNews, formatRelativeTime
3. Define category labels/colors (same as [slug].astro)
4. Build Hero section with gradient background
5. Add breadcrumb navigation
6. Create category filter tabs
7. Implement news grid with cards
8. Apply responsive styling

## Todo List
- [ ] Create news page file
- [ ] Hero section
- [ ] Breadcrumb
- [ ] Category tabs
- [ ] News grid
- [ ] Responsive styling
- [ ] Test build

## Success Criteria
- Page accessible at `/tin-tuc`
- All news articles displayed
- Category tabs functional (visual filtering)
- Responsive on all devices
- No TypeScript errors
- Build passes
