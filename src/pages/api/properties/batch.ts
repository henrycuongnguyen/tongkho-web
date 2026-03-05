/**
 * Batch Properties API
 * Fetch multiple properties by IDs for watched properties feature
 * GET /api/properties/batch?ids=1,2,3
 */
import type { APIRoute } from 'astro';
import { db } from '@/db';
import { realEstate } from '@/db/schema';
import { inArray, eq, and } from 'drizzle-orm';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(clientId);

  if (!record || now > record.resetAt) {
    // Create new record
    rateLimitMap.set(clientId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  // Increment count
  record.count++;
  return true;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

export const GET: APIRoute = async ({ request, clientAddress }) => {
  // Rate limiting check
  const clientId = clientAddress || 'unknown';
  if (!checkRateLimit(clientId)) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    });
  }

  const url = new URL(request.url);
  const idsParam = url.searchParams.get('ids');

  if (!idsParam) {
    return new Response(JSON.stringify({ error: 'Missing ids parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ids = idsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));

  if (ids.length === 0 || ids.length > 20) {
    return new Response(JSON.stringify({ error: 'Invalid ids (0 < count <= 20)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const properties = await db
      .select({
        id: realEstate.id,
        title: realEstate.title,
        slug: realEstate.slug,
        price: realEstate.price,
        priceDescription: realEstate.priceDescription,
        transactionType: realEstate.transactionType,
        mainImage: realEstate.mainImage,
        city: realEstate.city,
        district: realEstate.district,
        area: realEstate.area,
      })
      .from(realEstate)
      .where(
        and(
          inArray(realEstate.id, ids),
          eq(realEstate.aactive, true)
        )
      )
      .limit(20);

    // Helper function to build full image URL
    const buildImageUrl = (imagePath: string | null): string => {
      if (!imagePath) return '';

      // Replace localhost URLs with production domain
      if (imagePath.includes('localhost:4321') || imagePath.includes('localhost')) {
        return imagePath
          .replace(/http:\/\/localhost:4321/g, 'https://quanly.tongkhobds.com')
          .replace(/https:\/\/localhost:4321/g, 'https://quanly.tongkhobds.com')
          .replace(/http:\/\/localhost/g, 'https://quanly.tongkhobds.com')
          .replace(/https:\/\/localhost/g, 'https://quanly.tongkhobds.com');
      }

      // If already a full URL with correct domain, return as-is
      if (imagePath.startsWith('https://quanly.tongkhobds.com')) {
        return imagePath;
      }

      // If it's a full URL with different domain, return as-is
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
      }

      // Otherwise, prepend quanly.tongkhobds.com domain
      return `https://quanly.tongkhobds.com${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    };

    // Transform to API response format
    const result = properties.map(p => ({
      id: String(p.id),
      title: p.title || '',
      slug: p.slug || '',
      price: p.price ? parseFloat(p.price) : 0,
      priceUnit: p.transactionType === 2 ? 'per_month' : 'total',
      transactionType: p.transactionType === 1 ? 'sale' : 'rent',
      thumbnail: buildImageUrl(p.mainImage),
      city: p.city || '',
      district: p.district || '',
      area: p.area ? parseFloat(String(p.area)) : 0,
    }));

    // Preserve order from request
    const orderedResult = ids
      .map(id => result.find(p => p.id === String(id)))
      .filter(Boolean);

    return new Response(JSON.stringify({ properties: orderedResult }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',  // 5 min cache
      },
    });
  } catch (error) {
    console.error('Batch properties API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
