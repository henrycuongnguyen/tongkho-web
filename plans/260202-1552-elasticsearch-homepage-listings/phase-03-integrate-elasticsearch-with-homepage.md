# Phase 3: Integrate Elasticsearch with Homepage

## Context

- **Parent Plan:** [plan.md](./plan.md)
- **Depends on:** [Phase 2](./phase-02-create-elasticsearch-client-service.md)
- **Homepage:** [index.astro](../../src/pages/index.astro)

## Overview

| Field | Value |
|-------|-------|
| Priority | P1 |
| Status | pending |
| Review | pending |

Update homepage to fetch property listings from Elasticsearch service instead of mock data.

## Key Insights

- Homepage currently imports `mockPropertiesForSale`, `mockPropertiesForRent`
- In SSR mode, can use `await` in Astro frontmatter
- Need to mark homepage as SSR page with `export const prerender = false`
- PropertiesSection component already accepts `properties: Property[]` - no changes needed

## Requirements

### Functional
- Fetch sale properties from ES for "Bất động sản đang bán" section
- Fetch rent properties from ES for "Bất động sản cho thuê" section
- Display 4 properties per section

### Non-functional
- Page load time < 3 seconds
- Graceful degradation on ES failure

## Architecture

```
src/pages/index.astro (SSR)
    ↓ import
src/services/elasticsearch.ts
    ↓ fetch
Elasticsearch API
    ↓ return Property[]
PropertiesSection component (no changes)
```

## Related Code Files

**To Modify:**
- `src/pages/index.astro` - Replace mock imports with ES service calls

**No Changes Needed:**
- `src/components/home/properties-section.astro` - Already accepts Property[]
- `src/components/cards/property-card.astro` - Already renders Property

## Implementation Steps

1. Update `src/pages/index.astro`:

```astro
---
import MainLayout from '@layouts/main-layout.astro';
import HeroSection from '@components/home/hero-section.astro';
import FeaturedProjectSection from '@components/home/featured-project-section.astro';
import PropertiesSection from '@components/home/properties-section.astro';
import LocationsSection from '@components/home/locations-section.astro';
import NewsSection from '@components/home/news-section.astro';
import PartnersSection from '@components/home/partners-section.astro';
import DownloadAppSection from '@components/home/download-app-section.astro';
import PressCoverageSection from '@components/home/press-coverage-section.astro';
import { elasticsearchService } from '@/services/elasticsearch';

// Enable SSR for this page
export const prerender = false;

// Fetch properties from Elasticsearch
const [propertiesForSale, propertiesForRent] = await Promise.all([
  elasticsearchService.searchProperties('sale', 4),
  elasticsearchService.searchProperties('rent', 4),
]);
---

<MainLayout
  title="Tổng Kho Bất Động Sản - Mua Bán, Cho Thuê, Dự Án Mới Nhất"
  description="TongkhoBDS.com - Tổng kho bất động sản lớn nhất Việt Nam..."
>
  <HeroSection />
  <FeaturedProjectSection />
  <PropertiesSection
    title="Bất động sản đang bán"
    properties={propertiesForSale}
    viewAllLink="/mua-ban"
  />
  <PropertiesSection
    title="Bất động sản cho thuê"
    properties={propertiesForRent}
    viewAllLink="/cho-thue"
    variant="warm"
  />
  <LocationsSection />

  <div class="relative bg-secondary-800 pb-56 lg:pb-72">
    <PartnersSection />
  </div>
  <div class="relative -mt-56 lg:-mt-72 z-10">
    <DownloadAppSection />
  </div>

  <NewsSection />
  <PressCoverageSection />
</MainLayout>
```

2. Key changes:
   - Remove mock data imports
   - Add `export const prerender = false` for SSR
   - Use `await` to fetch from ES service
   - `Promise.all` for parallel fetching

## Todo List

- [ ] Update index.astro imports
- [ ] Add prerender = false export
- [ ] Replace mock data with ES service calls
- [ ] Test homepage loads with real data
- [ ] Verify fallback works when ES down

## Success Criteria

- [ ] Homepage displays properties from Elasticsearch
- [ ] Both sale and rent sections populated
- [ ] Property cards render correctly with ES data
- [ ] Page loads within 3 seconds
- [ ] Fallback shows mock data if ES fails

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| SSR slower than static | Medium | Cache responses, optimize queries |
| ES data missing fields | High | Service handles defaults |
| Parallel fetch fails | Medium | Promise.all catches, fallback works |

## Security Considerations

- ES credentials never reach client
- All data fetching happens server-side
- No user input involved in queries

## Next Steps

After completing this phase, proceed to [Phase 4: Testing & Validation](./phase-04-testing-and-validation.md)
