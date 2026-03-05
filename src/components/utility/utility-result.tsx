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
