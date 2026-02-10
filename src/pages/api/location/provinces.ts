/**
 * API Endpoint: Get all provinces
 * Query params:
 *   - useNew: 'true' for new addresses, 'false' (default) for old addresses
 *   - current: current province slug (optional)
 */
import type { APIRoute } from 'astro';
import { getAllProvincesWithCount } from '@/services/location/location-service';
import { getCityImageUrl } from '@/utils/s3-url-helper';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const useNew = url.searchParams.get('useNew') === 'true'; // default false (old addresses)
  const currentProvince = url.searchParams.get('current') || '';

  try {
    // Fetch provinces based on address type
    const provinces = await getAllProvincesWithCount(undefined, useNew);

    // Get featured provinces (top 5 with images)
    const featured = provinces.filter(p => p.cityImageWeb || p.cityImage).slice(0, 5);

    // Build HTML response
    let html = `
      <!-- Featured Provinces -->
      <div class="mb-6">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          ${featured.map(province => `
            <button
              type="button"
              class="featured-province-card group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                province.slug === currentProvince
                  ? 'ring-2 ring-primary-500'
                  : 'ring-1 ring-secondary-200 hover:ring-primary-300'
              }"
              data-province-slug="${province.slug}"
              data-province-nid="${province.nId}"
              data-province-name="${province.name}"
            >
              <!-- Image -->
              <div class="aspect-[4/3] bg-secondary-100 relative overflow-hidden">
                <img
                  src="${getCityImageUrl(province.cityImageWeb, province.cityImage)}"
                  alt="${province.name}"
                  class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                  onerror="this.src='https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop'"
                />
                <!-- Gradient overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              </div>

              <!-- Name -->
              <div class="absolute bottom-0 left-0 right-0 p-3">
                <h5 class="font-semibold text-white text-sm line-clamp-2 group-hover:text-primary-200 transition-colors">
                  ${province.name}
                </h5>
                ${province.districtCount > 0 ? `
                  <p class="text-white/80 text-xs mt-1">
                    ${province.districtCount} quận/huyện
                  </p>
                ` : ''}
              </div>
            </button>
          `).join('')}
        </div>
      </div>

      <!-- All Provinces -->
      <div>
        <h4 class="text-xl font-bold text-secondary-800 mb-4">Tất cả tỉnh thành</h4>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
          ${provinces.map(province => `
            <button
              type="button"
              class="province-item text-left text-sm py-2 px-3 rounded-lg transition-all duration-150 ${
                province.slug === currentProvince
                  ? 'bg-primary-50 text-primary-600 font-semibold'
                  : 'text-secondary-700 hover:bg-secondary-50 hover:text-primary-600'
              }"
              data-province-slug="${province.slug}"
              data-province-nid="${province.nId}"
              data-province-name="${province.name}"
            >
              ${province.name}
              ${province.districtCount > 0 ? `
                <span class="text-secondary-400 text-xs ml-1">(${province.districtCount})</span>
              ` : ''}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('[API] Failed to fetch provinces:', error);
    return new Response('Failed to load provinces', {
      status: 500,
    });
  }
};
