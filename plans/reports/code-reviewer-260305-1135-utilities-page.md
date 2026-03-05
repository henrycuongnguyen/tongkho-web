# Code Review Report: Utilities Page Feature

**Date:** March 5, 2026
**Reviewer:** Code Review Agent
**Branch:** detail53
**Feature:** Utilities Page Implementation (`/tienich`)
**Work Context:** D:\tongkho-web

---

## Code Review Summary

### Scope
- **Files Reviewed:** 11 files (4 services, 4 components, 2 pages, 1 stylesheet)
- **Lines of Code:** 729 total
- **Focus:** Recent implementation (utilities page feature)
- **Scout Findings:** Hardcoded API credentials, missing tests, unused imports, deprecated React types

### Overall Assessment

**Quality Score: 7.5/10** - Good implementation with clear architecture and proper separation of concerns. Production-ready but has security and maintainability concerns that should be addressed.

**Strengths:**
- Clean service layer architecture with proper TypeScript typing
- Good separation of concerns (services, components, pages)
- React state management is simple and effective
- Proper error handling in API calls
- Database fallback patterns implemented
- User-friendly form validation with clear error messages

**Weaknesses:**
- **CRITICAL:** Hardcoded API credentials in client-side code
- Missing test coverage (0 tests for new feature)
- Unused imports (tester findings confirmed)
- Deprecated React types usage
- XSS vulnerability via `dangerouslySetInnerHTML` (needs security review)
- Form configs duplicated between service and component

---

## Critical Issues

### 1. **SECURITY: Hardcoded API Credentials in Client-Side Code**

**Severity:** CRITICAL
**Files:**
- `src/components/utility/utility-form.tsx` (lines 11-12)
- `src/services/utility/utility-service.ts` (lines 14-15)

**Issue:**
API credentials are hardcoded in both client-side component AND server-side service:

```typescript
// EXPOSED TO BROWSER
const AI_API_URL = 'https://resan8n.ecrm.vn/webhook/tkbds-app/ai';
const AI_API_KEY = 'C2fvbErrov102oUer0';
```

**Impact:**
- API key exposed in browser bundle (visible in DevTools, source maps, network tab)
- Anyone can extract and abuse the API key
- Violates principle of least privilege
- Potential for API abuse, DOS attacks, cost implications

**Recommended Fix:**
1. Remove ALL API calls from `utility-form.tsx`
2. Create server-side API route: `/api/utility/calculate`
3. Move credential logic to server-only code
4. Use environment variables: `process.env.AI_API_URL` and `process.env.AI_API_KEY`
5. Add rate limiting to prevent abuse

```typescript
// NEW: src/pages/api/utility/calculate.ts
export async function POST({ request }) {
  const AI_API_URL = process.env.AI_API_URL;
  const AI_API_KEY = process.env.AI_API_KEY;

  // Validate + call external API server-side
  // Return sanitized result
}

// UPDATED: utility-form.tsx
const response = await fetch('/api/utility/calculate', {
  method: 'POST',
  body: JSON.stringify(requestBody)
});
```

### 2. **SECURITY: XSS Vulnerability via dangerouslySetInnerHTML**

**Severity:** HIGH
**File:** `src/components/utility/utility-result.tsx` (line 51)

**Issue:**
HTML from external API rendered directly without sanitization:

```typescript
<div dangerouslySetInnerHTML={{ __html: html }} />
```

Comment states "API HTML is trusted (from our backend)" but API is actually EXTERNAL (`resan8n.ecrm.vn`).

**Impact:**
- If external API is compromised, can inject malicious scripts
- No defense against XSS attacks
- User data/sessions at risk

**Recommended Fix:**
1. Use HTML sanitization library (DOMPurify)
2. Define allowlist of safe HTML tags/attributes
3. Strip `<script>`, `onerror`, `onclick` handlers
4. Or: Parse API response as structured data (JSON) instead of raw HTML

```typescript
import DOMPurify from 'dompurify';

const sanitizedHtml = DOMPurify.sanitize(html, {
  ALLOWED_TAGS: ['p', 'h3', 'h4', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'strong', 'em'],
  ALLOWED_ATTR: ['class']
});

<div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
```

---

## High Priority Issues

### 3. **Missing Test Coverage**

**Severity:** HIGH
**Files:** All utility service and component files

**Issue:**
- Zero test files for new feature
- No unit tests for service layer
- No integration tests for form submission
- No validation tests for form fields
- No edge case tests (empty responses, API failures, malformed data)

**Impact:**
- Regressions undetected during refactoring
- Edge cases not validated
- Difficult to maintain with confidence

**Recommended Actions:**
1. Add `src/services/utility/utility-service.test.ts`
   - Test `getUtilities()` with/without DB
   - Test `getUtilityBySlug()` edge cases
   - Test `calculateResult()` error handling
2. Add `src/components/utility/utility-form.test.tsx`
   - Test field validation logic
   - Test form submission flow
   - Test error state rendering
3. Add E2E test for complete user flow

**Priority:** Required before production deployment

### 4. **Unused Import (Build Warning)**

**Severity:** MEDIUM
**File:** `src/services/utility/utility-service.ts` (line 8)

**Issue:**
```typescript
import { getFormConfig as getFormConfigFromConfigs } from './form-configs';
```

Variable `getFormConfigFromConfigs` imported but never used. Build shows warning:
```
ts(6133): 'getFormConfigFromConfigs' is declared but its value is never read.
```

**Impact:**
- Bundle bloat (minor)
- Code confusion (why is this imported?)
- Violates clean code principles

**Fix:**
Remove the import on line 8. Line 118 already re-exports correctly:
```typescript
export { getFormConfig as getFormConfigByType } from './form-configs';
```

### 5. **Deprecated React Type: FormEvent**

**Severity:** MEDIUM
**File:** `src/components/utility/utility-form.tsx` (line 2, line 77)

**Issue:**
```typescript
import { useState, type FormEvent } from 'react';

const handleSubmit = async (e: FormEvent) => {
```

Build warnings:
```
ts(6385): 'FormEvent' is deprecated.
```

**Impact:**
- Will break in future React versions
- TypeScript compilation warnings

**Fix:**
Use `React.FormEvent<HTMLFormElement>` instead:
```typescript
import { useState } from 'react';

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};
```

### 6. **Code Duplication: API Credentials**

**Severity:** MEDIUM
**Files:**
- `utility-form.tsx` (lines 11-12)
- `utility-service.ts` (lines 14-15)

**Issue:**
Same API URL and key defined in TWO places. Violates DRY principle.

**Impact:**
- Credentials must be updated in multiple locations
- Risk of inconsistency
- Maintenance burden

**Fix:**
After implementing server-side API route (Issue #1), remove from component entirely. Keep only in server code with env vars.

---

## Medium Priority Issues

### 7. **Form Config Hardcoding Strategy**

**Severity:** MEDIUM
**File:** `src/services/utility/form-configs.ts`

**Issue:**
All form configs hardcoded in 178 lines of TypeScript. Plan states this is intentional ("don't need database storage"), but creates maintenance burden.

**Analysis:**
- **Pros:** Fast loading, type-safe, no DB queries
- **Cons:** Requires code deploy to add/modify utilities, not admin-editable

**Recommendation:**
- If utilities change rarely: Current approach acceptable
- If admin needs to add utilities: Consider hybrid approach (DB stores config, TypeScript validates)
- Document decision in code comments

**No action required** if utilities are static.

### 8. **Slug Generation Not Validated**

**Severity:** MEDIUM
**File:** `src/services/utility/utility-service.ts` (lines 20-28)

**Issue:**
`generateSlug()` function creates slugs from Vietnamese names but doesn't handle edge cases:
- Empty strings → generates empty slug
- Special characters like `đ` only converted to `d` (missing Đ uppercase)
- No collision detection (multiple items with same name)

**Example Failure:**
```typescript
generateSlug('') // Returns ''
generateSlug('Đồng Hồ') // Returns 'ong-ho' (missing 'd')
```

**Fix:**
```typescript
function generateSlug(name: string): string {
  if (!name || !name.trim()) {
    throw new Error('Cannot generate slug from empty name');
  }

  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')  // ADD: Handle uppercase
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
```

### 9. **Missing Error Boundary**

**Severity:** MEDIUM
**Files:** React components (`utility-container.tsx`, `utility-form.tsx`)

**Issue:**
No React error boundary to catch rendering errors. If form crashes, entire page breaks.

**Impact:**
- Poor user experience on errors
- No fallback UI
- Hard to debug production issues

**Fix:**
Wrap `<UtilityContainer>` in error boundary:
```typescript
// src/components/utility/utility-error-boundary.tsx
export class UtilityErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

### 10. **Form Validation: Gender Not Actually Required**

**Severity:** LOW
**File:** `src/services/utility/form-configs.ts` (lines 38-45, 80-88, 118-126, 158-165)

**Issue:**
Gender field marked as `required: true` in all 4 form configs, but validation doesn't enforce it when field is missing from config.

**Analysis:**
Looking at `utility-form.tsx` line 30-47, validation only runs on fields present in `formData`. If gender field is never initialized, validation skips it.

**Impact:**
- API might receive incomplete data
- Form might submit without gender despite "required" flag

**Fix:**
Initialize all fields in `formData` state or enforce required validation differently:
```typescript
useEffect(() => {
  const initial: Record<string, string> = {};
  config.fields.forEach(field => {
    initial[field.name] = '';
  });
  setFormData(initial);
}, [config]);
```

---

## Low Priority Issues

### 11. **Magic Number: userId = 0**

**Severity:** LOW
**Files:**
- `utility-form.tsx` (line 90)
- `utility-service.ts` (not used in calculateResult)

**Issue:**
Hardcoded `userId: 0` for anonymous users. No constant or explanation.

**Fix:**
```typescript
const ANONYMOUS_USER_ID = 0;  // Add at top of file

requestBody.userId = ANONYMOUS_USER_ID;
```

### 12. **Inconsistent Error Messages**

**Severity:** LOW
**File:** `utility-form.tsx` (lines 124, 128)

**Issue:**
Two different error message formats:
- Line 124: Uses API response message
- Line 128: Generic "Đã xảy ra lỗi..." message

**Recommendation:**
Standardize error format. Consider user-facing vs. technical errors.

### 13. **No Loading State for Initial Data Fetch**

**Severity:** LOW
**File:** `src/pages/tienich/[slug].astro`

**Issue:**
Page fetches utilities from DB at request time but shows no loading state. If DB is slow, page appears blank.

**Impact:**
- Poor perceived performance
- User confusion

**Fix:**
Add Astro loading state or skeleton screen.

---

## Edge Cases Found by Scout

### 14. **Database Connection Failure Handling**

**File:** `src/services/utility/utility-service.ts` (lines 47-92)

**Analysis:**
Good: `getUtilities()` has try-catch with fallback to `getDefaultUtilities()`
Edge case: What if DB connection is slow but doesn't throw? No timeout handling.

**Recommendation:**
Add query timeout to Drizzle queries.

### 15. **Redirect Loop Risk**

**File:** `src/pages/tienich/index.astro` (lines 8-14)

**Issue:**
If `getUtilities()` returns empty array or only comparison utility:
```typescript
const firstUtility = utilities.find(u => u.slug !== 'so-sanh') || utilities[0];
const redirectUrl = `/tienich/${firstUtility?.slug || 'so-sanh'}`;
```

If `utilities` is empty, `firstUtility` is undefined → redirects to `/tienich/undefined`.

**Fix:**
```typescript
const firstUtility = utilities.find(u => u.slug !== 'so-sanh') || utilities[0];
if (!firstUtility) {
  return Astro.redirect('/404', 404);
}
const redirectUrl = `/tienich/${firstUtility.slug}`;
```

### 16. **Form Field Min/Max Not Enforced Server-Side**

**Files:**
- Client validation: `utility-form.tsx` (lines 39-44)
- No server validation in AI API call

**Issue:**
Client validates `ownerBirthYear` must be between 1900-2100, but API receives data directly without server-side validation. Malicious users can bypass client validation.

**Fix:**
Add validation in server-side API route (after implementing Issue #1 fix).

---

## Positive Observations

### Code Quality Wins

1. **Clean Service Layer Architecture**
   - Proper separation: `types.ts`, `form-configs.ts`, `utility-service.ts`
   - Type-safe interfaces for all data structures
   - Good function naming and comments

2. **React State Management**
   - Simple, effective use of `useState`
   - Proper state lifting (container → form → result)
   - No unnecessary global state

3. **User Experience**
   - Real-time validation feedback
   - Loading states with spinner icon
   - Clear error messages in Vietnamese
   - Smooth scroll to results
   - Print button for results

4. **Database Fallback Pattern**
   - `getDefaultUtilities()` ensures page never breaks
   - Graceful degradation if DB unavailable

5. **Accessibility**
   - Required field indicators (`*`)
   - Proper label-input associations
   - Disabled state for buttons during submission

6. **Error Handling**
   - Try-catch in all async operations
   - Console logging for debugging
   - User-friendly error messages

---

## Code Standards Compliance

### TypeScript Usage
- ✅ All interfaces properly typed
- ✅ No `any` types found
- ✅ Proper use of union types (`'text' | 'number' | 'select'`)
- ⚠️ One deprecated type (FormEvent)

### YAGNI / KISS / DRY
- ✅ No over-engineering detected
- ✅ Simple component hierarchy
- ❌ API credentials duplicated (violates DRY)
- ✅ Form rendering logic clean and reusable

### File Organization
- ✅ Follows project structure (services/, components/, pages/)
- ✅ Index files for clean imports
- ✅ Kebab-case file naming
- ✅ Co-located related files

### Code Modularity
- ✅ All files under 200 lines (largest: `form-configs.ts` at 193 lines)
- ✅ Single responsibility per file
- ✅ Proper component composition

---

## Performance Analysis

### Bundle Size
- **Form configs:** 193 lines = ~6KB (acceptable for 4 utilities)
- **React components:** 3 components = ~15KB total
- **Impact:** Minimal bundle size increase

### Database Queries
- **Complexity:** Simple SELECT with WHERE + ORDER BY
- **Indexes:** Assumes `folder` and `displayOrder` indexed
- **Performance:** Should be <10ms with proper indexes

### API Call Optimization
- ✅ No unnecessary re-renders
- ✅ Form only calls API on submit (not on every input change)
- ❌ No caching of API responses (if user submits same data twice, calls API again)

**Recommendation:** Add simple in-memory cache for identical requests.

---

## Security Checklist

| Item | Status | Notes |
|------|--------|-------|
| API credentials exposed | ❌ FAIL | Hardcoded in client code |
| XSS protection | ⚠️ PARTIAL | `dangerouslySetInnerHTML` without sanitization |
| CSRF protection | ❓ UNKNOWN | Page uses POST but no CSRF tokens visible |
| Input validation (client) | ✅ PASS | Regex validation for email, phone, numbers |
| Input validation (server) | ❌ FAIL | No server-side validation |
| SQL injection | ✅ PASS | Uses Drizzle ORM (parameterized queries) |
| Rate limiting | ❌ NONE | API can be spammed |
| Error message leakage | ✅ PASS | No sensitive data in error messages |

**Security Score: 4/8** - Multiple critical security issues must be addressed before production.

---

## Recommended Actions

### MUST FIX (Before Production)

1. **Move API credentials to server-side with env vars** (Issue #1)
2. **Sanitize HTML from external API** (Issue #2)
3. **Add test coverage for service layer** (Issue #3)
4. **Remove unused import** (Issue #4)
5. **Fix FormEvent deprecation** (Issue #5)
6. **Add server-side input validation**
7. **Implement rate limiting on API route**

### SHOULD FIX (Before Merge)

8. **Add error boundary for React components** (Issue #9)
9. **Fix redirect loop risk** (Issue #15)
10. **Handle empty utilities array** (Issue #15)
11. **Fix slug generation edge cases** (Issue #8)

### NICE TO HAVE (Future Sprint)

12. Add response caching for duplicate API calls
13. Add loading skeleton for page data fetch
14. Add admin UI for managing utilities (if needed)
15. Add CSRF protection for form submission
16. Add CAPTCHA for spam prevention
17. Add E2E tests with Playwright

---

## Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| TypeScript Compilation | ⚠️ WARN | PASS | Issues detected (deprecated types) |
| Build Success | ✅ PASS | PASS | Builds successfully |
| Test Coverage | 0% | 80%+ | ❌ FAIL |
| Lines of Code | 729 | <1000 | ✅ PASS |
| File Size (avg) | 66 lines | <200 | ✅ PASS |
| Security Score | 4/8 | 8/8 | ❌ FAIL |
| Code Quality | 7.5/10 | 8/10 | ⚠️ ACCEPTABLE |

---

## Plan TODO List Verification

Checking against `plans/260305-1043-utilities-page/plan.md` success criteria:

- [ ] Query `news` table directly for utilities list → ✅ DONE (utility-service.ts:47-92)
- [ ] Hardcode form configs in TypeScript → ✅ DONE (form-configs.ts)
- [ ] Still call external AI API for calculations → ✅ DONE (utility-form.tsx:106-132)
- [ ] All 4 feng shui calculators working → ⚠️ NEEDS TESTING (configs exist, but untested)
- [ ] Form validation (required, min/max) → ✅ DONE (client-side only)
- [ ] Loading + error states → ✅ DONE (spinner + error messages)
- [ ] Sidebar with active state → ✅ DONE (utility-sidebar.astro)
- [ ] Breadcrumb navigation → ✅ DONE ([slug].astro:41-62)
- [ ] Mobile responsive → ⚠️ NEEDS MANUAL TESTING (Tailwind responsive classes present)
- [ ] v1 URL compatibility → ✅ DONE (uses `/tienich/{slug}`)

**Plan Completion: 8/10 items verified** (2 require manual testing)

---

## Browser Compatibility Notes

- React 19 features used (modern browsers only)
- `scrollIntoView` with `behavior: 'smooth'` (no IE11 support)
- Fetch API (all modern browsers)
- Optional chaining (`?.`) requires transpilation for older browsers

**Recommendation:** Document minimum browser requirements (Chrome 90+, Firefox 88+, Safari 14+)

---

## Deployment Checklist

Before deploying to production:

- [ ] Fix critical security issues (#1, #2)
- [ ] Add environment variables for API credentials
- [ ] Create server-side API route
- [ ] Add HTML sanitization library
- [ ] Write and run tests (minimum 80% coverage)
- [ ] Fix TypeScript warnings
- [ ] Test all 4 calculators manually
- [ ] Test responsive design on mobile devices
- [ ] Add rate limiting
- [ ] Add monitoring/logging for API failures
- [ ] Document API endpoints in project docs
- [ ] Update README with new feature

---

## Conclusion

**Overall Verdict: CONDITIONAL APPROVAL** - Implementation is well-structured and follows good coding practices, but has **CRITICAL SECURITY ISSUES** that MUST be resolved before production deployment.

### Key Strengths
- Clean architecture with proper separation of concerns
- Good TypeScript usage and type safety
- User-friendly form validation and error handling
- Proper database fallback patterns
- Responsive design with Tailwind CSS

### Key Weaknesses
- **BLOCKER:** API credentials exposed in client-side code
- **BLOCKER:** XSS vulnerability via unsanitized HTML
- **BLOCKER:** Zero test coverage
- Missing server-side validation
- No rate limiting

### Recommendation
1. **DO NOT MERGE** until critical security issues are resolved
2. Implement server-side API route to hide credentials
3. Add HTML sanitization for external API responses
4. Write tests for service layer and components
5. Add rate limiting and CSRF protection
6. Then re-review before production deployment

---

## Unresolved Questions

1. **Who owns the external AI API?** Is `resan8n.ecrm.vn` internal or third-party? If third-party, what's the SLA/reliability?
2. **Should utilities be admin-editable?** Current approach requires code deploy to add utilities. Is this acceptable?
3. **What's the expected load?** Do we need response caching or rate limiting per user?
4. **CSRF protection strategy?** Should forms include CSRF tokens?
5. **Error monitoring?** Should API failures be logged to Sentry or similar?
6. **Content Security Policy?** Does site have CSP headers that would block external API calls?

---

**Report Generated:** 2026-03-05 11:35
**Next Review:** After security fixes implemented
**Contact:** Code Reviewer Agent
