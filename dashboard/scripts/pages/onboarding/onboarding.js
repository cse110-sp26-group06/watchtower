/**
 * Logic for the onboarding page. Handles project name validation, 
 * communicating with the backend to generate API keys, and managing the UI states 
 * (create, loading, ready).
 */

import { requireAuth } from '../../utils/auth.js';
import {
  addStoredProject,
  getNextProjectName,
  getStoredProjects,
  isProjectNameUnique,
  normalizeProjectName,
} from '../../utils/projects.js';
import { showToast } from '../../utils/toast.js';

const API_BASE_URL = 'https://watchtower-backend.group6.workers.dev/api';
const USER_ID_STORAGE_KEY = 'watchtower:user_id';
const USER_EMAIL_STORAGE_KEY = 'watchtower:user_email';
const API_KEY_STORAGE_KEY = 'watchtower:api_key';

const session = requireAuth();

if (session) {
  const userEmailDisplay = document.getElementById('user-email-display');
  if (userEmailDisplay) {
    userEmailDisplay.textContent = `Logged in as ${session.email}`;
  }
}

const createState = document.getElementById('create-state');
const loadingState = document.getElementById('loading-state');
const readyState = document.getElementById('ready-state');
const projectForm = document.getElementById('project-form');
const projectNameInput = document.getElementById('project-name-input');
const projectNameError = document.getElementById('project-name-error');
const projectFormStatus = document.getElementById('project-form-status');
const apiKeyInput = document.getElementById('api-key-input');
const snippetApiKey = document.getElementById('snippet-api-key');
const copyBtn = document.getElementById('copy-btn');
const continueBtn = document.getElementById('continue-btn');

/**
 * Toggles visibility among the onboarding view states.
 * @param {HTMLElement} stateToShow - The state container to display.
 * @returns {void}
 */
function showState(stateToShow) {
  [createState, loadingState, readyState].forEach((state) => {
    state.classList.add('onboarding-state--hidden');
  });

  stateToShow.classList.remove('onboarding-state--hidden');
}

/**
 * Sets or clears the error message for the project name input.
 * @param {string} [message=''] - The error message to display.
 * @returns {void}
 */
function setProjectNameError(message = '') {
  projectNameError.textContent = message;
}

/**
 * Sets or clears the status message for the project creation form.
 * @param {string} [message=''] - The status message to display.
 * @returns {void}
 */
function setProjectFormStatus(message = '') {
  projectFormStatus.textContent = message;
}

/**
 * Returns a persisted backend user id when it belongs to the active dashboard email.
 * @param {string} email - Active session email.
 * @returns {string | null}
 */
function getStoredUserId(email) {
  const userId = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  const userEmail = window.localStorage.getItem(USER_EMAIL_STORAGE_KEY);

  if (!userId) {return null;}
  if (userEmail && userEmail !== email) {return null;}

  return userId;
}

/**
 * Creates a backend user for the active dashboard email and stores its id locally.
 * @param {string} email - Active session email.
 * @returns {Promise<string>}
 */
async function createBackendUser(email) {
  const response = await fetch(`${API_BASE_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    throw new Error(`Failed to create backend user: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.status !== 'ok' || !data.user_id) {
    throw new Error('User API returned an invalid response');
  }

  window.localStorage.setItem(USER_ID_STORAGE_KEY, data.user_id);
  window.localStorage.setItem(USER_EMAIL_STORAGE_KEY, data.email ?? email);

  return data.user_id;
}

/**
 * Gets the backend user id required for project API key generation.
 * @returns {Promise<string>}
 */
async function getOrCreateBackendUserId() {
  if (!session?.email) {
    throw new Error('Login session is missing an email address.');
  }

  return getStoredUserId(session.email) ?? await createBackendUser(session.email);
}

/**
 * Makes an API request to generate a new API key for the project,
 * stores the result locally, and updates the UI to show the setup snippet.
 * @param {string} projectName - The valid name of the new project.
 * @returns {Promise<void>}
 */
async function generateProject(projectName) {
  try {
    const userId = await getOrCreateBackendUserId();
    const response = await fetch(`${API_BASE_URL}/key_generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: projectName, user_id: userId })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate API key: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'ok') {
      throw new Error('API returned non-ok status');
    }

    window.localStorage.setItem(API_KEY_STORAGE_KEY, data.api_key);

    addStoredProject({
      id: data.project_id,
      name: projectName,
      apiKey: data.api_key,
      createdAt: new Date().toISOString()
    });

    apiKeyInput.value = data.api_key;
    snippetApiKey.textContent = data.api_key;
    showState(readyState);
  } catch (error) {
    console.error('Error generating project:', error);
    showState(createState);
    setProjectFormStatus(error.message);
    showToast(error.message, true);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  projectNameInput.value = getNextProjectName(getStoredProjects());
  projectNameInput.focus();
});

projectForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const projects = getStoredProjects();
  const projectName = normalizeProjectName(projectNameInput.value);

  setProjectNameError();
  setProjectFormStatus();

  if (!projectName) {
    setProjectNameError('Project name is required.');
    projectNameInput.focus();
    return;
  }

  if (!isProjectNameUnique(projectName, projects)) {
    setProjectNameError('Project name must be unique.');
    projectNameInput.focus();
    return;
  }

  showState(loadingState);
  await generateProject(projectName);
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(apiKeyInput.value);
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    copyBtn.classList.add('is-copied');

    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.classList.remove('is-copied');
    }, 2000);
  } catch (error) {
    console.error('Failed to copy text:', error);
    showToast('Failed to copy API key.', true);
  }
});

continueBtn.addEventListener('click', () => {
  window.location.assign('projects.html');
});
