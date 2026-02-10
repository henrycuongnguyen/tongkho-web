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
  const currentDistrict = url.searchParams.get('current') || '';
  const mode = url.searchParams.get('mode') || 'links'; // 'links' or 'checkboxes'
  const selectedDistricts = url.searchParams.get('selected')?.split(',').filter(Boolean) || [];

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

  // Multi-select mode with checkboxes
  if (mode === 'checkboxes') {
    const html = districts.map(d => {
      const isSelected = selectedDistricts.includes(d.slug);
      return `
        <label class="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-secondary-50 cursor-pointer transition-colors group">
          <input
            type="checkbox"
            class="w-4 h-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            name="districts[]"
            value="${escapeHtml(d.slug)}"
            data-name="${escapeHtml(d.name)}"
            ${isSelected ? 'checked' : ''}
          />
          <span class="text-sm text-secondary-700 group-hover:text-secondary-900">${escapeHtml(d.name)}</span>
        </label>`;
    }).join('');

    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // Single-select mode with links (default)
  const html = districts.map(d => {
    const href = `${baseUrl}/${escapeHtml(d.slug)}`;
    const isActive = d.slug === currentDistrict;
    const classes = isActive
      ? 'flex items-center gap-1.5 py-2 text-sm text-primary-600 font-medium hover:text-primary-700 transition-colors group'
      : 'flex items-center gap-1.5 py-2 text-sm text-secondary-700 hover:text-primary-600 transition-colors group';
    const iconClasses = isActive
      ? 'w-3.5 h-3.5 shrink-0 text-primary-500'
      : 'w-3.5 h-3.5 shrink-0 text-secondary-400 group-hover:text-primary-500';
    return `
      <a href="${href}" class="${classes}">
        <svg class="${iconClasses}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <span class="truncate">${escapeHtml(d.name)}</span>
      </a>`;
  }).join('');

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
};
