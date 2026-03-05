/**
 * Consultation Service
 * Handles contact form submissions to database
 */
import { db } from '@/db';
import { consultation } from '@/db/schema';

export interface CreateConsultationInput {
  fullName: string;
  email: string;
  phoneNumber: string;
  budgetRange?: number | null;
  location?: string;
  note: string;
  authUserId?: number | null;
  propertyId?: number | null;
  propertyType?: string | null;
}

export interface CreateConsultationResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Create a new consultation record
 * @param input - Form data from contact form
 * @returns Result with success status and record ID
 */
export async function createConsultation(
  input: CreateConsultationInput
): Promise<CreateConsultationResult> {
  try {
    const result = await db
      .insert(consultation)
      .values({
        fullName: input.fullName,
        email: input.email,
        phoneNumber: input.phoneNumber,
        budgetRange: input.budgetRange?.toString() ?? null,
        interestedLocations: input.location ?? null,
        note: input.note,
        authUserId: input.authUserId ?? null,
        propertyId: input.propertyId ?? null,
        propertyType: input.propertyType ?? null,
        consultationType: '1', // Tư vấn bất động sản
        aactive: true,
        // createdOn auto-defaults to CURRENT_TIMESTAMP
      })
      .returning({ id: consultation.id });

    if (result.length > 0) {
      return {
        success: true,
        id: result[0].id.toString(),
      };
    }

    return {
      success: false,
      error: 'No record created',
    };
  } catch (error) {
    console.error('[ConsultationService] Create failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
