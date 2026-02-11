/**
 * API endpoint for featured projects
 * Returns HTML fragment for HTMX loading in sidebar
 */
import type { APIRoute } from 'astro';
import { getFeaturedProjects } from '@/services/featured-project-service';

export const GET: APIRoute = async ({ url }) => {
  const limit = parseInt(url.searchParams.get('limit') || '5', 10);
  const excludeProjectId = url.searchParams.get('excludeProjectId')
    ? parseInt(url.searchParams.get('excludeProjectId')!, 10)
    : undefined;

  try {
    const projects = await getFeaturedProjects(limit, excludeProjectId);

    if (projects.length === 0) {
      return new Response('', { status: 204 });
    }

    const FALLBACK_IMAGE = '/images/placeholder-project.jpg';
    const swiperId = `featured-projects-${Math.random().toString(36).substring(2, 11)}`;

    // Generate HTML for Swiper slides
    const slidesHtml = projects
      .map(
        (project) => `
      <div class="swiper-slide">
        <div class="sidebar-featured-property relative h-96 overflow-hidden rounded-lg">
          <div class="absolute inset-0">
            <img
              src="${project.mainImage || FALLBACK_IMAGE}"
              alt="${project.title}"
              class="w-full h-full object-cover"
              loading="lazy"
              onerror="if(!this.dataset.errorHandled){this.dataset.errorHandled='true';this.src='/images/placeholder-project.jpg';this.onerror=null}"
            />
          </div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          <div class="absolute bottom-0 left-0 right-0 p-5 text-white">
            <div class="content mb-4">
              <h4 class="title text-xl font-bold mb-3 line-clamp-2">
                ${project.title}
              </h4>
              ${
                project.description
                  ? `
              <div class="text-address">
                <p class="text-sm leading-relaxed line-clamp-4 text-white/90">
                  ${project.description}
                </p>
              </div>
              `
                  : ''
              }
            </div>
            <a
              href="/du-an/${project.slug}"
              class="block w-full bg-primary-500 hover:bg-primary-600 text-white text-center font-semibold py-3 px-6 rounded-full transition-all duration-300 hover:shadow-lg"
            >
              Xem chi tiết
            </a>
          </div>
        </div>
      </div>
    `
      )
      .join('');

    // Return complete Swiper HTML with initialization script
    const html = `
      <div class="featured-projects-wrapper">
        <div id="${swiperId}" class="swiper rounded-lg overflow-hidden shadow-sm">
          <div class="swiper-wrapper">
            ${slidesHtml}
          </div>
        </div>
      </div>
      <script>
        // Use globally loaded Swiper from npm package (loaded in listing layout)
        (function() {
          // Wait a tick to ensure DOM is ready after HTMX swap
          setTimeout(() => {
            if (typeof Swiper !== 'undefined') {
              new Swiper('#${swiperId}', {
                modules: window.SwiperModules ? [window.SwiperModules.Autoplay] : [],
                slidesPerView: 1,
                spaceBetween: 15,
                loop: ${projects.length > 1},
                autoplay: ${projects.length > 1 ? '{ delay: 5000, disableOnInteraction: false }' : 'false'},
              });
            } else {
              console.warn('[FeaturedProjects] Swiper not loaded globally');
            }
          }, 100);
        })();
      </script>
    `;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Failed to fetch featured projects:', error);
    return new Response('', { status: 500 });
  }
};
