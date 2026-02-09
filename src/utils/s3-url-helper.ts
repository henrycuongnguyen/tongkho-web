/**
 * S3 URL Helper
 * Constructs full S3 URLs from database image keys
 * Based on v1 logic from global_helper.py
 */

// FPT Cloud S3 configuration (from v1)
const S3_CONFIG = {
  endpoint: 'https://s3-han02.fptcloud.com',
  bucket: 'bds-crawl-data',
} as const;

/**
 * Get full S3 URL from image key/path
 * @param imageKey - Image filename or key from database (e.g., "cities/hanoi.jpg")
 * @returns Full S3 URL or undefined if no key provided
 *
 * @example
 * getS3ImageUrl("cities/hanoi.jpg")
 * // Returns: "https://s3-han02.fptcloud.com/bds-crawl-data/cities/hanoi.jpg"
 */
export function getS3ImageUrl(imageKey: string | null | undefined): string | undefined {
  if (!imageKey) return undefined;

  // If already a full URL (starts with http/https), return as-is
  if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
    return imageKey;
  }

  // Construct full S3 URL: {endpoint}/{bucket}/{key}
  return `${S3_CONFIG.endpoint}/${S3_CONFIG.bucket}/${imageKey}`;
}

/**
 * Get city image URL with fallback
 * Prioritizes cityImageWeb over cityImage, with default fallback
 * @param cityImageWeb - Web-optimized image key
 * @param cityImage - Original image key
 * @param fallback - Default fallback URL (Unsplash by default)
 * @returns Image URL
 */
export function getCityImageUrl(
  cityImageWeb: string | null | undefined,
  cityImage: string | null | undefined,
  fallback = 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop'
): string {
  // Try web version first
  const webUrl = getS3ImageUrl(cityImageWeb);
  if (webUrl) return webUrl;

  // Fall back to original image
  const originalUrl = getS3ImageUrl(cityImage);
  if (originalUrl) return originalUrl;

  // Use default fallback
  return fallback;
}
