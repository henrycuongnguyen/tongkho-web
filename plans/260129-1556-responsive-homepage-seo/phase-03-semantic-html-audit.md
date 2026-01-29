# Phase 3: Semantic HTML Audit

## Context Links
- [plan.md](./plan.md)
- [MDN Semantic HTML](https://developer.mozilla.org/en-US/docs/Glossary/Semantics#semantics_in_html)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 0.5h
- **Description:** Audit heading hierarchy, landmark elements, image alt texts, link accessibility, and ARIA labels

## Key Insights
- Homepage should have exactly ONE `<h1>` (currently in hero-section)
- Proper heading hierarchy: h1 > h2 > h3 (no skipping levels)
- All images need descriptive alt text in Vietnamese
- Interactive elements need accessible names

## Requirements

### Functional
- Single h1 per page
- Proper h2-h6 hierarchy
- All images have alt text
- Links have descriptive text

### Non-functional
- WCAG 2.1 AA compliance
- Screen reader friendly
- Vietnamese language content

---

## Current State Audit

### Heading Structure Analysis

| Component | Current Headings | Issues |
|-----------|------------------|--------|
| hero-section.astro | `<h1>TongkhoBDS.com</h1>` | OK - single h1 |
| featured-project-section.astro | `<h2>Du an</h2>`, `<h3>{project.name}</h3>` | OK |
| properties-section.astro | `<h2>{title}</h2>` | OK |
| locations-section.astro | `<h2>Kham pha...</h2>`, `<h3>{location.name}</h3>` | OK |
| partners-section.astro | `<h2>Doi tac chien luoc</h2>` | OK |
| download-app-section.astro | `<h3>` titles | Should be h2 for section |
| news-section.astro | `<h2>Tin tuc noi bat</h2>`, `<h3>{article.title}</h3>` | OK |
| footer.astro | `<h4>` for columns | OK |

**Issue Found:** download-app-section uses `<h3>` but should use `<h2>` as section heading.

---

### Landmark Elements Audit

| Element | Current | Expected |
|---------|---------|----------|
| `<header>` | header.astro | OK |
| `<nav>` | inside header | OK |
| `<main>` | main-layout.astro | OK |
| `<footer>` | footer.astro | OK |
| `<section>` | all sections | OK |
| `<article>` | news cards | Consider adding |

---

### Image Alt Text Audit

| Component | Images | Alt Text Status |
|-----------|--------|-----------------|
| hero-section | Hero background | `alt="Thanh pho Viet Nam"` - OK |
| featured-project | Project images | `alt={project.name}` - OK |
| locations-section | Location images | `alt={location.name}` - OK |
| partners-section | Partner logos | `alt={partner.name}` - OK |
| download-app | Phone mockups, QR codes | `alt="Customer App"` - needs Vietnamese |
| news-section | Article thumbnails | `alt={article.title}` - OK |
| header | Logo | `alt="TongkhoBDS.com"` - OK |
| footer | Logo, certification | Check alt texts |

**Issues Found:**
- download-app-section: English alt texts ("Customer App", "Agent App", "QR Code")
- footer: certification image needs descriptive alt

---

### Link Accessibility Audit

| Component | Links | Accessibility Status |
|-----------|-------|---------------------|
| header | Nav links | OK - descriptive text |
| hero-search | Tab buttons | OK - visible labels |
| featured-project | "Tim hieu du an" CTA | OK |
| properties-section | "Xem them" link | OK but consider aria-label |
| locations-section | Location cards | OK - h3 provides name |
| partners-section | Partner links | Needs aria-label |
| news-section | Article cards | OK - h3 provides name |
| footer | All links | OK - descriptive text |

**Issues Found:**
- Partner logos: links only have image, need aria-label
- "Xem them" links: consider adding context for screen readers

---

## Fixes Required

### 1. download-app-section.astro - Fix heading hierarchy

```astro
<!-- Change h3 to h2 for section titles -->
<h2 class="text-xl font-bold text-white italic mb-3">
  {customerApp.title}
</h2>
```

### 2. download-app-section.astro - Vietnamese alt texts

```astro
<!-- Phone mockups -->
<img
  src={customerApp.phoneImage}
  alt="Ung dung TongkhoBDS danh cho khach hang"
  class="..."
/>
<img
  src={agentApp.phoneImage}
  alt="Ung dung TongkhoBDS danh cho moi gioi"
  class="..."
/>

<!-- QR codes -->
<img src={customerApp.qrCode} alt="Ma QR tai ung dung khach hang" class="w-20 h-20" />
<img src={agentApp.qrCode} alt="Ma QR tai ung dung moi gioi" class="w-20 h-20" />

<!-- App store badges -->
<img src="/images/download-app/appstore.png" alt="Tai tu App Store" class="h-11 w-auto" />
<img src="/images/download-app/googleplay.png" alt="Tai tu Google Play" class="h-11 w-auto" />
```

### 3. partners-section.astro - Add aria-labels

```astro
<a
  href={`/chu-dau-tu/${partner.slug}`}
  class="partner-item..."
  aria-label={`Xem thong tin ${partner.name}`}
>
  <img src={partner.image} alt={`Logo ${partner.name}`} class="h-16 w-auto..." />
</a>
```

### 4. properties-section.astro - Add context to "Xem them"

```astro
<a
  href={viewAllLink}
  class="group flex items-center..."
  aria-label={`Xem them ${title.toLowerCase()}`}
>
  Xem them
  <svg>...</svg>
</a>
```

### 5. news-section.astro - Same pattern

```astro
<a
  href="/tin-tuc"
  class="group flex items-center..."
  aria-label="Xem them tin tuc noi bat"
>
  Xem them
  <svg>...</svg>
</a>
```

### 6. footer.astro - Fix certification alt

```astro
<img
  src="/images/da-dang-ky-bct.svg"
  alt="Da dang ky voi Bo Cong Thuong"
  class="h-12 w-auto"
/>
```

---

## Implementation Steps

1. **Heading audit** - Fix download-app h3 to h2 (2 min)
2. **Image alt texts** - Update download-app section (5 min)
3. **Partner links** - Add aria-labels (3 min)
4. **"Xem them" links** - Add aria-labels (5 min)
5. **Footer** - Fix certification alt (2 min)
6. **Test** - Run build, verify in browser (5 min)

---

## Todo List

- [ ] Fix download-app-section heading hierarchy (h3 -> h2)
- [ ] Add Vietnamese alt texts to download-app images
- [ ] Add aria-labels to partner links
- [ ] Add aria-labels to "Xem them" links
- [ ] Fix footer certification image alt
- [ ] Run npm run build
- [ ] Test with screen reader or accessibility tool

---

## Success Criteria

- [ ] Single h1 on homepage
- [ ] No heading level skips (h1 > h2 > h3)
- [ ] All images have descriptive Vietnamese alt text
- [ ] All links have accessible names
- [ ] Lighthouse Accessibility score >= 90

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking visual layout | Very Low | Low | Only changing attributes |
| Missing context | Low | Medium | Test with screen reader |

---

## Security Considerations
- N/A (HTML attribute changes only)

---

## Validation Commands

```bash
# Build and check for errors
npm run build

# Optional: Run Lighthouse audit
npx lighthouse https://localhost:4321 --only-categories=accessibility
```

---

## Summary Checklist

| Category | Items | Status |
|----------|-------|--------|
| Headings | Single h1, proper hierarchy | Fix download-app |
| Landmarks | header, nav, main, footer, section | OK |
| Images | Vietnamese alt texts | Fix download-app, footer |
| Links | Descriptive text or aria-label | Fix partners, "Xem them" |
| Forms | Labels, placeholders | OK (hero-search) |

---

## Next Steps
- After all phases complete, run final build and Lighthouse audit
- Update plan.md status to "completed"
