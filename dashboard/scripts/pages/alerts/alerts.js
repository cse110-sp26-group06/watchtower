import { renderNavbar } from '../../components/navbar.js';
import { getOrCreateBackendUserId } from '../../api/projects.js';
import { requireAuth } from '../../utils/auth.js';
import { getCurrentProject } from '../../utils/projects.js';
import { showToast } from '../../utils/toast.js';

const session = requireAuth();
if (session) {
  renderNavbar('alerts');
}

const toggle = document.getElementById('email-notifications-toggle');
const project = getCurrentProject();
const API_URL = 'https://watchtower-backend.group6.workers.dev/api/notifications/settings';

let userId = null;

function toEnabled(value) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

async function getUserId() {
  if (!userId) {
    userId = await getOrCreateBackendUserId(session?.email);
  }

  return userId;
}

/**
 * Fetches the current email notification status from the backend
 */
async function fetchNotificationStatus() {
  if (!session || !project) {
    return;
  }
  
  try {
    const backendUserId = await getUserId();
    const response = await fetch(`${API_URL}?user_id=${encodeURIComponent(backendUserId)}&project_id=${encodeURIComponent(project.id)}`);
    if (response.ok) {
      const data = await response.json();
      console.log('GET /api/notifications/settings response:', data);
      toggle.checked = toEnabled(data.email_enabled);
    } else {
      console.error('Failed to load notification settings:', response.status);
      showToast('Failed to load notification settings', true);
    }
  } catch (error) {
    console.error('Error fetching notification status:', error);
    showToast('Error loading settings', true);
  } finally {
    toggle.disabled = false;
  }
}

/**
 * Updates the email notification status in the backend
 * @param {boolean} enabled 
 */
async function updateNotificationStatus(enabled) {
  if (!session || !project) {
    return;
  }
  
  try {
    toggle.disabled = true;
    const backendUserId = await getUserId();
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: backendUserId,
        project_id: project.id,
        email_enabled: enabled,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('POST /api/notifications/settings response:', data);
      toggle.checked = toEnabled(data.email_enabled);
      showToast('Settings saved');
    } else {
      console.error('Failed to save notification settings:', response.status);
      toggle.checked = !enabled; // Revert on failure
      showToast('Failed to save notification settings', true);
    }
  } catch (error) {
    console.error('Error updating notification status:', error);
    toggle.checked = !enabled; // Revert on failure
    showToast('Error saving settings', true);
  } finally {
    toggle.disabled = false;
  }
}

if (toggle) {
  if (project) {
    fetchNotificationStatus();

    toggle.addEventListener('change', (e) => {
      updateNotificationStatus(e.target.checked);
    });
  } else {
    toggle.disabled = true;
    showToast('Please select a project first', true);
    console.warn('No project is selected. Toggle is disabled.');
  }
}
