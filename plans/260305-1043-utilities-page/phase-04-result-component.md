# Phase 4: Result Display Component

## Overview
- **Priority**: High
- **Status**: Pending
- **Effort**: 1h

## Context Links
- [v1 result display](../../reference/resaland_v1/controllers/tienich.py#get_utility_result)

## Key Insights

### v1 Result Behavior
- API returns raw HTML in `data.html`
- Rendered directly in page
- Styled with existing CSS
- Supports tables, lists, paragraphs, colors

### HTML Result Examples
```html
<!-- Success result -->
<div class="feng-shui-result">
  <h3>Kết quả tư vấn</h3>
  <p>Tuổi của bạn phù hợp để xây nhà năm 2026.</p>
  <ul>
    <li>Hướng tốt: Đông, Đông Nam</li>
    <li>Hướng xấu: Tây Bắc</li>
  </ul>
</div>

<!-- Error result -->
<p class="text-red-600">Năm sinh không hợp lệ.</p>
```

## Requirements

### Functional
- Display HTML result safely
- Support common HTML elements
- Show empty state when no result
- Animate result appearance

### Non-Functional
- XSS prevention (sanitize HTML)
- Accessible content
- Print-friendly styling

## Related Code Files

### Files to Create
1. `src/components/utility/utility-result.tsx`

## Implementation Steps

### Step 1: Create utility-result.tsx

```tsx
// src/components/utility/utility-result.tsx
import { useEffect, useRef } from 'react';

interface Props {
  html: string;
}

export default function UtilityResult({ html }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to result when it appears
  useEffect(() => {
    if (html && containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [html]);

  if (!html) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-lg shadow-sm p-6 mt-6 animate-fade-in"
    >
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-orange-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        Kết quả
      </h3>

      {/*
        Render HTML safely using dangerouslySetInnerHTML
        Note: API HTML is trusted (from our backend)
        Add prose classes for typography styling
      */}
      <div
        className="utility-result-content prose prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Print button */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-orange-500 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          In kết quả
        </button>
      </div>
    </div>
  );
}
```

### Step 2: Add CSS for result styling

Add to `src/styles/global.css`:

```css
/* Utility result content styling */
.utility-result-content {
  /* Typography */
  @apply text-slate-700 leading-relaxed;
}

.utility-result-content h3 {
  @apply text-lg font-semibold text-slate-800 mt-4 mb-2;
}

.utility-result-content h4 {
  @apply text-base font-semibold text-slate-700 mt-3 mb-2;
}

.utility-result-content p {
  @apply mb-3;
}

.utility-result-content ul {
  @apply list-disc list-inside mb-3 space-y-1;
}

.utility-result-content ol {
  @apply list-decimal list-inside mb-3 space-y-1;
}

.utility-result-content table {
  @apply w-full border-collapse mb-4;
}

.utility-result-content th,
.utility-result-content td {
  @apply border border-slate-200 px-3 py-2 text-left;
}

.utility-result-content th {
  @apply bg-slate-50 font-semibold;
}

.utility-result-content .text-red-600 {
  @apply text-red-600;
}

.utility-result-content .text-green-600 {
  @apply text-green-600;
}

.utility-result-content .text-orange-600 {
  @apply text-orange-600;
}

/* Fade in animation */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out;
}

/* Print styles */
@media print {
  .utility-result-content {
    @apply break-inside-avoid;
  }

  /* Hide non-essential elements when printing */
  nav, footer, button, .no-print {
    display: none !important;
  }
}
```

## Todo List

- [ ] Create `src/components/utility/utility-result.tsx`
- [ ] Add CSS styles to global.css
- [ ] Test with various HTML structures
- [ ] Verify print functionality
- [ ] Test scroll-to-result behavior

## Success Criteria

- [ ] HTML rendered correctly
- [ ] Typography styled properly
- [ ] Tables/lists display well
- [ ] Print button works
- [ ] Smooth scroll to result
- [ ] Fade-in animation

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| XSS attack | API is trusted; add CSP headers if needed |
| Broken HTML | Wrap in error boundary |
| Large content | Max-height with scroll |

## Security Considerations

- HTML comes from our trusted backend API
- No user-submitted HTML rendered
- CSP headers on server for additional protection

## Next Steps

Proceed to phase-05-page-routes.md
