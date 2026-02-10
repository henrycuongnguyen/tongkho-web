/**
 * Get Side Block API Endpoint
 * Returns sidebar filter blocks based on pattern (property_type_slug/location_slug)
 * V1-compatible implementation for v2
 *
 * Usage:
 * - GET /api/sidebar/get-side-block?pattern=nha-dat/ha-noi
 * - GET /api/sidebar/get-side-block?pattern=mua-ban/ha-noi
 * - GET /api/sidebar/get-side-block?pattern=can-ho-chung-cu
 * - GET /api/sidebar/get-side-block?id=123 (backward compatible)
 *
 * Response format:
 * {
 *   "status": 1,
 *   "data": [
 *     {
 *       "title": "Mua bán nhà đất tại Hà Nội",
 *       "filters": [
 *         {
 *           "title": "Quận Ba Đình (1,234)",
 *           "url": "/nha-dat/ba-dinh",
 *           "params": {
 *             "addresses": "ba-dinh",
 *             "property_types": 14,
 *             "transaction_type": 1
 *           }
 *         }
 *       ],
 *       "total_items": 10
 *     }
 *   ]
 * }
 */

import type { APIRoute } from 'astro';
import { getSideBlock } from '@/services/get-side-block-service';

// Cache configuration (15 minutes)
const CACHE_TIME = 15 * 60 * 1000;
const cache = new Map<string, { data: any; timestamp: number }>();

/**
 * Generate cache key from request parameters
 */
function getCacheKey(pattern?: string, id?: string): string {
  if (pattern) {
    return `pattern:${pattern}`;
  }
  if (id) {
    return `id:${id}`;
  }
  return 'unknown';
}

/**
 * Get cached response if valid
 */
function getCachedResponse(key: string): any | null {
  const cached = cache.get(key);
  if (!cached) return null;

  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TIME) {
    cache.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Store response in cache
 */
function setCachedResponse(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Build success response (V1-compatible format)
 */
function buildSuccessResponse(data: any): Response {
  return new Response(JSON.stringify({
    status: 1,
    data
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=900' // 15 minutes
    }
  });
}

/**
 * Build error response (V1-compatible format)
 */
function buildErrorResponse(message: string, statusCode: number = 400): Response {
  return new Response(JSON.stringify({
    status: 0,
    message
  }), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const pattern = url.searchParams.get('pattern') || undefined;
    const id = url.searchParams.get('id') || undefined;

    // Validate parameters
    if (!pattern && !id) {
      return buildErrorResponse('Missing required parameter: pattern or id', 400);
    }

    // Check cache
    const cacheKey = getCacheKey(pattern, id);
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      console.log('[GetSideBlock] Cache hit:', cacheKey);
      return buildSuccessResponse(cached);
    }

    // Parse id if provided
    const propertyId = id ? parseInt(id, 10) : undefined;
    if (id && isNaN(propertyId!)) {
      return buildErrorResponse('Invalid property ID', 400);
    }

    // Get side block data
    const blocks = await getSideBlock({
      pattern,
      id: propertyId
    });

    // Cache response
    setCachedResponse(cacheKey, blocks);

    console.log('[GetSideBlock] Success:', {
      cacheKey,
      blocksCount: blocks.length,
      totalFilters: blocks.reduce((sum, b) => sum + b.filters.length, 0)
    });

    return buildSuccessResponse(blocks);

  } catch (error: any) {
    console.error('[GetSideBlock] Error:', error);

    // Handle specific errors
    if (error.message === 'Property type not found') {
      return buildErrorResponse('Không tìm thấy loại bất động sản', 404);
    }

    if (error.message === 'Location not found') {
      return buildErrorResponse('Không tìm thấy địa điểm', 404);
    }

    if (error.message === 'Invalid pattern') {
      return buildErrorResponse('Pattern không hợp lệ', 400);
    }

    if (error.message === 'Pattern missing location detail') {
      return buildErrorResponse('Pattern thiếu chi tiết', 400);
    }

    // Generic error
    return buildErrorResponse('Vui lòng thử lại sau', 500);
  }
};
