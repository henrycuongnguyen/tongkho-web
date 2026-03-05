/**
 * Office Locator - Client-side Google Maps integration
 * Displays TongKhoBDS office locations on interactive map
 *
 * Usage:
 *   window.OfficeLocator.init(offices);
 *
 * Ported from v1 with modifications:
 * - Removed fetchOffices() - data passed via window.__OFFICE_DATA__
 * - Changed entry point from open() to init(offices)
 */
(function() {
  'use strict';

  // Private state
  let initialized = false;
  let map = null;
  let currentMarker = null;
  let infoWindow = null;
  let activeOfficeId = null;
  let isLoading = false;

  /**
   * Open Google Maps directions in new tab
   */
  function openGoogleDirections(lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  }

  /**
   * Load Google Maps JavaScript API dynamically
   * Uses window.GOOGLE_MAPS_KEY set by Astro page
   */
  function initGoogleMap(callback) {
    // Check if already loaded
    if (window.google && window.google.maps) {
      callback();
      return;
    }

    const key = window.GOOGLE_MAPS_KEY;
    if (!key) {
      console.error('[OfficeLocator] Google Maps API key not configured');
      hideLoading();
      return;
    }

    // Create callback for async load
    window.initMapCallback = function() {
      delete window.initMapCallback;
      callback();
    };

    // Load script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&callback=initMapCallback`;
    script.async = true;
    script.defer = true;
    script.onerror = function() {
      console.error('[OfficeLocator] Failed to load Google Maps API');
      hideLoading();
    };
    document.head.appendChild(script);
  }

  /**
   * Update map location with marker and info window
   */
  function setMapLocation(lat, lng, name, address, company_representative, position_representative, time_work, phone) {
    if (!map) return;

    const position = { lat: lat, lng: lng };

    // Remove old marker
    if (currentMarker) {
      currentMarker.setMap(null);
    }

    // Create new marker with orange icon
    currentMarker = new google.maps.Marker({
      position: position,
      map: map,
      title: name,
      animation: google.maps.Animation.DROP,
      icon: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png'
    });

    // Build info window content
    const rep = company_representative || '';
    const pos = position_representative || '';
    const repHtml = (rep || pos) ? `<div style='margin-bottom:3px; font-size: 13px;'><span style='font-weight:500;'>${escapeHtml(rep)}</span>${pos ? ' - ' + escapeHtml(pos) : ''}</div>` : '';
    const phoneHtml = phone ? `<div style='font-size:12px; color:#888; margin-bottom:3px;line-height: 18px;'>Điện thoại: ${phone}</div>` : '';
    const addressHtml = address ? `<div style='font-size:12px; color:#888; margin-bottom:3px;line-height: 18px;'>Địa chỉ: ${escapeHtml(address)}</div>` : '';
    const timeWorkHtml = time_work ? `<div style='font-size:12px; color:#888; margin-bottom:0;line-height: 18px;'>${escapeHtml(time_work)}</div>` : '';

    const contentString = `
      <div style="padding: 10px; max-width: 450px; display: flex; gap: 12px; align-items: flex-start;">
        <div style="flex: 1;">
          <h5 style="margin: 0 0 8px 0; font-weight: 600; font-size: 15px;">${escapeHtml(name)}</h5>
          ${repHtml}
          ${phoneHtml}
          ${addressHtml}
          ${timeWorkHtml}
        </div>
        <div style="flex-shrink: 0;">
          <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}', '_blank')"
                  style="background: transparent; border: none; padding: 0.25rem 0.5rem 0.5rem 0.5rem; min-width: 70px; cursor: pointer; display: flex; flex-direction: column; align-items: center; outline: none;">
            <span style="display:block; margin-bottom:2px;">
              <img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAYCAYAAAARfGZ1AAABNklEQVR4nKWVzVmEMBCG3/BsAZRACZawqUA7gK1Az9y85KwVrFTgYwXYgZSQErACPAQ0y+Znsn7HJPN+kyEzgFBLT730PEjPAyghuAFGoAEmQCvDnIurCsEAd8C49NT/ggfAm0QGUXgC7Bt8refkcAF4U4O7QfDcFVwIfgVszuACLgR/KMMToHMGv/CCUtwvPa0y2JyBSoAtMCRMXpRhDsRaXB9YlchYK8Nn5hasyR1Xhp+YPgDnANgP7CL7fubn3V4DvB8g28YtcNytnSIl8fVdASfcvJDqWRneMmALdNU6gHSBQevVOASe2D7otrLOiRHX1uAaZQIevbWcNvAMu5EbMCjRBRh2HXpDiaLgK/iNBkFwEF5oEAVH4UKDJDgJzxgMOTDIf9A1f69oUIZOElekpS97oj+GCI6XbO2VzgAAAABJRU5ErkJggg==' width='23' height='24' style='border-radius:50%; background:#fff;'/>
            </span>
            <span style="display: block; font-size: 13px; color: #ff9900; font-weight: 600; margin-top: 2px;">Chỉ đường</span>
          </button>
        </div>
      </div>
    `;

    // Create or update info window
    if (!infoWindow) {
      infoWindow = new google.maps.InfoWindow({ disableAutoPan: false });

      // Hide close button
      google.maps.event.addListener(infoWindow, 'domready', function() {
        const closeBtn = document.querySelector('.gm-ui-hover-effect');
        if (closeBtn) closeBtn.style.display = 'none';
      });
    }

    infoWindow.setContent(contentString);
    infoWindow.open(map, currentMarker);

    // Center and zoom
    map.setCenter(position);
    map.setZoom(15);

    // Marker click reopens info window
    currentMarker.addListener('click', function() {
      infoWindow.open(map, currentMarker);
    });
  }

  /**
   * Set active office in list (highlight)
   */
  function setActiveOffice(officeId) {
    const listItems = document.querySelectorAll('#office-list > div[data-office-id]');
    listItems.forEach(function(item) {
      item.classList.remove('bg-orange-50', 'border-l-4', 'border-orange-500');
      item.classList.add('bg-white');
    });

    if (officeId) {
      const activeItem = document.querySelector('#office-list > div[data-office-id="' + officeId + '"]');
      if (activeItem) {
        activeItem.classList.remove('bg-white');
        activeItem.classList.add('bg-orange-50', 'border-l-4', 'border-orange-500');
      }
    }

    activeOfficeId = officeId;
  }

  /**
   * Render office list in #office-list container
   */
  function renderList(offices) {
    const list = document.getElementById('office-list');
    if (!list) return;

    list.innerHTML = '';

    offices.forEach(function(ofc) {
      const div = document.createElement('div');
      div.className = 'flex justify-between items-center p-4 border-b border-gray-200 bg-white hover:bg-gray-50 cursor-pointer transition-colors';
      div.setAttribute('data-office-id', ofc.id);

      const hasValidCoords = ofc.lat && ofc.lng && !isNaN(ofc.lat) && !isNaN(ofc.lng);

      // Build address string
      const addressParts = [ofc.address, ofc.ward_name, ofc.district_name, ofc.city_name].filter(Boolean);
      const fullAddress = addressParts.join(', ');

      // Direction button
      const buttonHtml = hasValidCoords
        ? `<button class="flex flex-col items-center justify-center min-w-[70px] px-2 py-1 hover:scale-105 transition-transform" data-lat="${ofc.lat}" data-lng="${ofc.lng}" type="button">
            <span class="block mb-0.5">
              <img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAYCAYAAAARfGZ1AAABNklEQVR4nKWVzVmEMBCG3/BsAZRACZawqUA7gK1Az9y85KwVrFTgYwXYgZSQErACPAQ0y+Znsn7HJPN+kyEzgFBLT730PEjPAyghuAFGoAEmQCvDnIurCsEAd8C49NT/ggfAm0QGUXgC7Bt8refkcAF4U4O7QfDcFVwIfgVszuACLgR/KMMToHMGv/CCUtwvPa0y2JyBSoAtMCRMXpRhDsRaXB9YlchYK8Nn5hasyR1Xhp+YPgDnANgP7CL7fubn3V4DvB8g28YtcNytnSIl8fVdASfcvJDqWRneMmALdNU6gHSBQevVOASe2D7otrLOiRHX1uAaZQIevbWcNvAMu5EbMCjRBRh2HXpDiaLgK/iNBkFwEF5oEAVH4UKDJDgJzxgMOTDIf9A1f69oUIZOElekpS97oj+GCI6XbO2VzgAAAABJRU5ErkJggg==' width='23' height='24' class='rounded-full bg-white' />
            </span>
            <span class="block text-[13px] text-orange-500 font-semibold mt-0.5">Chỉ đường</span>
          </button>`
        : '<button class="px-3 py-1 text-sm text-gray-400 bg-gray-100 rounded cursor-not-allowed" disabled>Chưa có tọa độ</button>';

      div.innerHTML = `
        <div class="flex-1 pr-3">
          <div class="font-semibold text-gray-800 mb-1">${escapeHtml(ofc.name)}</div>
          <div class="text-xs text-gray-500 leading-relaxed">${escapeHtml(fullAddress)}</div>
        </div>
        <div class="flex-shrink-0">${buttonHtml}</div>
      `;

      // Click handler for list item
      div.addEventListener('click', function(e) {
        // Skip if direction button clicked
        if (e.target && e.target.closest('button[data-lat][data-lng]')) return;

        if (hasValidCoords) {
          setMapLocation(
            ofc.lat,
            ofc.lng,
            ofc.name,
            fullAddress,
            ofc.company_representative,
            ofc.position_representative,
            ofc.time_work,
            ofc.phone
          );
          setActiveOffice(ofc.id);
        }
      });

      list.appendChild(div);
    });

    // Event delegation for direction buttons
    if (!window.__officeDirectionsHandlerAttached) {
      document.addEventListener('click', function(e) {
        const btn = e.target.closest('button[data-lat][data-lng]');
        if (btn) {
          const lat = parseFloat(btn.getAttribute('data-lat'));
          const lng = parseFloat(btn.getAttribute('data-lng'));
          openGoogleDirections(lat, lng);
        }
      });
      window.__officeDirectionsHandlerAttached = true;
    }
  }

  /**
   * Initialize map with offices
   */
  function initMap(offices) {
    if (initialized) return;
    initialized = true;

    // Find first office with valid coordinates
    const firstValid = offices.find(function(o) {
      return o.lat && o.lng && !isNaN(o.lat) && !isNaN(o.lng);
    });

    if (!firstValid) {
      console.warn('[OfficeLocator] No offices with valid coordinates');
      hideLoading();
      return;
    }

    initGoogleMap(function() {
      const mapDiv = document.getElementById('office-map');
      if (!mapDiv) return;

      // Clear loading content
      mapDiv.innerHTML = '';

      // Create map
      map = new google.maps.Map(mapDiv, {
        center: { lat: firstValid.lat, lng: firstValid.lng },
        zoom: 15,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true
      });

      // Build first office address
      const addressParts = [firstValid.address, firstValid.ward_name, firstValid.district_name, firstValid.city_name].filter(Boolean);
      const fullAddress = addressParts.join(', ');

      // Show first office
      setMapLocation(
        firstValid.lat,
        firstValid.lng,
        firstValid.name,
        fullAddress,
        firstValid.company_representative,
        firstValid.position_representative,
        firstValid.time_work,
        firstValid.phone
      );

      // Render list
      renderList(offices);

      // Set first as active
      setActiveOffice(firstValid.id);

      hideLoading();
    });
  }

  /**
   * Show loading spinner in map container
   */
  function showLoading() {
    isLoading = true;
    const mapDiv = document.getElementById('office-map');
    if (mapDiv) {
      mapDiv.innerHTML = '<div class="flex items-center justify-center h-full"><div class="text-center"><div class="inline-block w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div><div class="mt-2 text-gray-600">Đang tải danh sách văn phòng...</div></div></div>';
    }
  }

  /**
   * Hide loading spinner
   */
  function hideLoading() {
    isLoading = false;
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Public API
   */
  window.OfficeLocator = {
    /**
     * Initialize office locator with office data
     * @param {Array} offices - Array of office objects from window.__OFFICE_DATA__
     */
    init: function(offices) {
      if (isLoading) return;

      if (!offices || offices.length === 0) {
        console.warn('[OfficeLocator] No offices data provided');
        const mapDiv = document.getElementById('office-map');
        if (mapDiv) {
          mapDiv.innerHTML = '<div class="flex items-center justify-center h-full"><div class="text-gray-500">Chưa có dữ liệu văn phòng</div></div>';
        }
        return;
      }

      showLoading();
      initMap(offices);
    }
  };
})();
