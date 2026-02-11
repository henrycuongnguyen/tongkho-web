import type { PropertySearchFilters } from '@/services/elasticsearch/types';

/**
 * Analytics event types for fallback tracking
 */
interface FallbackEvent {
  eventName: 'zero_results' | 'fallback_success' | 'fallback_click' | 'fallback_back_click';
  level?: 1 | 2 | 3;
  originalFilters?: string;
  resultsCount?: number;
  propertyId?: string;
  timestamp: number;
}

/**
 * Track when original search returns zero results
 * Helps identify common filter combinations that yield no results
 */
export function trackZeroResults(filters: PropertySearchFilters): void {
  if (typeof window === 'undefined') return;

  const event: FallbackEvent = {
    eventName: 'zero_results',
    originalFilters: JSON.stringify(filters),
    timestamp: Date.now(),
  };

  // Google Analytics 4
  if ((window as any).gtag) {
    (window as any).gtag('event', 'zero_results', {
      filters: event.originalFilters,
      transaction_type: filters.transactionType,
      has_price: !!(filters.minPrice || filters.maxPrice),
      has_area: !!(filters.minArea || filters.maxArea),
      has_location: !!(filters.provinceIds?.length || filters.districtIds?.length),
    });
  }

  console.log('[Analytics] Zero results tracked', event);
}

/**
 * Track successful fallback (found results at level N)
 * Measures fallback effectiveness and level distribution
 */
export function trackFallbackSuccess(
  level: 1 | 2 | 3,
  resultsCount: number,
  filters: PropertySearchFilters
): void {
  if (typeof window === 'undefined') return;

  const event: FallbackEvent = {
    eventName: 'fallback_success',
    level,
    resultsCount,
    originalFilters: JSON.stringify(filters),
    timestamp: Date.now(),
  };

  if ((window as any).gtag) {
    (window as any).gtag('event', 'fallback_success', {
      level,
      results_count: resultsCount,
      transaction_type: filters.transactionType,
    });
  }

  console.log('[Analytics] Fallback success tracked', event);
}

/**
 * Track when user clicks on fallback result
 * Measures user engagement with relaxed results
 */
export function trackFallbackClick(
  propertyId: string,
  level: 1 | 2 | 3
): void {
  if (typeof window === 'undefined') return;

  const event: FallbackEvent = {
    eventName: 'fallback_click',
    level,
    propertyId,
    timestamp: Date.now(),
  };

  if ((window as any).gtag) {
    (window as any).gtag('event', 'fallback_click', {
      level,
      property_id: propertyId,
    });
  }

  console.log('[Analytics] Fallback click tracked', event);
}

/**
 * Track when user clicks "back to original search"
 * Indicates dissatisfaction with fallback results
 */
export function trackFallbackBackClick(level: 1 | 2 | 3): void {
  if (typeof window === 'undefined') return;

  if ((window as any).gtag) {
    (window as any).gtag('event', 'fallback_back_click', { level });
  }

  console.log('[Analytics] Fallback back click tracked', level);
}
