/**
 * Price History Service
 * Fetch price history data from S3 FPT Cloud
 * Matches V1 logic: tongkho_v1/controllers/api_customer.py:read_price_history
 */

// S3 base URL (same as v1)
const S3_BASE_URL = 'https://s3-han02.fptcloud.com/bds-crawl-data/source_price';

/**
 * Price history data point
 */
export interface PriceHistoryPoint {
  date: string;
  value: number;
  unit?: string;
}

/**
 * Analyzed price data
 */
export interface PriceHistoryAnalysis {
  commonPriceValue?: string;
  commonPriceLabel?: string;
  changedPercentValue?: string;
  changedPercentStatus?: number;
  changedPercentLabel?: string;
  percentDistanceFromMaxValue?: string;
  percentDistanceFromMaxLabel?: string;
}

/**
 * Full price history response
 */
export interface PriceHistoryData {
  priceHistory: PriceHistoryPoint[];
  analyzedData: PriceHistoryAnalysis;
  chartTitle: string;
  chartUnit: string;
}

/**
 * Convert to Chart.js format
 */
export interface PriceHistoryChartData {
  labels: string[];
  data: number[];
  unit: string;
  changePercent: number;
  trendDirection: 'up' | 'down' | 'stable';
}

/**
 * Normalize string to slug format (same as v1 canonical function)
 */
function canonical(value: string | undefined | null): string {
  if (!value) return '';
  // Remove Vietnamese diacritics and normalize
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .trim();
  // Replace non-alphanumeric with dashes
  return normalized.replace(/[^0-9A-Za-z]+/g, '-').toLowerCase();
}

/**
 * Fetch price history from S3
 * URL pattern: {base}/{district}/{year}_{slug}.json
 */
export async function fetchPriceHistory(params: {
  district: string;
  year: 2 | 5;
  slug: string;
  ward?: string;
}): Promise<PriceHistoryData | null> {
  const { district, year, slug, ward } = params;

  // Normalize values like v1
  const normalizedDistrict = canonical(district);
  const normalizedWard = ward ? canonical(ward) : null;
  const normalizedSlug = canonical(slug);

  if (!normalizedDistrict || !normalizedSlug) {
    return null;
  }

  // Build URL (ward takes priority over district like v1)
  const location = normalizedWard || normalizedDistrict;
  const fileUrl = `${S3_BASE_URL}/${location}/${year}_${normalizedSlug}.json`;

  // 5s timeout to prevent slow S3 from blocking page render
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(fileUrl, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try district if ward failed
      if (normalizedWard) {
        const districtUrl = `${S3_BASE_URL}/${normalizedDistrict}/${year}_${normalizedSlug}.json`;
        const districtResponse = await fetch(districtUrl, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (districtResponse.ok) {
          const data = await districtResponse.json();
          return transformResponse(data);
        }
      }
      return null;
    }

    const data = await response.json();
    return transformResponse(data);
  } catch (error) {
    console.error('[PriceHistoryService] Fetch failed:', error);
    return null;
  }
}

/**
 * Validate chart point data
 */
function isValidPoint(point: unknown): point is { date?: string; label?: string; value?: number; avg?: number; price?: number; unit?: string } {
  return point !== null && typeof point === 'object';
}

/**
 * Transform S3 response to our format with type validation
 */
function transformResponse(data: unknown): PriceHistoryData {
  if (!data || typeof data !== 'object') {
    return { priceHistory: [], analyzedData: {}, chartTitle: 'Biến động giá', chartUnit: 'tr/m²' };
  }

  const rawData = data as Record<string, unknown>;
  const chartPoints = Array.isArray(rawData.chartPoints) ? rawData.chartPoints : [];
  const analyzedData = (rawData.analyzedData as Record<string, unknown>) || {};

  // Convert chartPoints to our format with validation
  const priceHistory: PriceHistoryPoint[] = chartPoints
    .filter(isValidPoint)
    .map((point) => ({
      date: String(point.date || point.label || ''),
      value: parseFloat(String(point.value || point.avg || point.price || 0)),
      unit: point.unit as string | undefined,
    }));

  return {
    priceHistory,
    analyzedData: {
      commonPriceValue: analyzedData.commonPriceValue as string | undefined,
      commonPriceLabel: analyzedData.commonPriceLabel as string | undefined,
      changedPercentValue: analyzedData.changedPercentValue as string | undefined,
      changedPercentStatus: analyzedData.changedPercentStatus as number | undefined,
      changedPercentLabel: analyzedData.changedPercentLabel as string | undefined,
      percentDistanceFromMaxValue: analyzedData.percentDistanceFromMaxValue as string | undefined,
      percentDistanceFromMaxLabel: analyzedData.percentDistanceFromMaxLabel as string | undefined,
    },
    chartTitle: String(rawData.chartTitle || 'Biến động giá'),
    chartUnit: String(rawData.chartUnit || 'tr/m²'),
  };
}

/**
 * Convert to Chart.js compatible format
 */
export function toChartData(data: PriceHistoryData): PriceHistoryChartData {
  const labels = data.priceHistory.map(p => p.date);
  const values = data.priceHistory.map(p => p.value);

  // Calculate change percent
  const startValue = values[0] || 0;
  const endValue = values[values.length - 1] || 0;
  const changePercent = startValue > 0
    ? ((endValue - startValue) / startValue) * 100
    : 0;

  // Determine trend direction
  let trendDirection: 'up' | 'down' | 'stable' = 'stable';
  if (changePercent > 0.5) trendDirection = 'up';
  else if (changePercent < -0.5) trendDirection = 'down';

  return {
    labels,
    data: values,
    unit: data.chartUnit,
    changePercent,
    trendDirection,
  };
}

/**
 * Get price history for both 2-year and 5-year periods
 */
export async function getPriceHistoryForLocation(params: {
  district: string;
  slug: string;
  ward?: string;
}): Promise<{
  twoYear: PriceHistoryChartData | null;
  fiveYear: PriceHistoryChartData | null;
  analyzedData: PriceHistoryAnalysis | null;
  chartTitle: string;
  chartUnit: string;
} | null> {
  const { district, slug, ward } = params;

  try {
    // Fetch both periods in parallel
    const [twoYearData, fiveYearData] = await Promise.all([
      fetchPriceHistory({ district, year: 2, slug, ward }),
      fetchPriceHistory({ district, year: 5, slug, ward }),
    ]);

    // At least one period must have data
    if (!twoYearData && !fiveYearData) {
      return null;
    }

    return {
      twoYear: twoYearData ? toChartData(twoYearData) : null,
      fiveYear: fiveYearData ? toChartData(fiveYearData) : null,
      analyzedData: twoYearData?.analyzedData || fiveYearData?.analyzedData || null,
      chartTitle: twoYearData?.chartTitle || fiveYearData?.chartTitle || 'Biến động giá',
      chartUnit: twoYearData?.chartUnit || fiveYearData?.chartUnit || 'tr/m²',
    };
  } catch (error) {
    console.error('[PriceHistoryService] Failed to get price history:', error);
    return null;
  }
}
