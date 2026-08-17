/**
 * Component: Booking Card
 * Renders a card on the My Bookings page showing session info and management tools.
 */

export function renderBookingCard(booking, onCancelClick, onEditClick) {
  let statusBadgeClass = 'badge-available'; // green for Active
  let isUpcoming = booking.status === 'Active';
  
  if (booking.status === 'Completed') {
    statusBadgeClass = 'badge-slow'; // grey
  } else if (booking.status === 'Cancelled') {
    statusBadgeClass = 'badge-maintenance'; // red
  }

  // Check if booking date is in the past, if so it should be completed
  // (We'll let the user cancel/edit only if status is Active)
  
  const card = document.createElement('div');
  card.className = 'booking-card';
  card.dataset.id = booking.id;

  let actionsHTML = '';
  if (isUpcoming) {
    actionsHTML = `
      <div class="booking-card-actions">
        <button class="btn btn-secondary btn-sm edit-booking-btn" data-id="${booking.id}">
          <i class="fa-solid fa-pen-to-square"></i> Reschedule
        </button>
        <button class="btn btn-danger btn-sm cancel-booking-btn" data-id="${booking.id}">
          <i class="fa-solid fa-ban"></i> Cancel
        </button>
      </div>
    `;
  } else if (booking.status === 'Cancelled') {
    actionsHTML = `<div style="text-align: center; font-size: 12px; color: var(--color-text-muted); font-style: italic; padding-top: 8px;">Booking Cancelled</div>`;
  } else {
    actionsHTML = `<div style="text-align: center; font-size: 12px; color: var(--color-text-muted); font-style: italic; padding-top: 8px;">Session Completed</div>`;
  }

  card.innerHTML = `
    <div class="booking-card-header">
      <div>
        <div class="booking-card-station">${booking.station_name}</div>
        <div class="booking-card-id">ID: ${booking.id.substring(0, 8)}...</div>
      </div>
      <span class="badge ${statusBadgeClass}">${booking.status}</span>
    </div>

    <div class="booking-card-details">
      <div class="booking-detail-row">
        <i class="fa-solid fa-bolt"></i>
        <span class="label">Charger ID</span>
        <span class="val">${booking.charger_id}</span>
      </div>
      <div class="booking-detail-row">
        <i class="fa-regular fa-calendar"></i>
        <span class="label">Date</span>
        <span class="val">${formatDate(booking.booking_date)}</span>
      </div>
      <div class="booking-detail-row">
        <i class="fa-regular fa-clock"></i>
        <span class="label">Time Slot</span>
        <span class="val">${booking.time_slot}</span>
      </div>
      <div class="booking-detail-row" style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed rgba(255,255,255,0.03)">
        <i class="fa-solid fa-user"></i>
        <span class="label">Driver</span>
        <span class="val">${booking.user_name}</span>
      </div>
      <div class="booking-detail-row">
        <i class="fa-solid fa-car"></i>
        <span class="label">Vehicle</span>
        <span class="val">${booking.vehicle_model}</span>
      </div>
      <div class="booking-detail-row">
        <i class="fa-solid fa-hashtag"></i>
        <span class="label">License No.</span>
        <span class="val">${booking.vehicle_number}</span>
      </div>
    </div>

    ${actionsHTML}
  `;

  // Attach Event Handlers
  if (isUpcoming) {
    card.querySelector('.cancel-booking-btn').addEventListener('click', () => {
      onCancelClick(booking.id);
    });
    card.querySelector('.edit-booking-btn').addEventListener('click', () => {
      onEditClick(booking);
    });
  }

  return card;
}

// Utility to format date to a readable string (e.g. "17 Aug 2026")
function formatDate(dateStr) {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2];
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[monthIdx]} ${year}`;
}
