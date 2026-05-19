import { requireAuth } from '../../utils/auth.js';
import {
  addStoredProject,
  getNextProjectName,
  getStoredProjects,
  isProjectNameUnique,
  normalizeProjectName,
} from '../../utils/projects.js';
import { showToast } from '../../utils/toast.js';

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

function showState(stateToShow) {
  [createState, loadingState, readyState].forEach((state) => {
    state.classList.add('onboarding-state--hidden');
  });

  stateToShow.classList.remove('onboarding-state--hidden');
}

function setProjectNameError(message = '') {
  projectNameError.textContent = message;
}

function setProjectFormStatus(message = '') {
  projectFormStatus.textContent = message;
}

async function generateProject(projectName) {
  try {
    const response = await fetch('https://watchtower-backend.group6.workers.dev/api/key_generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: projectName })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate API key: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status !== 'ok') {
      throw new Error('API returned non-ok status');
    }

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
