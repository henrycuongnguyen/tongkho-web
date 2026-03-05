---
title: "Contact Page Implementation"
description: "Build /lien-he contact page matching v1 design with form submission and database integration"
status: completed
priority: P2
effort: 6h
branch: detail53
tags: [contact, form, api, database, ui]
created: 2026-03-05
completed_date: 2026-03-05
progress: 100%
---

# Contact Page Implementation Plan

## Overview

Build the `/lien-he` contact page for v2 that matches v1's display and functionality including:
- **SSR page** handling both GET and POST requests (no separate API)
- Contact form with validation (full_name, email, phone, budget, location, note)
- Form submission processed server-side with redirect
- Company info and contact details section
- Partners carousel section
- CTA section

## V1 Reference Analysis

**Controller:** `reference/resaland_v1/controllers/contact.py`
- `/contact/index` - GET to display page
- `/contact/send` - POST to handle form submission
- consultation_type = 1 (Tư vấn bất động sản)
- Extracts user_id from token cookie if authenticated
- Budget cleaning (removes dots/commas before DB insert)
- Session-based success/error messages + redirect

**View:** `reference/resaland_v1/views/contact/index.html`
- Hero form section with title and benefits
- Contact info section (address, phone, email with SVG icons)
- Partners carousel (infiniteslide)
- CTA section
- Client-side validation (email regex, phone 10-11 digits)
- Budget input formatting (Vietnamese locale with thousand separators)

## V2 SSR Architecture

**Single page handles both GET and POST:**
```astro
// src/pages/lien-he.astro
export const prerender = false; // Enable SSR

if (Astro.request.method === 'POST') {
  // Handle form submission
  // Validate + Insert DB
  // Redirect with ?success=true or ?error=message
}

// GET request - display page
```

## Phase Breakdown

| Phase | Description | Effort | Dependencies |
|-------|-------------|--------|--------------|
| [Phase 1](./phase-01-database-service.md) | Database service for consultation table | 1h | None |
| [Phase 2](./phase-02-ssr-page-logic.md) | SSR page with GET/POST handling | 1.5h | Phase 1 |
| [Phase 3](./phase-03-contact-form-component.md) | Contact form component with validation | 2h | None |
| [Phase 4](./phase-04-page-sections.md) | Info, Partners, CTA sections | 1h | None |
| [Phase 5](./phase-05-testing.md) | Testing and polish | 0.5h | Phases 1-4 |

## Key Dependencies

- `src/db/index.ts` - Database connection
- `src/db/migrations/schema.ts` - consultation table schema
- `src/data/company-info-data.ts` - Company info (address, phone, email)
- `src/data/partners.ts` - Partner logos for carousel
- `src/layouts/main-layout.astro` - Page layout

## File Structure

```
src/
├── pages/
│   └── lien-he.astro                    # SSR page (GET + POST) (NEW)
├── components/
│   └── contact/
│       ├── contact-form.astro           # Main form component (NEW)
│       ├── contact-info-section.astro   # Contact info with icons (NEW)
│       └── contact-cta-section.astro    # CTA section (NEW)
├── services/
│   └── consultation-service.ts          # DB service for consultations (NEW)
└── db/
    └── schema/
        └── consultation.ts              # Consultation table schema (NEW)
```

## Success Criteria

- [x] Phase files created with detailed implementation steps
- [x] Contact page renders at `/lien-he` with SSR
- [x] Form submission works with server-side processing
- [x] Data persists to database consultation table
- [x] Success/error messages via URL params
- [x] Visual design matches v1
- [x] Responsive on mobile/tablet/desktop
- [x] No TypeScript errors

## Technical Decisions

1. **SSR Approach:** Single page handles GET + POST (like v1's controller pattern)
2. **Direct DB Insert:** Store consultations via Drizzle ORM in SSR page logic
3. **Message Display:** URL params (?success=true) instead of v1's sessions
4. **No Client JS Required:** Form works without JavaScript (progressive enhancement)
5. **Reuse Existing Data:** Use `company-info-data.ts` for contact info, `partners.ts` for carousel
