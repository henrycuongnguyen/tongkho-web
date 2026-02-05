import type { PriceUnit } from '@/types/property';

/**
 * Format price with Vietnamese currency notation
 * Special case: price=-1 means "contact for price" (Thỏa thuận)
 */
export function formatPrice(price: number, unit: PriceUnit): string {
  // Handle negotiable/contact for price
  if (price < 0) {
    return 'Thỏa thuận';
  }
  if (unit === 'billion') {
    return `${price} tỷ`;
  }
  if (unit === 'million') {
    return `${price} triệu`;
  }
  if (unit === 'per_month') {
    return `${price} triệu/tháng`;
  }
  // VND
  if (price >= 1000000) {
    return `${(price / 1000000).toLocaleString('vi-VN')} triệu/m²`;
  }
  return `${price.toLocaleString('vi-VN')} đ/m²`;
}

/**
 * Format number with Vietnamese locale
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('vi-VN');
}

/**
 * Format date to Vietnamese format
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format relative time (e.g., "8 phút trước", "2 giờ trước", "3 ngày trước")
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();

  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  // < 1 hour: show minutes
  if (diffInMinutes < 60) {
    return diffInMinutes <= 1 ? '1 phút trước' : `${diffInMinutes} phút trước`;
  }

  // < 1 day: show hours
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  // < 1 month: show days
  if (diffInDays < 30) {
    return `${diffInDays} ngày trước`;
  }

  // < 1 year: show months
  if (diffInYears < 1) {
    return `${diffInMonths} tháng trước`;
  }

  // >= 1 year: show exact date/time
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Generate slug from Vietnamese text
 */
export function generateSlug(text: string): string {
  const vietnameseMap: Record<string, string> = {
    à: 'a', á: 'a', ả: 'a', ã: 'a', ạ: 'a',
    ă: 'a', ằ: 'a', ắ: 'a', ẳ: 'a', ẵ: 'a', ặ: 'a',
    â: 'a', ầ: 'a', ấ: 'a', ẩ: 'a', ẫ: 'a', ậ: 'a',
    đ: 'd',
    è: 'e', é: 'e', ẻ: 'e', ẽ: 'e', ẹ: 'e',
    ê: 'e', ề: 'e', ế: 'e', ể: 'e', ễ: 'e', ệ: 'e',
    ì: 'i', í: 'i', ỉ: 'i', ĩ: 'i', ị: 'i',
    ò: 'o', ó: 'o', ỏ: 'o', õ: 'o', ọ: 'o',
    ô: 'o', ồ: 'o', ố: 'o', ổ: 'o', ỗ: 'o', ộ: 'o',
    ơ: 'o', ờ: 'o', ớ: 'o', ở: 'o', ỡ: 'o', ợ: 'o',
    ù: 'u', ú: 'u', ủ: 'u', ũ: 'u', ụ: 'u',
    ư: 'u', ừ: 'u', ứ: 'u', ử: 'u', ữ: 'u', ự: 'u',
    ỳ: 'y', ý: 'y', ỷ: 'y', ỹ: 'y', ỵ: 'y',
  };

  return text
    .toLowerCase()
    .split('')
    .map((char) => vietnameseMap[char] || char)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
