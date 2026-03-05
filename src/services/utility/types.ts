// src/services/utility/types.ts

/**
 * Utility item from database
 */
export interface Utility {
  id: number;
  name: string;
  description: string; // AI type (e.g., "HouseConstructionAgeCheck")
  slug: string;
  icon?: string;
}

/**
 * Form field configuration
 */
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

/**
 * Utility form configuration
 */
export interface UtilityFormConfig {
  type: string;
  title: string;
  description?: string;
  fields: FormField[];
}

/**
 * AI calculation API request payload
 */
export interface AICalculateRequest {
  type: string;
  ownerBirthYear: number;
  expectedStartYear?: number;
  houseFacing?: string;
  gender?: string;
  lengthOption?: string;
  userId: number;
}

/**
 * AI calculation API response
 * API returns 'article' field with HTML content (v1 format)
 */
export interface AICalculateResponse {
  article?: string;
  error?: string;
  message?: string;
}
