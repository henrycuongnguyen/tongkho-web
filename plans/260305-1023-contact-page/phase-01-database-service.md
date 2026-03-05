---
phase: 1
title: "Database Service for Consultation Table"
status: completed
effort: 1h
completed_date: 2026-03-05
---

# Phase 1: Database Service for Consultation Table

## Context Links

- [Consultation table schema](../../src/db/migrations/schema.ts) (line 542-645)
- [DB connection](../../src/db/index.ts)
- [V1 contact controller](../../reference/resaland_v1/controllers/contact.py)

## Overview

Create a service to interact with the `consultation` database table for storing contact form submissions.

**Priority:** P1 - Foundation for API endpoint
**Status:** Pending

## Key Insights

### Consultation Table Fields (from schema.ts)

Required fields for contact form:
- `full_name` (varchar 100)
- `email` (varchar 100)
- `phone_number` (varchar 20)
- `budget_range` (numeric 15,2)
- `note` (text) - stores user message
- `consultation_type` (varchar 20) - set to "1" for general consultation
- `auth_user_id` (bigint) - optional, from token if authenticated
- `aactive` (boolean) - default true
- `created_on` (timestamp) - default CURRENT_TIMESTAMP

Additional optional fields:
- `location` → map to `interested_locations` (text)
- `property_id` (bigint) - optional property reference
- `property_type` (text) - optional

## Requirements

### Functional
1. Create `createConsultation()` function to insert new record
2. Accept form data matching v1 structure
3. Handle optional auth_user_id
4. Return created record ID on success

### Non-functional
1. Type-safe with TypeScript interfaces
2. Error handling with try-catch
3. Input validation at service level

## Architecture

```
┌─────────────────────┐
│  API Endpoint       │
│  /api/contact/submit│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ConsultationService │
│ - createConsultation│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Drizzle ORM       │
│   consultation tbl  │
└─────────────────────┘
```

## Related Code Files

### Files to Create
- `src/services/consultation-service.ts` - New service file
- `src/db/schema/consultation.ts` - Schema re-export for imports

### Files to Modify
- `src/db/schema/index.ts` - Add consultation export

## Implementation Steps

### Step 1: Create Consultation Schema Re-export

Create `src/db/schema/consultation.ts`:

```typescript
/**
 * Consultation table schema re-export
 * Used for contact form submissions
 */
export { consultation } from '../migrations/schema';
```

### Step 2: Update Schema Index

Update `src/db/schema/index.ts`:

```typescript
export * from './consultation';
```

### Step 3: Create Consultation Service

Create `src/services/consultation-service.ts`:

```typescript
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
```

## Todo List

- [x] Create `src/db/schema/consultation.ts`
- [x] Update `src/db/schema/index.ts` with consultation export
- [x] Create `src/services/consultation-service.ts`
- [x] Test service with manual DB insert
- [x] Verify TypeScript types compile

## Success Criteria

1. [x] Service compiles without TypeScript errors
2. [x] `createConsultation()` successfully inserts record
3. [x] Returns record ID on success
4. [x] Handles errors gracefully

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Schema mismatch | High | Verify field names match migrations/schema.ts |
| Connection errors | Medium | Use existing db connection with error handling |
| Type conversion | Low | Use proper numeric/string conversions |

## Security Considerations

- Input sanitization handled at API layer
- SQL injection prevented by Drizzle ORM parameterized queries
- No sensitive data logging in errors

## Next Steps

After this phase:
- Proceed to Phase 2 (API Endpoint)
- Service will be consumed by `/api/contact/submit.ts`
