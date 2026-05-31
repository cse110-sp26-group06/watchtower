import { renderNavbar } from '../../components/navbar.js';
import { requireAuth } from '../../utils/auth.js';
import { getCurrentProject } from '../../utils/projects.js';
import { showToast } from '../../utils/toast.js';

const session = requireAuth();
if (session) { renderNavbar('settings'); }

const content = document.getElementById('settings-content');
const emptyState = document.getElementById('settings-empty');
const projectName = document.getElementById('settings-project-name');
const apiKeyInput = document.getElementById('project-api-key');
const installCommand = document.getElementById('sdk-install-command');
const copyInstallButton = document.getElementById('copy-install-btn');
const copyApiKeyButton = document.getElementById('copy-api-key-btn');

/**
 * Copies text to the clipboard and gives short button feedback.
 * @param {string} value - Text to copy.
 * @param {HTMLButtonElement} button - Button that triggered the copy.
 * @returns {Promise<void>}
 */
async function copyText(value, button) {
  if (!value) {
    showToast('Nothing to copy.', true);
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    const originalText = button.textContent;
    button.textContent = 'Copied';
    button.disabled = true;
    showToast('Copied to clipboard.');

    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 1600);
  } catch (error) {
    console.error('Failed to copy text:', error);
    showToast('Failed to copy.', true);
  }
}

/**
 * Renders the selected project's SDK installation details and API key.
 * @returns {void}
 */
function renderSettings() {
  const project = getCurrentProject();

  if (!project?.apiKey) {
    content.hidden = true;
    emptyState.hidden = false;
    projectName.textContent = '';
    return;
  }

  projectName.textContent = project.name;
  apiKeyInput.value = project.apiKey;
  content.hidden = false;
  emptyState.hidden = true;
}

copyInstallButton?.addEventListener('click', () => {
  copyText(installCommand.textContent, copyInstallButton);
});

copyApiKeyButton?.addEventListener('click', () => {
  copyText(apiKeyInput.value, copyApiKeyButton);
});

renderSettings();
