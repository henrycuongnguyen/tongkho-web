---
phase: 2
title: "SSR Page Logic with GET/POST Handling"
status: completed
effort: 1.5h
completed_date: 2026-03-05
---

# Phase 2: SSR Page Logic with GET/POST Handling

## Context Links

- [Phase 1 - Database Service](./phase-01-database-service.md)
- [V1 contact controller](../../reference/resaland_v1/controllers/contact.py)
- [Astro SSR documentation](https://docs.astro.build/en/guides/server-side-rendering/)

## Overview

Create SSR-enabled page at `/lien-he` that handles both GET (display) and POST (form submission) requests in the same file, matching v1's controller pattern.

**Priority:** P1 - Core page logic
**Status:** Pending
**Depends on:** Phase 1

## Key Insights

### V1 Controller Pattern

```python
# contact.py
def index():  # GET request
    website_info = get_website_info()
    partner_list = get_partner_list()
    return dict(...)

def send():  # POST request
    # Validate and insert
    session.message = "Success!"
    redirect(URL('contact', 'index'))
```

### V2 SSR Pattern

```astro
---
export const prerender = false; // Enable SSR

if (Astro.request.method === 'POST') {
  // Handle submission
  return Astro.redirect('/lien-he?success=true');
}

// GET - render page
---
```

## Requirements

### Functional
1. Enable SSR for the page (`prerender = false`)
2. Handle GET requests - render page normally
3. Handle POST requests:
   - Parse FormData
   - Validate fields (server-side)
   - Clean budget_range
   - Insert to DB via consultation service
   - Redirect with success/error message
4. Display success/error alerts based on URL params

### Non-functional
1. Server-side validation (not just client-side)
2. Proper error handling with user-friendly messages
3. No JavaScript required for form to work

## Architecture

```
┌─────────────────────────────────────────────┐
│          GET /lien-he                       │
│  ┌───────────────────────────────────────┐  │
│  │  1. Check URL params (?success, ?error) │
│  │  2. Render page with components        │  │
│  │  3. Show alert if params present       │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│         POST /lien-he                       │
│  ┌───────────────────────────────────────┐  │
│  │  1. Parse FormData                     │  │
│  │  2. Validate fields                    │  │
│  │  3. Clean budget_range                 │  │
│  │  4. Call consultation service          │  │
│  │  5. Redirect to /lien-he?success=true  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Related Code Files

### Files to Create
- `src/pages/lien-he.astro` - SSR page with form logic

### Reference Files
- `src/services/consultation-service.ts` - From Phase 1
- `src/data/company-info-data.ts` - Contact info
- `src/data/partners.ts` - Partner logos

## Implementation Steps

### Step 1: Create SSR Page with POST Handler

Create `src/pages/lien-he.astro`:

```astro
---
/**
 * Contact Page - SSR enabled
 * URL: /lien-he
 * Handles both GET (display) and POST (form submission)
 */
import MainLayout from '@/layouts/main-layout.astro';
import { createConsultation } from '@/services/consultation-service';

// Enable SSR for this page
export const prerender = false;

// State for success/error messages
let successMessage = '';
let errorMessage = '';

// Handle POST request (form submission)
if (Astro.request.method === 'POST') {
  try {
    const formData = await Astro.request.formData();

    // Extract form fields
    const fullName = formData.get('full_name')?.toString().trim() || '';
    const email = formData.get('email')?.toString().trim() || '';
    const phoneNumber = formData.get('phone_number')?.toString().trim() || '';
    const budgetRange = formData.get('budget_range')?.toString().trim() || '';
    const location = formData.get('location')?.toString().trim() || '';
    const note = formData.get('note')?.toString().trim() || '';

    // Server-side validation
    const errors: string[] = [];

    if (!fullName) {
      errors.push('Vui lòng nhập họ và tên');
    }

    if (!email) {
      errors.push('Vui lòng nhập email');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Email không hợp lệ');
    }

    if (!phoneNumber) {
      errors.push('Vui lòng nhập số điện thoại');
    } else if (!/^[0-9]{10,11}$/.test(phoneNumber)) {
      errors.push('Số điện thoại không hợp lệ (10-11 số)');
    }

    if (!note) {
      errors.push('Vui lòng nhập nội dung quan tâm');
    }

    // If validation errors, redirect with error message
    if (errors.length > 0) {
      const errorParam = encodeURIComponent(errors.join('. '));
      return Astro.redirect(`/lien-he?error=${errorParam}`);
    }

    // Clean budget range (remove dots, commas)
    const cleanBudget = budgetRange.replace(/[.,\s]/g, '');
    const budgetNumber = cleanBudget ? parseFloat(cleanBudget) : null;

    // Insert to database
    const result = await createConsultation({
      fullName,
      email: email.toLowerCase(),
      phoneNumber,
      budgetRange: budgetNumber,
      location: location || null,
      note,
    });

    if (result.success) {
      // Redirect with success message
      return Astro.redirect('/lien-he?success=true');
    } else {
      // Redirect with error message
      return Astro.redirect('/lien-he?error=Có lỗi xảy ra. Vui lòng thử lại sau');
    }

  } catch (error) {
    console.error('[Contact Page] POST error:', error);
    return Astro.redirect('/lien-he?error=Có lỗi xảy ra. Vui lòng thử lại sau');
  }
}

// GET request - check for success/error params
const urlParams = new URL(Astro.request.url).searchParams;

if (urlParams.get('success') === 'true') {
  successMessage = 'Cảm ơn bạn đã liên hệ với chúng tôi. Chúng tôi sẽ liên hệ lại với bạn trong thời gian sớm nhất!';
}

const errorParam = urlParams.get('error');
if (errorParam) {
  errorMessage = decodeURIComponent(errorParam);
}

// Page metadata
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

  <!-- Success/Error Messages -->
  {successMessage && (
    <div class="bg-green-50 border-l-4 border-green-500 p-4 my-4 container-custom">
      <div class="flex items-center">
        <svg class="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-green-700 font-medium">{successMessage}</p>
      </div>
    </div>
  )}

  {errorMessage && (
    <div class="bg-red-50 border-l-4 border-red-500 p-4 my-4 container-custom">
      <div class="flex items-center">
        <svg class="w-6 h-6 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p class="text-red-700 font-medium">{errorMessage}</p>
      </div>
    </div>
  )}

  <!-- Form Section (Phase 3) -->
  <!-- Info Section (Phase 4) -->
  <!-- Partners Section (Phase 4) -->
  <!-- CTA Section (Phase 4) -->
</MainLayout>
```

### Step 2: Test SSR POST Handler

Test form submission with curl:

```bash
curl -X POST http://localhost:3000/lien-he \
  -d "full_name=Test User" \
  -d "email=test@example.com" \
  -d "phone_number=0912345678" \
  -d "budget_range=2000000000" \
  -d "location=Hà Nội" \
  -d "note=Test message"
```

Should redirect to `/lien-he?success=true`

### Step 3: Update astro.config.mjs (if needed)

Ensure output mode supports SSR:

```javascript
export default defineConfig({
  output: 'hybrid', // or 'server'
  // ...
});
```

## Form Data Flow

```
User submits form
      ↓
POST /lien-he
      ↓
FormData parsed
      ↓
Validation (server-side)
      ↓
   Valid? ──No──→ Redirect /lien-he?error=...
      ↓ Yes
Clean budget
      ↓
DB Insert via consultation-service
      ↓
Success? ──No──→ Redirect /lien-he?error=...
      ↓ Yes
Redirect /lien-he?success=true
      ↓
GET /lien-he?success=true
      ↓
Render page with success message
```

## Todo List

- [x] Create `src/pages/lien-he.astro` with SSR enabled
- [x] Implement POST handler with validation
- [x] Implement GET handler with message display
- [x] Test POST with curl
- [x] Test validation errors
- [x] Test success flow
- [x] Verify DB insert works
- [x] Test redirect behavior

## Success Criteria

1. [x] Page accessible at `/lien-he` (GET)
2. [x] Form submission triggers POST handler
3. [x] Server-side validation catches errors
4. [x] Success redirects to `/lien-he?success=true`
5. [x] Error redirects to `/lien-he?error=...`
6. [x] Success/error messages display correctly
7. [x] Data persists in database
8. [x] Form works without JavaScript

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| SSR not enabled | High | Check astro.config.mjs output mode |
| Form data parsing fails | Medium | Try-catch with error redirect |
| DB connection timeout | Medium | Error handling in service layer |
| Validation bypass | Low | Server-side validation required |

## Security Considerations

- Server-side validation (don't trust client)
- SQL injection prevented by Drizzle ORM
- Rate limiting (TODO: add in production)
- No sensitive data in URL params (use generic messages)
- Consider CAPTCHA for production

## Next Steps

After this phase:
- Proceed to Phase 3 (Contact Form Component)
- Proceed to Phase 4 (Info/Partners/CTA Sections)
- Form component will POST to same page (method="POST")
