// src/services/utility/utility-service.ts

import { db } from '@/db';
import { news } from '@/db/schema/news';
import { folder } from '@/db/schema/menu';
import { eq, and, asc } from 'drizzle-orm';
import type { Utility, AICalculateRequest, AICalculateResponse } from './types';
import { hasFormConfig } from './form-configs';

// Folder name for utilities in database
const UTILITIES_FOLDER_NAME = 'tien-ich-tong-kho';

// AI API configuration
const AI_API_URL = 'https://resan8n.ecrm.vn/webhook/tkbds-app/ai';
const AI_API_KEY = 'C2fvbErrov102oUer0';

/**
 * Generate slug from Vietnamese name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Get folder ID by name
 */
async function getFolderIdByName(folderName: string): Promise<number | null> {
  const result = await db
    .select({ id: folder.id })
    .from(folder)
    .where(eq(folder.name, folderName))
    .limit(1);

  return result[0]?.id ?? null;
}

/**
 * Fetch utilities list from database
 * Hardcodes "So sánh bất động sản" at index 0 (v1 behavior)
 */
export async function getUtilities(): Promise<Utility[]> {
  try {
    const folderId = await getFolderIdByName(UTILITIES_FOLDER_NAME);

    if (!folderId) {
      console.warn('[utility-service] Folder not found:', UTILITIES_FOLDER_NAME);
      return getDefaultUtilities();
    }

    const rows = await db
      .select({
        id: news.id,
        name: news.name,
        description: news.description,
        avatar: news.avatar,
        displayOrder: news.displayOrder,
      })
      .from(news)
      .where(and(
        eq(news.folder, folderId),
        eq(news.aactive, true)
      ))
      .orderBy(asc(news.displayOrder));

    const utilities: Utility[] = rows.map(row => ({
      id: row.id,
      name: row.name || 'Tiện ích',
      description: row.description || '',
      slug: generateSlug(row.name || ''),
      icon: row.avatar || undefined,
    }));

    // Filter to only show utilities that have form configs (v1 behavior)
    // Only show utilities with supported form configs to match v1
    const filteredUtilities = utilities.filter(u => hasFormConfig(u.description));

    // Insert comparison utility at index 0 (v1 behavior)
    filteredUtilities.unshift({
      id: 0,
      name: 'So sánh bất động sản',
      description: 'sosanh',
      slug: 'so-sanh',
    });

    return filteredUtilities;
  } catch (error) {
    console.error('[utility-service] Failed to fetch utilities:', error);
    return getDefaultUtilities();
  }
}

/**
 * Default utilities fallback
 */
function getDefaultUtilities(): Utility[] {
  return [{
    id: 0,
    name: 'So sánh bất động sản',
    description: 'sosanh',
    slug: 'so-sanh',
  }];
}

/**
 * Get utility by slug
 */
export async function getUtilityBySlug(slug: string): Promise<Utility | null> {
  const utilities = await getUtilities();
  return utilities.find(u => u.slug === slug) || null;
}

/**
 * Get form config by utility type
 * Returns hardcoded config from form-configs.ts
 */
export { getFormConfig as getFormConfigByType } from './form-configs';

/**
 * Calculate utility result by calling external AI API
 * Returns HTML string
 */
export async function calculateResult(
  request: AICalculateRequest
): Promise<string> {
  try {
    const response = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_API_KEY,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data: AICalculateResponse = await response.json();

    if (data.status !== 1) {
      return `<p class="text-red-600">${data.message || 'Không thể tính toán. Vui lòng thử lại.'}</p>`;
    }

    return data.data?.html || '<p>Không có kết quả.</p>';
  } catch (error) {
    console.error('[utility-service] AI API failed:', error);
    return '<p class="text-red-600">Đã xảy ra lỗi khi kết nối đến máy chủ. Vui lòng thử lại sau.</p>';
  }
}
