/**
 * Get Districts by Province API
 * Returns HTML partial for HTMX cascade dropdown
 */

import type { APIRoute } from 'astro';
import { getDistrictsByProvinces } from '@/services/location/location-service';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const provinceNId = url.searchParams.get('province') || '';
  const baseUrl = url.searchParams.get('base') || '/mua-ban';

  if (!provinceNId) {
    return new Response('', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  const districtsByProvince = await getDistrictsByProvinces([provinceNId]);
  const districts = districtsByProvince[provinceNId] || [];

  if (districts.length === 0) {
    return new Response(
      `<div class="p-3 text-center text-secondary-500 text-sm">
        Không có quận/huyện
      </div>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const html = districts.map(d => {
    const href = `${baseUrl}/${escapeHtml(d.slug)}`;
    return `
      <a href="${href}"
         class="block px-3 py-2 text-sm text-secondary-700 hover:bg-primary-50 hover:text-primary-600 rounded transition-colors">
        ${escapeHtml(d.name)}
      </a>`;
  }).join('');

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
};
