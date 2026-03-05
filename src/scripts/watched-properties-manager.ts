/**
 * Watched Properties Manager
 * Tracks recently viewed properties in localStorage
 * Max 8 items, newest first
 */

interface WatchedProperty {
  estateId: string;
  transactionType: string;
  title: string;
  url: string;
  image: string;
}

// Sanitize for XSS prevention
function sanitize(value: string): string {
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (!div) return value;
  div.textContent = value;
  return div.innerHTML;
}

const WatchedPropertiesManager = (() => {
  const STORAGE_KEY = 'watched_properties_list';
  const MAX_ITEMS = 8;

  const getItems = (): WatchedProperty[] => {
    try {
      if (typeof localStorage === 'undefined') return [];
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  };

  const setItems = (items: WatchedProperty[]): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
    } catch {
      // Silent fail on private browsing or quota exceeded
    }
  };

  /**
   * Add current property to watched list (at front)
   */
  const trackView = (property: WatchedProperty): void => {
    const items = getItems();

    // Remove if already exists (to move to front)
    const filtered = items.filter(item => item.estateId !== property.estateId);

    // Add to front
    filtered.unshift(property);

    // Cap at MAX_ITEMS
    if (filtered.length > MAX_ITEMS) {
      filtered.pop();
    }

    setItems(filtered);
  };

  /**
   * Get IDs for display (excluding current property)
   */
  const getDisplayIds = (excludeId: string): string[] => {
    const items = getItems();
    return items
      .filter(item => item.estateId !== excludeId)
      .map(item => item.estateId);
  };

  /**
   * Render property cards into container using DOM methods (XSS-safe)
   */
  const renderCards = (properties: any[], containerId: string): void => {
    const container = document.getElementById(containerId);
    if (!container || properties.length === 0) return;

    // Clear container
    container.textContent = '';

    // Create section
    const section = document.createElement('section');
    section.className = 'mt-12';

    // Create title
    const title = document.createElement('h2');
    title.className = 'text-2xl font-bold text-secondary-800 mb-6';
    title.textContent = 'Bất động sản đã xem';
    section.appendChild(title);

    // Create grid container
    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6';

    // Render each property card
    properties.forEach(property => {
      const card = createPropertyCard(property);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    container.appendChild(section);
  };

  /**
   * Create single property card element using DOM methods (XSS-safe)
   */
  const createPropertyCard = (property: any): HTMLElement => {
    const price = formatPrice(property.price, property.priceUnit);
    const url = `/bds/${property.slug}`;

    // Create article element
    const article = document.createElement('article');
    article.className = 'bg-white rounded-xl shadow-sm border border-secondary-100 overflow-hidden hover:shadow-md transition-shadow';

    // Create link
    const link = document.createElement('a');
    link.href = url;
    link.className = 'block';

    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'aspect-[4/3] relative';

    // Create image
    const img = document.createElement('img');
    img.src = property.thumbnail || property.image || '';
    img.alt = property.title || '';
    img.className = 'w-full h-full object-cover';
    img.loading = 'lazy';
    imageContainer.appendChild(img);

    // Create transaction badge
    const badge = document.createElement('span');
    badge.className = `absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-full ${
      property.transactionType === 'sale' ? 'bg-primary-500 text-white' : 'bg-blue-500 text-white'
    }`;
    badge.textContent = property.transactionType === 'sale' ? 'Bán' : 'Cho thuê';
    imageContainer.appendChild(badge);

    link.appendChild(imageContainer);

    // Create content container
    const content = document.createElement('div');
    content.className = 'p-4';

    // Create title
    const titleEl = document.createElement('h3');
    titleEl.className = 'font-semibold text-secondary-800 line-clamp-2 mb-2';
    titleEl.textContent = property.title || '';
    content.appendChild(titleEl);

    // Create price
    const priceEl = document.createElement('p');
    priceEl.className = 'text-primary-600 font-bold';
    priceEl.textContent = price;
    content.appendChild(priceEl);

    // Create location
    const locationEl = document.createElement('p');
    locationEl.className = 'text-secondary-500 text-sm mt-1 line-clamp-1';
    const locationParts = [];
    if (property.district) locationParts.push(property.district);
    if (property.city) locationParts.push(property.city);
    locationEl.textContent = locationParts.join(', ');
    content.appendChild(locationEl);

    link.appendChild(content);
    article.appendChild(link);

    return article;
  };

  /**
   * Format price for display
   */
  const formatPrice = (price: number, unit: string): string => {
    if (!price || price === 0) return 'Thương lượng';

    if (unit === 'per_month') {
      return `${(price / 1_000_000).toLocaleString('vi-VN')} triệu/tháng`;
    }

    if (price >= 1_000_000_000) {
      const ty = price / 1_000_000_000;
      return `${ty % 1 === 0 ? ty : ty.toFixed(1)} tỷ`;
    }

    return `${(price / 1_000_000).toLocaleString('vi-VN')} triệu`;
  };

  /**
   * Initialize on page load
   */
  const init = async (): Promise<void> => {
    if (typeof document === 'undefined') return;

    // Get current property data from title element
    const titleEl = document.querySelector('h1[data-estate-id]') as HTMLElement;
    if (!titleEl) {
      console.warn('WatchedProperties: h1[data-estate-id] element not found');
      return;
    }

    const currentProperty: WatchedProperty = {
      estateId: sanitize(titleEl.dataset.estateId || ''),
      transactionType: sanitize(titleEl.dataset.transactionType || '1'),
      title: sanitize(titleEl.dataset.title || ''),
      url: sanitize(titleEl.dataset.url || ''),
      image: sanitize(titleEl.dataset.image || ''),
    };

    if (!currentProperty.estateId) {
      console.warn('WatchedProperties: Missing estate ID');
      return;
    }

    console.log('WatchedProperties: Current property:', currentProperty);

    // Get IDs to display (excluding current)
    const displayIds = getDisplayIds(currentProperty.estateId);
    console.log('WatchedProperties: Display IDs:', displayIds);

    // Fetch and render if we have IDs
    if (displayIds.length > 0) {
      try {
        const apiUrl = `/api/properties/batch?ids=${displayIds.join(',')}`;
        console.log('WatchedProperties: Fetching from:', apiUrl);

        const response = await fetch(apiUrl);
        console.log('WatchedProperties: Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('WatchedProperties: Fetched properties:', data);

          if (data.properties && data.properties.length > 0) {
            renderCards(data.properties, 'watched-properties');
            console.log('WatchedProperties: Rendered', data.properties.length, 'properties');
          } else {
            console.log('WatchedProperties: No properties to display');
          }
        } else {
          console.error('WatchedProperties: API error:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('WatchedProperties: Failed to fetch:', error);
      }
    } else {
      console.log('WatchedProperties: No properties to display (empty history or only current property)');
    }

    // Track current view (add to localStorage)
    trackView(currentProperty);
    console.log('WatchedProperties: Tracked current property. Total in storage:', getItems().length);
  };

  return { init, getItems, trackView, getDisplayIds };
})();

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).WatchedPropertiesManager = WatchedPropertiesManager;
}

export default WatchedPropertiesManager;
