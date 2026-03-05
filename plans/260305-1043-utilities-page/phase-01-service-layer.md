# Phase 1: Service Layer + Types (REVISED - Database-First)

## Overview
- **Priority**: High
- **Status**: Pending
- **Effort**: 1.5h

## Context Links
- [v1 api.py calculate function](../../reference/tongkho_v1/controllers/api.py#L1153-1260)
- [v1 sample AI responses](../../reference/tongkho_v1/sample_ai_responses.py)
- [Database schema - news](../../src/db/schema/news.ts)
- [Database schema - folder](../../src/db/schema/menu.ts)

## Key Insights

### V2 Architecture (Database-First)

| Data | Source |
|------|--------|
| Utilities list | PostgreSQL: `news` table (folder = "tien-ich-tong-kho") |
| Form config | Hardcoded in `form-configs.ts` |
| AI calculation | External API: `https://resan8n.ecrm.vn/webhook/tkbds-app/ai` |

### Database Structure
```sql
-- folder table: name = 'tien-ich-tong-kho'
-- news table: folder FK, name (title), description (AI type)

SELECT n.* FROM news n
JOIN folder f ON n.folder = f.id
WHERE f.name = 'tien-ich-tong-kho' AND n.aactive = true
ORDER BY n.display_order;
```

### 4 Utility Types + Field Mappings

| Type | Fields Required |
|------|-----------------|
| `HouseConstructionAgeCheck` | ownerBirthYear, expectedStartYear, gender |
| `FengShuiDirectionAdvisor` | ownerBirthYear, houseFacing, gender, lengthOption |
| `ColorAdvisor` | ownerBirthYear, gender, lengthOption |
| `OfficeFengShui` | ownerBirthYear, gender, lengthOption |

## Requirements

### Functional
- Query utilities from `news` table (folder = "tien-ich-tong-kho")
- Return hardcoded form config by utility type
- Call external AI API for calculation
- Handle comparison utility separately (existing page)

### Non-Functional
- Type-safe interfaces
- Error handling with fallbacks
- Build-time data fetching (SSG)

## Architecture

```
utility/
├── types.ts           # TypeScript interfaces
├── form-configs.ts    # HARDCODED form configurations
├── utility-service.ts # Database queries + AI API
└── index.ts           # Barrel export
```

## Related Code Files

### Files to Create
1. `src/services/utility/types.ts`
2. `src/services/utility/form-configs.ts` (NEW)
3. `src/services/utility/utility-service.ts`
4. `src/services/utility/index.ts`

### Files to Reference
- `src/db/index.ts` (Drizzle db instance)
- `src/db/schema/news.ts`
- `src/db/schema/menu.ts`

## Implementation Steps

### Step 1: Create types.ts

```typescript
// src/services/utility/types.ts

export interface Utility {
  id: number;
  name: string;
  description: string;  // AI type (e.g., "HouseConstructionAgeCheck")
  slug: string;
  icon?: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: Array<{ value: string; label: string }>;
}

export interface UtilityFormConfig {
  type: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface AICalculateRequest {
  type: string;
  ownerBirthYear: number;
  expectedStartYear?: number;
  houseFacing?: string;
  gender?: string;
  lengthOption?: string;
  userId: number;
}

export interface AICalculateResponse {
  status: number;
  message?: string;
  data?: {
    html?: string;
  };
}
```

### Step 2: Create form-configs.ts (HARDCODED)

```typescript
// src/services/utility/form-configs.ts

import type { UtilityFormConfig } from './types';

/**
 * Hardcoded form configurations for feng shui utilities
 * Based on v1 API: /api/get_form_config.json
 *
 * Note: These forms are static and don't need database storage.
 * Fields map to AI API payload in utility-service.ts
 */
export const FORM_CONFIGS: Record<string, UtilityFormConfig> = {
  HouseConstructionAgeCheck: {
    type: 'HouseConstructionAgeCheck',
    title: 'Tư vấn tuổi xây nhà',
    description: 'Xem năm nào phù hợp để khởi công xây nhà theo tuổi của bạn',
    fields: [
      {
        name: 'ownerBirthYear',
        label: 'Năm sinh gia chủ',
        type: 'number',
        placeholder: 'VD: 1990',
        required: true,
        min: 1900,
        max: 2100,
      },
      {
        name: 'expectedStartYear',
        label: 'Năm dự kiến khởi công',
        type: 'number',
        placeholder: 'VD: 2026',
        required: true,
        min: 2020,
        max: 2100,
      },
      {
        name: 'gender',
        label: 'Giới tính',
        type: 'select',
        required: true,
        options: [
          { value: 'male', label: 'Nam' },
          { value: 'female', label: 'Nữ' },
        ],
      },
    ],
  },

  FengShuiDirectionAdvisor: {
    type: 'FengShuiDirectionAdvisor',
    title: 'Tư vấn hướng nhà',
    description: 'Xem hướng nhà phù hợp với tuổi và mệnh của bạn',
    fields: [
      {
        name: 'ownerBirthYear',
        label: 'Năm sinh gia chủ',
        type: 'number',
        placeholder: 'VD: 1990',
        required: true,
        min: 1900,
        max: 2100,
      },
      {
        name: 'houseFacing',
        label: 'Hướng nhà',
        type: 'select',
        required: true,
        options: [
          { value: 'North', label: 'Bắc' },
          { value: 'South', label: 'Nam' },
          { value: 'East', label: 'Đông' },
          { value: 'West', label: 'Tây' },
          { value: 'NorthEast', label: 'Đông Bắc' },
          { value: 'NorthWest', label: 'Tây Bắc' },
          { value: 'SouthEast', label: 'Đông Nam' },
          { value: 'SouthWest', label: 'Tây Nam' },
        ],
      },
      {
        name: 'gender',
        label: 'Giới tính',
        type: 'select',
        required: true,
        options: [
          { value: 'male', label: 'Nam' },
          { value: 'female', label: 'Nữ' },
        ],
      },
      {
        name: 'lengthOption',
        label: 'Độ dài tư vấn',
        type: 'select',
        required: false,
        options: [
          { value: 'short', label: 'Ngắn gọn' },
          { value: 'medium', label: 'Trung bình' },
          { value: 'long', label: 'Chi tiết' },
        ],
      },
    ],
  },

  ColorAdvisor: {
    type: 'ColorAdvisor',
    title: 'Tư vấn màu sắc phong thủy',
    description: 'Xem màu sắc phù hợp cho nhà ở, nội thất theo mệnh',
    fields: [
      {
        name: 'ownerBirthYear',
        label: 'Năm sinh gia chủ',
        type: 'number',
        placeholder: 'VD: 1990',
        required: true,
        min: 1900,
        max: 2100,
      },
      {
        name: 'gender',
        label: 'Giới tính',
        type: 'select',
        required: true,
        options: [
          { value: 'male', label: 'Nam' },
          { value: 'female', label: 'Nữ' },
        ],
      },
      {
        name: 'lengthOption',
        label: 'Độ dài tư vấn',
        type: 'select',
        required: false,
        options: [
          { value: 'short', label: 'Ngắn gọn' },
          { value: 'medium', label: 'Trung bình' },
          { value: 'long', label: 'Chi tiết' },
        ],
      },
    ],
  },

  OfficeFengShui: {
    type: 'OfficeFengShui',
    title: 'Tư vấn phong thủy văn phòng',
    description: 'Xem cách bố trí văn phòng phù hợp với tuổi và mệnh',
    fields: [
      {
        name: 'ownerBirthYear',
        label: 'Năm sinh gia chủ',
        type: 'number',
        placeholder: 'VD: 1990',
        required: true,
        min: 1900,
        max: 2100,
      },
      {
        name: 'gender',
        label: 'Giới tính',
        type: 'select',
        required: true,
        options: [
          { value: 'male', label: 'Nam' },
          { value: 'female', label: 'Nữ' },
        ],
      },
      {
        name: 'lengthOption',
        label: 'Độ dài tư vấn',
        type: 'select',
        required: false,
        options: [
          { value: 'short', label: 'Ngắn gọn' },
          { value: 'medium', label: 'Trung bình' },
          { value: 'long', label: 'Chi tiết' },
        ],
      },
    ],
  },
};

/**
 * Get form config by utility type
 */
export function getFormConfig(utilityType: string): UtilityFormConfig | null {
  return FORM_CONFIGS[utilityType] || null;
}

/**
 * Check if utility type has a form config
 */
export function hasFormConfig(utilityType: string): boolean {
  return utilityType in FORM_CONFIGS;
}
```

### Step 3: Create utility-service.ts (DATABASE + AI API)

```typescript
// src/services/utility/utility-service.ts

import { db } from '@/db';
import { news } from '@/db/schema/news';
import { folder } from '@/db/schema/menu';
import { eq, and, asc } from 'drizzle-orm';
import type { Utility, AICalculateRequest, AICalculateResponse } from './types';
import { getFormConfig as getFormConfigFromConfigs } from './form-configs';

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

    // Insert comparison utility at index 0 (v1 behavior)
    utilities.unshift({
      id: 0,
      name: 'So sánh bất động sản',
      description: 'sosanh',
      slug: 'so-sanh',
    });

    return utilities;
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
```

### Step 4: Create index.ts barrel export

```typescript
// src/services/utility/index.ts
export * from './types';
export * from './form-configs';
export * from './utility-service';
```

## Todo List

- [ ] Create `src/services/utility/` directory
- [ ] Create `types.ts` with all interfaces
- [ ] Create `form-configs.ts` with hardcoded configs
- [ ] Create `utility-service.ts` with DB queries + AI API
- [ ] Create `index.ts` barrel export
- [ ] Test database connectivity
- [ ] Test AI API connectivity

## Success Criteria

- [ ] `getUtilities()` queries `news` table, returns list with comparison at index 0
- [ ] `getFormConfigByType()` returns hardcoded config
- [ ] `calculateResult()` calls external AI API, returns HTML
- [ ] Error handling returns fallback data
- [ ] TypeScript compiles without errors

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| DB unavailable | Return hardcoded fallback list |
| Folder not found | Create folder in DB or return fallback |
| AI API down | Show error message with retry button |
| API key exposure | Key already in v1 codebase, consider env var |

## Security Considerations

- API key hardcoded (same as v1 - consider moving to env var)
- No user data stored
- AI responses sanitized in result component

## Next Steps

Proceed to phase-02-sidebar-component.md
