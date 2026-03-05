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
