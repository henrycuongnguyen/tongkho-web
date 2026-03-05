---
phase: 4
title: "Page Sections Assembly"
status: completed
effort: 1h
completed_date: 2026-03-05
---

# Phase 4: Page Sections Assembly

## Context Links

- [Phase 3 - Form Components](./phase-03-contact-form-component.md)
- [V1 contact view](../../reference/resaland_v1/views/contact/index.html)
- [About page reference](../../src/pages/gioi-thieu.astro)
- [Partners section](../../src/components/home/partners-section.astro)
- [Partners data](../../src/data/partners.ts)

## Overview

Add remaining page sections (Contact Info, Partners, CTA) to the SSR page from Phase 2.

**Priority:** P1 - Complete page sections
**Status:** Pending
**Depends on:** Phases 2, 3

## Key Insights

### V1 Page Sections (in order)

1. **Hero Form Section** - Contact form with title and benefits
2. **Contact Info Section** - Address, phone, email with icons + image
3. **Partners Section** - Logo carousel (infiniteslide)
4. **CTA Section** - Call to action with button

### Reusable Components

- `partners-section.astro` exists in `src/components/home/` - can reuse
- `company-info-data.ts` has all contact info
- Main layout provides header/footer

## Requirements

### Functional
1. Page accessible at `/lien-he`
2. Include all 4 sections matching v1 order
3. SEO metadata (title, description)
4. Breadcrumb navigation

### Non-functional
1. Page load < 2s
2. Responsive design
3. Consistent with site styling

## Architecture

```
┌──────────────────────────────────────────┐
│              lien-he.astro               │
├──────────────────────────────────────────┤
│  MainLayout                              │
│  ├── Breadcrumb                          │
│  ├── ContactForm                         │
│  ├── ContactInfoSection                  │
│  ├── PartnersSection (reuse from home)   │
│  └── ContactCtaSection                   │
└──────────────────────────────────────────┘
```

## Related Code Files

### Files to Create
- `src/pages/lien-he.astro` - Main contact page

### Files to Import
- `src/layouts/main-layout.astro`
- `src/components/contact/contact-form.astro`
- `src/components/contact/contact-info-section.astro`
- `src/components/contact/contact-cta-section.astro`
- `src/components/home/partners-section.astro`

## Implementation Steps

### Step 1: Create Contact Page

Create `src/pages/lien-he.astro`:

```astro
---
/**
 * Contact Page
 * URL: /lien-he
 * Matching v1 design with form, info, partners, CTA
 */
import MainLayout from '@/layouts/main-layout.astro';
import ContactForm from '@/components/contact/contact-form.astro';
import ContactInfoSection from '@/components/contact/contact-info-section.astro';
import ContactCtaSection from '@/components/contact/contact-cta-section.astro';
import PartnersSection from '@/components/home/partners-section.astro';

const pageTitle = 'Liên hệ | TongkhoBDS';
const pageDescription = 'Liên hệ với TongkhoBDS để được tư vấn miễn phí về mua bán, cho thuê bất động sản. Đội ngũ chuyên viên hỗ trợ tận tâm 24/7.';
---

<MainLayout title={pageTitle} description={pageDescription}>
  <!-- Breadcrumb -->
  <div class="bg-secondary-50 py-4 border-b border-secondary-100">
    <div class="container-custom">
      <nav class="text-sm">
        <ol class="flex items-center gap-2 text-secondary-600">
          <li>
            <a href="/" class="hover:text-primary-500 transition-colors">Trang chủ</a>
          </li>
          <li class="text-secondary-400">/</li>
          <li class="text-secondary-800 font-medium">Liên hệ</li>
        </ol>
      </nav>
    </div>
  </div>

  <!-- Contact Form Section -->
  <ContactForm />

  <!-- Contact Info Section -->
  <ContactInfoSection />

  <!-- Partners Section (wrapper with custom styling for contact page) -->
  <section class="bg-secondary-900 py-16">
    <div class="container-custom">
      <div class="text-center mb-8">
        <h2 class="text-2xl lg:text-3xl font-bold text-white mb-3">
          Hãy cùng làm việc với chúng tôi
        </h2>
        <p class="text-secondary-300">
          Hàng nghìn khách hàng bất động sản cao cấp giống bạn đã thăm trang web của chúng tôi.
        </p>
      </div>

      <!-- Reuse partners slider -->
      <PartnersSection />
    </div>
  </section>

  <!-- CTA Section -->
  <ContactCtaSection />
</MainLayout>
```

### Step 2: Update Partners Section (if needed)

The existing `partners-section.astro` has dark text header. For contact page, we need white text. Two options:

**Option A:** Pass prop to control text color
**Option B:** Override with wrapper (shown above)

Recommend Option B for minimal changes.

### Step 3: Verify Static Build

After creating the page, run build to verify:

```bash
npm run build
```

Check that `/lien-he/index.html` is generated in `dist/`.

## Page Structure Visualization

```
┌─────────────────────────────────────────────────────────┐
│  Header (from MainLayout)                               │
├─────────────────────────────────────────────────────────┤
│  Breadcrumb: Trang chủ / Liên hệ                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │           CONTACT FORM SECTION                  │    │
│  │  ┌────────────────────────────────────────────┐ │    │
│  │  │  Để lại thông tin – Tìm nhà nhanh...       │ │    │
│  │  │                                            │ │    │
│  │  │  [Họ tên]          [Email]                 │ │    │
│  │  │  [Số điện thoại]   [Ngân sách] VND         │ │    │
│  │  │  [Khu vực]                                 │ │    │
│  │  │  [Nội dung quan tâm...]                    │ │    │
│  │  │                                            │ │    │
│  │  │  ✓ Miễn phí  ✓ Nhanh  ✓ Bảo mật           │ │    │
│  │  │  [Gửi thông tin ngay]                      │ │    │
│  │  └────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────┬──────────────────────┐        │
│  │  CONTACT INFO        │     IMAGE            │        │
│  │  (dark bg)           │                      │        │
│  │                      │                      │        │
│  │  📍 Address          │                      │        │
│  │  📞 Phone            │                      │        │
│  │  ✉️  Email            │                      │        │
│  └──────────────────────┴──────────────────────┘        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │     PARTNERS SECTION (dark bg)                  │    │
│  │     Hãy cùng làm việc với chúng tôi             │    │
│  │                                                 │    │
│  │  [logo] [logo] [logo] [logo] [logo] [logo]      │    │
│  │     ← infinite scroll →                         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │     CTA SECTION (orange gradient)               │    │
│  │  Liên hệ ngay đại lý...  [Tìm đại lý 🔍]       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Footer (from MainLayout)                               │
└─────────────────────────────────────────────────────────┘
```

## Todo List

- [x] Create `src/pages/lien-he.astro`
- [x] Import all contact components
- [x] Add breadcrumb navigation
- [x] Style partners section wrapper for dark theme
- [x] Test page renders at `/lien-he`
- [x] Test form submission end-to-end
- [x] Test responsive layout (mobile, tablet, desktop)
- [x] Run build and verify static output
- [x] Check SEO meta tags

## Success Criteria

1. [x] Page loads at `/lien-he`
2. [x] All 4 sections visible
3. [x] Form submission works end-to-end
4. [x] Partners carousel animates
5. [x] Responsive on all breakpoints
6. [x] Build passes without errors
7. [x] HTML generated in `dist/lien-he/index.html`

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Import path errors | Medium | Use @/ alias consistently |
| Partners styling conflict | Low | Use wrapper section for isolation |
| Build failure | High | Test build after each change |

## Security Considerations

- No server-side secrets in static page
- Form data only sent via client-side JS to API

## Next Steps

After this phase:
- Proceed to Phase 5 (Testing and Polish)
- Full end-to-end testing
