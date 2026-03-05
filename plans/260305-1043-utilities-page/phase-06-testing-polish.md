# Phase 6: Testing & Polish

## Overview
- **Priority**: High
- **Status**: Pending
- **Effort**: 1.5h

## Context Links
- [Testing patterns](../../docs/code-standards.md)

## Key Insights

### Test Coverage Areas
1. **Service layer**: API calls, caching, error handling
2. **Components**: Rendering, props, events
3. **Pages**: Routing, SSR, navigation
4. **Integration**: Form submit → result display

### v1 Behavior Verification
- Compare with v1 live site
- Match URL structure exactly
- Match form field behavior
- Match result display format

## Requirements

### Functional Testing
- All utilities load correctly
- Form validation works
- API calls succeed
- Results display properly
- Navigation works

### Non-Functional Testing
- Page load < 2s
- Mobile responsive
- Accessibility (a11y)
- SEO meta tags present

## Test Cases

### Unit Tests

```typescript
// src/services/utility/utility-service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { getUtilities, getFormConfig, calculateResult } from './utility-service';

describe('utility-service', () => {
  describe('getUtilities', () => {
    it('returns utilities with comparison at index 0', async () => {
      const utilities = await getUtilities();
      expect(utilities[0].slug).toBe('so-sanh');
      expect(utilities[0].name).toBe('So sánh bất động sản');
    });

    it('returns at least 1 utility', async () => {
      const utilities = await getUtilities();
      expect(utilities.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getFormConfig', () => {
    it('returns null for comparison utility', async () => {
      const config = await getFormConfig('sosanh');
      expect(config).toBeNull();
    });

    it('returns form config with fields', async () => {
      const config = await getFormConfig('HouseConstructionAgeCheck');
      expect(config?.fields).toBeDefined();
      expect(config?.fields.length).toBeGreaterThan(0);
    });
  });
});
```

### Integration Tests

```typescript
// Manual testing checklist

// 1. Page Load Tests
// - [ ] /tienich redirects to first utility
// - [ ] /tienich/tu-van-tuoi-xay-nha loads form
// - [ ] /tienich/invalid-slug shows 404 or error
// - [ ] /tienich/so-sanh loads comparison page

// 2. Form Tests
// - [ ] All field types render (text, number, select)
// - [ ] Required validation shows error
// - [ ] Number min/max validation works
// - [ ] Submit shows loading state
// - [ ] Result appears after submit
// - [ ] Reset clears form and result

// 3. Navigation Tests
// - [ ] Sidebar links work
// - [ ] Active state updates on navigation
// - [ ] Breadcrumb links work
// - [ ] Back button works (browser history)

// 4. Mobile Tests
// - [ ] Responsive layout at 375px width
// - [ ] Form usable on mobile
// - [ ] Sidebar accessible
// - [ ] Touch interactions work
```

### Visual Regression

| Page | Check |
|------|-------|
| `/tienich/{slug}` | Sidebar visible, form styled |
| Form fields | Labels, inputs, errors aligned |
| Result area | Typography, colors, spacing |
| Mobile view | Stack layout, touch targets |

## Polish Items

### Accessibility
- [ ] Form labels linked to inputs
- [ ] Error messages announced to screen readers
- [ ] Focus management after submit
- [ ] Keyboard navigation

### Performance
- [ ] Lazy load result component
- [ ] Cache API responses
- [ ] Minimize JS bundle size
- [ ] Image optimization (if any)

### SEO
- [ ] Unique title per utility
- [ ] Meta description
- [ ] Canonical URLs
- [ ] Structured data (optional)

### Error Handling
- [ ] API error shows user message
- [ ] Network error handling
- [ ] Invalid form config fallback
- [ ] Loading timeout

## Implementation Steps

### Step 1: Add error boundary

```tsx
// src/components/utility/utility-error-boundary.tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class UtilityErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Utility error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600 font-medium">Đã xảy ra lỗi</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Thử lại
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Step 2: Add loading skeleton

```astro
<!-- src/components/utility/utility-skeleton.astro -->
<div class="bg-white rounded-lg shadow-sm p-6 animate-pulse">
  <div class="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
  <div class="space-y-4">
    <div>
      <div class="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
      <div class="h-10 bg-slate-200 rounded"></div>
    </div>
    <div>
      <div class="h-4 bg-slate-200 rounded w-1/4 mb-2"></div>
      <div class="h-10 bg-slate-200 rounded"></div>
    </div>
    <div class="h-12 bg-slate-200 rounded w-1/3"></div>
  </div>
</div>
```

### Step 3: Final code review checklist

- [ ] All TypeScript errors resolved
- [ ] No unused imports
- [ ] Consistent naming conventions
- [ ] Error handling in all async functions
- [ ] Console.log removed (except errors)
- [ ] Accessibility attributes present
- [ ] Mobile breakpoints tested

## Todo List

- [ ] Write service layer tests
- [ ] Run manual integration tests
- [ ] Fix any bugs found
- [ ] Add error boundary
- [ ] Add loading skeleton
- [ ] Final code review
- [ ] Update MEMORY.md with learnings

## Success Criteria

- [ ] All tests pass
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Accessible navigation
- [ ] Performance < 2s load
- [ ] Matches v1 functionality

## Known Issues

Document any issues discovered:

| Issue | Severity | Status |
|-------|----------|--------|
| - | - | - |

## Final Checklist

- [ ] Build passes (`npm run build`)
- [ ] Type check passes (`npm run astro check`)
- [ ] Manual testing complete
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Ready for deployment

## Next Steps

After completion:
1. Merge to main branch
2. Deploy to staging
3. QA verification
4. Production deployment
