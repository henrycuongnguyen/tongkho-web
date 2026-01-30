# Phase 1: News Article Detail Page

## Context Links
- [News Section Component](../../src/components/home/news-section.astro)
- [Property Detail Page Pattern](../../src/pages/bat-dong-san/[slug].astro)
- [NewsArticle Type](../../src/types/property.ts)
- [Mock News Data](../../src/data/mock-properties.ts)

## Overview

| Attribute | Value |
|-----------|-------|
| Priority | P2 |
| Status | pending |
| Effort | 2h |

Create a single page for news articles at `/tin-tuc/[slug]` with hero image, article content, author info, and social share buttons.

## Key Insights

1. **Existing Pattern**: Property detail page (`/bat-dong-san/[slug].astro`) uses `getStaticPaths()` for dynamic routes - same pattern applies
2. **Share Buttons**: Property card already has share popup with Facebook, Zalo, Twitter, Copy - reuse this pattern
3. **NewsArticle Type**: Already has `content` field but mock data has empty content - need full article content for demo
4. **Styling**: Use existing `.card`, `.section`, `.container-custom` classes

## Requirements

### Functional
- Dynamic route `/tin-tuc/[slug]` for each article
- Hero section with full-width thumbnail image
- Article title, category badge, publish date, author, view count
- Full article content (HTML or markdown)
- Social share buttons (Facebook, Zalo, Twitter/X, Copy link)
- Related articles section (same category or recent)
- Breadcrumb navigation

### Non-Functional
- SEO: meta title, description, og:image from article data
- Responsive: mobile-first design
- Performance: lazy load images
- Accessibility: semantic HTML, proper heading hierarchy

## Architecture

```
/tin-tuc/[slug].astro
├── MainLayout (header + footer)
├── Breadcrumb
├── Hero Section (full-width image)
├── Article Container (2-column on desktop)
│   ├── Main Content (8 cols)
│   │   ├── Article Header (title, meta)
│   │   ├── Article Body (content)
│   │   └── Share Buttons
│   └── Sidebar (4 cols)
│       ├── Author Card
│       └── Related Articles
└── Related Articles Section (mobile: full width)
```

## Related Code Files

### Files to Modify
- `src/data/mock-properties.ts` - Add full content to mockNews articles

### Files to Create
- `src/pages/tin-tuc/[slug].astro` - Article detail page
- `src/components/news/article-share-buttons.astro` - Social share component
- `src/components/news/related-articles-sidebar.astro` - Related news in sidebar

## Implementation Steps

### Step 1: Update Mock Data (10 min)
Add full article content to 2-3 mockNews entries for demo purposes.

```typescript
// In mock-properties.ts, update content field:
content: `
<p>Paragraph 1...</p>
<h2>Section heading</h2>
<p>More content...</p>
`
```

### Step 2: Create Article Share Buttons Component (20 min)
Create reusable share component based on property-card share popup.

```astro
// src/components/news/article-share-buttons.astro
---
interface Props {
  url: string;
  title: string;
}
const { url, title } = Astro.props;
---
<div class="flex items-center gap-3">
  <!-- Facebook, Zalo, Twitter, Copy buttons -->
</div>
```

### Step 3: Create Related Articles Component (20 min)
Sidebar component showing 3-4 related articles.

```astro
// src/components/news/related-articles-sidebar.astro
---
interface Props {
  currentSlug: string;
  category: NewsCategory;
}
---
```

### Step 4: Create Article Detail Page (50 min)
Main page with hero, content, sidebar layout.

```astro
// src/pages/tin-tuc/[slug].astro
---
import MainLayout from '@/layouts/main-layout.astro';
import ArticleShareButtons from '@/components/news/article-share-buttons.astro';
import RelatedArticlesSidebar from '@/components/news/related-articles-sidebar.astro';
import { mockNews } from '@/data/mock-properties';

export function getStaticPaths() {
  return mockNews.map((article) => ({
    params: { slug: article.slug },
    props: { article },
  }));
}
---
```

### Step 5: Add Article Content Styling (20 min)
Style article body content with proper typography.

```css
.article-content h2 { @apply text-2xl font-bold mt-8 mb-4; }
.article-content p { @apply mb-4 leading-relaxed; }
.article-content ul { @apply list-disc pl-6 mb-4; }
```

## Todo List

- [ ] Update mockNews with full article content (2-3 articles)
- [ ] Create `article-share-buttons.astro` component
- [ ] Create `related-articles-sidebar.astro` component
- [ ] Create `tin-tuc/[slug].astro` page
- [ ] Add article content styling to global.css
- [ ] Test responsive layout (mobile/tablet/desktop)
- [ ] Verify SEO meta tags
- [ ] Test share button functionality

## Success Criteria

- [ ] Article page accessible at `/tin-tuc/{slug}`
- [ ] Hero image displays full-width
- [ ] Article content renders with proper typography
- [ ] Share buttons work (Facebook, Zalo, Twitter, Copy)
- [ ] Related articles show in sidebar
- [ ] Breadcrumb navigation works
- [ ] Mobile layout stacks properly
- [ ] SEO meta tags populated from article data

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Empty content field in mock data | Medium | Add sample content to 2-3 articles |
| Share popup positioning on mobile | Low | Use fixed bottom sheet on mobile |

## Security Considerations

- Sanitize article content if coming from external CMS (future)
- Use `rel="noopener"` for external share links

## Next Steps

After completion:
1. Link news cards on homepage to article pages
2. Create news listing page `/tin-tuc` (future phase)
3. Add view count tracking (requires backend)
