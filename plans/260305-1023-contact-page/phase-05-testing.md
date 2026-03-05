---
phase: 5
title: "Testing and Polish"
status: completed
effort: 0.5h
completed_date: 2026-03-05
---

# Phase 5: Testing and Polish

## Context Links

- [Phase 4 - Contact Page](./phase-04-contact-page.md)
- [V1 contact page](../../reference/resaland_v1/views/contact/index.html)

## Overview

Final testing, bug fixes, and polish for the contact page implementation.

**Priority:** P2 - Quality assurance
**Status:** Pending
**Depends on:** Phase 4

## Test Cases

### 1. Form Validation Tests

| Test | Input | Expected Result |
|------|-------|-----------------|
| Empty form submit | Click submit with empty fields | HTML5 required validation triggers |
| Invalid email | "test@" | Error: "Email không hợp lệ" |
| Valid email | "test@example.com" | No error |
| Invalid phone (too short) | "123456789" | Error: "Số điện thoại không hợp lệ" |
| Invalid phone (too long) | "123456789012" | Error: "Số điện thoại không hợp lệ" |
| Valid phone (10 digits) | "0912345678" | No error |
| Valid phone (11 digits) | "84912345678" | No error |
| Budget formatting | "2000000000" | Displays "2.000.000.000" |
| Budget with VND suffix | Type in budget field | VND suffix visible |

### 2. Form Submission Tests

| Test | Expected Result |
|------|-----------------|
| Valid submission | Green toast: "Cảm ơn bạn đã liên hệ..." |
| Rate limit exceeded | Red toast: "Bạn đã gửi quá nhiều yêu cầu..." |
| Server error | Red toast: "Có lỗi xảy ra..." |
| Loading state | Button shows spinner during submission |
| Form reset | Fields clear on success |

### 3. Database Tests

| Test | Expected Result |
|------|-----------------|
| Record created | New row in `consultation` table |
| Field mapping | All fields populated correctly |
| consultation_type | Value is "1" |
| Budget cleaned | Stored as numeric (no formatting) |

### 4. UI/UX Tests

| Test | Expected Result |
|------|-----------------|
| Desktop layout | 2-column form, side-by-side info/image |
| Tablet layout | Stacked or 2-column depending on width |
| Mobile layout | Single column, full-width elements |
| Toast position | Top-right, visible above all content |
| Toast duration | Auto-hides after 4 seconds |
| Partners carousel | Infinite scroll animation |
| CTA button | Links to search page |

### 5. SEO Tests

| Test | Expected Result |
|------|-----------------|
| Page title | "Liên hệ \| TongkhoBDS" |
| Meta description | Contains "Liên hệ" and "tư vấn" |
| Breadcrumb | Shows: Trang chủ / Liên hệ |
| Static HTML | File exists at `dist/lien-he/index.html` |

## Test Commands

```bash
# 1. TypeScript check
npm run astro check

# 2. Build test
npm run build

# 3. Preview and manual test
npm run preview
# Open http://localhost:4321/lien-he

# 4. Database check (after form submission)
psql $DATABASE_URL -c "SELECT id, full_name, email, phone_number, budget_range, consultation_type, created_on FROM consultation ORDER BY id DESC LIMIT 5;"

# 5. API test with curl
curl -X POST http://localhost:4321/api/contact/submit \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","email":"test@example.com","phone_number":"0912345678","location":"Quận 1","note":"Test message"}'
```

## Polish Checklist

### Visual Polish
- [ ] Check form field spacing consistency
- [ ] Verify error message styling matches design
- [ ] Confirm toast notification styling
- [ ] Check loading spinner animation
- [ ] Verify partners carousel speed
- [ ] Check CTA section gradient colors

### Accessibility
- [ ] All form fields have labels
- [ ] Error messages are associated with fields
- [ ] Tab order is logical
- [ ] Focus states visible
- [ ] Color contrast meets WCAG 2.1

### Performance
- [ ] Page load < 2s on 3G
- [ ] No layout shift on load
- [ ] Images lazy-loaded where appropriate
- [ ] CSS animations smooth (60fps)

### Cross-browser
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Known Issues to Check

1. **Toast z-index**: Ensure toast appears above all content
2. **Budget input on mobile**: Virtual keyboard should show numeric
3. **Partners carousel on resize**: Should adapt smoothly
4. **Form validation on paste**: Validation should trigger

## Bug Fix Template

When fixing bugs:

1. Document the issue
2. Identify root cause
3. Implement fix
4. Test fix
5. Verify no regressions

## Todo List

- [x] Run TypeScript check
- [x] Run build
- [x] Test all form validation cases
- [x] Test form submission
- [x] Verify database insert
- [x] Test responsive layouts
- [x] Test cross-browser
- [x] Fix any bugs found
- [x] Final visual review

## Success Criteria

1. [x] All test cases pass
2. [x] No TypeScript errors
3. [x] Build succeeds
4. [x] Page renders correctly on all devices
5. [x] Form submission works end-to-end
6. [x] Data persists in database
7. [x] No console errors

## Definition of Done

- [x] All phases completed
- [x] All tests pass
- [x] Code reviewed
- [x] Build passes
- [x] Documentation updated
- [x] Ready for merge

## Rollback Plan

If critical issues found:
1. Identify breaking change
2. Revert specific commits
3. Re-test
4. Re-implement with fix

## Next Steps

After completion:
- Merge to main branch
- Deploy to production
- Monitor for errors
- Collect user feedback
