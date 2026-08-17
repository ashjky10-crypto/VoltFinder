/**
 * Component: Booking Modal Controller
 * Manages the step-by-step validated booking form with dynamic time-slot scheduler grid.
 */

import { getSavedProfile } from './profileModal.js';

const AVAILABLE_SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
  '18:00 - 20:00',
  '20:00 - 22:00'
];

export function initBookingModal(apiBase, showToast, onSuccessCallback) {
  const modal = document.getElementById('booking-modal');
  const closeBtn = document.getElementById('booking-modal-close-btn');
  const overlay = document.getElementById('booking-modal-overlay');
  const form = document.getElementById('booking-form');
  const cancelBtn = document.getElementById('booking-cancel-btn');
  
  const dateInput = document.getElementById('booking-date');
  const slotsGrid = document.getElementById('time-slots-grid');
  const selectedSlotInput = document.getElementById('selected-time-slot');

  // Input Field Elements
  const usernameInput = document.getElementById('booking-username');
  const phoneInput = document.getElementById('booking-phone');
  const emailInput = document.getElementById('booking-email');
  const vehicleModelInput = document.getElementById('booking-vehicle-model');
  const vehicleNumberInput = document.getElementById('booking-vehicle-number');
  
  // Set minimum date to today (cannot book in the past)
  const today = new Date().toISOString().split('T')[0];
  dateInput.min = today;

  // Listeners for closing modal
  const closeModal = () => {
    modal.classList.remove('active');
    form.reset();
    clearErrors();
    selectedSlotInput.value = '';
    slotsGrid.innerHTML = `<div class="slots-info-text">Please select a date to view available time slots.</div>`;
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  // Date selection change event -> load dynamic slot grids
  dateInput.addEventListener('change', async () => {
    const date = dateInput.value;
    const stationId = document.getElementById('booking-station-id').value;
    const chargerId = document.getElementById('booking-charger-id').value;
    const editBookingId = document.getElementById('edit-booking-id').value;

    if (!date || !stationId || !chargerId) return;

    try {
      slotsGrid.innerHTML = `<div class="slots-info-text"><i class="fa-solid fa-spinner fa-spin"></i> Checking availability...</div>`;
      selectedSlotInput.value = ''; // reset selection
      
      // Fetch booked slots for this charger and date
      const response = await fetch(`${apiBase}/bookings/check/availability?stationId=${stationId}&chargerId=${chargerId}&date=${date}`);
      const result = await response.json();

      if (result.success) {
        let bookedSlots = result.bookedSlots || [];
        
        // If we are editing, we should allow the user to select their own already-booked slot
        if (editBookingId) {
          // Fetch current booking info to compare
          const currentBookingRes = await fetch(`${apiBase}/bookings/${editBookingId}`);
          const currentBooking = await currentBookingRes.json();
          if (currentBooking.success && currentBooking.data.booking_date === date) {
            // Remove current booking slot from blocked list
            bookedSlots = bookedSlots.filter(s => s !== currentBooking.data.time_slot);
          }
        }

        renderSlotsGrid(bookedSlots);
      } else {
        slotsGrid.innerHTML = `<div class="slots-info-text text-danger">Failed to retrieve availability. Please try again.</div>`;
      }
    } catch (err) {
      console.error(err);
      slotsGrid.innerHTML = `<div class="slots-info-text text-danger">Network Error check server connection.</div>`;
    }
  });

  // Render the Time Slot elements
  function renderSlotsGrid(bookedSlots) {
    slotsGrid.innerHTML = '';
    
    AVAILABLE_SLOTS.forEach(slot => {
      const isLocked = bookedSlots.includes(slot);
      const slotDiv = document.createElement('div');
      slotDiv.className = `slot-item ${isLocked ? 'locked' : ''}`;
      slotDiv.innerHTML = isLocked ? `${slot} <i class="fa-solid fa-lock" style="margin-left:4px;"></i>` : slot;
      
      if (!isLocked) {
        slotDiv.addEventListener('click', () => {
          // Clear active classes
          slotsGrid.querySelectorAll('.slot-item').forEach(s => s.classList.remove('selected'));
          // Set selection
          slotDiv.classList.add('selected');
          selectedSlotInput.value = slot;
          document.getElementById('slot-error').textContent = ''; // clear error
        });
      }
      slotsGrid.appendChild(slotDiv);
    });
  }

  // Form Submit Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    if (!validateForm()) return;

    const editBookingId = document.getElementById('edit-booking-id').value;
    const isEditMode = !!editBookingId;

    const payload = {
      stationId: document.getElementById('booking-station-id').value,
      chargerId: document.getElementById('booking-charger-id').value,
      userName: usernameInput.value.trim(),
      userEmail: emailInput.value.trim(),
      userPhone: phoneInput.value.trim(),
      vehicleModel: vehicleModelInput.value.trim(),
      vehicleNumber: vehicleNumberInput.value.trim(),
      date: dateInput.value,
      timeSlot: selectedSlotInput.value
    };

    try {
      let response;
      if (isEditMode) {
        // Send PUT request to update
        response = await fetch(`${apiBase}/bookings/${editBookingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Send POST request to create
        response = await fetch(`${apiBase}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const result = await response.json();

      if (response.ok && result.success) {
        closeModal();
        onSuccessCallback(result.data, isEditMode ? 'updated' : 'created');
      } else {
        showToast('Error', result.message || 'Operation failed.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error', 'Failed to communicate with server.', 'error');
    }
  });

  // Client Side validation
  function validateForm() {
    let isValid = true;

    if (!dateInput.value) {
      setError('date-error', 'Please choose a charging date.');
      isValid = false;
    }

    if (!selectedSlotInput.value) {
      setError('slot-error', 'Please select an available time slot.');
      isValid = false;
    }

    if (!usernameInput.value.trim()) {
      setError('username-error', 'Driver full name is required.');
      isValid = false;
    }

    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError('email-error', 'Email address is required.');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setError('email-error', 'Please enter a valid email format.');
      isValid = false;
    }

    const phone = phoneInput.value.trim();
    const phoneRegex = /^[0-9]{10}$/;
    if (!phone) {
      setError('phone-error', 'Phone number is required.');
      isValid = false;
    } else if (!phoneRegex.test(phone)) {
      setError('phone-error', 'Phone number must be a valid 10-digit number.');
      isValid = false;
    }

    if (!vehicleModelInput.value.trim()) {
      setError('vehicle-model-error', 'EV vehicle model is required.');
      isValid = false;
    }

    if (!vehicleNumberInput.value.trim()) {
      setError('vehicle-number-error', 'License plate registration is required.');
      isValid = false;
    }

    return isValid;
  }

  function setError(elementId, msg) {
    document.getElementById(elementId).textContent = msg;
  }

  function clearErrors() {
    const errorFields = ['date-error', 'slot-error', 'username-error', 'email-error', 'phone-error', 'vehicle-model-error', 'vehicle-number-error'];
    errorFields.forEach(id => {
      document.getElementById(id).textContent = '';
    });
  }

  // Export Trigger Function to Open Modal from Outside
  return function openBookingModal(station, chargerId, chargerName, editBooking = null) {
    clearErrors();
    form.reset();
    
    document.getElementById('booking-station-id').value = station.id;
    document.getElementById('booking-charger-id').value = chargerId;
    document.getElementById('modal-station-name').textContent = station.name;
    document.getElementById('modal-charger-details').textContent = chargerName;

    const modalTitle = modal.querySelector('.modal-header h2');
    const submitBtn = document.getElementById('booking-submit-btn');

    if (editBooking) {
      // Edit Mode Setup
      document.getElementById('edit-booking-id').value = editBooking.id;
      modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Reschedule Booking`;
      submitBtn.textContent = 'Save Changes';

      // Load existing details
      dateInput.value = editBooking.booking_date;
      usernameInput.value = editBooking.user_name;
      phoneInput.value = editBooking.user_phone;
      emailInput.value = editBooking.user_email;
      vehicleModelInput.value = editBooking.vehicle_model;
      vehicleNumberInput.value = editBooking.vehicle_number;

      // Trigger date change programmatically to load slots with current slot prefilled
      dateInput.dispatchEvent(new Event('change'));
      // Note: pre-selecting the slot inside the grid will be handled async when the grid resolves,
      // but to be safe, we also set selectedSlotInput
      selectedSlotInput.value = editBooking.time_slot;
      
      // Delay grid select highlight until slots render
      setTimeout(() => {
        slotsGrid.querySelectorAll('.slot-item').forEach(div => {
          if (div.textContent.trim().startsWith(editBooking.time_slot)) {
            div.classList.add('selected');
          }
        });
      }, 500);

    } else {
      // Create Mode Setup
      document.getElementById('edit-booking-id').value = '';
      modalTitle.innerHTML = `<i class="fa-solid fa-calendar-plus"></i> Book a Charging Slot`;
      submitBtn.textContent = 'Confirm Booking';

      // Autofill fields using saved driver profile
      const savedProfile = getSavedProfile();
      if (savedProfile) {
        usernameInput.value = savedProfile.name || '';
        phoneInput.value = savedProfile.phone || '';
        emailInput.value = savedProfile.email || '';
        vehicleModelInput.value = savedProfile.vehicleModel || '';
        vehicleNumberInput.value = savedProfile.vehicleNumber || '';
      }
    }

    modal.classList.add('active');
  };
}
