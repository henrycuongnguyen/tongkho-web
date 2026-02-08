/**
 * Location Search API Endpoint
 * Returns HTML partial for HTMX autocomplete
 */

import type { APIRoute } from 'astro';
import { searchLocations } from '@/services/elasticsearch/location-search-service';

const TYPE_ICONS: Record<string, string> = {
  province: '🏙️',
  district: '🏘️',
  ward: '📍',
  project: '🏗️',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';
  const limit = parseInt(url.searchParams.get('limit') || '10', 10);
  const baseUrl = url.searchParams.get('base') || '/mua-ban';

  // Minimum 2 characters
  if (query.length < 2) {
    return new Response('', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  const results = await searchLocations({ query, limit });

  if (results.length === 0) {
    return new Response(
      `<div class="p-4 text-center text-slate-500 text-sm">
        Không tìm thấy "${escapeHtml(query)}"
      </div>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  const html = results.map(r => {
    const href = r.type === 'project' ? `/du-an/${r.slug}` : `${baseUrl}/${r.slug}`;
    const icon = TYPE_ICONS[r.type] || '📍';
    return `
      <button
         type="button"
         class="location-result-item w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors border-b border-slate-100 last:border-0 text-left"
         data-slug="${escapeHtml(r.slug)}"
         data-name="${escapeHtml(r.name)}"
         data-type="${escapeHtml(r.type)}"
         data-href="${escapeHtml(href)}">
        <span class="text-lg">${icon}</span>
        <div class="flex-1 min-w-0">
          <div class="font-medium text-slate-800 truncate">${escapeHtml(r.name)}</div>
          <div class="text-sm text-slate-500 truncate">${escapeHtml(r.fullName)}</div>
        </div>
      </button>`;
  }).join('');

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
};
