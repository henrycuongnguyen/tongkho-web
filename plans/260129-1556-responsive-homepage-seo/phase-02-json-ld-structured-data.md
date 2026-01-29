# Phase 2: JSON-LD Structured Data

## Context Links
- [plan.md](./plan.md)
- [base-layout.astro](../../src/layouts/base-layout.astro) - where to inject JSON-LD
- [Schema.org docs](https://schema.org/docs/documents.html)
- [Google Rich Results Test](https://search.google.com/test/rich-results)

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 1h
- **Description:** Add schema.org JSON-LD structured data for SEO (Organization, WebSite, LocalBusiness, BreadcrumbList)

## Key Insights
- JSON-LD is Google's preferred format for structured data
- Place in `<head>` or end of `<body>`
- Must be valid JSON (escape special characters)
- Test with Google Rich Results Test before deploying

## Requirements

### Functional
- Organization schema with company info
- WebSite schema with SearchAction (sitelinks search box)
- LocalBusiness schema for local SEO
- BreadcrumbList schema for navigation

### Non-functional
- Valid JSON-LD syntax
- Correct schema.org vocabulary
- No duplicate schemas on same page

---

## Architecture

### New Component Structure
```
src/components/seo/
└── json-ld-schema.astro    # JSON-LD structured data component
```

### Integration Point
```astro
<!-- base-layout.astro -->
<head>
  ...existing meta tags...
  <JsonLdSchema />  <!-- Add before closing </head> -->
</head>
```

---

## Schema Definitions

### 1. Organization Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "TongkhoBDS.com",
  "alternateName": "Tong Kho Bat Dong San",
  "url": "https://tongkhobds.com",
  "logo": "https://tongkhobds.com/images/logo.webp",
  "sameAs": [
    "https://facebook.com/tongkhobds",
    "https://youtube.com/tongkhobds"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+84-1900-xxxx-xx",
    "contactType": "customer service",
    "availableLanguage": "Vietnamese"
  }
}
```

### 2. WebSite Schema with SearchAction

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "TongkhoBDS.com",
  "url": "https://tongkhobds.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://tongkhobds.com/tim-kiem?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

### 3. LocalBusiness Schema

```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "RESA HOLDINGS - TongkhoBDS.com",
  "image": "https://tongkhobds.com/images/logo.webp",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Tang 7, toa nha Van Hoa, so 51 Kim Ma",
    "addressLocality": "Ba Dinh",
    "addressRegion": "Ha Noi",
    "postalCode": "100000",
    "addressCountry": "VN"
  },
  "telephone": "+84-1900-xxxx-xx",
  "email": "contact@tongkhobds.com",
  "url": "https://tongkhobds.com",
  "priceRange": "$$",
  "openingHours": "Mo-Fr 08:00-18:00, Sa 08:00-12:00"
}
```

### 4. BreadcrumbList Schema

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Trang chu",
      "item": "https://tongkhobds.com"
    }
  ]
}
```

---

## Related Code Files

### Files to Create
| File | Purpose | LOC |
|------|---------|-----|
| src/components/seo/json-ld-schema.astro | JSON-LD component | ~80 |

### Files to Modify
| File | Changes |
|------|---------|
| src/layouts/base-layout.astro | Import and render JsonLdSchema |

---

## Implementation Steps

### Step 1: Create SEO directory
```bash
mkdir -p src/components/seo
```

### Step 2: Create json-ld-schema.astro

```astro
---
// JSON-LD structured data for SEO
// Renders Organization, WebSite, LocalBusiness, BreadcrumbList schemas

export interface Props {
  pageType?: 'home' | 'listing' | 'detail' | 'article';
  breadcrumbs?: Array<{ name: string; url: string }>;
}

const { pageType = 'home', breadcrumbs = [] } = Astro.props;

const siteUrl = 'https://tongkhobds.com';

// Organization schema
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "TongkhoBDS.com",
  "alternateName": "Tong Kho Bat Dong San",
  "url": siteUrl,
  "logo": `${siteUrl}/images/logo.webp`,
  "description": "Tong kho bat dong san lon nhat Viet Nam",
  "sameAs": [
    "https://facebook.com/tongkhobds",
    "https://youtube.com/tongkhobds"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+84-1900-0000-00",
    "contactType": "customer service",
    "availableLanguage": "Vietnamese"
  }
};

// WebSite schema with SearchAction
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "TongkhoBDS.com",
  "url": siteUrl,
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${siteUrl}/tim-kiem?q={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
};

// LocalBusiness (RealEstateAgent) schema
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "RESA HOLDINGS - TongkhoBDS.com",
  "image": `${siteUrl}/images/logo.webp`,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Tang 7, toa nha Van Hoa, so 51 Kim Ma, Phuong Ngoc Khanh",
    "addressLocality": "Quan Ba Dinh",
    "addressRegion": "Ha Noi",
    "postalCode": "100000",
    "addressCountry": "VN"
  },
  "telephone": "+84-1900-0000-00",
  "email": "contact@tongkhobds.com",
  "url": siteUrl,
  "priceRange": "$$",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": "Saturday",
      "opens": "08:00",
      "closes": "12:00"
    }
  ]
};

// BreadcrumbList schema
const breadcrumbItems = [
  { name: "Trang chu", url: siteUrl },
  ...breadcrumbs
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": breadcrumbItems.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": item.url
  }))
};

// Only include LocalBusiness on homepage
const schemas = pageType === 'home'
  ? [organizationSchema, websiteSchema, localBusinessSchema, breadcrumbSchema]
  : [organizationSchema, websiteSchema, breadcrumbSchema];
---

{schemas.map((schema) => (
  <script type="application/ld+json" set:html={JSON.stringify(schema)} />
))}
```

### Step 3: Update base-layout.astro

Add import and render in `<head>`:

```astro
---
import JsonLdSchema from '@components/seo/json-ld-schema.astro';
// ... existing imports
---

<head>
  <!-- ... existing meta tags ... -->

  <!-- JSON-LD Structured Data -->
  <JsonLdSchema pageType="home" />
</head>
```

### Step 4: Validate JSON-LD
1. Run `npm run build`
2. Open dist/index.html
3. Copy JSON-LD scripts
4. Paste into [Google Rich Results Test](https://search.google.com/test/rich-results)
5. Verify no errors

---

## Todo List

- [ ] Create src/components/seo/ directory
- [ ] Create json-ld-schema.astro component
- [ ] Define Organization schema
- [ ] Define WebSite schema with SearchAction
- [ ] Define LocalBusiness (RealEstateAgent) schema
- [ ] Define BreadcrumbList schema
- [ ] Update base-layout.astro to include JsonLdSchema
- [ ] Run npm run build
- [ ] Validate with Google Rich Results Test

---

## Success Criteria

- [ ] JSON-LD renders in page source
- [ ] Valid JSON syntax (no parse errors)
- [ ] Google Rich Results Test shows no errors
- [ ] Organization logo displays in test
- [ ] SearchAction configured correctly

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Invalid JSON | Low | High | Use JSON.stringify() |
| Missing required fields | Low | Medium | Follow schema.org specs |
| Duplicate schemas | Low | Low | Render once in base-layout |

---

## Security Considerations
- No user input in schemas (hardcoded values)
- Use set:html safely with JSON.stringify

---

## Next Steps
- After completion, proceed to [Phase 3: Semantic HTML Audit](./phase-03-semantic-html-audit.md)
