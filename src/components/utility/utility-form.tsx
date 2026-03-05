// src/components/utility/utility-form.tsx
import { useState, type FormEvent } from 'react';
import type { UtilityFormConfig, FormField } from '@/services/utility/types';

interface Props {
  config: UtilityFormConfig;
  onResult: (html: string) => void;
}

// Use server-side API endpoint (credentials protected)
const CALCULATE_API_URL = '/api/utility/calculate';

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
      // Build request body (JSON format)
      const requestBody: Record<string, any> = {
        type: config.type,
        userId: 0, // Anonymous user
      };

      // Add form data (convert numbers)
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          // Convert numeric fields to numbers
          const field = config.fields.find(f => f.name === key);
          if (field?.type === 'number') {
            requestBody[key] = parseFloat(value);
          } else {
            requestBody[key] = value;
          }
        }
      });

      const response = await fetch(CALCULATE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 1 && data.data?.html) {
        onResult(data.data.html);
      } else {
        onResult(`<p class="text-red-600">${data.message || 'Không thể tính toán. Vui lòng thử lại.'}</p>`);
      }
    } catch (error) {
      console.error('Calculate error:', error);
      onResult('<p class="text-red-600">Đã xảy ra lỗi khi kết nối đến máy chủ. Vui lòng thử lại sau.</p>');
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
          <input
            type={field.type}
            name={field.name}
            value={value}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className={baseInputClass}
            disabled={isSubmitting}
          />
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
