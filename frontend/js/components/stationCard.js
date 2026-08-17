/**
 * Component: Station Card
 * Renders an overview card for a charging station in the sidebar list.
 */

export function renderStationCard(station, isSelected = false) {
  // Parse charger counts and availability
  const chargers = station.chargers || [];
  const totalChargers = chargers.length;
  
  const availableCount = chargers.filter(c => c.status === 'Available').length;
  const occupiedCount = chargers.filter(c => c.status === 'Occupied').length;
  const maintenanceCount = chargers.filter(c => c.status === 'Maintenance').length;

  // Determine power levels present
  const powerTypes = new Set(chargers.map(c => c.type));
  let badgeHTML = '';
  
  if (powerTypes.has('Rapid DC')) {
    badgeHTML += `<span class="badge badge-rapid"><i class="fa-solid fa-bolt-lightning"></i> Rapid</span>`;
  }
  if (powerTypes.has('Fast DC') || powerTypes.has('Fast AC')) {
    badgeHTML += `<span class="badge badge-fast"><i class="fa-solid fa-bolt"></i> Fast</span>`;
  }
  if (powerTypes.has('Slow AC')) {
    badgeHTML += `<span class="badge badge-slow">Slow</span>`;
  }

  // Get primary status indicator
  let statusBadge = `<span class="badge badge-available"><i class="fa-solid fa-circle-check"></i> Available (${availableCount}/${totalChargers})</span>`;
  if (availableCount === 0 && occupiedCount > 0) {
    statusBadge = `<span class="badge badge-occupied"><i class="fa-solid fa-circle-minus"></i> Full (${occupiedCount}/${totalChargers})</span>`;
  } else if (availableCount === 0 && occupiedCount === 0 && maintenanceCount > 0) {
    statusBadge = `<span class="badge badge-maintenance"><i class="fa-solid fa-circle-exclamation"></i> Out of order</span>`;
  }

  const card = document.createElement('div');
  card.className = `station-card ${isSelected ? 'selected' : ''}`;
  card.dataset.id = station.id;
  
  card.innerHTML = `
    <h3 class="station-card-title">${station.name}</h3>
    <div class="station-card-address">
      <i class="fa-solid fa-location-dot"></i>
      <span>${station.address}</span>
    </div>
    <div class="station-card-meta">
      <div class="station-card-hours">
        <i class="fa-solid fa-clock"></i>
        <span>${station.operating_hours}</span>
      </div>
      <div class="station-card-chargers-summary">
        ${badgeHTML}
        ${statusBadge}
      </div>
    </div>
  `;

  return card;
}
