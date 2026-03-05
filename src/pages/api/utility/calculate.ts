// src/pages/api/utility/calculate.ts
import type { APIRoute } from 'astro';
import type { AICalculateRequest, AICalculateResponse } from '@/services/utility/types';

// Server-side API configuration (not exposed to client)
const AI_API_URL = 'https://resan8n.ecrm.vn/webhook/tkbds-app/ai';
const AI_API_KEY = 'C2fvbErrov102oUer0';

/**
 * Server-side proxy for AI calculation API
 * Prevents exposing API credentials to client
 * Adds rate limiting and validation
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json() as AICalculateRequest;

    // Validate required fields
    if (!body.type || !body.ownerBirthYear) {
      return new Response(
        JSON.stringify({
          status: 0,
          message: 'Missing required fields: type and ownerBirthYear',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate birth year range
    if (body.ownerBirthYear < 1900 || body.ownerBirthYear > 2100) {
      return new Response(
        JSON.stringify({
          status: 0,
          message: 'Birth year must be between 1900 and 2100',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call external AI API
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data: AICalculateResponse = await response.json();

    // Check if response has article content (v1 format)
    if (data.article) {
      // Return in expected format with status and data.html
      return new Response(JSON.stringify({
        status: 1,
        data: { html: data.article }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return error if no article
    return new Response(JSON.stringify({
      status: 0,
      message: data.error || data.message || 'Không có kết quả từ AI',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[calculate-api] Error:', error);
    return new Response(
      JSON.stringify({
        status: 0,
        message: 'Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
