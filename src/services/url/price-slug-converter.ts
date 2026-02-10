/**
 * Price slug conversion utilities
 * Direct port from v1: reference/resaland_v1/static/js/module/search-url-builder.js
 * Lines 6-87
 */

/**
 * Predefined price filter options by transaction type
 * Copied exactly from v1 PRICE_FILTERS constant
 */
export const PRICE_FILTERS: Record<string, string[]> = {
  '1': [
    '800000000-1000000000',
    '1000000000-2000000000',
    '2000000000-3000000000',
    '3000000000-5000000000',
    '5000000000-7000000000',
    '7000000000-10000000000',
    '10000000000-20000000000',
    '20000000000-30000000000',
    '30000000000-40000000000',
    '40000000000-60000000000',
    '60000000000-1000000000000',
    '0-0',
  ],
  '2': [
    '0-1000000',
    '1000000-3000000',
    '3000000-5000000',
    '5000000-10000000',
    '10000000-40000000',
    '40000000-70000000',
    '70000000-100000000',
    '100000000-1000000000000',
    '0-0',
  ],
  '3': [
    '10000000-20000000',
    '20000000-35000000',
    '35000000-50000000',
    '50000000-80000000',
    '80000000-1000000000000',
  ],
};

/**
 * Convert price to slug format (e.g., 1500000000 -> '1.5-ty')
 * v1 reference: lines 28-43
 */
export function convertPriceToSlug(price: string | number): string {
  const priceNum = parseInt(String(price)) || 0;

  if (priceNum >= 1000000000) {
    const tyValue = priceNum / 1000000000;
    const formatted = tyValue.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted}-ty`;
  } else if (priceNum >= 1000000) {
    const trieuValue = priceNum / 1000000;
    const formatted = trieuValue.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted}-trieu`;
  } else {
    const trieuValue = priceNum / 1000000;
    const formatted = trieuValue.toFixed(2).replace(/\.?0+$/, '');
    return `${formatted}-trieu`;
  }
}

/**
 * Check if price range matches a predefined option
 * v1 reference: lines 48-57
 */
export function isAPriceOption(
  transactionType: string | number,
  minPrice: string | number,
  maxPrice: string | number
): boolean {
  const typeId = String(transactionType || '1');
  const filters = PRICE_FILTERS[typeId] || PRICE_FILTERS['1'];

  const min = minPrice === null || minPrice === '' ? 0 : parseInt(String(minPrice));
  const max = maxPrice === null || maxPrice === '' ? 1000000000000 : parseInt(String(maxPrice));

  const combine = `${min}-${max}`;
  return filters.includes(combine);
}

/**
 * Build price slug from min/max price
 * v1 reference: lines 62-87
 */
export function buildSlugFromPrice(
  minPrice: string | number,
  maxPrice: string | number
): string {
  const min = parseInt(String(minPrice)) || 0;
  const max = parseInt(String(maxPrice)) || 0;

  // Both prices are 0 - negotiable
  if (min === 0 && max === 0) {
    return 'gia-thuong-luong';
  }

  // Only min_price is 0
  if (min === 0 && max > 0 && max !== 1000000000000) {
    return `gia-duoi-${convertPriceToSlug(max)}`;
  }

  // max_price is the maximum value
  if (min > 0 && max === 1000000000000 && min < max) {
    return `gia-tren-${convertPriceToSlug(min)}`;
  }

  // Both prices are valid and within normal range
  if (min > 0 && max < 1000000000000 && min < max) {
    return `gia-tu-${convertPriceToSlug(min)}-den-${convertPriceToSlug(max)}`;
  }

  return '';
}
