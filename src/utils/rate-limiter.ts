/**
 * Simple in-memory rate limiter
 * For production, use Redis or database-backed solution
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 600000); // 10 minutes

export interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
}

/**
 * Check if request is within rate limit
 * @param identifier - Client IP or session ID
 * @param action - Action being rate limited (e.g., 'contact_form')
 * @param options - Rate limit configuration
 * @returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  options: RateLimitOptions
): Promise<boolean> {
  const key = `${action}:${identifier}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry) {
    // First request
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return true;
  }

  // Check if window expired
  if (now > entry.resetTime) {
    // Reset counter
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return true;
  }

  // Within window - check count
  if (entry.count >= options.maxAttempts) {
    return false; // Rate limited
  }

  // Increment count
  entry.count++;
  return true;
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') || // Cloudflare
    'unknown'
  );
}
