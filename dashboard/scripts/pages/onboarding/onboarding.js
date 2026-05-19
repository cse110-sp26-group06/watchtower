import { requireAuth } from '../../utils/auth.js';

const session = requireAuth();

if (session) {
  const userEmailDisplay = document.getElementById('user-email-display');
  if (userEmailDisplay) {
    userEmailDisplay.textContent = `Logged in as ${session.email}`;
  }
}

const loadingState = document.getElementById('loading-state');
const readyState = document.getElementById('ready-state');
const apiKeyInput = document.getElementById('api-key-input');
const snippetApiKey = document.getElementById('snippet-api-key');
const copyBtn = document.getElementById('copy-btn');
const continueBtn = document.getElementById('continue-btn');

async function generateProject() {
  try {
    const response = await fetch('https://watchtower-backend.group6.workers.dev/api/key_generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Project 1' })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate API key: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status === 'ok') {
      const newProject = {
        id: data.project_id,
        name: 'Project 1',
        apiKey: data.api_key,
        createdAt: new Date().toISOString()
      };

      // Get existing projects or initialize empty array
      const rawProjects = window.localStorage.getItem('watchtower:projects');
      const projects = rawProjects ? JSON.parse(rawProjects) : [];
      
      projects.push(newProject);
      window.localStorage.setItem('watchtower:projects', JSON.stringify(projects));

      // Show the ready state
      loadingState.classList.add('onboarding-state--hidden');
      readyState.classList.remove('onboarding-state--hidden');

      // Populate UI with generated key
      apiKeyInput.value = data.api_key;
      snippetApiKey.textContent = data.api_key;
    } else {
      throw new Error('API returned non-ok status');
    }
  } catch (error) {
    console.error('Error generating project:', error);
    // Even if it fails, maybe let them go to the dashboard or show an error
    loadingState.innerHTML = `<h2>Error generating project</h2><p>${error.message}</p><button onclick="window.location.reload()" class="btn btn--outline">Try Again</button>`;
  }
}

// Automatically generate the project on load
window.addEventListener('DOMContentLoaded', () => {
  generateProject();
});

// Copy button functionality
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
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
});

// Continue to dashboard
continueBtn.addEventListener('click', () => {
  window.location.assign('projects.html');
});
