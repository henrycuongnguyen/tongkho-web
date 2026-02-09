/**
 * Location Search API Endpoint
 * Returns HTML partial for HTMX autocomplete
 */

import type { APIRoute } from 'astro';
import { searchLocations } from '@/services/elasticsearch/location-search-service';

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
      `<div class="py-6 text-center text-secondary-500 text-sm">
        Không tìm thấy kết quả cho "${escapeHtml(query)}"
      </div>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // Wrap results in a container with search-results class for list layout
  const resultItems = results.map(r => {
    const href = r.type === 'project' ? `/du-an/${r.slug}` : `${baseUrl}/${r.slug}`;
    return `
      <button
         type="button"
         class="location-result-item flex items-start gap-3 px-1 py-2.5 text-left hover:bg-secondary-50 transition-colors group rounded"
         data-slug="${escapeHtml(r.slug)}"
         data-name="${escapeHtml(r.name)}"
         data-type="${escapeHtml(r.type)}"
         data-href="${escapeHtml(href)}">
        <svg class="w-4 h-4 shrink-0 mt-0.5 text-secondary-400 group-hover:text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <div class="flex-1 min-w-0">
          <div class="text-sm text-secondary-800 font-medium">${escapeHtml(r.fullName)}</div>
        </div>
      </button>`;
  }).join('');

  const html = `<div class="search-results-list space-y-1">${resultItems}</div>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
};
