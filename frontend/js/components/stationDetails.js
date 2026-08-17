/**
 * Component: Station Details Drawer Contents
 * Renders the rich details of a station in the side drawer.
 */

export function renderStationDetails(station, onBookClick, onDrawRouteClick) {
  const chargers = station.chargers || [];
  
  // Create lists of chargers
  let chargersHTML = '';
  if (chargers.length === 0) {
    chargersHTML = `<div class="empty-state">No chargers listed for this station.</div>`;
  } else {
    chargers.forEach(charger => {
      let statusBadgeClass = 'badge-available';
      let isBookable = true;
      let btnLabel = 'Book Slot';
      let btnIcon = 'fa-calendar-plus';
      
      if (charger.status === 'Occupied') {
        statusBadgeClass = 'badge-occupied';
      } else if (charger.status === 'Maintenance') {
        statusBadgeClass = 'badge-maintenance';
        isBookable = false;
        btnLabel = 'Unavailable';
        btnIcon = 'fa-triangle-exclamation';
      }

      chargersHTML += `
        <div class="charger-row">
          <div class="charger-info-main">
            <div class="charger-title">
              ${charger.type} (${charger.powerKW} kW)
            </div>
            <div class="charger-specs">
              <span><i class="fa-solid fa-circle-nodes"></i> ${charger.connector}</span>
              <span class="badge ${statusBadgeClass}">${charger.status}</span>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 8px;">
            <div class="charger-rate">₹${charger.pricePerKWh.toFixed(2)}/kWh</div>
            <button 
              class="btn btn-primary btn-sm book-charger-btn" 
              data-charger-id="${charger.id}"
              data-charger-name="${charger.type} - ${charger.powerKW}kW (${charger.connector})"
              ${!isBookable ? 'disabled' : ''}
              style="padding: 6px 12px; font-size: 12px;"
            >
              <i class="fa-solid ${btnIcon}"></i> ${btnLabel}
            </button>
          </div>
        </div>
      `;
    });
  }

  // Create directions URL
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;

  const container = document.createElement('div');
  container.className = 'station-details-container';
  container.innerHTML = `
    <div class="drawer-station-header">
      <h2>${station.name}</h2>
      <p class="address">
        <i class="fa-solid fa-location-dot"></i>
        <span>${station.address}</span>
      </p>
    </div>

    <div class="station-meta-grid">
      <div class="meta-item">
        <span class="label">Operating Hours</span>
        <span class="value"><i class="fa-regular fa-clock text-primary"></i> ${station.operating_hours}</span>
      </div>
      <div class="meta-item">
        <span class="label">Contact Info</span>
        <span class="value"><i class="fa-solid fa-phone text-primary"></i> ${station.contact_number}</span>
      </div>
    </div>

    <div class="charger-list-title">
      <i class="fa-solid fa-charging-station"></i> Charging Points
    </div>

    <div class="chargers-drawer-list">
      ${chargersHTML}
    </div>

    <div class="drawer-actions" style="display: flex; flex-direction: column; gap: 8px;">
      <button class="btn btn-primary draw-route-btn" style="width: 100%;">
        <i class="fa-solid fa-route"></i> Draw Route on Map
      </button>
      <a href="${directionsUrl}" target="_blank" class="btn btn-secondary" style="text-decoration: none; width: 100%; text-align: center;">
        <i class="fa-solid fa-diamond-turn-right"></i> Get Directions (Google Maps)
      </a>
    </div>
  `;

  // Add click listeners to book buttons
  const buttons = container.querySelectorAll('.book-charger-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const chargerId = btn.dataset.chargerId;
      const chargerName = btn.dataset.chargerName;
      onBookClick(station, chargerId, chargerName);
    });
  });

  // Add click listener to draw route button
  const routeBtn = container.querySelector('.draw-route-btn');
  if (routeBtn) {
    routeBtn.addEventListener('click', () => {
      onDrawRouteClick(station.latitude, station.longitude);
    });
  }

  return container;
}
