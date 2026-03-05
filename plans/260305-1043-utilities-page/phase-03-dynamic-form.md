# Phase 3: Dynamic Form Component (React Island)

## Overview
- **Priority**: High
- **Status**: Pending
- **Effort**: 2h

## Context Links
- [React component patterns](../../docs/code-standards-components.md#react-component-patterns)
- [v1 form rendering logic](../../reference/resaland_v1/controllers/tienich.py#get_utility_form)

## Key Insights

### v1 Form Flow
1. AJAX fetch form config on utility select
2. Dynamic field rendering based on config
3. Client-side validation (required, min/max)
4. POST to `/api/calculate.json`
5. Display HTML result

### Field Types Supported
- `text` - Basic text input
- `email` - Email input with validation
- `number` - Numeric input with min/max/step
- `select` - Dropdown with options

### Form Config Example
```json
{
  "type": "HouseConstructionAgeCheck",
  "title": "Tư vấn tuổi xây nhà",
  "fields": [
    {
      "name": "birthYear",
      "label": "Năm sinh",
      "type": "number",
      "placeholder": "1990",
      "required": true,
      "min": 1900,
      "max": 2100
    },
    {
      "name": "gender",
      "label": "Giới tính",
      "type": "select",
      "options": [
        { "value": "male", "label": "Nam" },
        { "value": "female", "label": "Nữ" }
      ],
      "required": true
    }
  ]
}
```

## Requirements

### Functional
- Render form fields dynamically from config
- Client-side validation
- Submit to API
- Show loading state during submit
- Display result (delegate to UtilityResult)
- Clear/reset form

### Non-Functional
- React functional component
- TypeScript strict mode
- Accessible form controls
- Error messages in Vietnamese

## Related Code Files

### Files to Create
1. `src/components/utility/utility-form.tsx`

### Files to Reference
- `src/components/header/header-mobile-menu.tsx` (React pattern)
- `src/components/contact/contact-form.astro` (form styling)

## Implementation Steps

### Step 1: Create utility-form.tsx

```tsx
// src/components/utility/utility-form.tsx
import { useState, type FormEvent } from 'react';
import type { UtilityFormConfig, FormField } from '@/services/utility/types';

interface Props {
  config: UtilityFormConfig;
  onResult: (html: string) => void;
}

const API_BASE = 'https://quanly.tongkhobds.com';

export default function UtilityForm({ config, onResult }: Props) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data with empty values
  const initFormData = () => {
    const initial: Record<string, string> = {};
    config.fields.forEach(field => {
      initial[field.name] = '';
    });
    return initial;
  };

  // Validate a single field
  const validateField = (field: FormField, value: string): string => {
    if (field.required && !value.trim()) {
      return `${field.label} là bắt buộc`;
    }

    if (field.type === 'number' && value) {
      const num = parseFloat(value);
      if (isNaN(num)) {
        return `${field.label} phải là số`;
      }
      if (field.min !== undefined && num < field.min) {
        return `${field.label} phải >= ${field.min}`;
      }
      if (field.max !== undefined && num > field.max) {
        return `${field.label} phải <= ${field.max}`;
      }
    }

    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Email không hợp lệ';
      }
    }

    return '';
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    config.fields.forEach(field => {
      const error = validateField(field, formData[field.name] || '');
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Handle input change
  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Build request body
      const body = new URLSearchParams();
      body.append('type', config.type);
      body.append('userId', 'anonymous'); // v1 uses IP, we use anonymous

      Object.entries(formData).forEach(([key, value]) => {
        body.append(key, value);
      });

      const response = await fetch(`${API_BASE}/api/calculate.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await response.json();

      if (data.status === 1 && data.data?.html) {
        onResult(data.data.html);
      } else {
        onResult(`<p class="text-red-600">${data.message || 'Không thể tính toán. Vui lòng thử lại.'}</p>`);
      }
    } catch (error) {
      console.error('Calculate error:', error);
      onResult('<p class="text-red-600">Đã xảy ra lỗi. Vui lòng thử lại sau.</p>');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData(initFormData());
    setErrors({});
    onResult('');
  };

  // Render field based on type
  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';
    const error = errors[field.name];
    const baseInputClass = `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors ${
      error ? 'border-red-500' : 'border-slate-300'
    }`;

    return (
      <div key={field.name} className="mb-4">
        <label className="block text-slate-700 font-medium mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {field.type === 'select' ? (
          <select
            name={field.name}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={baseInputClass}
            disabled={isSubmitting}
          >
            <option value="">-- Chọn --</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <div className="relative">
            <input
              type={field.type}
              name={field.name}
              value={value}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              step={field.step}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className={baseInputClass}
              disabled={isSubmitting}
            />
            {field.unit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                {field.unit}
              </span>
            )}
          </div>
        )}

        {error && (
          <p className="text-red-500 text-sm mt-1">{error}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-2">
        {config.title}
      </h2>
      {config.description && (
        <p className="text-slate-600 text-sm mb-6">{config.description}</p>
      )}

      {config.fields.map(renderField)}

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:bg-orange-300 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang tính toán...
            </span>
          ) : (
            'Xem kết quả'
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={isSubmitting}
          className="px-6 py-3 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Làm lại
        </button>
      </div>
    </form>
  );
}
```

## Todo List

- [ ] Create `src/components/utility/utility-form.tsx`
- [ ] Test with each field type
- [ ] Verify validation messages
- [ ] Test loading state
- [ ] Test error handling
- [ ] Verify form reset

## Success Criteria

- [ ] All field types render correctly
- [ ] Validation works (required, min/max, email)
- [ ] Form submits to API
- [ ] Loading spinner during submit
- [ ] Error messages in Vietnamese
- [ ] Reset clears form and result

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Unknown field types | Skip rendering, log warning |
| API timeout | Show error after 30s |
| Large forms | Scroll within form area |

## Security Considerations

- Sanitize form values before submit
- HTML result sanitized in result component
- No localStorage for sensitive data

## Next Steps

Proceed to phase-04-result-component.md
