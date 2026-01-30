# Phase 2: Company About/Introduction Page

## Context Links
- [Footer Component (company info)](../../src/components/footer/footer.astro)
- [Property Detail Page Pattern](../../src/pages/bat-dong-san/[slug].astro)
- [Main Layout](../../src/layouts/main-layout.astro)
- [Global Styles](../../src/styles/global.css)

## Overview

| Attribute | Value |
|-----------|-------|
| Priority | P2 |
| Status | pending |
| Effort | 2h |

Create company introduction page at `/gioi-thieu` with sections for about us, mission/vision, team members, and achievements/stats.

## Key Insights

1. **Company Data**: Footer already has contact info for RESA HOLDINGS - use as base
2. **Section Pattern**: Use existing `.section` and `.container-custom` classes
3. **Card Pattern**: Reuse `.card` class for team member and achievement cards
4. **Vietnamese Content**: All text in Vietnamese

## Requirements

### Functional
- Static page at `/gioi-thieu`
- Hero section with company tagline
- About Us section (company overview, history)
- Mission & Vision section (2-column layout)
- Team Members section (grid of member cards)
- Achievements/Stats section (key metrics)
- Call-to-action section (contact/partnership)

### Non-Functional
- SEO: meta title, description optimized for "gioi thieu tongkhobds"
- Responsive: mobile-first design
- Performance: optimize team member images
- Accessibility: semantic HTML

## Architecture

```
/gioi-thieu.astro
├── MainLayout (header + footer)
├── Hero Section
│   ├── Background gradient
│   ├── Company name & tagline
│   └── Breadcrumb
├── About Section
│   ├── Company overview text
│   └── Company image
├── Mission/Vision Section (2 columns)
│   ├── Mission card
│   └── Vision card
├── Team Section
│   └── Team member cards grid (4 cols desktop)
├── Achievements Section
│   └── Stats cards (4 cols)
└── CTA Section
    └── Contact/Partnership button
```

## Related Code Files

### Files to Create
- `src/pages/gioi-thieu.astro` - About page
- `src/components/about/team-member-card.astro` - Team member card
- `src/components/about/achievement-stat-card.astro` - Stats card
- `src/data/company-info-data.ts` - Company data (team, stats, content)

## Implementation Steps

### Step 1: Create Company Data File (15 min)
Centralize company information, team members, and achievements.

```typescript
// src/data/company-info-data.ts
export const companyInfo = {
  name: 'RESA HOLDINGS',
  tagline: 'Tổng kho bất động sản lớn nhất Việt Nam',
  description: 'Với hơn 10 năm kinh nghiệm...',
  founded: 2015,
  address: 'Tầng 7, tòa nhà Văn Hoa...',
};

export const missionVision = {
  mission: 'Kết nối người mua và người bán...',
  vision: 'Trở thành nền tảng bất động sản...',
};

export const teamMembers = [
  {
    id: '1',
    name: 'Vương Đình Công',
    role: 'Giám đốc điều hành',
    image: '/images/team/ceo.jpg',
    description: 'Hơn 15 năm kinh nghiệm...',
  },
  // ... more members
];

export const achievements = [
  { id: '1', value: '50,000+', label: 'Tin đăng', icon: 'home' },
  { id: '2', value: '10,000+', label: 'Giao dịch thành công', icon: 'check' },
  { id: '3', value: '5,000+', label: 'Đối tác', icon: 'users' },
  { id: '4', value: '10+', label: 'Năm kinh nghiệm', icon: 'calendar' },
];
```

### Step 2: Create Team Member Card Component (20 min)

```astro
// src/components/about/team-member-card.astro
---
interface Props {
  name: string;
  role: string;
  image: string;
  description?: string;
}
const { name, role, image, description } = Astro.props;
---
<div class="card text-center p-6">
  <img src={image} alt={name} class="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
  <h3 class="font-semibold text-lg text-secondary-800">{name}</h3>
  <p class="text-primary-500 text-sm mb-2">{role}</p>
  {description && <p class="text-secondary-500 text-sm">{description}</p>}
</div>
```

### Step 3: Create Achievement Stats Card (15 min)

```astro
// src/components/about/achievement-stat-card.astro
---
interface Props {
  value: string;
  label: string;
  icon: 'home' | 'check' | 'users' | 'calendar';
}
---
<div class="text-center p-6 bg-white rounded-2xl shadow-lg">
  <!-- Icon -->
  <div class="w-16 h-16 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
    <!-- SVG icon based on icon prop -->
  </div>
  <p class="text-3xl font-bold text-primary-500">{value}</p>
  <p class="text-secondary-600">{label}</p>
</div>
```

### Step 4: Create About Page (50 min)

```astro
// src/pages/gioi-thieu.astro
---
import MainLayout from '@/layouts/main-layout.astro';
import TeamMemberCard from '@/components/about/team-member-card.astro';
import AchievementStatCard from '@/components/about/achievement-stat-card.astro';
import { companyInfo, missionVision, teamMembers, achievements } from '@/data/company-info-data';

const pageTitle = 'Giới thiệu';
const pageDescription = 'Tìm hiểu về TongkhoBDS - Tổng kho bất động sản lớn nhất Việt Nam';
---

<MainLayout title={pageTitle} description={pageDescription}>
  <!-- Hero Section -->
  <section class="bg-gradient-to-br from-primary-500 to-primary-700 text-white py-16 lg:py-24">
    ...
  </section>

  <!-- About Section -->
  <section class="section">
    ...
  </section>

  <!-- Mission/Vision Section -->
  <section class="section bg-secondary-50">
    ...
  </section>

  <!-- Team Section -->
  <section class="section">
    ...
  </section>

  <!-- Achievements Section -->
  <section class="section bg-gradient-to-b from-primary-50 to-white">
    ...
  </section>

  <!-- CTA Section -->
  <section class="section bg-secondary-900 text-white">
    ...
  </section>
</MainLayout>
```

### Step 5: Add Placeholder Images (10 min)
- Add team member placeholder images to `/public/images/team/`
- Or use placeholder service URLs initially

## Todo List

- [ ] Create `company-info-data.ts` with company data
- [ ] Create `team-member-card.astro` component
- [ ] Create `achievement-stat-card.astro` component
- [ ] Create `gioi-thieu.astro` page
- [ ] Add team member images (or placeholders)
- [ ] Test responsive layout
- [ ] Verify SEO meta tags
- [ ] Update footer link to point to `/gioi-thieu`

## Success Criteria

- [ ] Page accessible at `/gioi-thieu`
- [ ] Hero section displays with gradient background
- [ ] About section shows company overview
- [ ] Mission/Vision section displays in 2 columns (desktop)
- [ ] Team members grid displays properly
- [ ] Achievement stats animate or display prominently
- [ ] CTA section has contact button
- [ ] Mobile layout stacks all sections properly
- [ ] SEO meta tags configured

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| No team member photos | Low | Use placeholder images or avatars |
| Content not finalized | Medium | Use placeholder Vietnamese text |

## Security Considerations

- No sensitive data on this page
- External links use `rel="noopener"`

## Next Steps

After completion:
1. Update footer `/gioi-thieu` link
2. Add company info to JSON-LD schema (SEO)
3. Consider adding history timeline section (future)
