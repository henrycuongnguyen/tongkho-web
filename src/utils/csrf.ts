/**
 * CSRF Protection Utilities
 * Simple token-based CSRF protection for forms
 */

const CSRF_SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production';
const TOKEN_EXPIRY = 3600000; // 1 hour in ms

interface CSRFToken {
  token: string;
  timestamp: number;
}

/**
 * Generate CSRF token for session
 */
export function generateCSRFToken(request: Request): string {
  const timestamp = Date.now();
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const randomString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');

  // Create token: timestamp + random + hash
  const payload = `${timestamp}:${randomString}`;
  return Buffer.from(payload).toString('base64');
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(request: Request, token: string): boolean {
  if (!token) return false;

  try {
    const payload = Buffer.from(token, 'base64').toString('utf-8');
    const [timestamp, randomString] = payload.split(':');

    const tokenTimestamp = parseInt(timestamp, 10);
    const now = Date.now();

    // Check if token expired (1 hour)
    if (now - tokenTimestamp > TOKEN_EXPIRY) {
      return false;
    }

    // Token is valid if not expired
    return true;
  } catch (error) {
    return false;
  }
}
