/**
 * VoltFinder - Core Client Application Coordinator (ES6 Module)
 */

import { renderStationCard } from './components/stationCard.js';
import { renderStationDetails } from './components/stationDetails.js';
import { renderBookingCard } from './components/bookingCard.js';
import { initProfileModal } from './components/profileModal.js';
import { initBookingModal } from './components/bookingModal.js';

// Configuration
const API_BASE = window.location.origin.includes('localhost:5000') ? '/api' : 'http://localhost:5000/api';

// Application State
let state = {
  stations: [],
  bookings: [],
  selectedStationId: null,
  currentBookingFilter: 'All'
};

// UI Element Selectors
const navbarFinderBtn = document.getElementById('nav-finder-btn');
const navbarBookingsBtn = document.getElementById('nav-bookings-btn');
const finderSection = document.getElementById('finder-section');
const bookingsSection = document.getElementById('bookings-section');

const stationSearchInput = document.getElementById('station-search-input');
const chargerTypeFilter = document.getElementById('charger-type-filter');
const connectorFilter = document.getElementById('connector-filter');
const statusFilter = document.getElementById('status-filter');
const resultsCountText = document.getElementById('results-count-text');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
const stationsList = document.getElementById('stations-list');
const bookingsGrid = document.getElementById('bookings-grid');

const detailsDrawer = document.getElementById('station-details-drawer');
const drawerCloseBtn = document.getElementById('drawer-close-btn');
const drawerCloseOverlay = document.getElementById('drawer-close-overlay');
const drawerBodyContent = document.getElementById('drawer-body-content');

// Leaflet Map State
let mapObj = null;
let mapMarkers = {};
let routingControl = null;

/* -------------------------------------------------------------
 * 1. INITIALIZATION & ROUTING
 * ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Toast system, Profile modal and Booking modal
  initProfileModal(showToast);
  
  const triggerBookingModal = initBookingModal(API_BASE, showToast, onBookingSuccess);
  
  // Initialize Map
  initMap();
  
  // Fetch initial stations data
  fetchStations();

  // Setup main view navigation (Finder vs. Bookings Dashboard)
  setupRouting();

  // Setup search and filter input events
  setupFilters();

  // Drawer closing bindings
  const closeDrawer = () => {
    detailsDrawer.classList.remove('active');
    clearActiveRoute();
  };
  drawerCloseBtn.addEventListener('click', closeDrawer);
  drawerCloseOverlay.addEventListener('click', closeDrawer);

  // Setup bookings page tab switching
  setupBookingsTabs();

  // Start live polling for charger availability (every 15 seconds)
  startLivePolling();
});

// Setup sidebar input filter events
function setupFilters() {
  const handleFilterChange = () => {
    fetchStations();
    
    // Show reset button if any filter/search is active
    const hasSearch = stationSearchInput.value.trim() !== '';
    const hasType = chargerTypeFilter.value !== '';
    const hasConnector = connectorFilter.value !== '';
    const hasStatus = statusFilter.value !== '';
    
    if (hasSearch || hasType || hasConnector || hasStatus) {
      resetFiltersBtn.style.display = 'inline-block';
    } else {
      resetFiltersBtn.style.display = 'none';
    }
  };

  stationSearchInput.addEventListener('input', handleFilterChange);
  chargerTypeFilter.addEventListener('change', handleFilterChange);
  connectorFilter.addEventListener('change', handleFilterChange);
  statusFilter.addEventListener('change', handleFilterChange);

  // Reset button trigger
  resetFiltersBtn.addEventListener('click', () => {
    stationSearchInput.value = '';
    chargerTypeFilter.value = '';
    connectorFilter.value = '';
    statusFilter.value = '';
    resetFiltersBtn.style.display = 'none';
    fetchStations();
  });
}

// Router between screens
function setupRouting() {
  const switchTab = (targetSectionId, activeBtn, inactiveBtn) => {
    // Hide all sections
    finderSection.classList.remove('active');
    bookingsSection.classList.remove('active');
    
    // Show targeted
    document.getElementById(targetSectionId).classList.add('active');
    
    // Toggle active buttons styling
    activeBtn.classList.add('active');
    inactiveBtn.classList.remove('active');

    // If switching to bookings, fetch fresh bookings list
    if (targetSectionId === 'bookings-section') {
      fetchBookings();
    } else {
      // Re-trigger map resize helper (important for Leaflet rendering inside hidden containers)
      if (mapObj) {
        setTimeout(() => mapObj.invalidateSize(), 100);
      }
    }
  };

  navbarFinderBtn.addEventListener('click', () => {
    switchTab('finder-section', navbarFinderBtn, navbarBookingsBtn);
  });

  navbarBookingsBtn.addEventListener('click', () => {
    switchTab('bookings-section', navbarBookingsBtn, navbarFinderBtn);
  });
}

/* -------------------------------------------------------------
 * 2. MAP INTEGRATION (LEAFLET.JS)
 * ------------------------------------------------------------- */

function initMap() {
  // Center map in Bangalore (Coordinates: 12.9716, 77.5946)
  mapObj = L.map('map', {
    zoomControl: false // Hide default zoom controls so we can place custom ones or keep it clean
  }).setView([12.9562, 77.6400], 12);

  // Position custom zoom control on top right
  L.control.zoom({ position: 'topright' }).addTo(mapObj);

  // Use CartoDB Dark Matter tile layer for a beautiful dark clean visual
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(mapObj);

  // Force Leaflet to recalculate container size shortly after init to avoid grey map rendering
  setTimeout(() => {
    if (mapObj) mapObj.invalidateSize();
  }, 250);
}

// Draw/Update markers on map based on current state.stations
function updateMapMarkers(isBackgroundPoll = false) {
  if (!mapObj) return;

  // Clear existing markers
  Object.keys(mapMarkers).forEach(id => {
    mapObj.removeLayer(mapMarkers[id]);
  });
  mapMarkers = {};

  // Add new markers
  state.stations.forEach(station => {
    // Evaluate status for pin color styling
    const chargers = station.chargers || [];
    const available = chargers.some(c => c.status === 'Available');
    const maintenance = chargers.every(c => c.status === 'Maintenance');
    
    let statusClass = 'available'; // Green
    if (maintenance) {
      statusClass = 'maintenance'; // Red
    } else if (!available) {
      statusClass = 'occupied'; // Orange/Yellow
    }

    // Custom HTML marker pin icon
    const customIcon = L.divIcon({
      html: `
        <div class="custom-marker">
          <div class="marker-pin ${statusClass}">
            <i class="fa-solid fa-bolt"></i>
          </div>
        </div>
      `,
      className: 'custom-leaflet-icon',
      iconSize: [34, 34],
      iconAnchor: [17, 34]
    });

    const marker = L.marker([station.latitude, station.longitude], { icon: customIcon }).addTo(mapObj);
    
    // Bind click event
    marker.on('click', () => {
      selectStation(station.id);
    });

    mapMarkers[station.id] = marker;
  });

  // Adjust map view to fit all active markers in view if not a background poll
  if (!isBackgroundPoll) {
    const markerKeys = Object.keys(mapMarkers);
    if (markerKeys.length > 0) {
      const group = new L.featureGroup(Object.values(mapMarkers));
      mapObj.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 14 });
    }
  }
}

/* -------------------------------------------------------------
 * 3. STATIONS API ACTIONS
 * ------------------------------------------------------------- */

async function fetchStations(isBackgroundPoll = false) {
  try {
    if (!isBackgroundPoll && state.stations.length === 0) {
      stationsList.innerHTML = `
        <div class="loading-state">
          <i class="fa-solid fa-circle-notch fa-spin"></i>
          <p>Loading charging stations...</p>
        </div>
      `;
    }

    // Build query params
    const query = new URLSearchParams();
    const searchVal = stationSearchInput.value.trim();
    if (searchVal) query.append('search', searchVal);
    
    const typeVal = chargerTypeFilter.value;
    if (typeVal) query.append('chargerType', typeVal);
    
    const connectorVal = connectorFilter.value;
    if (connectorVal) query.append('connectorType', connectorVal);
    
    const statusVal = statusFilter.value;
    if (statusVal) query.append('status', statusVal);

    const response = await fetch(`${API_BASE}/stations?${query.toString()}`);
    const result = await response.json();

    if (result.success) {
      state.stations = result.data || [];
      resultsCountText.textContent = `${state.stations.length} station(s) found`;
      
      renderStationsSidebar();
      updateMapMarkers(isBackgroundPoll);
      
      // Update drawer details if a station is currently open
      if (state.selectedStationId) {
        const currentlyOpenStation = state.stations.find(s => s.id === state.selectedStationId);
        if (currentlyOpenStation) {
          updateDrawerDetails(currentlyOpenStation);
        }
      }
    }
  } catch (err) {
    console.error('Error fetching stations:', err);
    if (!isBackgroundPoll) {
      stationsList.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-triangle-exclamation text-danger" style="font-size:32px;"></i>
          <p>Failed to retrieve stations. Check server connection.</p>
        </div>
      `;
    }
  }
}

// Populate cards in the sidebar list
function renderStationsSidebar() {
  if (state.stations.length === 0) {
    stationsList.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-ban"></i>
        <p>No stations match the selected filters.</p>
      </div>
    `;
    return;
  }

  stationsList.innerHTML = '';
  state.stations.forEach(station => {
    const isSelected = station.id === state.selectedStationId;
    const card = renderStationCard(station, isSelected);
    
    card.addEventListener('click', () => {
      selectStation(station.id);
    });

    stationsList.appendChild(card);
  });
}

// Select a station, centers map and opens drawer
function selectStation(stationId) {
  state.selectedStationId = stationId;
  
  // Highlight card in sidebar list
  stationsList.querySelectorAll('.station-card').forEach(card => {
    if (card.dataset.id === stationId) {
      card.classList.add('selected');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      card.classList.remove('selected');
    }
  });

  const station = state.stations.find(s => s.id === stationId);
  if (!station) return;

  // Center map on clicked station coordinates with animation
  if (mapObj) {
    mapObj.flyTo([station.latitude, station.longitude], 14, {
      animate: true,
      duration: 1.2
    });
  }

  // Open Details Drawer
  updateDrawerDetails(station);
  detailsDrawer.classList.add('active');
}

// Populate station info into details drawer
function updateDrawerDetails(station) {
  drawerBodyContent.innerHTML = '';
  
  const detailsHTML = renderStationDetails(
    station,
    (selectedStation, chargerId, chargerName) => {
      // Hook to open Booking Modal
      const triggerBookingModal = initBookingModal(API_BASE, showToast, onBookingSuccess);
      triggerBookingModal(selectedStation, chargerId, chargerName);
    },
    (lat, lng) => {
      // Hook to draw route on map
      showRouteTo([lat, lng]);
    }
  );

  drawerBodyContent.appendChild(detailsHTML);
}

/* -------------------------------------------------------------
 * 4. BOOKINGS API ACTIONS & MANAGEMENT
 * ------------------------------------------------------------- */

async function fetchBookings() {
  try {
    bookingsGrid.innerHTML = `
      <div class="loading-state">
        <i class="fa-solid fa-circle-notch fa-spin"></i>
        <p>Loading bookings...</p>
      </div>
    `;

    const response = await fetch(`${API_BASE}/bookings`);
    const result = await response.json();

    if (result.success) {
      state.bookings = result.data || [];
      renderBookingsGrid();
    }
  } catch (err) {
    console.error('Error fetching bookings:', err);
    bookingsGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-circle-exclamation text-danger"></i>
        <p>Failed to retrieve bookings. Check server connection.</p>
      </div>
    `;
  }
}

// Render booking cards based on active filters
function renderBookingsGrid() {
  // Apply tab filters (All, Active, Completed, Cancelled)
  let filtered = state.bookings;
  if (state.currentBookingFilter !== 'All') {
    filtered = state.bookings.filter(b => b.status === state.currentBookingFilter);
  }

  if (filtered.length === 0) {
    bookingsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fa-regular fa-calendar-times" style="font-size:36px;"></i>
        <p>No bookings found in this category.</p>
      </div>
    `;
    return;
  }

  bookingsGrid.innerHTML = '';
  filtered.forEach(booking => {
    const card = renderBookingCard(booking, handleCancelBooking, handleEditBooking);
    bookingsGrid.appendChild(card);
  });
}

// Setup active/cancel/completed filters for bookings page
function setupBookingsTabs() {
  const tabs = document.querySelectorAll('.status-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      state.currentBookingFilter = tab.dataset.status;
      renderBookingsGrid();
    });
  });
}

// Handle booking Cancellation (DELETE request)
async function handleCancelBooking(bookingId) {
  const confirmCancel = confirm("Are you sure you want to cancel this charging booking slot?");
  if (!confirmCancel) return;

  try {
    const response = await fetch(`${API_BASE}/bookings/${bookingId}`, {
      method: 'DELETE'
    });
    const result = await response.json();

    if (response.ok && result.success) {
      showToast('Cancelled', 'Charging slot cancellation complete.', 'success');
      fetchBookings(); // reload fresh list
      fetchStations(true); // background update status
    } else {
      showToast('Error', result.message || 'Failed to cancel booking.', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('Error', 'Network error. Please try again.', 'error');
  }
}

// Handle Rescheduling Booking (Trigger modal in edit mode)
function handleEditBooking(booking) {
  const station = state.stations.find(s => s.id === booking.station_id);
  if (!station) {
    // If station isn't in active lists due to filters, fetch detail and trigger
    fetch(`${API_BASE}/stations/${booking.station_id}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          const trigger = initBookingModal(API_BASE, showToast, onBookingSuccess);
          trigger(result.data, booking.charger_id, `Charger ${booking.charger_id}`, booking);
        } else {
          showToast('Error', 'Failed to retrieve station details for rescheduling.', 'error');
        }
      });
  } else {
    const trigger = initBookingModal(API_BASE, showToast, onBookingSuccess);
    trigger(station, booking.charger_id, `Charger ${booking.charger_id}`, booking);
  }
}

// Handle Booking Form success (Triggers Success Animation modal)
function onBookingSuccess(bookingData, mode) {
  const successModal = document.getElementById('success-modal');
  const detailsCard = document.getElementById('success-details-card');
  const titleEl = document.getElementById('success-title');
  const msgEl = document.getElementById('success-message');
  
  if (mode === 'updated') {
    titleEl.textContent = 'Booking Updated!';
    msgEl.textContent = 'Your charging slot has been rescheduled successfully.';
  } else {
    titleEl.textContent = 'Booking Confirmed!';
    msgEl.textContent = 'Your charging slot has been reserved successfully.';
  }

  // Format date helper
  const formatDateString = (dateStr) => {
    const parts = dateStr.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${parts[2]} ${months[parseInt(parts[1], 10)-1]} ${parts[0]}`;
  };

  detailsCard.innerHTML = `
    <div><strong>Station:</strong> ${bookingData.station_name}</div>
    <div><strong>Charger:</strong> ${bookingData.charger_id}</div>
    <div><strong>Date:</strong> ${formatDateString(bookingData.booking_date)}</div>
    <div><strong>Time Slot:</strong> ${bookingData.time_slot}</div>
    <div style="margin-top: 4px; padding-top: 4px; border-top:1px dashed rgba(255,255,255,0.05)">
      <strong>Vehicle:</strong> ${bookingData.vehicle_model} (${bookingData.vehicle_number})
    </div>
  `;

  // Display Success Modal
  successModal.classList.add('active');

  const handleClose = () => {
    successModal.classList.remove('active');
    
    // Switch to Bookings view to let user see their booking
    navbarBookingsBtn.click();
    
    // Refresh station statuses to reflect immediate Occupied state
    fetchStations(true);
  };

  document.getElementById('success-close-btn').onclick = handleClose;
}

/* -------------------------------------------------------------
 * 5. TOAST NOTIFICATION SYSTEM
 * ------------------------------------------------------------- */

function showToast(title, message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-circle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close"><i class="fa-solid fa-xmark"></i></button>
  `;

  container.appendChild(toast);

  // Close handler
  toast.querySelector('.toast-close').addEventListener('click', () => {
    toast.style.animation = 'fadeOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  });

  // Auto remove toast
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.animation = 'fadeOut 0.3s forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

/* -------------------------------------------------------------
 * 6. PREMIUM POLLING & BACKGROUND SYNC
 * ------------------------------------------------------------- */

function startLivePolling() {
  // Sync station data in background every 15 seconds
  setInterval(() => {
    fetchStations(true);
  }, 15000);
}

/* -------------------------------------------------------------
 * 7. INLINE MAP DIRECTIONS & ROUTING (LEAFLET ROUTING MACHINE)
 * ------------------------------------------------------------- */

// Draw route from user's current location (or default starting coordinate) to the destination
function showRouteTo(destinationLatLng) {
  // Clear any existing route first
  clearActiveRoute();

  showToast('GPS Search', 'Acquiring your location for routing...', 'info');

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const startLatLng = [position.coords.latitude, position.coords.longitude];
      drawRouteLine(startLatLng, destinationLatLng);
    },
    (error) => {
      console.warn("Geolocation access denied or failed. Defaulting start point to Bangalore Center.", error.message);
      showToast('Offline Mode', 'Location access denied. Routing from Bangalore Center.', 'info');
      const defaultStart = [12.9716, 77.5946]; // Bangalore center
      drawRouteLine(defaultStart, destinationLatLng);
    },
    { enableHighAccuracy: true, timeout: 5000 }
  );
}

function drawRouteLine(start, end) {
  try {
    if (typeof L.Routing === 'undefined' || typeof L.Routing.control === 'undefined') {
      console.error("Leaflet Routing Machine is not loaded.");
      showToast('Error', 'Routing engine not loaded. Please refresh.', 'error');
      return;
    }

    routingControl = L.Routing.control({
      waypoints: [
        L.latLng(start[0], start[1]),
        L.latLng(end[0], end[1])
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: true, // Show turn-by-turn directions pane
      lineOptions: {
        styles: [{ color: '#10b981', weight: 6, opacity: 0.85 }] // Emerald green line
      },
      createMarker: function() { return null; } // Don't show default blue route markers
    }).addTo(mapObj);

    showToast('Route Loaded', 'Directions loaded on map!', 'success');
  } catch (err) {
    console.error("Routing error:", err);
    showToast('Error', 'Failed to generate route.', 'error');
  }
}

function clearActiveRoute() {
  if (routingControl && mapObj) {
    mapObj.removeControl(routingControl);
    routingControl = null;
  }
}
