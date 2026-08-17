/**
 * Component: Profile Modal Controller
 * Manages saving and loading driver profile settings to LocalStorage.
 */

const LOCAL_STORAGE_KEY = 'voltfinder_profile';

export function initProfileModal(showToast) {
  const modal = document.getElementById('profile-modal');
  const triggerBtn = document.getElementById('profile-trigger-btn');
  const closeBtn = document.getElementById('profile-modal-close-btn');
  const overlay = document.getElementById('profile-modal-overlay');
  const form = document.getElementById('profile-form');
  const clearBtn = document.getElementById('profile-clear-btn');
  const navNameSpan = document.getElementById('nav-profile-name');

  // Load saved profile data on startup
  const profile = getProfile();
  updateNavbarName(profile);

  // Event Listeners for opening/closing
  triggerBtn.addEventListener('click', () => {
    populateForm();
    modal.classList.add('active');
  });

  const closeModal = () => {
    modal.classList.remove('active');
  };

  closeBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', closeModal);

  // Form Submit (Save settings)
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const profileData = {
      name: document.getElementById('profile-name').value.trim(),
      email: document.getElementById('profile-email').value.trim(),
      phone: document.getElementById('profile-phone').value.trim(),
      vehicleModel: document.getElementById('profile-vehicle-model').value.trim(),
      vehicleNumber: document.getElementById('profile-vehicle-number').value.trim(),
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profileData));
    updateNavbarName(profileData);
    closeModal();
    
    showToast('Success', 'Driver profile saved successfully!', 'success');
  });

  // Clear settings
  clearBtn.addEventListener('click', () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    form.reset();
    updateNavbarName(null);
    closeModal();
    showToast('Info', 'Driver profile cleared.', 'info');
  });

  // Helper: Retrieve profile from local storage
  function getProfile() {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  // Helper: Pre-fill modal input fields from local storage
  function populateForm() {
    const saved = getProfile();
    if (saved) {
      document.getElementById('profile-name').value = saved.name || '';
      document.getElementById('profile-email').value = saved.email || '';
      document.getElementById('profile-phone').value = saved.phone || '';
      document.getElementById('profile-vehicle-model').value = saved.vehicleModel || '';
      document.getElementById('profile-vehicle-number').value = saved.vehicleNumber || '';
    } else {
      form.reset();
    }
  }

  // Helper: Update Navbar name button
  function updateNavbarName(profileData) {
    if (profileData && profileData.name) {
      const firstName = profileData.name.split(' ')[0];
      navNameSpan.textContent = `${firstName}'s Profile`;
    } else {
      navNameSpan.textContent = 'My EV Profile';
    }
  }
}

// Global accessor to retrieve profile for pre-filling booking forms
export function getSavedProfile() {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}
