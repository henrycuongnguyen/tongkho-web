---
phase: 3
title: "Contact Form Component with Validation"
status: completed
effort: 2h
completed_date: 2026-03-05
---

# Phase 3: Contact Form Component with Validation

## Context Links

- [V1 contact form HTML](../../reference/resaland_v1/views/contact/index.html) (lines 22-75)
- [V1 validation JS](../../reference/resaland_v1/views/contact/index.html) (lines 271-346)
- [Existing contact card](../../src/components/shared/contact-card.astro)
- [Company info data](../../src/data/company-info-data.ts)

## Overview

Create contact form component matching v1's design with real-time validation and submission handling.

**Priority:** P1 - Core user-facing component
**Status:** Pending

## Key Insights

### V1 Form Fields

1. `full_name` - Text input, required
2. `email` - Email input, required, regex validation
3. `phone_number` - Text input, required, 10-11 digits
4. `budget_range` - Text input with VND suffix, formatted with thousand separators
5. `location` - Text input, required
6. `note` - Textarea, required

### V1 Validation Rules

**Email:**
- Required
- Pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- Real-time validation on input

**Phone:**
- Required
- Pattern: `/^[0-9]{10,11}$/`
- Real-time validation on input

**Budget:**
- Vietnamese locale formatting (1.000.000)
- Strips non-digits on input
- Formats with `toLocaleString('vi-VN')`

### V1 Benefits List

- Hoàn toàn miễn phí
- Tư vấn nhanh chóng
- Bảo mật thông tin tuyệt đối

## Requirements

### Functional
1. Match v1 form layout (2-column for name/email, phone/budget)
2. Real-time validation with error messages
3. Budget input auto-formatting
4. Submit via fetch to API endpoint
5. Toast notifications for success/error
6. Loading state during submission
7. Form reset on success

### Non-functional
1. Accessible (labels, ARIA attributes)
2. Responsive (stack on mobile)
3. Match v1 styling as closely as possible

## Architecture

```
┌─────────────────────────────────────┐
│         contact-form.astro          │
├─────────────────────────────────────┤
│  Form Structure (Astro HTML)        │
│  - Input fields with labels         │
│  - Error message containers         │
│  - Benefits list                    │
│  - Submit button                    │
├─────────────────────────────────────┤
│  Client-side Script                 │
│  - Real-time validation             │
│  - Budget formatting                │
│  - Form submission (fetch)          │
│  - Toast notification               │
└─────────────────────────────────────┘
```

## Related Code Files

### Files to Create
- `src/components/contact/contact-form.astro` - Main form component
- `src/components/contact/contact-info-section.astro` - Contact info with icons
- `src/components/contact/contact-cta-section.astro` - CTA section

### Reference Files
- `src/components/ui/share-modal.astro` - Toast notification pattern (lines 184-195)
- `src/components/shared/contact-card.astro` - SVG icons reference

## Implementation Steps

### Step 1: Create Contact Form Component

Create `src/components/contact/contact-form.astro`:

```astro
---
/**
 * Contact Form Component
 * Matching v1 design with real-time validation
 */
---

<section class="bg-secondary-50 py-16">
  <div class="container-custom">
    <form id="contactForm" class="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h2 class="text-2xl lg:text-3xl font-bold text-secondary-800 mb-3">
          Để lại thông tin – Tìm nhà nhanh, giá tốt, hỗ trợ tận tâm
        </h2>
        <p class="text-secondary-600">
          Chia sẻ với chúng tôi về nhu cầu của bạn. Tìm nhà nhẹ nhàng hơn khi có người đồng hành.
        </p>
      </div>

      <!-- Form Fields -->
      <div class="space-y-6">
        <!-- Row 1: Name & Email -->
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Full Name -->
          <div>
            <label for="full_name" class="block text-sm font-medium text-secondary-700 mb-2">
              Họ và tên: <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              placeholder="Nhập họ và tên của bạn"
              class="w-full px-4 py-3 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              required
            />
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-secondary-700 mb-2">
              Email: <span class="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Chúng tôi sẽ gửi thông tin chi tiết đến email này"
              class="w-full px-4 py-3 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              required
            />
            <div id="email-error" class="hidden mt-2 text-sm text-red-500"></div>
          </div>
        </div>

        <!-- Row 2: Phone & Budget -->
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Phone -->
          <div>
            <label for="phone_number" class="block text-sm font-medium text-secondary-700 mb-2">
              Số điện thoại: <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="phone_number"
              name="phone_number"
              placeholder="Nhập số điện thoại của bạn"
              class="w-full px-4 py-3 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              required
            />
            <div id="phone-error" class="hidden mt-2 text-sm text-red-500"></div>
          </div>

          <!-- Budget -->
          <div>
            <label for="budget_range" class="block text-sm font-medium text-secondary-700 mb-2">
              Ngân sách:
            </label>
            <div class="relative">
              <input
                type="text"
                id="budget_range"
                name="budget_range"
                placeholder="VD: 2.000.000.000"
                class="w-full px-4 py-3 pr-16 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-secondary-500 text-sm pointer-events-none">
                VND
              </span>
            </div>
          </div>
        </div>

        <!-- Location -->
        <div>
          <label for="location" class="block text-sm font-medium text-secondary-700 mb-2">
            Khu vực bạn quan tâm: <span class="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="location"
            name="location"
            placeholder="VD: Quận 7 – TP.HCM, Ba Đình – Hà Nội,..."
            class="w-full px-4 py-3 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            required
          />
        </div>

        <!-- Note/Message -->
        <div>
          <label for="note" class="block text-sm font-medium text-secondary-700 mb-2">
            Nội dung quan tâm: <span class="text-red-500">*</span>
          </label>
          <textarea
            id="note"
            name="note"
            rows="4"
            placeholder="VD: Tôi muốn tìm căn hộ 2PN tại Quận 7, gần trường học, tài chính dưới 2 tỷ"
            class="w-full px-4 py-3 border border-secondary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
            required
          ></textarea>
        </div>

        <!-- Benefits -->
        <div class="flex flex-wrap gap-4 text-sm text-secondary-600">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Hoàn toàn miễn phí</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Tư vấn nhanh chóng</span>
          </div>
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Bảo mật thông tin tuyệt đối</span>
          </div>
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          id="submitBtn"
          class="w-full md:w-auto px-8 py-4 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span id="submitText">Gửi thông tin ngay</span>
          <span id="submitLoading" class="hidden">
            <svg class="animate-spin inline-block w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Đang gửi...
          </span>
        </button>
      </div>
    </form>
  </div>
</section>

<script>
  // Budget input formatting
  const budgetInput = document.getElementById('budget_range') as HTMLInputElement;
  budgetInput?.addEventListener('input', function() {
    let raw = this.value.replace(/\D/g, '');
    if (!raw) {
      this.value = '';
      return;
    }
    this.value = Number(raw).toLocaleString('vi-VN');
  });

  // Email validation
  const emailInput = document.getElementById('email') as HTMLInputElement;
  const emailError = document.getElementById('email-error') as HTMLElement;

  emailInput?.addEventListener('input', function() {
    const email = this.value;
    if (!email) {
      showError(emailError, 'Vui lòng nhập email');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError(emailError, 'Email không hợp lệ. Vui lòng nhập đúng định dạng email');
    } else {
      hideError(emailError);
    }
  });

  // Phone validation
  const phoneInput = document.getElementById('phone_number') as HTMLInputElement;
  const phoneError = document.getElementById('phone-error') as HTMLElement;

  phoneInput?.addEventListener('input', function() {
    const phone = this.value;
    if (!phone) {
      showError(phoneError, 'Vui lòng nhập số điện thoại');
    } else if (!/^[0-9]{10,11}$/.test(phone)) {
      showError(phoneError, 'Số điện thoại không hợp lệ. Vui lòng nhập 10-11 số');
    } else {
      hideError(phoneError);
    }
  });

  // Error display helpers
  function showError(element: HTMLElement, message: string) {
    element.textContent = message;
    element.classList.remove('hidden');
  }

  function hideError(element: HTMLElement) {
    element.classList.add('hidden');
  }

  // Toast notification
  function showToast(message: string, type: 'success' | 'error' = 'success') {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    toast.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-4 rounded-lg shadow-xl z-[9999] max-w-md animate-fadeIn`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Form submission
  const form = document.getElementById('contactForm') as HTMLFormElement;
  const submitBtn = document.getElementById('submitBtn') as HTMLButtonElement;
  const submitText = document.getElementById('submitText') as HTMLElement;
  const submitLoading = document.getElementById('submitLoading') as HTMLElement;

  form?.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Validate before submit
    const email = emailInput.value;
    const phone = phoneInput.value;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError(emailError, 'Email không hợp lệ');
      emailInput.focus();
      return;
    }

    if (!/^[0-9]{10,11}$/.test(phone)) {
      showError(phoneError, 'Số điện thoại không hợp lệ');
      phoneInput.focus();
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitText.classList.add('hidden');
    submitLoading.classList.remove('hidden');

    try {
      const formData = new FormData(form);
      const data = {
        full_name: formData.get('full_name'),
        email: formData.get('email'),
        phone_number: formData.get('phone_number'),
        budget_range: formData.get('budget_range'),
        location: formData.get('location'),
        note: formData.get('note'),
      };

      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        showToast(result.message, 'success');
        form.reset();
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      showToast('Có lỗi xảy ra. Vui lòng thử lại sau.', 'error');
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      submitText.classList.remove('hidden');
      submitLoading.classList.add('hidden');
    }
  });
</script>

<style>
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
</style>
```

### Step 2: Create Contact Info Section

Create `src/components/contact/contact-info-section.astro`:

```astro
---
/**
 * Contact Info Section
 * Company details with SVG icons matching v1 design
 */
import { companyInfo } from '@/data/company-info-data';
---

<section class="py-16 bg-white">
  <div class="container-custom">
    <div class="grid lg:grid-cols-2 gap-12">
      <!-- Left: Info with dark background -->
      <div class="bg-primary-600 rounded-2xl p-8 lg:p-12 text-white">
        <h2 class="text-2xl lg:text-3xl font-bold mb-4">
          Chúng tôi là sàn thông tin bất động sản lớn nhất Việt Nam.
        </h2>
        <p class="text-primary-100 mb-4">
          Từ căn hộ cho thuê đến đất nền, nhà phố, căn hộ cao cấp –
          bạn sẽ dễ dàng tìm thấy lựa chọn ưng ý nhất với bộ lọc thông minh từ
          <a href="/" class="underline hover:text-white">TongkhoBDS.com</a>.
        </p>
        <p class="text-primary-100 mb-8">
          Chúng tôi luôn đồng hành cùng bạn, tiết kiệm thời gian, tối ưu hiệu quả và an tâm hơn khi giao dịch bất động sản.
        </p>

        <!-- Contact Items -->
        <div class="space-y-6">
          <!-- Address -->
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
            </div>
            <div>
              <p class="text-primary-200 text-sm mb-1">Địa chỉ văn phòng</p>
              <p class="text-white">{companyInfo.address}</p>
            </div>
          </div>

          <!-- Phone -->
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
            </div>
            <div>
              <p class="text-primary-200 text-sm mb-1">Số điện thoại</p>
              <a href={`tel:${companyInfo.hotline.replace(/\s/g, '')}`} class="text-white hover:underline text-lg font-medium">
                {companyInfo.hotline}
              </a>
            </div>
          </div>

          <!-- Email -->
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div>
              <p class="text-primary-200 text-sm mb-1">Địa chỉ email</p>
              <a href={`mailto:${companyInfo.email}`} class="text-white hover:underline">
                {companyInfo.email}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Image -->
      <div class="relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop"
          alt="Liên hệ TongkhoBDS"
          class="w-full h-full object-cover rounded-2xl"
          loading="lazy"
        />
      </div>
    </div>
  </div>
</section>
```

### Step 3: Create CTA Section

Create `src/components/contact/contact-cta-section.astro`:

```astro
---
/**
 * Contact CTA Section
 * Call to action matching v1 design
 */
---

<section class="py-12 bg-gradient-to-r from-primary-600 to-primary-700">
  <div class="container-custom">
    <div class="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
      <!-- Decorative Image -->
      <div class="hidden lg:block flex-shrink-0">
        <img
          src="/images/cta-agent.png"
          alt="Đại lý bất động sản"
          class="w-32 h-auto"
          loading="lazy"
        />
      </div>

      <!-- Content -->
      <div class="flex-1 text-center lg:text-left">
        <h3 class="text-xl lg:text-2xl font-bold text-white mb-2">
          Liên hệ ngay đại lý bất động sản uy tín gần bạn!
        </h3>
        <p class="text-primary-100">
          Chúng tôi sẽ kết nối bạn với chuyên viên địa phương hiểu rõ thị trường khu vực giúp bạn tiết kiệm thời gian, giao dịch nhanh và tối ưu giá trị.
        </p>
      </div>

      <!-- CTA Button -->
      <a
        href="/tim-kiem"
        class="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
      >
        Tìm đại lý bất động sản của bạn
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </a>
    </div>
  </div>
</section>
```

## Todo List

- [x] Create `src/components/contact/contact-form.astro`
- [x] Create `src/components/contact/contact-info-section.astro`
- [x] Create `src/components/contact/contact-cta-section.astro`
- [x] Test form validation (email, phone, budget formatting)
- [x] Test form submission
- [x] Test toast notifications
- [x] Test responsive layout
- [x] Verify TypeScript compiles

## Success Criteria

1. [x] Form renders with all fields
2. [x] Email validation shows error for invalid format
3. [x] Phone validation shows error for invalid length
4. [x] Budget auto-formats with thousand separators
5. [x] Submit shows loading state
6. [x] Success shows green toast
7. [x] Error shows red toast
8. [x] Form resets on success
9. [x] Mobile layout stacks correctly

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| JS errors block form | High | Graceful degradation, test thoroughly |
| Toast not visible | Medium | High z-index, test on various screens |
| Validation too strict | Low | Match v1 patterns exactly |

## Security Considerations

- Client-side validation is UX only - server validates too
- No sensitive data in client-side code
- XSS prevention via proper escaping

## Next Steps

After this phase:
- Proceed to Phase 4 (Contact Page Assembly)
- Components will be imported into lien-he.astro
