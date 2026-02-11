/**
 * Get Top Searched Locations by Province API
 * Returns HTML partial for HTMX dynamic loading
 * Logic matches v1: Sort districts by search_count DESC, limit to top N
 */

import type { APIRoute } from 'astro';
import { db } from '@/db';
import { locations } from '@/db/schema/location';
import { eq, and, desc, sql } from 'drizzle-orm';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const provinceNId = url.searchParams.get('province') || '';
  const limit = parseInt(url.searchParams.get('limit') || '5', 10);
  const baseUrl = url.searchParams.get('base') || '/mua-ban';
  const format = url.searchParams.get('format') || 'sidebar'; // 'sidebar' (links) or 'dropdown' (buttons)

  if (!provinceNId) {
    return new Response('', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  try {
    // Query top searched districts by province
    // Match v1 logic: filter by city_id, level = 'QuanHuyen', order by search_count DESC
    const topDistricts = await db
      .select({
        nId: locations.nId,
        name: locations.nName,
        slug: locations.nSlugV1, // Use v1 slug for URLs
        searchCount: locations.searchCount,
        nType: locations.nType,
      })
      .from(locations)
      .where(
        and(
          eq(locations.cityId, provinceNId),
          eq(locations.nLevel, 'QuanHuyen'),
          sql`${locations.nStatus} != '6'` // Active locations only
        )
      )
      .orderBy(desc(locations.searchCount))
      .limit(limit);

    if (topDistricts.length === 0) {
      return new Response(
        `<div class="p-3 text-center text-secondary-500 text-sm">
          Chưa có dữ liệu tìm kiếm
        </div>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Generate HTML - different formats for sidebar vs dropdown
    const html = topDistricts
      .map((district, index) => {
        const href = `${baseUrl}/${escapeHtml(district.slug || '')}`;
        const rankNum = index + 1;
        const searchCountFormatted = formatNumber(Number(district.searchCount) || 0);

        // Format for dropdown (buttons with data attributes for click handlers)
        if (format === 'dropdown') {
          return `
          <button
            type="button"
            class="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary-50 transition-colors text-left w-full"
            data-top-district-item
            data-slug="${escapeHtml(district.slug || '')}"
            data-name="${escapeHtml(district.name || '')}"
          >
            <div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 text-primary-600 font-semibold text-sm shrink-0">
              #${rankNum}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-secondary-800 truncate">${escapeHtml(district.name || '')}</div>
              <div class="text-xs text-secondary-500">${searchCountFormatted} lượt tìm kiếm</div>
            </div>
          </button>`;
        }

        // Default format for sidebar (links)
        return `
        <li class="border-b border-secondary-100 last:border-b-0">
          <a href="${href}" class="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary-50 transition-colors group">
            <div class="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 font-bold text-sm">
              #${rankNum}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-secondary-900 group-hover:text-primary-600 transition-colors truncate">
                ${escapeHtml(district.name || '')}
              </p>
              <p class="text-xs text-secondary-500 mt-0.5">
                ${searchCountFormatted} lượt tìm kiếm
              </p>
            </div>
          </a>
        </li>`;
      })
      .join('');

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  } catch (error) {
    console.error('Error fetching top searched locations:', error);
    return new Response(
      `<div class="p-3 text-center text-red-500 text-sm">
        Lỗi tải dữ liệu
      </div>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 500 }
    );
  }
};
