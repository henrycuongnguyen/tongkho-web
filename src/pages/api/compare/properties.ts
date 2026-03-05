/**
 * Compare Properties API Endpoint
 * GET /api/compare/properties?ids=1,2
 *
 * Query property comparison data from PostgreSQL v2
 * Replaces v1 API: /api_customer/compare_real_estate.json
 */

import type { APIRoute } from 'astro';
import { getCompareData } from '@/services/compare/compare-service';

export const GET: APIRoute = async ({ url }) => {
  try {
    // Get property IDs from query params
    const idsParam = url.searchParams.get('ids');

    if (!idsParam) {
      return new Response(
        JSON.stringify({
          status: 0,
          message: 'Missing required parameter: ids',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse IDs
    const ids = idsParam.split(',').filter(Boolean);

    if (ids.length === 0) {
      return new Response(
        JSON.stringify({
          status: 0,
          message: 'No valid property IDs provided',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Query comparison data
    const data = await getCompareData(ids);

    // Return v1-compatible format
    return new Response(
      JSON.stringify({
        status: 1,
        data,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[compare-api] Failed to fetch comparison data:', error);

    return new Response(
      JSON.stringify({
        status: 0,
        message: error instanceof Error ? error.message : 'Failed to fetch comparison data',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
