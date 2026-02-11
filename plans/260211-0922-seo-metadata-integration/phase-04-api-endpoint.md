# Phase 4: API Endpoint (Optional)

**Priority:** Low (Optional)
**Status:** Pending
**Dependencies:** Phase 2, 3

---

## Overview

Create optional HTTP API endpoint `/api/seo/metadata` for external access to SEO metadata. This matches v1's `/api/get_seo_metadata.json` endpoint but is NOT required for v2's SSR/SSG implementation.

---

## Decision: Skip or Implement?

### Arguments for Skipping
1. **No External Use Case:** v2 uses SSR/SSG, not client-side fetching
2. **Performance:** Direct service calls faster than HTTP overhead
3. **Simplicity:** Fewer components to maintain
4. **Security:** No need to expose endpoint publicly

### Arguments for Implementing
1. **External Integrations:** Future mobile apps, SPA, or external tools
2. **v1 Compatibility:** Existing v1 API consumers
3. **Testing:** Easier to test via HTTP requests
4. **Debugging:** Admin panel could display SEO preview

### Recommendation
**Skip for initial implementation.** Add later if external use case arises.

---

## Implementation (If Needed)

### File: `src/pages/api/seo/metadata.ts`

```typescript
/**
 * SEO Metadata API Endpoint
 * GET /api/seo/metadata?slug=/mua-ban/ha-noi
 *
 * Returns SEO metadata for a given URL slug
 */

import type { APIRoute } from 'astro';
import { getSeoMetadata } from '@/services/seo/seo-metadata-service';
import type { SeoMetadataApiResponse } from '@/services/seo/types';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  // Validate slug parameter
  if (!slug || slug.trim().length === 0) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Slug parameter is required'
      } as SeoMetadataApiResponse),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  try {
    // Fetch SEO metadata
    const metadata = await getSeoMetadata(slug.trim());

    // Return success response
    return new Response(
      JSON.stringify({
        status: 'success',
        data: metadata
      } as SeoMetadataApiResponse),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // 1 hour cache
        }
      }
    );

  } catch (error) {
    console.error('[SeoMetadataAPI] Request failed:', error);

    // Return error response
    return new Response(
      JSON.stringify({
        status: 'error',
        message: 'Failed to fetch SEO metadata'
      } as SeoMetadataApiResponse),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};

// Disable POST, PUT, DELETE
export const POST: APIRoute = () => methodNotAllowed();
export const PUT: APIRoute = () => methodNotAllowed();
export const DELETE: APIRoute = () => methodNotAllowed();

function methodNotAllowed() {
  return new Response(
    JSON.stringify({
      status: 'error',
      message: 'Method not allowed'
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'GET'
      }
    }
  );
}
```

---

## API Specification

### Request

**Endpoint:** `GET /api/seo/metadata`

**Parameters:**
- `slug` (required): URL path (e.g., `/mua-ban/ha-noi`)

**Example:**
```
GET /api/seo/metadata?slug=/mua-ban/ha-noi
```

### Response

**Success (200):**
```json
{
  "status": "success",
  "data": {
    "title": "Mua bán nhà đất tại Hà Nội",
    "titleWeb": "Mua bán nhà đất tại Hà Nội",
    "metaDescription": "Tìm kiếm bất động sản mua bán tại Hà Nội...",
    "contentBelow": "<div>...</div>",
    "ogTitle": "Mua bán nhà đất tại Hà Nội",
    "ogImage": "https://...",
    ...
  }
}
```

**Error (400 - Bad Request):**
```json
{
  "status": "error",
  "message": "Slug parameter is required"
}
```

**Error (500 - Internal Server Error):**
```json
{
  "status": "error",
  "message": "Failed to fetch SEO metadata"
}
```

---

## Testing

### Manual Tests

1. **Valid Slug**
   ```bash
   curl "http://localhost:4321/api/seo/metadata?slug=/mua-ban/ha-noi"
   # Expected: 200 with SEO data
   ```

2. **Invalid Slug**
   ```bash
   curl "http://localhost:4321/api/seo/metadata?slug=/invalid-slug-123"
   # Expected: 200 with default SEO data
   ```

3. **Missing Slug**
   ```bash
   curl "http://localhost:4321/api/seo/metadata"
   # Expected: 400 with error message
   ```

4. **3-Part URL**
   ```bash
   curl "http://localhost:4321/api/seo/metadata?slug=/mua-ban/ha-noi/gia-tu-1-ty-den-2-ty"
   # Expected: 200 with SEO data (price context applied)
   ```

5. **POST Method (Not Allowed)**
   ```bash
   curl -X POST "http://localhost:4321/api/seo/metadata?slug=/mua-ban/ha-noi"
   # Expected: 405 Method Not Allowed
   ```

---

## Caching Strategy

### HTTP Cache Headers
```typescript
headers: {
  'Cache-Control': 'public, max-age=3600' // 1 hour
}
```

### CDN Caching
- Cloudflare/CDN can cache API responses
- Reduces database load
- Stale-while-revalidate pattern

### Cache Invalidation
- Manual: Clear cache when SEO data updates
- Automatic: Short TTL (1 hour) ensures freshness

---

## Security Considerations

### Rate Limiting (Future)
```typescript
// Example with rate-limiter-flexible
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 60, // per 60 seconds
});

// In API handler
await rateLimiter.consume(clientIP);
```

### CORS (If Needed)
```typescript
headers: {
  'Access-Control-Allow-Origin': 'https://tongkhobds.com',
  'Access-Control-Allow-Methods': 'GET',
}
```

### Input Validation
- ✅ Slug parameter validated
- ✅ No SQL injection risk (service handles it)
- ✅ No XSS risk (JSON response)

---

## Success Criteria (If Implemented)

1. ✅ API returns valid JSON responses
2. ✅ Handles missing slug parameter (400 error)
3. ✅ Returns SEO metadata for valid slugs
4. ✅ Returns default SEO for invalid slugs
5. ✅ Supports 3-part URLs with price context
6. ✅ Has proper caching headers
7. ✅ Only allows GET method

---

## Alternative: Admin Preview Tool

Instead of public API, create admin-only preview:

### File: `src/pages/admin/seo-preview.astro`

```astro
---
// Admin-only SEO preview page
import { getSeoMetadata } from '@/services/seo/seo-metadata-service';

const slug = Astro.url.searchParams.get('slug') || '/mua-ban/ha-noi';
const metadata = await getSeoMetadata(slug);
---

<div class="p-8">
  <h1>SEO Preview: {slug}</h1>

  <div class="mt-4">
    <h2>Title</h2>
    <p>{metadata.title}</p>
  </div>

  <div class="mt-4">
    <h2>Meta Description</h2>
    <p>{metadata.metaDescription}</p>
  </div>

  <div class="mt-4">
    <h2>Content Below</h2>
    <div set:html={metadata.contentBelow} />
  </div>
</div>
```

---

## Next Steps

**Decision Required:**
1. Skip API endpoint → Proceed to Phase 5
2. Implement API endpoint → Follow this phase
3. Implement admin preview → Create alternative implementation

**Recommendation:** Skip for now, implement if external use case arises.
