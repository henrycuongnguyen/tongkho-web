/**
 * Compare Manager - LocalStorage-based property comparison system
 * Max 2 properties, same transaction type required
 */

interface CompareItem {
  estateId: string;
  transactionType: string;
  url: string;
  image: string;
  title: string;
}

// Utility: Sanitize data attributes for XSS prevention
function sanitize(value: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (!div) return value;
  div.textContent = value;
  return div.innerHTML;
}

// Utility: Normalize transaction type to consistent format
function normalizeTransactionType(value: string | number | undefined): string {
  if (!value) return '1'; // Default to sale
  const str = String(value).toLowerCase().trim();

  // Handle various formats: 'sale'/'rent', '1'/'2', 1/2
  if (str === 'sale' || str === '1' || str === 'mua-ban') return '1';
  if (str === 'rent' || str === '2' || str === 'cho-thue') return '2';

  return str; // Return as-is if unrecognized
}

// Simple toast notification system (inline)
function showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type} fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-[9999] transition-all duration-300 transform translate-x-full`;

  const colors = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  toast.classList.add(...colors[type].split(' '));
  toast.textContent = message;
  document.body.appendChild(toast);

  // Slide in
  requestAnimationFrame(() => {
    toast.classList.remove('translate-x-full');
  });

  // Auto remove after 3s
  setTimeout(() => {
    toast.classList.add('translate-x-full');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

const CompareManager = (() => {
  const STORAGE_KEY = 'compare_items';
  const MAX_ITEMS = 2;

  const getItems = (): CompareItem[] => {
    try {
      if (typeof localStorage === 'undefined') return [];
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const setItems = (items: CompareItem[]): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
      if (typeof document !== 'undefined') {
        document.dispatchEvent(new Event('compareListChanged'));
      }
    } catch {
      // Silent fail on private browsing or quota exceeded
    }
  };

  const validate = (item: CompareItem): { valid: boolean; error?: string } => {
    const items = getItems();

    if (items.length >= MAX_ITEMS) {
      return { valid: false, error: 'Tối đa 2 BĐS để so sánh' };
    }

    if (items.length > 0 && items[0].transactionType !== item.transactionType) {
      return { valid: false, error: 'Chỉ so sánh BĐS cùng loại giao dịch' };
    }

    return { valid: true };
  };

  const add = (item: CompareItem): boolean => {
    const { valid, error } = validate(item);

    if (!valid) {
      showToast(error!, 'error');
      return false;
    }

    const items = getItems();

    // Check if already exists
    if (items.some(i => i.estateId === item.estateId)) {
      return false;
    }

    items.push(item);
    setItems(items);
    showToast('Đã thêm vào so sánh', 'success');
    return true;
  };

  const remove = (estateId: string): boolean => {
    const items = getItems().filter(i => i.estateId !== estateId);
    setItems(items);
    showToast('Đã xóa khỏi so sánh', 'success');
    return true;
  };

  const toggle = (element: HTMLElement): void => {
    // Validate and sanitize data attributes (XSS prevention)
    const estateId = sanitize(element.dataset.estateId || '');
    const transactionType = normalizeTransactionType(element.dataset.transactionType);
    const url = sanitize(element.dataset.url || '');
    const image = sanitize(element.dataset.image || '');
    const title = sanitize(element.dataset.title || '');

    if (!estateId || !url || !title) {
      return;
    }

    const items = getItems();
    const exists = items.some(i => i.estateId === estateId);

    if (exists) {
      remove(estateId);
      element.classList.remove('active');
    } else {
      const item: CompareItem = {
        estateId,
        transactionType,
        url,
        image,
        title,
      };

      if (add(item)) {
        element.classList.add('active');
      }
    }
  };

  const syncButtonStates = (): void => {
    if (typeof document === 'undefined') return;

    const items = getItems();

    // Update active state for all buttons (sync with localStorage)
    document.querySelectorAll('.btn-compare').forEach((btn) => {
      const estateId = (btn as HTMLElement).dataset.estateId;
      if (items.some(i => i.estateId === estateId)) {
        btn.classList.add('active');
      } else {
        // Remove stale active class if item no longer in list
        btn.classList.remove('active');
      }
    });
  };

  const init = (): void => {
    if (typeof document === 'undefined') return;

    // Use event delegation to prevent memory leaks on HTMX swaps
    // Attach listener only once
    if (!(document.body as any).__compareListenerAttached) {
      document.body.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const btn = target.closest('.btn-compare');

        if (btn) {
          e.preventDefault();
          e.stopPropagation();
          toggle(btn as HTMLElement);
        }
      });

      (document.body as any).__compareListenerAttached = true;
    }

    // Always sync button states (runs after HTMX swaps too)
    syncButtonStates();

    // Listen for HTMX afterSwap events to re-sync button states
    document.body.addEventListener('htmx:afterSwap', syncButtonStates);

    // Listen for compareListChanged events to re-sync button states
    document.addEventListener('compareListChanged', syncButtonStates);
  };

  const clear = (): void => {
    setItems([]);
  };

  return { init, add, remove, toggle, getItems, clear };
})();

// Export for global access (if needed)
if (typeof window !== 'undefined') {
  (window as any).CompareManager = CompareManager;
}

export default CompareManager;
